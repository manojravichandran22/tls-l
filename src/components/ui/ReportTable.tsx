'use client'

import { useState, useMemo } from 'react'

export interface ReportColumn<T> {
  key: string
  header: React.ReactNode
  sortable?: boolean
  sortValue?: (row: T) => string | number
  render: (row: T, index: number) => React.ReactNode
  footer?: (data: T[]) => React.ReactNode
  className?: string
  rowSpan?: (row: T, index: number) => number | undefined
}


export interface ColumnGroup {
  label: React.ReactNode
  span: number
  className?: string
}

interface ReportTableProps<T> {
  columns: ReportColumn<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  header?: React.ReactNode
  rowKey: (row: T) => string
  totalCount?: number
  countLabel?: string
  countLabelPlural?: string
  showSummaryBar?: boolean
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  rowClassName?: (row: T, index: number) => string
  countSuffix?: React.ReactNode
  columnGroups?: ColumnGroup[]
  customFooter?: React.ReactNode
}

export default function ReportTable<T>({
  columns,
  data,
  loading,
  emptyMessage = 'No records found',
  header,
  rowKey,
  totalCount,
  countLabel = 'record',
  countLabelPlural,
  showSummaryBar,
  onSort,
  rowClassName,
  countSuffix,
  columnGroups,
  customFooter,
}: ReportTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const totalCols = columns.length

  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc'
    setSortKey(key)
    setSortDir(newDir)
    onSort?.(key, newDir)
  }

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    const col = columns.find((c) => c.key === sortKey)
    return [...data].sort((a, b) => {
      const av = col?.sortValue ? col.sortValue(a) : ((a as Record<string, unknown>)[sortKey] ?? '')
      const bv = col?.sortValue ? col.sortValue(b) : ((b as Record<string, unknown>)[sortKey] ?? '')
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortKey, sortDir, columns])

  const hasFooter = useMemo(() => columns.some((c) => c.footer !== undefined), [columns])

  const groupedHeaderStructure = useMemo(() => {
    if (!columnGroups || columnGroups.length === 0) return null

    let currentIndex = 0
    const topRowItems: Array<
      | { type: 'base'; column: ReportColumn<T> }
      | { type: 'group'; label: React.ReactNode; span: number; className?: string }
    > = []
    const subRowColumns: ReportColumn<T>[] = []

    for (let g = 0; g < columnGroups.length; g++) {
      const group = columnGroups[g]
      const span = group.span || 1
      const groupCols = columns.slice(currentIndex, currentIndex + span)
      currentIndex += span

      if (!group.label) {
        // Base / un-grouped columns: span 2 rows vertically
        for (const col of groupCols) {
          topRowItems.push({ type: 'base', column: col })
        }
      } else {
        // Grouped columns: row 1 gets group header, row 2 gets column headers
        topRowItems.push({
          type: 'group',
          label: group.label,
          span: groupCols.length,
          className: group.className,
        })
        for (const col of groupCols) {
          subRowColumns.push(col)
        }
      }
    }

    if (currentIndex < columns.length) {
      const remainingCols = columns.slice(currentIndex)
      for (const col of remainingCols) {
        topRowItems.push({ type: 'base', column: col })
      }
    }

    return { topRowItems, subRowColumns }
  }, [columns, columnGroups])

  const countText = totalCount !== undefined ? totalCount : data.length
  const labelText = countText === 1 ? countLabel : (countLabelPlural || `${countLabel}s`)

  const renderSummaryBar = showSummaryBar ?? false

  return (
    <div className="bg-card rounded-xl shadow-sm border border-header-line flex flex-col w-full flex-1 min-h-0 h-full">
      {/* Header rendered outside overflow-hidden so popovers (DateRangePicker) are not clipped */}
      {header && (
        <div className="relative z-30 shrink-0">
          {header}
        </div>
      )}

      {/* Scrollable Viewport (Both Vertical & Horizontal) */}
      <div className="overflow-auto flex-1 min-h-0">
        <table className="w-full border-separate border-spacing-0 text-sm2">
          {/* Dark Teal Table Header */}
          <thead className="sticky top-0 z-20 bg-[#0d939d] text-white">
            {groupedHeaderStructure ? (
              <>
                {/* Row 1: Base columns (rowSpan 2) + Category Group headers (colSpan) */}
                <tr className="bg-[#0d939d]">
                  {groupedHeaderStructure.topRowItems.map((item, idx) => {
                    if (item.type === 'base') {
                      const col = item.column
                      return (
                        <th
                          key={col.key}
                          rowSpan={2}
                          className={`bg-[#0d939d] px-3.5 py-2.5 text-left font-semibold text-xs text-white border-b border-r border-white/25 whitespace-nowrap align-middle ${col.className ?? ''}`}
                        >
                          {col.sortable ? (
                            <div
                              onClick={() => handleSort(col.key)}
                              className="cursor-pointer select-none hover:text-white/80 transition-colors"
                            >
                              {col.header}
                            </div>
                          ) : (
                            col.header
                          )}
                        </th>
                      )
                    } else {
                      return (
                        <th
                          key={`grp_${idx}`}
                          colSpan={item.span}
                          className={`bg-[#0d939d] px-3.5 py-2 text-center font-bold text-xs text-white border-b border-r border-white/25 tracking-wider whitespace-nowrap ${item.className ?? ''}`}
                        >
                          {item.label}
                        </th>
                      )
                    }
                  })}
                </tr>
                {/* Row 2: Sub-headers for columns under groups */}
                {groupedHeaderStructure.subRowColumns.length > 0 && (
                  <tr className="bg-[#0d939d]">
                    {groupedHeaderStructure.subRowColumns.map((col) => (
                      <th
                        key={col.key}
                        className={`bg-[#0d939d] px-3.5 py-2 text-center font-semibold text-xs text-white border-b border-r border-white/25 whitespace-nowrap ${col.className ?? ''}`}
                      >
                        {col.sortable ? (
                          <div
                            onClick={() => handleSort(col.key)}
                            className="cursor-pointer select-none hover:text-white/80 transition-colors"
                          >
                            {col.header}
                          </div>
                        ) : (
                          col.header
                        )}
                      </th>
                    ))}
                  </tr>
                )}
              </>
            ) : (
              <tr className="bg-[#0d939d]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`bg-[#0d939d] px-3.5 py-3 text-left font-semibold text-xs text-white border-b border-[#0b828b] whitespace-nowrap ${col.className ?? ''}`}
                  >
                    {col.sortable ? (
                      <div
                        onClick={() => handleSort(col.key)}
                        className="cursor-pointer select-none hover:text-white/80 transition-colors"
                      >
                        {col.header}
                      </div>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            )}
          </thead>

          {/* Table Body */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={totalCols} className="p-8 text-center text-t-lighter text-sm">
                  Loading report data...
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="p-8 text-center text-t-lighter text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, i) => {
                const key = rowKey(row)
                const customCls = rowClassName ? rowClassName(row, i) : ''
                const defaultBg = i % 2 === 0 ? 'bg-card' : 'bg-card-alt/30'
                return (
                  <tr
                    key={`${key}_${i}`}
                    className={`transition-colors ${customCls || `hover:bg-card-alt/80 ${defaultBg}`
                      }`}
                  >
                    {columns.map((col) => {
                      const span = col.rowSpan ? col.rowSpan(row, i) : undefined
                      if (span === 0) return null
                      return (
                        <td
                          key={col.key}
                          rowSpan={span && span > 1 ? span : undefined}
                          className={`px-3.5 py-cell-py border-b border-table-line border-r border-table-line/50 ${span && span > 1 ? 'align-middle' : ''} ${col.className ?? ''}`}
                        >
                          {col.render(row, i)}
                        </td>
                      )
                    })}

                  </tr>
                )
              })
            )}
          </tbody>

          {/* Summary / Total Footer Rows */}
          {(customFooter || (hasFooter && sortedData.length > 0)) && !loading && (
            <tfoot className="sticky bottom-0 z-20 bg-[#0d939d] text-white">
              {customFooter ? (
                customFooter
              ) : (
                <tr className="bg-[#0d939d]">
                  {columns.map((col) => (
                    <td
                      key={`footer_${col.key}`}
                      className={`bg-[#0d939d] px-3.5 py-3.5 text-xs font-bold text-white border-t-2 border-[#0b828b] whitespace-nowrap shadow-[0_-2px_4px_rgba(0,0,0,0.06)] ${col.className ?? ''}`}
                    >
                      {col.footer ? col.footer(sortedData) : null}
                    </td>
                  ))}
                </tr>
              )}
            </tfoot>
          )}
        </table>
      </div>

      {/* Total Records Bar — always visible */}
      <div className="px-4 py-2.5 border-t border-table-line bg-card flex items-center justify-between shrink-0">
        <span className="text-xs font-medium text-t-secondary">
          Total {labelText.charAt(0).toUpperCase() + labelText.slice(1)}: <span className="font-semibold text-t-primary">{countText}</span>
          {countSuffix && <span className="ml-1 font-normal text-t-secondary">{countSuffix}</span>}
        </span>
      </div>
    </div>
  )
}
