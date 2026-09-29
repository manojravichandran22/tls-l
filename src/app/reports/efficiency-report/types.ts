export interface EfficiencyReportOrder {
  order_id?: number
  shift_id?: number | null
  shift?: string | null
  team_id?: number | null
  team?: string | null
  io_no?: string | null
  colour?: string | null
  style_name?: string | null
  style_no?: string | null
  smv?: number
  style_wise_sah?: number
  tls_closed?: number
  tls_open?: number
  tls_total?: number
  checked_pcs?: number
  rework_qty?: number
  rework_pct?: number
  rej_qty?: number
  rej_pct?: number
  total_defects?: number
  dhu_pct?: number
  output?: number
}

export interface EfficiencyReportLine {
  zone_id?: number
  zone_name?: string
  line_id?: number
  line?: string
  shift_id?: number | null
  shift?: string | null
  team_id?: number | null
  team?: string | null
  manpower?: number
  working_hours?: number
  available_sah?: number
  orders?: EfficiencyReportOrder[]
  achieved_sah?: number
  eff_pct?: number
  order_count?: number
}

export interface EfficiencyReportTotal {
  label?: string
  manpower?: number
  working_hours?: number
  available_sah?: number
  order_count?: number
  style_wise_sah?: number
  achieved_sah?: number
  tls_closed?: number
  tls_open?: number
  tls_total?: number
  checked_pcs?: number
  rework_qty?: number
  rework_pct?: number
  rej_qty?: number
  rej_pct?: number
  total_defects?: number
  dhu_pct?: number
  output?: number
  eff_pct?: number
}

export interface EfficiencyReportZone {
  zone_id?: number
  zone_name?: string
  lines?: EfficiencyReportLine[]
  zone_total?: EfficiencyReportTotal
}

export interface EfficiencyReportDataPayload {
  date_from?: string
  date_to?: string
  data?: EfficiencyReportZone[]
  grand_total?: EfficiencyReportTotal
}

export interface EfficiencyReportFlatRow {
  _rowId: string
  _rowType: 'order' | 'line_empty' | 'zone_total' | 'grand_total'
  _zoneName?: string
  _lineName?: string
  _lineBlockKey?: string
  _lineRowSpan?: number
  _shiftRowSpan?: number
  _teamRowSpan?: number
  _zoneRowSpan?: number
  label?: string
  shift?: string
  team?: string
  zone_name?: string
  line?: string
  io_no?: string
  colour?: string
  style_name?: string
  style_no?: string
  smv?: number
  manpower?: number
  working_hours?: number
  available_sah?: number
  style_wise_sah?: number
  achieved_sah?: number
  tls_closed?: number
  tls_open?: number
  tls_total?: number
  checked_pcs?: number
  rework_qty?: number
  rework_pct?: number
  rej_qty?: number
  rej_pct?: number
  total_defects?: number
  dhu_pct?: number
  output?: number
  eff_pct?: number
  order_count?: number
}
