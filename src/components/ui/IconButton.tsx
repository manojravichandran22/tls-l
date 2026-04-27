'use client'

type IconButtonVariant = 'default' | 'accent' | 'danger'

const variantClasses: Record<IconButtonVariant, string> = {
  default: 'text-t-lighter hover:text-t-light',
  accent: 'text-t-lighter hover:text-accent',
  danger: 'text-danger-light hover:text-danger',
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant
  children: React.ReactNode
}

export default function IconButton({ variant = 'accent', children, className = '', ...props }: IconButtonProps) {
  return (
    <button
      suppressHydrationWarning
      className={`bg-transparent border-none cursor-pointer p-1 flex items-center transition-colors select-none ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
