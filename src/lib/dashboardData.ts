// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Data — Types & Static Configuration
// ─────────────────────────────────────────────────────────────────────────────
// This file contains types and initial data for the Dashboard page.
// Once the backend dashboard API is ready, integrate API responses
// using the same interfaces/types so the UI components remain unchanged.
// ─────────────────────────────────────────────────────────────────────────────

// ── TYPES ────────────────────────────────────────────────────────────────────

export interface DashboardHeaderInfo {
  workingHours: string
  workingMin: string
  clockedMin: string
}

export interface DashboardKPIData {
  workstations: { total: number; noIssues: number; attention: number; critical: number }
  qoneSignal: { critical: number; attention: number }
  openCap: { value: number; sub: string }
  rework: { value: string; sub: string }
  rejection: { value: string; sub: string }
  dhu: { value: string; sub: string }
  output: { value: number; target: number }
  efficiency: { value: string; sub: string }
}

export type LineStatus = 'Good' | 'Attention' | 'Critical' | 'Stopped'

export interface DashboardLineRow {
  id: number
  name: string
  order: string
  styleName: string
  mp: number | null
  qoneSignal: { red: number; yellow: number; green: number }
  issues: number | null
  status: LineStatus
  input: number | null
  // Quality Performance
  checkedPcs: number | null
  reworkPcs: number | null
  reworkPct: number | null
  rejPcs: number | null
  rejPct: number | null
  // DHU
  dhuPcs: number | null
  dhuPct: number | null
  // AQL
  aql?: number | null
  aqlPcs: number | null
  aqlPct: number | null
  // Production Performance
  lineWip: number | null
  lineEffPct: number | null
  outputTarget: number | null
  outputActual: number | null
  achdEffPct: number | null
  p2p: number | null
}

export interface DashboardSummaryRow {
  totalOrders: number
  totalStyles: number
  totalMp: number
  totalIssues: number
  totalInput: number
  totalCheckedPcs: number
  totalReworkPcs: number
  avgReworkPct: number
  totalRejPcs: number
  avgRejPct: number
  totalDhuPcs: number
  avgDhuPct: number
  totalAql: number
  totalAqlPcs: number
  avgAqlPct: number
  totalLineWip: number
  avgLineEffPct: number
  totalOutputTarget: number
  totalOutputActual: number
  avgAchdEffPct: number
  avgP2p: number
}

export interface PriorityActionItem {
  id: number
  type: 'critical' | 'warning'
  line: string
  style: string
  desc: string
  badge: string
  time: string
}

export interface TopDefectItem {
  rank: number
  name: string
  count: string
  pct: string
  barColor: string
}

// ── BACKEND API INTERFACES (POST /dashboard/table) ───────────────────────────

export interface QoneSignalApiItem {
  code?: string
  tls_id?: string
  operator_id?: number | null
  operator_name?: string | null
  defect_qty?: number
  light_color?: string | null
  light_hexcode?: string | null
}

export interface DashboardApiOrder {
  order_id: number
  order_no: string
}

export interface DashboardApiStyle {
  style_id: number
  style_name: string
}

export interface DashboardApiLine {
  line_id: number
  line_name: string
  zone_id?: number
  zone_name?: string
  orders?: DashboardApiOrder[]
  styles?: DashboardApiStyle[]
  mp: number
  qone_signal: QoneSignalApiItem[]
  status: LineStatus | string
  issues: number
  critical_issues?: number
  attention_issues?: number
  critical_workstations?: number
  attention_workstations?: number
  good_workstations?: number
  open_cap?: number
  input?: number
  checked?: number
  checked_qty?: number
  rework?: number
  rework_qty?: number
  rework_pct?: number
  rejection?: number
  rejection_qty?: number
  rejection_pct?: number
  dhu?: number
  dhu_qty?: number
  dhu_pct?: number
  aql?: number
  aql_qty?: number
  aql_pct?: number
  wip?: number
  target_man?: number
  target_pcs?: number
  sam?: number
  output?: number
  achieved_effi?: number
  p2p?: number
}

export interface DashboardShiftInfo {
  working_hours: number
  working_min: number
  clocked_min: number
  shift_name: string
}

export interface DashboardApiSummary {
  total_lines?: number
  total_orders?: number
  total_styles?: number
  total_mp?: number
  workstation?: number
  total_workstations?: number
  good_workstations?: number
  attention_workstations?: number
  critical_workstations?: number
  critical_issues?: number
  attention_issues?: number
  total_issues?: number
  open_cap?: number
  total_open_cap?: number
  product_open_cap?: number
  total_input?: number
  total_checked?: number
  total_rework?: number
  rework_pct?: number
  total_rejection?: number
  rejection_pct?: number
  total_dhu?: number
  dhu_pct?: number
  total_aql?: number
  aql_pct?: number
  total_wip?: number
  total_target_man?: number
  total_target_pcs?: number
  total_sam?: number
  total_output?: number
  achieved_effi?: number
  p2p?: number
}

