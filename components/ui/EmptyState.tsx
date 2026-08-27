import React, { ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {icon && (
        <div className="mb-4 w-11 h-11 border border-[var(--line)] rounded-[7px] bg-[var(--head)] flex items-center justify-center text-[var(--ink)] [&>svg]:w-5 [&>svg]:h-5">
          {icon}
        </div>
      )}
      
      <h3 className="text-[14.5px] font-semibold text-[var(--ink)] mb-1 tracking-[-0.012em]">
        {title}
      </h3>
      
      {description && (
        <p className="text-[12.5px] text-[var(--muted)] max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <Button onClick={action.onClick} variant="primary" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}
