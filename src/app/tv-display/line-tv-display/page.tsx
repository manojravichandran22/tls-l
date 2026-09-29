'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import {
  Clock,
  Calendar,
  Package,
  Tag,
  Shirt,
  Users,
  AlertTriangle,
  ShieldCheck,
  Repeat,
  XCircle,
  BarChart3,
  ArrowDownToLine,
  Factory,
  Gauge,
  User,
} from 'lucide-react'
import {
  type WorkstationStatus,
  type WorkstationCard as WsCard,
  LINE_TV_HEADER,
  LINE_TV_KPI,
  WORKSTATION_CARDS,
  DATA_REFRESH_INTERVAL,
} from '@/lib/lineTvData'

// ── STATUS STYLES ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<WorkstationStatus, {
  border: string
  bg: string
  headerBg: string
  dot: string
  text: string
  operatorBg: string
}> = {
  CRITICAL: {
    border: 'border-red-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
    headerBg: 'bg-red-100 dark:bg-red-900/40',
    dot: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
    operatorBg: 'bg-red-500/10',
  },
  ATTENTION: {
    border: 'border-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    headerBg: 'bg-amber-100 dark:bg-amber-900/40',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    operatorBg: 'bg-amber-500/10',
  },
  NORMAL: {
    border: 'border-gray-200 dark:border-gray-700',
    bg: 'bg-white dark:bg-gray-900',
    headerBg: 'bg-gray-50 dark:bg-gray-800',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    operatorBg: 'bg-gray-50 dark:bg-gray-800',
  },
}

// ── WORKSTATION CARD COMPONENT ───────────────────────────────────────────────

function WorkstationCardUI({ ws }: { ws: WsCard }) {
  const s = STATUS_STYLES[ws.status]
  return (
    <div className={`rounded-lg border-2 ${s.border} ${s.bg} flex flex-col overflow-hidden transition-all hover:shadow-md`}>
      {/* Operator Header */}
      <div className={`px-2.5 py-2 ${s.headerBg} flex items-center gap-2`}>
        <User size={16} className={s.text} />
        <div className="flex flex-col min-w-0">
          <span className={`text-xs font-extrabold ${s.text} truncate`}>{ws.operatorName}</span>
          <span className="text-[10px] text-t-secondary font-medium truncate">{ws.operation}</span>
        </div>
      </div>

      {/* TLS / RW / RJ Values */}
      <div className="px-2.5 py-2 flex items-center justify-between gap-1">
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-t-lighter font-semibold uppercase">TLS</span>
          <span className="text-sm font-extrabold text-[#007b83] dark:text-[#2dd4bf]">{ws.tls}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-t-lighter font-semibold uppercase">RW</span>
          <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{ws.rework}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-t-lighter font-semibold uppercase">RJ</span>
          <span className="text-sm font-extrabold text-red-600 dark:text-red-400">{ws.rejection}</span>
        </div>
      </div>

      {/* Status Footer */}
      <div className={`px-2.5 py-1.5 border-t ${s.border} flex items-center gap-1.5`}>
        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
        <span className={`text-[10px] font-bold ${s.text}`}>{ws.status}</span>
      </div>
    </div>
  )
}

// ── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────

