'use client'

import { useMemo } from 'react'
import {
  Layers,
  AlertTriangle,
  FileCheck2,
  DollarSign,
  TrendingDown,
} from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import ReportTable, { type ReportColumn } from '@/components/ui/ReportTable'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import type { CategoryWiseDefectRecord, CategoryWiseDefectSummary } from '../types'
import type { BranchOption, ShiftOption, TeamOption, ZoneOption, LineOption } from '@/hooks/useDropdownData'
import { useExport, type ExportColumn } from '@/hooks/useExport'
import { useExportPdf } from '@/hooks/useExportPdf'

interface CategoryWiseDefectListProps {
  records: CategoryWiseDefectRecord[]
  summary?: CategoryWiseDefectSummary
  loading: boolean
  search: string
  branchFilter: string
  teamFilter: string
  shiftFilter: string
  zoneFilter: string
  lineFilter: string
  categoryFilter?: string
  severityFilter?: string
  defectFilter?: string
  fromDate: string
  toDate: string
  branches?: { id: number; name: string }[]
  teams?: { id: number; name: string }[]
  shifts?: { id: number; name: string }[]
  zones?: { id: number; name: string }[]
  lines?: { id: number; name: string }[]
  defectCategories?: { id: number; name: string }[]
  severities?: { id: number; name: string }[]
  defects?: { id: number; name: string }[]
  onSearchChange: (val: string) => void
  onBranchFilterChange: (val: string) => void
  onTeamFilterChange: (val: string) => void
  onShiftFilterChange: (val: string) => void
  onZoneFilterChange: (val: string) => void
  onLineFilterChange: (val: string) => void
  onCategoryFilterChange?: (val: string) => void
  onSeverityFilterChange?: (val: string) => void
  onDefectFilterChange?: (val: string) => void
  onDateRangeChange: (start: string, end: string) => void
  onRefresh?: () => void
}

