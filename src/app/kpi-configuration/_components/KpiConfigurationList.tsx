'use client'

import { useState, useMemo } from 'react'
import {
  ChevronUp,
  ChevronDown,
  Save,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import { usePermissions } from '@/hooks/usePermissions'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useExport } from '@/hooks/useExport'
import type { BranchOption } from '@/hooks/useDropdownData'
import type { KpiMasterSections, KpiMasterItem, UpdateKpiPayload } from '../types'
import { getSectionGuidance, GLOBAL_KPI_GUIDANCE } from '@/lib/kpiData'

interface KpiConfigurationListProps {
  sections: KpiMasterSections
  loading: boolean
  updating: boolean
  search: string
  onSearchChange: (val: string) => void
  onSaveAll: (payloads: UpdateKpiPayload[]) => Promise<boolean | void>
  isAdmin?: boolean
  branchId?: number | null
  branches?: BranchOption[]
  branchFilter?: string
  onBranchFilterChange?: (val: string) => void
}

function formatScoreWithPercent(score?: string | number | null): string {
  if (score === undefined || score === null || score === '') return '—'
  const str = String(score).trim()
  if (str === '—') return '—'
  return str.endsWith('%') ? str : `${str}%`
}

export default function KpiConfigurationList({
  sections,
  loading,
  updating,
  search,
  onSearchChange,
  onSaveAll,
  isAdmin = false,
  branchId = null,
  branches = [],
  branchFilter = '',
  onBranchFilterChange,
}: KpiConfigurationListProps) {
  const { can, permSet } = usePermissions('Kpimaster')
  const canUpdate = can('kpiMaster.update') || can('kpiConfiguration.update') || permSet.size === 0

  const effectiveBranch = branchId
    ? String(branchId)
    : (branchFilter || (branches && branches.length > 0 ? String(branches[0].id) : ''))

  // Export handlers using exact same structure as Light Configuration
  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/kpimaster/list',
    payload: {
      type: 'pdf',
      module: '',
      ...(effectiveBranch ? { branch_id: effectiveBranch } : {}),
      ...(search ? { search } : {}),
    },
    filename: 'KPI_Configuration_Master_Report',
  })

  const { handleExport: handleExportExcel, exporting: exportingExcel } = useExport<KpiMasterItem>({
    apiPath: '/kpimaster/list',
    payload: {
      type: 'excel',
      module: '',
      ...(effectiveBranch ? { branch_id: effectiveBranch } : {}),
      ...(search ? { search } : {}),
    },
    filename: 'KPI_Configuration_Master_Report',
  })

  // Local draft edits: keyed by item id -> string value
  const [edits, setEdits] = useState<Record<string | number, string>>({})

  // Collapsible state for each section: keyed by section name -> boolean (true = open)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (sectionName: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }))
  }

  // Flatten all items to calculate changed diffs
  const allItems = useMemo(() => {
    return Object.values(sections).flat()
  }, [sections])

  // Calculate actual diffs against original item threshold
  const actualChangedEdits = useMemo(() => {
    const diffs: Record<string | number, string> = {}
    Object.entries(edits).forEach(([id, editVal]) => {
      const orig = allItems.find((it) => String(it.id) === String(id))
      if (!orig) return

      const origThreshold =
        orig.threshold === null || orig.threshold === undefined ? '' : String(orig.threshold).trim()
      const currentThreshold = editVal.trim()

      if (origThreshold !== currentThreshold) {
        diffs[id] = currentThreshold
      }
    })
    return diffs
  }, [edits, allItems])

  const changedCount = Object.keys(actualChangedEdits).length

  const handleThresholdChange = (id: string | number, val: string) => {
    
    const cleaned = val.replace(/[^0-9.%]/g, '')

    // Allow at most one '.'
    const dotParts = cleaned.split('.')
    const dotCleaned = dotParts.length > 2 ? `${dotParts[0]}.${dotParts.slice(1).join('')}` : cleaned

    // Allow at most one '%'
    const percentParts = dotCleaned.split('%')
    let formatted = dotCleaned
    if (percentParts.length > 2) {
      formatted = `${percentParts[0]}%${percentParts.slice(1).join('')}`
    }

    setEdits((prev) => ({
      ...prev,
      [id]: formatted,
    }))
  }

  const handleResetThreshold = (id: string | number) => {
    setEdits((prev) => {
      const next = { ...prev }
      delete next[id]
      delete next[String(id)]
      return next
    })
  }

  // Save all changed items
  const handleSaveAllClick = async () => {
    const payloads: UpdateKpiPayload[] = Object.entries(actualChangedEdits).map(([id, threshold]) => ({
      id,
      threshold,
    }))
    if (payloads.length === 0) return

    const success = await onSaveAll(payloads)
    if (success !== false) {
      setEdits({})
    }
  }

  const sectionKeys = Object.keys(sections)

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-3 w-full">
      {/* ── Toolbar: Search, Excel/PDF Export & Save (Exact same structure as Light Configuration) ── */}
      <div className="bg-card border border-input-line rounded-xl shadow-2xs relative z-30">
        <Toolbar
          title="KPI Configurations"
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search module, KPI or condition..."
          onExport={handleExportExcel}
          onExportPdf={handleExportPdf}
          exporting={exportingExcel || exportingPdf}
        >
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {/* Clear / Discard Draft Changes Button */}
            {canUpdate && changedCount > 0 && (
              <button
                type="button"
                onClick={() => setEdits({})}
                disabled={updating}
                className="h-8 px-3 rounded-lg text-xs font-semibold text-t-secondary bg-card border border-input-line hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 dark:hover:border-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Discard all unsaved changes"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear ({changedCount})</span>
              </button>
            )}

            {/* Save Button */}
            {canUpdate && (
              <button
                type="button"
                onClick={handleSaveAllClick}
                disabled={updating || loading || changedCount === 0}
                className={`h-8 px-3.5 rounded-lg text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${changedCount > 0 ? 'ring-2 ring-accent/30' : ''
                  }`}
                title={changedCount > 0 ? `Save ${changedCount} changed configuration(s)` : 'No changes to save'}
              >
                {updating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save{changedCount > 0 ? ` (${changedCount})` : ''}</span>
              </button>
            )}
          </div>
        </Toolbar>
      </div>

      {/* ── Section Cards (Matching Figma Screenshot) ───────────────── */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-6">
        {/* ── Global Guidance Banner (From Excel Spec) ────────────────── */}
        {GLOBAL_KPI_GUIDANCE && (
          <div className="bg-[#eef5fc] dark:bg-slate-800/80 border border-blue-200/70 dark:border-slate-700/80 rounded-xl p-3 sm:px-4 sm:py-3 flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-600 dark:text-rose-400 font-bold leading-relaxed">
              <span className="uppercase tracking-wide font-extrabold mr-1.5">GUIDANCE:</span>
              {GLOBAL_KPI_GUIDANCE}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-10 bg-card rounded-xl border border-input-line">
            <Loader2 className="w-6 h-6 text-accent animate-spin mb-2.5" />
            <p className="text-xs text-t-muted font-medium">Loading KPI configurations...</p>
          </div>
        ) : sectionKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 bg-card rounded-xl border border-input-line text-center">
            <p className="text-sm font-semibold text-t-primary">No KPI Configurations Found</p>
            <p className="text-xs text-t-muted mt-1">
              {search ? 'Try adjusting your search criteria.' : 'No KPI entries have been configured yet.'}
            </p>
          </div>
        ) : (
          sectionKeys.map((secName, sectionIdx) => {
            const items = sections[secName] || []
            const isCollapsed = collapsedSections[secName] === true
            const guidanceBullets = getSectionGuidance(secName, sectionIdx + 1)

            return (
              <div
                key={secName}
                className={`bg-card border border-input-line rounded-xl shadow-2xs transition-all ${isCollapsed ? 'py-3 px-4 sm:px-5' : 'p-4 sm:p-5'
                  }`}
              >
                {/* ── Section Header Row (Clickable Accordion Header) ── */}
                <div
                  onClick={() => toggleSection(secName)}
                  className={`flex items-center justify-between cursor-pointer select-none rounded-lg transition-colors -mx-1 px-1 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${isCollapsed ? 'py-1' : 'pb-2'
                    }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleSection(secName)
                    }
                  }}
                  aria-expanded={!isCollapsed}
                >
                  <div className="flex items-center gap-3">
                    {/* Circle Section Number Badge */}
                    <div className="w-6 h-6 rounded-full bg-[#0d939d] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {sectionIdx + 1}
                    </div>
                    {/* Section Title */}
                    <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-[#0d939d]">
                      {secName}
                    </h2>
                  </div>

                  {/* Collapse / Expand Chevron */}
                  <div className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    {isCollapsed ? (
                      <ChevronDown className="w-4.5 h-4.5" />
                    ) : (
                      <ChevronUp className="w-4.5 h-4.5" />
                    )}
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="mt-2.5 space-y-3">
                    {/* ── Guidance Box (Figma Match) ────────────────── */}
                    <div className="bg-[#f0f7ff] dark:bg-slate-800/70 border border-blue-100 dark:border-slate-700/60 rounded-lg p-2.5 sm:p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                          i
                        </div>
                        <span className="font-bold text-[11px] text-slate-900 dark:text-blue-200">
                          Guidance
                        </span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-700 dark:text-slate-300 font-medium pl-1">
                        {guidanceBullets.map((bullet, bIdx) => (
                          <li key={bIdx}>{bullet}</li>
                        ))}
                      </ul>
                    </div>

                    {/* ── Table Layout (Figma & Excel Match) ─────────────────── */}
                    {(() => {
                      const isOverallScore =
                        secName.trim().toUpperCase().includes('OVERALL SCORE') ||
                        secName.trim().toUpperCase().includes('GRADING') ||
                        sectionIdx + 1 === 8

                      const isMachineRating =
                        secName.trim().toUpperCase().includes('MACHINE RATING') ||
                        secName.trim().toUpperCase().includes('MACHINE DOWNTIME') ||
                        sectionIdx + 1 === 9

                      return (
                        <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              {isMachineRating ? (
                                <tr className="bg-[#e6f4f6] dark:bg-[#114b4f]/40 text-[#006970] dark:text-[#2dd4bf] text-xs font-bold">
                                  <th className="py-2 px-3 w-14 text-center">S.No</th>
                                  <th className="py-2 px-3 min-w-[130px] text-center">Machine rating</th>
                                  <th className="py-2 px-3 min-w-[180px] text-center">Avg Downtime Minutes / day</th>
                                  <th className="py-2 px-3 min-w-[100px] text-center">Grade</th>
                                  <th className="py-2 px-3 min-w-[120px] text-center">Status</th>
                                </tr>
                              ) : isOverallScore ? (
                                <tr className="bg-[#e6f4f6] dark:bg-[#114b4f]/40 text-[#006970] dark:text-[#2dd4bf] text-xs font-bold">
                                  <th className="py-2 px-3 w-14 text-center">S.No</th>
                                  <th className="py-2 px-3 min-w-[120px] text-center">Condition</th>
                                  <th className="py-2 px-3 min-w-[150px] text-center">Overall Score</th>
                                  <th className="py-2 px-3 min-w-[100px] text-center">Grade</th>
                                  <th className="py-2 px-3 min-w-[180px] text-center">Status</th>
                                </tr>
                              ) : (
                                <tr className="bg-[#e6f4f6] dark:bg-[#114b4f]/40 text-[#006970] dark:text-[#2dd4bf] text-xs font-bold">
                                  <th className="py-2 px-3 w-14 text-center">S.No</th>
                                  <th className="py-2 px-3 min-w-[200px]">KPI / Score</th>
                                  <th className="py-2 px-3 min-w-[100px] text-center">Condition</th>
                                  <th className="py-2 px-3 min-w-[130px] text-center">Threshold</th>
                                  <th className="py-2 px-3 min-w-[110px] text-center">Unit</th>
                                </tr>
                              )}
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                              {items.map((item, idx) => {
                                const originalThreshold =
                                  item.threshold === null || item.threshold === undefined
                                    ? ''
                                    : String(item.threshold)
                                const currentThreshold =
                                  edits[item.id] !== undefined ? edits[item.id] : originalThreshold
                                const isModified =
                                  edits[item.id] !== undefined &&
                                  edits[item.id].trim() !== originalThreshold.trim()

                                const thresholdInput = (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <input
                                      type="text"
                                      inputMode="text"
                                      value={currentThreshold}
                                      onChange={(e) => handleThresholdChange(item.id, e.target.value)}
                                      disabled={!canUpdate || updating}
                                      placeholder="0"
                                      className="w-24 h-7 px-2 text-center text-xs font-semibold rounded-md border bg-white dark:bg-card border-slate-200 dark:border-slate-700 text-t-primary focus:border-accent focus:ring-1 focus:ring-accent transition-all disabled:opacity-50"
                                    />
                                    {isModified && (
                                      <button
                                        type="button"
                                        onClick={() => handleResetThreshold(item.id)}
                                        title="Undo changes for this KPI"
                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )

                                if (isMachineRating) {
                                  return (
                                    <tr
                                      key={String(item.id)}
                                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                      {/* S.No */}
                                      <td className="py-2 px-3 text-center font-medium text-t-muted">
                                        {idx + 1}
                                      </td>

                                      {/* Machine rating (Condition: <=, >=) */}
                                      <td className="py-2 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                                        {item.condition || '—'}
                                      </td>

                                      {/* Avg Downtime Minutes / day (Editable Threshold Input) */}
                                      <td className="py-2 px-3 text-center">
                                        {thresholdInput}
                                      </td>

                                      {/* Grade (Score: A+, A, B, C, D) */}
                                      <td className="py-2 px-3 text-center font-semibold text-t-primary">
                                        {item.score || '—'}
                                      </td>

                                      {/* Status (Unit: Excellent, Very Good, Good, Fair, Poor) */}
                                      <td className="py-2 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                                        {item.unit || '—'}
                                      </td>
                                    </tr>
                                  )
                                }

                                if (isOverallScore) {
                                  return (
                                    <tr
                                      key={String(item.id)}
                                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                      {/* S.No */}
                                      <td className="py-2 px-3 text-center font-medium text-t-muted">
                                        {idx + 1}
                                      </td>

                                      {/* Condition (Condition: >=, <=) */}
                                      <td className="py-2 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                                        {item.condition || '—'}
                                      </td>

                                      {/* Overall Score (Editable Threshold Input: 0.92, 0.84, etc.) */}
                                      <td className="py-2 px-3 text-center">
                                        {thresholdInput}
                                      </td>

                                      {/* Grade (Score: A+, A, B, C, D) */}
                                      <td className="py-2 px-3 text-center font-semibold text-t-primary">
                                        {item.score || '—'}
                                      </td>

                                      {/* Status (Unit: Excellent, Good, Need Improvement, etc.) */}
                                      <td className="py-2 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                                        {item.unit || '—'}
                                      </td>
                                    </tr>
                                  )
                                }

                                return (
                                  <tr
                                    key={String(item.id)}
                                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                                  >
                                    {/* S.No */}
                                    <td className="py-2 px-3 text-center font-medium text-t-muted">
                                      {idx + 1}
                                    </td>

                                    {/* KPI / Score */}
                                    <td className="py-2 px-3 font-medium text-t-primary">
                                      {formatScoreWithPercent(item.score)}
                                    </td>

                                    {/* Condition */}
                                    <td className="py-2 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                                      {item.condition || '—'}
                                    </td>

                                    {/* Threshold (Editable Input) */}
                                    <td className="py-2 px-3 text-center">
                                      {thresholdInput}
                                    </td>

                                    {/* Unit */}
                                    <td className="py-2 px-3 text-center font-medium text-slate-700 dark:text-slate-300">
                                      {item.unit || '—'}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
