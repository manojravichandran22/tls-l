export interface DailyMachineDowntimeRecord {
  s_no?: number
  shift_allocation_id?: number | string | null
  shift_name?: string | null
  shift_allocation_name?: string | null
  team_id?: number | string | null
  team_name?: string | null
  branch_id?: number | string | null
  branch_name?: string | null
  zone_id?: number | string | null
  zone_name?: string | null
  line_id?: number | string | null
  line_name?: string | null
  order_id?: number | string | null
  order_no?: string | null
  colour?: string | null
  color?: string | null
  style_id?: number | string | null
  style_name?: string | null
  style_no?: string | null
  buyer_name?: string | null
  machine_id?: number | string | null
  machine_no?: string | null
  machine_name?: string | null
  machine_type_name?: string | null
  mechanic_id?: number | string | null
  mechanic_code?: string | null
  mechanic_name?: string | null
  mechanic_no?: string | null
  category_id?: number | string | null
  category_name?: string | null
  defect_id?: number | string | null
  defect_name?: string | null
  severity_id?: number | string | null
  severity_name?: string | null
  audit_id?: string | null
  audit_name?: string | null
  auditor_id?: string | null
  auditor_name?: string | null
  employee_id?: string | null
  employee_name?: string | null
  emp_id?: string | null
  emp_name?: string | null
  operator_id?: string | null
  operator_name?: string | null
  audit_time?: string | null
  proaudit_uuid?: string | null
  elapsed_time?: number
  cost_per_min?: number
  loss?: number
  total_loss?: number
}

export interface DailyMachineDowntimeSummary {
  total_records?: number
  total_downtime?: number
  avg_downtime?: number
  avg_cost_per_min?: number
  total_loss?: number
}
