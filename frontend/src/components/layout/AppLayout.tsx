import type { ReactNode } from 'react'
import Sidebar from './Sidebar'

type AppLayoutProps = {
  children: ReactNode
  onLogout: () => void
}

export default function AppLayout({
  children,
  onLogout,
}: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar onLogout={onLogout} />

      <div className="app-main">
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  )
}