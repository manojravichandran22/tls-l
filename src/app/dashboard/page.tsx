'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Clock, Timer, Zap, Loader2, ChevronRight, X } from 'lucide-react'
import { apiCall } from '@/services/apiClient'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'
import {
  type DashboardApiResponse,
  type DashboardApiData,
  type DashboardApiLine,
  type QoneSignalApiItem,
  type LineStatus,
  TOP_DEFECTS,
} from '@/lib/dashboardData'

// ── HELPER COMPONENTS ────────────────────────────────────────────────────────

function StatusBadge({
  status,
  bg,
}: {
  status?: string | null
  bg?: string | null
}) {
  const cls: Record<string, string> = {
    Good: 'bg-[#059669] text-white',
    Attention: 'bg-[#f59e0b] text-neutral-950 font-bold',
    Critical: 'bg-[#dc2626] text-white',
    Stopped: 'bg-[#2563eb] text-white',
  }

  if (bg) {
    const isYellow =
      bg.toLowerCase() === '#ffc000' ||
      bg.toLowerCase() === '#ffff00' ||
      bg.toLowerCase() === '#f59e0b' ||
      bg.toLowerCase() === 'yellow' ||
      bg.toLowerCase() === 'amber'
    const textClass = isYellow ? 'text-neutral-950 font-bold' : 'text-white font-bold'
    return (
      <span
        className={`px-2.5 py-0.5 text-[11px] rounded-md shadow-xs inline-block min-w-[60px] text-center ${textClass}`}
        style={{ backgroundColor: bg }}
      >
        {status || '—'}
      </span>
    )
  }

  const badgeClass = (status && cls[status]) || 'bg-gray-500 text-white'
  return (
    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md shadow-xs inline-block min-w-[60px] text-center ${badgeClass}`}>
      {status || '—'}
    </span>
  )
}

function QoneUserIcon({
  size = 22,
  className = '',
  style,
}: {
  size?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={style}
      className={`${className} filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="7" r="4.2" />
      <path d="M4.5 20.5C4.5 16.36 7.86 13 12 13s7.5 3.36 7.5 7.5H4.5z" />
    </svg>
  )
}

function QoneSignalDots({
  signals,
  onOpenDetails,
}: {
  signals?: QoneSignalApiItem[]
  onOpenDetails?: () => void
}) {
  if (!signals || !Array.isArray(signals) || signals.length === 0) {
    return <span className="text-t-lighter font-medium text-xs">-</span>
  }

  // Maximum 10 icons displayed on UI row; balance shown in modal
  const visibleSignals = signals.slice(0, 10)
  const remainingCount = signals.length - 10

  return (
    <div className="flex items-center justify-between gap-1 w-full whitespace-nowrap">
      <div className="flex items-center justify-center gap-1 flex-nowrap overflow-hidden flex-1">
        {visibleSignals.map((s, i) => {
          const color = s.light_hexcode || s.light_color || '#10B981'
          return (
            <span
              key={i}
              title={`Workstation: ${s.tls_id || s.code || i + 1} | Color: ${s.light_color || (s.light_hexcode ? 'Alert' : 'Green')} | Defects: ${s.defect_qty ?? 0}`}
              className="inline-flex shrink-0 transition-transform hover:scale-110"
            >
              <QoneUserIcon size={20} style={{ color }} />
            </span>
          )
        })}
      </div>
      {onOpenDetails && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpenDetails()
          }}
          title={remainingCount > 0 ? `View all ${signals.length} workstations (+${remainingCount} more)` : 'View Workstation Details'}
          className="flex items-center gap-0.5 px-1 py-0.5 text-xs text-t-secondary hover:text-white hover:bg-[#0d939d] rounded transition-colors shrink-0 cursor-pointer ml-0.5"
        >
          {remainingCount > 0 && (
            <span className="text-[10px] font-bold text-[#0d939d] hover:text-white">
              +{remainingCount}
            </span>
          )}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}

