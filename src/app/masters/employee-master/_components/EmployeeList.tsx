'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { PER_PAGE } from '@/lib/constants'
import { formatDate } from '@/lib/formatDate'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import Badge from '@/components/ui/Badge'
import { type Employee, type DeptOption, type RoleOption, type BranchOption } from './types'
import { useExportPdf } from '@/hooks/useExportPdf'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'emp_code', label: 'Emp Code' },
  { key: 'name', label: 'Name' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'role', label: 'Role' },
  { key: 'department', label: 'Department' },
  { key: 'team', label: 'Team' },
  { key: 'branch', label: 'Branch' },
  { key: 'designation', label: 'Designation' },
  { key: 'rfid', label: 'RFID' },
  { key: 'join_date', label: 'Join Date' },
  { key: 'status', label: 'Status' },
]

function formatExportHeadings(headings: string[]): string[] {
  const result: string[] = []
  headings.forEach(h => {
    result.push(h)
    if (h === 'emp_code') result.push('code', 'emp_code')
    if (h === 'name') result.push('first_name', 'last_name')
    if (h === 'department') result.push('department_name', 'department_id')
    if (h === 'team') result.push('team_name', 'team_id')
    if (h === 'branch') result.push('branch_name', 'branch_id')
    if (h === 'designation') result.push('designation_name', 'designation_id')
    if (h === 'role') result.push('role_name', 'role_id')
    if (h === 'rfid') result.push('rfid', 'rfid_no')
  })
  return Array.from(new Set(result))
}

interface EmployeeListProps {
  employees: Employee[]
  loading: boolean
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  search: string
  filterDepartmentId: string
  filterRole: string
  filterStatus: string
  branchFilter?: string
  branches?: BranchOption[]
  allDepts: DeptOption[]
  roles: RoleOption[]
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  onSearchChange: (val: string) => void
  onFilterDepartmentChange: (val: string) => void
  onFilterRoleChange: (val: string) => void
  onFilterStatusChange: (val: string) => void
  onBranchChange?: (val: string) => void
  onAdd: () => void
  onEdit: (emp: Employee) => void
  onDelete: (emp: Employee) => void
  onView: (uuid: string) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onExport?: (extraPayload?: Record<string, any>) => void
  exporting?: boolean
  onImport?: (file: File) => void
  onOpenImport?: () => void
  importing?: boolean
}

