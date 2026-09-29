'use client'

import { useState, useMemo, useEffect } from 'react'
import { CheckCircle2, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import AdvancedTable, { type AdvancedColumn } from '@/components/ui/AdvancedTable'
import type { RejectionRecord } from '../types'
import type { BranchOption, ShiftOption, TeamOption } from '@/services/dropdownService'
import { rejectionSocket } from '@/services/socketService'
import * as XLSX from 'xlsx'

interface RejectionControlCenterListProps {
  records: RejectionRecord[]
  loading: boolean
  search: string
  branchFilter: string
  teamFilter: string
  shiftFilter: string
  statusFilter: string
  fromDate: string
  toDate: string
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  branches?: BranchOption[]
  teams?: TeamOption[]
  shifts?: ShiftOption[]
  onSearchChange: (val: string) => void
  onBranchFilterChange: (val: string) => void
  onTeamFilterChange: (val: string) => void
  onShiftFilterChange: (val: string) => void
  onStatusFilterChange: (val: string) => void
  onDateChange: (from: string, to: string) => void
  onPageChange: (p: number) => void
  onPerPageChange: (pp: number) => void
  onRefresh?: (isSilent?: boolean) => void
}

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

function parseOrder(raw?: string) {
  if (!raw) return { orderNo: '—', balance: '' }
  const parts = String(raw).trim().split(/\s+/)
  const orderNo = parts[0] || '—'
  // Demo100 and SDMO123 are the last two values
  const sdmo = parts.pop() || ''
  const demo = parts.pop() || ''
  const buyer = parts.slice(1).join(' ')
  const balance = [buyer, demo, sdmo]
    .filter(Boolean)
    .join(' | ')
  return { orderNo, balance }
}

export default function RejectionControlCenterList({
  records,
  loading,
  search,
  branchFilter,
  teamFilter,
  shiftFilter,
  statusFilter,
  branches = [],
  teams = [],
  shifts = [],
  onSearchChange,
  onBranchFilterChange,
  onTeamFilterChange,
  onShiftFilterChange,
  onStatusFilterChange,
  page,
  perPage,
  totalPages,
  totalCount,
  onPageChange,
  onPerPageChange,
  onRefresh,
}: RejectionControlCenterListProps) {
  const [updatingRecordIds, setUpdatingRecordIds] = useState<Set<string>>(new Set())
  const [liveSyncing, setLiveSyncing] = useState(false)

  useEffect(() => {
    rejectionSocket.connect()

    const handleLiveSocketData = (eventType: string, data: any) => {
      console.log(`⚡ [FRONTEND] Socket event '${eventType}':`, data)

      const rawId = data?.id ?? data?.rejection_id ?? data?.data?.id ?? data?.record_id
      const targetIdStr = rawId !== undefined && rawId !== null ? String(rawId) : null

      if (targetIdStr) {
        setUpdatingRecordIds((prev) => new Set(prev).add(targetIdStr))
      }
      setLiveSyncing(true)

      // SILENT REFETCH — keeps loading=false so whole table doesn't refresh/flash!
      if (onRefresh) {
        onRefresh(true)
      }

      setTimeout(() => {
        if (targetIdStr) {
          setUpdatingRecordIds((prev) => {
            const next = new Set(prev)
            next.delete(targetIdStr)
            return next
          })
        }
        setLiveSyncing(false)
      }, 2500)
    }

    rejectionSocket.on('connect', () => {
      console.log('🔌 [FRONTEND] Rejection socket connected:', rejectionSocket.id)
    })

    rejectionSocket.on('rejectionInserted', (data) => handleLiveSocketData('rejectionInserted', data))
    rejectionSocket.on('rejectionUpdated', (data) => handleLiveSocketData('rejectionUpdated', data))
    rejectionSocket.on('rejectionStatusChanged', (data) => handleLiveSocketData('rejectionStatusChanged', data))

    rejectionSocket.on('connect_error', (error) => console.error('❌ [FRONTEND] Socket connection error:', error))
    rejectionSocket.on('disconnect', (reason) => console.log('🔌 [FRONTEND] Rejection socket disconnected:', reason))

    return () => {
      rejectionSocket.off('connect')
      rejectionSocket.off('rejectionInserted')
      rejectionSocket.off('rejectionUpdated')
      rejectionSocket.off('rejectionStatusChanged')
      rejectionSocket.off('connect_error')
      rejectionSocket.off('disconnect')
      rejectionSocket.disconnect()
    }
  }, [onRefresh])

  // Status stats counters: 1->rejected, 2->pending/new, 3->moved to bulk / move to bulk
  const stats = useMemo(() => {
    const rejected = records.filter((r) => {
      const st = String(r.status || '').trim().toLowerCase()
      return st === '1' || st === 'reject' || st === 'rejected'
    }).length
    const pending = records.filter((r) => {
      const st = String(r.status || '').trim().toLowerCase()
      return st === '2' || st === 'pending' || st === 'new' || st === 'open' || st === '0'
    }).length
    const movedToBulk = records.filter((r) => {
      const st = String(r.status || '').trim().toLowerCase()
      return st === '3' || st.includes('bulk') || st.includes('move')
    }).length
    return { total: totalCount || records.length, rejected, pending, movedToBulk }
  }, [records, totalCount])

  const columns: AdvancedColumn<RejectionRecord>[] = [
    {
      key: 'shift',
      header: 'Shift',
      sortable: true,
      render: (row: RejectionRecord) => <span className="font-medium text-t-primary whitespace-nowrap">{row.shift || row.shift_name || '—'}</span>,
    },
    {
      key: 'zone',
      header: 'Zone',
      sortable: true,
      render: (row: RejectionRecord) => <span className="text-t-body whitespace-nowrap">{row.zone || row.zone_name || '—'}</span>,
    },
    {
      key: 'line_no',
      header: 'Line No',
      sortable: true,
      render: (row: RejectionRecord) => <span className="font-medium text-t-primary whitespace-nowrap">{row.line_no || row.line_name || '—'}</span>,
    },
    {
      key: 'order_no',
      header: 'Order No',
      sortable: true,
      sortValue: (row: RejectionRecord) => parseOrder(row.order_no).orderNo,
      render: (row: RejectionRecord) => {
        const { orderNo, balance } = parseOrder(row.order_no)
        return (
          <div className="flex flex-col min-w-[120px] max-w-[180px]">
            <span className="font-semibold text-t-primary text-xs whitespace-nowrap">
              {orderNo}
            </span>
            {balance ? (
              <span className="text-2xs text-t-lighter mt-0.5 truncate" title={balance}>
                {balance}
              </span>
            ) : null}
          </div>
        )
      },
    },
    {
      key: 'colour',
      header: 'Colour',
      sortable: true,
      render: (row: RejectionRecord) => <span className="text-t-body whitespace-nowrap">{row.colour || row.color_id || '—'}</span>,
    },
    {
      key: 'size',
      header: 'Size',
      sortable: true,
      render: (row: RejectionRecord) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#e8ecef] dark:bg-gray-700 text-[#4b5563] dark:text-gray-200 uppercase">
          {row.size || '—'}
        </span>
      ),
    },
    {
      key: 'employee_name',
      header: 'Employee Name',
      sortable: true,
      render: (row: RejectionRecord) => <span className="text-t-body whitespace-nowrap">{row.employee_name || row.Empname || '—'}</span>,
    },
    {
      key: 'employee_id_no',
      header: 'Employee ID',
      sortable: true,
      render: (row: RejectionRecord) => <span className="text-t-secondary text-xs font-mono whitespace-nowrap">{row.employee_id_no || row.employee_id || row.EmpId || '—'}</span>,
    },
    {
      key: 'machine_type',
      header: 'Machine Type',
      sortable: true,
      render: (row: RejectionRecord) => <span className="text-t-body whitespace-nowrap">{row.machine_type || row.machine_type_name || '—'}</span>,
    },
    {
      key: 'machine_id',
      header: 'Machine ID',
      sortable: true,
      render: (row: RejectionRecord) => <span className="text-t-secondary text-xs font-mono whitespace-nowrap">{row.machine_id || '—'}</span>,
    },
    {
      key: 'operation',
      header: 'Operation',
      sortable: true,
      render: (row: RejectionRecord) => <span className="text-t-body font-medium whitespace-nowrap">{row.operation || row.operation_name || '—'}</span>,
    },
    {
      key: 'defect_category',
      header: 'Defect Category',
      sortable: true,
      render: (row: RejectionRecord) => <span className="text-t-body whitespace-nowrap">{row.defect_category || row.category_name || '—'}</span>,
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (row: RejectionRecord) => {
        const rawSev = String(row.severity || row.severity_name || '').trim()
        const sev = rawSev.toLowerCase()

        let bg = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        if (sev.includes('minor')) {
          bg = 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
        } else if (sev.includes('medium')) {
          bg = 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
        } else if (sev.includes('major')) {
          bg = 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
        } else if (sev.includes('critical')) {
          bg = 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
        }

        return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${bg}`}>{rawSev || '—'}</span>
      },
    },
    {
      key: 'defect_found',
      header: 'Defect Found',
      sortable: true,
      render: (row: RejectionRecord) => <span className="font-medium text-t-body whitespace-nowrap">{row.defect_found || row.defect_name || '—'}</span>,
    },
    {
      key: 'defect_qty',
      header: 'Defect Qty',
      sortable: true,
      render: (row: RejectionRecord) => <span className="font-bold text-t-primary">{row.defect_qty ?? row.qty ?? 1}</span>,
    },
    {
      key: 'line_qc',
      header: 'Line QC',
      sortable: true,
      render: (row: RejectionRecord) => <span className="text-t-body whitespace-nowrap">{row.line_qc || '—'}</span>,
    },
    {
      key: 'line_qc_id',
      header: 'Line QC ID',
      sortable: true,
      render: (row: RejectionRecord) => <span className="text-t-secondary text-xs font-mono whitespace-nowrap">{row.line_qc_id || '—'}</span>,
    },
    {
      key: 'audit_time',
      header: 'Audit Time',
      sortable: true,
      render: (row: RejectionRecord) => (
        <span className="text-t-body text-xs whitespace-nowrap">
          {formatDateOnly(row.audit_time || row.tracker_work_audit_at || row.work_audit_at)} {formatTimeOnly(row.audit_time || row.tracker_work_audit_at || row.work_audit_at)}
        </span>
      ),
    },
    {
      key: 'elapsed_time_in_minutes',
      header: 'Elapsed Mins',
      sortable: true,
      render: (row: RejectionRecord) => <span className="font-medium text-amber-600 dark:text-amber-400">{row.elapsed_time_in_minutes ?? row.elapsed_mins ?? row.tracker_elapsed_time ?? 0}</span>,
    },
    {
      key: 'confirmed_by',
      header: 'Confirmed By',
      sortable: true,
      render: (row: RejectionRecord) => <span className="text-t-body whitespace-nowrap">{row.confirmed_by || row.tracker_confirmed_by_name || '—'}</span>,
    },
    {
      key: 'confirmation_time',
      header: 'Confirmation Time',
      sortable: true,
      render: (row: RejectionRecord) => (
        <span className="text-t-body text-xs whitespace-nowrap">
          {formatDateOnly(row.confirmation_time || row.tracker_confirmation_time)} {formatTimeOnly(row.confirmation_time || row.tracker_confirmation_time)}
        </span>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (row: RejectionRecord) => <span className="text-t-secondary text-xs">{row.notes || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      headerClassName: 'sticky right-0 bg-[#0d939d] text-white z-30 border-l border-[#0b828b] shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)]',
      className: 'sticky right-0 bg-card group-even:bg-card group-odd:bg-card-alt z-10 border-l border-table-line shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)] min-w-[125px]',
      render: (row: RejectionRecord) => {
        const rowIdStr = String(row.id)
        const isRowUpdating = updatingRecordIds.has(rowIdStr)
        const rawSt = String(row.status || '').trim()
        const st = rawSt.toLowerCase()

        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {isRowUpdating && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand animate-pulse border border-brand/20">
                <Loader2 size={11} className="animate-spin text-brand" /> Live
              </span>
            )}
            {st === '1' || st === 'reject' || st === 'rejected' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                <XCircle size={12} /> {st === '1' ? 'Rejected' : rawSt}
              </span>
            ) : st === '2' || st === 'pending' || st === 'new' || st === 'open' || st === '0' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                <Clock size={12} /> {st === '2' ? 'Pending' : rawSt}
              </span>
            ) : st === '3' || st.includes('bulk') || st.includes('move') ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 size={12} /> {st === '3' ? 'Move to Bulk' : rawSt}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {rawSt || '—'}
              </span>
            )}
          </div>
        )
      },
    },
  ]

  const handleExportExcel = () => {
    try {
      const exportData = records.map((r) => ({
        Shift: r.shift_name || r.shift,
        Zone: r.zone_name || r.zone,
        'Line No': r.line_no || r.line_name,
        'Order No': r.order_no,
        Colour: r.colour || r.color_id,
        Size: r.size,
        'Employee Name': r.employee_name || r.Empname,
        'Employee ID': r.employee_id_no || r.employee_id || r.emp_id,
        'Machine Type': r.machine_type || r.machine_type_name,
        'Machine ID': r.machine_id,
        Operation: r.operation_name || r.operation,
        'Defect Category': r.defect_category || r.category_name,
        Severity: r.severity || r.severity_name,
        'Defect Found': r.defect_found || r.defect_name,
        'Defect Qty': r.defect_qty ?? r.qty,
        'Line QC': r.line_qc,
        'Line QC ID': r.line_qc_id,
        'Audit Time': r.audit_time,
        'Elapsed Mins': r.elapsed_time_in_minutes ?? r.elapsed_mins,
        'Confirmed By': r.confirmed_by,
        'Confirmation Time': r.confirmation_time,
        Status: r.status,
        Notes: r.notes || '',
      }))
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rejection Control Center')
      XLSX.writeFile(workbook, `Rejection_Control_Center_Report_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (e) {
      console.error('Failed to export to Excel:', e)
    }
  }

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-table-line rounded-xl p-3.5 flex items-center justify-between shadow-xs" style={{ borderTop: '4px solid #006a71' }}>
          <div>
            <p className="text-xs text-t-secondary font-medium">Total Rejection Issues</p>
            <p className="text-xl font-bold text-t-primary mt-0.5">{stats.total}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <AlertCircle size={18} />
          </div>
        </div>

        <div className="bg-card border border-table-line rounded-xl p-3.5 flex items-center justify-between shadow-xs" style={{ borderTop: '4px solid #006a71' }}>
          <div>
            <p className="text-xs text-t-secondary font-medium">Rejected</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-0.5">{stats.rejected}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
            <XCircle size={18} />
          </div>
        </div>

        <div className="bg-card border border-table-line rounded-xl p-3.5 flex items-center justify-between shadow-xs" style={{ borderTop: '4px solid #006a71' }}>
          <div>
            <p className="text-xs text-t-secondary font-medium">Pending</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{stats.pending}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-card border border-table-line rounded-xl p-3.5 flex items-center justify-between shadow-xs" style={{ borderTop: '4px solid #006a71' }}>
          <div>
            <p className="text-xs text-t-secondary font-medium">Moved to Bulk</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.movedToBulk}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* Advanced Table */}
      <AdvancedTable<RejectionRecord>
        columns={columns}
        data={records}
        loading={loading}
        rowKey={(row) => String(row.id ?? Math.random())}
        header={
          <Toolbar
            title="Rejection Control Center"
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search order, employee, defect, line..."
          >
            {liveSyncing && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20 animate-pulse shrink-0">
                <Loader2 size={12} className="animate-spin text-brand" /> Live Records...
              </span>
            )}
            {/* Branch Filter Dropdown */}
            <select
              value={branchFilter}
              onChange={(e) => onBranchFilterChange(e.target.value)}
              className="h-8.5 px-3 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20 w-36 sm:w-40 shrink-0"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.branch_name}
                </option>
              ))}
            </select>

            {/* Shift Filter Dropdown */}
            <select
              value={shiftFilter}
              onChange={(e) => onShiftFilterChange(e.target.value)}
              className="h-8.5 px-3 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20 w-32 sm:w-36 shrink-0"
            >
              <option value="">All Shifts</option>
              {shifts.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.shift_name}
                </option>
              ))}
            </select>

            {/* Team Filter Dropdown */}
            <select
              value={teamFilter}
              onChange={(e) => onTeamFilterChange(e.target.value)}
              className="h-8.5 px-3 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20 w-36 sm:w-40 shrink-0"
            >
              <option value="">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.team_name || t.name || `Team ${t.id}`}
                </option>
              ))}
            </select>



            {/* Status Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="h-8.5 px-3 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20 w-32 sm:w-36 shrink-0"
            >
              <option value="all">All Status</option>
              <option value="1">Rejected</option>
              <option value="2">Pending</option>
              <option value="3">Moved to Bulk</option>
            </select>
          </Toolbar>
        }
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        emptyMessage=""
        tealHeader
      />
    </div>
  )
}
