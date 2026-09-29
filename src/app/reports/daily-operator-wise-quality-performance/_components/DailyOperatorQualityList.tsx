'use client'

import { useMemo } from 'react'
import {
  AlertCircle,
  Clock,
  Award,
  DollarSign,
  Layers,
  RotateCcw,
} from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import ReportTable, { type ReportColumn } from '@/components/ui/ReportTable'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { usePermissions } from '@/hooks/usePermissions'
import { useExport } from '@/hooks/useExport'
import { useExportPdf } from '@/hooks/useExportPdf'
import type {
  DailyOperatorQualityRow,
  DailyOperatorQualityCards,
  DailyOperatorQualityAverage,
  DailyOperatorQualityFactorySummary,
  DailyOperatorQualityFlatRow,
} from '../types'
import type {
  BranchOption,
  ShiftOption,
  TeamOption,
  ZoneOption,
  LineOption,
} from '@/hooks/useDropdownData'

interface DailyOperatorQualityListProps {
  cards?: DailyOperatorQualityCards
  rows: DailyOperatorQualityRow[]
  average?: DailyOperatorQualityAverage
  factorySummary?: DailyOperatorQualityFactorySummary
  loading: boolean
  search: string
  branchFilter: string
  shiftFilter: string
  teamFilter: string
  zoneFilter: string
  lineFilter: string
  fromDate: string
  toDate: string
  branches?: BranchOption[] | { id: number; name: string; branch_name?: string }[]
  shifts?: ShiftOption[] | { id: number; name: string; shift_name?: string }[]
  teams?: TeamOption[] | { id: number; name: string; team_name?: string }[]
  zonesList?: ZoneOption[] | { id: number; name: string; zone_name?: string }[]
  linesList?: LineOption[] | { id: number; name: string; line_name?: string }[]
  onSearchChange: (val: string) => void
  onBranchFilterChange: (val: string) => void
  onShiftFilterChange: (val: string) => void
  onTeamFilterChange: (val: string) => void
  onZoneFilterChange: (val: string) => void
  onLineFilterChange: (val: string) => void
  onDateRangeChange: (start: string, end: string) => void
  onRefresh?: () => void
}

function getRatingBadge(rating?: string) {
  if (!rating) return null
  const r = rating.trim().toUpperCase()
  if (r.startsWith('A')) {
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
        {rating}
      </span>
    )
  }
  if (r.startsWith('B')) {
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
        {rating}
      </span>
    )
  }
  if (r.startsWith('C')) {
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
        {rating}
      </span>
    )
  }
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
      {rating}
    </span>
  )
}

function getStatusBadge(status?: string) {
  if (!status) return null
  const s = status.trim().toLowerCase()
  if (s.includes('excellent') || s.includes('good')) {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
        {status}
      </span>
    )
  }
  if (s.includes('need') || s.includes('improve')) {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
        {status}
      </span>
    )
  }
  if (s.includes('critical')) {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800">
        {status}
      </span>
    )
  }
  if (s.includes('immediate') || s.includes('action') || s.includes('require')) {
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
        {status}
      </span>
    )
  }
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
      {status}
    </span>
  )
}

