'use client'

import { useState } from 'react'
import { Eye, MoreVertical, Search, Link2, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import { formatDate } from '@/lib/formatDate'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import { usePermissions } from '@/hooks/usePermissions'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useExport } from '@/hooks/useExport'
import type { LinkOrder } from './types'

interface BranchOption { id: number; branch_name: string }

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'order_no', label: 'Order No.' },
  { key: 'colour', label: 'Colour' },
  { key: 'buyer', label: 'Buyer' },
  { key: 'ex_fac_date', label: 'Ex-Factory Date' },
  { key: 'branch_name', label: 'Branch' },
  { key: 'order_qty', label: 'Order Qty' },
  { key: 'prod_qty', label: 'Prod Qty' },
  { key: 'tot_prd_ord_qty', label: 'Total Qty' },
  { key: 'notes', label: 'Notes' },
  { key: 'status', label: 'Status' },
]

function formatExportHeadings(headings: string[]): string[] {
  const set = new Set<string>()
  headings.forEach((h) => {
    set.add(h)
    if (h === 'status') {
      set.add('status')
      set.add('is_active')
    }
  })
  return Array.from(set)
}

interface OrderLinkListProps {
  data: LinkOrder[]
  loading: boolean
  selectable?: boolean
  selected?: string[]
  onSelectionChange?: (selected: string[]) => void
  search: string
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  onSearchChange: (v: string) => void
  onLink: (row: LinkOrder) => void
  onView: (uuid: string) => void
  onDelete?: (row: LinkOrder) => void
  onPageChange: (p: number) => void
  onPerPageChange: (n: number) => void
  isAdmin?: boolean
  branches?: BranchOption[]
  branchFilter?: string
  onBranchFilterChange?: (v: string) => void
  effectiveBranchId?: string
}

