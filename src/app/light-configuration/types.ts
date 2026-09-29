export interface TlsAuditLightConfigItem {
  id: string | number
  branch_id?: string | number | null
  branch_name?: string | null
  module?: string
  present_light?: string
  audit_status?: string | null
  defect_type?: string | null
  condition_operator?: string | null
  defect_qty?: string | number | null
  rule_description?: string
  updated_light?: string
  created_at?: string
  updated_at?: string
}

export interface UpdateLightConfigPayload {
  id: string | number
  branch_id?: string | number | null
  defect_qty?: string | number | null
  updated_light?: string
}

export interface LightConfigHistoryRecord {
  id: string | number
  configuration_id?: string | number | null
  branch_id?: string | number | null
  branch_name?: string | null
  module?: string
  present_light?: string
  audit_status?: string | null
  defect_type?: string | null
  condition_operator?: string | null
  defect_qty?: string | number | null
  rule_description?: string
  updated_light?: string
  created_at?: string
  updated_at?: string
}