function QoneSignalDetailsModal({
  lineName,
  signals,
  onClose,
}: {
  lineName: string
  signals: QoneSignalApiItem[]
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-table-line rounded-xl shadow-xl w-full max-w-lg sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-table-line flex items-center justify-between bg-table-head/40">
          <div>
            <h3 className="text-sm font-bold text-t-primary">QONE Signal Workstation Details</h3>
            <p className="text-xs text-t-secondary">{lineName} — {signals.length} Workstation{signals.length === 1 ? '' : 's'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-t-secondary hover:text-t-primary hover:bg-table-head rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Table Body */}
        <div className="p-4 overflow-y-auto flex-1">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-table-head/60 text-t-secondary text-[11px] font-semibold">
                <th className="border border-table-line/40 px-3 py-2 text-center w-16">Workstation</th>
                <th className="border border-table-line/40 px-3 py-2 text-left">Qone ID</th>
                <th className="border border-table-line/40 px-3 py-2 text-left">Operator Name</th>
                <th className="border border-table-line/40 px-3 py-2 text-center w-20">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-table-line/30">
              {signals.map((s, idx) => {
                const color = s.light_hexcode || s.light_color || '#10B981'
                return (
                  <tr key={idx} className="hover:bg-table-head/20 transition-colors">
                    <td className="border border-table-line/30 px-3 py-2 text-center">
                      <div className="flex justify-center">
                        <QoneUserIcon size={22} style={{ color }} />
                      </div>
                    </td>
                    <td className="border border-table-line/30 px-3 py-2 font-mono font-semibold text-t-primary">
                      {s.tls_id || '—'}
                    </td>
                    <td className="border border-table-line/30 px-3 py-2 text-t-primary font-medium">
                      {s.operator_name || '—'}
                    </td>
                    <td className="border border-table-line/30 px-3 py-2 text-center">
                      <div className="flex items-center justify-center">
                        <span
                          className="w-3 h-3 rounded-full inline-block shadow-xs"
                          style={{ backgroundColor: color }}
                          title={s.light_hexcode || s.light_color || '#10B981'}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-table-line flex items-center justify-end bg-table-head/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-card border border-input-line hover:bg-table-head transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function CellVal({ val, suffix, className = 'font-semibold text-t-primary' }: { val?: number | string | null; suffix?: string; className?: string }) {
  if (val === null || val === undefined || val === '') return <span className="text-t-lighter">-</span>
  const formatted = typeof val === 'number' ? val.toLocaleString() : val
  return <span className={className}>{formatted}{suffix || ''}</span>
}

function formatEff(val?: number | string | null): string {
  if (val === null || val === undefined || val === '') return '0%'
  return `${val}%`
}

// ── MAIN DASHBOARD COMPONENT ──────────────────────────────────────────────────

export default function DashboardPage() {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const [branchFilter, setBranchFilter] = useState(() => (!isAdmin && userBranchId ? String(userBranchId) : ''))
  const [activeShift, setActiveShift] = useState('')
  const [activeTeam, setActiveTeam] = useState('')

  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [apiData, setApiData] = useState<DashboardApiData | null>(null)
  const [selectedLineSignals, setSelectedLineSignals] = useState<{
    lineName: string
    signals: QoneSignalApiItem[]
  } | null>(null)

  useEffect(() => {
    if (!isAdmin && userBranchId && !branchFilter) {
      setBranchFilter(String(userBranchId))
    }
  }, [isAdmin, userBranchId, branchFilter])

  // Dropdown options (/dropdown/shiftallocationname & /dropdown/shifttoteam)
  const { branches, shifts, teams } = useDropdownData({
    branches: true,
    shifts: true,
    teams: true,
    branchId: branchFilter,
    shiftId: activeShift,
    teamId: activeTeam,
    isReport: true,
  })

  // ── Fetch Dashboard API ─────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true)
    } else {
      setIsRefreshing(true)
    }
    // console.log(`[Dashboard] ${isBackground ? '5s Background Auto-Refresh' : 'Initial Fetch'} triggered at:`, new Date().toLocaleTimeString())
    try {
      const payload: Record<string, unknown> = {
        search: '',
        branch_id: branchFilter || '',
        team_id: activeTeam || '',
        shift_id: activeShift || '',
        type: '',
      }

      const res = await apiCall<DashboardApiResponse>('/dashboard/table', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      if (res.success && res.data) {
        // console.log('[Dashboard] 5s Auto-Refresh data received successfully at:', new Date().toLocaleTimeString(), res.data)
        setApiData(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      if (!isBackground) setLoading(false)
      setIsRefreshing(false)
    }
  }, [branchFilter, activeShift, activeTeam])

  useEffect(() => {
    // Initial fetch
    fetchDashboard()

    // Refresh data in background every 5 seconds (5,000 ms) without whole page reload
    const interval = setInterval(() => {
      fetchDashboard(true)
    }, 5 * 1000)

    return () => clearInterval(interval)
  }, [fetchDashboard])

  // Header shift info mapping
  const shiftInfo = apiData?.shift_info
  const workingHoursDisplay = shiftInfo?.working_hours != null ? `${shiftInfo.working_hours} hrs` : '—'
  const workingMinDisplay = shiftInfo?.working_min != null ? `${shiftInfo.working_min} min` : '—'
  const clockedMinDisplay = shiftInfo?.clocked_min != null ? `${shiftInfo.clocked_min.toLocaleString()} min` : '—'

  // Summary mapping
  const summary = apiData?.summary

  // Lines mapping
  const lines = apiData?.lines ?? []

  // setting_type: 1 = Checking (hide AQL%), 2 = AQL Audit (show AQL%), 3 = Both (show AQL%)
  const showAql = apiData?.setting_type !== 1

  // Priority actions mapping (commented out with bottom cards)
  /*
  const dynamicPriorityActions = (apiData?.lines && apiData.lines.length > 0)
    ? apiData.lines
        .filter((l) => l.status === 'Critical' || (l.issues ?? 0) > 0)
        .slice(0, 4)
        .map((l, idx) => ({
          id: l.line_id || idx + 1,
          type: (l.status === 'Critical' ? 'critical' : 'warning') as 'critical' | 'warning',
          line: l.line_name,
          style: l.styles?.[0]?.style_name || 'Active Style',
          desc: l.critical_issues ? `${l.critical_issues} critical workstation issues` : `${l.issues} issues reported`,
          badge: l.rework_pct ? `RW ${l.rework_pct}%` : `Issues ${l.issues}`,
          time: 'Live',
        }))
    : []
  const displayPriorityActions = dynamicPriorityActions
  */

  return (
    <AppLayout>
      <div className="flex flex-col gap-3 pb-6">

        {/* ── TOP INFO BAR: Working Hours, Shifts, Zones, Date Filter ── */}
        <div className="bg-card border border-table-line rounded-card px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-5 flex-wrap">
            {/* Working Hours */}
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-t-lighter" />
              <span className="text-2xs text-t-secondary font-medium">Working Hours</span>
              <span className="text-xs font-bold text-t-primary">{workingHoursDisplay}</span>
            </div>
            {/* Working Min */}
            <div className="flex items-center gap-1.5">
              <Timer size={14} className="text-t-lighter" />
              <span className="text-2xs text-t-secondary font-medium">Working Min</span>
              <span className="text-xs font-bold text-t-primary">{workingMinDisplay}</span>
            </div>
            {/* Clocked Min */}
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-t-lighter" />
              <span className="text-2xs text-t-secondary font-medium">Clocked Min</span>
              <span className="text-xs font-bold text-t-primary">{clockedMinDisplay}</span>
            </div>
            {shiftInfo?.shift_name && (
              <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-[#0d939d]/10 text-[#0d939d] dark:text-[#2dd4bf] border border-[#0d939d]/30">
                {shiftInfo.shift_name}
              </span>
            )}
          </div>

          {/* Filters: Branch, Shift, Zone, Dates, Refresh */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Branch Filter (for Admin) */}
            {isAdmin && branches.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-2xs text-t-secondary font-semibold">Branch:</span>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="h-8 px-2.5 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent"
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.branch_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Shift Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-2xs text-t-secondary font-semibold">Shift:</span>
              <select
                value={activeShift}
                onChange={(e) => setActiveShift(e.target.value)}
                className="h-8 px-2.5 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent"
              >
                <option value="">All Shifts</option>
                {shifts.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.shift_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-2xs text-t-secondary font-semibold">Team:</span>
              <select
                value={activeTeam}
                onChange={(e) => setActiveTeam(e.target.value)}
                className="h-8 px-2.5 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent"
              >
                <option value="">All Teams</option>
                {teams.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.team_name || t.name || `Team ${t.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Live 5s Auto-refresh Indicator */}
            {/* <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-2xs font-semibold bg-[#0d939d]/10 text-[#0d939d] dark:text-[#2dd4bf] border border-[#0d939d]/30 select-none">
              <span className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-[#0d939d] animate-ping' : 'bg-emerald-500'}`} />
              <Loader2 size={12} className={`text-[#0d939d] ${isRefreshing ? 'animate-spin' : 'opacity-60'}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Live (5s)'}</span>
            </div> */}
          </div>
        </div>

        {/* ── KPI SUMMARY ROW ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* Workstations */}
          <div className="bg-card border border-table-line rounded-card p-3 shadow-xs text-center">
            <p className="text-2xs font-semibold text-t-secondary uppercase tracking-wider">Workstations</p>
            <p className="text-xl font-extrabold text-t-primary mt-1">
              {summary ? (summary.total_workstations ?? summary.workstation ?? 0) : 0}
            </p>
            <div className="flex items-center justify-center gap-2 mt-1.5 text-[10px] font-semibold">
              <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400" title="Good Workstations">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {summary?.good_workstations ?? 0}
              </span>
              <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400" title="Attention Workstations">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                {summary?.attention_workstations ?? 0}
              </span>
              <span className="flex items-center gap-0.5 text-red-600 dark:text-red-400" title="Critical Workstations">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                {summary?.critical_workstations ?? 0}
              </span>
            </div>
          </div>

          {/* QONE Signal */}
          <div className="bg-card border border-table-line rounded-card p-3 shadow-xs">
            <p className="text-2xs font-semibold text-t-secondary uppercase tracking-wider text-center">QONE Signal</p>
            <div className="flex items-center justify-around mt-1.5 gap-2">
              <div className="flex flex-col items-center">
                <p className="text-xl font-extrabold text-red-600 dark:text-red-400">
                  {summary?.critical_issues ?? 0}
                </p>
                <p className="text-[10px] text-t-lighter font-medium mt-0.5">Critical</p>
              </div>
              <div className="w-px h-8 bg-table-line" />
              <div className="flex flex-col items-center">
                <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                  {summary?.attention_issues ?? 0}
                </p>
                <p className="text-[10px] text-t-lighter font-medium mt-0.5">Attention</p>
              </div>
            </div>
          </div>

          {/* Open CAP */}
          <div className="bg-card border border-table-line rounded-card p-3 shadow-xs">
            <p className="text-2xs font-semibold text-t-secondary uppercase tracking-wider text-center">Open CAP</p>
            <div className="flex items-center justify-around mt-1.5 gap-2">
              <div className="flex flex-col items-center">
                <p className="text-xl font-extrabold text-t-primary">
                  {summary?.product_open_cap ?? 0}
                </p>
                <p className="text-[10px] text-t-lighter font-medium mt-0.5">Act Req</p>
              </div>
              <div className="w-px h-8 bg-table-line" />
              <div className="flex flex-col items-center">
                <p className="text-xl font-extrabold text-t-primary">
                  {summary?.open_cap ?? 0}
                </p>
                <p className="text-[10px] text-t-lighter font-medium mt-0.5">QC Pending</p>
              </div>
            </div>
          </div>

          {/* Rework */}
          <div className="bg-card border border-table-line rounded-card p-3 shadow-xs text-center">
            <p className="text-2xs font-semibold text-t-secondary uppercase tracking-wider">Rework</p>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {summary?.rework_pct != null ? `${summary.rework_pct}%` : '0%'}
            </p>
            <p className="text-[10px] text-t-lighter font-medium mt-0.5">
              {summary ? `${(summary.total_rework ?? 0).toLocaleString()} Total` : '0 Total'}
            </p>
          </div>

          {/* Rejection */}
          <div className="bg-card border border-table-line rounded-card p-3 shadow-xs text-center">
            <p className="text-2xs font-semibold text-t-secondary uppercase tracking-wider">Rejection</p>
            <p className="text-xl font-extrabold text-red-600 dark:text-red-400 mt-1">
              {summary?.rejection_pct != null ? `${summary.rejection_pct}%` : '0%'}
            </p>
            <p className="text-[10px] text-t-lighter font-medium mt-0.5">
              {summary ? `${(summary.total_rejection ?? 0).toLocaleString()} Total` : '0 Total'}
            </p>
          </div>

          {/* DHU */}
          <div className="bg-card border border-table-line rounded-card p-3 shadow-xs text-center">
            <p className="text-2xs font-semibold text-t-secondary uppercase tracking-wider">DHU</p>
            <p className="text-xl font-extrabold text-t-primary mt-1">
              {summary?.dhu_pct != null ? `${summary.dhu_pct}%` : '0%'}
            </p>
            <p className="text-[10px] text-t-lighter font-medium mt-0.5">
              {summary ? `${(summary.total_dhu ?? 0).toLocaleString()} Total` : '0 Total'}
            </p>
          </div>

          {/* Output */}
          <div className="bg-card border border-table-line rounded-card p-3 shadow-xs text-center">
            <p className="text-2xs font-semibold text-t-secondary uppercase tracking-wider">Output</p>
            <p className="text-lg font-extrabold text-t-primary mt-1">
              {summary ? (summary.total_output ?? 0).toLocaleString() : 0}
            </p>
            <p className="text-[10px] text-t-lighter font-medium mt-0.5">
              vs {summary ? (summary.total_target_pcs ?? 0).toLocaleString() : 0} PCS
            </p>
          </div>

          {/* Efficiency */}
          <div className="bg-card border border-table-line rounded-card p-3 shadow-xs text-center">
            <p className="text-2xs font-semibold text-t-secondary uppercase tracking-wider">Efficiency</p>
            <p className="text-xl font-extrabold text-[#007b83] dark:text-[#2dd4bf] mt-1">
              {summary?.achieved_effi != null ? formatEff(summary.achieved_effi) : '0%'}
            </p>
            <p className="text-[10px] text-t-lighter font-medium mt-0.5">
              {summary && summary.p2p != null ? `P2P: ${summary.p2p}%` : 'P2P: 0%'}
            </p>
          </div>
        </div>

        {/* ── MAIN DATA TABLE ── */}
        <div className="bg-card border border-table-line rounded-card shadow-xs overflow-hidden">
          {/* Lazy loader bar */}
          {/* <div className="h-0.5 w-full bg-table-line/30 overflow-hidden">
            {isRefreshing && (
              <div className="h-full bg-[#0d939d] animate-pulse w-full" />
            )}
          </div> */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              {/* ── Multi-Level Header ── */}
              <thead>
                {/* Row 1: Top-level group headers */}
                <tr className="bg-[#0d939d] text-white">
                  <th rowSpan={3} className="border border-[#0b8089] px-2.5 py-2 text-left text-[10px] font-semibold whitespace-nowrap align-middle w-28">Line</th>
                  <th rowSpan={3} className="border border-[#0b8089] px-2 py-2 text-center text-[10px] font-semibold whitespace-nowrap align-middle w-12">MP</th>
                  <th rowSpan={3} className="border border-[#0b8089] px-1 py-2 text-center text-[10px] font-semibold whitespace-nowrap align-middle w-[235px] max-w-[235px]">QONE Signal</th>
                  <th rowSpan={3} className="border border-[#0b8089] px-2 py-2 text-center text-[10px] font-semibold whitespace-nowrap align-middle w-14">Issues</th>
                  <th rowSpan={3} className="border border-[#0b8089] px-2 py-2 text-center text-[10px] font-semibold whitespace-nowrap align-middle w-20">Status</th>
                  <th colSpan={showAql ? 6 : 5} className="border border-[#0b8089] px-2 py-1.5 text-center text-[10px] font-bold tracking-wider uppercase">Quality Performance</th>
                  <th colSpan={5} className="border border-[#0b8089] px-2 py-1.5 text-center text-[10px] font-bold tracking-wider uppercase">Production Performance</th>
                </tr>
                {/* Row 2: Sub-headers */}
                <tr className="bg-[#0d939d] text-white text-[10px] font-semibold">
                  {/* Quality Performance: Check, RW%, RJ%, DHU, %, AQL% */}
                  <th rowSpan={2} className="border border-[#0b8089] px-2 py-2 text-center whitespace-nowrap align-middle w-16">Check</th>
                  <th rowSpan={2} className="border border-[#0b8089] px-2 py-2 text-center whitespace-nowrap align-middle w-14">RW%</th>
                  <th rowSpan={2} className="border border-[#0b8089] px-2 py-2 text-center whitespace-nowrap align-middle w-14">RJ%</th>
                  <th rowSpan={2} className="border border-[#0b8089] px-2 py-2 text-center whitespace-nowrap align-middle w-14">DHU</th>
                  <th rowSpan={2} className="border border-[#0b8089] px-2 py-2 text-center whitespace-nowrap align-middle w-14">%</th>
                  {showAql && (
                    <th rowSpan={2} className="border border-[#0b8089] px-2 py-2 text-center whitespace-nowrap align-middle w-16">AQL%</th>
                  )}
                  {/* Production Performance */}
                  <th rowSpan={2} className="border border-[#0b8089] px-2 py-2 text-center whitespace-nowrap align-middle w-18">Tgt Eff %</th>
                  <th colSpan={2} className="border border-[#0b8089] px-2 py-1 text-center whitespace-nowrap font-bold">Output</th>
                  <th rowSpan={2} className="border border-[#0b8089] px-2 py-2 text-center whitespace-nowrap align-middle w-18">Achd Eff%</th>
                  <th rowSpan={2} className="border border-[#0b8089] px-2 py-2 text-center whitespace-nowrap align-middle w-16">P2P</th>
                </tr>
                {/* Row 3: Output sub-columns */}
                <tr className="bg-[#0d939d] text-white text-[10px] font-semibold">
                  <th className="border border-[#0b8089] px-2 py-1 text-center whitespace-nowrap w-16">Target</th>
                  <th className="border border-[#0b8089] px-2 py-1 text-center whitespace-nowrap w-16">Actual</th>
                </tr>
              </thead>

              {/* ── Data Rows ── */}
              <tbody className="divide-y divide-table-line/50">
                {loading && lines.length === 0 ? (
                  <tr>
                    <td colSpan={showAql ? 16 : 15} className="py-12 text-center text-t-lighter">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin text-accent" />
                        <span>Loading dashboard data...</span>
                      </div>
                    </td>
                  </tr>
                ) : lines.length === 0 ? (
                  <tr>
                    <td colSpan={showAql ? 16 : 15} className="py-8 text-center text-t-lighter font-medium">
                      No line data found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  lines.map((row, idx) => {
                    const signalColor =
                      row.qone_signal?.find(s => (s.light_hexcode || s.light_color || '').toLowerCase().includes('red') || s.light_hexcode === '#FF0000')?.light_hexcode ||
                      row.qone_signal?.find(s => (s.light_hexcode || s.light_color || '').toLowerCase().includes('yellow') || s.light_hexcode === '#FFC000')?.light_hexcode ||
                      row.qone_signal?.[0]?.light_hexcode ||
                      row.qone_signal?.[0]?.light_color ||
                      null
                    const defaultBg = idx % 2 === 0 ? 'bg-card' : 'bg-card-alt/30'

                    // Direct API fields
                    const checkedQty = row.checked_qty ?? row.checked
                    const reworkPct = row.rework_pct
                    const rejectionPct = row.rejection_pct
                    const dhuQty = row.dhu_qty ?? row.dhu
                    const dhuPct = row.dhu_pct
                    const aqlPct = row.aql_pct
                    const targetMan = row.target_man
                    const targetPcs = row.target_pcs
                    const outputActual = row.output
                    const achdEff = row.achieved_effi
                    const p2pVal = row.p2p

                    return (
                      <tr key={row.line_id} className={`transition-colors hover:bg-card-alt/80 ${defaultBg}`}>
                        <td className="border border-table-line/40 px-2.5 py-2 font-bold text-[#0d939d] whitespace-nowrap">
                          {row.line_name}
                        </td>
                        <td className="border border-table-line/40 px-2 py-2 text-center font-semibold text-t-primary">
                          {row.mp !== null && row.mp !== undefined ? row.mp : <span className="text-t-lighter">-</span>}
                        </td>
                        <td className="border border-table-line/40 px-1 py-2 w-[235px] max-w-[235px]">
                          <QoneSignalDots
                            signals={row.qone_signal}
                            onOpenDetails={() => setSelectedLineSignals({ lineName: row.line_name, signals: row.qone_signal || [] })}
                          />
                        </td>
                        <td className="border border-table-line/40 px-2 py-2 text-center font-bold text-t-primary">
                          {row.issues !== null && row.issues !== undefined ? row.issues : <span className="text-t-lighter">-</span>}
                        </td>
                        <td className="border border-table-line/40 px-2 py-2 text-center">
                          <StatusBadge
                            status={row.status}
                            bg={signalColor}
                          />
                        </td>

                        {/* Quality Performance: Check, RW%, RJ%, DHU, %, AQL% */}
                        <td className="border border-table-line/40 px-2 py-2 text-center font-semibold text-t-primary">
                          <CellVal val={checkedQty} />
                        </td>
                        <td className="border border-table-line/40 px-2 py-2 text-center font-bold text-amber-600 dark:text-amber-400">
                          <CellVal val={reworkPct} suffix="%" className="font-bold text-amber-600 dark:text-amber-400" />
                        </td>
                        <td className="border border-table-line/40 px-2 py-2 text-center font-bold text-red-600 dark:text-red-400">
                          <CellVal val={rejectionPct} suffix="%" className="font-bold text-red-600 dark:text-red-400" />
                        </td>
                        <td className="border border-table-line/40 px-2 py-2 text-center font-semibold text-t-primary">
                          <CellVal val={dhuQty} />
                        </td>
                        <td className="border border-table-line/40 px-2 py-2 text-center font-semibold text-t-primary">
                          <CellVal val={dhuPct} suffix="%" />
                        </td>
                        {showAql && (
                          <td className="border border-table-line/40 px-2 py-2 text-center font-semibold text-t-primary">
                            <CellVal val={aqlPct} suffix="%" />
                          </td>
                        )}

                        {/* Production Performance */}
                        <td className="border border-table-line/40 px-2 py-2 text-center font-bold text-[#0d939d]">
                          <CellVal val={targetMan} className="font-bold text-[#0d939d]" />
                        </td>
                        <td className="border border-table-line/40 px-2 py-2 text-center font-semibold text-t-primary">
                          <CellVal val={targetPcs} />
                        </td>
                        <td className="border border-table-line/40 px-2 py-2 text-center font-bold text-t-primary">
                          <CellVal val={outputActual} className="font-bold text-t-primary" />
                        </td>
                        <td className="border border-table-line/40 px-2 py-2 text-center font-bold text-[#0d939d]">
                          {formatEff(achdEff)}
                        </td>
                        <td className="border border-table-line/40 px-2 py-2 text-center font-semibold text-t-primary">
                          <CellVal val={p2pVal} suffix="%" />
                        </td>
                      </tr>
                    )
                  })
                )}

                {/* ── Summary Row ── */}
                <tr className="bg-[#0d939d] text-white font-bold text-xs">
                  <td className="border border-[#0b8089] px-2.5 py-2.5 whitespace-nowrap">Summary</td>
                  <td className="border border-[#0b8089] px-2 py-2.5 text-center">
                    {summary?.total_mp ?? '—'}
                  </td>
                  <td className="border border-[#0b8089] px-1 py-2.5 w-[235px] max-w-[235px] text-center text-white/80 text-[10px]">
                    {summary ? `${summary.total_lines ?? lines.length} Lines` : ''}
                  </td>
                  <td className="border border-[#0b8089] px-2 py-2.5 text-center">
                    {summary?.total_issues ?? '—'}
                  </td>
                  <td className="border border-[#0b8089] px-2 py-2.5 text-center"></td>
                  <td className="border border-[#0b8089] px-2 py-2.5 text-center">
                    {summary?.total_checked != null ? summary.total_checked.toLocaleString() : '—'}
                  </td>
                  <td className="border border-[#0b8089] px-2 py-2.5 text-center">
                    {summary?.rework_pct != null ? `${summary.rework_pct}%` : '—'}
                  </td>
                  <td className="border border-[#0b8089] px-2 py-2.5 text-center">
                    {summary?.rejection_pct != null ? `${summary.rejection_pct}%` : '—'}
                  </td>
                  <td className="border border-[#0b8089] px-2 py-2.5 text-center">
                    {summary?.total_dhu ?? '—'}
                  </td>
                  <td className="border border-[#0b8089] px-2 py-2.5 text-center">
                    {summary?.dhu_pct != null ? `${summary.dhu_pct}%` : '—'}
                  </td>
                  {showAql && (
                    <td className="border border-[#0b8089] px-2 py-2.5 text-center">
                      {summary?.aql_pct != null ? `${summary.aql_pct}%` : '—'}
                    </td>
                  )}
                  <td className="border border-[#0b8089] px-2 py-2.5 text-center">
                    {summary?.total_target_man != null ? summary.total_target_man : '—'}
                  </td>
                  <td className="border border-[#0b8089] px-2 py-2.5 text-center">
                    {summary?.total_target_pcs != null ? summary.total_target_pcs.toLocaleString() : '—'}
                  </td>
                  <td className="border border-[#0b8089] px-2 py-2.5 text-center">
                    {summary?.total_output != null ? summary.total_output.toLocaleString() : '—'}
                  </td>
                  <td className="border border-[#0b8089] px-2 py-2.5 text-center">
                    {summary?.achieved_effi != null ? formatEff(summary.achieved_effi) : '—'}
                  </td>
                  <td className="border border-[#0b8089] px-2 py-2.5 text-center">
                    {summary?.p2p != null ? `${summary.p2p}%` : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── BOTTOM ANALYTICS ROW (4 PANELS) (Commented out) ── */}
        {/*
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">

          <div className="bg-card border border-table-line rounded-card p-3 flex flex-col justify-between shadow-xs">
            <span className="text-2xs font-bold text-t-secondary uppercase tracking-wider mb-2">
              REJECTION % TREND <span className="text-t-lighter font-normal">(Today)</span>
            </span>

            <div className="relative w-full h-32 my-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 240 100">
                <line x1="20" y1="10" x2="230" y2="10" stroke="currentColor" className="text-table-line" strokeDasharray="2,2" strokeWidth="0.5" />
                <line x1="20" y1="35" x2="230" y2="35" stroke="currentColor" className="text-table-line" strokeDasharray="2,2" strokeWidth="0.5" />
                <line x1="20" y1="60" x2="230" y2="60" stroke="#ef4444" strokeDasharray="3,3" strokeWidth="1" />
                <line x1="20" y1="85" x2="230" y2="85" stroke="currentColor" className="text-table-line" strokeWidth="0.5" />

                <text x="0" y="14" className="text-[8px] fill-t-lighter font-mono">2.5</text>
                <text x="0" y="39" className="text-[8px] fill-t-lighter font-mono">1.5</text>
                <text x="0" y="64" className="text-[8px] fill-red-500 font-mono">1.0</text>
                <text x="0" y="89" className="text-[8px] fill-t-lighter font-mono">0</text>

                <polyline fill="none" stroke="#ef4444" strokeWidth="2" points="25,78 45,70 65,58 85,50 105,42 125,50 145,45 165,38 185,32 210,25" />
                {[[25, 78], [45, 70], [65, 58], [85, 50], [105, 42], [125, 50], [145, 45], [165, 38], [185, 32], [210, 25]].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="3" className="fill-red-500 stroke-card stroke-2" />
                ))}
              </svg>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2 border-t border-table-line/50 text-[10px]">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-t-secondary font-medium">Rejection %</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 border-b-2 border-dashed border-red-500" />
                <span className="text-t-secondary font-medium">Target 1%</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-table-line rounded-card p-3 flex flex-col justify-between shadow-xs">
            <span className="text-2xs font-bold text-t-secondary uppercase tracking-wider mb-2">
              REWORK TREND <span className="text-t-lighter font-normal">(Today)</span>
            </span>

            <div className="relative w-full h-32 my-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 240 100">
                <line x1="20" y1="10" x2="230" y2="10" stroke="currentColor" className="text-table-line" strokeDasharray="2,2" strokeWidth="0.5" />
                <line x1="20" y1="35" x2="230" y2="35" stroke="currentColor" className="text-table-line" strokeDasharray="2,2" strokeWidth="0.5" />
                <line x1="20" y1="65" x2="230" y2="65" stroke="#ef4444" strokeDasharray="3,3" strokeWidth="1" />
                <line x1="20" y1="85" x2="230" y2="85" stroke="currentColor" className="text-table-line" strokeWidth="0.5" />

                <text x="0" y="14" className="text-[8px] fill-t-lighter font-mono">15</text>
                <text x="0" y="39" className="text-[8px] fill-t-lighter font-mono">9</text>
                <text x="0" y="69" className="text-[8px] fill-red-500 font-mono">2.5</text>
                <text x="0" y="89" className="text-[8px] fill-t-lighter font-mono">0</text>

                <polyline fill="none" stroke="#10b981" strokeWidth="2" points="25,80 45,70 65,58 85,58 105,40 125,48 145,52 165,38 185,20 210,15" />
                {[[25, 80], [45, 70], [65, 58], [85, 58], [105, 40], [125, 48], [145, 52], [165, 38], [185, 20], [210, 15]].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="3" className="fill-emerald-500 stroke-card stroke-2" />
                ))}
              </svg>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2 border-t border-table-line/50 text-[10px]">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-t-secondary font-medium">Rework %</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 border-b-2 border-dashed border-red-500" />
                <span className="text-t-secondary font-medium">Target 2.5%</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-table-line rounded-card p-3 flex flex-col justify-between shadow-xs">
            <span className="text-2xs font-bold text-t-secondary uppercase tracking-wider mb-2">
              TOP 3 DEFECTS <span className="text-t-lighter font-normal">(Today)</span>
            </span>

            <div className="flex flex-col gap-2.5 my-auto">
              {TOP_DEFECTS.map(def => (
                <div key={def.rank} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-t-primary">
                      <span className="text-t-lighter font-bold mr-1.5">{def.rank}</span>
                      {def.name}
                    </span>
                    <span className="text-t-secondary text-2xs font-mono font-semibold">
                      {def.count} ({def.pct})
                    </span>
                  </div>
                  <div className="w-full bg-table-line/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${def.barColor}`}
                      style={{ width: def.pct }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-2" />
          </div>

          <div className="bg-card border border-table-line rounded-card p-3 flex flex-col justify-between shadow-xs">
            <div className="flex items-center gap-1.5 mb-3 text-t-primary">
              <AlertTriangle size={15} className="text-red-500" />
              <span className="text-xs font-bold uppercase tracking-wider">PRIORITY ACTIONS</span>
            </div>

            <div className="flex flex-col gap-2">
              {displayPriorityActions.length === 0 ? (
                <p className="text-2xs text-t-lighter text-center py-6">No priority actions</p>
              ) : (
                displayPriorityActions.map(act => (
                  <div
                    key={act.id}
                    className="p-2 rounded-lg border border-table-line/70 bg-table-head/30 flex flex-col gap-1 transition-colors hover:bg-table-head/60"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${act.type === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                        <span className="text-2xs font-bold text-t-primary">
                          {act.line} &nbsp; <span className="text-t-lighter font-medium">{act.style}</span>
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${act.type === 'critical'
                        ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        }`}>
                        {act.badge}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-t-secondary font-medium">{act.desc}</span>
                      <span className="text-t-lighter font-mono">{act.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-table-line text-center">
              <button
                type="button"
                className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                View All Actions
              </button>
            </div>
          </div>

        </div>
        */}

        {/* ── QONE Signal Workstations Detail Modal ── */}
        {selectedLineSignals && (
          <QoneSignalDetailsModal
            lineName={selectedLineSignals.lineName}
            signals={selectedLineSignals.signals}
            onClose={() => setSelectedLineSignals(null)}
          />
        )}

      </div>
    </AppLayout>
  )
}
