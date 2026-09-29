'use client'

import { useMemo } from 'react'
import Toolbar from '@/components/ui/Toolbar'
import ReportTable, { type ReportColumn } from '@/components/ui/ReportTable'
import DateRangePicker from '@/components/ui/DateRangePicker'
import Badge from '@/components/ui/Badge'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useExport } from '@/hooks/useExport'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import type { AqlAuditReportData, AqlAuditLineRow } from '../types'
import type { ShiftOption } from '@/services/dropdownService'

interface BranchOption {
  id: number
  branch_name: string
}

interface TeamOption {
  id: number
  team_name: string
}

interface DailyAqlAuditLineSummaryReportListProps {
  data: AqlAuditReportData | null
  loading: boolean
  search: string
  branchFilter: string
  teamFilter: string
  shiftFilter: string
  fromDate: string
  toDate: string
  branches: BranchOption[]
  teams: TeamOption[]
  shifts: ShiftOption[]
  onSearchChange: (val: string) => void
  onBranchFilterChange: (val: string) => void
  onTeamFilterChange: (val: string) => void
  onShiftFilterChange: (val: string) => void
  onDateRangeChange: (start: string, end: string) => void
}

function getRatingBadgeVariant(rating?: string): 'success' | 'info' | 'warning' | 'error' | 'default' {
  if (!rating) return 'default'
  const r = rating.toUpperCase()
  if (r.includes('A')) return 'success'
  if (r.includes('B')) return 'info'
  if (r.includes('C')) return 'warning'
  if (r.includes('D') || r.includes('F')) return 'error'
  return 'default'
}

function getStatusBadgeVariant(status?: string): 'success' | 'info' | 'warning' | 'error' | 'default' {
  if (!status) return 'default'
  const s = status.toLowerCase()
  if (s.includes('excellent') || s.includes('pass')) return 'success'
  if (s.includes('good')) return 'info'
  if (s.includes('attention') || s.includes('improvement')) return 'warning'
  if (s.includes('critical') || s.includes('fail')) return 'error'
  return 'default'
}

