export interface DailyOperatorQualityRow {
  sl_no?: number | string
  branch_id?: number | string
  branch_name?: string
  shift_id?: number | string
  shift?: string
  shift_name?: string
  team_id?: number | string
  team?: string
  team_name?: string
  zone_id?: number | string
  zone?: string
  line_id?: number | string
  line?: string
  emp_id?: number | string
  emp_code?: string
  employee_name?: string
  designation?: string
  order_number?: string
  colour?: string
  buyer?: string
  style_name?: string
  style_number?: string
  operation?: string
  defect_category?: string
  total_mistake?: number | string
  elapsed_time?: number | string
  rework?: number | string
  rej?: number | string
  cpm?: number | string
  rework_cost?: number | string
  rej_cost?: number | string
  loss_rs?: number | string
  tls_score?: string
  rework_score?: string
  rej_score?: string
  overall_score?: string
  rating?: string
  status?: string
}

export interface DailyOperatorQualityCards {
  total_issues?: number | string
  closed?: string
  open?: string
  rework_pcs?: string
  rejection_pcs?: string
  factory_grade?: string
  factory_status?: string
  est_loss?: string
}

export interface DailyOperatorQualityAverage {
  total_mistake?: number | string
  elapsed_time?: number | string
  rework?: number | string
  rej?: number | string
  cpm?: number | string
  rework_cost?: number | string
  rej_cost?: number | string
  loss_rs?: number | string
  tls_score?: string
  rework_score?: string
  rej_score?: string
  overall_score?: string
  rating?: string
  status?: string
}

export interface DailyOperatorQualityFactorySummary {
  total_mistakes?: number | string
  total_elapsed_time?: number | string
  total_rework?: number | string
  total_rej?: number | string
  cpm?: number | string
  total_rework_cost?: number | string
  total_rej_cost?: number | string
  total_loss?: number | string
}

export interface DailyOperatorQualityReportData {
  success?: boolean
  report_title?: string
  active_table_used?: string
  cards?: DailyOperatorQualityCards
  rows?: DailyOperatorQualityRow[]
  average?: DailyOperatorQualityAverage
  factory_summary?: DailyOperatorQualityFactorySummary
}

export interface DailyOperatorQualityFlatRow extends DailyOperatorQualityRow {
  _rowId: string
  _rowType: 'data' | 'average' | 'factory_summary'
  _label?: string
}
