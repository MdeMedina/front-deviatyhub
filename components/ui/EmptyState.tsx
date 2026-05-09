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
    <div className={`flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500 ${className}`}>
      {icon && (
        <div className="mb-6 p-4 bg-slate-50 rounded-2xl text-slate-400">
          {icon}
        </div>
      )}
      
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  )
}