export default function DailyAqlAuditLineSummaryReportList({
  data,
  loading,
  search,
  branchFilter,
  teamFilter,
  shiftFilter,
  fromDate,
  toDate,
  branches,
  teams,
  shifts,
  onSearchChange,
  onBranchFilterChange,
  onTeamFilterChange,
  onShiftFilterChange,
  onDateRangeChange,
}: DailyAqlAuditLineSummaryReportListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const rows: AqlAuditLineRow[] = data?.data || []
  const summary = data?.summary

  // Filtered rows by search term
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(
      r =>
        (r.line_name && r.line_name.toLowerCase().includes(q)) ||
        (r.team_name && r.team_name.toLowerCase().includes(q)) ||
        (r.branch_name && r.branch_name.toLowerCase().includes(q)) ||
        (r.shift_name && r.shift_name.toLowerCase().includes(q)) ||
        (r.rating && r.rating.toLowerCase().includes(q)) ||
        (r.status && r.status.toLowerCase().includes(q))
    )
  }, [rows, search])

  // PDF Export setup
  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/report/aqlauditlinesummaryreport',
    payload: {
      search,
      branch_id: branchFilter,
      team_id: teamFilter,
      shift_id: shiftFilter,
      date_from: fromDate,
      date_to: toDate,
    },
    filename: `Daily_AQL_Audit_Line_Summary_${fromDate}_to_${toDate}`,
  })

  // Excel Export setup (direct from backend)
  const { handleExport: handleExportExcel, exporting: exportingExcel } = useExport({
    apiPath: '/report/aqlauditlinesummaryreport',
    payload: {
      search,
      branch_id: branchFilter,
      team_id: teamFilter,
      shift_id: shiftFilter,
      date_from: fromDate,
      date_to: toDate,
      type: 'excel',
    },
    filename: `Daily_AQL_Audit_Line_Summary_${fromDate}_to_${toDate}`,
  })

  // Totals read directly from backend summary without any frontend calculation
  const totals = useMemo(() => {
    return {
      total_lots: summary?.total_lots ?? 0,
      pass_lots: summary?.pass_lots ?? 0,
      fail_lots: summary?.fail_lots ?? 0,
      total_inspection_qty: summary?.total_inspection_qty ?? 0,
      total_pass_qty: summary?.total_pass_qty ?? 0,
      total_fail_qty: summary?.total_fail_qty ?? 0,
      major_defects: summary?.major_defects ?? 0,
      minor_defects: summary?.minor_defects ?? 0,
      pass_percent: summary?.pass_percent ?? 0,
      fail_percent: summary?.fail_percent ?? 0,
      rating: summary?.rating ?? '—',
      status: summary?.status ?? '—',
      
    }
  }, [summary])

  const columns: ReportColumn<AqlAuditLineRow>[] = [
    {
      key: 'sn',
      header: 'Sn.',
      sortable: false,
      render: (_, i) => <span className="text-xs text-t-primary font-medium">{i + 1}</span>,
      footer: () => <span className="font-bold text-white">Total</span>,
    },
    {
      key: 'branch_name',
      header: 'Branch',
      sortable: true,
      sortValue: (r) => r.branch_name || '',
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.branch_name || '—'}</span>,
    },
    {
      key: 'shift_name',
      header: 'Shift',
      sortable: true,
      sortValue: (r) => r.shift_name || '',
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.shift_name || '—'}</span>,
    },
    {
      key: 'team_name',
      header: 'Team',
      sortable: true,
      sortValue: (r) => r.team_name || '',
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.team_name || '—'}</span>,
    },
    {
      key: 'line_name',
      header: 'Line No.',
      sortable: true,
      sortValue: (r) => r.line_name || '',
      render: (r) => <span className="text-xs text-accent font-semibold whitespace-nowrap">{r.line_name || '—'}</span>,
    },
    {
      key: 'total_lots',
      header: 'Total Lots',
      sortable: true,
      sortValue: (r) => r.total_lots ?? 0,
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.total_lots ?? 0}</span>,
      footer: () => <span className="font-bold text-white">{totals.total_lots}</span>,
    },
    {
      key: 'pass_lots',
      header: 'Pass Lots',
      sortable: true,
      sortValue: (r) => r.pass_lots ?? 0,
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.pass_lots ?? 0}</span>,
      footer: () => <span className="font-bold text-white">{totals.pass_lots}</span>,
    },
    {
      key: 'fail_lots',
      header: 'Fail Lots',
      sortable: true,
      sortValue: (r) => r.fail_lots ?? 0,
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.fail_lots ?? 0}</span>,
      footer: () => <span className="font-bold text-white">{totals.fail_lots}</span>,
    },
    {
      key: 'pass_percent',
      header: 'Pass %',
      sortable: true,
      sortValue: (r) => Number(r.pass_percent) || 0,
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.pass_percent ?? 0}%</span>,
      footer: () => <span className="font-bold text-white">{totals.pass_percent}%</span>,
    },
    {
      key: 'fail_percent',
      header: 'Fail %',
      sortable: true,
      sortValue: (r) => Number(r.fail_percent) || 0,
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.fail_percent ?? 0}%</span>,
      footer: () => <span className="font-bold text-white">{totals.fail_percent}%</span>,
    },
    {
      key: 'total_inspection_qty',
      header: 'Total Insp. Qty',
      sortable: true,
      sortValue: (r) => r.total_inspection_qty ?? 0,
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.total_inspection_qty?.toLocaleString() ?? 0}</span>,
      footer: () => <span className="font-bold text-white">{totals.total_inspection_qty.toLocaleString()}</span>,
    },
    {
      key: 'total_pass_qty',
      header: 'Total Pass Qty',
      sortable: true,
      sortValue: (r) => r.total_pass_qty ?? 0,
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.total_pass_qty?.toLocaleString() ?? 0}</span>,
      footer: () => <span className="font-bold text-white">{totals.total_pass_qty.toLocaleString()}</span>,
    },
    {
      key: 'total_fail_qty',
      header: 'Total Fail Qty',
      sortable: true,
      sortValue: (r) => r.total_fail_qty ?? 0,
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.total_fail_qty?.toLocaleString() ?? 0}</span>,
      footer: () => <span className="font-bold text-white">{totals.total_fail_qty.toLocaleString()}</span>,
    },
    {
      key: 'major_defects',
      header: 'Major Defects',
      sortable: true,
      sortValue: (r) => r.major_defects ?? 0,
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.major_defects ?? 0}</span>,
      footer: () => <span className="font-bold text-white">{totals.major_defects}</span>,
    },
    {
      key: 'minor_defects',
      header: 'Minor Defects',
      sortable: true,
      sortValue: (r) => r.minor_defects ?? 0,
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.minor_defects ?? 0}</span>,
      footer: () => <span className="font-bold text-white">{totals.minor_defects}</span>,
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      sortValue: (r) => r.rating || '',
      render: (r) => {
        const isCriticalRating = r.rating?.toUpperCase().includes('D') || r.rating?.toUpperCase().includes('F')
        if (isCriticalRating) {
          return (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
              style={{
                backgroundColor: 'rgba(255, 0, 0, 0.12)',
                color: '#FF0000',
                border: '1px solid rgba(255, 0, 0, 0.35)',
              }}
            >
              {r.rating}
            </span>
          )
        }
        return (
          <Badge variant={getRatingBadgeVariant(r.rating)}>
            {r.rating || '—'}
          </Badge>
        )
      },
      footer: () => <span className="font-bold text-white">{totals.rating || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (r) => r.status || '',
      render: (r) => {
        const isCritical =
          r.status?.toLowerCase().includes('fail') ||
          r.status?.toLowerCase().includes('critical') ||
          r.status?.toLowerCase().includes('reject')
        if (isCritical) {
          return (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
              style={{
                backgroundColor: 'rgba(255, 0, 0, 0.12)',
                color: '#FF0000',
                border: '1px solid rgba(255, 0, 0, 0.35)',
              }}
            >
              {r.status || 'Critical'}
            </span>
          )
        }
        return (
          <Badge variant={getStatusBadgeVariant(r.status)}>
            {r.status || '—'}
          </Badge>
        )
      },
      footer: () => <span className="font-bold text-white">{totals.status || '—'}</span>,
    },
  ]

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      {/* KPI Summary Banner (Matching Screenshot 1) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-card border border-table-line p-3 rounded-card shadow-xs">
        <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-teal-600/10 border border-teal-500/20 text-center">
          <span className="text-xs font-semibold text-t-secondary">Total Inspected Qty</span>
          <span className="text-lg font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">
            {totals.total_inspection_qty.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-center">
          <span className="text-xs font-semibold text-t-secondary">Total Pass</span>
          <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {totals.total_pass_qty.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-amber-600/10 border border-amber-500/20 text-center">
          <span className="text-xs font-semibold text-t-secondary">Total Fail Qty</span>
          <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
            {totals.total_fail_qty.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-blue-600/10 border border-blue-500/20 text-center">
          <span className="text-xs font-semibold text-t-secondary">Pass %</span>
          <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
            {totals.pass_percent}%
          </span>
        </div>
        <div
          className="flex flex-col items-center justify-center p-2.5 rounded-lg text-center col-span-2 sm:col-span-1"
          style={{
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid rgba(255, 0, 0, 0.35)',
          }}
        >
          <span className="text-xs font-semibold text-t-secondary">Fail %</span>
          <span className="text-lg font-extrabold mt-0.5" style={{ color: '#FF0000' }}>
            {totals.fail_percent}%
          </span>
        </div>
      </div>

      {/* Report Table with Filters */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ReportTable<AqlAuditLineRow>
          header={
            <Toolbar
              title="Daily AQL Audit Line Summary Report"
              search={search}
              onSearchChange={onSearchChange}
              searchPlaceholder="Search by Line, Team, Shift..."
              onExport={() => handleExportExcel()}
              onExportPdf={handleExportPdf}
              exporting={exportingExcel || exportingPdf}
            >
              <DateRangePicker
                startDate={fromDate}
                endDate={toDate}
                onChange={onDateRangeChange}
              />

              {/* Branch Filter */}
              <select
                value={branchFilter}
                onChange={(e) => onBranchFilterChange(e.target.value)}
                disabled={!isAdmin && Boolean(userBranchId)}
                className="h-8 px-2.5 text-xs bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-body cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
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
                className="h-8 px-2.5 text-xs bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-body cursor-pointer"
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
                className="h-8 px-2.5 text-xs bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-body cursor-pointer"
              >
                <option value="">All Teams</option>
                {teams.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.team_name}
                  </option>
                ))}
              </select>
            </Toolbar>
          }
          columns={columns}
          totalCount={filteredRows.length}
          data={filteredRows}
          loading={loading}
          emptyMessage="No AQL line summary report records found"
          rowKey={(r: AqlAuditLineRow) => `${r.line_id}-${r.shift_id ?? '0'}-${r.date ?? ''}`}
          countLabel="record"
          countLabelPlural="records"
        />
      </div>
    </div>
  )
}