export default function LineTvDisplayPage() {
  const header = LINE_TV_HEADER
  const kpi = LINE_TV_KPI
  const stations = WORKSTATION_CARDS

  // Live clock
  const [now, setNow] = useState(new Date())
  const [countdown, setCountdown] = useState(DATA_REFRESH_INTERVAL)

  useEffect(() => {
    const clockTimer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(clockTimer)
  }, [])

  useEffect(() => {
    const refreshTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return DATA_REFRESH_INTERVAL
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(refreshTimer)
  }, [])

  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <AppLayout>
      <div className="flex flex-col gap-0 min-h-[calc(100vh-56px)]">

        {/* ── HEADER BAR (Dark Navy) ── */}
        <div className="bg-[#1a2332] text-white px-5 py-3 flex items-center justify-between">
          <h1 className="text-lg font-extrabold tracking-wide">
            {header.lineName} <span className="text-gray-400 font-light mx-2">|</span> QONE SIGNAL
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400" />
              <span className="font-semibold">{timeStr}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-400" />
              <span className="font-semibold">{dateStr}</span>
            </div>
          </div>
        </div>

        {/* ── ORDER INFO BAR ── */}
        <div className="bg-card border-b border-table-line px-5 py-2 flex items-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <Package size={13} className="text-t-lighter" />
            <span className="text-t-secondary font-semibold">ORDER</span>
            <span className="font-bold text-t-primary ml-1">{header.order}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag size={13} className="text-t-lighter" />
            <span className="text-t-secondary font-semibold">STYLE NUMBER</span>
            <span className="font-bold text-t-primary ml-1">{header.styleNumber}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shirt size={13} className="text-t-lighter" />
            <span className="text-t-secondary font-semibold">STYLE NAME</span>
            <span className="font-bold text-[#007b83] dark:text-[#2dd4bf] ml-1">{header.styleName}</span>
          </div>
        </div>

        {/* ── KPI SUMMARY ROW ── */}
        <div className="bg-card border-b border-table-line px-4 py-2.5">
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {/* Workstations */}
            <div className="bg-table-head/50 rounded-lg px-3 py-2 text-center border border-table-line/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users size={12} className="text-t-lighter" />
                <span className="text-[9px] font-bold text-t-secondary uppercase">Workstations</span>
              </div>
              <p className="text-xl font-extrabold text-t-primary">{kpi.workstations.total}</p>
              <div className="flex items-center justify-center gap-1.5 mt-1 text-[9px] font-bold">
                <span className="flex items-center gap-0.5 text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {kpi.workstations.normal}
                </span>
                <span className="flex items-center gap-0.5 text-amber-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {kpi.workstations.attention}
                </span>
                <span className="flex items-center gap-0.5 text-red-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {kpi.workstations.critical}
                </span>
              </div>
            </div>

            {/* QONE Signal */}
            <div className="bg-table-head/50 rounded-lg px-3 py-2 text-center border border-table-line/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertTriangle size={12} className="text-t-lighter" />
                <span className="text-[9px] font-bold text-t-secondary uppercase">QONE Signal</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-extrabold text-red-600">{kpi.qoneSignal.critical} <span className="text-[9px] font-medium text-t-lighter">Critical</span></span>
                <span className="text-sm font-extrabold text-amber-600">{kpi.qoneSignal.attention} <span className="text-[9px] font-medium text-t-lighter">Attention</span></span>
              </div>
            </div>

            {/* Open CAP */}
            <div className="bg-table-head/50 rounded-lg px-3 py-2 text-center border border-table-line/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ShieldCheck size={12} className="text-t-lighter" />
                <span className="text-[9px] font-bold text-t-secondary uppercase">Open CAP</span>
              </div>
              <p className="text-xl font-extrabold text-t-primary">{kpi.openCap.value}</p>
              <p className="text-[9px] text-t-lighter font-medium">{kpi.openCap.sub}</p>
            </div>

            {/* Rework */}
            <div className="bg-table-head/50 rounded-lg px-3 py-2 text-center border border-table-line/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Repeat size={12} className="text-t-lighter" />
                <span className="text-[9px] font-bold text-t-secondary uppercase">Rework</span>
              </div>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{kpi.rework.value}</p>
              <p className="text-[9px] text-t-lighter font-medium">{kpi.rework.sub}</p>
            </div>

            {/* Rejection */}
            <div className="bg-table-head/50 rounded-lg px-3 py-2 text-center border border-table-line/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <XCircle size={12} className="text-t-lighter" />
                <span className="text-[9px] font-bold text-t-secondary uppercase">Rejection</span>
              </div>
              <p className="text-xl font-extrabold text-red-600 dark:text-red-400">{kpi.rejection.value}</p>
              <p className="text-[9px] text-t-lighter font-medium">{kpi.rejection.sub}</p>
            </div>

            {/* DHU */}
            <div className="bg-table-head/50 rounded-lg px-3 py-2 text-center border border-table-line/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BarChart3 size={12} className="text-t-lighter" />
                <span className="text-[9px] font-bold text-t-secondary uppercase">DHU</span>
              </div>
              <p className="text-xl font-extrabold text-t-primary">{kpi.dhu.value}</p>
              <p className="text-[9px] text-t-lighter font-medium">{kpi.dhu.sub}</p>
            </div>

            {/* Input */}
            <div className="bg-table-head/50 rounded-lg px-3 py-2 text-center border border-table-line/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ArrowDownToLine size={12} className="text-t-lighter" />
                <span className="text-[9px] font-bold text-t-secondary uppercase">Input</span>
              </div>
              <p className="text-xl font-extrabold text-t-primary">{kpi.input.value.toLocaleString()}</p>
              <p className="text-[9px] text-t-lighter font-medium">{kpi.input.sub}</p>
            </div>

            {/* Output */}
            <div className="bg-table-head/50 rounded-lg px-3 py-2 text-center border border-table-line/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Factory size={12} className="text-t-lighter" />
                <span className="text-[9px] font-bold text-t-secondary uppercase">Output</span>
              </div>
              <p className="text-lg font-extrabold text-t-primary">{kpi.output.value.toLocaleString()}</p>
              <p className="text-[9px] text-t-lighter font-medium">{kpi.output.sub}</p>
            </div>

            {/* Efficiency */}
            <div className="bg-table-head/50 rounded-lg px-3 py-2 text-center border border-table-line/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Gauge size={12} className="text-t-lighter" />
                <span className="text-[9px] font-bold text-t-secondary uppercase">Efficiency</span>
              </div>
              <p className="text-xl font-extrabold text-[#007b83] dark:text-[#2dd4bf]">{kpi.efficiency.value}</p>
              <p className="text-[9px] text-t-lighter font-medium">{kpi.efficiency.sub}</p>
            </div>
          </div>
        </div>

        {/* ── WORKSTATION GRID ── */}
        <div className="flex-1 bg-background px-4 py-3 overflow-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {stations.map(ws => (
              <WorkstationCardUI key={ws.id} ws={ws} />
            ))}
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="bg-[#1a2332] text-white px-5 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-5">
            <span className="text-sm font-extrabold tracking-widest">
              Q<span className="text-[#007b83]">ONE</span>
            </span>
            <div className="flex items-center gap-1.5">
              <Package size={12} className="text-gray-400" />
              <span className="text-gray-400 font-semibold">ORDER</span>
              <span className="font-bold ml-1">{header.order}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tag size={12} className="text-gray-400" />
              <span className="text-gray-400 font-semibold">STYLE NUMBER</span>
              <span className="font-bold ml-1">{header.styleNumber}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shirt size={12} className="text-gray-400" />
              <span className="text-gray-400 font-semibold">STYLE NAME</span>
              <span className="font-bold text-[#2dd4bf] ml-1">{header.styleName}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-gray-400">
            <span className="font-medium">Data refresh in</span>
            <Clock size={12} />
            <span className="font-bold text-white">{countdown} sec</span>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
