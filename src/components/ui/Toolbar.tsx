'use client'

import { Download, Plus } from 'lucide-react'
import SearchInput from './SearchInput'

interface ToolbarProps {
  title?: string
  search?: string
  onSearchChange?: (val: string) => void
  searchPlaceholder?: string
  onAdd?: () => void
  addLabel?: string
  showExport?: boolean
  children?: React.ReactNode
}

export default function Toolbar({
  title, search, onSearchChange, searchPlaceholder = 'Search',
  onAdd, addLabel = 'Add New', showExport = true, children,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-table-line gap-2 flex-wrap">
      {title && (
        <span className="text-sm font-semibold text-t-secondary hidden sm:inline">{title}</span>
      )}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto justify-end">
        {children}
        {onSearchChange && (
          <SearchInput
            value={search ?? ''}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="w-full sm:w-auto"
          />
        )}
        {showExport && (
          <button className="h-8 px-2.5 sm:px-3 flex items-center gap-1.5 bg-card
            border border-input-line rounded-input cursor-pointer select-none
            text-sm2 text-t-body font-inherit hover:bg-table-head"
            suppressHydrationWarning
          >
            <Download size={13} /> <span className="hidden sm:inline">Export</span>
          </button>
        )}
        {onAdd && (
          <button
            onClick={onAdd}
            suppressHydrationWarning
            className="h-8 px-2.5 sm:px-3.5 flex items-center gap-1.5 bg-accent hover:bg-accent-hover
              border-none rounded-input cursor-pointer select-none text-sm2 text-white
              font-semibold font-inherit transition-colors"
          >
            <Plus size={13} /> <span className="hidden sm:inline">{addLabel}</span>
          </button>
        )}
      </div>
    </div>
  )
}
