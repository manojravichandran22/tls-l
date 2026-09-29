// ─────────────────────────────────────────────────────────────────────────────
// Quality TV Display Data — Types & Mock JSON Configuration
// ─────────────────────────────────────────────────────────────────────────────
// This file contains structured TypeScript interfaces and JSON-format mock data
// for the Quality TV Display page.
// When the backend API is ready, you can simply replace or bind this data
// to the API response matching the QualityTvApiResponse interface.
// ─────────────────────────────────────────────────────────────────────────────

export interface QualityTvHeaderInfo {
  lineName: string
  lineSubtitle: string
  order: string
  colour: string
  colourCode?: string
  styleNumber: string
  styleName: string
  shift: string
  time?: string
  date?: string
}

export interface WorkstationsBreakdown {
  total: number
  normal: number
  attention: number
  critical: number
}

export interface QualityKpiData {
  workstations: WorkstationsBreakdown
  openCap: {
    value: number
    sub: string
  }
  rework: {
    value: string
    sub: string
  }
  rejection: {
    value: string
    sub: string
  }
  dhu: {
    value: string
    target: string
    trending: 'up' | 'down'
  }
}

export interface ProductionKpiData {
  output: {
    target: number
    actual: number
    value?: number
    unit?: string
  }
  efficiency: {
    target: number
    actual: number
    value?: number
  }
  input: {
    value: number
    label?: string
    unit?: string
    wip?: string
  }
  p2p?: {
    value: number
    label?: string
  }
  balance?: {
    value: number
    unit: string
    sub: string
  }
}

export type TlsSignalStatus = 'CRITICAL' | 'ATTENTION' | 'NORMAL'

export interface TlsSignalItem {
  id: number
  status: TlsSignalStatus
  operatorName: string
  stationCode: string
  operationName: string
  issue: string
  elapsed: string
  tls: number
  rw: number
  rj: number
}

export interface TlsSignalSummary {
  critical: number
  attention: number
  normal: number
}

export interface TopDefectItem {
  rank: string
  name: string
  qty: number
  pct: number
  color: string
}

export interface DefectCategoryDonutSlice {
  pct: number
  color: string
}

export interface DefectCategoryItem {
  name: string
  count: number
  pct: number
  color: string
}

export interface QualityPerformanceHour {
  hour: string
  reworkPct: number
  rejectionPct: number
  dhuPct: number
}

export interface HourlyOutputPoint {
  hour: string
  actual: number
  target: number
}

export interface HourlyEfficiencyPoint {
  hour: string
  actual: number
  target?: number
}

export interface ProductionMetrics {
  targetPerHour: number
  currentOutputPerHour: number
  targetOutputTillNow: number
  actualOutputTillNow: number
  outputGapTillNow: number
  sam: number
  manpower: number
  targetEfficiency: number
  actualEfficiencyTillNow: number
  efficiencyGapTillNow: number
  avgOutputPerHour?: number
  avgEfficiency?: number
  currentEfficiency?: number
  totalTarget?: number
  totalOutput?: number
  variance?: number
}

// ── FULL API RESPONSE SCHEMA ──────────────────────────────────────────────────

export interface ShiftInfoData {
  shiftName: string
  shiftStart: string
  shiftEnd: string
  workingHours: number
  workingMin: number
  clockedMin: number
}

export interface QualityTvData {
  header: QualityTvHeaderInfo
  factorySetup?: string
  qualityKpis: QualityKpiData
  productionKpis: ProductionKpiData
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
  hourlyOutput: {
    period: string
    data: HourlyOutputPoint[]
  }
  hourlyEfficiency: {
    period: string
    data: HourlyEfficiencyPoint[]
  }
  productionMetrics: ProductionMetrics
  shiftInfo?: ShiftInfoData
  refreshIntervalSec?: number
}

export interface QualityTvApiResponse {
  success: boolean
  message: string
  data: QualityTvData
}

// ── BACKEND API RESPONSE SCHEMA (POST /qualitytv/data) ────────────────────────

export interface BackendHeader {
  line_name?: string
  line_status?: string
  order_code?: string
  order_no?: string
  colour?: string
  style_number?: string
  style_name?: string
  shift_name?: string
  current_time?: string
  current_date?: string
}

export interface BackendWorkstationsSummary {
  total: number
  normal: number
  attention: number
  critical: number
}

export interface BackendOpenCapSummary {
  count: number
  subtitle?: string
}

export interface BackendReworkSummary {
  pct: number
  pending_count?: number
}

export interface BackendRejectionSummary {
  pct: number
  pending_count?: number
}

export interface BackendDhuSummary {
  pct: number
}

