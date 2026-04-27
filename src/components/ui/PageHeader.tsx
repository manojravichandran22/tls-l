'use client'

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-3 sm:mb-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h1 className="m-0 mb-0.5 text-md sm:text-lg font-bold text-t-primary">{title}</h1>
          {description && (
            <p className="m-0 text-2xs sm:text-xs text-t-lighter">{description}</p>
          )}
        </div>
        {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
      </div>
      <div className="mt-3 border-b border-header-line" />
    </div>
  )
}
