export interface CapItem {
  id: number | null
  cap_name?: string
  short_name?: string
}

export interface TlsIssueRecord {
  id: number | string
  uuid?: string
  qc_audit_id?: number | string
  order_id?: number | string
  operation_id?: number | string
  style_id?: number | string
  color_id?: string
  present_color?: string
  hex_code?: string
  color_name?: string
  buyer?: string
  operator_code?: string
  line_id?: number | string
  machine_id?: number | string
  tls_id?: number | string
  operator_id?: number | string | null
  defect_id?: number | string
  defect_name?: string
  category_id?: number | string
  category_name?: string
  severity_id?: number | string
  severity_name?: string
  branch_id?: number | string
  team_id?: number | string
  shift_id?: number | string
  slot_id?: number | string
  slot_name?: string
  zone_id?: number | string
  zone?: string
  zone_name?: string
  branch_name?: string
  team_name?: string
  shift_name?: string
  line_name?: string
  order_code?: string
  order_no?: string
  style_no?: string
  style_name?: string
  operation_name?: string
  machine_no?: string
  machine_type?: string
  machine_type_name?: string
  tls_name?: string
  operator_name?: string
  cap?: string | CapItem[]
  selected_cap?: string | CapItem[]
  work_cat_id?: string | number
  work_cat_name?: string
  workcategory_name?: string
  work_cat_emp_id?: string
  work_category_empcode?: string
  work_cat_emp_name?: string
  work_category_empname?: string
  work_audit_by?: string | number
  work_audit_at?: string
  scan_time?: string
  line_qc_name?: string
  qc_emp_name?: string
  line_qc_id?: string | number
  qc_emp_code?: string
  close_without_cap?: boolean
  reason_for_closure?: string | null
  comments?: string | null
  notes?: string | null
  response_time?: number
  elapsed_time?: number
  size?: string
  qty?: number | string
  defect_qty?: number | string
  tls_status_color?: string
  tls_status_hexcode?: string
  update_tls_status_color?: string | null
  update_tls_status_hexcode?: string | null
  is_escalate?: boolean | null
  issue_status?: string
  qc_status?: string
  issue_color?: string
  qc_color?: string
  status?: string | number
  is_active?: number | string
  is_completed?: number | string
  created_by?: string | number
  updated_by?: string | number
  created_at?: string
  updated_at?: string
  proaudit_uuid?: string
  [key: string]: unknown
}
