'use client'

import { useMemo, useState, useCallback, Fragment } from 'react'
import { Activity, Loader2 } from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import DateRangePicker from '@/components/ui/DateRangePicker'
import type { LinewiseReportData, LineItem, DefectRow, DefectGroup } from '../types'
import type { BranchOption, ShiftOption, TeamOption } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { getAuthToken } from '@/lib/cookies'

interface LinewiseReworkRejectionReportListProps {
  data: LinewiseReportData | null
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

function formatPct(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(Number(val))) return '0.00%'
  const num = Number(val)
  if (num === 0) return '0.00%'
  return `${num.toFixed(2)}%`
}

export default function LinewiseReworkRejectionReportList({
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
}: LinewiseReworkRejectionReportListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const [exporting, setExporting] = useState(false)

  // Summary Metrics
  const summary = data?.summary
  const reworkData = data?.rework
  const rejectionData = data?.rejection

  // Consolidate unique lines list from aql, rework and rejection sections
  const lines: LineItem[] = useMemo(() => {
    const map = new Map<string | number, LineItem>()
    const aqlLines = data?.aql?.lines || []
    const rwLines = data?.rework?.lines || []
    const rjLines = data?.rejection?.lines || []

    aqlLines.forEach((l) => {
      if (l.id != null) map.set(l.id, { id: l.id, name: l.name || `Line ${l.id}` })
    })
    rwLines.forEach((l) => map.set(l.id, l))
    rjLines.forEach((l) => map.set(l.id, l))

    // Fallback: if lines array is empty in response, inspect line_overall_total keys
    if (map.size === 0) {
      const lineKeys = new Set<string>([
        ...Object.keys(data?.rework?.line_overall_total || {}),
        ...Object.keys(data?.rejection?.line_overall_total || {}),
      ])
      lineKeys.forEach((key) => {
        const id = key.startsWith('L') ? key.substring(1) : key
        map.set(id, { id, name: key })
      })
    }

    return Array.from(map.values())
  }, [data])

  // Map line id to AQL line data (inspection_qty, aql_pass_qty, etc.)
  const aqlLineMap = useMemo(() => {
    const map = new Map<string | number, any>()
    const aqlLines = data?.aql?.lines || []
    aqlLines.forEach((al) => {
      if (al.id != null) {
        map.set(al.id, al)
        map.set(String(al.id), al)
        map.set(Number(al.id), al)
      }
    })
    return map
  }, [data?.aql?.lines])

  const getLineCheckedPieces = useCallback(
    (lineId: string | number) => {
      const aqlInfo =
        aqlLineMap.get(lineId) ||
        aqlLineMap.get(String(lineId)) ||
        aqlLineMap.get(Number(lineId))
      if (aqlInfo) {
        if (aqlInfo.checked_qty !== undefined && aqlInfo.checked_qty !== null) {
          return Number(aqlInfo.checked_qty)
        }
        if (aqlInfo.inspection_qty !== undefined && aqlInfo.inspection_qty !== null) {
          return Number(aqlInfo.inspection_qty)
        }
        if (aqlInfo.checked_pieces !== undefined && aqlInfo.checked_pieces !== null) {
          return Number(aqlInfo.checked_pieces)
        }
      }
      return (
        (data as any)?.checked_qty_per_line ??
        (data as any)?.checked_pieces_per_line ??
        reworkData?.checked_pieces_per_line ??
        summary?.checked_pieces_per_line ??
        (data as any)?.checked_qty ??
        data?.checked_pieces ??
        0
      )
    },
    [aqlLineMap, data, reworkData, summary]
  )

  const totalCheckedPieces = useMemo(() => {
    if (data?.checked_qty !== undefined && data?.checked_qty !== null) {
      return Number(data.checked_qty)
    }
    if ((data as any)?.total_checked_qty !== undefined && (data as any)?.total_checked_qty !== null) {
      return Number((data as any).total_checked_qty)
    }
    if (data?.aql?.checked_qty !== undefined && data?.aql?.checked_qty !== null) {
      return Number(data.aql.checked_qty)
    }
    if (
      data?.aql?.inspection_qty !== undefined &&
      data?.aql?.inspection_qty !== null &&
      Number(data.aql.inspection_qty) > 0
    ) {
      return Number(data.aql.inspection_qty)
    }

    return (
      data?.total_checked_pieces ??
      reworkData?.total_checked_pieces ??
      summary?.total_checked_pieces ??
      data?.checked_pieces ??
      0
    )
  }, [data, reworkData, summary])

  const reworkGroups = useMemo<DefectGroup[]>(() => {
    return data?.rework?.groups ?? []
  }, [data])

  const rejectionGroups = useMemo<DefectGroup[]>(() => {
    return data?.rejection?.groups ?? []
  }, [data])

  // Handle Export (Excel / PDF) directly by passing target endpoint to backend
  const handleExportFile = async (type: 'pdf' | 'excel') => {
    setExporting(true)
    try {
      const token = getAuthToken()
      const payload = {
        type,
        search: search || '',
        date_from: fromDate,
        date_to: toDate || fromDate,
        shift_id: shiftFilter || '',
        branch_id: branchFilter || '',
        team_id: teamFilter || '',
      }

      const res = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          endpoint: '/report/linewisereworkrejectionreport',
          payload,
        }),
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`Export failed (${res.status}): ${errText}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = type === 'pdf' ? 'pdf' : 'xlsx'
      a.download = `Linewise_Rework_Rejection_Report_${fromDate}_${toDate}.${ext}`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 1000)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-page">
      {/* ── Toolbar with Filters, Search & Export ── */}
      <div className="p-3 sm:p-4 pb-0 shrink-0">
        <Toolbar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search defect / category..."
          showExport={true}
          exporting={exporting}
          onExport={() => handleExportFile('excel')}
          onExportPdf={() => handleExportFile('pdf')}
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
                  {b.branch_name || (b as any).name}
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
                  {t.team_name || (t as any).name || `Team ${t.id}`}
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
          </div>
        </Toolbar>
      </div>

      {/* ── Summary KPI Cards ── */}
      <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
        <div className="bg-card border border-table-line rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-t-light">Total Rework</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-[#007b83] dark:text-[#2dd4bf]">
              {summary?.total_rework ?? reworkData?.overall_total ?? 0}
            </span>
            <span className="text-2xs text-t-muted font-medium">PCS</span>
          </div>
        </div>

        <div className="bg-card border border-table-line rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-t-light">Rework %</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-[#007b83] dark:text-[#2dd4bf]">
              {formatPct(summary?.rework_percentage ?? reworkData?.overall_percentage)}
            </span>
          </div>
        </div>

        <div className="bg-card border border-table-line rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-t-light">Total Rejection</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-[#007b83] dark:text-[#2dd4bf]">
              {summary?.total_rejection ?? rejectionData?.overall_total ?? 0}
            </span>
            <span className="text-2xs text-t-muted font-medium">PCS</span>
          </div>
        </div>

        <div className="bg-card border border-table-line rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-t-light">Rejection %</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-[#007b83] dark:text-[#2dd4bf]">
              {formatPct(summary?.rejection_percentage ?? rejectionData?.overall_percentage)}
            </span>
          </div>
        </div>

        <div className="bg-card border border-table-line rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-t-light">Total Mistakes</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-[#007b83] dark:text-[#2dd4bf]">
              {data?.total_defects ?? summary?.total_mistakes ?? 0}
            </span>
            <span className="text-2xs text-t-muted font-medium">PCS</span>
          </div>
        </div>

        <div className="bg-card border border-table-line rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <span className="text-2xs font-semibold uppercase tracking-wider text-t-light">DHU %</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-[#007b83] dark:text-[#2dd4bf]">
              {formatPct(data?.dhu_percentage ?? summary?.dhu_percentage)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Report Table ── */}
      <div className="flex-1 overflow-hidden px-3 sm:px-4 pb-4 min-h-0 flex flex-col">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-t-secondary bg-card rounded-xl border border-header-line">
            <Loader2 className="animate-spin text-brand" size={24} />
            <span className="text-xs font-medium">Fetching linewise rework & rejection report...</span>
          </div>
        ) : !data || (!reworkGroups.length && !rejectionGroups.length) ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-t-muted bg-card rounded-xl border border-header-line">
            <Activity size={32} className="text-t-lighter" />
            <span className="text-xs font-medium">No linewise rework & rejection data available for the selected filters.</span>
          </div>
        ) : (
          <div className="bg-card rounded-xl shadow-sm border border-header-line flex flex-col w-full flex-1 min-h-0">
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-20 bg-[#0d939d] text-white shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                  <tr className="bg-[#0d939d]">
                    <th className="px-3.5 py-3 text-left font-semibold text-xs text-white border-b border-[#0b848d] border-r border-[#0b848d] sticky left-0 bg-[#0d939d] z-20 whitespace-nowrap min-w-[140px]">
                      Category
                    </th>
                    <th className="px-3.5 py-3 text-left font-semibold text-xs text-white border-b border-[#0b848d] border-r border-[#0b848d] whitespace-nowrap min-w-[180px]">
                      Defect / Description / Line
                    </th>
                    {lines.map((line) => {
                      const displayName = line.name || (line.id ? `Line ${line.id}` : '')
                      return (
                        <th
                          key={line.id}
                          className="px-3.5 py-3 text-center font-semibold text-xs text-white border-b border-[#0b848d] border-r border-[#0b848d] whitespace-nowrap min-w-[100px]"
                          title={displayName}
                        >
                          <div className="font-semibold text-white truncate max-w-[130px]">
                            {displayName}
                          </div>
                        </th>
                      )
                    })}
                    <th className="px-3.5 py-3 text-center font-semibold text-xs text-white border-b border-[#0b848d] last:border-r-0 whitespace-nowrap min-w-[90px]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-table-line">
                  {/* ── SECTION 0: AQL SECTION (if provided) ── */}
                  {data?.aql && (
                    <>
                      {/* AQL Pass Lots */}
                      <tr className="bg-card font-semibold text-t-primary border-b border-table-line hover:bg-card-alt/80 transition-colors">
                        <td colSpan={2} className="py-2.5 px-3.5 border-r border-table-line sticky left-0 bg-card z-10 font-bold">
                          AQL Pass Lots
                        </td>
                        {lines.map((line) => {
                          const aqlLine = aqlLineMap.get(line.id) || aqlLineMap.get(String(line.id))
                          return (
                            <td key={`aql-pass-${line.id}`} className="py-2.5 px-3.5 text-center border-r border-table-line font-semibold text-t-primary">
                              {aqlLine?.aql_pass_qty ?? 0}
                            </td>
                          )
                        })}
                        <td className="py-2.5 px-3.5 text-center font-bold text-t-primary bg-card-alt">
                          {data.aql.aql_pass_total ?? 0}
                        </td>
                      </tr>

                      {/* AQL Fail Lots */}
                      <tr className="bg-card font-semibold text-t-primary border-b border-table-line hover:bg-card-alt/80 transition-colors">
                        <td colSpan={2} className="py-2.5 px-3.5 border-r border-table-line sticky left-0 bg-card z-10 font-bold">
                          AQL Fail Lots
                        </td>
                        {lines.map((line) => {
                          const aqlLine = aqlLineMap.get(line.id) || aqlLineMap.get(String(line.id))
                          return (
                            <td key={`aql-fail-${line.id}`} className="py-2.5 px-3.5 text-center border-r border-table-line font-semibold text-t-primary">
                              {aqlLine?.aql_fail_qty ?? 0}
                            </td>
                          )
                        })}
                        <td className="py-2.5 px-3.5 text-center font-bold text-t-primary bg-card-alt">
                          {data.aql.aql_fail_total ?? 0}
                        </td>
                      </tr>

                      {/* AQL Pass % */}
                      <tr className="bg-card font-semibold text-t-primary border-b border-table-line hover:bg-card-alt/80 transition-colors">
                        <td colSpan={2} className="py-2.5 px-3.5 border-r border-table-line sticky left-0 bg-card z-10 font-bold">
                          AQL Pass %
                        </td>
                        {lines.map((line) => {
                          const aqlLine = aqlLineMap.get(line.id) || aqlLineMap.get(String(line.id))
                          return (
                            <td key={`aql-pct-${line.id}`} className="py-2.5 px-3.5 text-center border-r border-table-line font-bold text-t-primary">
                              {formatPct(aqlLine?.aql_pass_percentage)}
                            </td>
                          )
                        })}
                        <td className="py-2.5 px-3.5 text-center font-bold text-t-primary bg-card-alt">
                          {formatPct(data.aql.aql_pass_percentage)}
                        </td>
                      </tr>

                      {/* Checked Pieces (AQL) */}
                      <tr className="bg-[#edf7f8] dark:bg-[#0d2a2d] font-bold text-[#007b83] dark:text-[#2dd4bf] border-b-2 border-table-line">
                        <td colSpan={2} className="py-2.5 px-3.5 border-r border-table-line sticky left-0 bg-[#edf7f8] dark:bg-[#0d2a2d] z-10 uppercase tracking-wide">
                          Checked Pieces
                        </td>
                        {lines.map((line) => (
                          <td key={`aql-chk-${line.id}`} className="py-2.5 px-3.5 text-center border-r border-table-line font-bold text-[#007b83] dark:text-[#2dd4bf]">
                            {getLineCheckedPieces(line.id)}
                          </td>
                        ))}
                        <td className="py-2.5 px-3.5 text-center font-extrabold text-[#007b83] dark:text-[#2dd4bf] bg-[#edf7f8] dark:bg-[#0d2a2d]">
                          {totalCheckedPieces}
                        </td>
                      </tr>
                    </>
                  )}

                  {/* ── SECTION 1: REWORK ── */}
                  <tr className="bg-[#0d939d] text-white font-bold border-b border-[#0b848d]">
                    <td
                      colSpan={2 + lines.length + 1}
                      className="py-2.5 px-3.5 uppercase tracking-wider text-xs font-bold text-white"
                    >
                      REWORK (Total: {reworkData?.overall_total ?? 0} PCS | {formatPct(reworkData?.overall_percentage)})
                    </td>
                  </tr>

                  {reworkGroups.length > 0 ? (
                    reworkGroups.map((grp: DefectGroup, gIdx: number) => {
                      return (
                        <Fragment key={`rw-grp-${gIdx}`}>
                          {/* Defect Rows */}
                          {grp.rows.map((row: DefectRow, rIdx: number) => (
                            <tr key={`rw-row-${gIdx}-${rIdx}`} className="hover:bg-card-alt/80 transition-colors border-b border-table-line">
                              {rIdx === 0 && (
                                <td
                                  rowSpan={grp.rows.length}
                                  className="py-2 px-3.5 font-medium text-t-primary border-r border-table-line/50 sticky left-0 bg-card z-10 align-middle"
                                >
                                  {grp.category}
                                </td>
                              )}
                              <td className="py-2 px-3.5 text-t-body border-r border-table-line/50">
                                {row.defect}
                              </td>
                              {lines.map((line) => {
                                const lineKey = `L${line.id}`
                                const count = row[lineKey] ?? 0
                                return (
                                  <td
                                    key={`rw-${gIdx}-${rIdx}-${line.id}`}
                                    className="py-2 px-3.5 text-center border-r border-table-line/50 text-t-primary font-medium"
                                  >
                                    {count > 0 ? count : '0'}
                                  </td>
                                )
                              })}
                              <td className="py-2 px-3.5 text-center font-bold text-[#007b83] dark:text-[#2dd4bf] bg-[#edf7f8]/50 dark:bg-[#0d2a2d]/50">
                                {row.total || 0}
                              </td>
                            </tr>
                          ))}

                          {/* Category Total Row */}
                          <tr className="bg-[#edf7f8] dark:bg-[#0d2a2d] font-bold text-[#007b83] dark:text-[#2dd4bf] border-t border-b border-table-line">
                            <td className="py-2 px-3.5 font-bold border-r border-table-line sticky left-0 bg-[#edf7f8] dark:bg-[#0d2a2d] z-10">
                              Total {grp.category}
                            </td>
                            <td className="py-2 px-3.5 border-r border-table-line"></td>
                            {lines.map((line) => {
                              const lineKey = `L${line.id}`
                              const catTot = grp.line_totals?.[lineKey] ?? 0
                              return (
                                <td key={`rw-cattot-${gIdx}-${line.id}`} className="py-2 px-3.5 text-center border-r border-table-line font-bold text-[#007b83] dark:text-[#2dd4bf]">
                                  {catTot}
                                </td>
                              )
                            })}
                            <td className="py-2 px-3.5 text-center font-extrabold text-[#007b83] dark:text-[#2dd4bf] bg-[#edf7f8] dark:bg-[#0d2a2d]">
                              {grp.total || 0}
                            </td>
                          </tr>

                          {/* Category REWORK % Row */}
                          <tr className="bg-[#edf7f8]/70 dark:bg-[#0d2a2d]/70 font-semibold text-[#007b83] dark:text-[#2dd4bf] border-b border-table-line">
                            <td className="py-2 px-3.5 font-semibold border-r border-table-line sticky left-0 bg-[#edf7f8]/70 dark:bg-[#0d2a2d]/70 z-10">
                              {grp.category} REWORK %
                            </td>
                            <td className="py-2 px-3.5 border-r border-table-line"></td>
                            {lines.map((line) => {
                              const lineKey = `L${line.id}`
                              const catPct = grp.percentage?.[lineKey]
                              return (
                                <td key={`rw-catpct-${gIdx}-${line.id}`} className="py-2 px-3.5 text-center border-r border-table-line font-bold text-[#007b83] dark:text-[#2dd4bf]">
                                  {formatPct(catPct)}
                                </td>
                              )
                            })}
                            <td className="py-2 px-3.5 text-center font-bold text-[#007b83] dark:text-[#2dd4bf] bg-[#edf7f8]/70 dark:bg-[#0d2a2d]/70">
                              {formatPct(grp.overall_percentage)}
                            </td>
                          </tr>
                        </Fragment>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={2 + lines.length + 1} className="py-4 text-center text-t-muted italic">
                        No rework records found.
                      </td>
                    </tr>
                  )}

                  {/* Total Rework Pcs Summary Row */}
                  <tr className="bg-[#edf7f8] dark:bg-[#0d2a2d] font-extrabold text-[#007b83] dark:text-[#2dd4bf] border-t-2 border-[#007b83]/30">
                    <td colSpan={2} className="py-2.5 px-3.5 border-r border-table-line sticky left-0 bg-[#edf7f8] dark:bg-[#0d2a2d] z-10 uppercase tracking-wide">
                      Total Rework Pcs
                    </td>
                    {lines.map((line) => {
                      const lineKey = `L${line.id}`
                      const tot = reworkData?.line_overall_total?.[lineKey] ?? 0
                      return (
                        <td key={`rw-tot-${line.id}`} className="py-2.5 px-3.5 text-center border-r border-table-line font-extrabold text-[#007b83] dark:text-[#2dd4bf]">
                          {tot}
                        </td>
                      )
                    })}
                    <td className="py-2.5 px-3.5 text-center font-black text-[#007b83] dark:text-[#2dd4bf] bg-[#edf7f8] dark:bg-[#0d2a2d]">
                      {reworkData?.overall_total ?? 0}
                    </td>
                  </tr>

                  {/* Checked Pieces Row */}
                  <tr className="bg-card font-semibold text-t-secondary border-t border-table-line hover:bg-card-alt/80 transition-colors">
                    <td colSpan={2} className="py-2 px-3.5 border-r border-table-line sticky left-0 bg-card z-10 uppercase tracking-wide">
                      Checked Pieces
                    </td>
                    {lines.map((line) => (
                      <td key={`rw-chk-${line.id}`} className="py-2 px-3.5 text-center border-r border-table-line text-t-primary font-medium">
                        {getLineCheckedPieces(line.id)}
                      </td>
                    ))}
                    <td className="py-2 px-3.5 text-center font-bold text-t-primary bg-card-alt">
                      {totalCheckedPieces}
                    </td>
                  </tr>

                  {/* Rework % Summary Row */}
                  <tr className="bg-[#edf7f8]/70 dark:bg-[#0d2a2d]/70 font-semibold text-[#007b83] dark:text-[#2dd4bf] border-b border-table-line">
                    <td colSpan={2} className="py-2 px-3.5 border-r border-table-line sticky left-0 bg-[#edf7f8]/70 dark:bg-[#0d2a2d]/70 z-10 uppercase tracking-wide">
                      Rework %
                    </td>
                    {lines.map((line) => {
                      const lineKey = `L${line.id}`
                      const pct = reworkData?.line_overall_percentage?.[lineKey]
                      return (
                        <td key={`rw-pct-${line.id}`} className="py-2 px-3.5 text-center border-r border-table-line text-[#007b83] dark:text-[#2dd4bf] font-bold">
                          {formatPct(pct)}
                        </td>
                      )
                    })}
                    <td className="py-2 px-3.5 text-center font-bold text-[#007b83] dark:text-[#2dd4bf] bg-[#edf7f8]/70 dark:bg-[#0d2a2d]/70">
                      {formatPct(reworkData?.overall_percentage)}
                    </td>
                  </tr>

                  {/* ── SECTION 2: REJECTION ── */}
                  <tr className="bg-[#0d939d] text-white font-bold border-t-4 border-table-line border-b border-[#0b848d]">
                    <td
                      colSpan={2 + lines.length + 1}
                      className="py-2.5 px-3.5 uppercase tracking-wider text-xs font-bold text-white"
                    >
                      REJECTION (Total: {rejectionData?.overall_total ?? 0} PCS | {formatPct(rejectionData?.overall_percentage)})
                    </td>
                  </tr>

                  {rejectionGroups.length > 0 ? (
                    rejectionGroups.map((grp: DefectGroup, gIdx: number) => {
                      return (
                        <Fragment key={`rj-grp-${gIdx}`}>
                          {/* Defect Rows */}
                          {grp.rows.map((row: DefectRow, rIdx: number) => (
                            <tr key={`rj-row-${gIdx}-${rIdx}`} className="hover:bg-card-alt/80 transition-colors border-b border-table-line">
                              {rIdx === 0 && (
                                <td
                                  rowSpan={grp.rows.length}
                                  className="py-2 px-3.5 font-medium text-t-primary border-r border-table-line/50 sticky left-0 bg-card z-10 align-middle"
                                >
                                  {grp.category}
                                </td>
                              )}
                              <td className="py-2 px-3.5 text-t-body border-r border-table-line/50">
                                {row.defect}
                              </td>
                              {lines.map((line) => {
                                const lineKey = `L${line.id}`
                                const count = row[lineKey] ?? 0
                                return (
                                  <td
                                    key={`rj-${gIdx}-${rIdx}-${line.id}`}
                                    className="py-2 px-3.5 text-center border-r border-table-line/50 text-t-primary font-medium"
                                  >
                                    {count > 0 ? count : '0'}
                                  </td>
                                )
                              })}
                              <td className="py-2 px-3.5 text-center font-bold text-[#007b83] dark:text-[#2dd4bf] bg-[#edf7f8]/50 dark:bg-[#0d2a2d]/50">
                                {row.total || 0}
                              </td>
                            </tr>
                          ))}

                          {/* Category Total Row */}
                          <tr className="bg-[#edf7f8] dark:bg-[#0d2a2d] font-bold text-[#007b83] dark:text-[#2dd4bf] border-t border-b border-table-line">
                            <td className="py-2 px-3.5 font-bold border-r border-table-line sticky left-0 bg-[#edf7f8] dark:bg-[#0d2a2d] z-10">
                              Total {grp.category}
                            </td>
                            <td className="py-2 px-3.5 border-r border-table-line"></td>
                            {lines.map((line) => {
                              const lineKey = `L${line.id}`
                              const catTot = grp.line_totals?.[lineKey] ?? 0
                              return (
                                <td key={`rj-cattot-${gIdx}-${line.id}`} className="py-2 px-3.5 text-center border-r border-table-line font-bold text-[#007b83] dark:text-[#2dd4bf]">
                                  {catTot}
                                </td>
                              )
                            })}
                            <td className="py-2 px-3.5 text-center font-extrabold text-[#007b83] dark:text-[#2dd4bf] bg-[#edf7f8] dark:bg-[#0d2a2d]">
                              {grp.total || 0}
                            </td>
                          </tr>

                          {/* Category REJECTION % Row */}
                          <tr className="bg-[#edf7f8]/70 dark:bg-[#0d2a2d]/70 font-semibold text-[#007b83] dark:text-[#2dd4bf] border-b border-table-line">
                            <td className="py-2 px-3.5 font-semibold border-r border-table-line sticky left-0 bg-[#edf7f8]/70 dark:bg-[#0d2a2d]/70 z-10">
                              {grp.category} REJECTION %
                            </td>
                            <td className="py-2 px-3.5 border-r border-table-line"></td>
                            {lines.map((line) => {
                              const lineKey = `L${line.id}`
                              const catPct = grp.percentage?.[lineKey]
                              return (
                                <td key={`rj-catpct-${gIdx}-${line.id}`} className="py-2 px-3.5 text-center border-r border-table-line font-bold text-[#007b83] dark:text-[#2dd4bf]">
                                  {formatPct(catPct)}
                                </td>
                              )
                            })}
                            <td className="py-2 px-3.5 text-center font-bold text-[#007b83] dark:text-[#2dd4bf] bg-[#edf7f8]/70 dark:bg-[#0d2a2d]/70">
                              {formatPct(grp.overall_percentage)}
                            </td>
                          </tr>
                        </Fragment>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={2 + lines.length + 1} className="py-4 text-center text-t-muted italic">
                        No rejection records found.
                      </td>
                    </tr>
                  )}

                  {/* Total Rejection Pcs Summary Row */}
                  <tr className="bg-[#edf7f8] dark:bg-[#0d2a2d] font-extrabold text-[#007b83] dark:text-[#2dd4bf] border-t-2 border-[#007b83]/30">
                    <td colSpan={2} className="py-2.5 px-3.5 border-r border-table-line sticky left-0 bg-[#edf7f8] dark:bg-[#0d2a2d] z-10 uppercase tracking-wide">
                      Total Rejection Pcs
                    </td>
                    {lines.map((line) => {
                      const lineKey = `L${line.id}`
                      const tot = rejectionData?.line_overall_total?.[lineKey] ?? 0
                      return (
                        <td key={`rj-tot-${line.id}`} className="py-2.5 px-3.5 text-center border-r border-table-line font-extrabold text-[#007b83] dark:text-[#2dd4bf]">
                          {tot}
                        </td>
                      )
                    })}
                    <td className="py-2.5 px-3.5 text-center font-black text-[#007b83] dark:text-[#2dd4bf] bg-[#edf7f8] dark:bg-[#0d2a2d]">
                      {rejectionData?.overall_total ?? 0}
                    </td>
                  </tr>

                  {/* Checked Pieces Row */}
                  <tr className="bg-card font-semibold text-t-secondary border-t border-table-line hover:bg-card-alt/80 transition-colors">
                    <td colSpan={2} className="py-2 px-3.5 border-r border-table-line sticky left-0 bg-card z-10 uppercase tracking-wide">
                      Checked Pieces
                    </td>
                    {lines.map((line) => (
                      <td key={`rj-chk-${line.id}`} className="py-2 px-3.5 text-center border-r border-table-line text-t-primary font-medium">
                        {getLineCheckedPieces(line.id)}
                      </td>
                    ))}
                    <td className="py-2 px-3.5 text-center font-bold text-t-primary bg-card-alt">
                      {totalCheckedPieces}
                    </td>
                  </tr>

                  {/* Rejection % Summary Row */}
                  <tr className="bg-[#edf7f8]/70 dark:bg-[#0d2a2d]/70 font-semibold text-[#007b83] dark:text-[#2dd4bf] border-b border-table-line">
                    <td colSpan={2} className="py-2 px-3.5 border-r border-table-line sticky left-0 bg-[#edf7f8]/70 dark:bg-[#0d2a2d]/70 z-10 uppercase tracking-wide">
                      Rejection %
                    </td>
                    {lines.map((line) => {
                      const lineKey = `L${line.id}`
                      const pct = rejectionData?.line_overall_percentage?.[lineKey]
                      return (
                        <td key={`rj-pct-${line.id}`} className="py-2 px-3.5 text-center border-r border-table-line text-[#007b83] dark:text-[#2dd4bf] font-bold">
                          {formatPct(pct)}
                        </td>
                      )
                    })}
                    <td className="py-2 px-3.5 text-center font-bold text-[#007b83] dark:text-[#2dd4bf] bg-[#edf7f8]/70 dark:bg-[#0d2a2d]/70">
                      {formatPct(rejectionData?.overall_percentage)}
                    </td>
                  </tr>

                  {/* ── SECTION 3: TOTAL DEFECTS & DHU % FOOTER ── */}
                  <tr className="bg-[#0d939d] font-extrabold text-white border-t-4 border-table-line">
                    <td colSpan={2} className="py-3 px-3.5 border-r border-[#0b848d] sticky left-0 bg-[#0d939d] z-10 uppercase tracking-wide text-white font-bold">
                      Total Defects
                    </td>
                    {lines.map((line) => {
                      const lineKey = `L${line.id}`
                      const tot = data?.line_total_defects?.[lineKey] ?? 0
                      return (
                        <td key={`sum-tot-${line.id}`} className="py-3 px-3.5 text-center border-r border-[#0b848d] font-black text-white">
                          {tot}
                        </td>
                      )
                    })}
                    <td className="py-3 px-3.5 text-center font-black text-white bg-[#0b848d]">
                      {data?.total_defects ?? summary?.total_defects ?? summary?.total_mistakes ?? 0}
                    </td>
                  </tr>

                  <tr className="bg-[#0d939d] font-extrabold text-white border-t border-[#0b848d]">
                    <td colSpan={2} className="py-3 px-3.5 border-r border-[#0b848d] sticky left-0 bg-[#0d939d] z-10 uppercase tracking-wide text-white font-bold">
                      DHU %
                    </td>
                    {lines.map((line) => {
                      const lineKey = `L${line.id}`
                      const dhuPct = data?.line_dhu_percentage?.[lineKey]
                      return (
                        <td key={`sum-dhu-${line.id}`} className="py-3 px-3.5 text-center border-r border-[#0b848d] font-black text-white">
                          {formatPct(dhuPct)}
                        </td>
                      )
                    })}
                    <td className="py-3 px-3.5 text-center font-black text-white bg-[#0b848d]">
                      {formatPct(data?.dhu_percentage ?? summary?.dhu_percentage)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Lines & Summary Bar */}
            <div className="px-4 py-2.5 border-t border-table-line bg-card flex items-center justify-between shrink-0">
              <span className="text-xs font-medium text-t-secondary">
                Total Production Lines: <span className="font-semibold text-t-primary">{lines.length}</span>
              </span>
              <span className="text-xs font-medium text-t-secondary">
                Total Defect Categories: <span className="font-semibold text-t-primary">{reworkGroups.length + rejectionGroups.length}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
