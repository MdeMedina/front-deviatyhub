import React from 'react'

interface BadgeProps {
  label?: string
  children?: React.ReactNode
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple'
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
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    error: 'bg-rose-50 text-rose-700 border-rose-100',
    info: 'bg-sky-50 text-sky-700 border-sky-100',
    neutral: 'bg-slate-50 text-slate-600 border-slate-100',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  }

  const dots = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
    purple: 'bg-indigo-500',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  }

  return (
    <span
      className={`inline-flex items-center font-bold border rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {dot && (
        <span
          className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dots[variant]}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="mr-1">{icon}</span>}
      {children || label}
    </span>
  )
}
