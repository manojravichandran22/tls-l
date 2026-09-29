'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { useExportPdf } from '@/hooks/useExportPdf'
import type { Zone, CompanyOption, BranchOption } from './types'
import { usePermissions } from '@/hooks/usePermissions'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'zone_name', label: 'Zone Name' },
  { key: 'zone_code', label: 'Zone Code' },
  { key: 'company_name', label: 'Company Name' },
  { key: 'company_code', label: 'Company Code' },
  { key: 'branch_name', label: 'Branch Name' },
  { key: 'branch_code', label: 'Branch Code' },
  { key: 'status', label: 'Status' },
]

interface Props {
  zones: Zone[]
  loading: boolean
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  search: string
  filterCompanyId: string
  filterBranchId: string
  filterStatus: string
  companies: CompanyOption[]
  branches: BranchOption[]
  onSearchChange: (val: string) => void
  onFilterCompanyChange: (val: string) => void
  onFilterBranchChange: (val: string) => void
  onFilterStatusChange: (val: string) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onAdd: () => void
  onEdit: (zone: Zone) => void
  onDelete: (zone: Zone) => void
  onView: (id: number) => void
  onExport?: (extraPayload?: Record<string, any>) => void
  exporting?: boolean
}

export default function ZoneList({
  zones, loading, page, perPage, totalPages, totalCount,
  search, filterCompanyId, filterBranchId, filterStatus,
  companies, branches, selected, onSelectionChange,
  onSearchChange, onFilterCompanyChange, onFilterBranchChange, onFilterStatusChange,
  onPageChange, onPerPageChange,
  onAdd, onEdit, onDelete, onView, onExport, exporting = false,
}: Props) {
  const filteredBranches = filterCompanyId
    ? branches.filter((b) => b.company_id === Number(filterCompanyId))
    : branches
  const { can } = usePermissions('Zone')

  const canView = can('zone.show')
  const canCreate = can('zone.create')
  const canEdit = can('zone.update')
  const canDelete = can('zone.delete')

  // Selected column headings state for export (matching Team module implementation)
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
    apiPath: '/zone/zoneList',
    payload: {
      search: search ?? '',
      company_id: filterCompanyId,
      branch_id: filterBranchId,
      status: filterStatus,
      ...(selected.length > 0 ? { check_uuid: selected } : {}),
      check_box_heading: selectedHeadings,
    },
    filename: 'zones',
  })

  const columns: AdvancedColumn<Zone>[] = [
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
      render: (_: Zone, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'zone_name',
      header: renderHeader('zone_name', 'Zone Name'),
      sortable: true,
      render: (row: Zone) => (
        <span className="text-accent font-semibold">{row.zone_name}</span>
      ),
    },
    {
      key: 'zone_code',
      header: renderHeader('zone_code', 'Zone Code'),
      sortable: true,
      render: (row: Zone) => (
        <span className="text-xs text-t-body">{row.zone_code}</span>
      ),
    },
    {
      key: 'company_name',
      header: renderHeader('company_name', 'Company Name'),
      sortable: true,
      render: (row: Zone) => (
        <span className="text-t-body">{row.company?.company_name ?? '—'}</span>
      ),
    },
    {
      key: 'company_code',
      header: renderHeader('company_code', 'Company Code'),
      sortable: true,
      render: (row: Zone) => (
        <span className="text-xs text-t-body">{row.company?.company_code ?? '—'}</span>
      ),
    },
    {
      key: 'branch_name',
      header: renderHeader('branch_name', 'Branch Name'),
      sortable: true,
      render: (row: Zone) => (
        <span className="text-t-body">{row.branch?.branch_name ?? '—'}</span>
      ),
    },
    {
      key: 'branch_code',
      header: renderHeader('branch_code', 'Branch Code'),
      sortable: true,
      render: (row: Zone) => (
        <span className="text-xs text-t-body">{row.branch?.branch_code ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      render: (row: Zone) => (
        <Badge variant={row.status === 1 ? 'success' : 'default'}>
          {row.status === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  const getActions = (row: Zone): ActionItem[] => {
    const actions: ActionItem[] = []

    if (canView) {
      actions.push({
        label: 'View',
        icon: <Eye size={13} />,
        onClick: () => onView(row.id),
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
    <AdvancedTable<Zone>
      header={
        <Toolbar
          title="All Zones"
          search={search}
          onSearchChange={val => { onSearchChange(val); onPageChange(1) }}
          searchPlaceholder="Search by Zone Name"
          onAdd={canCreate ? onAdd : undefined}
          addLabel="Add Zone"
          onExportPdf={handleExportPdf}
          exporting={exporting || exportingPdf}
          onExport={() => onExport?.({ check_box_heading: selectedHeadings })}
        >
          <select
            value={filterCompanyId}
            onChange={e => { onFilterCompanyChange(e.target.value); onFilterBranchChange(''); onPageChange(1) }}
            className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
          >
            <option value="">All Companies</option>
            {companies.map(c => (
              <option key={c.id} value={String(c.id)}>{c.company_name}</option>
            ))}
          </select>
          <select
            value={filterBranchId}
            onChange={e => { onFilterBranchChange(e.target.value); onPageChange(1) }}
            className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
          >
            <option value="">All Branches</option>
            {filteredBranches.map(b => (
              <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
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
      data={zones}
      loading={loading}
      emptyMessage="No zones found"
      rowKey={(row) => row.uuid}
      actions={getActions}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      perPage={perPage}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
      countLabel="zone"
      selectable
      selected={selected}
      onSelectionChange={onSelectionChange}
      countLabelPlural="zones"
    />
  )
}
