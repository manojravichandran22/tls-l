'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import type { Branch } from './types'
import { useExportPdf } from '@/hooks/useExportPdf'
import type { CompanyOption } from '@/hooks/useDropdownData'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'branch_name', label: 'Branch Name' },
  { key: 'branch_code', label: 'Branch Code' },
  { key: 'company_name', label: 'Company Name' },
  { key: 'company_code', label: 'Company Code' },
  { key: 'address', label: 'Address' },
  { key: 'status', label: 'Status' },
]

interface Props {
  branches: Branch[]
  loading: boolean
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  search: string
  filterCompanyId: string
  filterStatus: string
  companies: CompanyOption[]
  onSearchChange: (val: string) => void
  onFilterCompanyChange: (val: string) => void
  onFilterStatusChange: (val: string) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onAdd: () => void
  onEdit: (branch: Branch) => void
  onDelete: (branch: Branch) => void
  onView: (uuid: string) => void
  onExport?: (extraPayload?: Record<string, any>) => void
  exporting?: boolean
}

export default function BranchList({
  branches, loading, page, perPage, totalPages, totalCount,
  search, filterCompanyId, filterStatus,
  companies, selected, onSelectionChange,
  onSearchChange, onFilterCompanyChange, onFilterStatusChange,
  onPageChange, onPerPageChange,
  onAdd, onEdit, onDelete, onView, onExport, exporting = false,
}: Props) {
  const { can } = usePermissions('Branch')
  const { branchId, isAdmin } = useBranchAccess()
  const canView = can('branch.show')
  const canCreate = can('branch.create')
  const canEdit = can('branch.update')
  const canDelete = can('branch.delete')

  // Selected column headings state for export
  const [selectedHeadings, setSelectedHeadings] = useState<string[]>(
    HEADING_OPTIONS.map((h) => h.key)
  )

  const toggleHeading = (key: string) => {
    setSelectedHeadings((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const allHeadingsSelected =
    selectedHeadings.length === HEADING_OPTIONS.length
  const toggleAllHeadings = () => {
    setSelectedHeadings(
      allHeadingsSelected ? [] : HEADING_OPTIONS.map((h) => h.key)
    )
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

  const columns: AdvancedColumn<Branch>[] = [
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
      render: (_: Branch, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'branch_name',
      header: renderHeader('branch_name', 'Branch Name'),
      sortable: true,
      sortValue: (row: Branch) => row.branch_name,
      render: (row: Branch) => (
        <span className="text-accent font-semibold">{row.branch_name}</span>
      ),
    },
    {
      key: 'branch_code',
      header: renderHeader('branch_code', 'Branch Code'),
      sortable: true,
      sortValue: (row: Branch) => row.branch_code ?? '',
      render: (row: Branch) => (
        <span className="text-xs text-t-body">{row.branch_code}</span>
      ),
    },
    {
      key: 'company_name',
      header: renderHeader('company_name', 'Company Name'),
      sortable: true,
      sortValue: (row: Branch) => row.company?.company_name ?? '',
      render: (row: Branch) => (
        <span className="text-t-body">{row.company?.company_name ?? '—'}</span>
      ),
    },
    {
      key: 'company_code',
      header: renderHeader('company_code', 'Company Code'),
      sortable: true,
      sortValue: (row: Branch) => row.company?.company_code ?? '',
      render: (row: Branch) => (
        <span className="text-xs text-t-body">{row.company?.company_code ?? '—'}</span>
      ),
    },
    {
      key: 'address',
      header: renderHeader('address', 'Address'),
      sortable: true,
      sortValue: (row: Branch) => row.address ?? '',
      render: (row: Branch) => (
        <span className="text-t-body max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap block">
          {row.address}
        </span>
      ),
    },
    {
      key: 'status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      sortValue: (row: Branch) => row.status,
      render: (row: Branch) => (
        <Badge variant={row.status === 1 ? 'success' : 'default'}>
          {row.status === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  const getActions = (row: Branch): ActionItem[] => {
    const actions: ActionItem[] = []
    if (canView) {
      actions.push({ label: 'View', icon: <Eye size={13} />, onClick: () => onView(row.uuid) })
    }
    if (canEdit) {
      actions.push({ label: 'Edit', icon: <Pencil size={13} />, onClick: () => onEdit(row) })
    }
    if (canDelete) {
      actions.push({ label: 'Delete', icon: <Trash2 size={13} />, onClick: () => onDelete(row), variant: 'danger' })
    }
    return actions
  }

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/branch/branchList',
    payload: {
      search: search ?? '',
      status: filterStatus || '',
      company_id: filterCompanyId || '',
      ...(!isAdmin && branchId ? { branch_id: String(branchId) } : {}),
      check_uuid: selected.length > 0 ? selected : [],
      check_box_heading: selectedHeadings,
    },
    filename: 'branches',
  })

  return (
    <AdvancedTable<Branch>
      header={
        <Toolbar
          title="All Branches"
          search={search}
          onSearchChange={val => { onSearchChange(val); onPageChange(1) }}
          searchPlaceholder="Search by Branch Name"
          onAdd={canCreate ? onAdd : undefined}
          addLabel="Add Branch"
          onExportPdf={handleExportPdf}
          exporting={exporting || exportingPdf}
          onExport={() => onExport?.({ check_box_heading: selectedHeadings })}
        >
          <select
            value={filterCompanyId}
            onChange={e => { onFilterCompanyChange(e.target.value); onPageChange(1) }}
            className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
          >
            <option value="">All Companies</option>
            {companies.map(c => (
              <option key={c.id} value={String(c.id)}>{c.company_name}</option>
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
      data={branches}
      loading={loading}
      rowKey={(row) => row.uuid}
      emptyMessage="No branches found"
      selectable
      selected={selected}
      onSelectionChange={onSelectionChange}
      actions={getActions}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      perPage={perPage}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
      countLabel="branch"
      countLabelPlural="branches"
    />
  )
}


