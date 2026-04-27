'use client'

interface BreadcrumbItem {
  label: string
  active?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="mb-1 flex items-center gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-xs text-t-lighter">&rsaquo;</span>}
          <span className={`text-xs ${item.active ? 'text-t-secondary font-medium' : 'text-t-lighter'}`}>
            {item.label}
          </span>
        </span>
      ))}
    </div>
  )
}
