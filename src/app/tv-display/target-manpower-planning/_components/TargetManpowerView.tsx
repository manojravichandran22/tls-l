'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { ArrowLeft, Loader2, Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react'
import Button from '@/components/ui/Button'
import { formatDate } from '@/lib/formatDate'
import { useExport } from '@/hooks/useExport'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import type { ManpowerPlanningItem } from './types'
import type { BranchOption, ShiftOption, TeamOption } from '@/services/dropdownService'

interface TargetManpowerViewProps {
  item: ManpowerPlanningItem
  branches?: BranchOption[]
  shifts?: ShiftOption[]
  teams?: TeamOption[]
  loading?: boolean
  onClose: () => void
}

export default function TargetManpowerView({
  item,
  branches = [],
  shifts = [],
  teams = [],
  loading = false,
  onClose,
}: TargetManpowerViewProps) {
  const { branchId: userBranchId } = useBranchAccess()

  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const exportPayload = useMemo(
    () => ({
      uuid: item.uuid || item.id || '',
      branch_id: item.branch_id || userBranchId || '',
    }),
    [item.uuid, item.id, item.branch_id, userBranchId]
  )

  const filename = `Manpower_Planning_${item.planning_date || 'report'}`

  const { handleExport, exporting } = useExport({
    apiPath: '/manPowerPlanning/show',
    payload: exportPayload,
    filename,
  })

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/manPowerPlanning/show',
    payload: exportPayload,
    filename,
  })

  const branchName =
    item.branch_name ||
    branches.find((b) => Number(b.id) === Number(item.branch_id))?.branch_name ||
    (item.branch_id ? `Branch ${item.branch_id}` : '—')

  const shiftName =
    item.shift_name ||
    shifts.find((s) => Number(s.id) === Number(item.shift_id))?.shift_name ||
    (item.shift_id ? `Shift ${item.shift_id}` : '—')

  const teamName =
    item.team_name ||
    teams.find((t) => Number(t.id) === Number(item.team_id))?.team_name ||
    teams.find((t) => Number(t.id) === Number(item.team_id))?.name ||
    (item.team_id ? `Team ${item.team_id}` : '—')

  const directManpower =
    item.overall_total?.direct_manpower ?? item.direct_manpower ?? 0
  const targetEfficiency =
    item.overall_total?.target_efficiency ?? item.target_efficiency ?? 0
  const targetPcs = item.overall_total?.target_pcs ?? item.target_pcs ?? 0

  return (
    <div className="space-y-4">
      {/* Top Header — back + title + Export & Back */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-t-muted hover:text-t-title hover:bg-card-alt border border-border transition-colors flex items-center justify-center cursor-pointer"
            title="Back to List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-semibold text-t-title">
              Target &amp; Manpower Planning Details
            </h2>
            <p className="text-xs text-t-muted mt-0.5">
              View target efficiency, direct manpower, and line performance breakdown.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Dropdown — matching Toolbar / CompanyList */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu((prev) => !prev)}
              disabled={exporting || exportingPdf}
              suppressHydrationWarning
              className="h-8 px-2.5 sm:px-3 flex items-center gap-1.5 bg-card
                border border-accent rounded-input cursor-pointer select-none
                text-sm2 text-accent font-semibold font-inherit hover:bg-accent hover:text-white
                transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {exporting || exportingPdf ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              <span className="hidden sm:inline">
                {exporting || exportingPdf ? 'Exporting...' : 'Export'}
              </span>
              <ChevronDown size={11} />
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-1 bg-card border border-table-line
                rounded-input shadow-lg z-[9999] min-w-[130px]"
              >
                <button
                  type="button"
                  onClick={() => {
                    handleExport()
                    setShowExportMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm2 hover:bg-accent
                    hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet size={13} /> Excel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleExportPdf()
                    setShowExportMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm2 hover:bg-accent
                    hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileText size={13} /> PDF
                </button>
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={onClose}>
            Back to List
          </Button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="space-y-6 bg-card border border-table-line rounded-card p-5 sm:p-6 shadow-xs">
        {/* Header Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-card-alt border border-border">
          <div>
            <span className="text-xs text-t-muted font-medium block">Planning Date</span>
            <span className="text-sm font-semibold text-t-title">
              {formatDate(item.planning_date as string)}
            </span>
          </div>

          <div>
            <span className="text-xs text-t-muted font-medium block">Branch</span>
            <span className="text-sm font-semibold text-t-title">{branchName}</span>
          </div>

          <div>
            <span className="text-xs text-t-muted font-medium block">Shift</span>
            <span className="text-sm font-semibold text-t-title">{shiftName}</span>
          </div>

          <div>
            <span className="text-xs text-t-muted font-medium block">Team</span>
            <span className="text-sm font-semibold text-t-title">{teamName}</span>
          </div>
        </div>

        {/* Overall Total Cards - Project Primary Theme Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border/40 text-left shadow-2xs">
            <span className="text-xs text-t-muted font-medium block mb-1">Direct Manpower</span>
            <span className="text-2xl font-bold text-t-title">{directManpower}</span>
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary text-left shadow-2xs">
            <span className="text-xs text-primary font-semibold block mb-1">Target Efficiency</span>
            <span className="text-2xl font-bold text-primary">{targetEfficiency}%</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border/40 text-left shadow-2xs">
            <span className="text-xs text-t-muted font-medium block mb-1">Target Pcs</span>
            <span className="text-2xl font-bold text-t-title">{targetPcs}</span>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center py-10 text-xs text-t-muted gap-2">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span>Loading line details...</span>
          </div>
        )}

        {/* Lines Breakdown Table if available */}
        {!loading && Array.isArray(item.lines) && item.lines.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-t-title">Lines Breakdown</h4>
            <div className="overflow-x-auto rounded-xl border border-border/40">
              <table className="w-full text-left text-xs text-t-body border-collapse">
                <thead className="bg-[#F8FAFC] dark:bg-card-alt text-[#334155] dark:text-t-title font-semibold uppercase tracking-wider border-b border-border/40">
                  <tr>
                    <th className="py-2.5 px-3">SHIFT</th>
                    <th className="py-2.5 px-3">ZONE</th>
                    <th className="py-2.5 px-3">LINE</th>
                    <th className="py-2.5 px-3 text-right">MANPOWER</th>
                    <th className="py-2.5 px-3 text-right">SAM</th>
                    <th className="py-2.5 px-3 text-right">HRS</th>
                    <th className="py-2.5 px-3 text-right">MINS</th>
                    <th className="py-2.5 px-3 text-right">TARGET EFF %</th>
                    <th className="py-2.5 px-3 text-right">TARGET PCS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 bg-card">
                  {item.lines.map((l, i) => (
                    <tr key={i} className="hover:bg-card-alt/40">
                      <td className="py-2 px-3 font-semibold text-primary">{shiftName}</td>
                      <td className="py-2 px-3 font-semibold text-t-title">{l.zone_name || `Zone ${l.zone_id}`}</td>
                      <td className="py-2 px-3 text-t-secondary font-medium">{l.line_name || `Line ${l.line_id}`}</td>
                      <td className="py-2 px-3 text-right">{l.direct_manpower}</td>
                      <td className="py-2 px-3 text-right">{l.sam}</td>
                      <td className="py-2 px-3 text-right">{l.working_hours}</td>
                      <td className="py-2 px-3 text-right">{l.working_minutes}</td>
                      <td className="py-2 px-2 text-right text-t-title">{l.target_efficiency}%</td>
                      <td className="py-2 px-3 text-right text-t-title">{l.target_pcs}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[#007b83] bg-[#007b83] text-white">
                  <tr className="bg-[#007b83] text-white font-bold">
                    <td colSpan={3} className="py-2.5 px-3 uppercase tracking-wider text-white">
                      Total
                    </td>
                    <td className="py-2.5 px-3 text-right text-white">
                      {directManpower}
                    </td>
                    <td className="py-2.5 px-3 text-right text-white" />
                    <td className="py-2.5 px-3 text-right text-white" />
                    <td className="py-2.5 px-3 text-right text-white" />
                    <td className="py-2.5 px-3 text-right text-white">
                      {targetEfficiency}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-white">
                      {targetPcs}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Empty state if not loading and no line items */}
        {!loading && (!Array.isArray(item.lines) || item.lines.length === 0) && (
          <div className="py-8 text-center text-xs text-t-muted">
            No line breakdown details available for this record.
          </div>
        )}
      </div>
    </div>
  )
}
