export interface KpiMasterItem {
  id: string | number
  branch_id?: string | number | null
  branch_name?: string | null
  module?: string | null
  score: string
  condition?: string | null
  threshold: string | number
  unit?: string | null
  created_at?: string | null
  updated_at?: string | null
  [key: string]: any
}

export type KpiMasterSections = Record<string, KpiMasterItem[]>

export interface UpdateKpiPayload {
  id: string | number
  threshold: string | number
}

export interface KpiHistoryRecord {
  id: string | number
  branch_id?: string | number | null
  branch_name?: string | null
  module?: string | null
  score?: string | null
  kpi_name?: string | null
  condition?: string | null
  threshold?: string | number | null
  previous_threshold?: string | number | null
  new_threshold?: string | number | null
  old_threshold?: string | number | null
  unit?: string | null
  created_at?: string | null
  updated_at?: string | null
  created_by?: string | null
  updated_by?: string | null
  user_name?: string | null
  [key: string]: any
}
