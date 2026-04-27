'use client'

import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({
  value, onChange, placeholder = 'Search', className = '',
}: SearchInputProps) {
  return (
    <div className={`relative cursor-default select-none ${className}`}>
      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t-lighter pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        suppressHydrationWarning
        className="h-8 w-full sm:w-40 pl-7 pr-8 text-sm2 font-inherit cursor-default
          text-t-secondary bg-table-head
          border border-header-line rounded-input
          outline-none transition-colors
          focus:cursor-text
          focus:border-accent focus:ring-2 focus:ring-accent/15
          placeholder:text-t-lighter"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none
            cursor-pointer select-none p-0 flex items-center text-t-lighter hover:text-t-light"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
