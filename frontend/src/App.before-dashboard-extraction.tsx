import type {
  Category,
  ApiTransaction,
  Transaction,
} from './types'

import api from './api'
import './App.css'
import { useAppContext } from './context/AppContext'
import AppLayout from './components/layout/AppLayout'


import { lazy, Suspense, useEffect, useState } from 'react'
const DashboardCharts = lazy(
  () => import('./components/DashboardCharts')
)
import axios from 'axios'

// import {
//   Bar,
//   BarChart,
//   CartesianGrid,
//   Cell,
//   Legend,
//   Pie,
//   PieChart,
//   ResponsiveContainer,
//   Tooltip,
//   XAxis,
//   YAxis,
// } from 'recharts'
// import api from './api'
// import './App.css'



function App() {
  // const [isAuthenticated, setIsAuthenticated] = useState(false)
  // const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const {
  isAuthenticated,
  isCheckingSession,
  apiStatus,
  setApiStatus,
  categories,
  transactions,
  setCategories,
  setTransactions,
  login,
  logout,
} = useAppContext()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  // const [apiStatus, setApiStatus] = useState('Checking session...')

  // const [categories, setCategories] = useState<Category[]>([])
  // const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedMonth, setSelectedMonth] = useState(() => {
  const today = new Date()
  return `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, '0')}`
})
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransactionId, setEditingTransactionId] =
    useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense')
  const [categoryError, setCategoryError] = useState('')
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)


  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)



  const filteredCategories = categories.filter(
    (item) => item.type === type
  )


async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault()
  setLoginError('')
  setIsLoggingIn(true)

  try {
    const loggedInUsername = await login(username, password)

    setUsername(loggedInUsername)
    setPassword('')
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
  await logout()

  setIsFormOpen(false)
  setEditingTransactionId(null)
  setPassword('')
  setLoginError('')
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

  
function openCategoryForm(categoryToEdit?: Category) {
  setEditingCategoryId(categoryToEdit?.id ?? null)
  setCategoryName(categoryToEdit?.name ?? '')
  setCategoryType(categoryToEdit?.type ?? 'expense')
  setCategoryError('')
  setIsCategoryFormOpen(true)
}

async function handleCategorySubmit(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault()
  setCategoryError('')

  const name = categoryName.trim()

  if (!name) {
    setCategoryError('Enter a category name.')
    return
  }

  setIsSavingCategory(true)

  try {
    const payload = { name, type: categoryType }
    let saved: Category

    if (editingCategoryId !== null) {
      const response = await api.put<Category>(
        `categories/${editingCategoryId}/`,
        payload
      )
      saved = response.data

      setCategories((current) =>
        current.map((item) => item.id === saved.id ? saved : item)
      )

      setTransactions((current) =>
        current.map((item) =>
          item.categoryId === saved.id
            ? { ...item, category: saved.name }
            : item
        )
      )

      setApiStatus('Category updated successfully.')
    } else {
      const response = await api.post<Category>('categories/', payload)
      saved = response.data

      setCategories((current) =>
        [...current, saved].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      )

      setApiStatus('Category created successfully.')
    }

    setIsCategoryFormOpen(false)
    setEditingCategoryId(null)
    setCategoryName('')
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data
      const detail = data?.detail
      const nameError = data?.name
      const typeError = data?.type

      setCategoryError(
        typeof detail === 'string'
          ? detail
          : Array.isArray(nameError)
            ? nameError.join(' ')
            : typeof nameError === 'string'
              ? nameError
              : Array.isArray(typeError)
                ? typeError.join(' ')
                : typeof typeError === 'string'
                  ? typeError
                  : 'Could not save the category. Check your entries.'
      )
    } else {
      setCategoryError('An unexpected error occurred.')
    }
  } finally {
    setIsSavingCategory(false)
  }
}

