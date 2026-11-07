
export type Category = {
  id: number
  name: string
  type: 'income' | 'expense'
}

export type ApiTransaction = {
  id: number
  type: 'income' | 'expense'
  amount: string | number
  category: number
  category_name: string
  description: string
  date: string
}

export type Transaction = {
  id: number
  type: 'income' | 'expense'
  amount: number
  categoryId: number
  category: string
  description: string
  date: string
}

export type ExpenseChartItem = {
  name: string
  value: number
}

export type YearlyChartItem = {
  month: string
  income: number
  expenses: number
}
