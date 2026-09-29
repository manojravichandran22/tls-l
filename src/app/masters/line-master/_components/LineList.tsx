'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import { Pencil, Trash2, Eye } from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import { useExportPdf } from '@/hooks/useExportPdf'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import { type Line, type Slot, type ZoneOption, type BranchOption } from './types'
import { type LineOption } from '@/services/dropdownService'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'branch_name', label: 'Branch' },
  { key: 'zone_name', label: 'Zone' },
  { key: 'line_name', label: 'Line' },
  { key: 'slot_name', label: 'Slot' },
  { key: 'status', label: 'Status' },
]

function formatExportHeadings(headings: string[]): string[] {
  const set = new Set<string>()
  headings.forEach((h) => {
    set.add(h)
    if (h === 'branch_name' || h === 'branch') {
      set.add('branch_name')
      set.add('branch')
    }
    if (h === 'zone_name' || h === 'zone') {
      set.add('zone_name')
      set.add('zone')
    }
    if (h === 'line_name' || h === 'line') {
      set.add('line_name')
      set.add('line')
    }
    if (h === 'slot_name' || h.startsWith('slot')) {
      set.add('slot_name')
      set.add('slot')
    }
  })
  return Array.from(set)
}

interface LineListProps {
  lines: Line[]
  loading: boolean
  search: string
  filterZoneId: string
  filterLineId: string
  filterSlot: string
  filterStatus: string
  allZones: ZoneOption[]
  allLines: LineOption[]
  filterBranchId: string
  allBranches: BranchOption[]
  onFilterBranchChange: (val: string) => void
  page: number
  totalPages: number
  totalCount: number
  perPage: number
  selected: string[]
  onSearchChange: (val: string) => void
  onFilterZoneChange: (val: string) => void
  onFilterLineChange: (val: string) => void
  onFilterSlotChange: (val: string) => void
  onFilterStatusChange: (val: string) => void
  onAdd: () => void
  onView: (uuid: string) => void
  onEdit: (line: Line) => void
  onDelete: (line: Line) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onSelectionChange: (selected: string[]) => void
  onExport?: (extraPayload?: Record<string, any>) => void
  exporting?: boolean
}

function formatTime(t?: string) {
  if (!t) return '—'
  const [h, m] = t.slice(0, 5).split(':')
  const hr = parseInt(h)
  const ampm = hr >= 12 ? 'PM' : 'AM'
  const h12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr
  return `${h12}:${m} ${ampm}`
}

function getSlots5(row: Line) {
  const s = (row.slots ?? []).slice(0, 5)
  while (s.length < 5) s.push({ slot_name: `Slot-${s.length + 1}`, start: '', end: '' })
  return s
}

function renderSlotCell(slot: Slot) {
  return slot.start ? (
    <div className="text-xs2 whitespace-nowrap">
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-stat-green"></span>
        <span className="text-t-body">S : {formatTime(slot.start)}</span>
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
        <span className="text-t-body">E : {formatTime(slot.end)}</span>
      </div>
    </div>
  ) : <span className="text-t-lighter">—</span>
}

const SELECT_CLASS = 'h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent'

