'use client'

import { useMemo } from 'react'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import ReportTable, { type ReportColumn } from '@/components/ui/ReportTable'
import DateRangePicker from '@/components/ui/DateRangePicker'
import type { RejectionSummaryRecord } from '../types'
import type { BranchOption, ShiftOption, TeamOption } from '@/hooks/useDropdownData'
import { useExport } from '@/hooks/useExport'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useBranchAccess } from '@/hooks/useBranchAccess'

function formatDateOnly(val?: string | null): string {
  if (!val) return '—'
  const trimmed = String(val).trim()
  if (!trimmed || trimmed === '—') return '—'

  const datePart = trimmed.split(/[\s,T]+/)[0]
  if (!datePart) return '—'

  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(datePart)) {
    const parts = datePart.split(/[\/\-]/)
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    const year = parts[2]
    return `${day}/${month}/${year}`
  }

  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(datePart)) {
    const parts = datePart.split(/[\/\-]/)
    const year = parts[0]
    const month = parts[1].padStart(2, '0')
    const day = parts[2].padStart(2, '0')
    return `${day}/${month}/${year}`
  }

  return datePart
}

function formatTimeOnly(val?: string | null): string {
  if (!val) return '—'
  const trimmed = String(val).trim()
  if (!trimmed || trimmed === '—') return '—'

  if (trimmed.includes('T')) {
    const timePart = trimmed.split('T')[1]
    return timePart ? timePart.slice(0, 5) : '—'
  }
  return trimmed
}

function getStatusText(status?: string | number | null): string {
  if (status === null || status === undefined) return 'Pending'
  const s = String(status).trim().toLowerCase()
  if (s === '1' || s === 'reject' || s === 'rejected') return 'Rejected'
  if (s === '2' || s === 'pending' || s === 'new' || s === 'open' || s === '0') return 'Pending'
  if (s === '3' || s === 'moved to bulk' || s === 'moved_to_bulk' || s === 'bulk') return 'Moved to Bulk'
  return String(status)
}

interface RejectionSummaryListProps {
  records: RejectionSummaryRecord[]
  loading: boolean
  search: string
  branchFilter: string
  teamFilter: string
  shiftFilter: string
  statusFilter: string
  fromDate: string
  toDate: string
  branches: BranchOption[]
  teams: TeamOption[]
  shifts: ShiftOption[]
  onSearchChange: (val: string) => void
  onBranchFilterChange: (val: string) => void
  onTeamFilterChange: (val: string) => void
  onShiftFilterChange: (val: string) => void
  onStatusFilterChange: (val: string) => void
  onDateRangeChange: (start: string, end: string) => void
  onRefresh?: () => void
}

