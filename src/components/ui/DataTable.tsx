'use client'

import Pagination from './Pagination'
import { PER_PAGE } from '@/lib/constants'

interface Column<T> {
  key: string
  header: string
  render?: (row: T, index: number) => React.ReactNode
  className?: string
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
}

export default function DataTable<T>({
  columns, data, loading, emptyMessage = 'No records found',
  page = 1, totalPages = 1, totalCount = 0, perPage = PER_PAGE,
  onPageChange, onPerPageChange, countLabel = 'record',
}: DataTableProps<T>) {
  return (
    <div className="bg-card rounded-card shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden border border-header-line">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm2">
          <thead>
            <tr className="bg-table-head">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-3.5 py-2.5 text-left font-semibold text-xs
                    text-t-light border-b border-header-line
                    whitespace-nowrap ${col.className || ''}`}
                >
                  {col.header}
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
                  className={`border-b border-table-line
                    ${i % 2 === 0 ? 'bg-card' : 'bg-card-alt'}`}
                >
                  {columns.map(col => (
                    <td key={col.key} className={`px-3.5 py-cell-py ${col.className || ''}`}>
                      {col.render ? col.render(row, i) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
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
        <div className="px-4 py-2.5 border-t border-table-line">
          <span className="text-xs text-t-lighter">
            {totalCount} {countLabel}{totalCount !== 1 ? 's' : ''} found
          </span>
        </div>
      )}
    </div>
  )
}
