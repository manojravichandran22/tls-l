'use client'

import { useMemo } from 'react'
import {
  Clock,
  TrendingDown,
  Star,
  DollarSign,
  Activity,
  Timer,
} from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import ReportTable, { type ReportColumn, type ColumnGroup } from '@/components/ui/ReportTable'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import type {
  MachineDowntimeMatrixRecord,
  MachineDowntimeMatrixSummary,
  MachineDowntimeMatrixDefectCategories,
  MachineDowntimeMatrixColumnTotals,
  MachineDowntimeMatrixColumnAverages,
} from '../types'
import { type BranchOption } from '@/hooks/useDropdownData'
import { useExport } from '@/hooks/useExport'
import { useExportPdf } from '@/hooks/useExportPdf'

interface MachineDowntimeMatrixListProps {
  records: MachineDowntimeMatrixRecord[]
  summary?: MachineDowntimeMatrixSummary
  defectCategories?: MachineDowntimeMatrixDefectCategories
  allDefectColumns: string[]
  columnTotals?: MachineDowntimeMatrixColumnTotals
  columnAverages?: MachineDowntimeMatrixColumnAverages
  loading: boolean
  search: string
  fromDate: string
  toDate: string
  branches?: BranchOption[]
  onSearchChange: (val: string) => void
  onBranchFilterChange: (val: string) => void
  branchFilter: string
  onDateRangeChange: (start: string, end: string) => void
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



export default function MachineDowntimeMatrixList({
  records,
  summary,
  defectCategories,
  allDefectColumns,
  columnTotals,
  columnAverages,
  loading,
  search,
  fromDate,
  toDate,
  branches = [],
  onSearchChange,
  onBranchFilterChange,
  branchFilter,
  onDateRangeChange,
}: MachineDowntimeMatrixListProps) {
  const { isAdmin, branchId: userBranchId } = useBranchAccess()
  const filteredRecords = records || []

  // Export payload
  const exportPayload = useMemo(
    () => ({
      from_date: fromDate,
      to_date: toDate || fromDate,
      search: search || '',
      type: '',
      ...(branchFilter ? { branch_id: branchFilter } : {}),
    }),
    [fromDate, toDate, search, branchFilter]
  )

  const { handleExport, exporting } = useExport<MachineDowntimeMatrixRecord>({
    apiPath: '/newreports/machinedowntimematrixreport',
    payload: exportPayload,
    dataKey: 'data',
    columns: [
      { header: 'S.No',           value: (r) => String(r.sno) },
      { header: 'Machine No',     value: (r) => r.machine_no || '' },
      { header: 'Last Service',   value: (r) => r.last_svd || '' },
      { header: 'Next Service',   value: (r) => r.next_svd || '' },
      { header: 'Downtime (Min)', value: (r) => String(r.downtime_min ?? 0) },
      { header: 'Cost/Min (Rs)',  value: (r) => String(r.cost_per_min ?? 0) },
      { header: 'Total Loss (Rs)',value: (r) => String(r.total_loss ?? 0) },
      { header: 'Rating',         value: (r) => r.rating || '' },
      { header: 'Status',         value: (r) => r.status || '' },
      ...allDefectColumns.map((col) => ({
        header: col,
        value: (r: MachineDowntimeMatrixRecord) => String(r.defects?.[col] ?? 0),
      })),
    ],
    filename: 'Machine_Downtime_Matrix_Report',
    method: 'POST',
  })

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/newreports/machinedowntimematrixreport',
    payload: exportPayload,
    filename: 'Machine_Downtime_Matrix_Report',
  })

  // Helper: sort defect cols minor > major > critical (matches Excel column order)
  const sortDefectCols = (cols: string[]) =>
    [...cols].sort((a, b) => {
      const rank = (c: string) =>
        defectCategories?.minor?.includes(c) ? 0
        : defectCategories?.major?.includes(c) ? 1
        : defectCategories?.critical?.includes(c) ? 2
        : 3
      return rank(a) - rank(b)
    })

  // Table columns
  const columns: ReportColumn<MachineDowntimeMatrixRecord>[] = useMemo(() => {
    const base: ReportColumn<MachineDowntimeMatrixRecord>[] = [
      {
        key: 'sno',
        header: 'S.No',
        render: (r) => <span className="text-t-primary font-medium">{r.sno}</span>,
        footer: () => <span className="font-bold text-white">Total</span>,
      },
      {
        key: 'machine_no',
        header: 'Machine No',
        sortable: true,
        sortValue: (r) => r.machine_no || '',
        render: (r) => (
          <span className="text-[#007b83] dark:text-[#2dd4bf] text-xs font-semibold whitespace-nowrap">
            {r.machine_no || '—'}
          </span>
        ),
        footer: (data) => (
          <span className="text-white/80 text-xs font-medium">{data.length} Machines</span>
        ),
      },
      {
        key: 'last_svd',
        header: 'Last Service',
        sortable: true,
        sortValue: (r) => r.last_svd || '',
        render: (r) => <span className="text-t-body text-xs whitespace-nowrap">{r.last_svd || '—'}</span>,
        footer: () => <span className="text-white/80 text-xs">—</span>,
      },
      {
        key: 'next_svd',
        header: 'Next Service',
        sortable: true,
        sortValue: (r) => r.next_svd || '',
        render: (r) => <span className="text-t-body text-xs whitespace-nowrap">{r.next_svd || '—'}</span>,
        footer: () => <span className="text-white/80 text-xs">—</span>,
      },
      {
        key: 'downtime_min',
        header: 'Downtime (Min)',
        sortable: true,
        sortValue: (r) => r.downtime_min ?? 0,
        render: (r) => (
          <span className={`text-xs font-semibold ${(r.downtime_min ?? 0) > 0 ? 'text-red-500 dark:text-red-400' : 'text-t-body'}`}>
            {r.downtime_min ?? 0}
          </span>
        ),
        footer: () => (
          <span className="font-bold text-white text-xs">
            {columnTotals?.downtime_min ?? '—'}
          </span>
        ),
      },
      {
        key: 'cost_per_min',
        header: 'Cost/Min (Rs)',
        sortable: true,
        sortValue: (r) => r.cost_per_min ?? 0,
        render: (r) => <span className="text-t-body text-xs">Rs. {r.cost_per_min ?? 0}</span>,
        footer: () => (
          <span className="font-bold text-white text-xs">
            {columnTotals?.cost_per_min != null ? `Rs. ${columnTotals.cost_per_min}` : '—'}
          </span>
        ),
      },
      {
        key: 'total_loss',
        header: 'Total Loss (Rs)',
        sortable: true,
        sortValue: (r) => r.total_loss ?? 0,
        render: (r) => (
          <span className={`text-xs font-semibold ${(r.total_loss ?? 0) > 0 ? 'text-red-500 dark:text-red-400' : 'text-t-body'}`}>
            Rs. {(r.total_loss ?? 0).toFixed(2)}
          </span>
        ),
        footer: () => (
          <span className="font-bold text-white text-xs">
            {columnTotals?.total_loss != null ? `Rs. ${Number(columnTotals.total_loss).toFixed(2)}` : '—'}
          </span>
        ),
      },
      {
        key: 'rating',
        header: 'Rating',
        sortable: true,
        sortValue: (r) => r.rating || '',
        className: 'min-w-[80px] text-center',
        render: (r) => (r.rating ? getRatingBadge(r.rating) : '—'),
        footer: () => <span className="text-white/80 text-xs">—</span>,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        sortValue: (r) => r.status || '',
        className: 'min-w-[130px] text-center',
        render: (r) => (r.status ? getStatusBadge(r.status) : '—'),
        footer: () => <span className="text-white/80 text-xs">—</span>,
      },
    ]

    // Dynamic defect columns — sorted critical > major > minor (matches Excel column order)
    const defectCols: ReportColumn<MachineDowntimeMatrixRecord>[] = sortDefectCols(allDefectColumns).map((col) => {
      const isCritical = defectCategories?.critical?.includes(col)
      const isMajor    = defectCategories?.major?.includes(col)
      const isMinor    = defectCategories?.minor?.includes(col)
      return {
        key: `defect_${col}`,
        // Just the column name — MINOR/MAJOR/CRITICAL label appears in the group row above
        header: <span className="whitespace-nowrap">{col}</span>,
        sortable: true,
        sortValue: (r) => r.defects?.[col] ?? 0,
        render: (r) => {
          const val = r.defects?.[col] ?? 0
          let colorClass = 'text-t-body'
          if (val > 0 && isCritical)   colorClass = 'text-red-500 dark:text-red-400 font-bold'
          else if (val > 0 && isMajor) colorClass = 'text-orange-500 dark:text-orange-400 font-semibold'
          else if (val > 0 && isMinor) colorClass = 'text-yellow-600 dark:text-yellow-400 font-semibold'
          return <span className={`text-xs ${colorClass}`}>{val}</span>
        },
        footer: () => (
          <span className="font-bold text-white text-xs">
            {columnTotals?.defects?.[col] ?? '—'}
          </span>
        ),
      }
    })

    return [...base, ...defectCols]
  }, [allDefectColumns, defectCategories, columnTotals, filteredRecords])

  // Excel-style spanning group header row (MAJOR / MINOR / CRITICAL)
  // Base columns = 9: #, Machine No, Last Service, Next Service, Downtime, Cost/Min, Total Loss, Rating, Status
  const columnGroups = useMemo((): ColumnGroup[] | undefined => {
    if (allDefectColumns.length === 0) return undefined
    const sorted = sortDefectCols(allDefectColumns)
    const criticalCount = sorted.filter(c => defectCategories?.critical?.includes(c)).length
    const majorCount    = sorted.filter(c => defectCategories?.major?.includes(c)).length
    const minorCount    = sorted.filter(c => defectCategories?.minor?.includes(c)).length
    const otherCount    = sorted.filter(c =>
      !defectCategories?.critical?.includes(c) &&
      !defectCategories?.major?.includes(c) &&
      !defectCategories?.minor?.includes(c)
    ).length
    const groups: ColumnGroup[] = [{ label: '', span: 9 }]
    if (minorCount    > 0) groups.push({ label: 'MINOR',    span: minorCount })
    if (majorCount    > 0) groups.push({ label: 'MAJOR',    span: majorCount })
    if (criticalCount > 0) groups.push({ label: 'CRITICAL', span: criticalCount })
    if (otherCount    > 0) groups.push({ label: '',         span: otherCount })
    return groups
  }, [allDefectColumns, defectCategories])

  // KPI summary cards
  const kpiCards = useMemo(
    () => [
      {
        label: 'Average Downtime',
        value: summary?.average_downtime ?? '—',
        icon: Timer,
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
      },
      {
        label: 'Total Downtime',
        value: summary?.total_downtime ?? '—',
        icon: Clock,
        color: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-900/20',
      },
      {
        label: 'Factory Machine Rating',
        value: summary?.factory_machine_rating ?? '—',
        badge: summary?.factory_machine_rating ? getRatingBadge(summary.factory_machine_rating) : undefined,
        icon: Star,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      },
      {
        label: 'Factory Machine Status',
        value: summary?.factory_machine_status ?? '—',
        badge: summary?.factory_machine_status ? getStatusBadge(summary.factory_machine_status) : undefined,
        icon: Activity,
        color: 'text-teal-500',
        bg: 'bg-teal-50 dark:bg-teal-900/20',
      },
      {
        label: 'Cost Per Minute',
        value: summary?.cost_per_minute != null
          ? (String(summary.cost_per_minute).startsWith('Rs') ? String(summary.cost_per_minute) : `Rs. ${summary.cost_per_minute}`)
          : '—',
        icon: DollarSign,
        color: 'text-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
      },
      {
        label: 'Est. Loss',
        value: summary?.est_loss != null
          ? (String(summary.est_loss).startsWith('Rs') ? String(summary.est_loss) : `Rs. ${summary.est_loss}`)
          : '—',
        icon: TrendingDown,
        color: 'text-rose-500',
        bg: 'bg-rose-50 dark:bg-rose-900/20',
      },
    ],
    [summary]
  )

  const hasCategories =
    (defectCategories?.minor?.length ?? 0) > 0 ||
    (defectCategories?.major?.length ?? 0) > 0 ||
    (defectCategories?.critical?.length ?? 0) > 0

  const sortedDefectColsList = useMemo(() => sortDefectCols(allDefectColumns), [allDefectColumns, defectCategories])

  // Custom multi-row footer: Average row + Total row directly from backend
  const customFooter = useMemo(() => {
    if (filteredRecords.length === 0) return null

    // Averages directly from backend
    const avgDowntime = columnAverages?.downtime_min ?? '—'
    const avgCostPerMin = columnAverages?.cost_per_min != null
      ? `Rs. ${columnAverages.cost_per_min}`
      : (summary?.cost_per_minute != null ? `Rs. ${summary.cost_per_minute}` : '—')
    const avgTotalLoss = columnAverages?.total_loss != null
      ? `Rs. ${Number(columnAverages.total_loss).toFixed(2)}`
      : '—'

    // Totals directly from backend
    const totDowntime = columnTotals?.downtime_min ?? '—'
    const totCostPerMin = columnTotals?.cost_per_min != null
      ? `Rs. ${columnTotals.cost_per_min}`
      : '—'
    const totTotalLoss = columnTotals?.total_loss != null
      ? `Rs. ${Number(columnTotals.total_loss).toFixed(2)}`
      : '—'

    return (
      <>
        {/* Average Row */}
        <tr className="bg-[#0d939d]">
          <td colSpan={4} className="bg-[#0d939d] px-3.5 py-2.5 text-center font-bold text-xs text-white border-t-2 border-r border-white/25 shadow-[0_-2px_4px_rgba(0,0,0,0.06)]">
            Average
          </td>
          <td className="bg-[#0d939d] px-3.5 py-2.5 text-xs font-bold text-white border-t-2 border-r border-white/25">
            {avgDowntime}
          </td>
          <td className="bg-[#0d939d] px-3.5 py-2.5 text-xs font-bold text-white border-t-2 border-r border-white/25">
            {avgCostPerMin}
          </td>
          <td className="bg-[#0d939d] px-3.5 py-2.5 text-xs font-bold text-white border-t-2 border-r border-white/25">
            {avgTotalLoss}
          </td>
          <td className="bg-[#0d939d] px-3.5 py-2.5 text-xs font-bold text-white border-t-2 border-r border-white/25">
            {summary?.factory_machine_rating || '—'}
          </td>
          <td className="bg-[#0d939d] px-3.5 py-2.5 text-xs font-bold text-white border-t-2 border-r border-white/25 whitespace-nowrap">
            {summary?.factory_machine_status || '—'}
          </td>
          {sortedDefectColsList.map((col) => (
            <td
              key={`avg_${col}`}
              className="bg-[#0d939d] px-3.5 py-2.5 text-xs font-bold text-white border-t-2 border-r border-white/25 text-center"
            >
              {columnAverages?.defects?.[col] ?? '—'}
            </td>
          ))}
        </tr>

        {/* Total Row */}
        <tr className="bg-[#0d939d]">
          <td colSpan={4} className="bg-[#0d939d] px-3.5 py-2.5 text-center font-bold text-xs text-white border-t border-r border-white/25">
            Total
          </td>
          <td className="bg-[#0d939d] px-3.5 py-2.5 text-xs font-bold text-white border-t border-r border-white/25">
            {totDowntime}
          </td>
          <td className="bg-[#0d939d] px-3.5 py-2.5 text-xs font-bold text-white border-t border-r border-white/25">
            {totCostPerMin}
          </td>
          <td className="bg-[#0d939d] px-3.5 py-2.5 text-xs font-bold text-white border-t border-r border-white/25">
            {totTotalLoss}
          </td>
          <td className="bg-[#0d939d] px-3.5 py-2.5 text-xs font-medium text-white/70 border-t border-r border-white/25">
            —
          </td>
          <td className="bg-[#0d939d] px-3.5 py-2.5 text-xs font-medium text-white/70 border-t border-r border-white/25">
            —
          </td>
          {sortedDefectColsList.map((col) => (
            <td
              key={`tot_${col}`}
              className="bg-[#0d939d] px-3.5 py-2.5 text-xs font-bold text-white border-t border-r border-white/25 text-center"
            >
              {columnTotals?.defects?.[col] ?? '—'}
            </td>
          ))}
        </tr>
      </>
    )
  }, [filteredRecords.length, columnAverages, columnTotals, summary, sortedDefectColsList])

  return (
    <ReportTable<MachineDowntimeMatrixRecord>
      columns={columns}
      data={filteredRecords}
      loading={loading}
      rowKey={(r) => String(r.machine_id ?? r.sno)}
      emptyMessage="No machine downtime matrix data found."
      columnGroups={columnGroups}
      customFooter={customFooter}
      header={
        <div className="flex flex-col gap-4">

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpiCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.label} className="bg-card border border-card-border rounded-xl p-3 flex items-start gap-3 shadow-sm">
                  <div className={`p-2 rounded-lg shrink-0 ${card.bg}`}>
                    <Icon size={16} className={card.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-t-lighter leading-none mb-1 font-medium uppercase tracking-wide truncate">
                      {card.label}
                    </p>
                    {card.badge ? (
                      <div className="mt-0.5">{card.badge}</div>
                    ) : (
                      <p className="text-sm font-bold text-t-primary leading-tight truncate">{card.value}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Defect Severity Legend */}
          {hasCategories && (
            <div className="flex flex-wrap gap-3 items-center px-1">
              <span className="text-xs text-t-lighter font-medium">Defect Severity:</span>
              {(defectCategories?.critical?.length ?? 0) > 0 && (
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  <span className="text-xs text-red-500 dark:text-red-400 font-semibold">Critical:</span>
                  <span className="text-xs text-t-secondary">{defectCategories!.critical.join(', ')}</span>
                </div>
              )}
              {(defectCategories?.major?.length ?? 0) > 0 && (
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                  <span className="text-xs text-orange-500 dark:text-orange-400 font-semibold">Major:</span>
                  <span className="text-xs text-t-secondary">{defectCategories!.major.join(', ')}</span>
                </div>
              )}
              {(defectCategories?.minor?.length ?? 0) > 0 && (
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">Minor:</span>
                  <span className="text-xs text-t-secondary">{defectCategories!.minor.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Toolbar */}
          <Toolbar
            search={search}
            onSearchChange={onSearchChange}
            showExport
            onExport={handleExport}
            onExportPdf={handleExportPdf}
            exporting={exporting || exportingPdf}
          >
            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => onBranchFilterChange(e.target.value)}
              disabled={!isAdmin && Boolean(userBranchId)}
              className="h-8 px-2.5 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {!(!isAdmin && userBranchId) && <option value="">All Branches</option>}
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.branch_name}
                </option>
              ))}
            </select>
            <div className="relative z-[100]">
              <DateRangePicker startDate={fromDate} endDate={toDate} onChange={onDateRangeChange} />
            </div>
          </Toolbar>
        </div>
      }
    />
  )
}