export default function CategoryWiseDefectList({
  records,
  summary,
  loading,
  search,
  branchFilter,
  teamFilter,
  shiftFilter,
  zoneFilter,
  lineFilter,
  categoryFilter = '',
  severityFilter = '',
  defectFilter = '',
  fromDate,
  toDate,
  branches = [],
  teams = [],
  shifts = [],
  zones = [],
  lines = [],
  defectCategories = [],
  severities = [],
  defects = [],
  onSearchChange,
  onBranchFilterChange,
  onTeamFilterChange,
  onShiftFilterChange,
  onZoneFilterChange,
  onLineFilterChange,
  onCategoryFilterChange,
  onSeverityFilterChange,
  onDefectFilterChange,
  onDateRangeChange,
}: CategoryWiseDefectListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()

  // ── Records returned by backend ─────────────────────────────────────────────
  const filteredRecords = records || []

  // ── KPI Summary Cards ───────────────────────────────────────────────────────
  const totalOutput = useMemo(() => {
    if (summary?.total_output !== undefined && summary?.total_output !== null) {
      return Number(summary.total_output)
    }
    return filteredRecords.reduce((sum, r) => sum + (Number(r.output) || 0), 0)
  }, [summary, filteredRecords])

  const totalDefects = useMemo(() => {
    if (summary?.total_defects !== undefined && summary?.total_defects !== null) {
      return Number(summary.total_defects)
    }
    return filteredRecords.reduce((sum, r) => sum + (Number(r.defect_qty) || 0), 0)
  }, [summary, filteredRecords])

  const totalRejections = useMemo(() => {
    if (summary?.total_rejections !== undefined && summary?.total_rejections !== null) {
      return Number(summary.total_rejections)
    }
    return filteredRecords.reduce((sum, r) => sum + (Number(r.rejection) || 0), 0)
  }, [summary, filteredRecords])

  const overallDefectPct = useMemo(() => {
    if (summary?.overall_defect_pct) return summary.overall_defect_pct
    if (totalOutput > 0) {
      return `${((totalDefects / totalOutput) * 100).toFixed(2)}%`
    }
    return '0.00%'
  }, [summary, totalOutput, totalDefects])

  const estimatedLoss = useMemo(() => {
    if (summary?.estimated_loss !== undefined && summary?.estimated_loss !== null) {
      return Number(summary.estimated_loss)
    }
    return filteredRecords.reduce((sum, r) => sum + (Number(r.loss) || 0), 0)
  }, [summary, filteredRecords])

  // ── Export Payload ──────────────────────────────────────────────────────────
  const exportPayload = useMemo(() => {
    const p: Record<string, any> = {
      type: '',
      date_from: fromDate,
      date_to: toDate || fromDate,
      from_date: fromDate,
      to_date: toDate || fromDate,
    }
    if (branchFilter) p.branch_id = branchFilter
    if (shiftFilter) {
      p.shift_id = shiftFilter
      p.shift_allocation_id = shiftFilter
    }
    if (teamFilter) p.team_id = teamFilter
    if (zoneFilter) p.zone_id = zoneFilter
    if (lineFilter) p.line_id = lineFilter
    if (categoryFilter) p.def_category = categoryFilter
    if (severityFilter) p.severity = severityFilter
    if (defectFilter) p.defect = defectFilter
    if (search) p.search = search
    return p
  }, [fromDate, toDate, branchFilter, shiftFilter, teamFilter, zoneFilter, lineFilter, categoryFilter, severityFilter, defectFilter, search])

  // Columns definition for Excel Export
  const exportColumns: ExportColumn<CategoryWiseDefectRecord>[] = useMemo(
    () => [
      { header: 'Shift', value: (r) => r.shift || '' },
      { header: 'Team', value: (r) => r.team || '' },
      { header: 'Zone', value: (r) => r.zone || '' },
      { header: 'Line No.', value: (r) => r.line_no || '' },
      { header: 'Order No', value: (r) => r.order_name || r.order_no || '' },
      { header: 'Output', value: (r) => String(r.output ?? 0) },
      { header: 'Rejection', value: (r) => String(r.rejection ?? 0) },
      { header: 'Eff %', value: (r) => `${r.eff_pct ?? 0}%` },
      { header: 'Defect Category', value: (r) => r.defect_category || '' },
      { header: 'Defect', value: (r) => r.defect || '' },
      { header: 'Severity', value: (r) => r.severity || '' },
      { header: 'Defect Qty', value: (r) => String(r.defect_qty ?? 0) },
      { header: 'Knife & Trim cut %', value: (r) => String(r.defect_pct ?? '-') },
      { header: 'Cost Per Piece', value: (r) => String(r.cost_per_piece ?? 0) },
      { header: 'Loss', value: (r) => String(r.loss ?? 0) },
    ],
    []
  )

  const { handleExport, exporting } = useExport<CategoryWiseDefectRecord>({
    apiPath: '/livetracking/categorywisedefectreport',
    payload: exportPayload,
    dataKey: 'data.data',
    columns: exportColumns,
    filename: 'Category_Wise_Defect_Report',
    method: 'POST',
  })

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/livetracking/categorywisedefectreport',
    payload: exportPayload,
    filename: 'Category_Wise_Defect_Report',
  })

  // ── Web Table Columns Definition ──────────────────────────────────────────
  const columns: ReportColumn<CategoryWiseDefectRecord>[] = [
    {
      key: 's_no',
      header: '#',
      render: (r, i) => <span className="text-t-primary font-medium">{r.s_no ?? i + 1}</span>,
      footer: () => <span className="font-bold text-white">Summary</span>,
    },
    {
      key: 'branch',
      header: 'Branch',
      sortable: true,
      sortValue: (r) => (r as any).branch_name || (r as any).branch || '',
      render: (r) => <span className="text-t-body font-medium whitespace-nowrap">{(r as any).branch_name || (r as any).branch || '—'}</span>,
    },
    {
      key: 'shift',
      header: 'Shift',
      sortable: true,
      sortValue: (r) => r.shift || '',
      render: (r) => <span className="text-t-body font-medium whitespace-nowrap">{r.shift || '—'}</span>,
    },
    {
      key: 'team',
      header: 'Team',
      sortable: true,
      sortValue: (r) => r.team || '',
      render: (r) => <span className="text-t-body font-medium whitespace-nowrap">{r.team || '—'}</span>,
    },
    {
      key: 'zone',
      header: 'Zone',
      sortable: true,
      sortValue: (r) => r.zone || '',
      render: (r) => <span className="text-t-body font-medium whitespace-nowrap">{r.zone || '—'}</span>,
    },
    {
      key: 'line_no',
      header: 'Line No.',
      sortable: true,
      sortValue: (r) => r.line_no || '',
      render: (r) => (
        <span className="text-[#007b83] dark:text-[#2dd4bf] font-semibold whitespace-nowrap">
          {r.line_no || '—'}
        </span>
      ),
    },
    {
      key: 'order_name',
      header: 'Order No',
      sortable: true,
      sortValue: (r) => r.order_name || r.order_no || '',
      render: (r) => <span className="text-t-primary font-semibold whitespace-nowrap">{r.order_no || '—'}</span>,
    },
    // {
    //   key: 'output',
    //   header: 'Output',
    //   sortable: true,
    //   sortValue: (r) => Number(r.output ?? 0),
    //   render: (r) => <span className="text-t-body font-medium">{r.output ?? 0}</span>,
    //   footer: (data) => {
    //     const sum = data.reduce((acc, row) => acc + (Number(row.output) || 0), 0)
    //     return <span className="font-bold text-white">{sum.toLocaleString()}</span>
    //   },
    // },
    // {
    //   key: 'rejection',
    //   header: 'Rejection',
    //   sortable: true,
    //   sortValue: (r) => Number(r.rejection ?? 0),
    //   render: (r) => <span className="text-red-600 dark:text-red-400 font-semibold">{r.rejection ?? 0}</span>,
    //   footer: (data) => {
    //     const sum = data.reduce((acc, row) => acc + (Number(row.rejection) || 0), 0)
    //     return <span className="font-bold text-red-200">{sum.toLocaleString()}</span>
    //   },
    // },
    // {
    //   key: 'eff_pct',
    //   header: 'Eff %',
    //   sortable: true,
    //   sortValue: (r) => Number(r.eff_pct ?? 0),
    //   render: (r) => <span className="text-emerald-600 dark:text-emerald-400 font-medium">{r.eff_pct ?? 0}%</span>,
    // },
    {
      key: 'defect_category',
      header: 'Defect Category',
      sortable: true,
      sortValue: (r) => r.defect_category || '',
      render: (r) => <span className="text-t-body whitespace-nowrap">{r.defect_category || '—'}</span>,
    },
    {
      key: 'defect',
      header: 'Defect',
      sortable: true,
      sortValue: (r) => r.defect || '',
      render: (r) => <span className="font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">{r.defect || '—'}</span>,
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      sortValue: (r) => r.severity || '',
      render: (r) => {
        const sev = String(r.severity || '').toLowerCase()
        const bg =
          sev.includes('minor') || sev.includes('major') || sev.includes('medium')
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            : sev.includes('critical')
              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${bg}`}>{r.severity || '—'}</span>
      },
    },
    {
      key: 'defect_qty',
      header: 'Defect Qty',
      sortable: true,
      sortValue: (r) => Number(r.defect_qty ?? 0),
      render: (r) => <span className="font-bold text-t-primary">{r.defect_qty ?? 0}</span>,
      footer: (data) => {
        const sum = data.reduce((acc, row) => acc + (Number(row.defect_qty) || 0), 0)
        return <span className="font-bold text-white">{sum.toLocaleString()}</span>
      },
    },
    {
      key: 'defect_pct',
      header: 'Contribution %',
      sortable: true,
      sortValue: (r) => r.defect_pct || '',
      render: (r) => <span className="text-t-secondary text-xs">{r.defect_pct || '-'}</span>,
      footer: (data) => {
        const s = summary as any
        const val = summary?.overall_defect_pct ?? s?.['overall defect pct'] ?? s?.['overall_defect_pct']
        if (val !== undefined && val !== null && val !== '') {
          const str = String(val)
          const formatted = str.endsWith('%') ? str : `${str}%`
          return <span className="font-bold text-white">{formatted}</span>
        }
        const totOutput = data.reduce((sum, row) => sum + (Number(row.output) || 0), 0)
        const totDefects = data.reduce((sum, row) => sum + (Number(row.defect_qty) || 0), 0)
        if (totOutput > 0) {
          const pct = ((totDefects / totOutput) * 100).toFixed(2)
          return <span className="font-bold text-white">{pct}%</span>
        }
        return <span className="font-bold text-white">0.00%</span>
      },
    },
    // {
    //   key: 'cost_per_piece',
    //   header: 'Cost Per Piece',
    //   sortable: true,
    //   sortValue: (r) => Number(r.cost_per_piece ?? 0),
    //   render: (r) => <span className="text-t-body font-medium">Rs. {r.cost_per_piece ?? 0}</span>,
    //   footer: (data) => {
    //     const s = summary as any
    //     const val = summary?.avg_cost_per_piece ?? s?.['avg cost per piece'] ?? s?.['avg_cost_per_piece']
    //     if (val !== undefined && val !== null && val !== '') {
    //       const num = Number(val) || 0
    //       const formatted = Number.isInteger(num) ? String(num) : num.toFixed(2)
    //       return <span className="font-bold text-[#007b83] dark:text-[#2dd4bf]">Rs. {formatted}</span>
    //     }
    //     const sum = data.reduce((acc, row) => acc + (Number(row.cost_per_piece) || 0), 0)
    //     const formatted = Number.isInteger(sum) ? String(sum) : sum.toFixed(2)
    //     return <span className="font-bold text-[#007b83] dark:text-[#2dd4bf]">Rs. {formatted}</span>
    //   },
    // },
    // {
    //   key: 'loss',
    //   header: 'Loss',
    //   sortable: true,
    //   sortValue: (r) => Number(r.loss ?? 0),
    //   render: (r) => <span className="font-bold text-red-600 dark:text-red-400">Rs. {r.loss ?? 0}</span>,
    //   footer: (data) => {
    //     const sum = data.reduce((acc, row) => acc + (Number(row.loss) || 0), 0)
    //     return <span className="font-bold text-red-600 dark:text-red-400">Rs. {sum.toLocaleString()}</span>
    //   },
    // },
  ]

  const defectSummary = useMemo(() => {
    const set = new Set<string>()
    filteredRecords.forEach((r) => {
      const d = (r.defect || r.defect_category || '').trim()
      if (d && d !== 'N/A') set.add(d)
    })
    const list = Array.from(set)
    if (list.length === 0) return { title: '—', subtitle: '', fullList: '' }
    if (list.length <= 2) {
      return {
        title: list.join(' | '),
        subtitle: `${list.length} defect ${list.length === 1 ? 'type' : 'types'}`,
        fullList: list.join(', '),
      }
    }
    return {
      title: `${list.length} Defect Types`,
      subtitle: `${list.slice(0, 2).join(', ')} +${list.length - 2} more`,
      fullList: list.join(', '),
    }
  }, [filteredRecords])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── KPI Summary Cards ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 px-4 pt-4 pb-1">
        {/* Card 1: Output */}
        <div
          className="bg-card border border-border/60 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
          style={{ borderTop: '4px solid #2563eb' }}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-t-secondary font-semibold uppercase tracking-wider">
              Output
            </span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {totalOutput.toLocaleString()}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ml-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <FileCheck2 size={18} />
          </div>
        </div>

        {/* Card 2: Defect */}
        <div
          className="bg-card border border-border/60 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
          style={{ borderTop: '4px solid #10b981' }}
          title={defectSummary.fullList ? `Defects: ${defectSummary.fullList}` : undefined}
        >
          <div className="flex flex-col min-w-0 flex-1 mr-2">
            <span className="text-xs text-t-secondary font-semibold uppercase tracking-wider">
              Defect
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate">
              {defectSummary.title}
            </span>
            {defectSummary.subtitle && (
              <span className="text-[11px] font-medium text-t-secondary truncate">
                {defectSummary.subtitle}
              </span>
            )}
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <Layers size={18} />
          </div>
        </div>

        {/* Card 3: Defect Qty */}
        <div
          className="bg-card border border-border/60 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
          style={{ borderTop: '4px solid #f59e0b' }}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-t-secondary font-semibold uppercase tracking-wider">
              Defect Qty
            </span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {totalDefects.toLocaleString()}{' '}
              <span className="text-xs font-semibold text-t-secondary">({overallDefectPct})</span>
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ml-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={18} />
          </div>
        </div>

        {/* Card 4: Est. Loss */}
        {/* <div
          className="bg-card border border-border/60 rounded-xl p-3.5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
          style={{ borderTop: '4px solid #ef4444' }}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-t-secondary font-semibold uppercase tracking-wider">
              Est. Loss
            </span>
            <span className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
              Rs. {estimatedLoss.toLocaleString()}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ml-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
            <DollarSign size={18} />
          </div>
        </div> */}
      </div>

      {/* ── Table Container ───────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <ReportTable<CategoryWiseDefectRecord>
          columns={columns}
          data={filteredRecords}
          loading={loading}
          rowKey={(r) => String(r.s_no ?? Math.random())}
          header={
            <Toolbar
              search={search}
              onSearchChange={onSearchChange}
              searchPlaceholder="Search shift, line, category, defect..."
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
                  {branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name}
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
                      {s.name}
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
                      {t.name || `Team ${t.id}`}
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
                  {zones.map((z) => (
                    <option key={z.id} value={String(z.id)}>
                      {z.name || `Zone ${z.id}`}
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
                  {lines.map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.name || `Line ${l.id}`}
                    </option>
                  ))}
                </select>

                {/* Defect Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => onCategoryFilterChange?.(e.target.value)}
                  className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[120px] shrink-0"
                >
                  <option value="">All Categories</option>
                  {defectCategories.map((c) => (
                    <option key={c.id} value={String(c.id ?? c.name)}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Severity Filter */}
                <select
                  value={severityFilter}
                  onChange={(e) => onSeverityFilterChange?.(e.target.value)}
                  className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[110px] shrink-0"
                >
                  <option value="">All Severities</option>
                  {severities.map((sev) => (
                    <option key={sev.id} value={String(sev.id ?? sev.name)}>
                      {sev.name}
                    </option>
                  ))}
                </select>

                {/* Defect Filter */}
                <select
                  value={defectFilter}
                  onChange={(e) => onDefectFilterChange?.(e.target.value)}
                  className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[110px] shrink-0"
                >
                  <option value="">All Defects</option>
                  {defects.map((d) => (
                    <option key={d.id} value={String(d.id ?? d.name)}>
                      {d.name}
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
              </div>
            </Toolbar>
          }
          totalCount={filteredRecords.length}
          emptyMessage="No category-wise defect records found for selected criteria"
          countLabel="defect record"
          countLabelPlural="defect records"
        />
      </div>
    </div>
  )
}
