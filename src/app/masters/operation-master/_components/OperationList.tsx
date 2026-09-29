'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, MoreVertical } from 'lucide-react'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import Badge from '@/components/ui/Badge'
import type { Operation, MachineTypeOption } from './types'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useExportPdf } from '@/hooks/useExportPdf'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'code', label: 'Code' },
  { key: 'operation_name', label: 'Operation Name' },
  { key: 'machine_type', label: 'Machine Type' },
  { key: 'branch', label: 'Branch' },
  { key: 'sam', label: 'SAM' },
  { key: 'defects', label: 'Defects' },
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

interface OperationListProps {
  operations: Operation[]
  loading: boolean
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  search: string
  filterMachineTypeId: string
  filterSamMin: string
  filterSamMax: string
  filterDefectMin: string
  filterDefectMax: string
  filterStatus: string
  allTypes: MachineTypeOption[]
  branches: { id: number; branch_name: string }[]
  branchFilter: string
  onBranchChange: (val: string) => void
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  openMenuId: number | null
  menuPos: { top: number; right: number }
  onSearchChange: (val: string) => void
  onFilterMachineTypeChange: (val: string) => void
  onFilterSamMinChange: (val: string) => void
  onFilterSamMaxChange: (val: string) => void
  onFilterDefectMinChange: (val: string) => void
  onFilterDefectMaxChange: (val: string) => void
  onFilterStatusChange: (val: string) => void
  onAdd: () => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onView: (uuid: string) => void
  onMenuOpen: (e: React.MouseEvent<HTMLButtonElement>, id: number) => void
  onMenuClose: () => void
  onEdit: (operation: Operation) => void
  onDeleteTarget: (operation: Operation) => void
  onExport?: (extraPayload?: Record<string, any>) => void
  exporting?: boolean
  onExportPdf?: () => void
  exportingPdf?: boolean
  onOpenImport?: () => void
  importing?: boolean
}

