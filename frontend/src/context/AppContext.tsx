
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'

import api from '../api'
import type {
  Category,
  ApiTransaction,
  Transaction,
} from '../types'

type AppContextType = {
  isAuthenticated: boolean
  isCheckingSession: boolean
  apiStatus: string
  setApiStatus: Dispatch<SetStateAction<string>>
  categories: Category[]
  transactions: Transaction[]
  setCategories: Dispatch<SetStateAction<Category[]>>
  setTransactions: Dispatch<SetStateAction<Transaction[]>>
  login: (username: string, password: string) => Promise<string>
  logout: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

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

type AppProviderProps = {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [apiStatus, setApiStatus] = useState('Checking session...')

  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

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

  async function login(
    username: string,
    password: string
  ): Promise<string> {
    await api.get('csrf/')

    const response = await api.post('login/', {
      username,
      password,
    })

    const data = await loadDashboardData()

    setCategories(data.categories)
    setTransactions(data.transactions)
    setIsAuthenticated(true)

    setApiStatus(
      `Connected! Found ${data.categories.length} categories.`
    )

    return response.data.username
  }

  async function logout() {
    try {
      await api.post('logout/')

      setIsAuthenticated(false)
      setCategories([])
      setTransactions([])
      setApiStatus('You have logged out.')
    } catch {
      setApiStatus('Logout failed. Please try again.')
    }
  }

  const value = useMemo(
    () => ({
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
    }),
    [
      isAuthenticated,
      isCheckingSession,
      apiStatus,
      categories,
      transactions,
    ]
  )

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error(
      'useAppContext must be used inside an AppProvider.'
    )
  }

  return context
}
