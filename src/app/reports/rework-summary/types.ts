export interface ReworkSummaryRecord {
  id?: string | number
  uuid?: string
  rework_id?: string | number
  rejection_id?: string | number
  branch_id?: string | number
  branch_name?: string
  shift_id?: string | number
  team_id?: string | number
  team_name?: string
  slot_id?: string | number
  line_id?: string | number
  order_id?: string | number
  style_id?: string | number
  color_id?: string | number
  machine_id?: string | number
  machine_no?: string
  tls_id?: string | number
  qr_id?: string | number
  qr_code?: string
  qr_details?: string
  size?: string
  category_id?: string | number
  defect_id?: string | number
  severity_id?: string | number
  qty?: string | number
  category_name?: string
  defect_name?: string
  severity_name?: string
  selected_cap?: string | null
  is_assign_auto?: string | number
  is_assign_manual?: string | number
  emp_id?: string | number
  employee_code?: string
  operation_id?: string | number
  operation_name?: string
  machine_type_id?: string | number
  machine_type_name?: string
  machine_type?: string
  employee_name?: string
  is_escalate?: string | number
  notes?: string
  work_audit_by?: string | null
  work_audit_at?: string | null
  status?: string | number
  status_name?: string
  is_active?: string | number
  is_completed?: string | number
  created_by?: string | number
  updated_by?: string | number
  created_at?: string
  updated_at?: string
  date?: string
  order_code?: string
  order_no?: string
  colour?: string
  buyer?: string
  style_name?: string
  style_no?: string
  name?: string
  line_name?: string
  zone_name?: string
  slot_name?: string
  shift_name?: string
  tracker_work_audit_at?: string | null
  tracker_work_audit_by?: string | null
  tracker_elapsed_time?: string | number | null
  tracker_confirmation_time?: string | null
  line_qc?: string | null
  line_qc_id?: string | number | null
  tracker_confirmed_by_name?: string | null
  wip?: number
}

export type ReworkCostRecord = ReworkSummaryRecord
