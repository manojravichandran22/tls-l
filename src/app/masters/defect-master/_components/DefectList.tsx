'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import { Pencil, Trash2, Clock, MoreVertical } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Toolbar from '@/components/ui/Toolbar'
import type { Defect } from './types'
import { useExportPdf } from '@/hooks/useExportPdf'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'defect_code', label: 'Defect Code' },
  { key: 'category_name', label: 'Category' },
  { key: 'defect_name', label: 'Defect Name' },
  { key: 'cap', label: 'CAP' },
  { key: 'severity_name', label: 'Severity' },
  { key: 'workcategory_name', label: 'Work Category' },
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

function severityBadge(severity: unknown) {
  const s = String(severity ?? '').toLowerCase()
  if (s === 'critical') return <Badge variant="error">Critical</Badge>
  if (s === 'major') return <Badge variant="warning">Major</Badge>
  return <Badge variant="success">Minor</Badge>
}

interface DefectListProps {
  data: Defect[]
  loading: boolean
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  search: string
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  filterCategory: string
  filterSeverity: string
  filterWorkCategory: string
  filterStatus: string
  categoryOptions: { id: number; value: string }[]
  severityOptions: { id: number; value: string }[]
  workCategories: { id: number; name: string }[]
  branches: { id: number; branch_name: string }[]
  branchFilter: string
  onBranchChange: (val: string) => void
  onFilterCategoryChange: (val: string) => void
  onFilterSeverityChange: (val: string) => void
  onFilterWorkCategoryChange: (val: string) => void
  onFilterStatusChange: (val: string) => void
  onSearchChange: (val: string) => void
  onAdd: () => void
  onEdit: (row: Defect) => void
  onDelete: (row: Defect) => void
  onView: (uuid: string) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onExport?: (extraPayload?: Record<string, any>) => void
  exporting?: boolean
  onExportPdf?: () => void
  exportingPdf?: boolean
  onOpenImport?: () => void
  importing?: boolean
}