export interface DashboardApiData {
  date?: string
  date_from: string
  date_to: string
  shift_info: DashboardShiftInfo
  setting_type?: number
  lines: DashboardApiLine[]
  summary: DashboardApiSummary
}

export interface DashboardApiResponse {
  success: boolean
  message: string
  data: DashboardApiData
}

// ── DATA ─────────────────────────────────────────────────────────────────────

export const HEADER_INFO: DashboardHeaderInfo = {
  workingHours: '8 hrs',
  workingMin: '480 min',
  clockedMin: '288 min',
}

export const SHIFTS = ['A', 'B', 'C']

export const ZONES = ['Zone-1', 'Zone-2', 'Zone-3', 'Zone-4', 'Zone-5']

export const KPI_DATA: DashboardKPIData = {
  workstations: { total: 400, noIssues: 320, attention: 60, critical: 20 },
  qoneSignal: { critical: 60, attention: 20 },
  openCap: { value: 35, sub: 'Action Req' },
  rework: { value: '6.20%', sub: '32 Pending' },
  rejection: { value: '1.10%', sub: '55 Pending' },
  dhu: { value: '7.10%', sub: 'vs 5% target' },
  output: { value: 18000, target: 28000 },
  efficiency: { value: '61%', sub: 'vs 68% Target' },
}

export const LINE_ROWS: DashboardLineRow[] = [
  {
    id: 1, name: 'Line 1', order: '15842', styleName: "Men's Polo T-Shirt", mp: 18,
    qoneSignal: { red: 4, yellow: 3, green: 11 }, issues: 4, status: 'Good',
    input: 800, checkedPcs: 500, reworkPcs: 18, reworkPct: 4, rejPcs: 5, rejPct: 1,
    dhuPcs: 23, dhuPct: 5.00, aql: 450, aqlPcs: 800, aqlPct: 88,
    lineWip: 2500, lineEffPct: 62, outputTarget: 800, outputActual: 588, achdEffPct: 55, p2p: 74,
  },
  {
    id: 2, name: 'Line 2', order: '15843', styleName: 'Ladies Basic T-Shirt', mp: 17,
    qoneSignal: { red: 5, yellow: 4, green: 8 }, issues: 5, status: 'Good',
    input: 900, checkedPcs: 400, reworkPcs: 25, reworkPct: 6, rejPcs: 9, rejPct: 2,
    dhuPcs: 34, dhuPct: 9.00, aql: 350, aqlPcs: 900, aqlPct: 77,
    lineWip: 1858, lineEffPct: 65, outputTarget: 1000, outputActual: 500, achdEffPct: 65, p2p: 50,
  },
  {
    id: 3, name: 'Line 3', order: '15844', styleName: "Men's Round Neck T-Shirt", mp: 19,
    qoneSignal: { red: 4, yellow: 5, green: 10 }, issues: 4, status: 'Attention',
    input: 1000, checkedPcs: 500, reworkPcs: 29, reworkPct: 6, rejPcs: 4, rejPct: 1,
    dhuPcs: 33, dhuPct: 7.00, aql: 450, aqlPcs: 500, aqlPct: 65,
    lineWip: 1987, lineEffPct: 68, outputTarget: 1020, outputActual: 400, achdEffPct: 57, p2p: 39,
  },
  {
    id: 4, name: 'Line 4', order: '15845', styleName: 'Ladies Polo T-Shirt', mp: 18,
    qoneSignal: { red: 5, yellow: 4, green: 9 }, issues: 5, status: 'Attention',
    input: 1100, checkedPcs: 400, reworkPcs: 45, reworkPct: 11, rejPcs: 5, rejPct: 1,
    dhuPcs: 50, dhuPct: 13.00, aql: 350, aqlPcs: 300, aqlPct: 88,
    lineWip: 1896, lineEffPct: 67, outputTarget: 1500, outputActual: 500, achdEffPct: 58, p2p: 33,
  },
  {
    id: 5, name: 'Line 5', order: '15846', styleName: 'Kids Printed T-Shirt', mp: null,
    qoneSignal: { red: 0, yellow: 0, green: 0 }, issues: null, status: 'Stopped',
    input: null, checkedPcs: null, reworkPcs: null, reworkPct: null, rejPcs: null, rejPct: null,
    dhuPcs: null, dhuPct: null, aql: null, aqlPcs: null, aqlPct: null,
    lineWip: null, lineEffPct: null, outputTarget: null, outputActual: null, achdEffPct: null, p2p: null,
  },
  {
    id: 6, name: 'Line 6', order: '15847', styleName: "Men's Jogger Pant", mp: 19,
    qoneSignal: { red: 5, yellow: 5, green: 9 }, issues: 5, status: 'Critical',
    input: 800, checkedPcs: 400, reworkPcs: 25, reworkPct: 6, rejPcs: 5, rejPct: 1,
    dhuPcs: 30, dhuPct: 8.00, aql: 350, aqlPcs: 400, aqlPct: 99,
    lineWip: 3500, lineEffPct: 75, outputTarget: 1350, outputActual: 985, achdEffPct: 47, p2p: 73,
  },
  {
    id: 7, name: 'Line 7', order: '15848', styleName: 'Ladies Leggings', mp: 21,
    qoneSignal: { red: 4, yellow: 3, green: 14 }, issues: 4, status: 'Good',
    input: 800, checkedPcs: 500, reworkPcs: 28, reworkPct: 6, rejPcs: 9, rejPct: 2,
    dhuPcs: 37, dhuPct: 7.00, aql: 450, aqlPcs: 500, aqlPct: 100,
    lineWip: 3589, lineEffPct: 76, outputTarget: 1200, outputActual: 856, achdEffPct: 56, p2p: 71,
  },
  {
    id: 8, name: 'Line 8', order: '15849', styleName: "Men's Casual Shirt", mp: 20,
    qoneSignal: { red: 5, yellow: 5, green: 10 }, issues: 5, status: 'Critical',
    input: 900, checkedPcs: 400, reworkPcs: 26, reworkPct: 7, rejPcs: 4, rejPct: 1,
    dhuPcs: 30, dhuPct: 8.00, aql: 350, aqlPcs: 100, aqlPct: 85,
    lineWip: 4510, lineEffPct: 78, outputTarget: 1456, outputActual: 751, achdEffPct: 80, p2p: 52,
  },
  {
    id: 9, name: 'Line 9', order: '15850', styleName: 'Kids Hooded T-Shirt', mp: null,
    qoneSignal: { red: 0, yellow: 0, green: 0 }, issues: null, status: 'Stopped',
    input: null, checkedPcs: null, reworkPcs: null, reworkPct: null, rejPcs: null, rejPct: null,
    dhuPcs: null, dhuPct: null, aql: null, aqlPcs: null, aqlPct: null,
    lineWip: null, lineEffPct: null, outputTarget: null, outputActual: null, achdEffPct: null, p2p: null,
  },
  {
    id: 10, name: 'Line 10', order: '15851', styleName: 'Ladies Casual Top', mp: 21,
    qoneSignal: { red: 5, yellow: 3, green: 13 }, issues: 5, status: 'Good',
    input: 800, checkedPcs: 678, reworkPcs: 35, reworkPct: 5, rejPcs: 1, rejPct: 0,
    dhuPcs: 36, dhuPct: 5.00, aql: 628, aqlPcs: 150, aqlPct: 70,
    lineWip: 1542, lineEffPct: 65, outputTarget: 1100, outputActual: 751, achdEffPct: 20, p2p: 68,
  },
]

