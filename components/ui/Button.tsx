import React, { ReactNode } from 'react'
import { Spinner } from './Spinner'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
  className?: string
  icon?: ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  fullWidth = false,
  className = '',
  icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-[border-color,color,background-color,opacity] duration-150 rounded-[7px] cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-[var(--blue-tint)] focus-visible:border-[var(--blue)] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed select-none'
  
  const variants = {
    primary: 'bg-[var(--ink)] text-[var(--bg)] border border-[var(--ink)] hover:opacity-86',
    secondary: 'bg-[var(--card)] text-[var(--ink-soft)] border border-[var(--line)] hover:border-[var(--dim)] hover:text-[var(--ink)]',
    outline: 'bg-[var(--card)] text-[var(--ink-soft)] border border-[var(--line)] hover:border-[var(--dim)] hover:text-[var(--ink)]',
    danger: 'bg-transparent text-[var(--neg)] border border-[var(--line)] hover:border-[var(--neg)]',
    ghost: 'bg-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] border border-transparent',
  }

  const sizes = {
    sm: 'h-7 px-3 text-xs gap-1.5',
    md: 'h-8 px-3.5 text-[13px] gap-2',
    lg: 'h-10 px-5 text-sm gap-2.5',
  }

  const width = fullWidth ? 'w-full' : ''

  return (
    <button
      type={type}
      onClick={loading || disabled ? undefined : onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" className="text-current" />
          <span className="opacity-75">Procesando...</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>}
          {children}
        </>
      )}
    </button>
  )
}