export default function RejectionSummaryList({
  records,
  loading,
  search,
  branchFilter,
  teamFilter,
  shiftFilter,
  statusFilter,
  fromDate,
  toDate,
  branches,
  teams,
  shifts,
  onSearchChange,
  onBranchFilterChange,
  onTeamFilterChange,
  onShiftFilterChange,
  onStatusFilterChange,
  onDateRangeChange,
}: RejectionSummaryListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()

  // Filter records by statusFilter if specified
  const filteredRecords = useMemo(() => {
    let list = records || []

    if (statusFilter && statusFilter !== 'all') {
      list = list.filter((r) => {
        const st = String(r.status ?? '').trim().toLowerCase()
        const sf = String(statusFilter).trim().toLowerCase()
        if (sf === '1' || sf === 'reject' || sf === 'rejected') {
          return st === '1' || st === 'reject' || st === 'rejected'
        }
        if (sf === '2' || sf === 'pending') {
          return st === '2' || st === 'pending' || st === 'new' || st === 'open' || st === '0' || st === ''
        }
        if (sf === '3' || sf === 'moved to bulk' || sf === 'bulk') {
          return st === '3' || st === 'moved to bulk' || st === 'moved_to_bulk' || st === 'bulk'
        }
        return st === sf
      })
    }

    return list
  }, [records, statusFilter])

  const exportPayload = useMemo(() => {
    const p: Record<string, any> = {
      type: '',
      date_from: fromDate,
      date_to: toDate || fromDate,
    }
    if (branchFilter) p.branch_id = branchFilter
    if (shiftFilter) p.shift_id = shiftFilter
    if (teamFilter) p.team_id = teamFilter
    if (search) p.search = search
    if (statusFilter && statusFilter !== 'all') p.status = statusFilter
    return p
  }, [fromDate, toDate, branchFilter, shiftFilter, teamFilter, search, statusFilter])

  const { handleExport, exporting } = useExport({
    apiPath: '/report/rejectionreport',
    payload: exportPayload,
    filename: 'Rejection_Summary_Report',
  })

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/report/rejectionreport',
    payload: exportPayload,
    filename: 'Rejection_Summary_Report',
  })

  // Web Table Columns Definition
  const columns: ReportColumn<RejectionSummaryRecord>[] = [
    {
      key: 'index',
      header: 'S.No',
      render: (_: RejectionSummaryRecord, i: number) => (
        <span className="text-t-primary font-medium">{i + 1}</span>
      ),
      footer: () => <span className="font-bold text-white">Total</span>,
    },
    {
      key: 'branch_name',
      header: 'Branch Name',
      sortable: true,
      sortValue: (row) => row.branch_name || (row as any).branch || '',
      render: (row) => (
        <span className="text-t-body font-medium whitespace-nowrap">
          {row.branch_name || (row as any).branch || '—'}
        </span>
      ),
    },
    {
      key: 'shift_name',
      header: 'Shift Name',
      sortable: true,
      sortValue: (row) => row.shift_name || row.slot_name || String(row.shift_id || ''),
      render: (row) => (
        <span className="text-t-body font-medium whitespace-nowrap">
          {row.shift_name || row.slot_name || row.shift_id || '—'}
        </span>
      ),
    },
    {
      key: 'team_name',
      header: 'Team Name',
      sortable: true,
      sortValue: (row) => row.team_name || '',
      render: (row) => (
        <span className="text-t-body font-medium whitespace-nowrap">
          {row.team_name || '—'}
        </span>
      ),
    },
    {
      key: 'zone_name',
      header: 'Zone Name',
      sortable: true,
      sortValue: (row) => row.zone_name || '',
      render: (row) => <span className="text-t-body font-medium whitespace-nowrap">{row.zone_name || '—'}</span>,
    },
    {
      key: 'line_name',
      header: 'Line Name',
      sortable: true,
      sortValue: (row) => row.line_name || String(row.line_id || ''),
      render: (row) => (
        <span className="text-[#007b83] dark:text-[#2dd4bf] font-semibold whitespace-nowrap">
          {row.line_name || (row.line_id ? `Line ${row.line_id}` : '—')}
        </span>
      ),
    },
    {
      key: 'rejection_code',
      header: 'Rejection Id',
      sortable: true,
      sortValue: (row) => String(row.rejection_code || ''),
      render: (row) => (
        <span className="text-t-secondary text-xs font-mono whitespace-nowrap">
          {row.rejection_code || '—'}
        </span>
      ),
    },
    {
      key: 'order_no',
      header: 'Order No',
      sortable: true,
      sortValue: (row) => row.order_no || row.order_code || '',
      render: (row) => (
        <span className="text-t-body font-medium whitespace-nowrap">
          {row.order_no || row.order_code || '—'}
        </span>
      ),
    },
    {
      key: 'colour',
      header: 'Colour',
      sortable: true,
      sortValue: (row) => row.colour || row.color_id || '',
      render: (row) => <span className="text-t-body font-medium whitespace-nowrap">{row.colour || row.color_id || '—'}</span>,
    },
    {
      key: 'employee_code',
      header: 'Employee ID',
      sortable: true,
      sortValue: (row) => String((row as any).employee_code || row.emp_id || ''),
      render: (row) => <span className="text-t-secondary text-xs font-mono whitespace-nowrap">{(row as any).employee_code || row.emp_id || '—'}</span>,
    },
    {
      key: 'employee_name',
      header: 'Employee Name',
      sortable: true,
      sortValue: (row) => row.employee_name || row.name || '',
      render: (row) => <span className="text-t-body whitespace-nowrap font-medium">{row.employee_name || row.name || '—'}</span>,
    },
    {
      key: 'operation_name',
      header: 'Operation Name',
      sortable: true,
      sortValue: (row) => row.operation_name || String(row.operation_id || ''),
      render: (row) => <span className="text-t-body font-medium whitespace-nowrap">{row.operation_name || row.operation_id || '—'}</span>,
    },
    {
      key: 'category_name',
      header: 'Category Name',
      sortable: true,
      sortValue: (row) => row.category_name || String(row.category_id || ''),
      render: (row) => <span className="text-t-body whitespace-nowrap">{row.category_name || row.category_id || '—'}</span>,
    },
    {
      key: 'severity_name',
      header: 'Severity Name',
      sortable: true,
      sortValue: (row) => row.severity_name || String(row.severity_id || ''),
      render: (row) => {
        const sev = String(row.severity_name || '').toLowerCase()
        const bg =
          sev === 'minor' || sev === 'major'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            : sev === 'critical'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${bg}`}>{row.severity_name || '—'}</span>
      },
    },
    {
      key: 'defect_name',
      header: 'Defect Name',
      sortable: true,
      sortValue: (row) => row.defect_name || String(row.defect_id || ''),
      render: (row) => <span className="font-medium text-red-600 dark:text-red-400 whitespace-nowrap">{row.defect_name || row.defect_id || '—'}</span>,
    },
    {
      key: 'size',
      header: 'Size',
      sortable: true,
      sortValue: (row) => row.size || '',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#e8ecef] dark:bg-gray-700 text-[#4b5563] dark:text-gray-200 uppercase">
          {row.size || '—'}
        </span>
      ),
    },
    {
      key: 'qty',
      header: 'Qty',
      sortable: true,
      sortValue: (row) => Number(row.qty ?? 1),
      render: (row) => <span className="font-medium text-t-body">{row.qty ?? 1}</span>,
      footer: (data) => {
        const totalQty = data.reduce((sum, r) => sum + Number(r.qty ?? 1), 0)
        return <span className="font-bold text-white">{totalQty.toLocaleString()}</span>
      },
    },
    {
      key: 'tracker_elapsed_time',
      header: 'Elapsed Time In Minutes',
      sortable: true,
      sortValue: (row) => Number(row.tracker_elapsed_time ?? 0),
      render: (row) => <span className="font-medium text-t-body">{row.tracker_elapsed_time ?? '—'}</span>,
    },
    {
      key: 'machine_type_name',
      header: 'Machine Type',
      sortable: true,
      sortValue: (row) => row.machine_type_name || row.machine_type || String(row.machine_type_id || ''),
      render: (row) => <span className="text-t-body whitespace-nowrap">{row.machine_type_name || row.machine_type || row.machine_type_id || '—'}</span>,
    },
    {
      key: 'machine_no',
      header: 'Machine No',
      sortable: true,
      sortValue: (row) => String(row.machine_no || row.machine_id || ''),
      render: (row) => (
        <span className="text-t-body text-xs font-semibold whitespace-nowrap">
          {row.machine_no || (row.machine_id ? String(row.machine_id) : '—')}
        </span>
      ),
    },
    {
      key: 'line_qc',
      header: 'Line QC',
      sortable: true,
      sortValue: (row) => row.line_qc || '',
      render: (row) => <span className="text-t-body whitespace-nowrap">{row.line_qc || '—'}</span>,
    },
    {
      key: 'line_qc_id',
      header: 'Line QC ID',
      sortable: true,
      sortValue: (row) => String(row.line_qc_id || ''),
      render: (row) => <span className="text-t-secondary text-xs font-mono whitespace-nowrap">{row.line_qc_id || '—'}</span>,
    },
    {
      key: 'tracker_work_audit_at',
      header: 'Audit Time',
      sortable: true,
      sortValue: (row) => row.tracker_work_audit_at || row.work_audit_at || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap font-medium">
          {formatDateOnly(row.tracker_work_audit_at || row.work_audit_at)} {formatTimeOnly(row.tracker_work_audit_at || row.work_audit_at)}
        </span>
      ),
    },
    {
      key: 'tracker_confirmed_by_name',
      header: 'Confirmed By',
      sortable: true,
      sortValue: (row) => row.tracker_confirmed_by_name || row.tracker_work_audit_by || row.work_audit_by || '',
      render: (row) => <span className="text-t-body whitespace-nowrap">{row.tracker_confirmed_by_name || row.tracker_work_audit_by || row.work_audit_by || '—'}</span>,
    },
    {
      key: 'tracker_confirmation_time',
      header: 'Confirmation Time',
      sortable: true,
      sortValue: (row) => row.tracker_confirmation_time || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap font-medium">
          {formatDateOnly(row.tracker_confirmation_time)} {formatTimeOnly(row.tracker_confirmation_time)}
        </span>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      sortable: true,
      sortValue: (row) => row.notes || '',
      render: (row) => <span className="text-t-secondary text-xs truncate max-w-[150px]" title={row.notes || ''}>{row.notes || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (row) => (row as any).status_name || getStatusText(row.status),
      render: (row) => {
        const rawSt = String((row as any).status_name || row.status || '').trim()
        const st = rawSt.toLowerCase()

        if (st === '1' || st === 'reject' || st === 'rejected') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
              <XCircle size={12} /> Reject
            </span>
          )
        }
        if (st === '2' || st === 'pending' || st === 'new' || st === 'open' || st === '0') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <Clock size={12} /> Pending
            </span>
          )
        }
        if (st === '3' || st === 'moved to bulk' || st === 'moved_to_bulk' || st === 'bulk' || st === 'fail' || st === 'failed') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={12} /> {st.includes('bulk') ? 'Moved to Bulk' : (rawSt || 'Fail')}
            </span>
          )
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {rawSt || '—'}
          </span>
        )
      },
    },
  ]

  return (
    <ReportTable<RejectionSummaryRecord>
      columns={columns}
      data={filteredRecords}
      loading={loading}
      rowKey={(r) => String(r.id || r.uuid || Math.random())}
      header={
        <Toolbar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search order, employee, defect..."
          showExport
          onExport={handleExport}
          onExportPdf={handleExportPdf}
          exporting={exporting || exportingPdf}
        >
          <div className="flex items-center gap-1.5 flex-nowrap">
            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => onBranchFilterChange(e.target.value)}
              disabled={!isAdmin && Boolean(userBranchId)}
              className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[110px] shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {!(!isAdmin && userBranchId) && <option value="">All Branches</option>}
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.branch_name}
                </option>
              ))}
            </select>

              {/* Shift Filter */}
            <select
              value={shiftFilter}
              onChange={(e) => onShiftFilterChange(e.target.value)}
              className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[100px] shrink-0"
            >
              <option value="">All Shifts</option>
              {shifts.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.shift_name}
                </option>
              ))}
            </select>

            {/* Team Filter */}
            <select
              value={teamFilter}
              onChange={(e) => onTeamFilterChange(e.target.value)}
              className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[100px] shrink-0"
            >
              <option value="">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.team_name || t.name || `Team ${t.id}`}
                </option>
              ))}
            </select>

          

            <div className="relative z-[9999] w-[190px] shrink-0">
              <DateRangePicker
                startDate={fromDate}
                endDate={toDate}
                onChange={onDateRangeChange}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[125px] shrink-0"
            >
              <option value="all">All Status</option>
              <option value="1">Rejected</option>
              <option value="2">Pending</option>
              <option value="3">Moved to Bulk</option>
            </select>
          </div>
        </Toolbar>
      }
      totalCount={filteredRecords.length}
      emptyMessage="No rejection records found for selected criteria"
      countLabel="rejection report"
      countLabelPlural="rejection reports"
    />
  )
}