export default function OperationList({
  operations,
  loading,
  search,
  filterMachineTypeId,
  filterSamMin,
  filterSamMax,
  filterDefectMin,
  filterDefectMax,
  filterStatus,
  allTypes,
  branches,
  branchFilter,
  onBranchChange,
  page,
  perPage,
  totalPages,
  totalCount,
  openMenuId,
  menuPos,
  selected,
  onSelectionChange,
  onSearchChange,
  onFilterMachineTypeChange,
  onFilterSamMinChange,
  onFilterSamMaxChange,
  onFilterDefectMinChange,
  onFilterDefectMaxChange,
  onFilterStatusChange,
  onAdd,
  onPageChange,
  onPerPageChange,
  onView,
  onMenuOpen,
  onMenuClose,
  onEdit,
  onDeleteTarget,
  onExport,
  exporting = false,
  onOpenImport,
  importing = false,
}: OperationListProps) {
  const router = useRouter()
  const { can } = usePermissions('Operation')
  const { branchId, isAdmin } = useBranchAccess()

  const canCreate = can('operation.create')
  const canEdit = can('operation.update')
  const canDelete = can('operation.delete')
  const canView = can('operation.show')

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

  const isFiltered = Boolean(search || filterMachineTypeId || branchFilter)
  const exportUuids = selected.length > 0 ? selected : (isFiltered ? operations.map(r => r.uuid).filter(Boolean) : [])

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/operation/list',
    payload: {
      search: search ?? '',
      ...(filterMachineTypeId ? { machine_type: filterMachineTypeId } : {}),
      branch_id: !isAdmin && branchId ? String(branchId) : (branchFilter || ''),
      ...(exportUuids.length > 0 ? { check_uuid: exportUuids } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'operations',
  })

  // Client-side SAM & defect filtering
  const samToNum = (sam: string | number | undefined) => {
    if (sam == null || sam === '') return null
    const s = String(sam)
    const parts = s.split('.')
    if (parts.length === 2) return parseFloat(parts[0]) + parseFloat(`0.${parts[1]}`)
    return parseFloat(s)
  }

  const SELECT_CLASS = 'h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent'
  const INPUT_CLASS = 'h-8 w-20 px-2 text-sm2 text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent'
  
  const columns: AdvancedColumn<Operation>[] = [
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
      render: (_: Operation, i: number) => <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>,
    },
    {
      key: 'code',
      header: renderHeader('code', 'Code'),
      sortable: true,
      sortValue: (row: Operation) => row.code || '—',
      render: (row: Operation) => <span className="text-xs font-semibold text-t-body">{row.code || '—'}</span>,
    },
    {
      key: 'operation_name',
      header: renderHeader('operation_name', 'Operation Name'),
      sortable: true,
      sortValue: (row: Operation) => row.operation_name,
      render: (row: Operation) => <span className="text-accent font-semibold">{row.operation_name}</span>,
    },
    {
      key: 'machine_type',
      header: renderHeader('machine_type', 'Machine Type'),
      sortable: true,
      sortValue: (row: Operation) => row.machineType?.type_name ?? '—',
      render: (row: Operation) => <span className="text-t-body text-xs">{row.machineType?.type_name ?? '—'}</span>,
    },
    
    {
      key: 'sam',
      header: renderHeader('sam', 'SAM'),
      sortable: true,
      sortValue: (row: Operation) => samToNum(row.sam) ?? -1,
      render: (row: Operation) => (
        <span className="text-xs font-semibold text-t-secondary">{row.sam || '—'}</span>
      ),
    },
    {
      key: 'defects',
      header: renderHeader('defects', 'Defects'),
      sortable: true,
      sortValue: (row: Operation) => row.defect_details?.length ?? row.defects?.length ?? 0,
      render: (row: Operation) => (
        <Badge variant="default">{row.defect_details?.length ?? row.defects?.length ?? 0}</Badge>
      ),
    },
    {
      key: 'branch',
      header: renderHeader('branch', 'Branch'),
      sortable: true,
      sortValue: (row: Operation) =>
        row.branch_name ??
        branches.find(b => b.id === Number(row.branch_id))?.branch_name ??
        '',
      render: (row: Operation) => {
        const branchName =
          row.branch_name ??
          branches.find(b => b.id === Number(row.branch_id))?.branch_name ??
          '—'
        return <span className="text-t-body text-xs">{branchName}</span>
      },
    },
    {
      key: 'status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      sortValue: (row: Operation) => row.is_active,
      render: (row: Operation) => (
        <Badge variant={row.is_active === 1 ? 'success' : 'default'}>
          {row.is_active === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'view',
      header: '',
      render: (row: Operation) =>
        canView ? (
          <button
            onClick={() => onView(row.uuid)}
            className="w-7 h-7 flex items-center justify-center rounded border border-table-line text-t-lighter hover:text-accent hover:border-accent transition-colors cursor-pointer"
            title="View details"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ) : null,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Operation) => (
        <button
          onClick={e => onMenuOpen(e, row.id)}
          className="w-7 h-7 flex items-center justify-center rounded text-t-lighter hover:text-t-body hover:bg-card-alt transition-colors cursor-pointer"
        >
          <MoreVertical size={14} />
        </button>
      ),
    },
  ]

  return (
    <>
      <AdvancedTable
        header={
          <Toolbar
            title="All Operations"
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by Operation Name"
            onAdd={canCreate ? onAdd : undefined}
            addLabel="Add Operation"
            onExport={onExport ? () => onExport({
              search: search ?? '',
              ...(filterMachineTypeId ? { machine_type: filterMachineTypeId } : {}),
              branch_id: !isAdmin && branchId ? String(branchId) : (branchFilter || ''),
              ...(exportUuids.length > 0 ? { check_uuid: exportUuids } : {}),
              check_box_heading: formatExportHeadings(selectedHeadings),
            }) : undefined}
            exporting={exporting || exportingPdf}
            onExportPdf={handleExportPdf}
            onImportClick={onOpenImport || (() => router.push('/masters/operation-master/import'))}
            importing={importing}
          >
            {/* Branch Filter (Admin Only) */}
            {isAdmin && (
              <select
                value={branchFilter}
                onChange={e => { onBranchChange(e.target.value); onPageChange(1) }}
                className={SELECT_CLASS}
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
                ))}
              </select>
            )}

            {/* Machine Type */}
            <select
              value={filterMachineTypeId}
              onChange={e => onFilterMachineTypeChange(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">All Machine Types</option>
              {allTypes.map(t => (
                <option key={t.id} value={t.id}>{t.type_name || t.name}</option>
              ))}
            </select>

            {/* SAM range */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-t-lighter whitespace-nowrap">SAM</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Min"
                value={filterSamMin}
                onChange={e => onFilterSamMinChange(e.target.value)}
                className={INPUT_CLASS}
              />
              <span className="text-xs text-t-lighter">-</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Max"
                value={filterSamMax}
                onChange={e => onFilterSamMaxChange(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            {/* Defects count range */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-t-lighter whitespace-nowrap">Defects</span>
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={filterDefectMin}
                onChange={e => onFilterDefectMinChange(e.target.value)}
                className={INPUT_CLASS}
              />
              <span className="text-xs text-t-lighter">-</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={filterDefectMax}
                onChange={e => onFilterDefectMaxChange(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={e => onFilterStatusChange(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Toolbar>
        }
        rowKey={(row) => row.uuid}
        columns={columns}
        data={operations}
        loading={loading}
        emptyMessage="No operations found"
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        countLabel="operation"
        countLabelPlural="operations"
        selectable
        selected={selected}
        onSelectionChange={onSelectionChange}
      />

      {/* Fixed-position dropdown menu */}
      {openMenuId !== null && (
        <>
          <div className="fixed inset-0 z-[9990]" onClick={onMenuClose} />
          <div
            className="fixed z-[9991] bg-modal border border-table-line rounded-card shadow-lg py-1 min-w-[130px]"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            {canEdit && (
              <button
                onClick={() => {
                  const row = operations.find(o => o.id === openMenuId)
                  if (row) onEdit(row)
                  onMenuClose()
                }}
                className="w-full px-3 py-2 bg-transparent border-none cursor-pointer flex items-center gap-2 text-xs font-inherit select-none text-t-body hover:bg-card-alt"
              >
                <Pencil size={13} /> Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => {
                  const row = operations.find(o => o.id === openMenuId)
                  if (row) onDeleteTarget(row)
                  onMenuClose()
                }}
                className="w-full px-3 py-2 bg-transparent border-none cursor-pointer flex items-center gap-2 text-xs font-inherit select-none text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}
