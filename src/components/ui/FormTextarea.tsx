'use client'

import { forwardRef } from 'react'

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  touched?: boolean
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, touched, className = '', required, ...props }, ref) => {
    const showError = error && touched !== false
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-medium text-t-body">
            {label}
            {required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          suppressHydrationWarning
          className={`w-full px-2.5 py-2 text-sm2 font-inherit resize-none
            text-t-secondary bg-input
            border border-input-line rounded-input
            outline-none transition-colors
            focus:border-accent focus:ring-2 focus:ring-focus-ring/15
            disabled:opacity-50 disabled:cursor-not-allowed
            placeholder:text-t-lighter
            ${showError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}
            ${className}`}
          rows={3}
          {...props}
        />
        {showError && (
          <span className="text-xs text-red-500 mt-0.5">{error}</span>
        )}
      </div>
    )
  }
)

FormTextarea.displayName = 'FormTextarea'
export default FormTextarea
