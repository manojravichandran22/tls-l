'use client'

import { useState } from 'react'
import AdvancedTable, { type AdvancedColumn } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import Button from '@/components/ui/Button'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useExportPdf } from '@/hooks/useExportPdf'
import type { HistoryRecord, BranchOption } from './types'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'machine_type', label: 'Machine Name' },
  { key: 'machine_no', label: 'Machine No' },
  { key: 'brand', label: 'Brand' },
  { key: 'model_no', label: 'Model No' },
  { key: 'serial_no', label: 'Serial No' },
  { key: 'branch', label: 'Branch' },
  { key: 'last_service_date', label: 'Last Service Date' },
  { key: 'next_service_date', label: 'Next Service Date' },
  { key: 'notes', label: 'Notes' },
  { key: 'status', label: 'Status' },
]

function formatExportHeadings(headings: string[]): string[] {
  const set = new Set<string>()
  headings.forEach((h) => {
    set.add(h)
    if (h === 'branch') set.add('branch_name')
    if (h === 'machine_type') set.add('machine_type_name')
  })
  return Array.from(set)
}

interface Props {
  records: HistoryRecord[]
  branches?: BranchOption[]
  branchFilter?: string
  onBranchChange?: (val: string) => void
  dateFrom?: string
  dateTo?: string
  onDateRangeChange?: (start: string, end: string) => void
  loading: boolean
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  search: string
  onSearchChange: (val: string) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onExport?: (extraPayload?: Record<string, any>) => void
  exporting?: boolean
  onViewClick: (row: HistoryRecord) => void
  canList?: boolean
  canShow?: boolean
}

function formatDate(val: string | null | undefined): string {
  if (!val || val === '—' || val === '-') return '-'
  const str = String(val).trim().slice(0, 10)
  const parts = str.split(/[-/]/)
  if (parts.length === 3) {
    let [y, m, d] = parts
    if (y.length === 4) {
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
    } else if (d.length === 4) {
      return `${y.padStart(2, '0')}/${m.padStart(2, '0')}/${d}`
    }
  }
  return str
}

function StatusBadge({ status }: { status: number }) {
  if (status === 1)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Active</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Inactive</span>
}

