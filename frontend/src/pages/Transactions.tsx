
import type { FormEvent } from 'react'
import type { Category, Transaction } from '../types'

type TransactionsProps = {
  transactions: Transaction[]
  categories: Category[]
  filteredCategories: Category[]

  isFormOpen: boolean
  editingTransactionId: number | null
  isSaving: boolean
  deletingId: number | null

  type: 'income' | 'expense'
  amount: string
  category: string
  description: string
  date: string
  formError: string

  searchTerm: string
  filterType: 'all' | 'income' | 'expense'
  filterCategory: string
  startDate: string
  endDate: string

  currentPage: number
  totalPages: number
  filteredTransactions: Transaction[]
  paginatedTransactions: Transaction[]

  onCreate: () => void
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCloseForm: () => void

  setType: (value: 'income' | 'expense') => void
  setAmount: (value: string) => void
  setCategory: (value: string) => void
  setDescription: (value: string) => void
  setDate: (value: string) => void

  setSearchTerm: (value: string) => void
  setFilterType: (value: 'all' | 'income' | 'expense') => void
  setFilterCategory: (value: string) => void
  setStartDate: (value: string) => void
  setEndDate: (value: string) => void

  setCurrentPage: (value: number | ((page: number) => number)) => void
}

export default function Transactions({
  transactions,
  categories,
  filteredCategories,
  isFormOpen,
  editingTransactionId,
  isSaving,
  deletingId,
  type,
  amount,
  category,
  description,
  date,
  formError,
  searchTerm,
  filterType,
  filterCategory,
  startDate,
  endDate,
  currentPage,
  totalPages,
  filteredTransactions,
  paginatedTransactions,
  onCreate,
  onEdit,
  onDelete,
  onSubmit,
  onCloseForm,
  setType,
  setAmount,
  setCategory,
  setDescription,
  setDate,
  setSearchTerm,
  setFilterType,
  setFilterCategory,
  setStartDate,
  setEndDate,
  setCurrentPage,
}: TransactionsProps) {
  function clearFilters() {
    setSearchTerm('')
    setFilterType('all')
    setFilterCategory('all')
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Transactions</h1>
          <p>Manage and track all your income and expenses.</p>
        </div>

        <button type="button" onClick={onCreate}>
          + Add Transaction
        </button>
      </header>

      {isFormOpen && (
        <section className="transactions-section form-section">
          <h2>
            {editingTransactionId !== null
              ? 'Edit Transaction'
              : 'Add Transaction'}
          </h2>

          <form onSubmit={onSubmit} className="transaction-form">
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

            {filteredCategories.length === 0 && (
              <p>No {type} categories found. Create a category first.</p>
            )}

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
                onClick={onCloseForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="transactions-section">
        <div className="section-heading">
          <div>
            <h2>All Transactions</h2>
            <p>Search, filter and manage your financial activity.</p>
          </div>
        </div>

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
                setFilterType(
                  event.target.value as 'all' | 'income' | 'expense'
                )
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
            onClick={clearFilters}
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
          <div className="transactions-table-wrapper">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedTransactions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.description || '—'}</td>
                    <td>{item.category}</td>
                    <td>
                      <span className={`transaction-type ${item.type}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className={item.type === 'income' ? 'income' : 'expense'}>
                      {item.type === 'income' ? '+' : '-'}$
                      {item.amount.toFixed(2)}
                    </td>
                    <td>
                      <div className="transaction-actions">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          disabled={deletingId !== null}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="cancel-button"
                          onClick={() => onDelete(item)}
                          disabled={deletingId !== null}
                        >
                          {deletingId === item.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  )
}
