'use client'

import React, { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import Pagination from './Pagination'
import { PER_PAGE } from '@/lib/constants'

export type SortDirection = 'asc' | 'desc' | null

export interface SortState {
  key: string
  direction: SortDirection
}

interface Column<T> {
  key: string
  header: React.ReactNode
  render?: (row: T, index: number) => React.ReactNode
  className?: string
  sortable?: boolean
  rowSpan?: (row: T, index: number) => number | undefined
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  page?: number
  totalPages?: number
  totalCount?: number
  perPage?: number
  onPageChange?: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  countLabel?: string
  sortState?: SortState
  onSortChange?: (sort: SortState) => void
}

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === 'asc')
    return <ArrowUp size={12} className="inline-block ml-1 text-accent" />
  if (direction === 'desc')
    return <ArrowDown size={12} className="inline-block ml-1 text-accent" />
  return <ArrowUpDown size={12} className="inline-block ml-1 text-t-lighter opacity-50 group-hover:opacity-100 transition-opacity" />
}

export default function DataTable<T>({
  columns, data, loading, emptyMessage = 'No records found',
  page = 1, totalPages = 1, totalCount = 0, perPage = PER_PAGE,
  onPageChange, onPerPageChange, countLabel = 'record',
  sortState, onSortChange,
}: DataTableProps<T>) {

  const handleHeaderClick = (colKey: string) => {
    if (!onSortChange) return
    if (sortState?.key !== colKey) {
      onSortChange({ key: colKey, direction: 'asc' })
    } else if (sortState.direction === 'asc') {
      onSortChange({ key: colKey, direction: 'desc' })
    } else if (sortState.direction === 'desc') {
      onSortChange({ key: '', direction: null })
    } else {
      onSortChange({ key: colKey, direction: 'asc' })
    }
  }

  return (
    <div className="bg-card rounded-card shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden border border-header-line">
      {/* Table with Sticky Header */}
      <div className="overflow-x-auto max-h-[calc(100vh-220px)] overflow-y-auto relative">
        <table className="w-full border-collapse text-sm2">
          <thead className="sticky top-0 z-10 bg-table-head shadow-[0_1px_0_rgba(0,0,0,0.06)]">
            <tr className="bg-table-head">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleHeaderClick(col.key) : undefined}
                  className={`px-3.5 py-2.5 text-left font-semibold text-xs
                    text-t-light border-b border-header-line bg-table-head
                    whitespace-nowrap ${col.className || ''}
                    ${col.sortable ? 'cursor-pointer select-none group hover:text-t-body transition-colors' : ''}`}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {col.header}
                    {col.sortable && (
                      <SortIcon direction={sortState?.key === col.key ? sortState.direction : null} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-t-lighter text-sm">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-t-lighter text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-header-line/60 bg-card transition-colors hover:bg-card-alt/60"
                >
                  {columns.map(col => {
                    const span = col.rowSpan ? col.rowSpan(row, i) : undefined
                    if (span === 0) return null
                    return (
                      <td
                        key={col.key}
                        rowSpan={span && span > 1 ? span : undefined}
                        className={`px-3.5 py-cell-py ${span && span > 1 ? 'align-middle bg-card border-r border-header-line/40' : ''} ${col.className || ''}`}
                      >
                        {col.render ? col.render(row, i) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                      </td>
                    )
                  })}
                </tr>
              ))
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
        <div className="px-4 py-2.5 border-t border-header-line">
          <span className="text-xs text-t-lighter">
            {totalCount} {countLabel}{totalCount !== 1 ? 's' : ''} found
          </span>
        </div>
      )}
    </div>
  )
}
