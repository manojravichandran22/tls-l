'use client'

import { forwardRef } from 'react'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  touched?: boolean
  rightIcon?: React.ReactNode
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, touched, rightIcon, className = '', required, ...props }, ref) => {
    const showError = error && touched !== false
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-medium text-t-body">
            {label}
            {required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
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
          <span className="text-xs text-red-500 mt-0.5">{error}</span>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
export default FormInput
