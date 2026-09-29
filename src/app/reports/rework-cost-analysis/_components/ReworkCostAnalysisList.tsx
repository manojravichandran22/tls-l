'use client'

import { useMemo, useState } from 'react'
import { Layers, CheckCircle2, AlertTriangle, IndianRupee, AlertCircle } from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import ReportTable, { type ReportColumn } from '@/components/ui/ReportTable'
import DateRangePicker from '@/components/ui/DateRangePicker'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { ReworkCostRecord, ReworkCostSummary } from '../types'
import type { BranchOption, ShiftOption, TeamOption } from '@/hooks/useDropdownData'
import { useExport, type ExportColumn } from '@/hooks/useExport'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useBranchAccess } from '@/hooks/useBranchAccess'

interface ReworkCostAnalysisListProps {
  records: ReworkCostRecord[]
  summary?: ReworkCostSummary
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
  onRefresh?: () => void
}

export default function ReworkCostAnalysisList({
  records,
  summary,
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
}: ReworkCostAnalysisListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const [selectedDefectRow, setSelectedDefectRow] = useState<ReworkCostRecord | null>(null)

  // ── Records returned by backend (search handled on backend API) ─────────────
  const filteredRecords = records

  // Use summary metrics directly from backend summary object if present
  const totalPieces = useMemo(() => {
    if (summary && summary.total_pieces !== undefined && summary.total_pieces !== null) {
      return Number(summary.total_pieces)
    }
    return filteredRecords.reduce((sum, r) => sum + (Number(r.no_of_pcs) || 0), 0)
  }, [summary, filteredRecords])

  const minorPcs = useMemo(() => {
    if (summary && summary.minor_pcs !== undefined && summary.minor_pcs !== null) {
      return Number(summary.minor_pcs)
    }
    return filteredRecords.reduce((sum, r) => {
      const sev = String(r.severity || '').toLowerCase()
      if (sev.includes('minor')) return sum + (Number(r.no_of_pcs) || 0)
      return sum
    }, 0)
  }, [summary, filteredRecords])

  const majorPcs = useMemo(() => {
    if (summary && summary.major_pcs !== undefined && summary.major_pcs !== null) {
      return Number(summary.major_pcs)
    }
    return filteredRecords.reduce((sum, r) => {
      const sev = String(r.severity || '').toLowerCase()
      if (sev.includes('major')) return sum + (Number(r.no_of_pcs) || 0)
      return sum
    }, 0)
  }, [summary, filteredRecords])

  const estLoss = useMemo(() => {
    if (summary && summary.est_loss !== undefined && summary.est_loss !== null) {
      return Number(summary.est_loss)
    }
    return filteredRecords.reduce((sum, r) => sum + (Number(r.loss) || 0), 0)
  }, [summary, filteredRecords])

  // Columns definition for Excel Export
  const exportColumns: ExportColumn<ReworkCostRecord>[] = useMemo(
    () => [
      { header: 'Shift', value: (r) => r.shift_name || '' },
      { header: 'Line.no', value: (r) => r.line_name || (r.line_id ? `Line ${r.line_id}` : '') },
      { header: 'Defect Category', value: (r) => r.defect_category || '' },
      { header: 'Defect', value: (r) => r.defect_name || '' },
      { header: 'Severity', value: (r) => r.severity || '' },
      { header: 'No.of.Pcs', value: (r) => (r.no_of_pcs !== undefined && r.no_of_pcs !== null ? Number(r.no_of_pcs) : 0) },
      { header: 'Time Taken (Min)', value: (r) => (r.time_taken !== undefined && r.time_taken !== null ? Number(r.time_taken) : 0) },
      { header: 'Cost per Min', value: (r) => (r.cost_per_min !== undefined && r.cost_per_min !== null ? Number(r.cost_per_min) : 0) },
      { header: 'Loss', value: (r) => (r.loss !== undefined && r.loss !== null ? Number(r.loss) : 0) },
      { header: 'Contribution %', value: (r) => r.contribution_pct || '0.00%' },
    ],
    []
  )

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
    return p
  }, [fromDate, toDate, branchFilter, shiftFilter, teamFilter, search])

  const { handleExport, exporting } = useExport<ReworkCostRecord>({
    apiPath: '/report/defectwisereworkreport',
    payload: exportPayload,
    dataKey: 'data',
    columns: exportColumns,
    filename: 'Defect_Wise_Rework_Cost_Analysis_Report',
    method: 'POST',
  })

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/report/defectwisereworkreport',
    payload: exportPayload,
    filename: 'Defect_Wise_Rework_Cost_Analysis_Report',
  })

  // Table Columns Definition
  const columns: ReportColumn<ReworkCostRecord>[] = [
    {
      key: 'index',
      header: 'S.No',
      render: (_: ReworkCostRecord, i: number) => (
        <span className="text-t-primary font-medium">{i + 1}</span>
      ),
      footer: () => <span className="font-bold text-white">Total</span>,
    },
    {
      key: 'branch_name',
      header: 'Branch',
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
      header: 'Shift',
      sortable: true,
      sortValue: (row) => row.shift_name || '',
      render: (row) => (
        <span className="text-t-body font-medium whitespace-nowrap">
          {row.shift_name || '—'}
        </span>
      ),
    },
    {
      key: 'team_name',
      header: 'Team',
      sortable: true,
      sortValue: (row) => row.team_name || (row as any).team || '',
      render: (row) => (
        <span className="text-t-body font-medium whitespace-nowrap">
          {row.team_name || (row as any).team || '—'}
        </span>
      ),
    },
    {
      key: 'line_name',
      header: 'Line.no',
      sortable: true,
      sortValue: (row) => row.line_name || String(row.line_id || ''),
      render: (row) => (
        <span className="text-[#007b83] dark:text-[#2dd4bf] font-semibold whitespace-nowrap">
          {row.line_name || (row.line_id ? `Line ${row.line_id}` : '—')}
        </span>
      ),
    },
    {
      key: 'defect_category',
      header: 'Defect Category',
      sortable: true,
      sortValue: (row) => row.defect_category || '',
      render: (row) => <span className="text-t-body font-medium whitespace-nowrap">{row.defect_category || '—'}</span>,
    },
    {
      key: 'defect_name',
      header: 'Defect',
      sortable: true,
      sortValue: (row) => row.defect_name || '',
      className: 'whitespace-nowrap',
      render: (row) => {
        const rawDefects = (row.defect_name || '')
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean)

        if (rawDefects.length === 0) {
          return <span className="text-t-muted">—</span>
        }

        if (rawDefects.length === 1) {
          return (
            <span className="font-semibold text-[#0d939d] dark:text-[#2dd4bf] whitespace-nowrap">
              {rawDefects[0]}
            </span>
          )
        }

        const firstDefect = rawDefects[0]
        const remainingCount = rawDefects.length - 1

        return (
          <div className="flex items-center gap-1.5 flex-nowrap">
            <span className="font-semibold text-[#0d939d] dark:text-[#2dd4bf] truncate max-w-[160px]" title={firstDefect}>
              {firstDefect}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedDefectRow(row)
              }}
              className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold rounded-md bg-[#0d939d]/10 hover:bg-[#0d939d]/20 text-[#0d939d] dark:text-[#2dd4bf] border border-[#0d939d]/30 dark:border-[#0d939d]/50 transition-all cursor-pointer shadow-2xs hover:scale-105 shrink-0 select-none"
              title="Click to view all defects"
            >
              +{remainingCount}
            </button>
          </div>
        )
      },
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      sortValue: (row) => row.severity || '',
      render: (row) => {
        if (!row.severity) return <span className="text-t-muted">—</span>
        const parts = row.severity.split(',').map((s) => s.trim()).filter(Boolean)
        const getBg = (sev: string) => {
          const s = sev.toLowerCase()
          if (s.includes('minor')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
          if (s.includes('major')) return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
          if (s.includes('critical')) return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
          return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        }
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {parts.map((p, idx) => (
              <span key={idx} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getBg(p)}`}>
                {p}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      key: 'no_of_pcs',
      header: 'No.of.Pcs',
      sortable: true,
      sortValue: (row) => Number(row.no_of_pcs ?? 0),
      render: (row) => <span className="font-medium text-t-body">{row.no_of_pcs ?? 0}</span>,
      footer: (data) => {
        const sum = data.reduce((acc, r) => acc + (Number(r.no_of_pcs) || 0), 0)
        return <span className="font-bold text-white">{sum.toLocaleString()}</span>
      },
    },
    {
      key: 'time_taken',
      header: 'Time Taken (Min)',
      sortable: true,
      sortValue: (row) => Number(row.time_taken ?? 0),
      render: (row) => <span className="font-medium text-t-body">{row.time_taken ?? 0}</span>,
      footer: (data) => {
        const sum = data.reduce((acc, r) => acc + (Number(r.time_taken) || 0), 0)
        return <span className="font-bold text-white">{sum.toLocaleString()}</span>
      },
    },
    {
      key: 'cost_per_min',
      header: 'Cost per Min',
      sortable: true,
      sortValue: (row) => Number(row.cost_per_min ?? 0),
      render: (row) => <span className="font-medium text-t-body">{Number(row.cost_per_min ?? 0).toFixed(2)}</span>,
    },
    {
      key: 'loss',
      header: 'Loss',
      sortable: true,
      sortValue: (row) => Number(row.loss ?? 0),
      render: (row) => <span className="font-medium text-t-body">{Number(row.loss ?? 0).toLocaleString()}</span>,
      footer: (data) => {
        const sum = data.reduce((acc, r) => acc + (Number(r.loss) || 0), 0)
        return (
          <span className="font-bold text-white">
            Rs. {sum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )
      },
    },
    {
      key: 'contribution_pct',
      header: 'Contribution %',
      sortable: true,
      sortValue: (row) => row.contribution_pct || '0.00%',
      render: (row) => <span className="font-semibold text-t-secondary">{row.contribution_pct || '0.00%'}</span>,
    },
  ]

  return (
    <>
      <ReportTable<ReworkCostRecord>
      columns={columns}
      data={filteredRecords}
      loading={loading}
      rowKey={(r) => String(r.defect_id || r.shift_allocation_id || r.line_id || Math.random())}
      header={
        <>
          {/* 4 KPI Summary Cards — #006a71 brand color */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 px-4 pt-4 pb-1">
            {/* Card 1: TOTAL PIECES */}
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow" style={{ borderTop: '4px solid #006a71' }}>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-t-secondary font-semibold uppercase tracking-wider">Total Pieces</span>
                <span className="text-2xl font-bold text-t-primary mt-1">{totalPieces.toLocaleString()}</span>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3" style={{ backgroundColor: '#006a7118', color: '#006a71' }}>
                <Layers size={20} />
              </div>
            </div>

            {/* Card 2: MINOR */}
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow" style={{ borderTop: '4px solid #006a71' }}>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-t-secondary font-semibold uppercase tracking-wider">Minor Defects</span>
                <span className="text-2xl font-bold mt-1" style={{ color: '#006a71' }}>
                  {minorPcs.toLocaleString()} <span className="text-sm font-medium text-t-secondary">Pcs</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3" style={{ backgroundColor: '#006a7118', color: '#006a71' }}>
                <CheckCircle2 size={20} />
              </div>
            </div>

            {/* Card 3: MAJOR */}
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow" style={{ borderTop: '4px solid #006a71' }}>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-t-secondary font-semibold uppercase tracking-wider">Major Defects</span>
                <span className="text-2xl font-bold mt-1" style={{ color: '#006a71' }}>
                  {majorPcs.toLocaleString()} <span className="text-sm font-medium text-t-secondary">Pcs</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3" style={{ backgroundColor: '#006a7118', color: '#006a71' }}>
                <AlertTriangle size={20} />
              </div>
            </div>

            {/* Card 4: EST. LOSS */}
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow" style={{ borderTop: '4px solid #006a71' }}>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-t-secondary font-semibold uppercase tracking-wider">Est. Loss</span>
                <span className="text-2xl font-bold mt-1" style={{ color: '#006a71' }}>Rs. {estLoss.toLocaleString()}</span>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3" style={{ backgroundColor: '#006a7118', color: '#006a71' }}>
                <IndianRupee size={20} />
              </div>
            </div>
          </div>

          {/* Toolbar: search + filters + export */}
          <Toolbar
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search shift, line, category, defect..."
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
            </div>
          </Toolbar>
        </>
      }
      totalCount={filteredRecords.length}
      emptyMessage="No defect wise rework cost records found for selected criteria"
      countLabel="rework cost record"
      countLabelPlural="rework cost records"
    />

      {/* Defect Details Modal */}
      {selectedDefectRow && (
        <Modal
          title="Defect Details"
          onClose={() => setSelectedDefectRow(null)}
          size="md"
          footer={
            <Button variant="outline" onClick={() => setSelectedDefectRow(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            {/* Header info cards */}
            <div className="p-3 bg-table-head/40 dark:bg-table-head/20 border border-input-line rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-t-lighter block text-[11px] font-semibold uppercase">Branch</span>
                <span className="text-t-body font-medium">{selectedDefectRow.branch_name || '—'}</span>
              </div>
              <div>
                <span className="text-t-lighter block text-[11px] font-semibold uppercase">Shift</span>
                <span className="text-t-body font-medium">{selectedDefectRow.shift_name || '—'}</span>
              </div>
              <div>
                <span className="text-t-lighter block text-[11px] font-semibold uppercase">Line</span>
                <span className="text-[#007b83] dark:text-[#2dd4bf] font-semibold">
                  {selectedDefectRow.line_name || (selectedDefectRow.line_id ? `Line ${selectedDefectRow.line_id}` : '—')}
                </span>
              </div>
              <div>
                <span className="text-t-lighter block text-[11px] font-semibold uppercase">Category</span>
                <span className="text-t-body font-medium">{selectedDefectRow.defect_category || '—'}</span>
              </div>
            </div>

            {/* Defects count heading */}
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-t-secondary flex items-center gap-1.5">
                <AlertCircle size={15} className="text-t-secondary" />
                All Defects ({(selectedDefectRow.defect_name || '').split(',').map((d) => d.trim()).filter(Boolean).length})
              </h4>
            </div>

            {/* List of Defects */}
            <div className="border border-table-line rounded-lg overflow-hidden divide-y divide-table-line bg-card max-h-[280px] overflow-y-auto">
              {(selectedDefectRow.defect_name || '')
                .split(',')
                .map((d) => d.trim())
                .filter(Boolean)
                .map((defectName, index) => {
                  const severities = (selectedDefectRow.severity || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                  const sev = severities[index] || (severities.length === 1 ? severities[0] : '')

                  const sLower = sev.toLowerCase()
                  const bg =
                    sLower.includes('minor')
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : sLower.includes('major')
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : sLower.includes('critical')
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'

                  return (
                    <div key={index} className="flex items-center justify-between px-3 py-2.5 hover:bg-card-alt/50 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-secondary text-t-secondary font-bold text-xs flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-sm text-t-body truncate">
                          {defectName}
                        </span>
                      </div>
                      {sev && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold shrink-0 ml-2 ${bg}`}>
                          {sev}
                        </span>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
