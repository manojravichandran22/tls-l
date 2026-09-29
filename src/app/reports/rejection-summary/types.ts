export interface RejectionSummaryRecord {
  id?: string | number
  uuid?: string
  rejection_id?: string | number
  rejection_code?: string
  rework_id?: string | number
  branch_id?: string | number
  branch_name?: string
  shift_id?: string | number
  shift_name?: string
  team_id?: string | number
  team_name?: string
  slot_id?: string | number
  slot_name?: string
  line_id?: string | number
  line_name?: string
  order_id?: string | number
  order_no?: string
  order_code?: string
  operation_id?: string | number
  operation_name?: string
  style_id?: string | number
  style_name?: string
  style_no?: string
  color_id?: string
  colour?: string
  machine_id?: string | number
  machine_no?: string | number
  machine_type_id?: string | number
  tls_id?: string | number
  size?: string
  category_id?: string | number
  category_name?: string
  defect_id?: string | number
  defect_name?: string
  severity_id?: string | number
  severity_name?: string
  qty?: string | number
  selected_cap?: string | null
  is_assign_auto?: string | number
  is_assign_manual?: string | number
  emp_id?: string | number
  name?: string
  employee_name?: string
  machine_type_name?: string
  machine_type?: string
  is_escalate?: string | number
  notes?: string
  work_audit_by?: string | null
  work_audit_at?: string | null
  status?: string | number
  is_active?: string | number
  is_completed?: string | number
  created_by?: string | number
  updated_by?: string | number
  created_at?: string
  updated_at?: string
  qr_id?: number | string
  qr_code?: string
  qr_details?: string
  date?: string
  zone_name?: string
  line_qc?: string | null
  line_qc_id?: string | number | null
  tracker_work_audit_at?: string | null
  tracker_work_audit_by?: string | null
  tracker_elapsed_time?: string | number | null
  tracker_confirmation_time?: string | null
  tracker_confirmed_by_name?: string | null
}

export type RejectionCostRecord = RejectionSummaryRecord
