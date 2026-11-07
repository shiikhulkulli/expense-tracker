
import { lazy, Suspense, useMemo, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import type { ExpenseChartItem, YearlyChartItem } from '../types'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const DashboardCharts = lazy(
  () => import('../components/DashboardCharts')
)

type ReportPeriod = 'monthly' | 'yearly'

function Reports() {
  const { transactions } = useAppContext()

  const today = new Date()

  const [period, setPeriod] = useState<ReportPeriod>('monthly')
  const [selectedMonth, setSelectedMonth] = useState(
    `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}`
  )

  const [selectedYear, setSelectedYear] = useState(
    String(today.getFullYear())
  )

  const availableYears = useMemo(() => {
    const years = transactions.map((item) =>
      item.date.slice(0, 4)
    )

    return Array.from(
      new Set([...years, String(today.getFullYear())])
    ).sort((a, b) => Number(b) - Number(a))
  }, [transactions])

  const reportTransactions = transactions.filter((item) => {
    if (period === 'monthly') {
      return item.date.startsWith(selectedMonth)
    }

    return item.date.startsWith(selectedYear)
  })

  const totalIncome = reportTransactions
    .filter((item) => item.type === 'income')
    .reduce((total, item) => total + item.amount, 0)

  const totalExpenses = reportTransactions
    .filter((item) => item.type === 'expense')
    .reduce((total, item) => total + item.amount, 0)

  const netSavings = totalIncome - totalExpenses

  const savingsRate =
    totalIncome > 0
      ? (netSavings / totalIncome) * 100
      : 0

  const expenseChartData: ExpenseChartItem[] =
    reportTransactions
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

  const yearlyChartData: YearlyChartItem[] = Array.from(
    { length: 12 },
    (_, index) => {
      const month = String(index + 1).padStart(2, '0')
      const monthKey = `${period === 'monthly'
        ? selectedMonth.slice(0, 4)
        : selectedYear}-${month}`

      const monthTransactions = transactions.filter((item) =>
        item.date.startsWith(monthKey)
      )

      return {
        month: new Date(
          Number(monthKey.slice(0, 4)),
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

  const currency = (amount: number) =>
    `$${amount.toFixed(2)}`

  const exportPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    const reportLabel =
      period === 'monthly'
        ? new Date(`${selectedMonth}-02`).toLocaleString(
            'en-US',
            { month: 'long', year: 'numeric' }
          )
        : selectedYear

    // Centered report title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Financial Report', pageWidth / 2, 20, {
      align: 'center',
    })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Reporting Period: ${reportLabel}`, pageWidth / 2, 30, {
      align: 'center',
    })
    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-US')}`,
      pageWidth / 2,
      37,
      { align: 'center' }
    )

    // Centered Financial Summary heading
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Financial Summary', pageWidth / 2, 50, {
      align: 'center',
    })

    autoTable(doc, {
      startY: 55,
      head: [['Metric', 'Amount']],
      body: [
        ['Total Income', currency(totalIncome)],
        ['Total Expenses', currency(totalExpenses)],
        ['Net Savings', currency(netSavings)],
        ['Savings Rate', `${savingsRate.toFixed(1)}%`],
      ],
      theme: 'grid',
    })

    // Transaction details
    const finalY =
      (doc as jsPDF & {
        lastAutoTable: { finalY: number }
      }).lastAutoTable.finalY

    doc.setFontSize(14)
    doc.text('Transaction Details', pageWidth / 2, finalY + 15, {
  align: 'center',
})

    autoTable(doc, {
      startY: finalY + 20,
      head: [[
        'Date',
        'Description',
        'Category',
        'Type',
        'Amount',
      ]],
      body: reportTransactions.map((item) => [
        item.date,
        item.description || '-',
        item.category,
        item.type,
        currency(item.amount),
      ]),
      theme: 'striped',
      styles: {
        fontSize: 9,
      },
      headStyles: {
        fillColor: [47, 64, 64],
      },
    })

    // Save PDF
    const fileName =
      `financial-report-${period === 'monthly' ? selectedMonth : selectedYear}.pdf`

    doc.save(fileName)
  }

  const exportExcel = () => {
  const reportLabel =
    period === 'monthly'
      ? new Date(`${selectedMonth}-02`).toLocaleString('en-US', {
          month: 'long',
          year: 'numeric',
        })
      : selectedYear

  // Financial summary data
  const summaryData = [
    ['Financial Report'],
    ['Reporting Period', reportLabel],
    ['Generated', new Date().toLocaleDateString('en-US')],
    [],
    ['Metric', 'Amount'],
    ['Total Income', totalIncome],
    ['Total Expenses', totalExpenses],
    ['Net Savings', netSavings],
    ['Savings Rate', savingsRate / 100],
  ]

  // Transaction details
  const transactionData = [
    ['Date', 'Description', 'Category', 'Type', 'Amount'],
    ...reportTransactions.map((item) => [
      item.date,
      item.description || '-',
      item.category,
      item.type,
      item.amount,
    ]),
  ]

  // Create workbook and worksheets
  const workbook = XLSX.utils.book_new()

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  const transactionSheet = XLSX.utils.aoa_to_sheet(transactionData)

  // Set column widths
  summarySheet['!cols'] = [
    { wch: 24 },
    { wch: 20 },
  ]

  transactionSheet['!cols'] = [
    { wch: 14 },
    { wch: 30 },
    { wch: 20 },
    { wch: 12 },
    { wch: 14 },
  ]

  // Format summary amounts as currency
  ;['B6', 'B7', 'B8'].forEach((cell) => {
    if (summarySheet[cell]) {
      summarySheet[cell].z = '$#,##0.00'
    }
  })

  // Format savings rate as percentage
  if (summarySheet['B9']) {
    summarySheet['B9'].z = '0.0%'
  }

  // Format transaction amounts as currency
  for (let row = 2; row <= transactionData.length; row++) {
    const cell = `E${row}`

    if (transactionSheet[cell]) {
      transactionSheet[cell].z = '$#,##0.00'
    }
  }

  // Add filter to transaction table
  transactionSheet['!autofilter'] = {
    ref: `A1:E${transactionData.length}`,
  }

  // Add worksheets to workbook
  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    'Summary'
  )

  XLSX.utils.book_append_sheet(
    workbook,
    transactionSheet,
    'Transactions'
  )

  // Download Excel file
  const fileName =
    `financial-report-${period === 'monthly' ? selectedMonth : selectedYear}.xlsx`

  XLSX.writeFile(workbook, fileName)
}

  return (
    <div className="reports-page">
      <header className="dashboard-header">
  <div>
    <h1>Financial Reports</h1>
    <p>
      Understand your financial performance and spending habits.
    </p>
  </div>

  <div>
  <button type="button" onClick={exportPDF}>
    Export PDF
  </button>

  <button
    type="button"
    onClick={exportExcel}
    className="excel-export-button"
  >
    Export Excel
  </button>
</div>
</header>

      <section className="transactions-section">
        <div className="section-heading">
          <div>
            <h2>Reporting Period</h2>
            <p>Select the period you want to analyze.</p>
          </div>

          <select
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value as ReportPeriod)
            }
          >
            <option value="monthly">Monthly Report</option>
            <option value="yearly">Yearly Report</option>
          </select>
        </div>

        {period === 'monthly' ? (
          <label className="report-period-field">
            Select month
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(event.target.value)
              }
            />
          </label>
        ) : (
          <label className="report-period-field">
            Select year
            <select
              value={selectedYear}
              onChange={(event) =>
                setSelectedYear(event.target.value)
              }
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        )}
      </section>

      <section className="summary-grid">
        <article className="summary-card">
          <h2>Total Income</h2>
          <p className="amount income">
            {currency(totalIncome)}
          </p>
        </article>

        <article className="summary-card">
          <h2>Total Expenses</h2>
          <p className="amount expense">
            {currency(totalExpenses)}
          </p>
        </article>

        <article className="summary-card">
          <h2>Net Savings</h2>
          <p
            className={`amount ${
              netSavings < 0 ? 'expense' : 'income'
            }`}
          >
            {currency(netSavings)}
          </p>
        </article>

        <article className="summary-card">
          <h2>Savings Rate</h2>
          <p
            className={`amount ${
              savingsRate < 0 ? 'expense' : 'income'
            }`}
          >
            {savingsRate.toFixed(1)}%
          </p>
        </article>
      </section>

      {reportTransactions.length === 0 ? (
        <section className="transactions-section">
          <p className="empty-state">
            No transactions found for this reporting period.
            Add transactions to see your financial reports.
          </p>
        </section>
      ) : (
        <Suspense
          fallback={
            <p className="empty-state">Loading report charts...</p>
          }
        >
          <DashboardCharts
            expenseChartData={expenseChartData}
            yearlyChartData={yearlyChartData}
          />
        </Suspense>
      )}
    </div>
  )
}



export default Reports
