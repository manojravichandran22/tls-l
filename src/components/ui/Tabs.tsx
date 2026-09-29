'use client'

type TabItem = string | { value: string; label: string }

interface TabsProps {
  tabs: TabItem[]
  active: string
  onChange: (value: string) => void
  size?: 'sm' | 'md'
  className?: string
}

export default function Tabs({ tabs, active, onChange, size = 'md', className = '' }: TabsProps) {
  const px = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'
  return (
    <div className={`flex border-b border-header-line ${className}`}>
      {tabs.map(tab => {
        const value = typeof tab === 'string' ? tab : tab.value
        const label = typeof tab === 'string' ? tab : tab.label
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`${px} font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer
              ${active === value
                ? 'text-accent border-b-accent'
                : 'text-t-light border-b-transparent hover:text-t-body'
              }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
