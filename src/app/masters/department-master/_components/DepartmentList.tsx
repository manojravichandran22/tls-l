'use client'

import { useState } from 'react'
import { Pencil, Trash2, Eye } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import { useExportPdf } from '@/hooks/useExportPdf'
import type { Department, BranchOption } from './types'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'name', label: 'Department Name' },
  { key: 'dept_code', label: 'Dept Code' },
  { key: 'branch', label: 'Branch' },
  { key: 'branch_code', label: 'Branch Code' },
  { key: 'status', label: 'Status' },
]

function formatExportHeadings(headings: string[]): string[] {
  const set = new Set<string>()
  headings.forEach((h) => {
    set.add(h)
    if (h === 'name') set.add('department_name')
    if (h === 'branch') set.add('branch_name')
  })
  return Array.from(set)
}

interface DepartmentListProps {
  data: Department[]
  loading: boolean
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  search: string
  filterStatus: string
  branchFilter: string
  branches: BranchOption[]
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  onSearchChange: (val: string) => void
  onFilterStatusChange: (val: string) => void
  onBranchChange: (val: string) => void
  onAdd: () => void
  onView: (uuid: string) => void
  onEdit: (dept: Department) => void
  onDelete: (dept: Department) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onExport?: (extraPayload?: Record<string, any>) => void
  exporting?: boolean
}

export default function DepartmentList({
  data,
  loading,
  search,
  filterStatus,
  branchFilter,
  branches,
  page,
  perPage,
  totalPages,
  totalCount,
  onSearchChange,
  onFilterStatusChange,
  onBranchChange,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onPageChange,
  onPerPageChange,
  onExport,
  exporting = false,
  selected,
  onSelectionChange
}: DepartmentListProps) {
  const { can } = usePermissions('Department')
  const { branchId, isAdmin } = useBranchAccess()

  const canView = can('department.show')
  const canCreate = can('department.create')
  const canEdit = can('department.update')
  const canDelete = can('department.delete')

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
  const exportUuids = selected.length > 0 ? selected : (isFiltered ? data.map(r => r.uuid).filter(Boolean) : [])

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/department/list',
    payload: {
      search: search ?? '',
      status: filterStatus || 'all',
      branch_id: !isAdmin && branchId ? String(branchId) : (branchFilter || ''),
      ...(exportUuids.length > 0 ? { check_uuid: exportUuids } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'departments',
  })

  const columns: AdvancedColumn<Department>[] = [
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
      render: (_: Department, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'name',
      header: renderHeader('name', 'Department Name'),
      sortable: true,
      sortValue: (row: Department) => row.name.toLowerCase(),
      render: (row: Department) => <span className="text-accent font-semibold">{row.name}</span>,
    },
    {
      key: 'dept_code',
      header: renderHeader('dept_code', 'Dept Code'),
      sortable: true,
      sortValue: (row: Department) => row.dept_code ?? '',
      render: (row: Department) => <span className="text-t-body text-xs">{row.dept_code}</span>,
    },
    {
      key: 'branch',
      header: renderHeader('branch', 'Branch'),
      sortable: true,
      sortValue: (row: Department) =>
        row.branch?.branch_name ??
        row.branch_name ??
        (row.branch as { name?: string })?.name ??
        branches.find(b => b.id === Number(row.branch_id))?.branch_name ??
        '',
      render: (row: Department) => {
        const branchName =
          row.branch?.branch_name ??
          row.branch_name ??
          (row.branch as { name?: string })?.name ??
          branches.find(b => b.id === Number(row.branch_id))?.branch_name ??
          '—'
        return <span className="text-t-body">{branchName}</span>
      },
    },
    {
      key: 'branch_code',
      header: renderHeader('branch_code', 'Branch Code'),
      sortable: true,
      sortValue: (row: Department) => row.branch?.branch_code ?? '',
      render: (row: Department) => <span className="text-t-body text-xs">{row.branch?.branch_code ?? '—'}</span>,
    },
    {
      key: 'status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      sortValue: (row: Department) => row.is_active,
      render: (row: Department) => (
        <Badge variant={row.is_active === 1 ? 'success' : 'default'}>
          {row.is_active === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  const getActions = (row: Department): ActionItem[] => {
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
    <AdvancedTable<Department>
      header={
        <Toolbar
          title="All Departments"
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by Department Name"
          onAdd={canCreate ? onAdd : undefined}
          addLabel="Add Department"
          onExport={onExport ? () => onExport({
            search: search ?? '',
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
      data={data}
      loading={loading}
      emptyMessage="No departments found"
      rowKey={(row) => row.uuid}
      actions={getActions}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      perPage={perPage}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
      selectable
      selected={selected}
      onSelectionChange={onSelectionChange}
      countLabel="department"
      countLabelPlural="departments"
    />
  )
}

