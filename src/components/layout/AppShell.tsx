import type { ReactNode } from 'react'
import { Nav } from './Nav'
import { NavActionsProvider } from './NavActions'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <NavActionsProvider>
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Nav />
        <main className="flex-1 w-full mx-auto">
          {children}
        </main>
      </div>
    </NavActionsProvider>
  )
}
