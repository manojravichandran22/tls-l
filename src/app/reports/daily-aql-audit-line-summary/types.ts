export interface AqlAuditDataDetail {
  id: string
  uuid: string
  order_id: string
  buyer: string
  style_id: string
  line_id: string
  line_name: string
  colour: string
  shift_id: number | string | null
  shift_name: string | null
  team_id: string
  team_name: string
  branch_id: string
  branch_name: string
  inspection_level: string
  inspection_level_id: string
  inspection_qty: number
  sample_size: number
  allow_minor: number
  allow_major: number
  allow_critical: number
  total_defect: number
  minor_defect: number
  major_defect: number
  critical_defect: number
  aql_result: number | null
  inspection_status: string
  audit_at: string
  created_at: string
}

export interface AqlAuditLineRow {
  date: string
  branch_id: number | string
  branch_name: string
  team_id: number | string
  team_name: string
  line_id: number | string
  line_name: string
  shift_id?: number | string | null
  shift_name?: string | null
  total_lots: number
  pass_lots: number
  fail_lots: number
  pending_lots?: number
  pass_percent: number | string
  fail_percent: number | string
  total_inspection_qty: number
  total_pass_qty: number
  total_fail_qty: number
  major_defects: number
  minor_defects: number
  rating?: string
  status?: string
  audit_data?: AqlAuditDataDetail[]
}

export interface AqlAuditSummary {
  total_lots: number
  pass_lots: number
  fail_lots: number
  pending_lots?: number
  total_inspection_qty: number
  total_pass_qty: number
  total_fail_qty: number
  major_defects: number
  minor_defects: number
  pass_percent: number | string
  fail_percent: number | string
  rating?: string
  status?: string
}

export interface AqlAuditReportData {
  summary?: AqlAuditSummary
  data?: AqlAuditLineRow[]
}
