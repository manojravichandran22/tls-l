'use client'

import { useState } from 'react'
import { Pencil, Trash2, Eye } from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Badge from '@/components/ui/Badge'
import { type OptionRecord } from './types'
import { useExportPdf } from '@/hooks/useExportPdf'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'module', label: 'Module' },
  { key: 'type', label: 'Option Type' },
  { key: 'value', label: 'Option Value' },
  { key: 'branch', label: 'Branch' },
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

interface BranchOption { id: number; branch_name: string }

interface OptionListProps {
  options: OptionRecord[]
  loading: boolean
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  search: string
  typeFilter: string
  filterStatus: string
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  onSearchChange: (val: string) => void
  onTypeFilterChange: (val: string) => void
  onFilterStatusChange: (val: string) => void
  onAdd: () => void
  onView: (id: number) => void
  onEdit: (option: OptionRecord) => void
  onDelete: (option: OptionRecord) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onExport?: (extraPayload?: Record<string, any>) => void
  exporting?: boolean
  isAdmin?: boolean
  branches?: BranchOption[]
  branchFilter?: string
  onBranchChange?: (val: string) => void
  effectiveBranchId?: string
}

export default function OptionList({
  options, loading, search, typeFilter, filterStatus, page, perPage, totalPages, totalCount,
  onSearchChange, onTypeFilterChange, onFilterStatusChange, onAdd, onView, onEdit, onDelete,
  onPageChange, onPerPageChange, onExport, exporting = false,
  selected, onSelectionChange,
  isAdmin = false, branches = [], branchFilter = '', onBranchChange = () => { }, effectiveBranchId = '',
}: OptionListProps) {
  const { can } = usePermissions('Master-Option')
  const canView = can('option.show')
  const canCreate = can('option.create')
  const canEdit = can('option.update')
  const canDelete = can('option.delete')

  const { branchId } = useBranchAccess()

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

  const isFiltered = Boolean(search || typeFilter || (filterStatus && filterStatus !== 'all') || branchFilter)
  const exportUuids = selected.length > 0 ? selected : (isFiltered ? options.map(r => r.uuid).filter(Boolean) : [])

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/option/list',
    payload: {
      search: search ?? '',
      type: typeFilter ?? '',
      status: filterStatus || 'all',
      pdf_excel_type: 'pdf',
      branch_id: !isAdmin && branchId ? String(branchId) : (branchFilter || ''),
      check_uuid: exportUuids,
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'options',
  })

  const columns: AdvancedColumn<OptionRecord>[] = [
    {
      key: 'S.No',
      header: (
        <div
          className="inline-flex items-center gap-1.5 cursor-pointer select-none"
          title="Select all column headings for export"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={allHeadingsSelected}
            onChange={toggleAllHeadings}
            className="w-3.5 h-3.5 rounded accent-accent cursor-pointer"
          />
          <span>S.No</span>
        </div>
      ),
      render: (_: OptionRecord, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'module',
      header: renderHeader('module', 'Module'),
      sortable: true,
      sortValue: (row: OptionRecord) => row.module?.toLowerCase() ?? '',
      render: (row: OptionRecord) => (
        <Badge variant="default">{row.module || '—'}</Badge>
      ),
    },
    {
      key: 'type',
      header: renderHeader('type', 'Option Type'),
      sortable: true,
      sortValue: (row: OptionRecord) => row.type?.toLowerCase() ?? '',
      render: (row: OptionRecord) => <span className="text-t-body font-medium">{row.type || '—'}</span>,
    },
    {
      key: 'value',
      header: renderHeader('value', 'Option Value'),
      sortable: true,
      sortValue: (row: OptionRecord) => row.value?.toLowerCase() ?? '',
      render: (row: OptionRecord) => <span className="text-t-body">{row.value || '—'}</span>,
    },
    {
      key: 'branch',
      header: renderHeader('branch', 'Branch'),
      sortable: true,
      sortValue: (row: OptionRecord) => row.branch?.branch_name?.toLowerCase() ?? '',
      render: (row: OptionRecord) => (
        <span className="text-t-body text-xs">
          {row.branch?.branch_name || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      sortValue: (row: OptionRecord) => row.is_active,
      render: (row: OptionRecord) => (
        <Badge variant={row.is_active === 1 ? 'success' : 'default'}>
          {row.is_active === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  const getActions = (row: OptionRecord): ActionItem[] => {
    const actions: ActionItem[] = []

    if (canView) {
      actions.push({ label: 'View', icon: <Eye size={13} />, onClick: () => onView(row.id) })
    }

    if (canEdit) {
      actions.push({ label: 'Edit', icon: <Pencil size={13} />, onClick: () => onEdit(row) })
    }

    if (canDelete) {
      actions.push({ label: 'Delete', icon: <Trash2 size={13} />, onClick: () => onDelete(row), variant: 'danger' })
    }

    return actions
  }

  return (
    <AdvancedTable<OptionRecord>
      header={
        <Toolbar
          title="All Options"
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by Type or Value"
          onAdd={canCreate ? onAdd : undefined}
          addLabel="Add Option"
          onExport={onExport ? () => onExport({
            search: search ?? '',
            type: typeFilter ?? '',
            status: filterStatus || 'all',
            pdf_excel_type: 'excel',
            branch_id: !isAdmin && branchId ? String(branchId) : (branchFilter || ''),
            check_uuid: exportUuids,
            check_box_heading: formatExportHeadings(selectedHeadings),
          }) : undefined}
          onExportPdf={handleExportPdf}
          exporting={exporting || exportingPdf}
        >
          <div className="flex items-center gap-2">
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
            {!isAdmin && branchId && (
              <span className="h-8 px-3 flex items-center text-xs font-medium text-t-secondary bg-input border border-input-line rounded-input">
                Branch: {branches.find(b => b.id === Number(branchId))?.branch_name || `#${branchId}`}
              </span>
            )}
            <input
              type="text"
              placeholder="Filter by Type"
              value={typeFilter}
              onChange={e => onTypeFilterChange(e.target.value)}
              className="h-8 px-3 py-1.5 text-xs rounded-input border border-input-line bg-card text-t-body focus:outline-none focus:border-accent"
            />
            <select
              value={filterStatus}
              onChange={e => onFilterStatusChange(e.target.value)}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </Toolbar>
      }
      columns={columns}
      data={options}
      loading={loading}
      emptyMessage="No options found"
      rowKey={(row) => String(row.id)}
      actions={getActions}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      perPage={perPage}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
      countLabel="option"
      countLabelPlural="options"
      selectable
      selected={selected}
      onSelectionChange={onSelectionChange}
    />
  )
}
