import { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral' | 'accent'

interface BadgeProps {
  variant?: Variant
  children: ReactNode
  size?: 'sm' | 'md'
  dot?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary-50 text-primary-700',
  secondary: 'bg-secondary-50 text-secondary-700',
  success: 'bg-accent-50 text-accent-700',
  warning: 'bg-warning-50 text-warning-700',
  error: 'bg-error-50 text-error-700',
  neutral: 'bg-neutral-100 text-neutral-600',
  accent: 'bg-accent-50 text-accent-700',
}

const dotColors: Record<Variant, string> = {
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
  success: 'bg-accent-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  neutral: 'bg-neutral-400',
  accent: 'bg-accent-500',
}

export function Badge({ variant = 'neutral', children, size = 'sm', dot = false }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'} ${variants[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  )
}
