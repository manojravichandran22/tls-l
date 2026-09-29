export interface StyleSummaryBranch {
  id: number
  branch_name: string
}

export interface StyleSummary {
  uuid: string
  style_id: number
  buyer: string
  style_no: string
  style_name: string
  total_sam: number
  req_manning: number
  allocated_manning: number
  req_target_hun_hr: number | null
  req_target_hun_day: number | null
  req_target_six_hr: number | null
  req_target_six_day: number | null
  all_target_hun_hr: number | null
  all_target_hun_day: number | null
  all_target_six_hr: number | null
  all_target_six_day: number | null
  branch?: StyleSummaryBranch | null
}