async function handleCategoryDelete(categoryToDelete: Category) {
  const confirmed = window.confirm(
    `Delete the ${categoryToDelete.name} category?`
  )

  if (!confirmed) return

  setDeletingCategoryId(categoryToDelete.id)

  try {
    await api.delete(`categories/${categoryToDelete.id}/`)

    setCategories((current) =>
      current.filter((item) => item.id !== categoryToDelete.id)
    )

    setApiStatus('Category deleted successfully.')
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail

      setApiStatus(
        typeof detail === 'string'
          ? detail
          : 'Could not delete the category.'
      )
    } else {
      setApiStatus('Could not delete the category.')
    }
  } finally {
    setDeletingCategoryId(null)
  }
}


  const totalIncome = transactions
    .filter((item) => item.type === 'income')
    .reduce((total, item) => total + item.amount, 0)

  const totalExpenses = transactions
    .filter((item) => item.type === 'expense')
    .reduce((total, item) => total + item.amount, 0)

  const balance = totalIncome - totalExpenses
  
  const monthlyTransactions = transactions.filter((item) =>
    item.date.startsWith(selectedMonth),
  )

  const monthlyIncome = monthlyTransactions
    .filter((item) => item.type === 'income')
    .reduce((total, item) => total + item.amount, 0)

  const monthlyExpenses = monthlyTransactions
    .filter((item) => item.type === 'expense')
    .reduce((total, item) => total + item.amount, 0)

  const monthlyBalance = monthlyIncome - monthlyExpenses
  
const yearlyChartData = Array.from({ length: 12 }, (_, index) => {
  const month = String(index + 1).padStart(2, '0')
  const monthKey = `${selectedMonth.slice(0, 4)}-${month}`

  const monthTransactions = transactions.filter((item) =>
    item.date.startsWith(monthKey),
  )

  return {
    month: new Date(
      Number(selectedMonth.slice(0, 4)),
      index,
      1,
    ).toLocaleString('en-US', { month: 'short' }),
    income: monthTransactions
      .filter((item) => item.type === 'income')
      .reduce((total, item) => total + item.amount, 0),
    expenses: monthTransactions
      .filter((item) => item.type === 'expense')
      .reduce((total, item) => total + item.amount, 0),
  }
})

  const expenseChartData = monthlyTransactions
  .filter((item) => item.type === 'expense')
  .reduce<{ name: string; value: number }[]>((result, item) => {
    const existing = result.find(
      (category) => category.name === item.category,
    )

    if (existing) {
      existing.value += item.amount
    } else {
      result.push({
        name: item.category,
        value: item.amount,
      })
    }

    return result
  }, [])

  
const filteredTransactions = transactions.filter((item) => {
  const matchesSearch =
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())

  const matchesType =
    filterType === 'all' || item.type === filterType

  const matchesCategory =
    filterCategory === 'all' ||
    String(item.categoryId) === filterCategory

  const matchesStartDate =
    !startDate || item.date >= startDate

  const matchesEndDate =
    !endDate || item.date <= endDate

  return (
    matchesSearch &&
    matchesType &&
    matchesCategory &&
    matchesStartDate &&
    matchesEndDate
  )
})

const totalPages = Math.ceil(
  filteredTransactions.length / itemsPerPage,
)

const startIndex = (currentPage - 1) * itemsPerPage

const paginatedTransactions = filteredTransactions.slice(
  startIndex,
  startIndex + itemsPerPage,
)
useEffect(() => {
  setCurrentPage(1)
}, [searchTerm, filterType, filterCategory, startDate, endDate])

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
  <AppLayout onLogout={handleLogout}>
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

            {/* <button type="button" onClick={handleLogout}>
              Log Out
            </button> */}
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
        
<section className="transactions-section">
  <div className="section-heading">
    <div>
      <h2>Monthly Report</h2>
      <p>Review your income and expenses for a selected month.</p>
    </div>

    <label>
      Select month
      <input
        type="month"
        value={selectedMonth}
        onChange={(event) => setSelectedMonth(event.target.value)}
      />
    </label>
  </div>

  <div className="summary-grid">
    <article className="summary-card">
      <h2>Monthly Income</h2>
      <p className="amount income">
        ${monthlyIncome.toFixed(2)}
      </p>
    </article>

    <article className="summary-card">
      <h2>Monthly Expenses</h2>
      <p className="amount expense">
        ${monthlyExpenses.toFixed(2)}
      </p>
    </article>

    <article className="summary-card">
      <h2>Monthly Balance</h2>
      <p className={`amount ${monthlyBalance < 0 ? 'expense' : 'income'}`}>
        ${monthlyBalance.toFixed(2)}
      </p>
    </article>
  </div>


  <Suspense
    fallback={
      <p className="empty-state">Loading charts...</p>
    }
  >
    <DashboardCharts
      expenseChartData={expenseChartData}
      yearlyChartData={yearlyChartData}
    />
  </Suspense>