export default function DefectList({
  data,
  loading,
  selected,
  onSelectionChange,
  search,
  page,
  perPage,
  totalPages,
  totalCount,
  filterCategory,
  filterSeverity,
  filterWorkCategory,
  filterStatus,
  categoryOptions,
  severityOptions,
  workCategories,
  branches,
  branchFilter,
  onBranchChange,
  onFilterCategoryChange,
  onFilterSeverityChange,
  onFilterWorkCategoryChange,
  onFilterStatusChange,
  onSearchChange,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onPageChange,
  onPerPageChange,
  onExport,
  exporting = false,
  onOpenImport,
  importing = false,
}: DefectListProps) {
  const router = useRouter()
  const { can } = usePermissions('Defect')
  const canEditDefect = can('defect.update')
  const canDeleteDefect = can('defect.delete')
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

  const isFiltered = Boolean(
    search || (filterStatus && filterStatus !== 'all') || filterCategory || filterSeverity || filterWorkCategory || branchFilter
  )
  const exportUuids = selected.length > 0 ? selected : (isFiltered ? data.map(r => r.uuid).filter(Boolean) : [])

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/defect/list',
    payload: {
      search: search ?? '',
      status: filterStatus || 'all',
      category_id: filterCategory || 'all',
      severity_id: filterSeverity || 'all',
      workcategory_id: filterWorkCategory || '',
      branch_id: !isAdmin && branchId ? String(branchId) : (branchFilter || ''),
      ...(exportUuids.length > 0 ? { check_uuid: exportUuids } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'defects',
  })

  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow < 84 ? rect.top - 84 - 4 : rect.bottom + 4
    setMenuPos({ top, right: window.innerWidth - rect.right })
    setOpenMenuId(id)
  }

  const columns: AdvancedColumn<Defect>[] = [
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
      render: (_: Defect, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'code',
      header: renderHeader('defect_code', 'Defect Code'),
      sortable: true,
      sortValue: (row: Defect) => row.code ?? '',
      render: (row: Defect) => (
        <span className="text-xs font-semibold text-t-body">{row.code || '—'}</span>
      ),
    },
    {
      key: 'category',
      header: renderHeader('category_name', 'Category'),
      sortable: true,
      sortValue: (row: Defect) => row.category_name ?? '',
      render: (row: Defect) => <span className="text-t-body text-xs">{row.category_name}</span>,
    },
    {
      key: 'defect_name',
      header: renderHeader('defect_name', 'Defect Name'),
      sortable: true,
      sortValue: (row: Defect) => row.defect_name ?? '',  
      render: (row: Defect) => (
        <span className="text-accent font-semibold">{row.defect_name}</span>
      ),
    },
    {
      key: 'caps',
      header: renderHeader('cap', 'CAP'),
      sortable: true,
      sortValue: (row: Defect) => row.caps_count ?? row.caps?.length ?? 0,    
      render: (row: Defect) => (
        <span className="flex items-center gap-1 text-xs text-t-lighter">
          <Clock size={12} />{row.caps_count ?? row.caps?.length ?? 0}
        </span>
      ),
    },
    {
      key: 'severity',
      header: renderHeader('severity_name', 'Severity'),
      sortable: true,
      sortValue: (row: Defect) => row.severity_name ?? '',
      render: (row: Defect) => severityBadge(row.severity_name),
    },
    {
      key: 'workcategory',
      header: renderHeader('workcategory_name', 'Work Category'),
      sortable: true,
      sortValue: (row: Defect) => row.workcategory_name ?? '',
      render: (row: Defect) => (
        <span className="text-t-body text-xs">{row.workcategory_name ?? '—'}</span>
      ),
    },
    {
      key: 'branch',
      header: renderHeader('branch', 'Branch'),
      sortable: true,
      sortValue: (row: Defect) =>
        row.branch_name ??
        branches.find(b => b.id === Number(row.branch_id))?.branch_name ??
        '',
      render: (row: Defect) => {
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
      sortValue: (row: Defect) => row.is_active,
      render: (row: Defect) => (
        <Badge variant={row.is_active === 1 ? 'success' : 'default'}>
          {row.is_active === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'view',
      header: '',
      render: (row: Defect) =>
        can('defect.show') && (
          <button
            onClick={() => onView(row.uuid)}
            title="View CAPs"
            className="w-7 h-7 flex items-center justify-center rounded border border-table-line text-t-lighter hover:text-accent hover:border-accent transition-colors cursor-pointer"
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
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Defect) => (
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
      <AdvancedTable
        header={
          <Toolbar
            title="All Defects"
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by Defect Name"
            onAdd={can('defect.create') ? onAdd : undefined}
            addLabel="Add Defect"
            onExport={onExport ? () => onExport({
              search: search ?? '',
              status: filterStatus || 'all',
              category_id: filterCategory || 'all',
              severity_id: filterSeverity || 'all',
              workcategory_id: filterWorkCategory || '',
              branch_id: !isAdmin && branchId ? String(branchId) : (branchFilter || ''),
              ...(exportUuids.length > 0 ? { check_uuid: exportUuids } : {}),
              check_box_heading: formatExportHeadings(selectedHeadings),
            }) : undefined}
            onExportPdf={handleExportPdf}
            exporting={exporting || exportingPdf}
            onImportClick={onOpenImport || (() => router.push('/masters/defect-master/import'))}
            importing={importing}
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
            <select
              value={filterCategory}
              onChange={e => { onFilterCategoryChange(e.target.value); onPageChange(1) }}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
            >
              <option value="">All Categories</option>
              {categoryOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.value}</option>
              ))}
            </select>
            <select
              value={filterSeverity}
              onChange={e => { onFilterSeverityChange(e.target.value); onPageChange(1) }}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
            >
              <option value="">All Severities</option>
              {severityOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.value}</option>
              ))}
            </select>
            <select
              value={filterWorkCategory}
              onChange={e => { onFilterWorkCategoryChange(e.target.value); onPageChange(1) }}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
            >
              <option value="">All Work Categories</option>
              {workCategories.map((opt, idx) => (
                <option key={`${opt.id}-${idx}`} value={opt.id}>{opt.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => { onFilterStatusChange(e.target.value); onPageChange(1) }}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Toolbar>
        }
        rowKey={(row) => row.uuid}
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="No defects found"
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        countLabel="defect"
        countLabelPlural="defects"
        selectable
        selected={selected}
        onSelectionChange={onSelectionChange}
      />

      {/* Fixed-position dropdown — escapes overflow:hidden */}
      {openMenuId !== null && (
        <>
          <div className="fixed inset-0 z-[9990]" onClick={() => setOpenMenuId(null)} />
          <div
            className="fixed z-[9991] bg-modal border border-table-line rounded-card shadow-lg py-1 min-w-[130px]"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            {canEditDefect && (
              <button
                onClick={() => {
                  const row = data.find(d => d.id === openMenuId)
                  if (row) onEdit(row)
                  setOpenMenuId(null)
                }}
                className="w-full px-3 py-2 bg-transparent border-none cursor-pointer flex items-center gap-2 text-xs font-inherit select-none text-t-body hover:bg-card-alt"
              >
                <Pencil size={13} /> Edit
              </button>
            )}
            {canDeleteDefect && (
              <button
                onClick={() => {
                  const row = data.find(d => d.id === openMenuId)
                  if (row) onDelete(row)
                  setOpenMenuId(null)
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
