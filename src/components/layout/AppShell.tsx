import { ReactNode } from 'react'
import { Nav } from './Nav'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#1e293b] flex flex-col font-sans">
      <Nav />
      <main className="flex-1 w-full mx-auto">
        {children}
      </main>
    </div>
  )
}
