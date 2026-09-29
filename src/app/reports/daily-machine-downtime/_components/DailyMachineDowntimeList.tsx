'use client'

import { useMemo } from 'react'
import {
  Clock,
  Timer,
  AlertTriangle,
  DollarSign,
  Layers,
} from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import ReportTable, { type ReportColumn } from '@/components/ui/ReportTable'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import type { DailyMachineDowntimeRecord, DailyMachineDowntimeSummary } from '../types'
import type { BranchOption, TeamOption, ShiftOption, ZoneOption, LineOption } from '@/hooks/useDropdownData'
import { useExport, type ExportColumn } from '@/hooks/useExport'
import { useExportPdf } from '@/hooks/useExportPdf'

interface DailyMachineDowntimeListProps {
  records: DailyMachineDowntimeRecord[]
  summary?: DailyMachineDowntimeSummary
  loading: boolean
  search: string
  branchFilter: string
  teamFilter: string
  shiftFilter: string
  zoneFilter?: string
  lineFilter?: string
  fromDate: string
  toDate: string
  branches?: BranchOption[] | { id: number; name: string }[]
  teams?: TeamOption[] | { id: number; name: string }[]
  shifts?: ShiftOption[] | { id: number; name: string; shift_name?: string }[]
  zones?: ZoneOption[] | { id: number; name: string }[]
  lines?: LineOption[] | { id: number; name: string }[]
  onSearchChange: (val: string) => void
  onBranchFilterChange: (val: string) => void
  onTeamFilterChange: (val: string) => void
  onShiftFilterChange: (val: string) => void
  onZoneFilterChange?: (val: string) => void
  onLineFilterChange?: (val: string) => void
  onDateRangeChange: (start: string, end: string) => void
  onRefresh?: () => void
}

function formatAuditTime(timeStr?: string | null): string {
  if (!timeStr) return '—'
  try {
    const d = new Date(timeStr)
    if (isNaN(d.getTime())) return String(timeStr)
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return String(timeStr)
  }
}

