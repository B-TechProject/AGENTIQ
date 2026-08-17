import { clsx } from 'clsx'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  glow?: boolean
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, glow, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-lg border border-border bg-card transition-all duration-250',
        glow && 'glow-teal',
        hover && 'cursor-pointer hover:border-border-2 hover:shadow-card',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