export const SUMMARY_ROW: DashboardSummaryRow = {
  totalOrders: 10,
  totalStyles: 10,
  totalMp: 153,
  totalIssues: 37,
  totalInput: 7100,
  totalCheckedPcs: 3778,
  totalReworkPcs: 231,
  avgReworkPct: 6,
  totalRejPcs: 42,
  avgRejPct: 1,
  totalDhuPcs: 273,
  avgDhuPct: 0.07,
  totalAql: 3378,
  totalAqlPcs: 3378,
  avgAqlPct: 80,
  totalLineWip: 21382,
  avgLineEffPct: 68,
  totalOutputTarget: 9426,
  totalOutputActual: 5331,
  avgAchdEffPct: 55,
  avgP2p: 57,
}

export const PRIORITY_ACTIONS: PriorityActionItem[] = [
  { id: 1, type: 'critical', line: 'Line 10', style: 'ST-350', desc: 'Rework % is very high', badge: 'Rework 11.3%', time: '10:43 AM' },
  { id: 2, type: 'critical', line: 'Line 5', style: 'ST-350', desc: 'High defects detected', badge: 'Rework 7.6%', time: '10:42 AM' },
  { id: 3, type: 'warning', line: 'Line 7', style: 'ST-219', desc: 'Rework % above target', badge: 'Rework 9.8%', time: '10:40 AM' },
  { id: 4, type: 'warning', line: 'Line 3', style: 'ST-220', desc: 'Rejection % increasing', badge: 'Rej % 1.11%', time: '10:39 AM' },
]

export const TOP_DEFECTS: TopDefectItem[] = [
  { rank: 1, name: 'Stitch Skip', count: '1,245', pct: '45%', barColor: 'bg-red-500' },
  { rank: 2, name: 'Needle Mark', count: '768', pct: '28%', barColor: 'bg-amber-500' },
  { rank: 3, name: 'Thread Break', count: '543', pct: '19%', barColor: 'bg-yellow-500' },
  { rank: 4, name: 'Others', count: '210', pct: '8%', barColor: 'bg-gray-400' },
]