export default function DailyMachineDowntimeList({
  records,
  summary,
  loading,
  search,
  branchFilter,
  teamFilter,
  shiftFilter,
  zoneFilter = '',
  lineFilter = '',
  fromDate,
  toDate,
  branches = [],
  teams = [],
  shifts = [],
  zones = [],
  lines = [],
  onSearchChange,
  onBranchFilterChange,
  onTeamFilterChange,
  onShiftFilterChange,
  onZoneFilterChange,
  onLineFilterChange,
  onDateRangeChange,
}: DailyMachineDowntimeListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const filteredRecords = records || []

  // ── KPI Summary Calculations ───────────────────────────────────────────────
  const totalDowntime = useMemo(() => {
    if (summary?.total_downtime !== undefined && summary?.total_downtime !== null) {
      return Number(summary.total_downtime)
    }
    return filteredRecords.reduce((sum, r) => sum + (Number(r.elapsed_time) || 0), 0)
  }, [summary, filteredRecords])

  const avgDowntime = useMemo(() => {
    if (summary?.avg_downtime !== undefined && summary?.avg_downtime !== null) {
      return Number(summary.avg_downtime)
    }
    if (filteredRecords.length === 0) return 0
    return Math.round((totalDowntime / filteredRecords.length) * 10) / 10
  }, [summary, filteredRecords, totalDowntime])

  const totalEstLoss = useMemo(() => {
    if (summary?.total_loss !== undefined && summary?.total_loss !== null) {
      return Number(summary.total_loss)
    }
    return filteredRecords.reduce((sum, r) => sum + (Number(r.loss ?? r.total_loss) || 0), 0)
  }, [summary, filteredRecords])

  const categorySummary = useMemo(() => {
    const categoriesSet = new Set<string>()
    filteredRecords.forEach((r) => {
      if (r.category_name) categoriesSet.add(r.category_name.trim())
    })
    const list = Array.from(categoriesSet)
    if (list.length === 0) return { title: 'Machine', subtitle: '0 Categories' }
    if (list.length === 1) return { title: list[0], subtitle: '1 Category' }
    return {
      title: `${list.length} Categories`,
      subtitle: `${list.slice(0, 2).join(', ')}${list.length > 2 ? ' +more' : ''}`,
    }
  }, [filteredRecords])

  const avgCostPerMin = useMemo(() => {
    if (summary?.avg_cost_per_min !== undefined && summary?.avg_cost_per_min !== null) {
      return Number(summary.avg_cost_per_min)
    }
    if (filteredRecords.length === 0) return 0
    const sumCost = filteredRecords.reduce((sum, r) => sum + (Number(r.cost_per_min) || 0), 0)
    return Math.round((sumCost / filteredRecords.length) * 100) / 100
  }, [summary, filteredRecords])

  // ── Export Payload ──────────────────────────────────────────────────────────
  const exportPayload = useMemo(() => {
    const p: Record<string, any> = {
      type: '',
      date_from: fromDate,
      date_to: toDate || fromDate,
    }
    if (branchFilter) p.branch_id = branchFilter
    if (shiftFilter) p.shift_id = shiftFilter
    if (teamFilter) p.team_id = teamFilter
    if (zoneFilter) p.zone_id = zoneFilter
    if (lineFilter) p.line_id = lineFilter
    if (search) p.search = search
    return p
  }, [fromDate, toDate, branchFilter, shiftFilter, teamFilter, zoneFilter, lineFilter, search])

  const exportColumns: ExportColumn<DailyMachineDowntimeRecord>[] = useMemo(
    () => [
      { header: 'Shift', value: (r) => r.shift_name || r.shift_allocation_name || '' },
      { header: 'Team', value: (r) => r.team_name || '' },
      { header: 'Zone', value: (r) => r.zone_name || '' },
      { header: 'Line', value: (r) => r.line_name || '' },
      { header: 'Order No', value: (r) => r.order_no || '' },
      { header: 'Color', value: (r) => r.colour || r.color || '' },
      { header: 'Buyer', value: (r) => r.buyer_name || '' },
      { header: 'Style Name', value: (r) => r.style_name || '' },
      { header: 'Style No', value: (r) => r.style_no || '' },
      { header: 'Factory', value: (r) => r.branch_name || '' },
      { header: 'Defect Category', value: (r) => r.category_name || '' },
      { header: 'Defect Type', value: (r) => r.defect_name || '' },
      { header: 'Severity', value: (r) => r.severity_name || '—' },
      { header: 'Elapsed Time (Min)', value: (r) => String(r.elapsed_time ?? 0) },
      { header: 'Cost Per Min (₹)', value: (r) => String(r.cost_per_min ?? 0) },
      { header: 'Total Loss (₹)', value: (r) => String(r.loss ?? r.total_loss ?? 0) },
      { header: 'Machine No', value: (r) => r.machine_no || '' },
      { header: 'Machine Name', value: (r) => r.machine_type_name || r.machine_name || '' },
      { header: 'Mechanic No', value: (r) => r.mechanic_code || r.mechanic_no || '' },
      { header: 'Mechanic Name', value: (r) => r.mechanic_name || '' },
      { header: 'Auditor Name', value: (r) => r.auditor_name || '' },
      { header: 'Auditor ID', value: (r) => r.auditor_id || '' },
      { header: 'Audit Time', value: (r) => formatAuditTime(r.audit_time) },
    ],
    []
  )

  const { handleExport, exporting } = useExport<DailyMachineDowntimeRecord>({
    apiPath: '/report/dailymachinedowntime',
    payload: exportPayload,
    dataKey: 'data',
    columns: exportColumns,
    filename: 'Daily_Machine_Downtime_Report',
    method: 'POST',
  })

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/report/dailymachinedowntime',
    payload: exportPayload,
    filename: 'Daily_Machine_Downtime_Report',
  })

  // ── Table Columns Definition (Styled matching TLS Audit Module) ────────────
  const columns: ReportColumn<DailyMachineDowntimeRecord>[] = [
    {
      key: 's_no',
      header: '#',
      render: (r, i) => <span className="text-t-primary font-medium">{r.s_no ?? i + 1}</span>,
      footer: () => <span className="font-bold text-white">Summary</span>,
    },
    {
      key: 'branch_name',
      header: 'Branch',
      sortable: true,
      sortValue: (r) => r.branch_name || (r as any).branch || '',
      render: (r) => <span className="text-t-body text-xs font-medium whitespace-nowrap">{r.branch_name || (r as any).branch || '—'}</span>,
    },
    {
      key: 'shift_name',
      header: 'Shift',
      sortable: true,
      sortValue: (r) => r.shift_name || r.shift_allocation_name || '',
      render: (r) => <span className="text-t-body text-xs font-medium whitespace-nowrap">{r.shift_name || r.shift_allocation_name || '—'}</span>,
    },
    {
      key: 'team_name',
      header: 'Team',
      sortable: true,
      sortValue: (r) => r.team_name || '',
      render: (r) => <span className="text-t-body text-xs font-medium whitespace-nowrap">{r.team_name || '—'}</span>,
    },
    {
      key: 'zone_name',
      header: 'Zone',
      sortable: true,
      sortValue: (r) => r.zone_name || '',
      render: (r) => <span className="text-t-body text-xs font-medium whitespace-nowrap">{r.zone_name || '—'}</span>,
    },
    {
      key: 'line_name',
      header: 'Line',
      sortable: true,
      sortValue: (r) => r.line_name || '',
      render: (r) => (
        <span className="text-[#007b83] dark:text-[#2dd4bf] text-xs font-semibold whitespace-nowrap">
          {r.line_name || '—'}
        </span>
      ),
    },
    {
      key: 'order_no',
      header: 'Order No',
      sortable: true,
      sortValue: (r) => r.order_no || '',
      render: (r) => (
        <span className="text-[#007b83] dark:text-[#2dd4bf] text-xs font-semibold whitespace-nowrap">
          {r.order_no || '—'}
        </span>
      ),
    },
    {
      key: 'colour',
      header: 'Color',
      sortable: true,
      sortValue: (r) => r.colour || r.color || '',
      render: (r) => <span className="text-t-body text-xs font-medium whitespace-nowrap">{r.colour || r.color || '—'}</span>,
    },
    {
      key: 'buyer_name',
      header: 'Buyer',
      sortable: true,
      sortValue: (r) => r.buyer_name || '',
      render: (r) => <span className="text-t-body text-xs whitespace-nowrap">{r.buyer_name || '—'}</span>,
    },
    {
      key: 'style_name',
      header: 'Style Name',
      sortable: true,
      sortValue: (r) => r.style_name || '',
      render: (r) => (
        <span className="text-t-body text-xs font-semibold whitespace-nowrap">
          {r.style_name || '—'}
        </span>
      ),
    },
    {
      key: 'style_no',
      header: 'Style No',
      sortable: true,
      sortValue: (r) => r.style_no || '',
      render: (r) => <span className="text-t-body text-xs font-medium whitespace-nowrap">{r.style_no || '—'}</span>,
    },
    {
      key: 'category_name',
      header: 'Defect Category',
      sortable: true,
      sortValue: (r) => r.category_name || '',
      render: (r) => (
        <span className="text-t-body text-xs font-medium whitespace-nowrap">
          {r.category_name || '—'}
        </span>
      ),
    },
    {
      key: 'defect_name',
      header: 'Defect Type',
      sortable: true,
      sortValue: (r) => r.defect_name || '',
      render: (r) => <span className="font-semibold text-xs text-red-600 dark:text-red-400 whitespace-nowrap">{r.defect_name || '—'}</span>,
    },
    {
      key: 'severity_name',
      header: 'Severity',
      sortable: true,
      sortValue: (r) => r.severity_name || '',
      render: (r) => (
        <span className="text-t-body text-xs font-medium whitespace-nowrap">
          {r.severity_name || '—'}
        </span>
      ),
    },
    
    {
      key: 'elapsed_time',
      header: 'Elapsed Time',
      sortable: true,
      sortValue: (r) => Number(r.elapsed_time ?? 0),
      render: (r) => <span className="text-t-body text-xs font-medium whitespace-nowrap">{r.elapsed_time ?? 0} Min</span>,
      footer: (data) => {
        const sum = data.reduce((acc, row) => acc + (Number(row.elapsed_time) || 0), 0)
        return <span className="font-bold text-white">{sum.toLocaleString()} Min</span>
      },
    },
    {
      key: 'cost_per_min',
      header: 'Cost / Min',
      sortable: true,
      sortValue: (r) => Number(r.cost_per_min ?? 0),
      render: (r) => <span className="text-t-body text-xs font-medium">₹ {r.cost_per_min ?? 0}</span>,
      footer: (data) => {
        if (data.length === 0) return <span className="font-bold text-white">₹ 0</span>
        const avg = data.reduce((acc, row) => acc + (Number(row.cost_per_min) || 0), 0) / data.length
        return <span className="font-bold text-white">₹ {avg.toFixed(2)}</span>
      },
    },
    {
      key: 'loss',
      header: 'Total Loss',
      sortable: true,
      sortValue: (r) => Number(r.loss ?? r.total_loss ?? 0),
      render: (r) => <span className="font-bold text-xs text-red-600 dark:text-red-400">₹ {r.loss ?? r.total_loss ?? 0}</span>,
      footer: (data) => {
        const sum = data.reduce((acc, row) => acc + (Number(row.loss ?? row.total_loss) || 0), 0)
        return <span className="font-bold text-white">₹ {sum.toLocaleString()}</span>
      },
    },
    {
      key: 'machine_no',
      header: 'Machine No',
      sortable: true,
      sortValue: (r) => r.machine_no || '',
      render: (r) => (
        <span className="text-t-body text-xs font-semibold whitespace-nowrap">
          {r.machine_no || '—'}
        </span>
      ),
    },
    {
      key: 'machine_name',
      header: 'Machine Name',
      sortable: true,
      sortValue: (r) => r.machine_type_name || r.machine_name || '',
      render: (r) => (
        <span className="text-t-body text-xs font-semibold whitespace-nowrap">
          {r.machine_type_name || r.machine_name || '—'}
        </span>
      ),
    },
    {
      key: 'mechanic_code',
      header: 'Mechanic No',
      sortable: true,
      sortValue: (r) => r.mechanic_code || r.mechanic_no || '',
      render: (r) => (
        <span className="text-t-body text-xs font-semibold whitespace-nowrap">
          {r.mechanic_code || r.mechanic_no || '—'}
        </span>
      ),
    },
    {
      key: 'mechanic_name',
      header: 'Mechanic Name',
      sortable: true,
      sortValue: (r) => r.mechanic_name || '',
      render: (r) => (
        <span className="text-t-body text-xs font-semibold whitespace-nowrap">
          {r.mechanic_name || '—'}
        </span>
      ),
    },
    // ── Auditor Name (Matching TLS Audit Operator/Auditor Format) ─────────────
    {
      key: 'audit_name',
      header: 'Auditor Name',
      sortable: true,
      sortValue: (r) => r.auditor_name || r.audit_name || r.employee_name || r.emp_name || r.operator_name || '',
      render: (r) => (
        <span className="text-t-body text-xs font-semibold whitespace-nowrap">
          {r.auditor_name || r.audit_name || r.employee_name || r.emp_name || r.operator_name || '—'}
        </span>
      ),
    },
    // ── Auditor ID / QC ID (Matching TLS Audit QC ID Badge Format) ───────────
    {
      key: 'audit_id',
      header: 'Auditor ID',
      sortable: true,
      sortValue: (r) => r.auditor_id || r.audit_id || r.employee_id || r.emp_id || r.operator_id || '',
      render: (r) => (
        <span className="text-t-body text-xs font-medium whitespace-nowrap">
          {r.auditor_id || r.audit_id || r.employee_id || r.emp_id || r.operator_id || '—'}
        </span>
      ),
    },
    {
      key: 'audit_time',
      header: 'Audit Time',
      sortable: true,
      sortValue: (r) => r.audit_time || '',
      render: (r) => (
        <span className="text-t-body text-xs whitespace-nowrap font-medium">
          {formatAuditTime(r.audit_time)}
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── KPI Summary Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 px-4 pt-4 pb-1">
        {/* Card 1: Defect Category */}
        <div
          className="bg-card border border-border/60 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
          style={{ borderTop: '4px solid #2563eb' }}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-t-secondary font-semibold uppercase tracking-wider">
              Defect Category
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1 truncate">
              {categorySummary.title}
            </span>
            <span className="text-[11px] font-medium text-t-secondary truncate">
              {categorySummary.subtitle}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ml-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Layers size={18} />
          </div>
        </div>

        {/* Card 2: Average Downtime */}
        <div
          className="bg-card border border-border/60 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
          style={{ borderTop: '4px solid #10b981' }}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-t-secondary font-semibold uppercase tracking-wider">
              Average Downtime
            </span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {avgDowntime} <span className="text-xs font-semibold text-t-secondary">Min</span>
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ml-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <Clock size={18} />
          </div>
        </div>

        {/* Card 3: Total Downtime */}
        <div
          className="bg-card border border-border/60 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
          style={{ borderTop: '4px solid #f59e0b' }}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-t-secondary font-semibold uppercase tracking-wider">
              Total Downtime
            </span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {totalDowntime.toLocaleString()} <span className="text-xs font-semibold text-t-secondary">Min</span>
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ml-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Timer size={18} />
          </div>
        </div>

        {/* Card 4: Cost Per Minute */}
        <div
          className="bg-card border border-border/60 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
          style={{ borderTop: '4px solid #8b5cf6' }}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-t-secondary font-semibold uppercase tracking-wider">
              Cost Per Minute
            </span>
            <span className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              ₹ {avgCostPerMin}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ml-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <AlertTriangle size={18} />
          </div>
        </div>

        {/* Card 5: Est. Loss */}
        <div
          className="bg-card border border-border/60 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
          style={{ borderTop: '4px solid #ef4444' }}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-t-secondary font-semibold uppercase tracking-wider">
              Est. Loss
            </span>
            <span className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
              ₹ {totalEstLoss.toLocaleString()}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ml-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
            <DollarSign size={18} />
          </div>
        </div>
      </div>

      {/* ── Table Container ────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <ReportTable<DailyMachineDowntimeRecord>
          columns={columns}
          data={filteredRecords}
          loading={loading}
          rowKey={(r) => String(r.proaudit_uuid || r.s_no || `${r.machine_no}-${r.audit_time}`)}
          header={
            <Toolbar
              search={search}
              onSearchChange={onSearchChange}
              searchPlaceholder="Search shift, line, machine, defect..."
              showExport
              onExport={handleExport}
              onExportPdf={handleExportPdf}
              exporting={exporting || exportingPdf}
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Branch Filter */}
                <select
                  value={branchFilter}
                  onChange={(e) => onBranchFilterChange(e.target.value)}
                  disabled={!isAdmin && Boolean(userBranchId)}
                  className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[110px] shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {!(!isAdmin && userBranchId) && <option value="">All Branches</option>}
                  {branches.map((b: any) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.branch_name || b.name}
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
                  {shifts.map((s: any) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.shift_name || s.name}
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
                  {teams.map((t: any) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.team_name || t.name || `Team ${t.id}`}
                    </option>
                  ))}
                </select>


                {/* Zone Filter */}
                {zones.length > 0 && onZoneFilterChange && (
                  <select
                    value={zoneFilter}
                    onChange={(e) => onZoneFilterChange(e.target.value)}
                    className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[100px] shrink-0"
                  >
                    <option value="">All Zones</option>
                    {zones.map((z: any) => (
                      <option key={z.id} value={String(z.id)}>
                        {z.zone_name || z.name || `Zone ${z.id}`}
                      </option>
                    ))}
                  </select>
                )}

                {/* Line Filter */}
                {lines.length > 0 && onLineFilterChange && (
                  <select
                    value={lineFilter}
                    onChange={(e) => onLineFilterChange(e.target.value)}
                    className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[100px] shrink-0"
                  >
                    <option value="">All Lines</option>
                    {lines.map((l: any) => (
                      <option key={l.id} value={String(l.id)}>
                        {l.line_name || l.line_no || l.name || `Line ${l.id}`}
                      </option>
                    ))}
                  </select>
                )}

                <div className="relative z-[9999] w-[190px] shrink-0">
                  <DateRangePicker
                    startDate={fromDate}
                    endDate={toDate}
                    onChange={onDateRangeChange}
                  />
                </div>
              </div>
            </Toolbar>
          }
          totalCount={filteredRecords.length}
          emptyMessage="No daily machine downtime records found for selected criteria"
          countLabel="downtime record"
          countLabelPlural="downtime records"
        />
      </div>
    </div>
  )
}
