'use client'

import { useState } from 'react'
import { Pencil, Trash2, Eye, ShieldCheck } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import IconButton from '@/components/ui/IconButton'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import { useExportPdf } from '@/hooks/useExportPdf'
import type { Role } from './types'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import type { BranchOption } from '@/hooks/useDropdownData'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'name', label: 'Role Name' },
  { key: 'short_name', label: 'Short Name' },
  { key: 'role', label: 'Role Code' },
  { key: 'branch', label: 'Branch' },
  { key: 'status', label: 'Status' },
]

function formatExportHeadings(headings: string[]): string[] {
  const set = new Set<string>()
  headings.forEach((h) => {
    set.add(h)
    if (h === 'name') set.add('role_name')
    if (h === 'role') set.add('role_code')
    if (h === 'branch') set.add('branch_name')
  })
  return Array.from(set)
}

interface RoleListProps {
  data: Role[]
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
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onExport?: (extraPayload?: Record<string, any>) => void
  exporting?: boolean
  onPermissions: (uuid: string) => void
}

export default function RoleList({
  data,
  loading,
  selected,
  onSelectionChange,  
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
  onPermissions,
}: RoleListProps) {
  const { can } = usePermissions('Role')
  const { branchId, isAdmin } = useBranchAccess()

  const canView = can('role.show')
  const canCreate = can('role.create')
  const canEdit = can('role.update')
  const canDelete = can('role.delete')

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
    apiPath: '/role/list',
    payload: {
      search: search ?? '',
      status: filterStatus || 'all',
      branch_id: !isAdmin && branchId ? String(branchId) : branchFilter,
      ...(selected.length > 0 ? { check_uuid: selected } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'roles',
  })

  const columns: AdvancedColumn<Role>[] = [
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
      render: (_: Role, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'name',
      header: renderHeader('name', 'Role Name'),
      sortable: true,
      sortValue: (row: Role) => row.name.toLowerCase(),
      render: (row: Role) => <span className="text-accent font-semibold">{row.name}</span>,
    },
    {
      key: 'short_name',
      header: renderHeader('short_name', 'Short Name'),
      sortable: true,
      sortValue: (row: Role) => row.short_name ?? '',
      render: (row: Role) => <span className="text-t-body text-xs">{row.short_name}</span>,
    },
    {
      key: 'role',
      header: renderHeader('role', 'Role Code'),
      sortable: true,
      sortValue: (row: Role) => row.role ?? '', 
      render: (row: Role) => <span className="text-t-body font-semibold">{row.role}</span>,
    },
    {
      key: 'branch',
      header: renderHeader('branch', 'Branch'),
      sortable: true,
      sortValue: (row: Role) =>
        row.branch?.branch_name ??
        row.branch_name ??
        (row.branch as { name?: string })?.name ??
        branches.find(b => b.id === Number(row.branch_id))?.branch_name ??
        '',
      render: (row: Role) => {
        const branchName =
          row.branch?.branch_name ??
          row.branch_name ??
          (row.branch as { name?: string })?.name ??
          branches.find(b => b.id === Number(row.branch_id))?.branch_name ??
          '-'
        return <span className="text-xs text-t-body">{branchName}</span>
      },
    },
    {
      key: 'status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      sortValue: (row: Role) => row.is_active,
      render: (row: Role) => (
        <Badge variant={row.is_active === 1 ? 'success' : 'default'}>
          {row.is_active === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row: Role) => (
        <div className="flex gap-1.5 items-center justify-end">
          <IconButton variant="accent" onClick={() => onPermissions(row.uuid)} title="Permissions">
            <ShieldCheck size={13} />
          </IconButton>
        </div>
      ),
    },
  ]

  const getActions = (row: Role): ActionItem[] => {
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
    <AdvancedTable<Role>
      header={
        <Toolbar
          title="All Roles"
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by Role Name"
          onAdd={canCreate ? onAdd : undefined}
          addLabel="Add Role"
          onExport={() => onExport?.({ check_box_heading: formatExportHeadings(selectedHeadings) })}
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
      emptyMessage="No roles found"
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
      countLabel="role"
    />
  )
}
