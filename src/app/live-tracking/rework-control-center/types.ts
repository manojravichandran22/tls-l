export interface ReworkRecord {
  id?: string | number
  uuid?: string
  rework_id?: string | number
  shift?: string
  shift_name?: string
  zone?: string
  zone_name?: string
  line_no?: string
  line_name?: string
  order_no?: string
  colour?: string
  color_id?: string
  size?: string
  employee_name?: string
  employee_id_no?: string
  employee_id?: string
  emp_id?: string | number
  EmpId?: string | number | null
  Empname?: string | null
  machine_type?: string
  machine_type_name?: string
  machine_id?: string | number
  operation?: string
  operation_name?: string
  defect_category?: string
  category_name?: string
  severity?: string
  severity_name?: string
  defect_found?: string
  defect_name?: string
  defect_qty?: number | string
  qty?: number | string
  line_qc?: string | null
  line_qc_id?: string | number | null
  audit_time?: string | null
  work_audit_at?: string | null
  tracker_work_audit_at?: string | null
  elapsed_time_in_minutes?: number | string | null
  elapsed_mins?: number | string | null
  tracker_elapsed_time?: number | string | null
  confirmed_by?: string | null
  confirmed_by_id?: string | number | null
  tracker_confirmed_by_name?: string | null
  confirmation_time?: string | null
  tracker_confirmation_time?: string | null
  status?: string | number
  notes?: string
  created_at?: string
  updated_at?: string
  date?: string
}
