import type { ReactNode } from 'react'
import { Nav } from './Nav'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Nav />
      <main className="flex-1 w-full mx-auto">
        {children}
      </main>
    </div>
  )
}
