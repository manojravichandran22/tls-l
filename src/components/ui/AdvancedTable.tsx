'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUpDown, MoreVertical } from 'lucide-react'
import Pagination from './Pagination'
import { PER_PAGE } from '@/lib/constants'

// ── Types ──
export interface AdvancedColumn<T> {
  key: string
  header: string
  sortable?: boolean
  render: (row: T, index: number) => React.ReactNode
  className?: string
}

export interface ActionItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
}

interface AdvancedTableProps<T> {
  columns: AdvancedColumn<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  rowKey: (row: T) => string
  selectable?: boolean
  selected?: string[]
  onSelectionChange?: (selected: string[]) => void
  actions?: (row: T) => ActionItem[]
  page?: number
  totalPages?: number
  totalCount?: number
  perPage?: number
  onPageChange?: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  countLabel?: string
  onSort?: (key: string, direction: 'asc' | 'desc') => void
}

export default function AdvancedTable<T>({
  columns, data, loading, emptyMessage = 'No records found',
  rowKey, selectable = false, selected = [], onSelectionChange,
  actions, page = 1, totalPages = 1, totalCount = 0, perPage = PER_PAGE,
  onPageChange, onPerPageChange, countLabel = 'record', onSort,
}: AdvancedTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const totalCols = (selectable ? 1 : 0) + columns.length + (actions ? 1 : 0)

  const allSelected = data.length > 0 && data.every(row => selected.includes(rowKey(row)))

  const toggleAll = () => {
    if (!onSelectionChange) return
    if (allSelected) onSelectionChange([])
    else onSelectionChange(data.map(row => rowKey(row)))
  }

  const toggleRow = (key: string) => {
    if (!onSelectionChange) return
    onSelectionChange(
      selected.includes(key) ? selected.filter(x => x !== key) : [...selected, key]
    )
  }

  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc'
    setSortKey(key)
    setSortDir(newDir)
    onSort?.(key, newDir)
  }

  // Close action menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="bg-card rounded-card shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden border border-header-line">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm2">
          <thead>
            <tr className="bg-table-head">
              {/* Checkbox header */}
              {selectable && (
                <th className="px-3 py-2.5 border-b border-header-line w-10">
                  <div
                    onClick={toggleAll}
                    className={`w-4 h-4 rounded-sm border-[1.5px] cursor-pointer select-none flex items-center justify-center
                      ${allSelected ? 'border-accent bg-accent' : 'border-input-line bg-white'}`}
                  >
                    {allSelected && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </th>
              )}

              {/* Column headers */}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-3.5 py-2.5 text-left font-semibold text-xs text-t-light border-b border-header-line whitespace-nowrap ${col.className ?? ''}`}
                >
                  {col.sortable ? (
                    <div
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 cursor-pointer select-none"
                    >
                      {col.header}
                      <ArrowUpDown size={12} className={sortKey === col.key ? 'text-accent' : 'text-t-lighter'} />
                    </div>
                  ) : (
                    col.header
                  )}
                </th>
              ))}

              {/* Actions header */}
              {actions && (
                <th className="px-3 py-2.5 border-b border-header-line w-10"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={totalCols} className="p-8 text-center text-t-lighter text-sm">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={totalCols} className="p-8 text-center text-t-lighter text-sm">{emptyMessage}</td></tr>
            ) : (
              data.map((row, i) => {
                const key = rowKey(row)
                const isChecked = selected.includes(key)
                return (
                  <tr
                    key={key}
                    className={`border-b border-table-line
                      ${isChecked ? 'bg-accent/[0.04]' : i % 2 === 0 ? 'bg-card' : 'bg-card-alt'}`}
                  >
                    {/* Checkbox */}
                    {selectable && (
                      <td className="px-3 py-cell-py">
                        <div
                          onClick={() => toggleRow(key)}
                          className={`w-4 h-4 rounded-sm border-[1.5px] cursor-pointer select-none flex items-center justify-center
                            ${isChecked ? 'border-accent bg-accent' : 'border-input-line bg-white'}`}
                        >
                          {isChecked && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3L3 5L7 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Data cells */}
                    {columns.map(col => (
                      <td key={col.key} className={`px-3.5 py-cell-py ${col.className ?? ''}`}>
                        {col.render(row, i)}
                      </td>
                    ))}

                    {/* Actions - 3 dot menu */}
                    {actions && (
                      <td className="px-3 py-cell-py relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === key ? null : key)}
                          className="bg-transparent border-none cursor-pointer p-1 text-t-lighter hover:text-t-light flex select-none"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenu === key && (
                          <div ref={menuRef} className="absolute right-4 top-full z-50 bg-card rounded-lg shadow-lg border border-header-line overflow-hidden min-w-[120px]">
                            {actions(row).map((action, ai) => (
                              <button
                                key={ai}
                                onClick={() => { action.onClick(); setOpenMenu(null) }}
                                className={`w-full px-3 py-2 bg-transparent border-none cursor-pointer flex items-center gap-2 text-sm font-inherit select-none
                                  ${action.variant === 'danger'
                                    ? 'text-danger hover:bg-error-bg'
                                    : 'text-t-body hover:bg-table-head'}`}
                              >
                                {action.icon} {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {onPageChange ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          perPage={perPage}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
          countLabel={countLabel}
        />
      ) : (
        <div className="px-4 py-2.5 border-t border-table-line">
          <span className="text-xs text-t-lighter">
            {totalCount} {countLabel}{totalCount !== 1 ? 's' : ''} found
          </span>
        </div>
      )}
    </div>
  )
}
