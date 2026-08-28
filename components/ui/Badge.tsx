import React from 'react'

interface BadgeProps {
  label?: string
  children?: React.ReactNode
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple'
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
  icon?: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  icon,
}) => {
  const dots = {
    success: 'bg-[var(--pos)]',
    warning: 'bg-[var(--muted)]',
    error: 'bg-[var(--neg)]',
    info: 'bg-[var(--blue)]',
    purple: 'bg-[var(--blue)]',
    neutral: 'bg-[var(--dim)]',
  }

  const sizes = {
    sm: 'px-2 py-[3px] text-[10.5px]',
    md: 'px-[9px] py-[3px] text-[11.5px]',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border border-[var(--line)] rounded-full bg-[var(--surface)] text-[var(--ink-soft)] whitespace-nowrap ${sizes[size]} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${dots[variant]}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0 [&>svg]:w-3 [&>svg]:h-3 text-[var(--muted)]">{icon}</span>}
      {children || label}
    </span>
  )
}
