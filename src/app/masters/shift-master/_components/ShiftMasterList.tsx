'use client'

import { useState } from 'react'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import Badge from '@/components/ui/Badge'
import Tabs from '@/components/ui/Tabs'
import { type Shift, type BranchOption, type ZoneOption, SHIFT_TYPES } from './types'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useExport } from '@/hooks/useExport'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'

const SELECT_CLASS =
  'h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'factory', label: 'Factory' },
  { key: 'shift_name', label: 'Shift Name' },
  { key: 'type', label: 'Type' },
  { key: 'start', label: 'Start' },
  { key: 'end', label: 'End' },
  { key: 'hrs', label: 'Hrs' },
  { key: 'breakMins', label: 'Break' },
  { key: 'start_buffer_time', label: 'Buffer Login' },
  { key: 'end_buffer_time', label: 'Buffer Logout' },
  { key: 'status', label: 'Status' },
]

function formatExportHeadings(headings: string[]): string[] {
  const set = new Set<string>()
  headings.forEach((h) => {
    set.add(h)
    if (h === 'factory' || h === 'branch_name' || h === 'branch') {
      set.add('factory')
      set.add('branch_name')
      set.add('branch')
    }
    if (h === 'shift_name' || h === 'shift') {
      set.add('shift_name')
      set.add('shift')
    }
    if (h === 'type') set.add('type')
    if (h === 'start') set.add('start')
    if (h === 'end') set.add('end')
    if (h === 'hrs') set.add('hrs')
    if (h === 'breakMins' || h === 'break') {
      set.add('breakMins')
      set.add('break')
    }
    if (h === 'start_buffer_time' || h === 'buffer' || h === 'buffer_login') {
      set.add('start_buffer_time')
      set.add('buffer')
      set.add('buffer_login')
    }
    if (h === 'end_buffer_time' || h === 'buffer_logout') {
      set.add('end_buffer_time')
      set.add('buffer_logout')
    }
    if (h === 'status') set.add('status')
  })
  return Array.from(set)
}

interface ShiftMasterListProps {
  shifts: Shift[]
  loading: boolean
  search: string
  filterBranchId: string
  filterZoneId: string
  filterStatus: string
  filterShiftType: string
  allBranches: BranchOption[]
  allZones: ZoneOption[]
  onSearchChange: (val: string) => void
  onFilterBranchChange: (val: string) => void
  onFilterZoneChange: (val: string) => void
  onFilterStatusChange: (val: string) => void
  onFilterShiftTypeChange: (val: string) => void
  onAdd: () => void
  onEdit: (shift: Shift) => void
  onDelete: (shift: Shift) => void
  onView: (uuid: string) => void
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  page: number
  totalPages: number
  totalCount: number
  perPage: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  activeTab: 'Shift(s)' | 'Calendar'
  onTabChange: (tab: 'Shift(s)' | 'Calendar') => void
}

function formatTime12(t?: string): string {
  if (!t) return '—'
  
  const trimmed = t.trim()
  // Already in 12h format (contains AM/PM)
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i)
  if (match12) {
    return `${match12[1].padStart(2, '0')}:${match12[2]} ${match12[3].toUpperCase()}`
  }
  if (/AM|PM/i.test(trimmed)) {
    return trimmed
  }

  // 24h format — convert
  const [h, m] = trimmed.slice(0, 5).split(':')
  if (!h || !m) return trimmed
  const hr = parseInt(h, 10)
  if (isNaN(hr)) return trimmed
  const ampm = hr >= 12 ? 'PM' : 'AM'
  const h12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr
  return `${String(h12).padStart(2, '0')}:${m} ${ampm}`
}

function typeColor(type: string): string {
  switch (type?.toLowerCase()) {
    case 'morning': return 'text-success-text bg-success-bg'
    case 'afternoon': return 'text-info-text bg-info-bg'
    case 'night': return 'text-error-text bg-error-bg'
    default: return 'text-t-body bg-card-alt'
  }
}

