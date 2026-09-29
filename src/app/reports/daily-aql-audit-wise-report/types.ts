export interface AqlAuditDefectItem {
  id: string | number
  uuid?: string
  aql_audit_id?: string | number
  category_id?: string | number
  category_name?: string
  defect_id?: string | number
  defect_name?: string
  severity_id?: string | number
  severity_name?: string
  qty?: number
  defect_qty?: number
  defect_item_qty?: number
  defect_percentage?: string | number
  defect_percent?: string | number
  defect_pct?: string | number
  percentage?: string | number
  pct?: string | number
  created_at?: string
  updated_at?: string
}

export interface AqlAuditRecord {
  id: string | number
  uuid?: string
  audit_no?: string
  aql_code?: string
  table_name?: string
  line_id?: string | number
  line_name?: string
  order_id?: string | number
  order_no?: string
  style_id?: string | number
  style_name?: string
  style_no?: string
  buyer?: string
  colour?: string
  colour_id?: string | number | null
  branch_id?: string | number
  branch_name?: string
  shift_id?: string | number
  shift_name?: string
  team_id?: string | number
  team_name?: string
  zone_id?: string | number
  zone_name?: string
  slot_id?: string | number
  inspection_level?: string
  inspection_level_id?: string | number
  aql_level_major?: string | number
  allowed_major_defects?: string | number
  aql_level_minor?: string | number
  allowed_minor_defects?: string | number
  aql_level_critical?: string | number
  allowed_critical_defects?: string | number
  size?: string
  size_id?: string | number
  inspection_qty?: string | number
  sample_size?: string | number
  total_defect?: string | number
  major_defect?: string | number
  minor_defect?: string | number
  critical_defect?: string | number
  aql_result?: number | string
  aql_status?: string
  defect_count?: number
  defect_percentage?: string | number
  defect_percent?: string | number
  defect_pct?: string | number
  defects?: AqlAuditDefectItem[]
  audit_by?: string
  auditor_name?: string
  auditor_code?: string
  notes?: string
  audit_at?: string
  audit_date?: string
  created_by?: string
  updated_by?: string
  created_at?: string
  updated_at?: string
  s_no?: number | string
  sno?: number | string
}

export interface AqlAuditRowItem extends AqlAuditRecord {
  _rowKey: string
  auditIndex: number
  defectIndex: number
  defectCount: number
  isFirstDefect: boolean
  defect_category_name?: string
  defect_item_name?: string
  defect_severity_name?: string
  defect_item_qty?: number
  defect_item_pct?: string
}

export interface AqlAuditReportResponseData {
  current_shift_allocation?: any[]
  total_inspected_qty?: number
  total_pass_qty?: number
  total_fail_qty?: number
  total_defects?: number
  defect_percentage?: string
  pass_percentage?: string
  fail_percentage?: string
  total_sample_size?: number
  total_allowed_major?: number
  total_allowed_minor?: number
  total_major_defects?: number
  total_minor_defects?: number
  records?: AqlAuditRecord[]
  summary?: any
}
