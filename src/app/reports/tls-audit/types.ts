export interface TlsAuditRecord {
  order_no?: string
  colour?: string
  order_id?: string | number
  style_name?: string
  style_number?: string
  style_id?: string | number
  op_id?: string
  operation?: string
  operation_id?: string | number
  machine_no?: string
  machine_id?: string | number
  mc_type?: string
  slot?: string | null
  slot_id?: string | null
  color_id?: string
  line_id?: string | number
  line_name?: string
  operator_id?: string | number | null
  operator_name?: string | null
  operator_code?: string | null
  shift_id?: string | number
  shift_name?: string
  team_id?: string | number
  team_name?: string
  branch_id?: string | number
  branch_name?: string
  branch?: string
  qc_audit_id?: string | number
  zone_id?: string | number
  zone_name?: string
  category_id?: string | number
  category_name?: string
  defect_id?: string | number
  defect_name?: string
  qty_id?: number
  severity_id?: string | number
  severity_name?: string
  tls_color?: string
  light_color?: string | null
  light_hexcode?: string | null
  defect?: string
  spi_count?: number | null
  quality_check?: string | null
  audit_obs?: string | null
  create_at?: string
  qc_create_by?: string | number
  qc_id?: string
  qc_name?: string
  qc_user_name?: string
  audit_time?: string
  assigned_to?: string | number | null
  elapsed_time?: string | null
  tls_issue_status?: string | number | null
  tls_issue_status_name?: string | null
  cap?: string | null
  cap_by?: string | null
  cap_by_name?: string | null
  cap_by_id?: string | null
  cap_time?: string | null
  after_cap?: string | null
  after_cap_light_color?: string | null
  after_cap_light_hexcode?: string | null
  rev_by?: string | number | null
  rev_by_name?: string | null
  rev_id?: string | null
  rev_time?: string | null
  qc_verification_status?: string | number | null
  qc_verification_status_name?: string | null
  defects?: any[]
  _auditRowSpan?: number
  _isFirstInAudit?: boolean
  _auditIndex?: number
  _groupKey?: string
  [key: string]: any
}

export interface TlsAuditMeta {
  total: number
  page: number
  limit: number
  total_pages: number
}
