
import { useEffect, useState } from 'react'
import axios from 'axios'
import api from './api'
import './App.css'

type Category = {
  id: number
  name: string
  type: 'income' | 'expense'
}

type ApiTransaction = {
  id: number
  type: 'income' | 'expense'
  amount: string | number
  category: number
  category_name: string
  description: string
  date: string
}

type Transaction = {
  id: number
  type: 'income' | 'expense'
  amount: number
  categoryId: number
  category: string
  description: string
  date: string
}

async function loadDashboardData() {
  const [categoriesResponse, transactionsResponse] = await Promise.all([
    api.get<Category[]>('categories/'),
    api.get<ApiTransaction[]>('transactions/'),
  ])

  const transactions: Transaction[] = transactionsResponse.data.map(
    (item) => ({
      id: item.id,
      type: item.type,
      amount: Number(item.amount),
      categoryId: item.category,
      category: item.category_name,
      description: item.description,
      date: item.date,
    })
  )

  return {
    categories: categoriesResponse.data,
    transactions,
  }
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [apiStatus, setApiStatus] = useState('Checking session...')

  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransactionId, setEditingTransactionId] =
    useState<number | null>(null)
  const [formError, setFormError] = useState('')

  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  const filteredCategories = categories.filter(
    (item) => item.type === type
  )

  useEffect(() => {
    async function checkSession() {
      try {
        await api.get('csrf/')
        const data = await loadDashboardData()

        setCategories(data.categories)
        setTransactions(data.transactions)
        setIsAuthenticated(true)
        setApiStatus(
          `Connected! Found ${data.categories.length} categories.`
        )
      } catch {
        setIsAuthenticated(false)
        setApiStatus('Please log in to continue.')
      } finally {
        setIsCheckingSession(false)
      }
    }

    void checkSession()
  }, [])

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginError('')
    setIsLoggingIn(true)

    try {
      await api.get('csrf/')

      const response = await api.post('login/', {
        username,
        password,
      })

      const data = await loadDashboardData()

      setUsername(response.data.username)
      setPassword('')
      setCategories(data.categories)
      setTransactions(data.transactions)
      setIsAuthenticated(true)
      setApiStatus(
        `Connected! Found ${data.categories.length} categories.`
      )
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail

        setLoginError(
          typeof detail === 'string'
            ? detail
            : 'Login failed. Check your connection and try again.'
        )
      } else {
        setLoginError('An unexpected error occurred.')
      }
    } finally {
      setIsLoggingIn(false)
    }
  }

  async function handleLogout() {
    try {
      await api.post('logout/')

      setIsAuthenticated(false)
      setCategories([])
      setTransactions([])
      setIsFormOpen(false)
      setEditingTransactionId(null)
      setPassword('')
      setLoginError('')
      setApiStatus('You have logged out.')
    } catch {
      setApiStatus('Logout failed. Please try again.')
    }
  }

  function openCreateForm() {
    setEditingTransactionId(null)
    setType('expense')
    setAmount('')
    setCategory('')
    setDescription('')
    setDate(new Date().toISOString().slice(0, 10))
    setFormError('')
    setIsFormOpen(true)
  }

  function openEditForm(transaction: Transaction) {
    setEditingTransactionId(transaction.id)
    setType(transaction.type)
    setAmount(String(transaction.amount))
    setCategory(String(transaction.categoryId))
    setDescription(transaction.description)
    setDate(transaction.date)
    setFormError('')
    setIsFormOpen(true)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    if (!category) {
      setFormError('Please select a category.')
      return
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setFormError('Enter an amount greater than zero.')
      return
    }

    setIsSaving(true)

    const payload = {
      type,
      amount: Number(amount),
      category: Number(category),
      description,
      date,
    }

    try {
      let saved: ApiTransaction

      if (editingTransactionId !== null) {
        const response = await api.patch<ApiTransaction>(
          `transactions/${editingTransactionId}/`,
          payload
        )
        saved = response.data

        const updatedTransaction: Transaction = {
          id: saved.id,
          type: saved.type,
          amount: Number(saved.amount),
          categoryId: saved.category,
          category: saved.category_name,
          description: saved.description,
          date: saved.date,
        }

        setTransactions((current) =>
          current.map((item) =>
            item.id === updatedTransaction.id ? updatedTransaction : item
          )
        )

        setApiStatus('Transaction updated successfully.')
      } else {
        const response = await api.post<ApiTransaction>(
          'transactions/',
          payload
        )
        saved = response.data

        const newTransaction: Transaction = {
          id: saved.id,
          type: saved.type,
          amount: Number(saved.amount),
          categoryId: saved.category,
          category: saved.category_name,
          description: saved.description,
          date: saved.date,
        }

        setTransactions((current) => [newTransaction, ...current])
        setApiStatus('Transaction saved successfully.')
      }

      setAmount('')
      setCategory('')
      setDescription('')
      setEditingTransactionId(null)
      setIsFormOpen(false)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data
        const message =
          typeof data?.detail === 'string'
            ? data.detail
            : typeof data?.category === 'string'
              ? data.category
              : typeof data?.amount === 'string'
                ? data.amount
                : 'Could not save the transaction. Check your entries.'

        setFormError(message)
      } else {
        setFormError('An unexpected error occurred.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(transaction: Transaction) {
    const confirmed = window.confirm(
      `Permanently delete this ${transaction.type} transaction of $${transaction.amount.toFixed(2)}?`
    )

    if (!confirmed) return

    setDeletingId(transaction.id)

    try {
      await api.delete(`transactions/${transaction.id}/`)

      setTransactions((current) =>
        current.filter((item) => item.id !== transaction.id)
      )

      if (editingTransactionId === transaction.id) {
        setIsFormOpen(false)
        setEditingTransactionId(null)
      }

      setApiStatus('Transaction deleted successfully.')
    } catch {
      setApiStatus('Could not delete the transaction. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const totalIncome = transactions
    .filter((item) => item.type === 'income')
    .reduce((total, item) => total + item.amount, 0)

  const totalExpenses = transactions
    .filter((item) => item.type === 'expense')
    .reduce((total, item) => total + item.amount, 0)

  const balance = totalIncome - totalExpenses

  if (isCheckingSession) {
    return (
      <main className="dashboard">
        <p>{apiStatus}</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="dashboard">
        <section className="transactions-section">
          <h1>Expense Tracker</h1>
          <p>Log in to manage your income and expenses.</p>

          <form onSubmit={handleLogin} className="transaction-form">
            <label>
              Username
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            {loginError && <p role="alert">{loginError}</p>}

            <button type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="api-status">{apiStatus}</p>
        </section>
      </main>
    )
  }

  return (
    <>
      <p className="api-status">{apiStatus}</p>

      <main className="dashboard">
        <header className="dashboard-header">
          <div>
            <h1>Expense Tracker</h1>
            <p>Manage your income and expenses in one place.</p>
            {username && <p>Logged in as: {username}</p>}
          </div>

          <div>
            <button type="button" onClick={openCreateForm}>
              + Add Transaction
            </button>

            <button type="button" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </header>

        <section className="summary-grid">
          <article className="summary-card">
            <h2>Total Balance</h2>
            <p className="amount">${balance.toFixed(2)}</p>
          </article>

          <article className="summary-card">
            <h2>Total Income</h2>
            <p className="amount income">${totalIncome.toFixed(2)}</p>
          </article>

          <article className="summary-card">
            <h2>Total Expenses</h2>
            <p className="amount expense">${totalExpenses.toFixed(2)}</p>
          </article>
        </section>

        {isFormOpen && (
          <section className="transactions-section form-section">
            <h2>
              {editingTransactionId !== null
                ? 'Edit Transaction'
                : 'Add Transaction'}
            </h2>

            <form onSubmit={handleSubmit} className="transaction-form">
              <label>
                Transaction type
                <select
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value as 'income' | 'expense')
                    setCategory('')
                  }}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>

              <label>
                Amount ($)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="e.g. 50.00"
                  required
                />
              </label>

              <label>
                Category
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  required
                >
                  <option value="">Select a category</option>
                  {filteredCategories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              {filteredCategories.length === 0 && (
                <p>
                  No {type} categories found. Create one in Django admin
                  before adding this transaction.
                </p>
              )}

              <label>
                Description (optional)
                <input
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What was this transaction for?"
                />
              </label>

              <label>
                Date
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </label>

              {formError && <p role="alert">{formError}</p>}

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isSaving || filteredCategories.length === 0}
                >
                  {isSaving
                    ? 'Saving...'
                    : editingTransactionId !== null
                      ? 'Save Changes'
                      : 'Save Transaction'}
                </button>

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setIsFormOpen(false)
                    setEditingTransactionId(null)
                    setFormError('')
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="transactions-section">
          <h2>Recent Transactions</h2>

          {transactions.length === 0 ? (
            <p className="empty-state">
              No transactions yet. Add your first transaction.
            </p>
          ) : (
            <div className="transaction-list">
              {transactions.map((item) => (
                <article className="transaction-item" key={item.id}>
                  <div>
                    <strong>{item.category}</strong>
                    <p>
                      {item.description || item.type} · {item.date}
                    </p>
                  </div>

                  <div>
                    <strong
                      className={
                        item.type === 'income' ? 'income' : 'expense'
                      }
                    >
                      {item.type === 'income' ? '+' : '-'}$
                      {item.amount.toFixed(2)}
                    </strong>

                    <div className="transaction-actions">
                      <button
                        type="button"
                        onClick={() => openEditForm(item)}
                        disabled={deletingId !== null}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="cancel-button"
                        onClick={() => void handleDelete(item)}
                        disabled={deletingId !== null}
                      >
                        {deletingId === item.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}

export default App
