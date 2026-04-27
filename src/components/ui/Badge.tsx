'use client'

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'default'

const variants: Record<BadgeVariant, string> = {
  success: 'bg-success-bg text-success-text',
  error: 'bg-error-bg text-error-text',
  warning: 'bg-warning-bg text-warning-text',
  info: 'bg-info-badge-bg text-info-text',
  default: 'bg-default-badge-bg text-default-badge-text',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-xl text-xs2 font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
