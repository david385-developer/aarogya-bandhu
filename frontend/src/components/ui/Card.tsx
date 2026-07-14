import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

export function Card({ children, padding = 'md', hover = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-neutral-100 shadow-card ${paddings[padding]} ${hover ? 'transition-all duration-200 hover:shadow-soft-lg hover:border-neutral-200' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