export default function DailyOperatorQualityList({
  cards,
  rows,
  average,
  factorySummary,
  loading,
  search,
  branchFilter,
  shiftFilter,
  teamFilter,
  zoneFilter,
  lineFilter,
  fromDate,
  toDate,
  branches = [],
  shifts = [],
  teams = [],
  zonesList = [],
  linesList = [],
  onSearchChange,
  onBranchFilterChange,
  onShiftFilterChange,
  onTeamFilterChange,
  onZoneFilterChange,
  onLineFilterChange,
  onDateRangeChange,
  onRefresh,
}: DailyOperatorQualityListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const { can } = usePermissions('Reports')
  const canExport = can('report.getdailyoperatorwisequalityperformancereport')

  // Client-side search filtering over rows
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter((r) => {
      const matchFields = [
        r.employee_name,
        r.emp_code,
        r.designation,
        r.order_number,
        r.style_name,
        r.style_number,
        r.colour,
        r.buyer,
        r.operation,
        r.defect_category,
        r.branch_name,
        r.line,
        r.zone,
        r.team,
        r.shift,
      ]
      return matchFields.some((f) => String(f || '').toLowerCase().includes(q))
    })
  }, [rows, search])

  // Build table data including bottom Average & Factory Summary rows
  const tableData = useMemo<DailyOperatorQualityFlatRow[]>(() => {
    if (filteredRows.length === 0) {
      return []
    }

    const list: DailyOperatorQualityFlatRow[] = filteredRows.map((r, i) => ({
      ...r,
      _rowId: `data_${r.emp_id || i}_${r.order_number || i}_${i}`,
      _rowType: 'data',
    }))

    if (average && Object.keys(average).length > 0) {
      list.push({
        _rowId: 'row_average',
        _rowType: 'average',
        _label: 'Average',
        total_mistake: average.total_mistake,
        elapsed_time: average.elapsed_time,
        rework: average.rework,
        rej: average.rej,
        cpm: average.cpm,
        rework_cost: average.rework_cost,
        rej_cost: average.rej_cost,
        loss_rs: average.loss_rs,
        tls_score: average.tls_score,
        rework_score: average.rework_score,
        rej_score: average.rej_score,
        overall_score: average.overall_score,
        rating: average.rating,
        status: average.status,
      })
    }

    if (factorySummary && Object.keys(factorySummary).length > 0) {
      list.push({
        _rowId: 'row_factory_summary',
        _rowType: 'factory_summary',
        _label: 'FACTORY SUMMARY',
        total_mistake: factorySummary.total_mistakes,
        elapsed_time: factorySummary.total_elapsed_time,
        rework: factorySummary.total_rework,
        rej: factorySummary.total_rej,
        cpm: factorySummary.cpm,
        rework_cost: factorySummary.total_rework_cost,
        rej_cost: factorySummary.total_rej_cost,
        loss_rs: factorySummary.total_loss,
      })
    }

    return list
  }, [filteredRows, average, factorySummary])

  const exportPayload = useMemo(
    () => ({
      from_date: fromDate,
      to_date: toDate || fromDate,
      search: search || '',
      branch_id: branchFilter || '',
      shift_id: shiftFilter || '',
      team_id: teamFilter || '',
      zone_id: zoneFilter || '',
      line_id: lineFilter || '',
    }),
    [fromDate, toDate, search, branchFilter, shiftFilter, teamFilter, zoneFilter, lineFilter]
  )

  const { handleExport, exporting } = useExport({
    apiPath: '/newreports/getdailyqualityperformancereport',
    payload: exportPayload,
    filename: `Daily_Operator_Wise_Quality_Performance_${fromDate}_to_${toDate || fromDate}`,
    method: 'POST',
  })

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/newreports/getdailyqualityperformancereport',
    payload: exportPayload,
    filename: `Daily_Operator_Wise_Quality_Performance_${fromDate}_to_${toDate || fromDate}`,
  })

  // Helper to format values: if null/undefined/empty, show '-' for normal/average rows, or empty for factory summary
  const formatVal = (val: any, rowType?: string): React.ReactNode => {
    if (val !== null && val !== undefined && val !== '') {
      return val
    }
    return rowType === 'factory_summary' ? null : '-'
  }

  // Table Columns Specification
  const columns: ReportColumn<DailyOperatorQualityFlatRow>[] = useMemo(
    () => [
      {
        key: 'sl_no',
        header: 'S.No',
        className: 'w-14 text-center',
        render: (r, idx) => (r._rowType !== 'data' ? '' : <span className="text-t-muted text-xs">{r.sl_no ?? idx + 1}</span>),
      },
      {
        key: 'branch_name',
        header: 'Branch',
        className: 'min-w-[120px]',
        render: (r) => (r._rowType !== 'data' ? '' : <span className="whitespace-nowrap">{formatVal(r.branch_name, r._rowType)}</span>),
      },
      {
        key: 'shift',
        header: 'Shift',
        className: 'min-w-[80px]',
        render: (r) => (r._rowType !== 'data' ? '' : <span className="whitespace-nowrap">{formatVal(r.shift, r._rowType)}</span>),
      },
      {
        key: 'team',
        header: 'Team',
        className: 'min-w-[90px]',
        render: (r) => (r._rowType !== 'data' ? '' : <span className="whitespace-nowrap">{formatVal(r.team, r._rowType)}</span>),
      },
      {
        key: 'zone',
        header: 'Zone',
        className: 'min-w-[80px]',
        render: (r) => (r._rowType !== 'data' ? '' : <span className="whitespace-nowrap">{formatVal(r.zone, r._rowType)}</span>),
      },
      {
        key: 'line',
        header: 'Line',
        className: 'min-w-[80px]',
        render: (r) => (r._rowType !== 'data' ? '' : <span className="whitespace-nowrap">{formatVal(r.line, r._rowType)}</span>),
      },
      {
        key: 'employee_name',
        header: 'Employee Name',
        className: 'min-w-[140px]',
        render: (r) => {
          if (r._rowType === 'average') {
            return <span className="font-bold text-[#007b83] dark:text-[#2dd4bf] uppercase tracking-wider">{r._label}</span>
          }
          if (r._rowType === 'factory_summary') {
            return <span className="font-bold text-white uppercase tracking-wider">{r._label}</span>
          }
          return <span className="font-medium whitespace-nowrap">{formatVal(r.employee_name, r._rowType)}</span>
        },
      },
      {
        key: 'emp_code',
        header: 'Employee ID',
        className: 'min-w-[100px]',
        render: (r) => (r._rowType !== 'data' ? '' : <span className="font-mono text-xs">{formatVal(r.emp_code, r._rowType)}</span>),
      },
      {
        key: 'designation',
        header: 'Designation',
        className: 'min-w-[110px]',
        render: (r) => (r._rowType !== 'data' ? '' : <span className="whitespace-nowrap text-t-secondary">{formatVal(r.designation, r._rowType)}</span>),
      },
      {
        key: 'order_number',
        header: 'Order',
        className: 'min-w-[95px]',
        render: (r) => (r._rowType !== 'data' ? '' : <span className="whitespace-nowrap">{formatVal(r.order_number, r._rowType)}</span>),
      },
      {
        key: 'colour',
        header: 'Colour',
        className: 'min-w-[90px]',
        render: (r) => (r._rowType !== 'data' ? '' : <span className="whitespace-nowrap">{formatVal(r.colour, r._rowType)}</span>),
      },
      {
        key: 'buyer',
        header: 'Buyer',
        className: 'min-w-[90px]',
        render: (r) => (r._rowType !== 'data' ? '' : <span className="whitespace-nowrap">{formatVal(r.buyer, r._rowType)}</span>),
      },
      {
        key: 'style_name',
        header: 'Style Name',
        className: 'min-w-[120px]',
        render: (r) => (r._rowType !== 'data' ? '' : <span className="whitespace-nowrap">{formatVal(r.style_name, r._rowType)}</span>),
      },
      {
        key: 'style_number',
        header: 'Style number',
        className: 'min-w-[110px]',
        render: (r) => (r._rowType !== 'data' ? '' : <span className="whitespace-nowrap">{formatVal(r.style_number, r._rowType)}</span>),
      },
      {
        key: 'operation',
        header: 'Operation',
        className: 'min-w-[120px]',
        render: (r) => (r._rowType !== 'data' ? '' : <span className="whitespace-nowrap">{formatVal(r.operation, r._rowType)}</span>),
      },
      {
        key: 'total_mistake',
        header: 'TLS Audit Findings',
        className: 'min-w-[130px] text-right',
        render: (r) => <span className="font-medium">{formatVal(r.total_mistake, r._rowType)}</span>,
      },
      {
        key: 'elapsed_time',
        header: 'Elapsed Time',
        className: 'min-w-[95px] text-right',
        render: (r) => <span>{formatVal(r.elapsed_time, r._rowType)}</span>,
      },
      {
        key: 'rework',
        header: 'Rework',
        className: 'min-w-[80px] text-right',
        render: (r) => <span>{formatVal(r.rework, r._rowType)}</span>,
      },
      {
        key: 'rej',
        header: 'Rej',
        className: 'min-w-[80px] text-right',
        render: (r) => <span>{formatVal(r.rej, r._rowType)}</span>,
      },
      {
        key: 'cpm',
        header: 'CPM',
        className: 'min-w-[80px] text-right',
        render: (r) => <span>{formatVal(r.cpm, r._rowType)}</span>,
      },
      {
        key: 'rework_cost',
        header: 'Rework Cost',
        className: 'min-w-[90px] text-right',
        render: (r) => <span>{formatVal(r.rework_cost, r._rowType)}</span>,
      },
      {
        key: 'rej_cost',
        header: 'Rej Cost',
        className: 'min-w-[90px] text-right',
        render: (r) => <span>{formatVal(r.rej_cost, r._rowType)}</span>,
      },
      {
        key: 'loss_rs',
        header: 'Loss (Rs.)',
        className: 'min-w-[90px] text-right',
        render: (r) => <span className="font-medium">{formatVal(r.loss_rs, r._rowType)}</span>,
      },
      {
        key: 'tls_score',
        header: 'TLS Score',
        className: 'min-w-[85px] text-right',
        render: (r) => <span>{formatVal(r.tls_score, r._rowType)}</span>,
      },
      {
        key: 'rework_score',
        header: 'Rework Score',
        className: 'min-w-[95px] text-right',
        render: (r) => <span>{formatVal(r.rework_score, r._rowType)}</span>,
      },
      {
        key: 'rej_score',
        header: 'Rej Score',
        className: 'min-w-[85px] text-right',
        render: (r) => <span>{formatVal(r.rej_score, r._rowType)}</span>,
      },
      {
        key: 'overall_score',
        header: 'Overall Score',
        className: 'min-w-[95px] text-right font-bold',
        render: (r) => <span className="font-semibold">{formatVal(r.overall_score, r._rowType)}</span>,
      },
      {
        key: 'rating',
        header: 'Rating',
        className: 'min-w-[80px] text-center',
        render: (r) => (r.rating ? getRatingBadge(r.rating) : (r._rowType === 'factory_summary' ? null : '-')),
      },
      {
        key: 'status',
        header: 'Status',
        className: 'min-w-[130px] text-center',
        render: (r) => (r.status ? getStatusBadge(r.status) : (r._rowType === 'factory_summary' ? null : '-')),
      },
    ],
    []
  )

  // Factory Status coloring for header card
  const isStatusCritical = useMemo(() => {
    const s = String(cards?.factory_status || '').toLowerCase()
    return s.includes('immediate') || s.includes('action') || s.includes('critical')
  }, [cards?.factory_status])

  return (
    <div className="flex flex-col h-full gap-4">
      {/* ── Top Header KPI Cards ───────────────────────────────────── */}
      {cards && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
          {/* Total Issues */}
          <div className="bg-card p-3 rounded-xl border border-header-line shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-t-lighter font-semibold uppercase tracking-wider">
              <span>Total Issues</span>
              <AlertCircle className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {cards.total_issues}
            </h3>
          </div>

          {/* Rework */}
          <div className="bg-card p-3 rounded-xl border border-header-line shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-t-lighter font-semibold uppercase tracking-wider">
              <span>Rework</span>
              <RotateCcw className="w-4 h-4 text-purple-500" />
            </div>
            <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-2 truncate" title={cards.rework_pcs}>
              {cards.rework_pcs}
            </h3>
          </div>

          {/* Rejection */}
          <div className="bg-card p-3 rounded-xl border border-header-line shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-t-lighter font-semibold uppercase tracking-wider">
              <span>Rejection</span>
              <Layers className="w-4 h-4 text-fuchsia-500" />
            </div>
            <h3 className="text-sm font-bold text-fuchsia-600 dark:text-fuchsia-400 mt-2 truncate" title={cards.rejection_pcs}>
              {cards.rejection_pcs}
            </h3>
          </div>

          {/* Factory Grade */}
          <div className="bg-card p-3 rounded-xl border border-header-line shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-t-lighter font-semibold uppercase tracking-wider">
              <span>Grade</span>
              <Award className="w-4 h-4 text-cyan-500" />
            </div>
            <h3 className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">
              {cards.factory_grade}
            </h3>
          </div>

          {/* Factory Status */}
          <div className="bg-card p-3 rounded-xl border border-header-line shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-t-lighter font-semibold uppercase tracking-wider">
              <span>Factory Status</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <h3
              className={`text-xs font-bold mt-2 truncate ${
                isStatusCritical
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
              title={cards.factory_status}
            >
              {cards.factory_status}
            </h3>
          </div>

          {/* Est. Loss */}
          <div className="bg-card p-3 rounded-xl border border-header-line shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-t-lighter font-semibold uppercase tracking-wider">
              <span>Est. Loss</span>
              <DollarSign className="w-4 h-4 text-rose-500" />
            </div>
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-2 truncate" title={cards.est_loss}>
              {cards.est_loss}
            </h3>
          </div>
        </div>
      )}

      {/* ── Main Report Table ─────────────────────────────────────── */}
      <ReportTable<DailyOperatorQualityFlatRow>
        columns={columns}
        data={tableData}
        loading={loading}
        rowKey={(r) => r._rowId}
        totalCount={filteredRows.length}
        countLabel="operator"
        countLabelPlural="operators"
        emptyMessage="No operator quality performance data found for selected filters"
        rowClassName={(r) => {
          if (r._rowType === 'average') {
            return 'bg-[#edf7f8] dark:bg-[#0d2a2d] font-semibold text-[#007b83] dark:text-[#2dd4bf] border-t-2 border-[#007b83]/40'
          }
          if (r._rowType === 'factory_summary') {
            return 'bg-[#0d939d] text-white font-bold border-t-2 border-[#08777f]'
          }
          return ''
        }}
        header={
          <Toolbar
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search employee, order, style, line..."
            showExport={canExport && rows.length > 0}
            onExport={handleExport}
            onExportPdf={handleExportPdf}
            exporting={exporting || exportingPdf}
          >
            <div className="flex items-center gap-2 flex-wrap">
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
              {zonesList.length > 0 && (
                <select
                  value={zoneFilter}
                  onChange={(e) => onZoneFilterChange(e.target.value)}
                  className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[100px] shrink-0"
                >
                  <option value="">All Zones</option>
                  {zonesList.map((z: any) => (
                    <option key={z.id} value={String(z.id)}>
                      {z.zone_name || z.name || `Zone ${z.id}`}
                    </option>
                  ))}
                </select>
              )}

              {/* Line Filter */}
              {linesList.length > 0 && (
                <select
                  value={lineFilter}
                  onChange={(e) => onLineFilterChange(e.target.value)}
                  className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[100px] shrink-0"
                >
                  <option value="">All Lines</option>
                  {linesList.map((l: any) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.line_name || l.line_no || l.name || `Line ${l.id}`}
                    </option>
                  ))}
                </select>
              )}

              {/* DateRangePicker */}
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
      />
    </div>
  )
}
