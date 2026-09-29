'use client'

import { useState } from 'react'
import AdvancedTable, { type AdvancedColumn } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import Button from '@/components/ui/Button'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useExportPdf } from '@/hooks/useExportPdf'
import type { MachineHistory, BranchOption } from './types'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'machine_no', label: 'Machine No' },
  { key: 'brand', label: 'Brand' },
  { key: 'model_no', label: 'Model No' },
  { key: 'machine_type_name', label: 'Machine Type' },
  { key: 'serial_no', label: 'Serial No' },
  { key: 'last_oil_change', label: 'Last Oil Change' },
  { key: 'next_maintenance', label: 'Next Maintenance' },
  { key: 'rem_days', label: 'Days Left' },
  { key: 'branch_name', label: 'Branch' },
  { key: 'zone_name', label: 'Zone' },
  { key: 'line_name', label: 'Line' },
  { key: 'option_name', label: 'Condition' },
]

function formatExportHeadings(headings: string[]): string[] {
  return headings
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

interface Props {
  machines: MachineHistory[]
  branches: BranchOption[]
  loading: boolean
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  search: string
  branchFilter: string
  onSearchChange: (val: string) => void
  onBranchChange: (val: string) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onExport?: (extraPayload?: Record<string, any>) => void
  exporting?: boolean
  onMaintenanceClick: (row: MachineHistory) => void
  canList?: boolean
  canUpdate?: boolean
}

export default function PreventiveMaintenanceList({
  machines, branches, loading, page, perPage, totalPages, totalCount,
  search, branchFilter, onSearchChange, onBranchChange,
  onPageChange, onPerPageChange,
  onExport, exporting = false,
  onMaintenanceClick,
  canList = true,
  canUpdate = true,
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
    apiPath: '/history/historylist',
    payload: {
      search: search || 'all',
      status: 'all',
      machine_id: 'all',
      machine_type_id: 'all',
      branch_id: !isAdmin && branchId ? String(branchId) : (branchFilter || ''),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'Machine_Maintenance_Report',
  })

  const columns: AdvancedColumn<MachineHistory>[] = [
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
      render: (_: MachineHistory, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'machine_no',
      header: renderHeader('machine_no', 'Machine No'),
      sortable: true,
      sortValue: (row: MachineHistory) => row.machine_no,
      render: (row: MachineHistory) => (
        <span className="text-accent font-semibold">{row.machine_no}</span>
      ),
    },
    {
      key: 'brand',
      header: renderHeader('brand', 'Brand'),
      sortable: true,
      sortValue: (row: MachineHistory) => row.brand ?? '',
      render: (row: MachineHistory) => <span className="text-xs text-t-body">{row.brand}</span>,
    },
    {
      key: 'model_no',
      header: renderHeader('model_no', 'Model No'),
      sortable: true,
      sortValue: (row: MachineHistory) => row.model_no ?? '',
      render: (row: MachineHistory) => <span className="text-xs text-t-body">{row.model_no}</span>,
    },
    {
      key: 'machine_type_name',
      header: renderHeader('machine_type_name', 'Machine Type'),
      sortable: true,
      sortValue: (row: MachineHistory) => row.machine_type_name ?? '',
      render: (row: MachineHistory) => <span className="text-xs text-t-body">{row.machine_type_name}</span>,
    },
    {
      key: 'serial_no',
      header: renderHeader('serial_no', 'Serial No'),
      sortable: true,
      sortValue: (row: MachineHistory) => row.serial_no ?? '',
      render: (row: MachineHistory) => <span className="text-xs text-t-body">{row.serial_no}</span>,
    },
    {
      key: 'last_oil_change',
      header: renderHeader('last_oil_change', 'Last Service Date'),
      sortable: true,
      sortValue: (row: MachineHistory) => row.last_oil_change ?? '',
      render: (row: MachineHistory) => <span className="text-xs text-t-body">{formatDate(row.last_oil_change)}</span>,
    },
    {
      key: 'next_maintenance',
      header: renderHeader('next_maintenance', 'Next Maintenance'),
      sortable: true,
      sortValue: (row: MachineHistory) => row.next_maintenance ?? '',
      render: (row: MachineHistory) => <span className="text-xs text-t-body">{formatDate(row.next_maintenance)}</span>,
    },
    {
      key: 'rem_days',
      header: renderHeader('rem_days', 'Days Left'),
      sortable: true,
      sortValue: (row: MachineHistory) => row.rem_days,
      render: (row: MachineHistory) => (
        <span className="text-xs text-t-body">
          {row.rem_days}
        </span>
      ),
    },
    {
      key: 'branch_name',
      header: renderHeader('branch_name', 'Branch'),
      sortable: true,
      sortValue: (row: MachineHistory) => row.branch_name ?? '',
      render: (row: MachineHistory) => <span className="text-xs text-t-body">{row.branch_name}</span>,
    },
    {
      key: 'zone_name',
      header: renderHeader('zone_name', 'Zone'),
      sortable: true,
      sortValue: (row: MachineHistory) =>
        Array.isArray(row.zone_name) ? row.zone_name.join(', ') : (row.zone_name ?? ''),
      render: (row: MachineHistory) => (
        <span className="text-xs text-t-body">
          {Array.isArray(row.zone_name)
            ? row.zone_name.filter(Boolean).join(', ') || '—'
            : (row.zone_name ?? '—')}
        </span>
      ),
    },
    {
      key: 'line_name',
      header: renderHeader('line_name', 'Line'),
      sortable: true,
      sortValue: (row: MachineHistory) =>
        Array.isArray(row.line_name) ? row.line_name.join(', ') : (row.line_name ?? ''),
      render: (row: MachineHistory) => (
        <span className="text-xs text-t-body">
          {Array.isArray(row.line_name)
            ? row.line_name.filter(Boolean).join(', ') || '—'
            : (row.line_name ?? '—')}
        </span>
      ),
    },
    {
      key: 'option_name',
      header: renderHeader('option_name', 'Condition'),
      sortable: true,
      sortValue: (row: MachineHistory) => row.option_name ?? '',
      render: (row: MachineHistory) => <span className="text-xs text-t-body">{row.option_name}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      headerClassName: 'sticky right-0 bg-table-head z-30 border-l border-header-line/60 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]',
      className: 'sticky right-0 bg-card group-hover:bg-card-alt z-10 border-l border-header-line/60 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] whitespace-nowrap',
      render: (row: MachineHistory) =>
        canUpdate ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onMaintenanceClick(row)}
          >
            Maintenance
          </Button>
        ) : null,
    },
  ]

  return (
    <AdvancedTable<MachineHistory>
      header={
        <Toolbar
          title="Preventive Maintenance"
          search={search}
          onSearchChange={val => { onSearchChange(val); onPageChange(1) }}
          searchPlaceholder="Search by Machine No"
          onExport={onExport ? () => onExport({ check_box_heading: formatExportHeadings(selectedHeadings) }) : undefined}
          onExportPdf={() => handleExportPdf({ check_box_heading: formatExportHeadings(selectedHeadings) })}
          exporting={exporting || exportingPdf}
        >
          {isAdmin && (
            <select
              value={branchFilter}
              onChange={e => { onBranchChange(e.target.value); onPageChange(1) }}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
              ))}
            </select>
          )}
        </Toolbar>
      }
      columns={columns}
      data={machines}
      loading={loading}
      emptyMessage="No machine history found"
      rowKey={(row) => String(row.id)}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      perPage={perPage}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
      countLabel="machine"
      countLabelPlural="machines"
    />
  )
}
