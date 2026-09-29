'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Monitor,
  Users,
  RefreshCw,
  XCircle,
  TrendingUp,
} from 'lucide-react'
import type {
  QualityKpiData,
  TlsSignalItem,
  TlsSignalSummary,
  TopDefectItem,
  DefectCategoryItem,
  DefectCategoryDonutSlice,
  QualityPerformanceHour,
} from '@/lib/qualityTvData'

// ── SVG ICONS ────────────────────────────────────────────────────────────────

function SewingMachineIcon({ className = 'w-4 h-4', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19h16" />
      <path d="M4 15h16" />
      <path d="M6 15V7a2 2 0 0 1 2-2h8a4 4 0 0 1 4 4v6" />
      <circle cx="10" cy="9" r="1.5" />
      <path d="M14 9h2" />
      <path d="M10 11v4" />
    </svg>
  )
}

function BellAlertIcon({ className = 'w-4 h-4', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

// ── DONUT CHART COMPONENT ───────────────────────────────────────────────────

function DefectCategoryDonutChart({
  items,
  donutSlices,
  total,
}: {
  items: DefectCategoryItem[]
  donutSlices?: DefectCategoryDonutSlice[]
  total: number
}) {
  const size = 112
  const strokeWidth = 19
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const segments = donutSlices || items.map(item => ({ pct: item.pct, color: item.color }))
  let accumulatedPercent = 0

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="var(--color-table-border)"
          strokeWidth={strokeWidth}
          opacity="0.35"
        />
        {segments.map((seg, idx) => {
          if (seg.pct <= 0) return null
          const strokeDashoffset = circumference - (seg.pct / 100) * circumference
          const rotationAngle = (accumulatedPercent / 100) * 360
          accumulatedPercent += seg.pct

          return (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(${rotationAngle} ${size / 2} ${size / 2})`}
              className="transition-all duration-300"
            />
          )
        })}
      </svg>
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-black text-t-primary leading-none tracking-tight">{total}</span>
        <span className="text-[9px] font-bold text-t-lighter tracking-wider uppercase mt-1">TOTAL</span>
      </div>
    </div>
  )
}

// ── QUALITY PERFORMANCE 10-HOUR COMBO CHART ─────────────────────────────────

function QualityPerformanceChart({
  data,
  dhuTarget = 3,
}: {
  data: QualityPerformanceHour[]
  dhuTarget?: number
}) {
  const [isLaptop, setIsLaptop] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const isLaptopView = window.innerHeight < 920 || (typeof screen !== 'undefined' && screen.height < 900)
      setIsLaptop(isLaptopView)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Mathematical dynamic Y-axis scale based on any backend value
  const maxStackedBar = Math.max(
    ...data.map(d => Math.max(0, (Number(d.reworkPct) || 0) + (Number(d.rejectionPct) || 0))),
    0
  )
  const maxDhu = Math.max(...data.map(d => Math.max(0, Number(d.dhuPct) || 0)), 0)
  const maxDataVal = Math.max(maxStackedBar, maxDhu, 0)

  const { maxVal, gridSteps } = (() => {
    // If maximum is within standard 6%, keep standard 0..6% axis with 1% steps
    if (maxDataVal <= 6) {
      return { maxVal: 6, gridSteps: [0, 1, 2, 3, 4, 5, 6] }
    }

    const targetTicks = 4
    const roughStep = maxDataVal / targetTicks
    const power = Math.pow(10, Math.floor(Math.log10(roughStep)))
    const fraction = roughStep / power

    let niceFraction = 1
    if (fraction <= 1) niceFraction = 1
    else if (fraction <= 2) niceFraction = 2
    else if (fraction <= 2.5) niceFraction = 2.5
    else if (fraction <= 5) niceFraction = 5
    else niceFraction = 10

    const step = niceFraction * power
    const computedMax = Math.max(Math.ceil((maxDataVal * 1.05) / step) * step, step * targetTicks)

    const steps: number[] = []
    for (let val = 0; val <= computedMax; val += step) {
      steps.push(val)
    }

    return { maxVal: computedMax, gridSteps: steps }
  })()

  const width = isLaptop ? 740 : 540
  const height = isLaptop ? 250 : 320
  const axisX = isLaptop ? (maxVal >= 100 ? 46 : 40) : (maxVal >= 100 ? 44 : 36)
  const padRight = isLaptop ? 20 : 16
  const padTop = isLaptop ? 24 : 26
  const padBottom = isLaptop ? 28 : 24

  const chartHeight = height - padTop - padBottom
  const scaleY = (val: number) => padTop + chartHeight - (val / maxVal) * chartHeight
  const barWidth = isLaptop ? 38 : 32

  const plotLeft = axisX + barWidth / 2 + (isLaptop ? 10 : 8)
  const plotRight = width - padRight - barWidth / 2
  const colStep = (plotRight - plotLeft) / (data.length - 1 || 1)

  // Points for DHU line
  const dhuPoints = data.map((d, i) => {
    const x = plotLeft + i * colStep
    const y = scaleY(Number(d.dhuPct) || 0)
    return { x, y, val: Number(d.dhuPct) || 0 }
  })
  const dhuPolyline = dhuPoints.map(p => `${p.x},${p.y}`).join(' ')

  const formatPct = (val: number) => (Number.isInteger(val) ? `${val}%` : `${val.toFixed(1)}%`)

  return (
    <div className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Y Gridlines & axis marks */}
        {gridSteps.map(val => {
          const y = scaleY(val)
          return (
            <g key={val}>
              <line
                x1={axisX}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="var(--color-table-border)"
                strokeWidth="0.8"
                strokeDasharray={val === 0 ? undefined : '3,3'}
              />
              <line
                x1={axisX - 3}
                y1={y}
                x2={axisX}
                y2={y}
                stroke="var(--color-table-border)"
                strokeWidth="1"
              />
              <text
                x={axisX - 6}
                y={y}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={isLaptop ? 13.5 : 12.5}
                fontWeight="800"
                className="fill-t-secondary"
              >
                {val}%
              </text>
            </g>
          )
        })}

        {/* Left vertical axis line */}
        <line
          x1={axisX}
          y1={scaleY(maxVal)}
          x2={axisX}
          y2={scaleY(0)}
          stroke="var(--color-table-border)"
          strokeWidth="1.2"
        />

        {/* DHU Target reference guideline */}
        {dhuTarget <= maxVal && (
          <line
            x1={axisX}
            y1={scaleY(dhuTarget)}
            x2={width - padRight}
            y2={scaleY(dhuTarget)}
            stroke="#0284c7"
            strokeWidth="1.2"
            strokeDasharray="4,3"
            strokeOpacity="0.5"
          />
        )}

        {/* Stacked Bars: Rejection (bottom, red) & Rework (middle, orange) */}
        {data.map((d, i) => {
          const cx = plotLeft + i * colStep
          const x = cx - barWidth / 2

          const rejPct = Math.max(0, Number(d.rejectionPct) || 0)
          const rwPct = Math.max(0, Number(d.reworkPct) || 0)

          const rejHeight = (rejPct / maxVal) * chartHeight
          const rejY = padTop + chartHeight - rejHeight

          const rwHeight = (rwPct / maxVal) * chartHeight
          const rwY = rejY - rwHeight

          const dhuY = scaleY(Number(d.dhuPct) || 0)

          return (
            <g key={i}>
              {dhuY < rwY - 2 && (
                <line
                  x1={cx}
                  y1={rwY}
                  x2={cx}
                  y2={dhuY}
                  stroke="#0284c7"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              )}

              {/* Rework bar (Orange) */}
              {rwHeight > 0 && (
                <rect
                  x={x}
                  y={rwY}
                  width={barWidth}
                  height={Math.max(0, rwHeight)}
                  fill="#ff9800"
                  rx="2"
                />
              )}

              {/* Rejection bar (Red) */}
              {rejHeight > 0 && (
                <rect
                  x={x}
                  y={rejY}
                  width={barWidth}
                  height={Math.max(0, rejHeight)}
                  fill="#e60000"
                  rx={rwHeight > 0 ? 0 : 2}
                />
              )}

              {/* In-bar text for Rework % */}
              {rwHeight >= 14 && (
                <text
                  x={cx}
                  y={rwY + rwHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isLaptop ? 14 : 13}
                  fontWeight="900"
                  className="fill-[#0f172a] tracking-tight"
                >
                  {formatPct(rwPct)}
                </text>
              )}

              {/* In-bar text for Rejection % */}
              {rejHeight >= 10 && (
                <text
                  x={cx}
                  y={rejY + rejHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isLaptop ? 13.5 : 12.5}
                  fontWeight="900"
                  className="fill-white tracking-tight"
                >
                  {formatPct(rejPct)}
                </text>
              )}

              {/* Hour X-Axis Label */}
              <text
                x={cx}
                y={height - (isLaptop ? 8 : 6)}
                textAnchor="middle"
                fontSize={isLaptop ? 14 : 13}
                fontWeight="900"
                className="fill-t-primary"
              >
                {d.hour}
              </text>
            </g>
          )
        })}

        {/* DHU % Cyan/Blue Line */}
        <polyline
          fill="none"
          stroke="#0284c7"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={dhuPolyline}
        />

        {/* DHU % Points & Labels */}
        {dhuPoints.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r={isLaptop ? 5 : 4.5}
              fill="#0284c7"
              stroke="var(--color-card-bg)"
              strokeWidth="1.5"
            />
            {/* Outline backdrop for DHU text */}
            <text
              x={p.x}
              y={p.y - 9}
              textAnchor="middle"
              fontSize={isLaptop ? 15 : 14}
              fontWeight="900"
              stroke="var(--color-card-bg)"
              strokeWidth="4.5"
              strokeLinejoin="round"
              fill="var(--color-card-bg)"
            >
              {formatPct(p.val)}
            </text>
            <text
              x={p.x}
              y={p.y - 9}
              textAnchor="middle"
              fontSize={isLaptop ? 15 : 14}
              fontWeight="900"
              className="fill-[#0284c7] dark:fill-sky-400"
            >
              {formatPct(p.val)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ── QUALITY SECTION PROPS ───────────────────────────────────────────────────

export interface QualitySectionProps {
  isFullscreen?: boolean
  factorySetup?: string
  qualityKpis: QualityKpiData
  tlsSignals: {
    items: TlsSignalItem[]
    summary: TlsSignalSummary
  }
  topDefects: TopDefectItem[]
  defectCategories: {
    total: number
    items: DefectCategoryItem[]
    donutSlices?: DefectCategoryDonutSlice[]
  }
  qualityPerformance: {
    reworkTarget: number
    rejectionTarget: number
    dhuTarget: number
    hourly: QualityPerformanceHour[]
  }
  tlsCardPage: number
  setTlsCardPage: React.Dispatch<React.SetStateAction<number>>
  tlsVisible: boolean
  setTlsVisible: React.Dispatch<React.SetStateAction<boolean>>
}

// ── MAIN QUALITY SECTION COMPONENT ──────────────────────────────────────────

export default function QualitySection({
  isFullscreen = false,
  factorySetup,
  qualityKpis,
  tlsSignals,
  topDefects,
  defectCategories,
  qualityPerformance,
  tlsCardPage,
  setTlsCardPage,
  tlsVisible,
  setTlsVisible,
}: QualitySectionProps) {
  const TLS_PAGE_SIZE = 4

  return (
    <div className={`${isFullscreen ? 'col-span-7' : 'xl:col-span-7'} flex flex-col gap-2.5 ${isFullscreen ? 'h-full min-h-0' : ''}`}>
      {/* QUALITY BANNER */}
      <div className="bg-[#007b83] text-white px-3 py-1.5 rounded-t-lg flex items-center justify-between shadow-xs shrink-0 h-[34px]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-teal-200" />
          <span className="text-sm font-black tracking-wider uppercase">QUALITY</span>
        </div>
        {factorySetup && (
          <span className="text-[10px] font-extrabold uppercase bg-teal-900/40 text-teal-100 border border-teal-300/30 px-2.5 py-0.5 rounded shadow-2xs">
            {factorySetup}
          </span>
        )}
      </div>

      {/* TOP 5 QUALITY KPIS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 -mt-1 shrink-0">
        {/* Workstations */}
        <div className="bg-card border border-table-line p-2.5 h-[90px] rounded-card flex flex-col justify-between shadow-2xs">
          <div className="flex items-center gap-1 text-[10px] font-bold text-t-lighter uppercase tracking-wider">
            <Monitor size={14} className="text-t-lighter" />
            <span>WORKSTATIONS</span>
          </div>
          <span className="text-2xl font-black text-[#007b83] dark:text-[#2dd4bf] my-0.5 leading-none">{qualityKpis.workstations.total}</span>
          <div className="flex items-center gap-2 text-[10px] font-bold">
            <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {qualityKpis.workstations.normal}</span>
            <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {qualityKpis.workstations.attention}</span>
            <span className="flex items-center gap-0.5 text-red-600 dark:text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {qualityKpis.workstations.critical}</span>
          </div>
        </div>

        {/* Open CAP */}
        <div className="bg-card border border-table-line p-2.5 h-[90px] rounded-card flex flex-col justify-between shadow-2xs">
          <div className="flex items-center gap-1 text-[10px] font-bold text-t-lighter uppercase tracking-wider">
            <Users size={14} className="text-t-lighter" />
            <span>OPEN CAP</span>
          </div>
          <span className="text-2xl font-black text-t-primary my-0.5 leading-none">{qualityKpis.openCap.value}</span>
          <span className="text-[10px] font-semibold text-t-lighter">{qualityKpis.openCap.sub}</span>
        </div>

        {/* Rework */}
        <div className="bg-card border border-table-line p-2.5 h-[90px] rounded-card flex flex-col justify-between shadow-2xs">
          <div className="flex items-center gap-1 text-[10px] font-bold text-t-lighter uppercase tracking-wider">
            <RefreshCw size={14} className="text-t-lighter" />
            <span>REWORK</span>
          </div>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 my-0.5 leading-none">{qualityKpis.rework.value}</span>
          <span className="text-[10px] font-semibold text-t-lighter">{qualityKpis.rework.sub}</span>
        </div>

        {/* Rejection */}
        <div className="bg-card border border-table-line p-2.5 h-[90px] rounded-card flex flex-col justify-between shadow-2xs">
          <div className="flex items-center gap-1 text-[10px] font-bold text-t-lighter uppercase tracking-wider">
            <XCircle size={14} className="text-t-lighter" />
            <span>REJECTION</span>
          </div>
          <span className="text-2xl font-black text-red-600 dark:text-red-400 my-0.5 leading-none">{qualityKpis.rejection.value}</span>
          <span className="text-[10px] font-semibold text-t-lighter">{qualityKpis.rejection.sub}</span>
        </div>

        {/* DHU */}
        <div className="bg-card border border-table-line p-2.5 h-[90px] rounded-card flex flex-col justify-between shadow-2xs">
          <div className="flex items-center gap-1 text-[10px] font-bold text-t-lighter uppercase tracking-wider">
            <TrendingUp size={14} className="text-t-lighter" />
            <span>DHU</span>
          </div>
          <span className="text-2xl font-black text-t-primary my-0.5 leading-none">{qualityKpis.dhu.value}</span>
          <span className="text-[10px] font-semibold text-t-lighter">
            {qualityKpis.dhu.target} <span className="text-red-500 font-bold">↑</span>
          </span>
        </div>
      </div>

      {/* QUALITY DETAILS SPLIT: TLS SIGNALS (LEFT) & DEFECT CHARTS (RIGHT) */}
      <div className={`grid gap-2.5 items-stretch flex-1 min-h-0 ${isFullscreen ? 'grid-cols-12' : 'grid-cols-1 lg:grid-cols-12'}`}>

        {/* ── TLS SIGNAL OVERVIEW (5 COLS) ── */}
        <div className={`${isFullscreen ? 'col-span-5' : 'lg:col-span-5'} flex flex-col justify-between gap-2 h-full min-h-0`}>
          {/* Signal Cards Container */}
          <div className="bg-card border border-table-line rounded-card p-2.5 flex flex-col flex-1 min-h-0 shadow-2xs">
            <div className="flex items-center justify-between border-b border-table-line pb-1.5 mb-2 shrink-0">
              <span className="text-xs font-black text-t-primary uppercase tracking-wider">
                TLS SIGNAL OVERVIEW
              </span>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Live Priority</span>
            </div>

            {/* Signal Cards List — rotates every interval */}
            {(() => {
              const allItems = tlsSignals.items
              const totalPages = Math.ceil(allItems.length / TLS_PAGE_SIZE) || 1
              const pageItems = allItems.slice(
                tlsCardPage * TLS_PAGE_SIZE,
                tlsCardPage * TLS_PAGE_SIZE + TLS_PAGE_SIZE
              )
              return (
                <>
                  <div
                    className="flex flex-col gap-2 flex-1 min-h-0 justify-start"
                    style={{
                      opacity: tlsVisible ? 1 : 0,
                      transition: 'opacity 0.3s ease-in-out',
                    }}
                  >
                    {pageItems.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-6 text-t-lighter gap-1.5">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck size={20} />
                        </div>
                        <span className="text-xs font-bold text-t-primary">All Stations Normal</span>
                        <span className="text-[10px] text-t-lighter">No active TLS quality alerts</span>
                      </div>
                    ) : (
                      pageItems.map(sig => {
                        const isCritical = sig.status === 'CRITICAL'
                        const isAttention = sig.status === 'ATTENTION'

                        const borderCls = isCritical
                          ? 'border-red-500/40 bg-red-500/10 dark:bg-red-950/30'
                          : isAttention
                            ? 'border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/30'
                            : 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/30'

                        const badgeCls = isCritical
                          ? 'bg-red-600 text-white'
                          : isAttention
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'

                        const iconBorderCls = isCritical
                          ? 'border-red-400 bg-red-100 text-red-600'
                          : isAttention
                            ? 'border-amber-400 bg-amber-100 text-amber-600'
                            : 'border-emerald-400 bg-emerald-100 text-emerald-600'

                        const textNameCls = isCritical
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-t-primary'

                        const textIssueCls = isCritical
                          ? 'text-red-600 dark:text-red-400'
                          : isAttention
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'

                        return (
                          <div
                            key={sig.id}
                            className={`p-2 rounded-lg border ${borderCls} flex flex-col justify-between ${
                              pageItems.length >= 4 ? 'flex-1 min-h-0' : 'h-[92px] shrink-0'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${iconBorderCls}`}>
                                  {isCritical ? (
                                    <SewingMachineIcon className="w-3.5 h-3.5" />
                                  ) : isAttention ? (
                                    <BellAlertIcon className="w-3.5 h-3.5" />
                                  ) : (
                                    <ShieldCheck size={14} />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className={`px-1 py-0.2 rounded text-[8.5px] font-black w-fit uppercase leading-tight ${badgeCls}`}>
                                    {sig.status}
                                  </span>
                                  <span className={`text-[11px] font-black uppercase mt-0.5 truncate ${textNameCls}`}>
                                    {sig.operatorName}
                                  </span>
                                </div>
                              </div>

                              {/* Elapsed */}
                              <div className="flex flex-col items-end shrink-0">
                                <span className="text-[8.5px] font-bold text-t-lighter uppercase tracking-wider">ELAPSED</span>
                                <span className={`text-xs font-black font-mono ${isCritical ? 'text-red-600 dark:text-red-400' : isAttention ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                  {sig.elapsed}
                                </span>
                              </div>
                            </div>

                            {/* Station Code, Operation & Issue */}
                            <div className="flex flex-col justify-center min-w-0 px-0.5 gap-0.5 my-auto">
                              <div className="text-[9.5px] text-t-secondary font-medium truncate leading-tight">
                                <strong className="text-t-primary font-bold">{sig.stationCode}</strong> | {sig.operationName}
                              </div>
                              <span className={`text-[10px] font-bold truncate block leading-tight ${textIssueCls}`}>{sig.issue}</span>
                            </div>

                            {/* Metric tags */}
                            <div className="flex items-center gap-3 pt-0.5 border-t border-table-line/60 text-[9.5px] font-bold">
                              <span className={isCritical ? 'text-red-600 dark:text-red-400' : 'text-t-secondary'}>
                                TLS <strong className="text-[11px] text-t-primary">{sig.tls}</strong>
                              </span>
                              <span className={isCritical ? 'text-red-600 dark:text-red-400' : 'text-t-secondary'}>
                                RW <strong className="text-[11px] text-t-primary">{sig.rw}</strong>
                              </span>
                              <span className={isCritical ? 'text-red-600 dark:text-red-400' : 'text-t-secondary'}>
                                RJ <strong className="text-[11px] text-t-primary">{sig.rj}</strong>
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Page dots indicator */}
                  <div className="flex items-center justify-center gap-1.5 pt-1 shrink-0 mt-auto">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { setTlsCardPage(i); setTlsVisible(true) }}
                        className={`rounded-full transition-all duration-300 ${i === tlsCardPage
                          ? 'w-4 h-1.5 bg-blue-600'
                          : 'w-1.5 h-1.5 bg-card-alt border border-table-line hover:bg-blue-400'
                          }`}
                      />
                    ))}
                    <span className="text-[8px] font-bold text-t-lighter ml-1">
                      {allItems.length > 0 ? `${tlsCardPage * TLS_PAGE_SIZE + 1}–${Math.min((tlsCardPage + 1) * TLS_PAGE_SIZE, allItems.length)} / ${allItems.length}` : '0 / 0'}
                    </span>
                  </div>
                </>
              )
            })()}
          </div>

          {/* Separate Container Box for Summary Counts */}
          <div className="bg-card border border-table-line rounded-card p-2 shadow-2xs shrink-0">
            <div className="grid grid-cols-3 gap-1 text-center items-center">
              <div className="flex flex-col items-center justify-center">
                <span className="text-lg font-black text-red-600 dark:text-red-400 leading-tight">{tlsSignals.summary.critical}</span>
                <span className="text-[8.5px] font-bold text-t-lighter uppercase tracking-wider">CRITICAL</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-lg font-black text-amber-500 dark:text-amber-400 leading-tight">{tlsSignals.summary.attention}</span>
                <span className="text-[8.5px] font-bold text-t-lighter uppercase tracking-wider">ATTENTION</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-tight">{tlsSignals.summary.normal}</span>
                <span className="text-[8.5px] font-bold text-t-lighter uppercase tracking-wider">NORMAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── DEFECT CHARTS (7 COLS) ── */}
        <div className={`${isFullscreen ? 'col-span-7' : 'lg:col-span-7'} flex flex-col justify-between gap-2 h-full min-h-0`}>
          {/* 1. Top 3 Defects */}
          <div className="bg-card border border-table-line rounded-card p-3 shadow-2xs shrink-0">
            <div className="flex items-center justify-between text-[10px] font-bold text-t-lighter uppercase tracking-wider border-b border-table-line pb-2 mb-2">
              <span className="text-t-primary text-xs font-black">TOP 3 DEFECTS – TODAY</span>
              <div className="flex items-center gap-6">
                <span>QTY</span>
                <span>% OF DEFECTS</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {topDefects.length > 0 ? (
                topDefects.map(def => (
                  <div key={def.rank} className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-t-lighter w-4">{def.rank}</span>
                    <div className="flex-1 flex flex-col">
                      <span className="text-xs font-bold text-t-primary truncate">{def.name}</span>
                      {/* Progress bar */}
                      <div className="w-full bg-table-head dark:bg-card-alt h-2 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full rounded-full" style={{ width: `${def.pct}%`, backgroundColor: def.color }} />
                      </div>
                    </div>
                    <span className="text-xs font-black text-red-600 dark:text-red-400 w-8 text-right">{def.qty}</span>
                    <span className="text-xs font-bold text-t-secondary w-12 text-right">{def.pct}%</span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-5 text-t-lighter">
                  <ShieldCheck size={24} className="text-emerald-500/70 mb-1" />
                  <span className="text-xs font-bold text-t-secondary">No Defects Recorded Today</span>
                  <span className="text-[10px] text-t-lighter">All workstations operating within threshold</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Defect Category Breakdown */}
          <div className="bg-card border border-table-line rounded-card p-3 shadow-2xs shrink-0">
            <span className="text-xs font-black text-t-primary uppercase tracking-wider block mb-2">
              DEFECT CATEGORY BREAKDOWN – TODAY
            </span>

            <div className="flex items-center justify-between gap-4">
              {/* Donut */}
              <div className="shrink-0">
                <DefectCategoryDonutChart
                  items={defectCategories.items}
                  donutSlices={defectCategories.donutSlices}
                  total={defectCategories.total}
                />
              </div>

              {/* Legend */}
              <div className="flex-1 flex flex-col gap-1.5">
                {defectCategories.items.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-t-secondary text-xs font-bold">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-t-primary text-xs font-black w-6 text-right">
                        {cat.count}
                      </span>
                      <span className="text-t-lighter text-xs font-semibold w-12 text-right">
                        ({cat.pct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Quality Performance - Last 10 Hours */}
          <div className="bg-card border border-table-line rounded-card p-2.5 shadow-2xs flex-1 min-h-0 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-table-line pb-1.5 mb-1.5 shrink-0">
              <span className="text-xs sm:text-sm font-black text-t-primary uppercase tracking-wider">
                QUALITY PERFORMANCE – LAST 10 HOURS
              </span>
              {/* Legend */}
              <div className="flex items-center gap-2.5 sm:gap-3.5 text-xs sm:text-[12px] font-bold text-t-secondary">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#ff9800] rounded-2xs inline-block shadow-2xs" />
                  <span>Rework % (Target 2%)</span>
                </div>
                <div className="flex items-center gap-1 text-[#e60000] dark:text-red-400">
                  <span className="text-sm font-black leading-none">✚</span>
                  <span className="text-t-secondary">Rejection % (Target 1%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#0284c7] dark:text-sky-400">
                  <div className="flex items-center">
                    <span className="w-2.5 h-0.5 bg-[#0284c7] dark:bg-sky-400" />
                    <span className="w-2 h-2 rounded-full bg-[#0284c7] dark:bg-sky-400 border border-card -mx-0.5" />
                    <span className="w-2.5 h-0.5 bg-[#0284c7] dark:bg-sky-400" />
                  </div>
                  <span className="text-t-secondary">DHU % (Target 3%)</span>
                </div>
              </div>
            </div>

            {/* 10-Hour Stacked & Line Chart */}
            <QualityPerformanceChart
              data={qualityPerformance.hourly}
              dhuTarget={qualityPerformance.dhuTarget}
            />
          </div>

        </div>

      </div>
    </div>
  )
}
