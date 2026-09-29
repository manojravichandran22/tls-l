'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import type { Team } from './types'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { type BranchOption } from '@/hooks/useDropdownData'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'team_name', label: 'Team Name' },
  { key: 'code', label: 'Team Code' },
  { key: 'branch', label: 'Branch' },
  { key: 'status', label: 'Status' },
]

interface Props {
  teams: Team[]
  loading: boolean
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  search: string
  statusFilter: string
  branchFilter: string
  branches: BranchOption[]

  onSearchChange: (val: string) => void
  onStatusChange: (val: string) => void
  onBranchChange: (val: string) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onAdd: () => void
  onEdit: (team: Team) => void
  onDelete: (team: Team) => void
  onView: (uuid: string) => void
  onExport?: (extraPayload?: Record<string, any>) => void
  exporting?: boolean
}

export default function TeamList({
  teams, loading, page, perPage, totalPages, totalCount,
  search, statusFilter, branchFilter, branches, selected, onSelectionChange,
  onSearchChange, onStatusChange, onBranchChange,
  onPageChange, onPerPageChange,
  onAdd, onEdit, onDelete, onView, onExport, exporting = false,
}: Props) {
  const { can } = usePermissions('Team')
  const { branchId, isAdmin } = useBranchAccess()
  const canView = can('team.show')
  const canCreate = can('team.create')
  const canEdit = can('team.edit')
  const canDelete = can('team.delete')

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

  const columns: AdvancedColumn<Team>[] = [
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
      render: (_: Team, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'team_name',
      header: renderHeader('team_name', 'Team Name'),
      sortable: true,
      sortValue: (row: Team) => row.team_name,
      className: 'max-w-[200px] break-all whitespace-normal',
      render: (row: Team) => (
        <span className="text-accent font-semibold break-all">{row.team_name}</span>
      ),
    },
    {
      key: 'code',
      header: renderHeader('code', 'Team Code'),
      sortable: true,
      sortValue: (row: Team) => row.code ?? '',
      render: (row: Team) => (
        <span className="text-xs text-t-body">{row.code}</span>
      ),
    },
    {
      key: 'branch',
      header: renderHeader('branch', 'Branch'),
      sortable: true,
      sortValue: (row: Team) => row.branch?.branch_name ?? '',
      render: (row: Team) => (
        <span className="text-xs text-t-body">
          {row.branch?.branch_name ?? '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      sortValue: (row: Team) => row.status,
      render: (row: Team) => (
        <Badge variant={row.status === 1 ? 'success' : 'default'}>
          {row.status === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  const getActions = (row: Team): ActionItem[] => {
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
  const selectedUuids = selected
  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/team/list',
    payload: {
      search: search ?? '',
      status: statusFilter !== 'all' ? statusFilter : '',
      team_id: '',
      shift_id: '',
      ...(!isAdmin && branchId
        ? { branch_id: String(branchId) }
        : branchFilter
          ? { branch_id: branchFilter }
          : {}),
      ...(selectedUuids.length > 0
        ? { check_uuid: selectedUuids }
        : {}),
      check_box_heading: selectedHeadings,
    },
    filename: 'teams',
  })

  return (
    <AdvancedTable<Team>
      header={
        <Toolbar
          title="All Teams"
          search={search}
          onSearchChange={val => { onSearchChange(val); onPageChange(1) }}
          searchPlaceholder="Search by Team Name"
          onAdd={canCreate ? onAdd : undefined}
          addLabel="Add Team"
          onExportPdf={handleExportPdf}
          exporting={exporting || exportingPdf}
          onExport={() => onExport?.({ check_box_heading: selectedHeadings })}
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
            value={statusFilter}
            onChange={e => { onStatusChange(e.target.value); onPageChange(1) }}
            className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Toolbar>
      }
      columns={columns}
      data={teams}
      loading={loading}
      emptyMessage="No teams found"
      rowKey={(row) => row.uuid}
      actions={getActions}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      perPage={perPage}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
      countLabel="team"
      countLabelPlural="teams"
      selectable
      selected={selected}
      onSelectionChange={onSelectionChange}
    />
  )
}

