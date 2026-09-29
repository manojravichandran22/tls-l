'use client'

import { Eye, Pencil, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/formatDate'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import Badge from '@/components/ui/Badge'
import Tabs from '@/components/ui/Tabs'
import { useExportPdf } from '@/hooks/useExportPdf';
import { useExport } from '@/hooks/useExport';
import { type Shift, SHIFT_TYPES } from './types'
import { usePermissions } from '@/hooks/usePermissions'

interface ShiftModifyListProps {
  shifts: Shift[]
  loading: boolean
  search: string
  filterType: string
  filterShiftId: string
  filterStatus: string
  filterBranchId: string
  shiftsList: { id: number; shift_name: string }[]
  branchesList: { id: number; branch_name: string }[]
  onSearchChange: (val: string) => void
  onFilterTypeChange: (val: string) => void
  onFilterShiftChange: (val: string) => void
  onFilterStatusChange: (val: string) => void
  onFilterBranchChange: (val: string) => void
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
  const [h, m] = t.slice(0, 5).split(':')
  const hr = parseInt(h)
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

export default function ShiftModifyList({
  shifts,
  loading,
  search,
  filterType,
  filterShiftId,
  filterStatus,
  filterBranchId,
  shiftsList,
  branchesList,
  onSearchChange,
  onFilterTypeChange,
  onFilterShiftChange,
  onFilterStatusChange,
  onFilterBranchChange,
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
}: ShiftModifyListProps) {
  const { can } = usePermissions('Shift-Modify')

  const canView = can('shift_modify.list')
  const canCreate = can('shift_modify.create')
  const canEdit = can('shift_modify.update')
  const canDelete = can('shift_modify.delete')
  const canExport = can('shift_modify.show')
  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/shiftmodify/list',
    payload: {
      search: search ?? '',
      shift_type: filterType,
      shift_id: filterShiftId,
      status: filterStatus || 'all',
      branch_id: filterBranchId,
    },
    filename: 'shifts',
  });
  const { handleExport, exporting } = useExport<Shift>({
    apiPath: '/shiftmodify/list',
    payload: {
      search: search ?? '',
      shift_type: filterType,
      shift_id: filterShiftId,
      status: filterStatus || 'all',
      branch_id: filterBranchId,
    },
    dataKey: 'shifts',
    columns: [
      { header: 'Factory', value: (row) => row.branch?.branch_name ?? '' },
      { header: 'Zone', value: (row) => row.zone?.zone_name ?? '' },
      { header: 'Shift Name', value: (row) => row.shift_name ?? '' },
      { header: 'Type', value: (row) => row.type ?? '' },
      {
        header: 'Date',
        value: (row) => {
          const from = row.from_date ? formatDate(row.from_date) : ''
          const to = row.to_date ? formatDate(row.to_date) : ''
          if (from && to && from !== to) return `${from} - ${to}`
          return from || to || (row.date ? formatDate(row.date) : '')
        }
      },
      { header: 'Start', value: (row) => row.start ?? '' },
      { header: 'End', value: (row) => row.end ?? '' },
      { header: 'Hrs', value: (row) => row.hrs != null ? `${row.hrs}h` : '' },
      {
        header: 'Break', value: (row) => {
          // const b = row.breakMins ?? row.break;
          const b = row.break ?? row.break;
          return b != null ? `${b}m` : '';
        }
      },
      { header: 'Buffer', value: (row) => row.start_buffer_time?.slice(0, 5) ?? '' },
      { header: 'Status', value: (row) => row.is_active === 1 ? 'Active' : 'Inactive' },
    ],
    filename: 'shifts',
  });
  const columns: AdvancedColumn<Shift>[] = [
    {
      key: 'factory',
      header: 'Branch',
      sortable: true,
      sortValue: (row) => row.branch?.branch_name ?? '',
      render: (row) => (
        <div>
          <span className="text-t-secondary block font-medium">{row.branch?.branch_name ?? '—'}</span>
          <span className="text-t-lighter text-2xs">{row.zone?.zone_name ?? ''}</span>
        </div>
      ),
    },
    {
      key: 'shift_name',
      header: 'Shift Name',
      sortable: true,
      sortValue: (row) => row.shift_name ?? '',
      render: (row) => <span className="text-accent font-medium">{row.shift_name}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      sortValue: (row) => row.type ?? '',
      render: (row) => (
        <span className={`inline-block px-2.5 py-0.5 rounded text-xs2 font-medium capitalize ${typeColor(row.type)}`}>
          {row.type}
        </span>
      ),
    },
    { key: 'start', header: 'Start', sortable: true, sortValue: (row) => row.start ?? '', render: (row) => <span className="text-t-body">{formatTime12(row.start)}</span> },
    { key: 'end', header: 'End', sortable: true, sortValue: (row) => row.end ?? '', render: (row) => <span className="text-t-body">{formatTime12(row.end)}</span> },
    { key: 'hrs', header: 'Hrs', sortable: true, sortValue: (row) => row.hrs ?? 0, render: (row) => <span className="text-t-body font-semibold">{row.hrs}h</span> },
    { key: 'breakMins', header: 'Break', sortable: true, sortValue: (row) => row.break ?? 0, render: (row) => <span className="text-t-body">{row.break}m</span> },
    { key: 'buffer', header: 'Buffer ti...', sortable: true, sortValue: (row) => row.start_buffer_time ?? '', render: (row) => <span className="text-t-body">{row.start_buffer_time?.slice(0, 5) ?? '—'}</span> },
    {
      key: 'date',
      header: 'From Date & To Date',
      sortable: true,
      className: 'min-w-[200px]',
      sortValue: (row) => row.from_date ?? row.date ?? '',
      render: (row) => {
        const from = row.from_date ? formatDate(row.from_date) : ''
        const to = row.to_date ? formatDate(row.to_date) : ''
        if (from && to && from !== to) {
          return <span className="text-t-body text-xs font-medium whitespace-nowrap">{from} - {to}</span>
        }
        return <span className="text-t-body text-xs font-medium whitespace-nowrap">{from || to || formatDate(row.date)}</span>
      },
    },
    { key: 'status', header: 'Status', sortable: true, sortValue: (row) => row.is_active, render: (row) => <Badge variant={row.is_active === 1 ? 'success' : 'default'}>{row.is_active === 1 ? 'Active' : 'Inactive'}</Badge> },
  ]

  // const getActions = (row: Shift): ActionItem[] => [
  //   { label: 'View', icon: <Eye size={13} />, onClick: () => onView(row.uuid) },
  //   { label: 'Edit', icon: <Pencil size={13} />, onClick: () => onEdit(row) },
  //   { label: 'Delete', icon: <Trash2 size={13} />, onClick: () => onDelete(row), variant: 'danger' },
  // ]
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
                // onAdd={onAdd}
                onAdd={canCreate ? onAdd : undefined}
                addLabel="Add Shift Allocation"
                searchPlaceholder="Search by Shift Name, Type"
                onExport={handleExport}
                onExportPdf={handleExportPdf}
                exporting={exporting || exportingPdf}
              >
                <select
                  value={filterBranchId}
                  onChange={e => onFilterBranchChange(e.target.value)}
                  className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
                >
                  <option value="">All Branches</option>
                  {branchesList.map(b => (
                    <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
                  ))}
                </select>
                <select
                  value={filterShiftId}
                  onChange={e => onFilterShiftChange(e.target.value)}
                  className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
                >
                  <option value="">All Shifts</option>
                  {shiftsList.map(s => (
                    <option key={s.id} value={String(s.id)}>{s.shift_name}</option>
                  ))}
                </select>
                <select
                  value={filterType}
                  onChange={e => onFilterTypeChange(e.target.value)}
                  className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
                >
                  <option value="">All Types</option>
                  {SHIFT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
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
              // onAdd={onAdd}
              onAdd={canCreate ? onAdd : undefined}
              addLabel="Add Shift Allocation"
              searchPlaceholder="Search by Shift Name, Type"
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