export default function LineList({
  lines, loading, search, filterZoneId, filterLineId, filterSlot, filterStatus, allZones, allLines, filterBranchId, allBranches, onFilterBranchChange, page, perPage, totalPages, totalCount, selected,
  onSearchChange, onFilterZoneChange, onFilterLineChange, onFilterSlotChange, onFilterStatusChange, onAdd, onView, onEdit, onDelete,
  onPageChange, onPerPageChange, onSelectionChange, onExport, exporting = false,
}: LineListProps) {
  const { can } = usePermissions('Line')

  const canView = can('line.list')
  const canCreate = can('line.create')
  const canEdit = can('line.update')
  const canDelete = can('line.delete')
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

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/line/list',
    payload: {
      search: search ?? '',
      line_name: filterLineId,
      zone_id: filterZoneId,
      branch_id: !isAdmin && branchId ? String(branchId) : filterBranchId,
      ...(filterSlot ? { slot: filterSlot } : {}),
      ...(filterStatus ? { status: filterStatus } : {}),
      ...(selected.length > 0 ? { check_uuid: selected } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'lines',
  })

  const columns: AdvancedColumn<Line>[] = [
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
      render: (_: Line, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'branch',
      header: renderHeader('branch_name', 'Branch'),
      sortable: true,
      sortValue: (row) => row.branch?.branch_name ?? row.zone?.branch?.branch_name ?? '',
      render: (row) => <span className="text-t-body">{row.branch?.branch_name ?? row.zone?.branch?.branch_name ?? '—'}</span>,
    },
    {
      key: 'zone',
      header: renderHeader('zone_name', 'Zone'),
      sortable: true,
      sortValue: (row) => row.zone?.zone_name ?? '',
      render: (row) => <span className="text-t-body">{row.zone?.zone_name ?? '—'}</span>,
    },
    {
      key: 'line_name',
      header: renderHeader('line_name', 'Line'),
      sortable: true,
      sortValue: (row) => row.line_name ?? '',
      render: (row) => <span className="text-t-body font-medium">{row.line_name}</span>,
    },
    ...([1, 2, 3, 4, 5].map(n => ({
      key: `slot-${n}`,
      header: renderHeader('slot_name', `Slot-${n}`),
      render: (row: Line) => {
        const slots5 = getSlots5(row)
        return renderSlotCell(slots5[n - 1])
      },
      className: `!py-2`,
    })) as AdvancedColumn<Line>[]),
    {
      key: 'status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      sortValue: (row) => String(row.status),
      render: (row) => <Badge variant={row.status === 1 ? 'success' : 'default'}>{row.status === 1 ? 'Active' : 'Inactive'}</Badge>,
    },
  ]

  const getActions = (row: Line): ActionItem[] => {
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
    <AdvancedTable
      header={
        <Toolbar
          title="All Lines"
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by Line Name"
          onAdd={canCreate ? onAdd : undefined}
          addLabel="Add Line"
          onExportPdf={handleExportPdf}
          exporting={exporting || exportingPdf}
          onExport={() => onExport?.({ check_box_heading: formatExportHeadings(selectedHeadings) })}
        >
          {isAdmin && (
            <select
              value={filterBranchId}
              onChange={e => {
                onFilterBranchChange(e.target.value)
                onFilterZoneChange('')
                onFilterLineChange('')
                onPageChange(1)
              }}
              className={SELECT_CLASS}
            >
              <option value="">All Branches</option>
              {allBranches.map(b => (
                <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
              ))}
            </select>
          )}
          <select
            value={filterZoneId}
            onChange={e => {
              onFilterZoneChange(e.target.value)
              onFilterLineChange('')
              onPageChange(1)
            }}
            className={SELECT_CLASS}
          >
            <option value="">All Zones</option>
            {allZones.map(z => (
              <option key={z.id} value={String(z.id)}>{z.zone_name}</option>
            ))}
          </select>
          <select
            value={filterLineId}
            onChange={e => { onFilterLineChange(e.target.value); onPageChange(1) }}
            className={SELECT_CLASS}
          >
            <option value="">All Lines</option>
            {allLines.map(l => (
              <option key={l.id} value={l.line_name}>{l.line_name}</option>
            ))}
          </select>
          <select
            value={filterSlot}
            onChange={e => { onFilterSlotChange(e.target.value); onPageChange(1) }}
            className={SELECT_CLASS}
          >
            <option value="">All Slots</option>
            <option value="Slot-1">Slot-1</option>
            <option value="Slot-2">Slot-2</option>
            <option value="Slot-3">Slot-3</option>
            <option value="Slot-4">Slot-4</option>
            <option value="Slot-5">Slot-5</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => { onFilterStatusChange(e.target.value); onPageChange(1) }}
            className={SELECT_CLASS}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Toolbar>
      }
      columns={columns}
      data={lines}
      loading={loading}
      emptyMessage="No lines found"
      rowKey={(row) => row.uuid}
      selectable
      selected={selected}
      onSelectionChange={onSelectionChange}
      actions={getActions}
      page={page}
      perPage={perPage}
      totalPages={totalPages}
      totalCount={totalCount}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
      countLabel="line"
    />
  )
}
