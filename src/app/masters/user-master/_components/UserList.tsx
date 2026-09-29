'use client'

import { useState } from 'react'
import { Eye, ShieldCheck } from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Badge from '@/components/ui/Badge'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useExport } from '@/hooks/useExport'
import { type User } from './types'
import { usePermissions } from '@/hooks/usePermissions'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'emp_code', label: 'Employee Code' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'branch_name', label: 'Branch' },
  { key: 'access_flag', label: 'Access' },
  { key: 'status', label: 'Status' },
]

function formatExportHeadings(headings: string[]): string[] {
  const set = new Set<string>()
  headings.forEach((h) => {
    set.add(h)
    if (h === 'status' || h === 'is_active') {
      set.add('status')
      set.add('is_active')
    }
  })
  return Array.from(set)
}

interface BranchOption { id: number; branch_name: string }

interface UserListProps {
  users: User[]
  loading: boolean
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  search: string
  roles: Record<number, string>
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  onSearchChange: (val: string) => void
  onView: (user: User) => void
  onPermissions: (uuid: string) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  isAdmin?: boolean
  branches?: BranchOption[]
  branchFilter?: string
  onBranchFilterChange?: (v: string) => void
  effectiveBranchId?: string
}

export default function UserList({
  users, loading, search, roles, page, perPage, totalPages, totalCount,
  onSearchChange, onView, onPermissions, onPageChange, onPerPageChange,
  selected, onSelectionChange,
  isAdmin = false, branches = [], branchFilter = '', onBranchFilterChange = () => { }, effectiveBranchId = '',
}: UserListProps) {
  const { can } = usePermissions('User')
  const canView = can('user.show') || can('user.list') || can('user.view')

  // Column checkbox heading state for export
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

  // Export PDF & Excel
  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/user/userlist',
    payload: {
      search,
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'user_list',
  })

  const { handleExport: handleExportExcel, exporting: exportingExcel } = useExport<User>({
    apiPath: '/user/userlist',
    payload: {
      search,
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
      type: 'excel',
    },
    dataKey: 'records',
    columns: [
      { key: 'emp_code', header: 'Employee Code', value: r => r.emp_code ?? '' },
      { key: 'name', header: 'Name', value: r => r.name ?? '' },
      { key: 'email', header: 'Email', value: r => r.email ?? '' },
      { key: 'role', header: 'Role', value: r => r.roleInfo?.name ?? roles[r.role] ?? `Role ${r.role}` },
      { key: 'branch_name', header: 'Branch', value: r => r.branch?.branch_name ?? r.branch_name ?? '—' },
      { key: 'access_flag', header: 'Access', value: r => r.access_flag === 3 ? 'Mobile & Web' : r.access_flag === 2 ? 'Mobile' : r.access_flag === 1 ? 'Web' : 'No Access' },
      { key: 'status', header: 'Status', value: r => r.is_active === 1 || r.status === 1 ? 'Active' : 'Inactive' },
    ],
    filename: 'user_list',
    method: 'POST',
  })

  const columns: AdvancedColumn<User>[] = [
    {
      key: '#',
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
          <span>#</span>
        </div>
      ),
      render: (_: User, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'emp_code',
      header: renderHeader('emp_code', 'Employee Code'),
      sortable: true,
      sortValue: (row: User) => row.emp_code ?? '',
      render: (row: User) => <span className="text-t-body font-mono text-xs">{row.emp_code || '—'}</span>,
    },
    {
      key: 'name',
      header: renderHeader('name', 'Name'),
      sortable: true,
      sortValue: (row: User) => row.name ?? '',
      render: (row: User) => <span className="text-accent font-semibold">{row.name || '—'}</span>,
    },
    {
      key: 'email',
      header: renderHeader('email', 'Email'),
      sortable: true,
      sortValue: (row: User) => row.email ?? '',
      render: (row: User) => <span className="text-t-body text-xs">{row.email || '—'}</span>,
    },
    {
      key: 'role',
      header: renderHeader('role', 'Role'),
      sortable: true,
      sortValue: (row: User) => row.roleInfo?.name ?? roles[row.role] ?? `Role ${row.role}`,
      render: (row: User) => (
        <Badge variant="info">{row.roleInfo?.name ?? roles[row.role] ?? `Role ${row.role}`}</Badge>
      ),
    },
    {
      key: 'branch_name',
      header: renderHeader('branch_name', 'Branch'),
      sortable: true,
      sortValue: (row: User) => row.branch?.branch_name ?? row.branch_name ?? '',
      render: (row: User) => (
        <span className="text-t-secondary text-xs">{row.branch?.branch_name ?? row.branch_name ?? '—'}</span>
      ),
    },
    {
      key: 'access_flag',
      header: renderHeader('access_flag', 'Access'),
      sortable: true,
      sortValue: (row: User) => row.access_flag ?? 0,
      render: (row: User) => {
        const flag = row.access_flag
        const label = flag === 3 ? 'Mobile & Web' : flag === 2 ? 'Mobile' : flag === 1 ? 'Web' : 'No Access'
        return <span className="text-t-body text-xs font-medium">{label}</span>
      },
    },
    {
      key: 'status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      sortValue: (row: User) => row.is_active ?? row.status ?? 0,
      render: (row: User) => {
        const active = row.is_active === 1 || row.status === 1 || String(row.status).toLowerCase() === 'active'
        return (
          <Badge variant={active ? 'success' : 'default'}>
            {active ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
  ]

  const getActions = (row: User): ActionItem[] => {
    const actions: ActionItem[] = []
    if (canView) {
      actions.push({ label: 'View', icon: <Eye size={13} />, onClick: () => onView(row) })
    }
    actions.push({ label: 'Permissions', icon: <ShieldCheck size={13} />, onClick: () => onPermissions(row.uuid) })
    return actions
  }

  return (
    <AdvancedTable<User>
      header={
        <Toolbar
          title="All Users"
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by Name, Employee Code or Role"
          onExport={() => handleExportExcel({ check_box_heading: formatExportHeadings(selectedHeadings) })}
          onExportPdf={() => handleExportPdf({ check_box_heading: formatExportHeadings(selectedHeadings) })}
          exporting={exportingExcel || exportingPdf}
        >
          {/* Branch Filter */}
          {isAdmin ? (
            <select
              value={branchFilter}
              onChange={(e) => onBranchFilterChange(e.target.value)}
              className="h-8 px-2.5 text-xs bg-card border border-input-line rounded-input outline-none focus:border-accent text-t-body cursor-pointer"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          ) : effectiveBranchId ? (
            <div className="flex items-center gap-1.5 h-8 px-2.5 text-xs bg-card-alt border border-input-line rounded-input text-t-primary font-medium">
              <span className="text-t-lighter">Branch:</span>
              <span>{branches.find((b) => String(b.id) === effectiveBranchId)?.branch_name ?? '—'}</span>
            </div>
          ) : null}
        </Toolbar>
      }
      columns={columns}
      data={users}
      loading={loading}
      emptyMessage="No users found"
      rowKey={(row) => row.uuid}
      actions={getActions}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      perPage={perPage}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
      countLabel="user"
      selectable
      selected={selected}
      onSelectionChange={onSelectionChange}
      countLabelPlural="users"
    />
  )
}
