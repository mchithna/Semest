import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Nav } from './Nav'
import { NavActionsProvider } from './NavActions'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation()
  return (
    <NavActionsProvider>
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Nav />
        <main key={pathname} className="animate-page-enter flex-1 w-full mx-auto">
          {children}
        </main>
      </div>
    </NavActionsProvider>
  )
}
