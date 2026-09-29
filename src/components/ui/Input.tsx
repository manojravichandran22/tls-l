'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-input-label"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-input-icon pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full h-11 rounded-lg border bg-white px-4 py-2.5 text-sm text-input-text placeholder:text-input-icon',
              'border-input-border-legacy focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10',
              'transition-colors duration-150',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-input-disabled-bg',
              error && 'border-danger focus:border-danger focus:ring-focus-error/10',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-input-icon">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs text-danger mt-0.5">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
