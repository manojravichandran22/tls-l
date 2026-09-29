'use client'

import { useState, useEffect } from 'react'
import { Eye, Pencil, Trash2, X } from 'lucide-react'
import { formatDate } from '@/lib/formatDate'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import Badge from '@/components/ui/Badge'
import type { ManpowerPlanningItem } from './types'
import type { BranchOption, ShiftOption, TeamOption } from '@/services/dropdownService'
import { apiCall } from '@/services/apiClient'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'

interface TargetManpowerListProps {
  items: ManpowerPlanningItem[]
  loading: boolean
  search: string
  dateFilter: string
  branchFilter: string
  shiftFilter: string
  teamFilter: string
  branchesList: BranchOption[]
  shiftsList: ShiftOption[]
  teamsList: TeamOption[]
  onSearchChange: (val: string) => void
  onDateFilterChange: (val: string) => void
  onBranchFilterChange: (val: string) => void
  onShiftFilterChange: (val: string) => void
  onTeamFilterChange: (val: string) => void
  onAdd: () => void
  onAddWithSelection: (branchId: string, shiftId: string) => void
  onDelete: (item: ManpowerPlanningItem) => void
  onEdit: (item: ManpowerPlanningItem) => void
  onView: (item: ManpowerPlanningItem) => void
  page: number
  totalPages: number
  totalCount: number
  perPage: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onExport?: () => void
  onExportPdf?: () => void
  exporting?: boolean
}

