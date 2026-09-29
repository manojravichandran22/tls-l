export interface ReworkCostRecord {
  shift_allocation_id?: number | string
  branch_id?: number | string
  shift_name?: string
  team_id?: number | string
  team_name?: string
  branch_name?: string
  line_id?: number | string
  line_name?: string
  defect_id?: number | string
  defect_category?: string
  defect_name?: string
  severity?: string
  no_of_pcs?: number
  time_taken?: number
  cost_per_min?: number
  loss?: number
  from_date?: string
  to_date?: string
  contribution_pct?: string
}

export interface ReworkCostSummary {
  total_pieces?: number
  minor_pcs?: number
  major_pcs?: number
  est_loss?: number
}