export default function EmployeeList({
  employees,
  loading,
  selected,
  onSelectionChange,
  search,
  filterDepartmentId,
  filterRole,
  filterStatus,
  branchFilter = '',
  branches = [],
  allDepts,
  roles,
  page,
  perPage,
  totalPages,
  totalCount,
  onSearchChange,
  onFilterDepartmentChange,
  onFilterRoleChange,
  onFilterStatusChange,
  onBranchChange,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onPageChange,
  onPerPageChange,
  onExport,
  exporting = false,
  onImport,
  onOpenImport,
  importing = false,
}: EmployeeListProps) {
  const router = useRouter()
  const { can } = usePermissions('Employee')
  const { branchId, isAdmin } = useBranchAccess()

  const canView = can('employee.show')
  const canCreate = can('employee.create')
  const canEdit = can('employee.update')
  const canDelete = can('employee.delete')
  const canExcel = can('employee.excel')
  const canPdf = can('employee.pdf')

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

  const columns: AdvancedColumn<Employee>[] = [
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
      render: (_: Employee, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'emp_code',
      header: renderHeader('emp_code', 'Emp Code'),
      sortable: true,
      sortValue: (row: Employee) => row.code ?? '',
      render: (row: Employee) => (
        <span className="text-t-body text-xs">{row.code || '—'}</span>
      ),
    },
    {
      key: 'name',
      header: renderHeader('name', 'Name'),
      sortable: true,
      sortValue: (row: Employee) => `${row.name} ${row.last_name}`.toLowerCase(),
      render: (row: Employee) => (
        <span className="text-accent font-semibold">{row.name} {row.last_name}</span>
      ),
    },
    {
      key: 'mobile',
      header: renderHeader('mobile', 'Mobile'),
      sortable: true,
      sortValue: (row: Employee) => row.mobile ?? '',
      render: (row: Employee) => <span className="text-t-body">{row.mobile}</span>,
    },
    {
      key: 'role',
      header: renderHeader('role', 'Role'),
      sortable: true,
      sortValue: (row: Employee) => row.roleInfo?.name ?? row.role,
      render: (row: Employee) => (
        <Badge variant="info">{row.roleInfo?.name ?? row.role}</Badge>
      ),
    },
    {
      key: 'department',
      header: renderHeader('department', 'Department'),
      sortable: true,
      sortValue: (row: Employee) => row.department?.name ?? '',
      render: (row: Employee) => (
        <span className="text-t-body">{row.department?.name ?? '—'}</span>
      ),
    },
    {
      key: 'team',
      header: renderHeader('team', 'Team'),
      sortable: true,
      sortValue: (row: Employee) => row.team?.team_name ?? row.team_name ?? '',
      render: (row: Employee) => (
        <span className="text-t-body">{row.team?.team_name ?? row.team_name ?? '—'}</span>
      ),
    },
    {
      key: 'branch',
      header: renderHeader('branch', 'Branch'),
      sortable: true,
      sortValue: (row: Employee) => row.branch?.branch_name ?? branches.find(b => b.id === Number(row.branch_id))?.branch_name ?? '',
      render: (row: Employee) => {
        const branchName = row.branch?.branch_name ?? branches.find(b => b.id === Number(row.branch_id))?.branch_name ?? '—'
        return <span className="text-t-body text-xs">{branchName}</span>
      },
    },
    {
      key: 'designation',
      header: renderHeader('designation', 'Designation'),
      sortable: true,
      sortValue: (row: Employee) => row.designation?.name ?? '',
      render: (row: Employee) => (
        <span className="text-t-body">{row.designation?.name ?? '—'}</span>
      ),
    },
    {
      key: 'rfid',
      header: renderHeader('rfid', 'RFID'),
      sortable: true,
      sortValue: (row: Employee) => row.rfid ?? row.rfid_no ?? '',
      render: (row: Employee) => (
        <span className="text-t-body text-xs font-mono">{row.rfid ?? row.rfid_no ?? '—'}</span>
      ),
    },
    {
      key: 'join_date',
      header: renderHeader('join_date', 'Join Date'),
      sortable: true,
      sortValue: (row: Employee) => row.join_date ?? '',
      render: (row: Employee) => (
        <span className="text-t-body text-xs">{formatDate(row.join_date)}</span>
      ),
    },
    {
      key: 'status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      className: 'whitespace-nowrap min-w-[90px]',
      sortValue: (row: Employee) => row.is_active,
      render: (row: Employee) => (
        <Badge variant={row.is_active === 1 ? 'success' : 'default'} className="whitespace-nowrap inline-flex">
          {row.is_active === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  const getActions = (row: Employee): ActionItem[] => {
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

  // Map selected row-keys (string IDs) → actual UUIDs
  const selectedUuids = employees
    .filter(emp => selected.includes(String(emp.id)))
    .map(emp => emp.uuid)

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/employee/list',
    payload: {
      search: search ?? '',
      branch_id: !isAdmin && branchId ? String(branchId) : branchFilter,
      role: filterRole ?? '',
      name: '',
      ...(filterDepartmentId ? { department_id: filterDepartmentId } : {}),
      ...(filterStatus ? { status: filterStatus } : {}),
      ...(selectedUuids.length > 0 ? { check_uuid: selectedUuids } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'Employees',
  })

  return (
      <AdvancedTable<Employee>
        header={
          <Toolbar
            title="All Employees"
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by Employee Name"
            onAdd={canCreate ? onAdd : undefined}
            addLabel="Add Employee"
            onExport={canExcel ? () => onExport?.({ check_box_heading: formatExportHeadings(selectedHeadings) }) : undefined}
            onExportPdf={canPdf ? handleExportPdf : undefined}
            exporting={exporting}
            onImportClick={onOpenImport || (() => router.push('/masters/employee-master/import'))}
            importing={importing}
          >
            {isAdmin && onBranchChange && (
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
              onChange={e => { onFilterDepartmentChange(e.target.value); onPageChange(1) }}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
            >
              <option value="">All Departments</option>
              {allDepts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select
              value={filterRole}
              onChange={e => { onFilterRoleChange(e.target.value); onPageChange(1) }}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
            >
              <option value="">All Roles</option>
              {roles.map(r => (
                <option key={r.id} value={r.role ?? r.id}>{r.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => { onFilterStatusChange(e.target.value); onPageChange(1) }}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Toolbar>
        }
        columns={columns}
        data={employees}
        loading={loading}
        emptyMessage="No employees found"
        rowKey={(row) => String(row.id)}
        actions={getActions}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        countLabel="employee"
        countLabelPlural="employees"
        selectable
        selected={selected}
        onSelectionChange={onSelectionChange}
      />
  )
}
