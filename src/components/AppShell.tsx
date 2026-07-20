import { ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import { BottomNav } from './BottomNav'
import { UserRole } from '../lib/api'

interface AppShellProps {
  role: UserRole
  title?: string
  subtitle?: string
  children: ReactNode
  headerRight?: ReactNode
  showNav?: boolean
  showHeader?: boolean
}

export function AppShell({ role, title, subtitle, children, headerRight, showNav = true, showHeader = true }: AppShellProps) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {showHeader && (
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-neutral-100">
          <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between">
            <div>
              {title && <h1 className="text-lg font-bold text-neutral-900 font-display">{title}</h1>}
              {subtitle && <p className="text-xs text-neutral-400">{subtitle}</p>}
            </div>
            {headerRight}
          </div>
        </header>
      )}
      <main className={`max-w-md mx-auto px-4 ${showNav ? 'pb-24' : 'pb-6'} pt-4`}>
        {children}
      </main>
      {showNav && <BottomNav role={role} />}
    </div>
  )
}
