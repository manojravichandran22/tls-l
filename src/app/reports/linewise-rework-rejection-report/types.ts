export interface LineItem {
  id: number | string
  name: string
  code?: string
}

export interface DefectRow {
  category_id?: number | string
  category: string
  defect_id?: number | string
  defect: string
  shift_allocation_id?: number | null
  branch_id?: number | null
  branch_name?: string | null
  shift_id?: number | null
  shift_name?: string | null
  team_id?: number | null
  team_name?: string | null
  total: number
  category_overall_total?: number
  category_line_total?: Record<string, number>
  category_line_overall_percentage?: Record<string, number>
  defect_overall_total?: number
  [key: string]: any
}

export interface DefectGroup {
  category: string
  category_id?: number | string
  rows: DefectRow[]
  total: number
  line_totals?: Record<string, number>
  percentage?: Record<string, number>
  overall_percentage?: number
}

export interface ReportSectionData {
  section?: string
  total_records?: number
  overall_total?: number
  overall_percentage?: number
  line_overall_total?: Record<string, number>
  line_overall_percentage?: Record<string, number>
  defect_overall_total?: Record<string, number>
  category_overall_total?: Record<string, number>
  checked_pieces_per_line?: number
  total_checked_pieces?: number
  lines?: LineItem[]
  rows?: DefectRow[]
  groups?: DefectGroup[]
}

export interface LinewiseReportSummary {
  total_rework?: number
  rework_percentage?: number
  total_rejection?: number
  rejection_percentage?: number
  total_defects?: number
  dhu_percentage?: number
  total_mistakes?: number
  checked_pieces_per_line?: number
  total_checked_pieces?: number
}

export interface AqlLineItem {
  id?: number | string
  name?: string
  aql_pass_qty?: number
  aql_fail_qty?: number
  aql_pass_percentage?: number
  inspection_qty?: number
  checked_qty?: number
  rejection_qty?: number
  [key: string]: any
}

export interface AqlSectionData {
  aql_pass_total?: number
  aql_fail_total?: number
  aql_pass_percentage?: number
  inspection_qty?: number
  checked_qty?: number
  total_checked_qty?: number
  lines?: AqlLineItem[]
  [key: string]: any
}

export interface LinewiseReportData {
  date?: string
  checked_pieces?: number
  checked_qty?: number
  total_checked_pieces?: number
  total_checked_qty?: number
  aql?: AqlSectionData
  current_shift?: any
  rework?: ReportSectionData
  rejection?: ReportSectionData
  total_defects?: number
  dhu_percentage?: number
  line_total_defects?: Record<string, number>
  line_dhu_percentage?: Record<string, number>
  summary?: LinewiseReportSummary
}