export default function PreventiveMaintenanceHistoryList({
  records, branches, branchFilter, onBranchChange, dateFrom, dateTo, onDateRangeChange, loading, page, perPage, totalPages, totalCount,
  search, onSearchChange,
  onPageChange, onPerPageChange,
  onExport, exporting = false,
  onViewClick,
  canList = true,
  canShow = true,
}: Props) {
  const { branchId, isAdmin } = useBranchAccess()

  // Selected column headings state for export
  const [selectedHeadings, setSelectedHeadings] = useState<string[]>(
    HEADING_OPTIONS.map((h) => h.key)
  )

  const toggleHeading = (key: string) => {
    setSelectedHeadings((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const allHeadingsSelected = selectedHeadings.length === HEADING_OPTIONS.length
  const toggleAllHeadings = () => {
    setSelectedHeadings(allHeadingsSelected ? [] : HEADING_OPTIONS.map((h) => h.key))
  }

  const renderHeader = (key: string, label: string) => (
    <div
      className="inline-flex items-center gap-1.5 cursor-pointer"
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

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/history/list',
    payload: {
      search: search ?? '',
      date_from: dateFrom || '',
      date_to: dateTo || '',
      status: 'all',
      assigned_to: '',
      machine_id: '',
      check_uuid: [],
      branch_id: !isAdmin && branchId ? String(branchId) : (branchFilter || ''),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'Machine_History',
  })

  const columns: AdvancedColumn<HistoryRecord>[] = [
    {
      key: '#',
      header: (
        <div
          className="inline-flex items-center gap-1.5 cursor-pointer"
          title="Select all column headings for export"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={allHeadingsSelected}
            onChange={toggleAllHeadings}
            className="w-3.5 h-3.5 rounded accent-accent cursor-pointer"
          />
          <span>#</span>
        </div>
      ),
      render: (_: HistoryRecord, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'machine_type',
      header: renderHeader('machine_type', 'Machine Name'),
      sortable: true,
      sortValue: (row: HistoryRecord) => row.machineType?.type_name ?? '',
      render: (row: HistoryRecord) => (
        <span className="text-xs text-t-body">{row.machineType?.type_name ?? '-'}</span>
      ),
    },
    {
      key: 'machine_no',
      header: renderHeader('machine_no', 'Machine No'),
      sortable: true,
      sortValue: (row: HistoryRecord) => row.machine_no ?? row.machine?.machine_no ?? '',
      render: (row: HistoryRecord) => (
        <span className="text-xs text-t-body">{row.machine_no ?? row.machine?.machine_no ?? '-'}</span>
      ),
    },
    {
      key: 'brand',
      header: renderHeader('brand', 'Brand'),
      sortable: true,
      sortValue: (row: HistoryRecord) => row.machine?.brand ?? '',
      render: (row: HistoryRecord) => (
        <span className="text-xs text-t-body">{row.machine?.brand ?? '-'}</span>
      ),
    },
    {
      key: 'model_no',
      header: renderHeader('model_no', 'Model No'),
      sortable: true,
      sortValue: (row: HistoryRecord) => row.model_no ?? row.machine?.model_no ?? '',
      render: (row: HistoryRecord) => (
        <span className="text-xs text-t-body">{row.model_no ?? row.machine?.model_no ?? '-'}</span>
      ),
    },
    {
      key: 'serial_no',
      header: renderHeader('serial_no', 'Serial No'),
      sortable: true,
      sortValue: (row: HistoryRecord) => row.serial_no ?? row.machine?.serial_no ?? '',
      render: (row: HistoryRecord) => (
        <span className="text-xs text-t-body">{row.serial_no ?? row.machine?.serial_no ?? '-'}</span>
      ),
    },
    {
      key: 'branch',
      header: renderHeader('branch', 'Branch'),
      sortable: true,
      sortValue: (row: HistoryRecord) =>
        row.branch?.branch_name ?? row.branch_name ?? (row.branch as any)?.name ?? '',
      render: (row: HistoryRecord) => (
        <span className="text-xs text-t-body">
          {row.branch?.branch_name ?? row.branch_name ?? (row.branch as any)?.name ?? '-'}
        </span>
      ),
    },
    {
      key: 'last_service_date',
      header: renderHeader('last_service_date', 'Last Service Date'),
      sortable: true,
      sortValue: (row: HistoryRecord) => row.last_service_date ?? '',
      render: (row: HistoryRecord) => (
        <span className="text-xs text-t-body">{formatDate(row.last_service_date)}</span>
      ),
    },
    {
      key: 'next_service_date',
      header: renderHeader('next_service_date', 'Next Service Date'),
      sortable: true,
      sortValue: (row: HistoryRecord) => row.next_service_date ?? '',
      render: (row: HistoryRecord) => (
        <span className="text-xs text-t-body">{formatDate(row.next_service_date)}</span>
      ),
    },
    {
      key: 'notes',
      header: renderHeader('notes', 'Notes'),
      render: (row: HistoryRecord) => (
        <span className="text-xs text-t-body">{row.notes ?? '-'}</span>
      ),
    },
    {
      key: 'status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      sortValue: (row: HistoryRecord) => row.status,
      render: (row: HistoryRecord) => <StatusBadge status={row.status} />,
    },
    {
      key: 'action',
      header: 'Action',
      headerClassName: 'sticky right-0 bg-table-head z-30 border-l border-header-line/60 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]',
      className: 'sticky right-0 bg-card group-hover:bg-card-alt z-10 border-l border-header-line/60 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] whitespace-nowrap',
      render: (row: HistoryRecord) =>
        canShow ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onViewClick(row)}
          >
            View
          </Button>
        ) : null,
    },
  ]

  return (
    <AdvancedTable<HistoryRecord>
      header={
        <Toolbar
          title="Machine History"
          search={search}
          onSearchChange={val => { onSearchChange(val); onPageChange(1) }}
          searchPlaceholder="Search history..."
          onExport={onExport ? () => onExport({
            search: search ?? '',
            status: 'all',
            date_from: dateFrom || '',
            date_to: dateTo || '',
            branch_id: !isAdmin && branchId ? String(branchId) : (branchFilter || ''),
            check_box_heading: formatExportHeadings(selectedHeadings),
          }) : undefined}
          onExportPdf={() => handleExportPdf({ check_box_heading: formatExportHeadings(selectedHeadings) })}
          exporting={exporting || exportingPdf}
        >
          {branches && onBranchChange && (
            <select
              value={branchFilter ?? ''}
              onChange={e => { onBranchChange(e.target.value); onPageChange(1) }}
              disabled={!isAdmin}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isAdmin && <option value="">All Branches</option>}
              {branches.map(b => (
                <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
              ))}
            </select>
          )}

          {onDateRangeChange && (
            <div className="relative z-[100]">
              <DateRangePicker
                startDate={dateFrom ?? ''}
                endDate={dateTo ?? ''}
                onChange={(start, end) => {
                  onDateRangeChange(start, end)
                  onPageChange(1)
                }}
              />
            </div>
          )}
        </Toolbar>
      }
      columns={columns}
      data={records}
      loading={loading}
      emptyMessage="No history records found"
      rowKey={(row) => row.uuid}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      perPage={perPage}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
      countLabel="record"
      countLabelPlural="records"
    />
  )
}