'use client'

import { useMemo } from 'react'
import { CheckCircle2, TrendingUp, TrendingDown, Users, Loader2 } from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import ReportTable, { type ReportColumn } from '@/components/ui/ReportTable'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { useExport } from '@/hooks/useExport'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { usePermissions } from '@/hooks/usePermissions'
import type { CheckingHourlyRecord, CheckingHourlyReportData } from '../types'
import type { ShiftOption, TeamOption, ZoneOption, LineOption, BranchOption } from '@/hooks/useDropdownData'

interface CheckingHourlyReportListProps {
  data: CheckingHourlyReportData | null
  loading: boolean
  hasSubmitted?: boolean
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
  zones?: ZoneOption[] | { id: number; name: string }[]
  lines?: LineOption[] | { id: number; name: string }[]
  onSearchChange: (val: string) => void
  onBranchFilterChange: (val: string) => void
  onShiftFilterChange: (val: string) => void
  onTeamFilterChange: (val: string) => void
  onZoneFilterChange: (val: string) => void
  onLineFilterChange: (val: string) => void
  onDateRangeChange: (start: string, end: string) => void
  onSubmit?: () => void
  onRefresh?: () => void
}

export default function CheckingHourlyReportList({
  data,
  loading,
  hasSubmitted = false,
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
  zones = [],
  lines = [],
  onSearchChange,
  onBranchFilterChange,
  onShiftFilterChange,
  onTeamFilterChange,
  onZoneFilterChange,
  onLineFilterChange,
  onDateRangeChange,
  onSubmit,
  onRefresh,
}: CheckingHourlyReportListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const { can } = usePermissions('Reports')
  const canExport = can('report.checkinghourlyreport')
  const records = data?.records || []
  const summary = data?.summary
  const hourlyTotals = data?.hourly_totals || {}
  const grandTotal = data?.grand_total

  // Filter records by client search if needed
  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records
    const q = search.toLowerCase()
    return records.filter((r) => {
      const checker = (r.checker_name || '').toLowerCase()
      const code = (r.checker_code || String(r.checker_id || '')).toLowerCase()
      const line = (r.line_name || '').toLowerCase()
      const zone = (r.zone_name || '').toLowerCase()
      const team = (r.team_name || '').toLowerCase()
      const shift = (r.shift_name || '').toLowerCase()
      return (
        checker.includes(q) ||
        code.includes(q) ||
        line.includes(q) ||
        zone.includes(q) ||
        team.includes(q) ||
        shift.includes(q)
      )
    })
  }, [records, search])

  // Backend Export Payload & Hooks
  const exportPayload = useMemo(() => {
    const p: Record<string, any> = {
      type: '',
      from_date: fromDate,
      to_date: toDate || fromDate,
    }
    if (branchFilter) p.branch_id = branchFilter
    if (shiftFilter) p.shift_id = shiftFilter
    if (teamFilter) p.team_id = teamFilter
    if (zoneFilter) p.zone_id = zoneFilter
    if (lineFilter) p.line_id = lineFilter
    if (search) p.search = search
    return p
  }, [fromDate, toDate, branchFilter, shiftFilter, teamFilter, zoneFilter, lineFilter, search])

  const { handleExport, exporting } = useExport({
    apiPath: '/newreports/checkinghourlyreport',
    payload: exportPayload,
    filename: `Checking_Hourly_Report_${fromDate}_to_${toDate || fromDate}`,
  })

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/newreports/checkinghourlyreport',
    payload: exportPayload,
    filename: `Checking_Hourly_Report_${fromDate}_to_${toDate || fromDate}`,
  })

  // ── Dynamic Hour Columns (Derived from backend hourly_totals and record hours) ─
  const hourKeys = useMemo(() => {
    const keySet = new Set<string>()

    // 1. Collect keys from backend hourly_totals
    if (data?.hourly_totals) {
      Object.keys(data.hourly_totals).forEach((k) => keySet.add(k))
    }

    // 2. Collect keys from record hours (e.g. 1..N, ot)
    if (records.length > 0) {
      records.forEach((r) => {
        if (r.hours && typeof r.hours === 'object') {
          Object.keys(r.hours).forEach((k) => keySet.add(k))
        } else if (r.ot !== undefined && r.ot !== null) {
          keySet.add('ot')
        }
      })
    }

    return Array.from(keySet).sort((a, b) => {
      const isAOt = a.toLowerCase() === 'ot'
      const isBOt = b.toLowerCase() === 'ot'
      if (isAOt && !isBOt) return 1
      if (!isAOt && isBOt) return -1

      const numA = Number(a)
      const numB = Number(b)
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      if (!isNaN(numA)) return -1
      if (!isNaN(numB)) return 1
      return a.localeCompare(b)
    })
  }, [data?.hourly_totals, records])

  const hourCols: ReportColumn<CheckingHourlyRecord>[] = useMemo(() => {
    return hourKeys.map((hKey) => {
      const isOt = hKey.toLowerCase() === 'ot'
      const headerTitle = isOt ? 'OT' : hKey
      return {
        key: `hour_${hKey}`,
        header: headerTitle,
        sortable: true,
        headerClassName: 'text-center w-12',
        className: 'text-center',
        sortValue: (r: CheckingHourlyRecord) => Number(r.hours?.[hKey] ?? (isOt ? (r.ot ?? 0) : 0)),
        render: (r: CheckingHourlyRecord) => {
          const val = r.hours?.[hKey] ?? (isOt ? r.ot : undefined)
          return (
            <span className="text-xs font-semibold text-t-primary">
              {val !== undefined && val !== null ? val : '—'}
            </span>
          )
        },
        footer: () => {
          const totalVal = hourlyTotals[hKey] ?? (isOt ? (hourlyTotals['ot'] ?? hourlyTotals['OT'] ?? 0) : undefined)
          return (
            <span className="font-bold text-white text-xs">
              {totalVal !== undefined && totalVal !== null ? totalVal : '—'}
            </span>
          )
        },
      }
    })
  }, [hourKeys, hourlyTotals])

  const columns: ReportColumn<CheckingHourlyRecord>[] = useMemo(
    () => [
      {
        key: 's_no',
        header: 'S.No',
        headerClassName: 'text-center w-12',
        className: 'text-center',
        render: (_, idx) => <span className="text-t-muted text-xs">{idx + 1}</span>,
        footer: () => <span className="font-bold text-white uppercase text-xs">TOTAL</span>,
      },
      {
        key: 'branch_name',
        header: 'Branch',
        sortable: true,
        sortValue: (r) => r.branch_name || '',
        render: (r) => (
          <span className="text-t-body text-xs font-medium whitespace-nowrap">
            {r.branch_name || '—'}
          </span>
        ),
      },
      {
        key: 'shift_name',
        header: 'Shift',
        sortable: true,
        sortValue: (r) => r.shift_name || '',
        render: (r) => (
          <span className="text-t-body text-xs font-medium whitespace-nowrap">
            {r.shift_name || '—'}
          </span>
        ),
      },
      {
        key: 'team_name',
        header: 'Team',
        sortable: true,
        sortValue: (r) => r.team_name || '',
        render: (r) => (
          <span className="text-t-body text-xs font-medium whitespace-nowrap">
            {r.team_name || '—'}
          </span>
        ),
      },
      {
        key: 'zone_name',
        header: 'Zone',
        sortable: true,
        sortValue: (r) => r.zone_name || '',
        render: (r) => (
          <span className="text-t-body text-xs font-medium whitespace-nowrap">
            {r.zone_name || '—'}
          </span>
        ),
      },
      {
        key: 'line_name',
        header: 'Line',
        sortable: true,
        sortValue: (r) => r.line_name || '',
        render: (r) => (
          <span className="text-t-body text-xs font-semibold whitespace-nowrap text-accent">
            {r.line_name || '—'}
          </span>
        ),
      },
      {
        key: 'checker_code',
        header: 'Checker ID',
        sortable: true,
        sortValue: (r) => r.checker_code || String(r.checker_id || ''),
        render: (r) => (
          <span className="text-t-secondary text-xs font-mono whitespace-nowrap">
            {r.checker_code || (r.checker_id ? String(r.checker_id) : '—')}
          </span>
        ),
      },
      {
        key: 'checker_name',
        header: 'Checker Name',
        sortable: true,
        sortValue: (r) => r.checker_name || '',
        render: (r) => (
          <span className="text-t-body text-xs font-semibold whitespace-nowrap">
            {r.checker_name || '—'}
          </span>
        ),
      },
      ...hourCols,
      {
        key: 'total',
        header: 'Total',
        sortable: true,
        headerClassName: 'text-center w-16',
        className: 'text-center',
        sortValue: (r) => Number(r.total ?? 0),
        render: (r) => (
          <span className="text-xs font-bold text-accent">
            {r.total !== undefined && r.total !== null ? r.total : '—'}
          </span>
        ),
        footer: () => (
          <span className="font-bold text-white text-xs">
            {grandTotal !== undefined && grandTotal !== null ? grandTotal : '—'}
          </span>
        ),
      },
    ],
    [hourCols, grandTotal]
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── KPI Summary Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 pt-3 pb-1">
        {/* Card 1: Total Checked */}
        <div
          className="bg-card border border-border/60 rounded-xl px-3.5 py-2.5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow"
          style={{ borderTop: '3px solid #0d939d' }}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-t-secondary font-semibold uppercase tracking-wider">
              Total Checked
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold text-t-primary leading-tight">
                {summary?.total_checked !== undefined && summary?.total_checked !== null ? summary.total_checked : '—'}
              </span>
              <span className="text-xs font-medium text-t-secondary">PCS</span>
            </div>
          </div>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ml-2"
            style={{ backgroundColor: '#0d939d18', color: '#0d939d' }}
          >
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Card 2: Peak Hour */}
        <div
          className="bg-card border border-border/60 rounded-xl px-3.5 py-2.5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow"
          style={{ borderTop: '3px solid #10b981' }}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-t-secondary font-semibold uppercase tracking-wider">
              Peak Hour
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
              {summary?.peak_hour || '—'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ml-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={18} />
          </div>
        </div>

        {/* Card 3: Lowest Hour */}
        <div
          className="bg-card border border-border/60 rounded-xl px-3.5 py-2.5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow"
          style={{ borderTop: '3px solid #f59e0b' }}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-t-secondary font-semibold uppercase tracking-wider">
              Lowest Hour
            </span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5 truncate">
              {summary?.lowest_hour || '—'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ml-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <TrendingDown size={18} />
          </div>
        </div>

        {/* Card 4: No. of Checkers */}
        <div
          className="bg-card border border-border/60 rounded-xl px-3.5 py-2.5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow"
          style={{ borderTop: '3px solid #6366f1' }}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-t-secondary font-semibold uppercase tracking-wider">
              No. of Checkers
            </span>
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 leading-tight">
              {summary?.no_of_checkers !== undefined && summary?.no_of_checkers !== null ? summary.no_of_checkers : '—'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ml-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Users size={18} />
          </div>
        </div>
      </div>

      {/* ── Table & Toolbar ───────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        <ReportTable<CheckingHourlyRecord>
          data={filteredRecords}
          columns={columns}
          rowKey={(r) => `${r.checker_id || ''}_${r.line_id || ''}_${r.shift_id || ''}`}
          loading={loading}
          emptyMessage={
            !hasSubmitted
              ? 'Please select Branch and Shift, then click Submit to view the report.'
              : 'No checking hourly records found for the selected criteria.'
          }
          header={
            <Toolbar
              search={search}
              onSearchChange={onSearchChange}
              searchPlaceholder="Search checker, line, zone..."
              showExport={canExport && hasSubmitted && records.length > 0}
              onExport={handleExport}
              onExportPdf={handleExportPdf}
              exporting={exporting || exportingPdf}
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Branch Filter (Required) */}
                <div className="relative shrink-0">
                  <select
                    value={branchFilter}
                    onChange={(e) => onBranchFilterChange(e.target.value)}
                    disabled={!isAdmin && Boolean(userBranchId)}
                    className="h-8 pl-2 pr-6 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[125px] shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {!(!isAdmin && userBranchId) && <option value="">Select Branch</option>}
                    {branches.map((b: any) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.branch_name || b.name}
                      </option>
                    ))}
                  </select>
                  {!branchFilter && (
                    <div className="pointer-events-none absolute inset-y-[2px] left-[9px] flex items-center gap-0.5 text-xs font-medium text-t-secondary bg-card pr-1 rounded-l-md">
                      <span>Select Branch</span>
                      <span className="text-red-500 font-bold text-xs leading-none">*</span>
                    </div>
                  )}
                </div>

                {/* Shift Filter (Required) */}
                <div className="relative shrink-0">
                  <select
                    value={shiftFilter}
                    onChange={(e) => onShiftFilterChange(e.target.value)}
                    className="h-8 pl-2 pr-6 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[115px] shrink-0"
                  >
                    <option value="">Select Shift</option>
                    {shifts.map((s: any) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.shift_name || s.name}
                      </option>
                    ))}
                  </select>
                  {!shiftFilter && (
                    <div className="pointer-events-none absolute inset-y-[2px] left-[9px] flex items-center gap-0.5 text-xs font-medium text-t-secondary bg-card pr-1 rounded-l-md">
                      <span>Select Shift</span>
                      <span className="text-red-500 font-bold text-xs leading-none">*</span>
                    </div>
                  )}
                </div>

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

                {/* Line Filter */}
                <select
                  value={lineFilter}
                  onChange={(e) => onLineFilterChange(e.target.value)}
                  className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[100px] shrink-0"
                >
                  <option value="">All Lines</option>
                  {lines.map((l: any) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.line_name || l.name || `Line ${l.id}`}
                    </option>
                  ))}
                </select>

                {/* Date Range Picker */}
                <div className="relative z-[9999] w-[190px] shrink-0">
                  <DateRangePicker
                    startDate={fromDate}
                    endDate={toDate}
                    onChange={onDateRangeChange}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={loading || !branchFilter || !shiftFilter}
                  className="h-8 px-3.5 text-xs font-semibold text-white bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                >
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  Submit
                </button>
              </div>
            </Toolbar>
          }
        />
        {hasSubmitted && (
          <div className="flex items-center justify-between text-xs text-t-muted px-4 py-2 border-t border-table-line bg-card">
            <span>
              Showing {filteredRecords.length} record{filteredRecords.length === 1 ? '' : 's'}
            </span>
            {grandTotal !== undefined && grandTotal !== null && (
              <span className="font-semibold text-t-primary">
                Grand Total: {grandTotal} PCS
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