</section>


        
<section className="transactions-section">
  <div className="section-heading">
    <div>
      <h2>Category Management</h2>
      <p>Create and manage your income and expense categories.</p>
    </div>

    <button type="button" onClick={() => openCategoryForm()}>
      + Add Category
    </button>
  </div>

  {isCategoryFormOpen && (
    <form
      onSubmit={handleCategorySubmit}
      className="transaction-form"
    >
      <h3>
        {editingCategoryId !== null ? 'Edit Category' : 'New Category'}
      </h3>

      <label>
        Category name
        <input
          type="text"
          value={categoryName}
          onChange={(event) => setCategoryName(event.target.value)}
          placeholder="e.g. Groceries"
          maxLength={100}
          required
        />
      </label>

      <label>
        Category type
        <select
          value={categoryType}
          onChange={(event) =>
            setCategoryType(event.target.value as 'income' | 'expense')
          }
          required
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </label>

      {categoryError && <p role="alert">{categoryError}</p>}

      <div className="form-actions">
        <button type="submit" disabled={isSavingCategory}>
          {isSavingCategory
            ? 'Saving...'
            : editingCategoryId !== null
              ? 'Save Changes'
              : 'Create Category'}
        </button>

        <button
          type="button"
          className="cancel-button"
          onClick={() => {
            setIsCategoryFormOpen(false)
            setEditingCategoryId(null)
            setCategoryError('')
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )}

  {categories.length === 0 ? (
    <p className="empty-state">No categories yet. Create your first one.</p>
  ) : (
    <div className="transaction-list">
      {categories.map((item) => (
        <article className="transaction-item" key={item.id}>
          <div>
            <strong>{item.name}</strong>
            <p>{item.type === 'income' ? 'Income' : 'Expense'}</p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => openCategoryForm(item)}
            >
              Edit
            </button>

            <button
              type="button"
              className="cancel-button"
              disabled={deletingCategoryId === item.id}
              onClick={() => void handleCategoryDelete(item)}
            >
              {deletingCategoryId === item.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </article>
      ))}
    </div>
  )}
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

  <div className="transaction-filters">
    <label>
      Search
      <input
        type="search"
        placeholder="Search description or category..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />
    </label>

    <label>
      Transaction type
      <select
        value={filterType}
        onChange={(event) =>
          setFilterType(event.target.value as 'all' | 'income' | 'expense')
        }
      >
        <option value="all">All types</option>
        <option value="income">Income</option>
        <option value="expense">Expenses</option>
      </select>
    </label>

    <label>
      Category
      <select
        value={filterCategory}
        onChange={(event) => setFilterCategory(event.target.value)}
      >
        <option value="all">All categories</option>
        {categories.map((item) => (
          <option key={item.id} value={String(item.id)}>
            {item.name}
          </option>
        ))}
      </select>
    </label>

    <label>
      From date
      <input
        type="date"
        value={startDate}
        max={endDate || undefined}
        onChange={(event) => setStartDate(event.target.value)}
      />
    </label>

    <label>
      To date
      <input
        type="date"
        value={endDate}
        min={startDate || undefined}
        onChange={(event) => setEndDate(event.target.value)}
      />
    </label>

    <button
      type="button"
      className="cancel-button"
      onClick={() => {
        setSearchTerm('')
        setFilterType('all')
        setFilterCategory('all')
        setStartDate('')
        setEndDate('')
      }}
    >
      Clear Filters
    </button>
  </div>

  <p className="filter-results">
    Showing {filteredTransactions.length} of {transactions.length} transactions
  </p>

  {filteredTransactions.length === 0 ? (
    <p className="empty-state">
      No matching transactions. Try changing your search or filters.
    </p>
  ) : (
    <div className="transaction-list">
      {paginatedTransactions.map((item) => (
        <article className="transaction-item" key={item.id}>
          <div>
            <strong>{item.category}</strong>
            <p>
              {item.description || item.type} · {item.date}
            </p>
          </div>

          <div>
            <strong
              className={item.type === 'income' ? 'income' : 'expense'}
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

  
{filteredTransactions.length > 0 && (
  <div className="pagination-controls">
    <button
      type="button"
      className="cancel-button"
      onClick={() => setCurrentPage((page) => page - 1)}
      disabled={currentPage <= 1}
    >
      Previous
    </button>

    <span>
      Page {Math.min(currentPage, totalPages)} of {totalPages}
    </span>

    <button
      type="button"
      className="cancel-button"
      onClick={() => setCurrentPage((page) => page + 1)}
      disabled={currentPage >= totalPages}
    >
      Next
    </button>
  </div>
)}

</section>

      </main>
  </AppLayout>
  )
}

export default App
