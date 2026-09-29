'use client'

import { useState, useRef, useMemo } from 'react'
import { ArrowUpDown, MoreVertical } from 'lucide-react'
import Pagination from './Pagination'
import { PER_PAGE } from '@/lib/constants'

// ── Types ──
export interface AdvancedColumn<T> {
  key: string
  header: React.ReactNode
  sortable?: boolean
  sortValue?: (row: T) => string | number
  render: (row: T, index: number) => React.ReactNode
  className?: string
  headerClassName?: string
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
  header?: React.ReactNode
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
  countLabelPlural?: string
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  tealHeader?: boolean
  footer?: React.ReactNode
}

export default function AdvancedTable<T>({
  columns, data, loading, emptyMessage = 'No records found',
  header, footer,
  rowKey, selectable = false, selected = [], onSelectionChange,
  actions, page = 1, totalPages = 1, totalCount = 0, perPage = PER_PAGE,
  onPageChange, onPerPageChange, countLabel = 'record', countLabelPlural, onSort,
  tealHeader = false,
}: AdvancedTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
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

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    const col = columns.find(c => c.key === sortKey)
    return [...data].sort((a, b) => {
      const av = col?.sortValue ? col.sortValue(a) : ((a as Record<string, unknown>)[sortKey] ?? '')
      const bv = col?.sortValue ? col.sortValue(b) : ((b as Record<string, unknown>)[sortKey] ?? '')
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortKey, sortDir, columns])

  return (
    <div className="bg-card rounded-card shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden border border-header-line flex flex-col flex-1 min-h-0">
      {header}
      <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto">
        <table className="w-full border-collapse text-sm2">
          <thead className={`sticky top-0 z-20 shadow-[0_1px_0_rgba(0,0,0,0.05)] ${tealHeader ? 'bg-[#0d939d]' : 'bg-table-head'}`}>
            <tr className={tealHeader ? 'bg-[#0d939d]' : 'bg-table-head'}>
              {/* Checkbox header */}
              {selectable && (
                <th className={`px-3 py-2.5 border-b w-10 ${tealHeader ? 'border-[#0b828b]' : 'border-header-line'}`}>
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
                  className={`px-3.5 py-2.5 text-left text-xs whitespace-nowrap ${
                    tealHeader
                      ? 'font-bold text-white border-b border-[#0b828b]'
                      : 'font-semibold text-t-light border-b border-header-line'
                  } ${col.headerClassName ?? col.className ?? ''}`}
                >
                  {col.sortable ? (
                    <div
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 cursor-pointer select-none"
                    >
                      {col.header}
                      <ArrowUpDown size={12} className={tealHeader ? (sortKey === col.key ? 'text-white' : 'text-white/70') : (sortKey === col.key ? 'text-accent' : 'text-t-lighter')} />
                    </div>
                  ) : (
                    col.header
                  )}
                </th>
              ))}

              {/* Actions header */}
              {actions && (
                <th className={`px-3.5 py-2.5 border-b w-10 sticky right-0 z-30 text-left text-xs whitespace-nowrap shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] border-l border-header-line/60 ${
                  tealHeader
                    ? 'bg-[#0d939d] font-bold text-white border-[#0b828b]'
                    : 'bg-table-head font-semibold text-t-light border-header-line'
                }`}>Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={totalCols} className="p-8 text-center text-t-lighter text-sm">Loading...</td></tr>
            ) : sortedData.length === 0 ? (
              <tr><td colSpan={totalCols} className="p-8 text-center text-t-lighter text-sm">{emptyMessage}</td></tr>
            ) : (
              sortedData.map((row, i) => {
                const key = rowKey(row)
                const isChecked = selected.includes(key)
                return (
                  <tr
                    key={`${key}_${i}`}
                    className={`group border-b border-header-line/60 transition-colors hover:bg-card-alt/60
                      ${isChecked ? 'bg-accent/[0.04]' : 'bg-card'}`}
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
                      <td className={`px-3 py-cell-py sticky right-0 z-10 border-l border-header-line/60 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] transition-colors ${
                        isChecked ? 'bg-[#F0F8F9] dark:bg-[#1E293B]' : 'bg-card'
                      } group-hover:bg-card-alt`}>
                        <button
                          onClick={e => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const itemCount = actions(row).length
                            const menuH = itemCount * 36
                            const spaceBelow = window.innerHeight - rect.bottom
                            const top = spaceBelow < menuH + 4 ? rect.top - menuH - 4 : rect.bottom + 4
                            setMenuPos({ top, right: window.innerWidth - rect.right })
                            setOpenMenu(openMenu === key ? null : key)
                          }}
                          className="bg-transparent border-none cursor-pointer p-1 text-t-lighter hover:text-t-light flex select-none"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Fixed-position action dropdown — escapes overflow:hidden */}
      {openMenu !== null && actions && (() => {
        const row = sortedData.find(r => rowKey(r) === openMenu)
        if (!row) return null
        const items = actions(row)
        return (
          <>
            <div className="fixed inset-0 z-[9990]" onClick={() => setOpenMenu(null)} />
            <div
              ref={menuRef}
              className="fixed z-[9991] bg-modal border border-table-line rounded-card shadow-lg py-1 min-w-[130px]"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              {items.map((action, ai) => (
                <button
                  key={ai}
                  onClick={() => { action.onClick(); setOpenMenu(null) }}
                  className={`w-full px-3 py-2 bg-transparent border-none cursor-pointer flex items-center gap-2 text-xs font-inherit select-none
                    ${action.variant === 'danger'
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                      : 'text-t-body hover:bg-card-alt'}`}
                >
                  {action.icon} {action.label}
                </button>
              ))}
            </div>
          </>
        )
      })()}

      {/* Footer / Pagination */}
      {footer ? (
        footer
      ) : onPageChange ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          perPage={perPage}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
          countLabel={countLabel}
          countLabelPlural={countLabelPlural}
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
