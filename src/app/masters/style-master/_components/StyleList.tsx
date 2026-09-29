'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Button from '@/components/ui/Button'
import Toolbar from '@/components/ui/Toolbar'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { sanitizeSearch } from '@/lib/utils'
import type { Style } from './types'
import { useExportPdf } from '@/hooks/useExportPdf'

interface Props {
  styles: Style[]
  loading: boolean
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  page: number
  totalPages: number
  totalCount: number
  perPage: number
  search: string
  buyerFilter: string
  statusFilter: string
  onSearchChange: (v: string) => void
  onBuyerChange: (v: string) => void
  onStatusChange: (v: string) => void
  onPageChange: (p: number) => void
  onPerPageChange: (n: number) => void
  onAdd: () => void
  onEdit: (s: Style) => void
  onDelete: (s: Style) => void
  onView: (uuid: string) => void
  onExport?: () => void
  exporting?: boolean
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]


export default function StyleList({
  styles, loading, page, perPage, totalPages, totalCount,
  search, buyerFilter, statusFilter, selected, onSelectionChange,
  onSearchChange, onBuyerChange, onStatusChange,
  onPageChange, onPerPageChange,
  onAdd, onEdit, onDelete, onView,
  onExport, exporting = false,
}: Props) {
  const [buyerInput, setBuyerInput] = useState(buyerFilter)

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/styles/list',
    payload: { search: search ?? '', status: statusFilter === 'all' ? '' : statusFilter },
    filename: 'styles',
  })

  const columns: AdvancedColumn<Style>[] = [
    {
      key: 'buyer',
      header: 'Buyer',
      sortable: true,
      sortValue: (row: Style) => row.buyer ?? '',
      render: (row: Style) => <span className="text-t-body font-medium">{row.buyer}</span>,
    },
    {
      key: 'style_no',
      header: 'Style No.',
      sortable: true,
      sortValue: (row: Style) => row.style_no ?? '',
      render: (row: Style) => <span className="text-xs text-t-body">{row.style_no || '—'}</span>,
    },
    {
      key: 'style_name',
      header: 'Style Name',
      sortable: true,
      sortValue: (row: Style) => row.style_name ?? '',
      render: (row: Style) => <span className="text-accent font-semibold">{row.style_name}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (row: Style) => row.status,
      render: (row: Style) => (
        <Badge variant={row.status === 1 ? 'success' : 'default'}>
          {row.status === 1 ? 'Active' : row.status === 2 ? 'Awaiting for Review' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  const getActions = (row: Style): ActionItem[] => [
    { label: 'View', icon: <Eye size={13} />, onClick: () => onView(row.uuid) },
    // { label: 'Edit', icon: <Pencil size={13} />, onClick: () => onEdit(row) },
    { label: 'Delete', icon: <Trash2 size={13} />, onClick: () => onDelete(row), variant: 'danger' },
  ]

  // Unique buyers for the buyer filter dropdown
  const buyers = Array.from(new Set(styles.map(s => s.buyer).filter(Boolean)))

  return (
    <AdvancedTable<Style>
      header={
        <Toolbar
          title="All Styles"
          search={search}
          onSearchChange={val => { onSearchChange(sanitizeSearch(val)); onPageChange(1) }}
          searchPlaceholder="Search styles..."
          onExport={onExport}
          onExportPdf={handleExportPdf}
          exporting={exporting || exportingPdf}
        >
          <select
            value={buyerFilter}
            onChange={e => { onBuyerChange(e.target.value); onPageChange(1) }}
            className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
          >
            <option value="">All Buyer</option>
            {buyers.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => { onStatusChange(e.target.value); onPageChange(1) }}
            className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Toolbar>
      }
      columns={columns}
      data={styles}
      loading={loading}
      emptyMessage="No styles found"
      rowKey={(row) => row.uuid}
      actions={getActions}
      page={page}
      perPage={perPage}
      totalPages={totalPages}
      totalCount={totalCount}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
      countLabel="style"
      countLabelPlural="styles"
      selectable
      selected={selected}
      onSelectionChange={onSelectionChange}
    />
  )
}
