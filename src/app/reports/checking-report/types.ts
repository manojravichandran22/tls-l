export interface CheckingReportRow {
  id?: string | number
  uuid?: string
  shift_id?: number | string
  shift_name?: string
  order_id?: string | number
  order_no?: string
  colour?: string
  style_id?: string | number
  style_name?: string
  buyer?: string
  line_id?: string | number
  line_name?: string
  checker_emp_code?: string | number
  checker_name?: string
  branch_id?: number | string
  branch_name?: string
  team_id?: number | string
  team_name?: string
  slot_id?: string | number
  size?: string
  size_id?: string | number
  qty?: number
  output_qty?: number
  balance?: number
  wip?: number
  audit_by?: string
  audit_at?: string
  status?: number
  is_active?: string | number
  created_by?: string
  updated_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface CheckingReportSummary {
  total_records?: number
  total_qty?: number
  total_output_qty?: number
  total_balance?: number
  total_wip?: number
}

export interface CheckingReportData {
  shift?: any[]
  checking?: CheckingReportRow[]
  summary?: CheckingReportSummary
}
