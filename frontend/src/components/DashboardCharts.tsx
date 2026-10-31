
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ExpenseChartItem = {
  name: string
  value: number
}

type YearlyChartItem = {
  month: string
  income: number
  expenses: number
}

type DashboardChartsProps = {
  expenseChartData: ExpenseChartItem[]
  yearlyChartData: YearlyChartItem[]
}

function DashboardCharts({
  expenseChartData,
  yearlyChartData,
}: DashboardChartsProps) {
  return (
    <>
      <div className="chart-container">
        <h3>Expenses by Category</h3>

        {expenseChartData.length === 0 ? (
          <p className="empty-state">
            No expenses recorded for this month.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={3}
                label
              >
                {expenseChartData.map((entry) => (
                  <Cell key={entry.name} />
                ))}
              </Pie>

              <Tooltip
                formatter={(value) => `$${Number(value).toFixed(2)}`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="chart-container">
        <h3>Monthly Income vs. Expenses</h3>
        <p>
          Compare your income and spending throughout the selected year.
        </p>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={yearlyChartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />

            <Tooltip
              formatter={(value) => `$${Number(value).toFixed(2)}`}
            />

            <Legend />

            <Bar
              dataKey="income"
              name="Income"
              fill="#16a34a"
              radius={[4, 4, 0, 0]}
            />

            <Bar
              dataKey="expenses"
              name="Expenses"
              fill="#dc2626"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}

export default DashboardCharts
