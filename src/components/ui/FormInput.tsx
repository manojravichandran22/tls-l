'use client'

import { forwardRef } from 'react'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  touched?: boolean
  rightIcon?: React.ReactNode
  labelClassName?: string
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, touched, rightIcon, className = '', labelClassName = '', required, value, maxLength, ...props }, ref) => {
    const valLength = typeof value === 'string' ? value.length : typeof value === 'number' ? String(value).length : 0
    const isExceeded = Boolean(maxLength && valLength > maxLength)
    const displayError = error || (isExceeded && maxLength ? `Input cannot exceed ${maxLength} characters` : undefined)
    const showError = Boolean(displayError && touched !== false)

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <div className="flex items-center justify-between">
            <label className={`text-xs font-medium text-t-body ${labelClassName}`}>
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {maxLength && (
              <span className={`text-2xs select-none ${isExceeded ? 'text-red-500 font-bold' : valLength === maxLength ? 'text-amber-600 font-semibold' : 'text-t-lighter'}`}>
                {valLength}/{maxLength}
              </span>
            )}
          </div>
        )}
        <div className="relative">
          <input
            ref={ref}
            value={value}
            suppressHydrationWarning
            className={`w-full h-input-h px-2.5 text-sm2 font-inherit
              text-t-secondary bg-input
              border border-input-line rounded-input
              outline-none transition-colors
              focus:border-accent focus:ring-2 focus:ring-focus-ring/15
              disabled:opacity-50 disabled:cursor-not-allowed
              placeholder:text-t-lighter
              ${rightIcon ? 'pr-9' : ''}
              ${showError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}
              ${className}`}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
              {rightIcon}
            </span>
          )}
        </div>
        {showError && (
          <span className="text-xs text-red-500 mt-0.5">{displayError}</span>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
export default FormInput
