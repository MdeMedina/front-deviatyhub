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
  inputSize?: 'md' | 'lg'
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
  inputSize = 'md',
}) => {
  const reactId = React.useId()
  const inputId = id || `input-${name || reactId}`
  const errorId = `${inputId}-error`

  const heightClass = inputSize === 'lg' ? 'h-10 text-[14px]' : 'h-9 text-[13.5px]'

  const baseInputStyles = `w-full px-3 bg-[var(--card)] border rounded-[7px] text-[var(--ink)] placeholder:text-[var(--dim)] transition-[border-color,box-shadow] duration-150 outline-none disabled:bg-[var(--surface)] disabled:text-[var(--dim)] disabled:cursor-not-allowed ${heightClass}`
  
  const stateStyles = error 
    ? 'border-[var(--neg)] focus:border-[var(--neg)] focus:ring-3 focus:ring-red-100 dark:focus:ring-red-950/40' 
    : 'border-[var(--line)] hover:border-[var(--dim)] focus:border-[var(--blue)] focus:ring-3 focus:ring-[var(--blue-tint)]'

  const iconPadding = `${leftIcon ? 'pl-9' : ''} ${rightIcon ? 'pr-9' : ''}`

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="microlabel flex items-center gap-1"
        >
          {label}
          {required && <span className="text-[var(--muted)]">*</span>}
        </label>
      )}
      
      <div className="relative group flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-[var(--dim)] group-focus-within:text-[var(--blue)] transition-colors pointer-events-none flex items-center [&>svg]:w-4 [&>svg]:h-4">
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
          <div className="absolute right-3 text-[var(--dim)] group-focus-within:text-[var(--blue)] transition-colors flex items-center [&>svg]:w-4 [&>svg]:h-4">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p 
          id={errorId} 
          className="text-xs font-medium text-[var(--neg)] mt-0.5"
        >
          {error}
        </p>
      )}
    </div>
  )
}