export interface BackendTlsCard {
  id?: number
  severity: 'CRITICAL' | 'ATTENTION' | 'NORMAL' | string
  operator_name: string
  station: string
  defect_name: string
  elapsed_time: number | string
  counters?: {
    tls?: number
    rw?: number
    rj?: number
  }
  priority_score?: number
}

export interface BackendTlsSignalOverview {
  summary?: {
    critical: number
    attention: number
    normal: number
  }
  cards?: BackendTlsCard[]
  all_cards?: BackendTlsCard[]
  pagination?: {
    total_cards?: number
    current_page?: number
    next_page?: number
    per_page?: number
    total_pages?: number
    refresh_interval_sec?: number
  }
}

export interface BackendTopDefect {
  rank?: string
  name?: string
  defect_name?: string
  qty?: number
  count?: number
  pct?: number
  color?: string
}

export interface BackendDefectCategory {
  category_name?: string
  name?: string
  qty?: number
  count?: number
  pct?: number
  color?: string
}

export interface BackendQualityPerformanceHourly {
  hours?: string[]
  rework_pct?: number[]
  rejection_pct?: number[]
  dhu_pct?: number[]
}

export interface BackendQualityData {
  summary_cards?: {
    workstations?: BackendWorkstationsSummary
    open_cap?: BackendOpenCapSummary
    rework?: BackendReworkSummary
    rejection?: BackendRejectionSummary
    dhu?: BackendDhuSummary
  }
  tls_signal_overview?: BackendTlsSignalOverview
  top_defects?: BackendTopDefect[]
  defect_category_breakdown?: {
    total?: number
    categories?: BackendDefectCategory[]
  }
  quality_performance_hourly?: BackendQualityPerformanceHourly
}

export interface BackendProductionSummaryCards {
  output?: {
    target: number
    actual: number
  }
  efficiency?: {
    target: number
    actual: number
  }
  input?: {
    total_input: number
  }
  p2p?: {
    pct: number
  }
}

export interface BackendHourlyOutput {
  chart?: {
    labels?: string[]
    actual?: number[]
    target?: number[]
    final_target?: number
  }
  components?: {
    target_per_hr?: number
    current_output_per_hr?: number
    target_output_till_now?: number
    actual_output_till_now?: number
    output_gap_till_now?: number
  }
}

export interface BackendHourlyEfficiency {
  chart?: {
    hours?: string[]
    target?: number[]
    actual_cumulative?: number[]
  }
  components?: {
    sam?: number
    manpower?: number
    target_efficiency?: number
    actual_efficiency_till_now?: number
    efficiency_gap?: number
  }
}

export interface BackendProductionData {
  summary_cards?: BackendProductionSummaryCards
  hourly_output?: BackendHourlyOutput
  hourly_efficiency?: BackendHourlyEfficiency
}

export interface BackendShiftInfo {
  shift_name?: string
  shift_start?: string
  shift_end?: string
  working_hours?: number
  working_min?: number
  clocked_min?: number
}

export interface QualityTvBackendData {
  header?: BackendHeader
  factory_setup?: string
  quality?: BackendQualityData
  production?: BackendProductionData
  shift_info?: BackendShiftInfo
}

export interface QualityTvBackendResponse {
  success: boolean
  message: string
  data: QualityTvBackendData
}

// ── COLOR HELPERS ─────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#eab308',
  black: '#1e293b',
  white: '#f8fafc',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
  navy: '#1e3a8a',
  grey: '#6b7280',
  gray: '#6b7280',
  teal: '#14b8a6',
}

