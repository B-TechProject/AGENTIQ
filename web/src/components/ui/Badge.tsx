import { clsx } from 'clsx'
import { ReactNode } from 'react'

type BadgeVariant = 'teal' | 'green' | 'orange' | 'red' | 'purple' | 'blue' | 'gray'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
  dot?: boolean
}

export function Badge({ variant = 'teal', children, className, dot }: BadgeProps) {
  return (
    <span className={clsx('badge', `badge-${variant}`, className)}>
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full inline-block', {
            'bg-teal pulse-dot':   variant === 'teal',
            'bg-green pulse-dot':  variant === 'green',
            'bg-orange':           variant === 'orange',
            'bg-red':              variant === 'red',
            'bg-purple':           variant === 'purple',
            'bg-blue':             variant === 'blue',
          })}
        />
      )}
      {children}
    </span>
  )
}
