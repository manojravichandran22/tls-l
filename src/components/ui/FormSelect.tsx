'use client'

import { forwardRef } from 'react'

interface SelectOption {
  value: string | number
  label: string
}

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  touched?: boolean
  options: SelectOption[]
  placeholder?: string
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, touched, options, placeholder = 'Select', className = '', required, ...props }, ref) => {
    const showError = error && touched !== false
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-medium text-t-body">
            {label}
            {required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          suppressHydrationWarning
          className={`w-full h-input-h px-2.5 text-sm2 font-inherit cursor-pointer
            text-t-secondary bg-input
            border border-input-line rounded-input
            outline-none transition-colors
            focus:border-accent focus:ring-2 focus:ring-focus-ring/15
            disabled:opacity-50 disabled:cursor-not-allowed
            ${showError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}
            ${className}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {showError && (
          <span className="text-xs text-red-500 mt-0.5">{error}</span>
        )}
      </div>
    )
  }
)

FormSelect.displayName = 'FormSelect'
export default FormSelect
