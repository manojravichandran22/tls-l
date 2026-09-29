'use client'

import { useState } from 'react'
import { Pencil, Trash2, Eye } from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Badge from '@/components/ui/Badge'
import { type WorkCategory, type DepartmentOption, type DesignationOption, type BranchOption } from './types'
import { useExportPdf } from '@/hooks/useExportPdf'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'name', label: 'Work Category Name' },
  { key: 'code', label: 'Code' },
  { key: 'department', label: 'Department' },
  { key: 'branch', label: 'Branch' },
  { key: 'status', label: 'Status' },
]

function formatExportHeadings(headings: string[]): string[] {
  const set = new Set<string>()
  headings.forEach((h) => {
    set.add(h)
    if (h === 'name') set.add('work_category_name')
    if (h === 'department') set.add('department_name')
    if (h === 'branch') set.add('branch_name')
  })
  return Array.from(set)
}

interface WorkCategoryListProps {
  workCategories: WorkCategory[]
  departments: DepartmentOption[]
  designations: DesignationOption[]
  branches: BranchOption[]
  loading: boolean
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  search: string
  filterDepartmentId: string
  filterStatus: string
  branchFilter: string
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  onSearchChange: (val: string) => void
  onFilterDepartmentChange: (val: string) => void
  onFilterStatusChange: (val: string) => void
  onBranchChange: (val: string) => void
  onAdd: () => void
  onView: (uuid: string) => void
  onEdit: (wc: WorkCategory) => void
  onDelete: (wc: WorkCategory) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onExport?: (extraPayload?: Record<string, any>) => void
  exporting?: boolean
}

export default function WorkCategoryList({
  workCategories, departments, designations, branches,
  loading, search, filterDepartmentId, filterStatus, branchFilter, page, perPage, totalPages, totalCount,
  onSearchChange, onFilterDepartmentChange, onFilterStatusChange, onBranchChange, onAdd, onView, onEdit, onDelete,
  onPageChange, onPerPageChange, onExport, exporting = false, selected, onSelectionChange,
}: WorkCategoryListProps) {
  const { can } = usePermissions('WorkCategory')
  const { branchId, isAdmin } = useBranchAccess()

  const canView = can('workCategory.show')
  const canCreate = can('workCategory.create')
  const canEdit = can('workCategory.update')
  const canDelete = can('workCategory.delete')

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

  const isFiltered = Boolean(search || (filterDepartmentId && filterDepartmentId !== 'all') || (filterStatus && filterStatus !== 'all') || branchFilter)
  const exportUuids = selected.length > 0 ? selected : (isFiltered ? workCategories.map(r => r.uuid).filter(Boolean) : [])

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/work-category/list',
    payload: {
      search: search ?? '',
      department_id: filterDepartmentId || 'all',
      dept_id: filterDepartmentId || 'all',
      status: filterStatus || 'all',
      branch_id: !isAdmin && branchId ? String(branchId) : (branchFilter || ''),
      ...(exportUuids.length > 0 ? { check_uuid: exportUuids } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'workcategories',
  })

  const columns: AdvancedColumn<WorkCategory>[] = [
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
      render: (_: WorkCategory, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'name',
      header: renderHeader('name', 'Work Category Name'),
      sortable: true,
      sortValue: (row: WorkCategory) => row.name.toLowerCase(),
      render: (row: WorkCategory) => <span className="text-accent font-semibold">{row.name}</span>,
    },
    {
      key: 'code',
      header: renderHeader('code', 'Code'),
      sortable: true,
      sortValue: (row: WorkCategory) => row.code ?? '',
      render: (row: WorkCategory) => <span className="text-t-body font-mono text-xs">{row.code}</span>,
    },
    {
      key: 'department',
      header: renderHeader('department', 'Department'),
      sortable: true,
      sortValue: (row: WorkCategory) => row.department?.name ?? '',
      render: (row: WorkCategory) => (
        <span className="text-t-body">
          {row.department?.name ?? departments.find(d => d.id.toString() === row.dept_id?.toString())?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'branch',
      header: renderHeader('branch', 'Branch'),
      sortable: true,
      sortValue: (row: WorkCategory) =>
        row.branch?.branch_name ??
        row.branch_name ??
        (row.branch as { name?: string })?.name ??
        branches.find(b => b.id === Number(row.branch_id))?.branch_name ??
        '',
      render: (row: WorkCategory) => {
        const branchName =
          row.branch?.branch_name ??
          row.branch_name ??
          (row.branch as { name?: string })?.name ??
          branches.find(b => b.id === Number(row.branch_id))?.branch_name ??
          '—'
        return <span className="text-t-body text-xs">{branchName}</span>
      },
    },
    {
      key: 'status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      sortValue: (row: WorkCategory) => row.is_active,
      render: (row: WorkCategory) => (
        <Badge variant={row.is_active === 1 ? 'success' : 'default'}>
          {row.is_active === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  const getActions = (row: WorkCategory): ActionItem[] => {
    const actions: ActionItem[] = []

    if (canView) {
      actions.push({
        label: 'View',
        icon: <Eye size={13} />,
        onClick: () => onView(row.uuid),
      })
    }

    if (canEdit) {
      actions.push({
        label: 'Edit',
        icon: <Pencil size={13} />,
        onClick: () => onEdit(row),
      })
    }

    if (canDelete) {
      actions.push({
        label: 'Delete',
        icon: <Trash2 size={13} />,
        onClick: () => onDelete(row),
        variant: 'danger',
      })
    }

    return actions
  }

  return (
    <AdvancedTable<WorkCategory>
      header={
        <Toolbar
          title="All Work Categories"
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by Work Category Name"
          onAdd={canCreate ? onAdd : undefined}
          addLabel="Add Work Category"
          onExport={onExport ? () => onExport({
            search: search ?? '',
            department_id: filterDepartmentId || 'all',
            dept_id: filterDepartmentId || 'all',
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
              onChange={e => { onBranchChange(e.target.value); onPageChange(1); }}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
              ))}
            </select>
          )}
          <select
            value={filterDepartmentId}
            onChange={e => onFilterDepartmentChange(e.target.value)}
            className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={String(d.id)}>{d.name}</option>
            ))}
          </select>
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
      data={workCategories}
      loading={loading}
      emptyMessage="No work categories found"
      rowKey={(row) => row.uuid}
      actions={getActions}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      perPage={perPage}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
      countLabel="work category"
      countLabelPlural="work categories"
      selectable
      selected={selected}
      onSelectionChange={onSelectionChange}
    />
  )
}