export default function TargetManpowerList({
  items,
  loading,
  search,
  dateFilter,
  branchFilter,
  shiftFilter,
  teamFilter,
  branchesList = [],
  shiftsList = [],
  teamsList = [],
  onSearchChange,
  onDateFilterChange,
  onBranchFilterChange,
  onShiftFilterChange,
  onTeamFilterChange,
  onAddWithSelection,
  onDelete,
  onEdit,
  onView,
  page,
  totalPages,
  totalCount,
  perPage,
  onPageChange,
  onPerPageChange,
  onExport,
  onExportPdf,
  exporting = false,
}: TargetManpowerListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()

  // "Add mode" — when true, toolbar shows Branch + Shift selects instead of normal filters
  const [addMode, setAddMode] = useState(false)
  const [addBranchId, setAddBranchId] = useState('')
  const [addShiftId, setAddShiftId] = useState('')
  const [branchShifts, setBranchShifts] = useState<{ shift_id: number; shift_name: string }[]>([])
  const [loadingBranchShifts, setLoadingBranchShifts] = useState(false)

  // Auto-set branchId for non-admin users when adding
  useEffect(() => {
    if (!isAdmin && userBranchId && !addBranchId) {
      setAddBranchId(String(userBranchId))
    }
  }, [isAdmin, userBranchId, addBranchId])

  // Fetch shifts dynamically when Date and Branch are selected
  useEffect(() => {
    if (!addBranchId || !dateFilter) {
      setBranchShifts([])
      return
    }

    let isMounted = true
    setLoadingBranchShifts(true)

    apiCall<any>('/dropdown/shifts-by-branch', {
      method: 'GET',
      encrypt: false,
      payload: {
        planning_date: dateFilter,
        branch_id: addBranchId,
      },
    })
      .then((res) => {
        if (!isMounted) return
        const rawData = res?.data
        let list: { shift_id: number; shift_name: string }[] = []

        if (rawData && Array.isArray(rawData.shifts)) {
          list = rawData.shifts
        } else if (Array.isArray(rawData)) {
          list = rawData
        } else if (Array.isArray(res)) {
          list = res
        }

        setBranchShifts(list)
      })
      .catch((err) => {
        console.error('Failed to fetch shifts by branch:', err)
        if (isMounted) setBranchShifts([])
      })
      .finally(() => {
        if (isMounted) setLoadingBranchShifts(false)
      })

    return () => {
      isMounted = false
    }
  }, [addBranchId, dateFilter])

  // Auto-trigger when shift is selected (both branch + shift chosen)
  const handleShiftChange = (sId: string) => {
    setAddShiftId(sId)
    if (addBranchId && sId) {
      // Reset state before navigating
      setAddMode(false)
      setAddBranchId('')
      setAddShiftId('')
      onAddWithSelection(addBranchId, sId)
    }
  }

  const handleCancelAdd = () => {
    setAddMode(false)
    setAddBranchId('')
    setAddShiftId('')
  }

  const columns: AdvancedColumn<ManpowerPlanningItem>[] = [
    {
      key: '#',
      header: 'S.No',
      render: (_: ManpowerPlanningItem, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'planning_date',
      header: 'Planning Date',
      sortable: true,
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap">
          {formatDate(row.planning_date as string)}
        </span>
      ),
    },
    {
      key: 'branch',
      header: 'Branch Name',
      sortable: true,
      render: (row) => {
        const name =
          row.branch_name ||
          branchesList.find((b) => Number(b.id) === Number(row.branch_id))?.branch_name ||
          (row.branch_id ? `Branch ${row.branch_id}` : '—')
        return <span className="font-medium text-t-secondary">{name}</span>
      },
    },
    {
      key: 'shift',
      header: 'Shift Name',
      sortable: true,
      render: (row) => {
        const name =
          row.shift_name ||
          shiftsList.find((s) => Number(s.id) === Number(row.shift_id))?.shift_name ||
          (row.shift_id ? `Shift ${row.shift_id}` : '—')
        return <span className="text-accent font-medium">{name}</span>
      },
    },
    {
      key: 'team',
      header: 'Team Name',
      sortable: true,
      render: (row) => {
        const name =
          row.team_name ||
          teamsList.find((t) => Number(t.id) === Number(row.team_id))?.team_name ||
          (row.team_id ? `Team ${row.team_id}` : '—')
        return <span className="text-t-body">{name}</span>
      },
    },
    {
      key: 'working_hours',
      header: 'Working Hours',
      sortable: true,
      render: (row) => {
        const val = (row as any).overall_total?.working_hours ?? row.working_hours ?? '—'
        return <span className="text-t-body text-xs">{val}</span>
      },
    },
    {
      key: 'working_minutes',
      header: 'Working Minutes',
      sortable: true,
      render: (row) => {
        const val = (row as any).overall_total?.working_minutes ?? row.working_minutes ?? '—'
        return <span className="text-t-body text-xs">{val}</span>
      },
    },
    {
      key: 'direct_manpower',
      header: 'Direct Manpower',
      sortable: true,
      render: (row) => {
        const val = row.overall_total?.direct_manpower ?? row.direct_manpower ?? 0
        return <span className="text-t-body font-medium">{val}</span>
      },
    },
    {
      key: 'sam',
      header: 'SAM',
      sortable: true,
      render: (row) => {
        const val = (row as any).overall_total?.sam ?? row.sam ?? '—'
        return <span className="text-t-body font-medium">{val}</span>
      },
    },
    {
      key: 'target_efficiency',
      header: 'Target Efficiency (%)',
      sortable: true,
      render: (row) => {
        const val = row.overall_total?.target_efficiency ?? row.target_efficiency ?? 0
        return <span className="text-success-text font-medium">{val}%</span>
      },
    },
    {
      key: 'target_pcs',
      header: 'Target Pcs',
      sortable: true,
      render: (row) => {
        const val = row.overall_total?.target_pcs ?? row.target_pcs ?? 0
        return <span className="text-t-body font-semibold">{val}</span>
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      headerClassName: 'sticky right-10 z-30 bg-table-head shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] border-l border-header-line/60',
      className: 'sticky right-10 z-10 bg-card group-hover:bg-card-alt shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] border-l border-header-line/60',
      render: (row) => {
        const isActive =
          row.is_active === 1 ||
          String(row.status || '').toLowerCase() === 'active' ||
          row.status === 1 ||
          (row.is_active === undefined && row.status === undefined)
        return (
          <Badge variant={isActive ? 'success' : 'default'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
  ]

  const { can } = usePermissions('Manpowerplanning')
  const canCreate = can('manpowerplanning.create') || can('create')
  const canEdit = can('manpowerplanning.update') || can('update') || can('edit')
  const canView = can('manpowerplanning.show') || can('show')
  const canDelete = can('manpowerplanning.delete') || can('delete')

  const getActions = (row: ManpowerPlanningItem): ActionItem[] => {
    const isActive =
      row.is_active === 1 ||
      String(row.status || '').toLowerCase() === 'active' ||
      row.status === 1 ||
      (row.is_active === undefined && row.status === undefined)

    const actions: ActionItem[] = []
    if (canView) {
      actions.push({
        label: 'View',
        icon: <Eye size={13} />,
        onClick: () => onView(row),
      })
    }
    if (canEdit && isActive) {
      actions.push({
        label: 'Edit',
        icon: <Pencil size={13} />,
        onClick: () => onEdit(row),
      })
    }
    if (canDelete && isActive) {
      actions.push({
        label: 'Delete',
        icon: <Trash2 size={13} />,
        variant: 'danger',
        onClick: () => onDelete(row),
      })
    }
    return actions
  }

  // ── ADD MODE: only show the selection bar, no list ───────────────────────
  if (addMode) {
    return (
      <div className="space-y-0 rounded-lg overflow-hidden border border-primary/30">
        {/* Header row */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-primary/10 border-b border-primary/20">
          <span className="text-xs font-bold text-primary">
            Add Target &amp; Manpower Planning — Select Branch &amp; Shift
          </span>
          <button
            type="button"
            onClick={handleCancelAdd}
            className="flex items-center gap-1 h-6 px-2 text-xs font-medium rounded text-t-muted hover:text-t-title hover:bg-card-alt transition-colors cursor-pointer"
          >
            <X size={12} />
            Cancel
          </button>
        </div>

        {/* Selection row */}
        <div className="flex flex-wrap items-center gap-3 px-3 py-3 bg-primary/5">
          {/* Date picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-t-muted whitespace-nowrap">Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-primary/40 rounded-input outline-none transition-colors focus:border-primary"
            />
          </div>

          <div className="h-5 w-px bg-border/60 hidden sm:block" />

          {/* Branch */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-t-muted whitespace-nowrap">Branch <span className="text-error-text">*</span></span>
            <select
              value={addBranchId}
              onChange={(e) => { setAddBranchId(e.target.value); setAddShiftId('') }}
              disabled={!isAdmin && Boolean(userBranchId)}
              autoFocus
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-primary/40 rounded-input outline-none transition-colors focus:border-primary min-w-[160px] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">Select Branch</option>
              {branchesList.map((b) => (
                <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
              ))}
            </select>
          </div>

          {/* Shift — selecting shift auto-triggers form */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-t-muted whitespace-nowrap">Shift <span className="text-error-text">*</span></span>
            <select
              value={addShiftId}
              onChange={(e) => handleShiftChange(e.target.value)}
              disabled={!addBranchId || loadingBranchShifts || branchShifts.length === 0}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-primary/40 rounded-input outline-none transition-colors focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
            >
              <option value="">
                {!addBranchId
                  ? 'Select Branch First'
                  : loadingBranchShifts
                    ? 'Loading shifts...'
                    : branchShifts.length === 0
                      ? 'No shifts available'
                      : 'Select Shift'}
              </option>
              {branchShifts.map((s) => (
                <option key={s.shift_id} value={String(s.shift_id)}>
                  {s.shift_name}
                </option>
              ))}
            </select>
          </div>

          {/* Hint */}
          {addBranchId && !loadingBranchShifts && branchShifts.length === 0 && (
            <span className="text-xs text-error-text italic">
              No shifts allocated for this branch on the selected date.
            </span>
          )}
          {addBranchId && !addShiftId && branchShifts.length > 0 && (
            <span className="text-xs text-primary/70 italic">
              ↑ Select a shift to load the planning form
            </span>
          )}
        </div>
      </div>
    )
  }

  // ── NORMAL MODE: standard list with toolbar ───────────────────────────────
  return (
    <AdvancedTable<ManpowerPlanningItem>
      header={
        <Toolbar
          // search={search}
          // onSearchChange={onSearchChange}
          // searchPlaceholder="Search planning..."
          onAdd={canCreate ? () => setAddMode(true) : undefined}
          addLabel="Add Target & Manpower Planning"
          onExport={onExport}
          onExportPdf={onExportPdf}
          exporting={exporting}
        >
          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className="h-8.5 px-3 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20 w-36 shrink-0"
          />

          {/* Branch Filter */}
          {isAdmin && (
            <select
              value={branchFilter}
              onChange={(e) => onBranchFilterChange(e.target.value)}
              className="h-8.5 px-3 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20 w-36 sm:w-40 shrink-0"
            >
              <option value="">All Branches</option>
              {branchesList.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          )}

          {/* Shift Filter */}
          <select
            value={shiftFilter}
            onChange={(e) => onShiftFilterChange(e.target.value)}
            className="h-8.5 px-3 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20 w-32 sm:w-36 shrink-0"
          >
            <option value="">All Shifts</option>
            {shiftsList.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.shift_name || `Shift ${s.id}`}
              </option>
            ))}
          </select>

          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => onTeamFilterChange(e.target.value)}
            className="h-8.5 px-3 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20 w-36 sm:w-40 shrink-0"
          >
            <option value="">All Teams</option>
            {teamsList.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.team_name || t.name || `Team ${t.id}`}
              </option>
            ))}
          </select>
        </Toolbar>
      }
      columns={columns}
      data={items}
      loading={loading}
      rowKey={(row) => String(row.id || row.uuid || Math.random())}
      actions={getActions}
      emptyMessage="No Target & Manpower Planning records found"
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      perPage={perPage}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
    />
  )
}
