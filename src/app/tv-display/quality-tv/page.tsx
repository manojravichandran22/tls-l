'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiCall } from '@/services/apiClient'
import {
  Factory,
  ClipboardList,
  Palette,
  Tag,
  Shirt,
  Users,
  Clock,
  Calendar,
  Maximize2,
  Minimize2,
  RefreshCw,
  Filter,
  ChevronDown,
} from 'lucide-react'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'
import {
  transformQualityTvBackendData,
  type QualityTvData,
  type QualityTvBackendResponse,
} from '@/lib/qualityTvData'
import QualitySection from './_components/QualitySection'
import ProductionSection from './_components/ProductionSection'

// ── MAIN QUALITY TV DISPLAY COMPONENT ───────────────────────────────────────

export default function QualityTvPage() {
  // Dropdown filter state
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const effectiveBranchId = !isAdmin && userBranchId ? String(userBranchId) : ''

  const [branchFilter, setBranchFilter] = useState(effectiveBranchId)
  const [zoneFilter, setZoneFilter] = useState('')
  const [shiftFilter, setShiftFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [lineFilter, setLineFilter] = useState<string[]>([])

  // Line multi-select popover state
  const [lineMenuOpen, setLineMenuOpen] = useState(false)
  const lineMenuRef = useRef<HTMLDivElement>(null)

  const activeBranchId = effectiveBranchId || branchFilter

  const { branches, zones, shifts, teams, lines } = useDropdownData({
    branches: true,
    zones: true,
    shifts: true,
    teams: true,
    lines: true,
    branchId: activeBranchId,
    zoneId: zoneFilter,
    shiftId: shiftFilter,
    teamId: teamFilter,
    isReport: true,
  })

  // Dashboard data state (null until initial fetch completes to prevent flashing mock data)
  const [data, setData] = useState<QualityTvData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string>('')
  const [syncError, setSyncError] = useState<string | null>(null)

  // Close line multi-select menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (lineMenuRef.current && !lineMenuRef.current.contains(e.target as Node)) {
        setLineMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleLine = (lineId: string) => {
    setLineFilter((prev) =>
      prev.includes(lineId) ? prev.filter((id) => id !== lineId) : [...prev, lineId]
    )
  }

  const selectAllLines = () => {
    if (lineFilter.length === lines.length && lines.length > 0) {
      setLineFilter([])
    } else {
      setLineFilter(lines.map((l) => String(l.id)))
    }
  }

  const getLineLabel = () => {
    if (lineFilter.length === 0) return 'All Lines'
    if (lineFilter.length === 1) {
      const match = lines.find((l) => String(l.id) === lineFilter[0])
      return match ? (match.line_name || (match as any).name || `Line ${match.id}`) : '1 Line'
    }
    if (lineFilter.length === lines.length && lines.length > 0) {
      return `All Lines (${lines.length})`
    }
    return `${lineFilter.length} Lines selected`
  }

  // Live Clock & Date State
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const tvContainerRef = useRef<HTMLDivElement>(null)

  // TLS Signal Cards Carousel — rotates cards every interval
  const [tlsCardPage, setTlsCardPage] = useState(0)
  const [tlsVisible, setTlsVisible] = useState(true)
  const TLS_PAGE_SIZE = 4

  // Refresh countdown
  const refreshInterval = data?.refreshIntervalSec || 10
  const [refreshCountdown, setRefreshCountdown] = useState(refreshInterval)

  // Sync fullscreen state if user exits via ESC or browser controls
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Live Clock & Date Update
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
      setCurrentTime(timeStr)

      const day = String(now.getDate()).padStart(2, '0')
      const month = now.toLocaleString('en-IN', { month: 'short' })
      const year = String(now.getFullYear()).slice(-2)
      setCurrentDate(`${day}-${month}-${year}`)
    }

    updateDateTime()
    const timer = setInterval(updateDateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // API Fetch Callback
  const fetchDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsSyncing(true)
    try {
      const payload: Record<string, any> = {
        search: '',
        from_date: '',
        to_date: '',
        branch_id: activeBranchId || '',
        team_id: teamFilter || '',
        zone_id: zoneFilter || '',
        line_id: lineFilter,
        shift_id: shiftFilter || '',
        shigt_id: shiftFilter || '',
        type: '',
      }

      const res = await apiCall<QualityTvBackendResponse>('/qualitytv/data', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      if (res && res.success && res.data) {
        const transformed = transformQualityTvBackendData(res.data)
        setData(transformed)
        setSyncError(null)
        setLastSyncTime(
          new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
        )
      } else if (res && !res.success) {
        console.warn('Quality TV API non-success:', res.message)
        setSyncError(res.message || 'API request failed')
      }
    } catch (err: any) {
      console.error('Failed to fetch Quality TV data:', err)
      setSyncError('Unable to connect to Quality TV API')
    } finally {
      setLoading(false)
      setIsSyncing(false)
    }
  }, [activeBranchId, zoneFilter, shiftFilter, teamFilter, lineFilter])

  // Initial fetch on mount
  useEffect(() => {
    fetchDashboard(false)
  }, [fetchDashboard])

  // Unified ticker: rotate TLS cards AND background sync with API
  useEffect(() => {
    if (!data) return
    const totalItems = data.tlsSignals.items.length
    let count = refreshInterval

    const tick = setInterval(() => {
      count -= 1

      if (count <= 0) {
        // ── rotate TLS cards (fade out → next page → fade in) ──────
        setTlsVisible(false)
        setTimeout(() => {
          setTlsCardPage(p => {
            const totalPages = Math.ceil(totalItems / TLS_PAGE_SIZE) || 1
            return (p + 1) % totalPages
          })
          setTlsVisible(true)
        }, 300)

        // ── Silent re-fetch from API ─────────
        fetchDashboard(true)

        count = refreshInterval // reset
      }

      setRefreshCountdown(count)
    }, 1000)

    return () => clearInterval(tick)
  }, [data?.tlsSignals?.items?.length, refreshInterval, fetchDashboard, data])

  // Auto-retry fetching when initial live data is not yet loaded
  useEffect(() => {
    if (data) return
    const retryTimer = setInterval(() => {
      fetchDashboard(true)
    }, 8000)
    return () => clearInterval(retryTimer)
  }, [data, fetchDashboard])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (tvContainerRef.current) {
        tvContainerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(true)
        })
      } else {
        document.documentElement.requestFullscreen().catch(() => { })
      }
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { })
      }
      setIsFullscreen(false)
    }
  }

  if (loading && !data) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin" />
            <Factory className="absolute text-teal-600 dark:text-teal-400 animate-pulse" size={20} />
          </div>
          <div className="text-center space-y-1.5">
            <h3 className="text-base font-bold text-t-primary tracking-wide">
              Loading Quality TV Dashboard...
            </h3>
            <p className="text-xs text-t-muted">
              Fetching live production and quality signals
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4 p-6">
          <div className="w-14 h-14 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
            <Factory className="text-teal-400 animate-pulse" size={26} />
          </div>
          <div className="text-center space-y-1.5 max-w-md">
            <h3 className="text-base font-bold text-t-primary tracking-wide">
              Quality TV Dashboard
            </h3>
            <p className="text-xs text-t-muted">
              {syncError ? `API Status: ${syncError}` : 'Connecting to live API backend...'}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => fetchDashboard(false)}
              disabled={isSyncing}
              className="px-4 py-2 text-xs font-bold rounded-md bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Connecting...' : 'Retry Connection'}
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const { header, qualityKpis, productionKpis, tlsSignals, topDefects, defectCategories, qualityPerformance, hourlyOutput, hourlyEfficiency, productionMetrics } = data

  return (
    <AppLayout>
      <div
        ref={tvContainerRef}
        className={`flex flex-col gap-2 text-t-primary transition-all duration-200 ${isFullscreen
          ? 'fixed inset-0 z-50 bg-page p-2 sm:p-2.5 overflow-hidden h-screen max-h-screen'
          : 'w-full'
          }`}
      >

        {/* ── TOP FILTER CONTROL BAR ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-card border border-table-line rounded-lg shadow-2xs shrink-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-t-primary">
              <Filter size={13} className="text-accent shrink-0" />
              <span className="hidden sm:inline">Filters:</span>
            </div>

            {/* Branch Filter */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-t-lighter uppercase tracking-wider">Branch:</span>
                <select
                  value={branchFilter}
                  onChange={(e) => {
                    setBranchFilter(e.target.value)
                    setZoneFilter('')
                    setShiftFilter('')
                    setTeamFilter('')
                    setLineFilter([])
                  }}
                  className="h-7.5 px-2 text-xs font-semibold cursor-pointer text-t-primary bg-page border border-input-line hover:border-accent/50 rounded-md outline-none transition-all focus:border-accent min-w-[130px]"
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.branch_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : userBranchId ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-t-lighter uppercase tracking-wider">Branch:</span>
                <span className="h-7.5 px-2.5 flex items-center text-xs font-semibold text-t-secondary bg-page border border-input-line rounded-md">
                  {branches.find((b) => b.id === Number(userBranchId))?.branch_name || `#${userBranchId}`}
                </span>
              </div>
            ) : null}

            {/* Shift Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-t-lighter uppercase tracking-wider">Shift:</span>
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="h-7.5 px-2 text-xs font-semibold cursor-pointer text-t-primary bg-page border border-input-line hover:border-accent/50 rounded-md outline-none transition-all focus:border-accent min-w-[110px]"
              >
                <option value="">All Shifts</option>
                {shifts.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.shift_name || `Shift ${s.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-t-lighter uppercase tracking-wider">Team:</span>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="h-7.5 px-2 text-xs font-semibold cursor-pointer text-t-primary bg-page border border-input-line hover:border-accent/50 rounded-md outline-none transition-all focus:border-accent min-w-[110px]"
              >
                <option value="">All Teams</option>
                {teams.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.team_name || (t as any).name || `Team ${t.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Zone Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-t-lighter uppercase tracking-wider">Zone:</span>
              <select
                value={zoneFilter}
                onChange={(e) => {
                  setZoneFilter(e.target.value)
                  setLineFilter([])
                }}
                className="h-7.5 px-2 text-xs font-semibold cursor-pointer text-t-primary bg-page border border-input-line hover:border-accent/50 rounded-md outline-none transition-all focus:border-accent min-w-[110px]"
              >
                <option value="">All Zones</option>
                {zones.map((z) => (
                  <option key={z.id} value={String(z.id)}>
                    {z.zone_name || (z as any).name || `Zone ${z.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Line Filter (Multi-Select) */}
            <div className="flex items-center gap-1.5 relative" ref={lineMenuRef}>
              <span className="text-[10px] font-bold text-t-lighter uppercase tracking-wider">Line:</span>
              <button
                type="button"
                onClick={() => setLineMenuOpen((prev) => !prev)}
                className={`h-7.5 px-2.5 text-xs font-semibold cursor-pointer bg-page border rounded-md outline-none transition-all flex items-center justify-between gap-2 min-w-[130px] max-w-[200px] text-left ${lineFilter.length > 0
                  ? 'border-accent text-accent'
                  : 'border-input-line text-t-primary hover:border-accent/50'
                  }`}
              >
                <span className="truncate">{getLineLabel()}</span>
                <ChevronDown
                  size={12}
                  className={`shrink-0 transition-transform duration-200 text-t-muted ${lineMenuOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {lineMenuOpen && (
                <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-1 w-52 max-h-64 bg-card border border-table-line rounded-lg shadow-xl z-[9999] flex flex-col py-1 overflow-hidden animate-in fade-in duration-100">
                  <div className="px-3 py-1.5 border-b border-table-line flex items-center justify-between bg-page/50">
                    <button
                      type="button"
                      onClick={selectAllLines}
                      className="text-2xs font-semibold text-accent hover:underline cursor-pointer"
                    >
                      {lineFilter.length === lines.length && lines.length > 0 ? 'Deselect All' : 'Select All'}
                    </button>
                    {lineFilter.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setLineFilter([])}
                        className="text-2xs font-medium text-t-muted hover:text-red-500 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto max-h-48 py-1 divide-y divide-table-line/30">
                    {lines.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-t-muted text-center">No lines available</div>
                    ) : (
                      lines.map((l) => {
                        const strId = String(l.id)
                        const isChecked = lineFilter.includes(strId)
                        return (
                          <label
                            key={l.id}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent/10 cursor-pointer text-xs transition-colors select-none"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleLine(strId)}
                              className="w-3.5 h-3.5 rounded accent-accent cursor-pointer"
                            />
                            <span className={`truncate ${isChecked ? 'font-bold text-accent' : 'text-t-primary'}`}>
                              {l.line_name || (l as any).name || `Line ${l.id}`}
                            </span>
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick status & reset button */}
          <div className="flex items-center gap-2 text-xs">
            {isSyncing && (
              <span className="text-accent font-semibold flex items-center gap-1 text-2xs animate-pulse">
                <RefreshCw size={11} className="animate-spin" /> Updating...
              </span>
            )}
            {(branchFilter !== effectiveBranchId || zoneFilter || shiftFilter || teamFilter || lineFilter.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setBranchFilter(effectiveBranchId)
                  setZoneFilter('')
                  setShiftFilter('')
                  setTeamFilter('')
                  setLineFilter([])
                }}
                className="text-2xs font-semibold text-t-muted hover:text-accent underline transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* ── 1. TOP HEADER BAR ── */}
        <div className="flex items-center justify-between gap-2 shrink-0 w-full">
          {/* Line Pill (Left) */}
          <div className="flex items-center gap-2.5 bg-[#085a6a] px-3 py-1.5 rounded-lg text-white shadow-xs shrink-0 max-w-[260px] md:max-w-[320px] lg:max-w-[380px]">
            <Factory size={20} className="text-teal-100 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black tracking-wide leading-tight truncate" title={header.lineName}>
                {header.lineName}
              </span>
              <span className="text-[9.5px] font-bold text-teal-200 tracking-wider uppercase leading-tight truncate">
                {header.lineSubtitle}
              </span>
            </div>
          </div>

          {/* Info Pills & Controls (Right) */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {/* Order */}
            <div className="flex items-center gap-1.5 bg-card border border-table-line px-2.5 py-1 rounded-lg shadow-2xs">
              <ClipboardList size={14} className="text-t-lighter shrink-0" />
              <div className="flex flex-col">
                <span className="text-[8.5px] font-bold text-t-lighter uppercase tracking-wider leading-none">ORDER</span>
                <span className="text-xs font-black text-t-primary mt-0.5 whitespace-nowrap">{header.order}</span>
              </div>
            </div>

            {/* Colour */}
            <div className="flex items-center gap-1.5 bg-card border border-table-line px-2.5 py-1 rounded-lg shadow-2xs">
              <Palette size={14} className="text-t-lighter shrink-0" />
              <div className="flex flex-col">
                <span className="text-[8.5px] font-bold text-t-lighter uppercase tracking-wider leading-none">COLOUR</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 border border-white/20 shadow-2xs"
                    style={{ backgroundColor: header.colourCode || '#ef4444' }}
                  />
                  <span className="text-xs font-black text-t-primary whitespace-nowrap">{header.colour}</span>
                </div>
              </div>
            </div>

            {/* Style Number */}
            <div className="flex items-center gap-1.5 bg-card border border-table-line px-2.5 py-1 rounded-lg shadow-2xs">
              <Tag size={14} className="text-t-lighter shrink-0" />
              <div className="flex flex-col">
                <span className="text-[8.5px] font-bold text-t-lighter uppercase tracking-wider leading-none">STYLE NUMBER</span>
                <span className="text-xs font-black text-t-primary mt-0.5 whitespace-nowrap">{header.styleNumber}</span>
              </div>
            </div>

            {/* Style Name */}
            <div className="flex items-center gap-1.5 bg-card border border-table-line px-2.5 py-1 rounded-lg shadow-2xs">
              <Shirt size={14} className="text-t-lighter shrink-0" />
              <div className="flex flex-col">
                <span className="text-[8.5px] font-bold text-t-lighter uppercase tracking-wider leading-none">STYLE</span>
                <span className="text-xs font-black text-t-primary mt-0.5 whitespace-nowrap">{header.styleName}</span>
              </div>
            </div>

            {/* Shift */}
            <div className="flex items-center gap-1.5 bg-card border border-table-line px-2.5 py-1 rounded-lg shadow-2xs">
              <Users size={14} className="text-t-lighter shrink-0" />
              <div className="flex flex-col">
                <span className="text-[8.5px] font-bold text-t-lighter uppercase tracking-wider leading-none">SHIFT</span>
                <span className="text-xs font-black text-t-primary mt-0.5 whitespace-nowrap">{header.shift}</span>
              </div>
            </div>

            {/* Clock */}
            <div className="flex items-center gap-1.5 bg-card border border-table-line px-2.5 py-1 rounded-lg shadow-2xs">
              <Clock size={14} className="text-t-lighter shrink-0" />
              <span className="text-xs font-black text-t-primary font-mono whitespace-nowrap">{currentTime || header.time || '06:12 PM'}</span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1.5 bg-card border border-table-line px-2.5 py-1 rounded-lg shadow-2xs">
              <Calendar size={14} className="text-t-lighter shrink-0" />
              <span className="text-xs font-black text-t-primary whitespace-nowrap">{currentDate || header.date || '01-Sep-26'}</span>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-card border border-table-line text-t-secondary hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer shrink-0"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* ── 2. MAIN SPLIT LAYOUT (QUALITY VS PRODUCTION) ── */}
        <div className={`grid gap-2.5 items-stretch ${isFullscreen ? 'grid-cols-12 flex-1 min-h-0 overflow-hidden' : 'grid-cols-1 xl:grid-cols-12'}`}>
          {/* Quality Module (Left Side) */}
          <QualitySection
            isFullscreen={isFullscreen}
            factorySetup={data.factorySetup}
            qualityKpis={qualityKpis}
            tlsSignals={tlsSignals}
            topDefects={topDefects}
            defectCategories={defectCategories}
            qualityPerformance={qualityPerformance}
            tlsCardPage={tlsCardPage}
            setTlsCardPage={setTlsCardPage}
            tlsVisible={tlsVisible}
            setTlsVisible={setTlsVisible}
          />

          {/* Production Module (Right Side) */}
          <ProductionSection
            isFullscreen={isFullscreen}
            productionKpis={productionKpis}
            hourlyOutput={hourlyOutput}
            hourlyEfficiency={hourlyEfficiency}
            productionMetrics={productionMetrics}
          />
        </div>

        {/* ── 3. BOTTOM FOOTER STATUS BAR ── */}
        <div className="bg-[#05192d] text-white px-4 py-1.5 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs shadow-md shrink-0">
          {/* Left Brand */}
          <div className="flex items-center gap-2.5">
            <span className="text-base font-black text-cyan-400 tracking-wider">QONE</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 text-xs font-medium">Intelligence in Quality & Quantity</span>
          </div>

          {/* Center Status Indicators */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-1.5 select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">Live</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <span>Data Sync: </span>
              {isSyncing ? (
                <span className="text-cyan-300 font-bold flex items-center gap-1">
                  <RefreshCw size={11} className="animate-spin" /> Syncing...
                </span>
              ) : syncError ? (
                <span className="text-amber-300 font-bold" title={syncError}>Error ({syncError})</span>
              ) : (
                  <strong className="text-white font-bold">{lastSyncTime ? `Live (${lastSyncTime})` : 'Live'}</strong>
              )}
            </div>
            <span className="text-slate-600">|</span>
            <div
              className="flex items-center gap-1.5 text-slate-300 cursor-pointer hover:text-white transition-colors"
              onClick={() => fetchDashboard(false)}
              title="Click to refresh now"
            >
              <RefreshCw
                size={12}
                className={`text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`}
                style={isSyncing ? undefined : { animationDuration: '8s' }}
              />
              <span>Auto Refresh: <strong className="text-white font-mono tabular-nums">{refreshCountdown} sec</strong></span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchDashboard(false)}
              className="px-3 py-1 text-xs font-bold rounded shadow-xs transition-colors cursor-pointer bg-[#0284c7] hover:bg-[#0369a1] text-white ring-1 ring-cyan-400/40"
            >
              Refresh
            </button>
            <span className="text-slate-400 text-2xs hidden sm:inline">© 2026 QONE.</span>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
