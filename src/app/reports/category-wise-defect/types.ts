export interface CategoryWiseDefectRecord {
  s_no?: number
  branch_id?: number | string | null
  branch_name?: string | null
  shift_id?: number | string | null
  shift?: string | null
  team_id?: number | string | null
  team?: string | null
  zone_id?: number | string | null
  zone?: string | null
  line_id?: number | string | null
  line_no?: string | null
  order_id?: number | string | null
  order_name?: string | null
  order_no?: string | null
  output?: number | string
  rejection?: number | string
  eff_pct?: number | string
  category_id?: number | string
  defect_id?: number | string
  defect_category?: string
  defect?: string
  severity?: string
  defect_qty?: number | string
  defect_pct?: string
  cost_per_piece?: number | string
  loss?: number | string
}

export interface CategoryWiseDefectSummary {
  total_output?: number
  total_defects?: number
  total_rejections?: number
  overall_defect_pct?: string
  'overall defect pct'?: string
  avg_cost_per_piece?: number | string
  'avg cost per piece'?: number | string
  estimated_loss?: number
}

export interface FilterItem {
  id: number
  name: string
  branch_id?: number
  zone_id?: number
  category_id?: number
  severity_id?: number
}

export interface CategoryWiseDefectFilterMetadata {
  branches: FilterItem[]
  teams: FilterItem[]
  shifts: FilterItem[]
  zones: FilterItem[]
  lines: FilterItem[]
  defect_categories: FilterItem[]
  severities: FilterItem[]
  defects: FilterItem[]
}
