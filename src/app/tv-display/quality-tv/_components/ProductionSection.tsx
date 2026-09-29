'use client'

import React from 'react'
import {
  Factory,
  Package,
  Settings,
  Users,
  RefreshCw,
  ChevronDown,
  Target,
  Gauge,
  BarChart2,
  ArrowUpDown,
  Timer,
  Sigma,
} from 'lucide-react'
import type {
  ProductionKpiData,
  HourlyOutputPoint,
  HourlyEfficiencyPoint,
  ProductionMetrics,
} from '@/lib/qualityTvData'

// ── HOURLY OUTPUT VS TARGET LINE CHART ───────────────────────────────────────

function HourlyOutputLineChart({ data }: { data: HourlyOutputPoint[] }) {
  const width = 560
  const height = 160
  const padLeft = 44
  const padRight = 22
  const padTop = 18
  const padBottom = 26

  const chartWidth = width - padLeft - padRight
  const chartHeight = height - padTop - padBottom // 116px

  // Mathematical dynamic Y-axis scale based on any backend value
  const maxDataVal = Math.max(...data.map(d => Math.max(d.actual, d.target)), 0)
  const { maxVal, gridSteps } = (() => {
    if (maxDataVal <= 0) return { maxVal: 100, gridSteps: [0, 25, 50, 75, 100] }

    const targetTicks = 4
    const roughStep = maxDataVal / targetTicks
    const power = Math.pow(10, Math.floor(Math.log10(roughStep)))
    const fraction = roughStep / power

    let niceFraction = 1
    if (fraction <= 1) niceFraction = 1
    else if (fraction <= 2) niceFraction = 2
    else if (fraction <= 5) niceFraction = 5
    else niceFraction = 10

    const step = niceFraction * power
    const computedMax = Math.max(Math.ceil(maxDataVal / step) * step, step * targetTicks)

    const steps: number[] = []
    for (let val = 0; val <= computedMax; val += step) {
      steps.push(val)
    }

    return { maxVal: computedMax, gridSteps: steps }
  })()

  const scaleY = (val: number) => padTop + chartHeight - (val / maxVal) * chartHeight
  const colStep = chartWidth / (data.length - 1 || 1)

  const actualPoints = data.map((d, i) => ({
    x: padLeft + i * colStep,
    y: scaleY(d.actual),
    val: d.actual,
  }))
  const targetPoints = data.map((d, i) => ({
    x: padLeft + i * colStep,
    y: scaleY(d.target),
    val: d.target,
  }))

  const actualPolyline = actualPoints.map(p => `${p.x},${p.y}`).join(' ')
  const targetPolyline = targetPoints.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div className="w-full flex-1 min-h-0 flex items-center justify-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Y Gridlines */}
        {gridSteps.map(val => {
          const y = scaleY(val)
          return (
            <g key={val}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="var(--color-table-border)"
                strokeWidth="0.8"
                strokeDasharray={val === 0 ? undefined : '3,3'}
              />
              <text
                x={padLeft - 6}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-t-lighter font-bold"
              >
                {val === 0 ? '0' : val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K` : String(val)}
              </text>
            </g>
          )
        })}

        {/* Target dashed line */}
        <polyline
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.8"
          strokeDasharray="4,3"
          points={targetPolyline}
        />

        {/* Target Points & Value Labels (shown above dots) */}
        {targetPoints.map((p, i) => {
          if (p.val === undefined || p.val === null) return null
          const isZero = p.val === 0

          return (
            <g key={`t-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r="3"
                fill="#94a3b8"
                stroke="var(--color-card-bg)"
                strokeWidth="1.5"
              />
              {!isZero && (
                <>
                  {/* Halo backdrop prevents line collision */}
                  <text
                    x={p.x}
                    y={p.y - 8}
                    textAnchor="middle"
                    className="text-[9.5px] sm:text-[10px] font-bold"
                    stroke="var(--color-card-bg)"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                    fill="var(--color-card-bg)"
                  >
                    {p.val.toLocaleString()}
                  </text>
                  <text
                    x={p.x}
                    y={p.y - 8}
                    textAnchor="middle"
                    className="text-[9.5px] sm:text-[10px] fill-slate-600 dark:fill-slate-300 font-bold"
                  >
                    {p.val.toLocaleString()}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {/* Actual solid blue line */}
        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={actualPolyline}
        />

        {/* Actual Points & Value Labels */}
        {actualPoints.map((p, i) => {
          const isStartZero = i === 0 && p.val === 0
          const hasValue = p.val > 0

          // In Image 2, actual numbers are below the dot (p.y + 13),
          // except if at 0 or near the bottom baseline where we place it above (p.y - 8)
          const isNearBottom = p.y >= padTop + chartHeight - 14
          const labelY = (isStartZero || isNearBottom) ? p.y - 8 : p.y + 13

          return (
            <g key={`a-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="#2563eb"
                stroke="var(--color-card-bg)"
                strokeWidth="1.6"
              />

              {/* Red '0' for starting point when 0 (reference Image 2) */}
              {isStartZero && (
                <>
                  <text
                    x={p.x}
                    y={labelY}
                    textAnchor="middle"
                    className="text-[9.5px] sm:text-[10px] font-black"
                    stroke="var(--color-card-bg)"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                    fill="var(--color-card-bg)"
                  >
                    0
                  </text>
                  <text
                    x={p.x}
                    y={labelY}
                    textAnchor="middle"
                    className="text-[9.5px] sm:text-[10px] fill-red-500 font-black"
                  >
                    0
                  </text>
                </>
              )}

              {/* Positive actual value label */}
              {hasValue && (
                <>
                  <text
                    x={p.x}
                    y={labelY}
                    textAnchor="middle"
                    className="text-[9.5px] sm:text-[10px] font-black"
                    stroke="var(--color-card-bg)"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                    fill="var(--color-card-bg)"
                  >
                    {p.val.toLocaleString()}
                  </text>
                  <text
                    x={p.x}
                    y={labelY}
                    textAnchor="middle"
                    className="text-[9.5px] sm:text-[10px] fill-blue-700 dark:fill-blue-400 font-black"
                  >
                    {p.val.toLocaleString()}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {/* X-axis Hour Labels */}
        {data.map((d, i) => {
          const x = padLeft + i * colStep
          return (
            <text
              key={`hour-${i}`}
              x={x}
              y={height - 7}
              textAnchor="middle"
              className="text-[10px] sm:text-[10.5px] fill-t-primary font-black"
            >
              {d.hour}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// ── HOURLY EFFICIENCY VS TARGET LINE CHART ──────────────────────────────────

function HourlyEfficiencyLineChart({ data }: { data: HourlyEfficiencyPoint[] }) {
  const width = 560
  const height = 165
  const padLeft = 44
  const padRight = 22
  const padTop = 18
  const padBottom = 28

  const chartWidth = width - padLeft - padRight
  const chartHeight = height - padTop - padBottom // 119px

  const maxVal = 100
  const scaleY = (val: number) => padTop + chartHeight - (val / maxVal) * chartHeight
  const colStep = chartWidth / (data.length - 1 || 1)

  const actualPoints = data.map((d, i) => ({
    x: padLeft + i * colStep,
    y: scaleY(d.actual),
    val: d.actual,
  }))
  const targetPoints = data
    .map((d, i) => {
      if (d.target === undefined || d.target === null) return null
      return {
        x: padLeft + i * colStep,
        y: scaleY(d.target),
        val: d.target,
      }
    })
    .filter((p): p is { x: number; y: number; val: number } => p !== null)

  const isConstantTarget =
    targetPoints.length > 0 && targetPoints.every(p => p.val === targetPoints[0].val)
  const constantTargetVal = isConstantTarget ? targetPoints[0].val : null

  const actualPolyline = actualPoints.map(p => `${p.x},${p.y}`).join(' ')
  const targetPolyline = targetPoints.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div className="w-full flex-1 min-h-0 flex items-center justify-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Y Gridlines */}
        {[0, 25, 50, 75, 100].map(val => {
          const y = scaleY(val)
          return (
            <g key={val}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="var(--color-table-border)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <text
                x={padLeft - 6}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-t-lighter font-bold"
              >
                {val}%
              </text>
            </g>
          )
        })}

        {/* Left vertical Y-axis line */}
        <line
          x1={padLeft}
          y1={scaleY(100)}
          x2={padLeft}
          y2={scaleY(0)}
          stroke="var(--color-table-border)"
          strokeWidth="1.2"
        />

        {/* Target dashed line */}
        {isConstantTarget && constantTargetVal !== null ? (
          <>
            <line
              x1={padLeft}
              y1={scaleY(constantTargetVal)}
              x2={width - padRight}
              y2={scaleY(constantTargetVal)}
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="5,4"
            />
            {/* Target badge */}
            <g>
              <rect
                x={padLeft + 4}
                y={scaleY(constantTargetVal) - 15}
                width={64}
                height={13}
                rx="3"
                fill="var(--color-card-alt)"
                stroke="var(--color-table-border)"
                strokeWidth="0.8"
              />
              <text
                x={padLeft + 36}
                y={scaleY(constantTargetVal) - 5}
                textAnchor="middle"
                className="text-[9px] fill-t-secondary font-extrabold uppercase tracking-wider"
              >
                Target {constantTargetVal}%
              </text>
            </g>
          </>
        ) : (
          <>
            <polyline
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.8"
              strokeDasharray="4,3"
              points={targetPolyline}
            />

            {/* Target Points & Value Labels (shown above dots) */}
            {targetPoints.map((p, i) => {
              if (p.val === undefined || p.val === null) return null
              const isZero = p.val === 0
              const formattedVal = `${Number(p.val.toFixed(2))}%`

              return (
                <g key={`et-${i}`}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="3"
                    fill="#94a3b8"
                    stroke="var(--color-card-bg)"
                    strokeWidth="1.5"
                  />
                  {!isZero && (
                    <>
                      {/* Halo backdrop prevents line collision */}
                      <text
                        x={p.x}
                        y={p.y - 8}
                        textAnchor="middle"
                        className="text-[9.5px] sm:text-[10px] font-bold"
                        stroke="var(--color-card-bg)"
                        strokeWidth="3.5"
                        strokeLinejoin="round"
                        fill="var(--color-card-bg)"
                      >
                        {formattedVal}
                      </text>
                      <text
                        x={p.x}
                        y={p.y - 8}
                        textAnchor="middle"
                        className="text-[9.5px] sm:text-[10px] fill-slate-600 dark:fill-slate-300 font-bold"
                      >
                        {formattedVal}
                      </text>
                    </>
                  )}
                </g>
              )
            })}
          </>
        )}

        {/* Actual solid blue line */}
        <polyline
          fill="none"
          stroke="#0055ff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={actualPolyline}
        />

        {/* Actual Points & Value Labels */}
        {actualPoints.map((p, i) => {
          const isStartZero = i === 0 && p.val === 0
          const hasValue = p.val > 0
          const formattedVal = `${Number(p.val.toFixed(2))}%`
          const labelY = p.y + 12

          return (
            <g key={`ea-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="#0055ff"
                stroke="var(--color-card-bg)"
                strokeWidth="1.6"
              />

              {/* Red '0%' for starting point when 0 */}
              {isStartZero && (
                <>
                  <text
                    x={p.x}
                    y={labelY}
                    textAnchor="middle"
                    className="text-[9.5px] sm:text-[10px] font-black"
                    stroke="var(--color-card-bg)"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                    fill="var(--color-card-bg)"
                  >
                    0%
                  </text>
                  <text
                    x={p.x}
                    y={labelY}
                    textAnchor="middle"
                    className="text-[9.5px] sm:text-[10px] fill-red-500 font-black"
                  >
                    0%
                  </text>
                </>
              )}

              {/* Positive actual value label */}
              {hasValue && (
                <>
                  <text
                    x={p.x}
                    y={labelY}
                    textAnchor="middle"
                    className="text-[9.5px] sm:text-[10px] font-black"
                    stroke="var(--color-card-bg)"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                    fill="var(--color-card-bg)"
                  >
                    {formattedVal}
                  </text>
                  <text
                    x={p.x}
                    y={labelY}
                    textAnchor="middle"
                    className="text-[9.5px] sm:text-[10px] fill-blue-700 dark:fill-blue-400 font-black"
                  >
                    {formattedVal}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {/* X-axis Hour Labels */}
        {data.map((d, i) => {
          const x = padLeft + i * colStep
          return (
            <text
              key={`ehour-${i}`}
              x={x}
              y={height - 7}
              textAnchor="middle"
              className="text-[10px] sm:text-[10.5px] fill-t-primary font-black"
            >
              {d.hour}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// ── PRODUCTION SECTION PROPS ────────────────────────────────────────────────

export interface ProductionSectionProps {
  isFullscreen?: boolean
  productionKpis: ProductionKpiData
  hourlyOutput: {
    period: string
    data: HourlyOutputPoint[]
  }
  hourlyEfficiency: {
    period: string
    data: HourlyEfficiencyPoint[]
  }
  productionMetrics: ProductionMetrics
}

// ── MAIN PRODUCTION SECTION COMPONENT ───────────────────────────────────────

export default function ProductionSection({
  isFullscreen = false,
  productionKpis,
  hourlyOutput,
  hourlyEfficiency,
  productionMetrics,
}: ProductionSectionProps) {
  return (
    <div className={`${isFullscreen ? 'col-span-5' : 'xl:col-span-5'} flex flex-col gap-2.5 ${isFullscreen ? 'h-full min-h-0 overflow-hidden' : ''}`}>
      {/* PRODUCTION BANNER */}
      <div className="bg-[#0e2a47] text-white px-3 py-1.5 rounded-t-lg flex items-center gap-2 shadow-xs shrink-0 h-[34px]">
        <Factory size={18} className="text-blue-200" />
        <span className="text-sm font-black tracking-wider uppercase">PRODUCTION</span>
      </div>

      {/* TOP 4 PRODUCTION KPIS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 -mt-1 shrink-0">
        {/* 1. OUTPUT */}
        <div className="bg-card border border-table-line p-2.5 h-[90px] rounded-card flex flex-col justify-between shadow-2xs">
          <div className="flex items-center gap-1 text-[10.5px] font-bold text-t-lighter uppercase tracking-wider">
            <Package size={14} className="text-[#38bdf8]" strokeWidth={2.2} />
            <span className="font-black text-t-primary tracking-wider">
              OUTPUT
            </span>
          </div>

          <div className="grid grid-cols-2 items-center flex-1 my-0.5">
            {/* Target */}
            <div className="flex flex-col items-center justify-center border-r border-table-line pr-1">
              <span className="text-[9px] font-bold text-t-lighter uppercase">Target</span>
              <span className="text-base sm:text-lg font-black text-t-primary leading-tight">
                {productionKpis.output.target.toLocaleString()}
              </span>
              <span className="text-[8.5px] font-semibold text-t-lighter lowercase">
                {productionKpis.output.unit || 'pcs'}
              </span>
            </div>
            {/* Actual */}
            <div className="flex flex-col items-center justify-center pl-1">
              <span className="text-[9px] font-bold text-t-lighter uppercase">Actual</span>
              <span className="text-base sm:text-lg font-black text-[#0070f3] dark:text-blue-400 leading-tight">
                {(productionKpis.output.actual ?? productionKpis.output.value ?? 0).toLocaleString()}
              </span>
              <span className="text-[8.5px] font-semibold text-t-lighter lowercase">
                {productionKpis.output.unit || 'pcs'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. EFFICIENCY */}
        <div className="bg-card border border-table-line p-2.5 h-[90px] rounded-card flex flex-col justify-between shadow-2xs">
          <div className="flex items-center gap-1 text-[10.5px] font-bold text-t-lighter uppercase tracking-wider">
            <Settings size={14} className="text-[#2dd4bf]" strokeWidth={2.2} />
            <span className="font-black text-t-primary tracking-wider">
              EFFICIENCY
            </span>
          </div>

          <div className="grid grid-cols-2 items-center flex-1 my-0.5">
            {/* Target */}
            <div className="flex flex-col items-center justify-center border-r border-table-line pr-1">
              <span className="text-[9px] font-bold text-t-lighter uppercase">Target</span>
              <span className="text-base sm:text-lg font-black text-t-primary leading-tight">
                {productionKpis.efficiency.target}%
              </span>
              <span className="text-[8.5px] invisible lowercase">-</span>
            </div>
            {/* Actual */}
            <div className="flex flex-col items-center justify-center pl-1">
              <span className="text-[9px] font-bold text-t-lighter uppercase">Actual</span>
              <span className="text-base sm:text-lg font-black text-[#00897b] dark:text-emerald-400 leading-tight">
                {productionKpis.efficiency.actual ?? productionKpis.efficiency.value ?? 0}%
              </span>
              <span className="text-[8.5px] invisible lowercase">-</span>
            </div>
          </div>
        </div>

        {/* 3. INPUT */}
        <div className="bg-card border border-table-line p-2.5 h-[90px] rounded-card flex flex-col justify-between shadow-2xs">
          <div className="flex items-center gap-1 text-[10.5px] font-bold text-t-lighter uppercase tracking-wider">
            <Users size={14} className="text-[#fb923c]" strokeWidth={2.2} />
            <span className="font-black text-t-primary tracking-wider">
              INPUT
            </span>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 my-0.5">
            <span className="text-[9px] font-bold text-t-lighter uppercase">
              {productionKpis.input.label || "Today's Input"}
            </span>
            <span className="text-2xl font-black text-[#ff5722] dark:text-orange-400 leading-tight my-0.5">
              {productionKpis.input.value.toLocaleString()}
            </span>
            <span className="text-[8.5px] font-semibold text-t-lighter lowercase">
              {productionKpis.input.unit || 'pcs'}
            </span>
          </div>
        </div>

        {/* 4. P2P */}
        <div className="bg-card border border-table-line p-2.5 h-[90px] rounded-card flex flex-col justify-between shadow-2xs">
          <div className="flex items-center gap-1 text-[10.5px] font-bold text-t-lighter uppercase tracking-wider">
            <RefreshCw size={14} className="text-[#8b5cf6]" strokeWidth={2.5} />
            <span className="font-black text-t-primary tracking-wider">
              P2P
            </span>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 my-0.5">
            <span className="text-[9px] font-bold text-t-lighter uppercase">
              {productionKpis.p2p?.label || 'Plan to Production'}
            </span>
            <span className="text-2xl font-black text-[#581c87] dark:text-purple-300 leading-tight my-0.5">
              {productionKpis.p2p?.value ?? 0}%
            </span>
            <span className="text-[8.5px] invisible lowercase">-</span>
          </div>
        </div>
      </div>

      {/* HOURLY OUTPUT VS TARGET CONTAINER */}
      <div className={`bg-card border border-table-line rounded-card p-2.5 shadow-2xs flex flex-col ${isFullscreen ? 'flex-1 min-h-0 justify-between' : ''}`}>
        <div className="flex items-center justify-between border-b border-table-line pb-1.5 mb-1">
          <span className="text-xs sm:text-sm font-black text-t-primary uppercase tracking-wider">
            HOURLY OUTPUT vs TARGET
          </span>
          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="flex items-center gap-2 text-[10px] sm:text-[10.5px] font-bold">
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <span className="w-3 h-0.5 bg-blue-600 dark:bg-blue-400" /> Actual Output
              </span>
              <span className="flex items-center gap-1 text-t-lighter">
                <span className="w-3 border-b-2 border-dashed border-t-lighter" /> Target
              </span>
            </div>
            {/* Period Dropdown */}
            <div className="flex items-center gap-1 px-2 py-0.5 bg-card-alt border border-table-line rounded text-[11px] font-bold text-t-secondary">
              <span>{hourlyOutput.period}</span>
              <ChevronDown size={12} />
            </div>
          </div>
        </div>

        {/* Chart */}
        <HourlyOutputLineChart data={hourlyOutput.data} />
      </div>

      {/* 5 STANDALONE PRODUCTION METRIC CARDS */}
      {(() => {
        const targetHr = productionMetrics.targetPerHour
        const currentHr = productionMetrics.currentOutputPerHour
        const targetTillNow = productionMetrics.targetOutputTillNow ?? 0
        const actualTillNow = productionMetrics.actualOutputTillNow ?? 0
        const gapTillNow = productionMetrics.outputGapTillNow ?? (actualTillNow - targetTillNow)
        const isPositive = gapTillNow > 0
        const isNegative = gapTillNow < 0

        return (
          <div className="grid grid-cols-5 gap-1.5 shrink-0">
            {/* 1. Target / Hr */}
            <div className="bg-card border border-table-line rounded-card px-2.5 py-1.5 shadow-2xs flex flex-col justify-between min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-full bg-card-alt border border-table-line/40 flex items-center justify-center shrink-0">
                  <Target size={11} className="text-[#0284c7] dark:text-sky-400" strokeWidth={2.2} />
                </div>
                <div className="flex flex-col min-w-0 leading-none">
                  <span className="text-[9px] sm:text-[9.5px] font-bold text-t-secondary truncate">Target</span>
                  <span className="text-[8px] font-medium text-t-lighter truncate">/ Hr</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-1 mt-1 pt-0.5 border-t border-table-line/60">
                <span className="text-base sm:text-lg font-black text-t-primary leading-none">
                  {targetHr.toLocaleString()}
                </span>
                <span className="text-[8.5px] sm:text-[9px] font-semibold text-t-lighter lowercase">pcs/hr</span>
              </div>
            </div>

            {/* 2. Current Output / Hr */}
            <div className="bg-card border border-table-line rounded-card px-2.5 py-1.5 shadow-2xs flex flex-col justify-between min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-full bg-card-alt border border-table-line/40 flex items-center justify-center shrink-0">
                  <Gauge size={11} className="text-[#0d9488] dark:text-teal-400" strokeWidth={2.2} />
                </div>
                <div className="flex flex-col min-w-0 leading-none">
                  <span className="text-[9px] sm:text-[9.5px] font-bold text-t-secondary truncate">Current</span>
                  <span className="text-[8px] font-medium text-t-lighter truncate">/ Hr</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-1 mt-1 pt-0.5 border-t border-table-line/60">
                <span className="text-base sm:text-lg font-black text-[#0891b2] dark:text-cyan-400 leading-none">
                  {currentHr.toLocaleString()}
                </span>
                <span className="text-[8.5px] sm:text-[9px] font-semibold text-t-lighter lowercase">pcs/hr</span>
              </div>
            </div>

            {/* 3. Target Output Till Now */}
            <div className="bg-card border border-table-line rounded-card px-2.5 py-1.5 shadow-2xs flex flex-col justify-between min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-full bg-card-alt border border-table-line/40 flex items-center justify-center shrink-0">
                  <BarChart2 size={11} className="text-[#9333ea] dark:text-purple-400" strokeWidth={2.2} />
                </div>
                <div className="flex flex-col min-w-0 leading-none">
                  <span className="text-[9px] sm:text-[9.5px] font-bold text-t-secondary truncate">Target</span>
                  <span className="text-[8px] font-medium text-t-lighter truncate">Till Now</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-1 mt-1 pt-0.5 border-t border-table-line/60">
                <span className="text-base sm:text-lg font-black text-t-primary leading-none">
                  {targetTillNow.toLocaleString()}
                </span>
                <span className="text-[8.5px] sm:text-[9px] font-semibold text-t-lighter lowercase">pcs</span>
              </div>
            </div>

            {/* 4. Actual Output Till Now */}
            <div className="bg-card border border-table-line rounded-card px-2.5 py-1.5 shadow-2xs flex flex-col justify-between min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-full bg-card-alt border border-table-line/40 flex items-center justify-center shrink-0">
                  <BarChart2 size={11} className="text-[#10b981] dark:text-emerald-400" strokeWidth={2.2} />
                </div>
                <div className="flex flex-col min-w-0 leading-none">
                  <span className="text-[9px] sm:text-[9.5px] font-bold text-t-secondary truncate">Actual</span>
                  <span className="text-[8px] font-medium text-t-lighter truncate">Till Now</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-1 mt-1 pt-0.5 border-t border-table-line/60">
                <span className="text-base sm:text-lg font-black text-[#059669] dark:text-emerald-400 leading-none">
                  {actualTillNow.toLocaleString()}
                </span>
                <span className="text-[8.5px] sm:text-[9px] font-semibold text-t-lighter lowercase">pcs</span>
              </div>
            </div>

            {/* 5. Output Gap Till Now */}
            <div className="bg-card border border-table-line rounded-card px-2.5 py-1.5 shadow-2xs flex flex-col justify-between min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-full bg-card-alt border border-table-line/40 flex items-center justify-center shrink-0">
                  <ArrowUpDown size={11} className="text-[#ef4444] dark:text-rose-400" strokeWidth={2.2} />
                </div>
                <div className="flex flex-col min-w-0 leading-none">
                  <span className="text-[9px] sm:text-[9.5px] font-bold text-t-secondary truncate">Output Gap</span>
                  <span className="text-[8px] font-medium text-t-lighter truncate">Till Now</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-1 mt-1 pt-0.5 border-t border-table-line/60">
                <span
                  className={`text-base sm:text-lg font-black leading-none ${isPositive
                    ? 'text-[#059669] dark:text-emerald-400'
                    : isNegative
                      ? 'text-[#ef4444] dark:text-rose-400'
                      : 'text-t-primary'
                    }`}
                >
                  {isPositive ? `+${gapTillNow.toLocaleString()}` : gapTillNow.toLocaleString()}
                </span>
                <span className="text-[8.5px] sm:text-[9px] font-semibold text-t-lighter lowercase">pcs</span>
              </div>
            </div>
          </div>
        )
      })()}

      {/* HOURLY EFFICIENCY VS TARGET (STANDALONE CARD) */}
      <div className={`bg-card border border-table-line rounded-card p-2.5 shadow-2xs flex flex-col ${isFullscreen ? 'flex-1 min-h-0 justify-between' : ''}`}>
        <div className="flex items-center justify-between border-b border-table-line pb-1.5 mb-1">
          <span className="text-xs sm:text-sm font-black text-t-primary uppercase tracking-wider">
            HOURLY EFFICIENCY vs TARGET
          </span>
          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="flex items-center gap-3 text-[10px] sm:text-[10.5px] font-bold">
              <span className="flex items-center gap-1.5 text-t-secondary">
                <span className="w-3.5 h-[2px] bg-[#0055ff] inline-block" /> Actual Efficiency
              </span>
              <span className="flex items-center gap-1.5 text-t-lighter">
                <span className="w-3.5 border-b-2 border-dashed border-t-lighter inline-block" /> Target ({productionMetrics.targetEfficiency || 68}%)
              </span>
            </div>

            {/* Period Dropdown */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card-alt border border-table-line rounded-md text-[11px] font-bold text-t-secondary shadow-2xs cursor-pointer">
              <span>{hourlyEfficiency.period}</span>
              <ChevronDown size={13} className="text-t-lighter" />
            </div>
          </div>
        </div>

        {/* Chart */}
        <HourlyEfficiencyLineChart data={hourlyEfficiency.data} />
      </div>

      {/* 5 STANDALONE EFFICIENCY METRIC CARDS */}
      {(() => {
        const sam = productionMetrics.sam
        const manpower = productionMetrics.manpower
        const targetEff = productionMetrics.targetEfficiency
        const actualEffTillNow = productionMetrics.actualEfficiencyTillNow
        const effGap = productionMetrics.efficiencyGapTillNow
        const isEffPositive = effGap > 0
        const isEffNegative = effGap < 0

        return (
          <div className="grid grid-cols-5 gap-1.5 shrink-0">
            {/* 1. SAM */}
            <div className="bg-card border border-table-line rounded-card px-2.5 py-1.5 shadow-2xs flex flex-col justify-between min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-full bg-card-alt border border-table-line/40 flex items-center justify-center shrink-0">
                  <Timer size={11} className="text-[#0284c7] dark:text-sky-400" strokeWidth={2.2} />
                </div>
                <div className="flex flex-col min-w-0 leading-none">
                  <span className="text-[9px] sm:text-[9.5px] font-bold text-t-secondary truncate">SAM</span>
                  <span className="text-[8px] invisible leading-none">-</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-1 mt-1 pt-0.5 border-t border-table-line/60">
                <span className="text-base sm:text-lg font-black text-t-primary leading-none">
                  {sam}
                </span>
                <span className="text-[8.5px] sm:text-[9px] font-semibold text-t-lighter lowercase">min</span>
              </div>
            </div>

            {/* 2. Manpower */}
            <div className="bg-card border border-table-line rounded-card px-2.5 py-1.5 shadow-2xs flex flex-col justify-between min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-full bg-card-alt border border-table-line/40 flex items-center justify-center shrink-0">
                  <Users size={11} className="text-[#9333ea] dark:text-purple-400" strokeWidth={2.2} />
                </div>
                <div className="flex flex-col min-w-0 leading-none">
                  <span className="text-[9px] sm:text-[9.5px] font-bold text-t-secondary truncate">Manpower</span>
                  <span className="text-[8px] invisible leading-none">-</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-1 mt-1 pt-0.5 border-t border-table-line/60">
                <span className="text-base sm:text-lg font-black text-t-primary leading-none">
                  {manpower}
                </span>
                <span className="text-[8.5px] sm:text-[9px] invisible lowercase">min</span>
              </div>
            </div>

            {/* 3. Target Efficiency */}
            <div className="bg-card border border-table-line rounded-card px-2.5 py-1.5 shadow-2xs flex flex-col justify-between min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-full bg-card-alt border border-table-line/40 flex items-center justify-center shrink-0">
                  <Target size={11} className="text-[#0284c7] dark:text-sky-400" strokeWidth={2.2} />
                </div>
                <div className="flex flex-col min-w-0 leading-none">
                  <span className="text-[9px] sm:text-[9.5px] font-bold text-t-secondary truncate">Target</span>
                  <span className="text-[8px] font-medium text-t-lighter truncate">Efficiency</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-1 mt-1 pt-0.5 border-t border-table-line/60">
                <span className="text-base sm:text-lg font-black text-t-primary leading-none">
                  {targetEff}%
                </span>
                <span className="text-[8.5px] sm:text-[9px] invisible lowercase">min</span>
              </div>
            </div>

            {/* 4. Actual Efficiency Till Now */}
            <div className="bg-card border border-table-line rounded-card px-2.5 py-1.5 shadow-2xs flex flex-col justify-between min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-full bg-card-alt border border-table-line/40 flex items-center justify-center shrink-0">
                  <BarChart2 size={11} className="text-[#10b981] dark:text-emerald-400" strokeWidth={2.2} />
                </div>
                <div className="flex flex-col min-w-0 leading-none">
                  <span className="text-[9px] sm:text-[9.5px] font-bold text-t-secondary truncate">Actual Efficiency</span>
                  <span className="text-[8px] font-medium text-t-lighter truncate">Till Now</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-1 mt-1 pt-0.5 border-t border-table-line/60">
                <span className="text-base sm:text-lg font-black text-[#059669] dark:text-emerald-400 leading-none">
                  {actualEffTillNow}%
                </span>
                <span className="text-[8.5px] sm:text-[9px] invisible lowercase">min</span>
              </div>
            </div>

            {/* 5. Efficiency Gap Till Now */}
            <div className="bg-card border border-table-line rounded-card px-2.5 py-1.5 shadow-2xs flex flex-col justify-between min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-full bg-card-alt border border-table-line/40 flex items-center justify-center shrink-0">
                  <Sigma size={11} className="text-[#ef4444] dark:text-rose-400" strokeWidth={2.2} />
                </div>
                <div className="flex flex-col min-w-0 leading-none">
                  <span className="text-[9px] sm:text-[9.5px] font-bold text-t-secondary truncate">Efficiency Gap</span>
                  <span className="text-[8px] font-medium text-t-lighter truncate">Till Now</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-1 mt-1 pt-0.5 border-t border-table-line/60">
                <span
                  className={`text-base sm:text-lg font-black leading-none ${isEffPositive
                    ? 'text-[#059669] dark:text-emerald-400'
                    : isEffNegative
                      ? 'text-[#ef4444] dark:text-rose-400'
                      : 'text-t-primary'
                    }`}
                >
                  {isEffPositive ? `+${effGap} pp` : `${effGap} pp`}
                </span>
                <span className="text-[8.5px] sm:text-[9px] invisible lowercase">min</span>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