export default function OrderLinkList({
  data, loading, search, page, perPage, totalPages, totalCount,
  onSearchChange, onLink, onView, onDelete, onPageChange, onPerPageChange, selectable = true,
  selected = [], onSelectionChange = () => { },
  isAdmin = false, branches = [], branchFilter = '', onBranchFilterChange = () => { }, effectiveBranchId = '',
}: OrderLinkListProps) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const [showExportMenu, setShowExportMenu] = useState(false)

  const { can } = usePermissions('Order')
  const canView = can('order.show')

  const [selectedHeadings, setSelectedHeadings] = useState<string[]>(
    HEADING_OPTIONS.map((h) => h.key)
  )

  const toggleHeading = (key: string) => {
    setSelectedHeadings((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const renderHeader = (key: string, label: string) => (
    <div
      className="inline-flex items-center gap-1.5 cursor-pointer select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={selectedHeadings.includes(key)}
        onChange={() => toggleHeading(key)}
        className="w-3.5 h-3.5 rounded accent-accent cursor-pointer"
        title={`Include ${label} in export`}
      />
      <span>{label}</span>
    </div>
  )

  // Export PDF & Excel for Unlinked Orders
  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/order/unlinkorderlist',
    payload: {
      search,
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'unlinked_orders',
  })

  const { handleExport: handleExportExcel, exporting: exportingExcel } = useExport<LinkOrder>({
    apiPath: '/order/unlinkorderlist',
    payload: {
      search,
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
      type: 'excel',
    },
    dataKey: 'records',
    columns: [
      { key: 'order_no', header: 'Order No.', value: r => r.order_no },
      { key: 'colour', header: 'Colour', value: r => r.colour ?? '' },
      { key: 'buyer', header: 'Buyer', value: r => r.buyer ?? r.style?.buyer ?? '' },
      { key: 'ex_fac_date', header: 'Ex-Factory Date', value: r => r.ex_fac_date ?? '' },
      { key: 'branch_name', header: 'Branch', value: r => r.branch_name ?? r.branch?.branch_name ?? '' },
      { key: 'order_qty', header: 'Order Qty', value: r => r.order_qty ?? '' },
      { key: 'prod_qty', header: 'Prod Qty', value: r => r.prod_qty ?? '' },
      { key: 'tot_prd_ord_qty', header: 'Total Qty', value: r => r.tot_prd_ord_qty ?? '' },
      { key: 'notes', header: 'Notes', value: r => r.notes ?? '' },
      { key: 'status', header: 'Status', value: r => r.style_id ? 'Linked' : 'Unlinked' },
    ],
    filename: 'unlinked_orders',
    method: 'GET',
  })

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow < 84 ? rect.top - 84 - 4 : rect.bottom + 4
    setMenuPos({ top, right: window.innerWidth - rect.right })
    setOpenMenuId(id)
  }

  const columns = [
    {
      key: 'order_no',
      header: renderHeader('order_no', 'Order No.'),
      sortable: true,
      sortValue: (row: LinkOrder) => row.order_no || '—',
      render: (row: LinkOrder) => (
        <span className="font-semibold text-t-primary text-xs">{row.order_no}</span>
      ),
    },
    {
      key: 'colour',
      header: renderHeader('colour', 'Colour'),
      sortable: true,
      sortValue: (row: LinkOrder) => row.colour || '—',
      render: (row: LinkOrder) => <span className="text-xs text-t-body">{row.colour || '—'}</span>,
    },
    {
      key: 'buyer',
      header: renderHeader('buyer', 'Buyer'),
      sortable: true,
      sortValue: (row: LinkOrder) => row.buyer || row.style?.buyer || '—',
      render: (row: LinkOrder) => (
        <span className="text-xs text-t-body">{row.buyer || row.style?.buyer || '—'}</span>
      ),
    },
    {
      key: 'style',
      header: 'Style',
      sortable: true,
      sortValue: (row: LinkOrder) => row.style?.style_name || '—',
      render: (row: LinkOrder) =>
        row.style ? (
          <div>
            <p className="text-xs font-semibold text-accent">{row.style.style_name}</p>
            <p className="text-2xs text-t-lighter mt-0.5">{row.style.buyer} · {row.style.style_no}</p>
          </div>
        ) : (
          <span className="text-xs text-t-lighter">—</span>
        ),
    },
    {
      key: 'notes',
      header: renderHeader('notes', 'Notes'),
      sortable: true,
      sortValue: (row: LinkOrder) => row.notes || '—',
      render: (row: LinkOrder) => (
        <span className="text-xs text-t-body max-w-[150px] truncate block" title={row.notes || ''}>
          {row.notes || '—'}
        </span>
      ),
    },
    {
      key: 'link_status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      sortValue: (row: LinkOrder) => row.style_id ? 'Linked' : 'Unlinked',
      render: (row: LinkOrder) => (
        <Badge variant={row.style_id ? 'success' : 'warning'}>
          {row.style_id ? 'Linked' : 'Unlinked'}
        </Badge>
      ),
    },
    {
      key: 'link_action',
      header: '',
      sortable: true,
      sortValue: (row: LinkOrder) => row.style_id ? 'Linked' : 'Unlinked',
      render: (row: LinkOrder) => (
        <Button variant="outline" size="sm" onClick={() => onLink(row)} leftIcon={<Link2 size={11} />}>Link</Button>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      sortValue: (row: LinkOrder) => row.created_at || '',
      render: (row: LinkOrder) => (
        <span className="text-2xs text-t-lighter">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: true,
      sortValue: (row: LinkOrder) => '',
      sticky: true,
      render: (row: LinkOrder) => (
        <button
          onClick={e => openMenu(e, row.id)}
          className="w-7 h-7 flex items-center justify-center rounded text-t-lighter hover:text-t-body hover:bg-card-alt transition-colors cursor-pointer"
        >
          <MoreVertical size={14} />
        </button>
      ),
    },
  ]

  return (
    <>
      <AdvancedTable<LinkOrder>
        header={
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-table-line gap-2 flex-wrap bg-card">
            <span className="text-sm font-semibold text-t-secondary hidden sm:inline">Unlinked Orders</span>
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t-lighter pointer-events-none" />
                <input
                  value={search}
                  onChange={e => onSearchChange(e.target.value)}
                  placeholder="Search orders..."
                  className="h-8 pl-8 pr-3 text-xs bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-secondary w-44"
                />
              </div>
              {/* Branch filter */}
              {isAdmin ? (
                <select
                  value={branchFilter}
                  onChange={e => onBranchFilterChange(e.target.value)}
                  className="h-8 px-2.5 text-xs bg-card border border-input-line rounded-input outline-none focus:border-accent text-t-body cursor-pointer"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
                  ))}
                </select>
              ) : effectiveBranchId ? (
                <div className="flex items-center gap-1.5 h-8 px-2.5 text-xs bg-card-alt border border-input-line rounded-input text-t-primary font-medium">
                  <span className="text-t-lighter">Branch:</span>
                  <span>{branches.find(b => String(b.id) === effectiveBranchId)?.branch_name ?? '—'}</span>
                </div>
              ) : null}

              {/* Export Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download size={13} />}
                  rightIcon={<ChevronDown size={12} />}
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={exportingExcel || exportingPdf}
                >
                  {exportingExcel || exportingPdf ? 'Exporting...' : 'Export'}
                </Button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-1 bg-card border border-table-line rounded-input shadow-lg z-[9999] min-w-[130px]">
                    <button
                      onClick={() => {
                        handleExportExcel({ check_box_heading: formatExportHeadings(selectedHeadings) })
                        setShowExportMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-t-secondary hover:bg-accent hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet size={13} /> Excel
                    </button>
                    <button
                      onClick={() => {
                        handleExportPdf({ check_box_heading: formatExportHeadings(selectedHeadings) })
                        setShowExportMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-t-secondary hover:bg-accent hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FileText size={13} /> PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        }
        columns={columns}
        rowKey={(row) => row.uuid}
        data={data}
        loading={loading}
        emptyMessage="No orders found"
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        countLabel="order"
        selectable={selectable}
        selected={selected}
        onSelectionChange={onSelectionChange}
      />

      {openMenuId !== null && (() => {
        const menuRow = data.find(d => d.id === openMenuId)
        return (
          <>
            <div className="fixed inset-0 z-[9990]" onClick={() => setOpenMenuId(null)} />
            <div
              className="fixed z-[9991] bg-modal border border-table-line rounded-card shadow-lg py-1 min-w-[130px]"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              {canView && (
                <button
                  onClick={() => { if (menuRow) onView(menuRow.uuid); setOpenMenuId(null) }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-t-body hover:bg-card-alt transition-colors cursor-pointer"
                >
                  <Eye size={12} /> View
                </button>
              )}
            </div>
          </>
        )
      })()}
    </>
  )
}

