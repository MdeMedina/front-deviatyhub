import React, { ReactNode } from 'react'

interface InputProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'search' | 'number'
  error?: string
  disabled?: boolean
  required?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  className?: string
  name?: string
  id?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  disabled = false,
  required = false,
  leftIcon,
  rightIcon,
  className = '',
  name,
  id,
}) => {
  const reactId = React.useId()
  const inputId = id || `input-${name || reactId}`
  const errorId = `${inputId}-error`

  const baseInputStyles = 'w-full px-4 py-2.5 bg-white border rounded-xl text-slate-700 transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed'
  
  const stateStyles = error 
    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' 
    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100 hover:border-slate-300'

  const iconPadding = `${leftIcon ? 'pl-11' : ''} ${rightIcon ? 'pr-11' : ''}`

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-1"
        >
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      
      <div className="relative group">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            {leftIcon}
          </div>
        )}
        
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`${baseInputStyles} ${stateStyles} ${iconPadding}`}
        />

        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p 
          id={errorId} 
          className="text-xs font-medium text-rose-500 ml-1 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          {error}
        </p>
      )}
    </div>
  )
}
