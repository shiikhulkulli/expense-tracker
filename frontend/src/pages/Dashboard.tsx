
import { lazy, Suspense, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import type { ExpenseChartItem, YearlyChartItem } from '../types'

const DashboardCharts = lazy(
  () => import('../components/DashboardCharts')
)

type DashboardProps = {
  username: string
  onAddTransaction: () => void
}

export default function Dashboard({
  username,
  onAddTransaction,
}: DashboardProps) {
  const { transactions } = useAppContext()

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date()

    return `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}`
  })

  const totalIncome = transactions
    .filter((item) => item.type === 'income')
    .reduce((total, item) => total + item.amount, 0)

  const totalExpenses = transactions
    .filter((item) => item.type === 'expense')
    .reduce((total, item) => total + item.amount, 0)

  const balance = totalIncome - totalExpenses

  const monthlyTransactions = transactions.filter((item) =>
    item.date.startsWith(selectedMonth)
  )

  const monthlyIncome = monthlyTransactions
    .filter((item) => item.type === 'income')
    .reduce((total, item) => total + item.amount, 0)

  const monthlyExpenses = monthlyTransactions
    .filter((item) => item.type === 'expense')
    .reduce((total, item) => total + item.amount, 0)

  const monthlyBalance = monthlyIncome - monthlyExpenses

  const yearlyChartData: YearlyChartItem[] = Array.from(
    { length: 12 },
    (_, index) => {
      const month = String(index + 1).padStart(2, '0')
      const monthKey = `${selectedMonth.slice(0, 4)}-${month}`

      const monthTransactions = transactions.filter((item) =>
        item.date.startsWith(monthKey)
      )

      return {
        month: new Date(
          Number(selectedMonth.slice(0, 4)),
          index,
          1
        ).toLocaleString('en-US', { month: 'short' }),

        income: monthTransactions
          .filter((item) => item.type === 'income')
          .reduce((total, item) => total + item.amount, 0),

        expenses: monthTransactions
          .filter((item) => item.type === 'expense')
          .reduce((total, item) => total + item.amount, 0),
      }
    }
  )

  const expenseChartData: ExpenseChartItem[] = monthlyTransactions
    .filter((item) => item.type === 'expense')
    .reduce<ExpenseChartItem[]>((result, item) => {
      const existing = result.find(
        (category) => category.name === item.category
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

  return (
    <>
      <>
        <header className="dashboard-header">
          <div>
            <h1>Expense Tracker</h1>
            <p>Manage your income and expenses in one place.</p>
            {username && <p>Logged in as: {username}</p>}
          </div>

          <div>
            <button type="button" onClick={onAddTransaction}>
              + Add Transaction
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
            <p className="amount income">
              ${totalIncome.toFixed(2)}
            </p>
          </article>

          <article className="summary-card">
            <h2>Total Expenses</h2>
            <p className="amount expense">
              ${totalExpenses.toFixed(2)}
            </p>
          </article>
        </section>

        <section className="transactions-section">
          <div className="section-heading">
            <div>
              <h2>Monthly Report</h2>
              <p>
                Review your income and expenses for a selected month.
              </p>
            </div>

            <label>
              Select month
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) =>
                  setSelectedMonth(event.target.value)
                }
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
              <p
                className={`amount ${
                  monthlyBalance < 0 ? 'expense' : 'income'
                }`}
              >
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
      </>
    </>
  )
}
