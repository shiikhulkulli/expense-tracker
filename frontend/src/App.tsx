import type { Category, ApiTransaction, Transaction } from './types'

import api from './api'
import './App.css'
import { useAppContext } from './context/AppContext'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Reports from './pages/Reports'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'


function App() {
  const navigate = useNavigate()
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

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null)
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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const filteredCategories = categories.filter((item) => item.type === type)

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

  function closeTransactionForm() {
  setIsFormOpen(false)
  setEditingTransactionId(null)
  setFormError('')
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
      <main className="login-page">
        <section className="login-showcase">
          <div className="login-brand">
            <div className="login-brand-icon">$</div>
            <span>Expense Tracker</span>
          </div>

          <div className="login-showcase-content">
            <span className="login-eyebrow">PERSONAL FINANCE MANAGEMENT</span>

            <h1>
              Take control of
              <br />
              your <span>financial future.</span>
            </h1>

            <p>
              Track your income, manage expenses, and make
              smarter financial decisions — all in one place.
            </p>

            <div className="login-feature-list">
              <div className="login-feature">
                <span>✓</span>
                <p>Monitor your income and expenses</p>
              </div>

              <div className="login-feature">
                <span>✓</span>
                <p>Understand your spending habits</p>
              </div>

              <div className="login-feature">
                <span>✓</span>
                <p>Stay on top of your financial goals</p>
              </div>
            </div>
          </div>

          <div className="login-showcase-footer">
            Your money. Your decisions. Your future.
          </div>

          <div className="login-decoration login-decoration-one" />
          <div className="login-decoration login-decoration-two" />
        </section>

        <section className="login-form-section">
          <div className="login-card">
            <div className="login-mobile-brand">
              <div className="login-brand-icon">$</div>
              <span>Expense Tracker</span>
            </div>

            <div className="login-heading">
              <span>WELCOME BACK</span>
              <h2>Sign in to your account</h2>
              <p>Enter your credentials to continue.</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <label htmlFor="login-username">Username</label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                placeholder="Enter your username"
                required
              />

              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />

              {loginError && (
                <p className="login-error" role="alert">
                  {loginError}
                </p>
              )}

              <button type="submit" disabled={isLoggingIn}>
                {isLoggingIn ? 'Signing in...' : 'Sign In'}
                <span>→</span>
              </button>
            </form>

            <div className="login-security-note">
              <span>🔒</span>
              Your account is protected by secure authentication.
            </div>

            <p className="login-api-status">{apiStatus}</p>
          </div>
        </section>
      </main>
    )
  }


  return (
    <AppLayout onLogout={handleLogout}>
      <p className="api-status">{apiStatus}</p>

      <Routes>
        <Route
          path="/"
          element={
            <div className="dashboard">
              <Dashboard
                username={username}
                onAddTransaction={() => {
                  openCreateForm()
                  navigate('/transactions')
                }}
              />

            </div>
          }
        />

        <Route
          path="/transactions"
          element={
            <Transactions
              transactions={transactions}
              categories={categories}
              filteredCategories={filteredCategories}
              isFormOpen={isFormOpen}
              editingTransactionId={editingTransactionId}
              isSaving={isSaving}
              deletingId={deletingId}
              type={type}
              amount={amount}
              category={category}
              description={description}
              date={date}
              formError={formError}
              searchTerm={searchTerm}
              filterType={filterType}
              filterCategory={filterCategory}
              startDate={startDate}
              endDate={endDate}
              currentPage={currentPage}
              totalPages={totalPages}
              filteredTransactions={filteredTransactions}
              paginatedTransactions={paginatedTransactions}
              onCreate={openCreateForm}
              onEdit={openEditForm}
              onDelete={handleDelete}
              onSubmit={handleSubmit}
              onCloseForm={closeTransactionForm}
              setType={setType}
              setAmount={setAmount}
              setCategory={setCategory}
              setDescription={setDescription}
              setDate={setDate}
              setSearchTerm={setSearchTerm}
              setFilterType={setFilterType}
              setFilterCategory={setFilterCategory}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              setCurrentPage={setCurrentPage}
            />
          }
        />

        <Route
          path="/categories"
          element={
            <div className="dashboard">

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
            </div>
          }
        />

        <Route path="/reports" element={<Reports />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}

export default App