export default function ShiftMasterList({
  shifts,
  loading,
  search,
  filterBranchId,
  filterZoneId,
  filterStatus,
  filterShiftType,
  allBranches,
  allZones,
  onSearchChange,
  onFilterBranchChange,
  onFilterZoneChange,
  onFilterStatusChange,
  onFilterShiftTypeChange,
  onAdd,
  onEdit,
  onDelete,
  onView,
  selected,
  onSelectionChange,
  page,
  perPage,
  totalPages,
  totalCount,
  onPageChange,
  onPerPageChange,
  activeTab,
  onTabChange,
}: ShiftMasterListProps) {
  const { can } = usePermissions('Shift')
  const { branchId, isAdmin } = useBranchAccess()
  const canView = can('shift.show')
  const canCreate = can('shift.create')
  const canEdit = can('shift.edit')
  const canDelete = can('shift.delete')
  const selectedUuids = selected

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
    apiPath: '/shift/list',
    payload: {
      search: search ?? '',
      status: filterStatus,
      branch_id: !isAdmin && branchId ? String(branchId) : filterBranchId,
      shift_type: filterShiftType,
      ...(selectedUuids.length > 0 ? { check_uuid: selectedUuids } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'shifts',
  })

  const { handleExport, exporting } = useExport<Shift>({
    apiPath: '/shift/list',
    payload: {
      search: search ?? '',
      status: filterStatus,
      branch_id: !isAdmin && branchId ? String(branchId) : filterBranchId,
      shift_type: filterShiftType,
      ...(selectedUuids.length > 0 ? { check_uuid: selectedUuids } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    dataKey: 'shifts',
    columns: [
      { key: 'factory', header: 'Factory', value: (row) => row.branch?.branch_name ?? '' },
      { key: 'shift_name', header: 'Shift Name', value: (row) => row.shift_name ?? '' },
      { key: 'type', header: 'Type', value: (row) => row.type ?? '' },
      { key: 'start', header: 'Start', value: (row) => row.start ?? row.start_time ?? '' },
      { key: 'end', header: 'End', value: (row) => row.end ?? row.end_time ?? '' },
      { key: 'hrs', header: 'Hrs', value: (row) => row.hrs != null ? `${row.hrs}h` : '' },
      {
        key: 'breakMins', header: 'Break', value: (row) => {
          const b = row.breakMins ?? row.break;
          return b != null ? `${b}m` : '';
        }
      },
      { key: 'start_buffer_time', header: 'Buffer Login', value: (row) => formatTime12(row.start_buffer_time) },
      { key: 'end_buffer_time', header: 'Buffer Logout', value: (row) => formatTime12(row.end_buffer_time) },
      { key: 'status', header: 'Status', value: (row) => row.is_active === 1 ? 'Active' : 'Inactive' },
    ],
    filename: 'shifts',
  })

  const columns: AdvancedColumn<Shift>[] = [
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
      render: (_: Shift, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'factory',
      header: renderHeader('factory', 'Factory'),
      sortable: true,
      sortValue: (row) => row.branch?.branch_name ?? '',
      render: (row) => (
        <div>
          <span className="text-t-secondary block font-medium">{row.branch?.branch_name ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'shift_name',
      header: renderHeader('shift_name', 'Shift Name'),
      sortable: true,
      sortValue: (row) => row.shift_name ?? '',
      render: (row) => <span className="text-accent font-medium">{row.shift_name}</span>,
    },
    {
      key: 'type',
      header: renderHeader('type', 'Type'),
      render: (row) => (
        <span className={`inline-block px-2.5 py-0.5 rounded text-xs2 font-medium capitalize ${typeColor(row.type)}`}>
          {row.type}
        </span>
      ),
    },
    { key: 'start', header: renderHeader('start', 'Start'), render: (row) => <span className="text-t-body">{formatTime12(row.start ?? row.start_time)}</span> },
    { key: 'end', header: renderHeader('end', 'End'), render: (row) => <span className="text-t-body">{formatTime12(row.end ?? row.end_time)}</span> },
    { key: 'hrs', header: renderHeader('hrs', 'Hrs'), render: (row) => <span className="text-t-body font-semibold">{row.hrs != null ? `${row.hrs}h` : '—'}</span> },
    { key: 'breakMins', header: renderHeader('breakMins', 'Break'), render: (row) => { const b = row.breakMins ?? row.break; return <span className="text-t-body">{b != null ? `${b}m` : '—'}</span> } },
    { key: 'start_buffer_time', header: renderHeader('start_buffer_time', 'Buffer Login'), render: (row) => <span className="text-t-body">{formatTime12(row.start_buffer_time)}</span> },
    { key: 'end_buffer_time', header: renderHeader('end_buffer_time', 'Buffer Logout'), render: (row) => <span className="text-t-body">{formatTime12(row.end_buffer_time)}</span> },
    { key: 'status', header: renderHeader('status', 'Status'), render: (row) => <Badge variant={row.is_active === 1 ? 'success' : 'default'}>{row.is_active === 1 ? 'Active' : 'Inactive'}</Badge> },
  ]

  const getActions = (row: Shift): ActionItem[] => {
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

  const filters = (
    <>
      {/* Branch */}
      <select
        value={filterBranchId}
        onChange={e => onFilterBranchChange(e.target.value)}
        className={SELECT_CLASS}
      >
        <option value="">All Branches</option>
        {allBranches.map(b => (
          <option key={b.id} value={b.id}>{b.branch_name}</option>
        ))}
      </select>

      {/* Shift Type */}
      <select
        value={filterShiftType}
        onChange={e => onFilterShiftTypeChange(e.target.value)}
        className={SELECT_CLASS}
      >
        <option value="">All Types</option>
        {SHIFT_TYPES.map(t => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      {/* Status */}
      <select
        value={filterStatus}
        onChange={e => onFilterStatusChange(e.target.value)}
        className={SELECT_CLASS}
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </>
  )

  return (
    <>
      {activeTab === 'Shift(s)' ? (
        <AdvancedTable
          header={
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Tabs
                tabs={['Shift(s)', 'Calendar']}
                active={activeTab}
                onChange={tab => onTabChange(tab as 'Shift(s)' | 'Calendar')}
              />
              <Toolbar
                search={search}
                onSearchChange={onSearchChange}
                onAdd={canCreate ? onAdd : undefined}
                addLabel="Add Shift"
                onExport={() => handleExport({ check_box_heading: formatExportHeadings(selectedHeadings) })}
                onExportPdf={handleExportPdf}
                exporting={exporting || exportingPdf}
              >
                {filters}
              </Toolbar>
            </div>
          }
          columns={columns}
          data={shifts}
          loading={loading}
          emptyMessage="No shifts found"
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
          countLabel="shift"
        />
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <Tabs
              tabs={['Shift(s)', 'Calendar']}
              active={activeTab}
              onChange={tab => onTabChange(tab as 'Shift(s)' | 'Calendar')}
            />
            <Toolbar
              search={search}
              onSearchChange={onSearchChange}
              onAdd={onAdd}
              addLabel="Add Shift"
            />
          </div>
          <div className="bg-card rounded-card border border-header-line p-8 text-center text-t-lighter text-sm">
            Calendar view coming soon
          </div>
        </>
      )}
    </>
  )
}
