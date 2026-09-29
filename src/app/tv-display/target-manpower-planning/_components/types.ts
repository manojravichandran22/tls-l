export interface ManpowerLineInput {
  zone_id: number
  zone_name?: string
  line_id: number
  line_name?: string
  sam: number
  working_hours: number
  working_minutes: number
  direct_manpower: number
  target_efficiency: number
  target_pcs: number
  _key?: string
}

export interface OverallTotal {
  direct_manpower: number
  target_efficiency: number
  target_pcs: number
}

export interface ManpowerPlanningCreatePayload {
  branch_id: number
  shift_id: number
  lines: ManpowerLineInput[]
  overall_total: OverallTotal
}

export interface ManpowerPlanningItem {
  id: number
  uuid?: string
  planning_date?: string
  branch_id?: number
  branch_name?: string
  shift_id?: number
  shift_name?: string
  team_id?: number
  team_name?: string
  direct_manpower?: number
  target_efficiency?: number
  target_pcs?: number
  working_hours?: number
  working_minutes?: number
  sam?: number
  status?: string | number
  is_active?: number
  lines?: ManpowerLineInput[]
  overall_total?: OverallTotal
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface LineOptionApi {
  line_id: number
  line_name: string
}

export interface ZoneOptionApi {
  zone_id: number
  zone_name: string
  lines?: LineOptionApi[]
}

export interface TeamZoneApiResponse {
  team_id: number
  team_name: string
  zones?: ZoneOptionApi[]
  [key: string]: unknown
}
