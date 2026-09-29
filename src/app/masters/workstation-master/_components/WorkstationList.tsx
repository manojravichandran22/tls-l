'use client'

import { useState } from 'react'
import { Pencil, Trash2, Eye } from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import { useExportPdf } from '@/hooks/useExportPdf'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Badge from '@/components/ui/Badge'
import { type Workstation } from './types'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'name', label: 'Workstation' },
  { key: 'code', label: 'Code' },
  { key: 'line', label: 'Line' },
  { key: 'branch', label: 'Branch' },
  { key: 'qr_code', label: 'QR Code' },
  { key: 'status', label: 'Status' },
]

function formatExportHeadings(headings: string[]): string[] {
  const set = new Set<string>()
  headings.forEach((h) => {
    set.add(h)
    if (h === 'branch') set.add('branch_name')
  })
  return Array.from(set)
}

interface WorkstationListProps {
  workstations: Workstation[]
  loading: boolean
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  search: string
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  branches: { id: number; branch_name: string }[]
  branchFilter: string
  filterStatus: string
  onBranchChange: (val: string) => void
  onFilterStatusChange: (val: string) => void
  onSearchChange: (val: string) => void
  onAdd: () => void
  onView: (uuid: string) => void
  onEdit: (ws: Workstation) => void
  onDelete: (ws: Workstation) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onExport?: (extraPayload?: Record<string, any>) => void
  exporting?: boolean
}

export default function WorkstationList({
  workstations, loading, search, page, perPage, totalPages, totalCount,
  branches, branchFilter, filterStatus,
  onBranchChange, onFilterStatusChange,
  onSearchChange, onAdd, onView, onEdit, onDelete,
  onPageChange, onPerPageChange, onExport, exporting = false, selected,
  onSelectionChange,
}: WorkstationListProps) {
  const { can } = usePermissions('WorkStation')
  const { branchId, isAdmin } = useBranchAccess()

  const canView = can('show')
  const canCreate = can('workstation.create')
  const canEdit = can('workstation.update')
  const canDelete = can('workstation.delete')

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

  const isFiltered = Boolean(search || (filterStatus && filterStatus !== 'all') || branchFilter)
  const exportUuids = selected.length > 0 ? selected : (isFiltered ? workstations.map(r => r.uuid).filter(Boolean) : [])

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/workstation/list',
    payload: {
      search: search ?? '',
      line_id: '',
      status: filterStatus || 'all',
      branch_id: !isAdmin && branchId ? String(branchId) : (branchFilter || ''),
      ...(exportUuids.length > 0 ? { check_uuid: exportUuids } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'workstations',
  })

  const columns: AdvancedColumn<Workstation>[] = [
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
      render: (_: Workstation, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'name',
      header: renderHeader('name', 'Workstation'),
      sortable: true,
      sortValue: (row: Workstation) => row.name.toLowerCase(),
      render: (row: Workstation) => <span className="text-accent font-semibold">{row.name}</span>,
    },
    {
      key: 'code',
      header: renderHeader('code', 'Code'),
      sortable: true,
      sortValue: (row: Workstation) => row.code ?? '',
      render: (row: Workstation) => <span className="text-t-body text-xs">{row.code}</span>,
    },
    {
      key: 'line',
      header: renderHeader('line', 'Line'),
      sortable: true,
      sortValue: (row: Workstation) => row.line?.line_name ?? '',
      render: (row: Workstation) => <span className="text-t-body">{row.line?.line_name ?? '—'}</span>,
    },
    {
      key: 'branch',
      header: renderHeader('branch', 'Branch'),
      sortable: true,
      sortValue: (row: Workstation) => row.branch?.branch_name ?? '',
      render: (row: Workstation) => <span className="text-t-body">{row.branch?.branch_name ?? '—'}</span>,
    },
    {
      key: 'qr_code',
      header: renderHeader('qr_code', 'QR Code'),
      sortable: true,
      sortValue: (row: Workstation) => row.qr_code ?? '',
      render: (row: Workstation) => <span className="text-t-body text-xs">{row.qr_code}</span>,
    },
    {
      key: 'status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      sortValue: (row: Workstation) => row.is_active,
      render: (row: Workstation) => (
        <Badge variant={row.is_active === 1 ? 'success' : 'default'}>
          {row.is_active === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  const getActions = (row: Workstation): ActionItem[] => [
    ...(canView
      ? [
          {
            label: 'View',
            icon: <Eye size={13} />,
            onClick: () => onView(row.uuid),
          },
        ]
      : []),
    ...(canEdit
      ? [
          {
            label: 'Edit',
            icon: <Pencil size={13} />,
            onClick: () => onEdit(row),
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            label: 'Delete',
            icon: <Trash2 size={13} />,
            onClick: () => onDelete(row),
            variant: 'danger' as const,
          },
        ]
      : []),
  ]

  return (
    <AdvancedTable<Workstation>
      header={
        <Toolbar
          title="All Workstations"
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search workstation name"
          onAdd={canCreate ? onAdd : undefined}
          addLabel="Add Workstation"
          onExport={onExport ? () => onExport({
            search: search ?? '',
            line_id: '',
            status: filterStatus || 'all',
            branch_id: !isAdmin && branchId ? String(branchId) : (branchFilter || ''),
            ...(exportUuids.length > 0 ? { check_uuid: exportUuids } : {}),
            check_box_heading: formatExportHeadings(selectedHeadings),
          }) : undefined}
          onExportPdf={handleExportPdf}
          exporting={exporting || exportingPdf}
        >
          {isAdmin && (
            <select
              value={branchFilter}
              onChange={e => onBranchChange(e.target.value)}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
              ))}
            </select>
          )}
          <select
            value={filterStatus}
            onChange={e => onFilterStatusChange(e.target.value)}
            className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Toolbar>
      }
      columns={columns}
      data={workstations}
      loading={loading}
      emptyMessage="No workstations found"
      rowKey={(row) => row.uuid}
      actions={getActions}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      perPage={perPage}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
      countLabel="workstation"
      countLabelPlural="workstations"
      selectable
      selected={selected}
      onSelectionChange={onSelectionChange}
    />
  )
}
