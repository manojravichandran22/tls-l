'use client'

import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'link'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent hover:bg-accent-hover text-white font-semibold border-none',
  secondary: 'bg-secondary-btn hover:bg-secondary-btn-hover text-white font-semibold border-none',
  outline: 'bg-card border border-input-line text-t-body hover:bg-table-head',
  ghost: 'bg-transparent border-none text-t-body hover:bg-table-head',
  danger: 'bg-danger hover:bg-danger-hover text-white font-semibold border-none',
  success: 'bg-success-bg border-none text-success-text font-semibold hover:bg-success-hover',
  link: 'bg-transparent border-none text-t-secondary underline hover:text-accent p-0 h-auto',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-xs rounded gap-1',
  md: 'h-input-h px-btn-px text-sm rounded-input gap-1.5',
  lg: 'h-[38px] px-5 text-sm rounded-input gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        suppressHydrationWarning
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-inherit cursor-pointer transition-colors
          disabled:opacity-70 disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg className="w-3.5 h-3.5 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