export function formatElapsedTime(val: number | string | undefined): string {
  if (val === undefined || val === null) return '00:00'
  if (typeof val === 'string') {
    if (val.includes(':')) return val
    val = Number(val) || 0
  }
  const mins = Math.floor(val / 60)
  const secs = Math.floor(val % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// ── TRANSFORMER: BACKEND RESPONSE → FRONTEND STATE ──────────────────────────

export function transformQualityTvBackendData(raw: QualityTvBackendData): QualityTvData {
  const headerRaw = raw.header || {}

  // Format Order display: e.g. "ODR081 (E0001)" or "ODR081"
  let orderStr = '—'
  if (headerRaw.order_code && headerRaw.order_no) {
    orderStr = headerRaw.order_code === headerRaw.order_no
      ? headerRaw.order_code
      : `${headerRaw.order_code} (${headerRaw.order_no})`
  } else if (headerRaw.order_code || headerRaw.order_no) {
    orderStr = (headerRaw.order_code || headerRaw.order_no) as string
  }

  const colourName = headerRaw.colour || 'Red'
  const colourCode = COLOR_MAP[colourName.toLowerCase()] || '#ef4444'

  const header: QualityTvHeaderInfo = {
    lineName: headerRaw.line_name || 'LINE 1',
    lineSubtitle: headerRaw.line_status || 'QONE SIGNAL',
    order: orderStr,
    colour: colourName,
    colourCode,
    styleNumber: headerRaw.style_number || '—',
    styleName: headerRaw.style_name || '—',
    shift: headerRaw.shift_name || 'Shift A',
    time: headerRaw.current_time,
    date: headerRaw.current_date,
  }

  // Quality KPIs
  const qSummary = raw.quality?.summary_cards
  const qualityKpis: QualityKpiData = {
    workstations: {
      total: qSummary?.workstations?.total ?? 0,
      normal: qSummary?.workstations?.normal ?? 0,
      attention: qSummary?.workstations?.attention ?? 0,
      critical: qSummary?.workstations?.critical ?? 0,
    },
    openCap: {
      value: qSummary?.open_cap?.count ?? 0,
      sub: qSummary?.open_cap?.subtitle || 'Action Required',
    },
    rework: {
      value: `${qSummary?.rework?.pct ?? 0}%`,
      sub: `${qSummary?.rework?.pending_count ?? 0} Pending`,
    },
    rejection: {
      value: `${qSummary?.rejection?.pct ?? 0}%`,
      sub: `${qSummary?.rejection?.pending_count ?? 0} Pending`,
    },
    dhu: {
      value: `${qSummary?.dhu?.pct ?? 0}%`,
      target: '3% Target',
      trending: (qSummary?.dhu?.pct ?? 0) > 3 ? 'up' : 'down',
    },
  }

  // TLS Signal Cards & Summary
  const rawSignals = raw.quality?.tls_signal_overview
  const rawCards = (rawSignals?.all_cards && rawSignals.all_cards.length > 0)
    ? rawSignals.all_cards
    : (rawSignals?.cards || [])

  const signalItems: TlsSignalItem[] = rawCards.map((c, i) => {
    const stationParts = (c.station || '').split('|').map(s => s.trim())
    const stationCode = stationParts[0] || `Station ${i + 1}`
    const operationName = stationParts.length > 1 ? stationParts.slice(1).join(' | ') : 'Operation'
    const status = (c.severity?.toUpperCase() || 'NORMAL') as TlsSignalStatus

    return {
      id: c.id ?? (i + 1),
      status,
      operatorName: c.operator_name || 'Operator',
      stationCode,
      operationName,
      issue: c.defect_name || 'Defect Detected',
      elapsed: c.elapsed_time != null ? String(c.elapsed_time) : '—',
      tls: c.counters?.tls ?? 0,
      rw: c.counters?.rw ?? 0,
      rj: c.counters?.rj ?? 0,
    }
  })

  const signalSummary: TlsSignalSummary = {
    critical: rawSignals?.summary?.critical ?? signalItems.filter(s => s.status === 'CRITICAL').length,
    attention: rawSignals?.summary?.attention ?? signalItems.filter(s => s.status === 'ATTENTION').length,
    normal: rawSignals?.summary?.normal ?? signalItems.filter(s => s.status === 'NORMAL').length,
  }

  // Top Defects
  const rawTopDefects = raw.quality?.top_defects || []
  const defectColors = ['#ef4444', '#f97316', '#eab308', '#06b6d4', '#8b5cf6']
  const topDefects: TopDefectItem[] = rawTopDefects.map((d, i) => ({
    rank: d.rank || `#${i + 1}`,
    name: d.name || d.defect_name || `Defect ${i + 1}`,
    qty: d.qty ?? d.count ?? 0,
    pct: typeof d.pct === 'number' ? d.pct : Number(d.pct || 0),
    color: d.color || defectColors[i % defectColors.length],
  }))

  // Defect Category Breakdown
  const rawCatBreakdown = raw.quality?.defect_category_breakdown
  const catPalette = ['#007b83', '#0284c7', '#38bdf8', '#fb923c', '#94a3b8', '#a855f7', '#ec4899']
  const rawCategories = rawCatBreakdown?.categories || []
  const defectCategoryItems: DefectCategoryItem[] = rawCategories.map((cat, i) => ({
    name: cat.category_name || cat.name || 'Category',
    count: cat.qty ?? cat.count ?? 0,
    pct: typeof cat.pct === 'number' ? cat.pct : Number(cat.pct || 0),
    color: cat.color || catPalette[i % catPalette.length],
  }))
  const defectTotal = rawCatBreakdown?.total ?? defectCategoryItems.reduce((acc, c) => acc + c.count, 0)
  const donutSlices: DefectCategoryDonutSlice[] = defectCategoryItems.map(c => ({
    pct: c.pct,
    color: c.color,
  }))

  // Quality Performance Hourly
  const qph = raw.quality?.quality_performance_hourly
  const qphHours = qph?.hours || []
  const qualityPerformanceHourly: QualityPerformanceHour[] = qphHours.map((hour, i) => ({
    hour,
    reworkPct: Number(qph?.rework_pct?.[i] ?? 0),
    rejectionPct: Number(qph?.rejection_pct?.[i] ?? 0),
    dhuPct: Number(qph?.dhu_pct?.[i] ?? 0),
  }))

  // Production Summary
  const prodSummary = raw.production?.summary_cards
  const productionKpis: ProductionKpiData = {
    output: {
      target: prodSummary?.output?.target ?? 0,
      actual: prodSummary?.output?.actual ?? 0,
      value: prodSummary?.output?.actual ?? 0,
      unit: 'pcs',
    },
    efficiency: {
      target: prodSummary?.efficiency?.target ?? 0,
      actual: prodSummary?.efficiency?.actual ?? 0,
      value: prodSummary?.efficiency?.actual ?? 0,
    },
    input: {
      value: prodSummary?.input?.total_input ?? 0,
      label: "Today's Input",
      unit: 'pcs',
    },
    p2p: {
      value: prodSummary?.p2p?.pct ?? 0,
      label: 'Plan to Production',
    },
  }

  // Hourly Output
  const outChart = raw.production?.hourly_output?.chart
  const outLabels = outChart?.labels || []
  const outCount = Math.max(
    outLabels.length,
    outChart?.actual?.length || 0,
    outChart?.target?.length || 0
  )
  const hourlyOutputData: HourlyOutputPoint[] = Array.from({ length: outCount }, (_, i) => ({
    hour: outLabels[i] || `H${i + 1}`,
    actual: Number(outChart?.actual?.[i] ?? 0),
    target: Number(outChart?.target?.[i] ?? 0),
  }))

  // Hourly Efficiency
  const effChart = raw.production?.hourly_efficiency?.chart
  const effHours = effChart?.hours || []
  const effCount = Math.max(
    effHours.length,
    effChart?.actual_cumulative?.length || 0,
    effChart?.target?.length || 0
  )
  const hourlyEfficiencyData: HourlyEfficiencyPoint[] = Array.from({ length: effCount }, (_, i) => ({
    hour: effHours[i] || `H${i + 1}`,
    actual: Number(effChart?.actual_cumulative?.[i] ?? 0),
    target: effChart?.target?.[i] !== undefined ? Number(effChart.target[i]) : undefined,
  }))

  // Production Metrics
  const outComp = raw.production?.hourly_output?.components
  const effComp = raw.production?.hourly_efficiency?.components
  const productionMetrics: ProductionMetrics = {
    targetPerHour: outComp?.target_per_hr ?? 0,
    currentOutputPerHour: outComp?.current_output_per_hr ?? 0,
    targetOutputTillNow: outComp?.target_output_till_now ?? 0,
    actualOutputTillNow: outComp?.actual_output_till_now ?? 0,
    outputGapTillNow: outComp?.output_gap_till_now ?? 0,
    sam: effComp?.sam ?? 0,
    manpower: effComp?.manpower ?? 0,
    targetEfficiency: effComp?.target_efficiency ?? 0,
    actualEfficiencyTillNow: effComp?.actual_efficiency_till_now ?? 0,
    efficiencyGapTillNow: effComp?.efficiency_gap ?? 0,
  }

  // Shift Info
  const shiftInfoRaw = raw.shift_info
  const shiftInfo: ShiftInfoData | undefined = shiftInfoRaw ? {
    shiftName: shiftInfoRaw.shift_name || '',
    shiftStart: shiftInfoRaw.shift_start || '',
    shiftEnd: shiftInfoRaw.shift_end || '',
    workingHours: shiftInfoRaw.working_hours ?? 0,
    workingMin: shiftInfoRaw.working_min ?? 0,
    clockedMin: shiftInfoRaw.clocked_min ?? 0,
  } : undefined

  const refreshIntervalSec = raw.quality?.tls_signal_overview?.pagination?.refresh_interval_sec ?? 10

  return {
    header,
    factorySetup: raw.factory_setup,
    qualityKpis,
    productionKpis,
    tlsSignals: {
      items: signalItems,
      summary: signalSummary,
    },
    topDefects,
    defectCategories: {
      total: defectTotal,
      items: defectCategoryItems,
      donutSlices,
    },
    qualityPerformance: {
      reworkTarget: 2,
      rejectionTarget: 1,
      dhuTarget: 3,
      hourly: qualityPerformanceHourly,
    },
    hourlyOutput: {
      period: 'Today',
      data: hourlyOutputData,
    },
    hourlyEfficiency: {
      period: 'Today',
      data: hourlyEfficiencyData,
    },
    productionMetrics,
    shiftInfo,
    refreshIntervalSec,
  }
}


