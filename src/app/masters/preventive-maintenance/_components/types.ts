export interface MachineHistory {
  id: number
  rem_days: number
  machine_no: string
  brand: string
  model_no: string
  machine_type_id: number
  serial_no: string
  last_oil_change: string
  next_maintenance: string
  warranty: number
  condition: number
  option_name: string | null
  branch_id: number | null
  branch_name: string | null
  machine_type_name: string | null
  machine?: { machine_no?: string; brand?: string } | null
  line_id?: number | number[] | null
  line_name?: string | string[] | null
  zone_id?: number | number[] | null
  zone_name?: string | string[] | null
  operation_id?: number | null
  operation_name?: string | null
}

export interface HistoryRecord {
  uuid: string
  machine_id: number
  machine_no?: string | null
  model_no?: string | null
  serial_no?: string | null
  machine: {
    id?: number
    brand?: string
    machine_no?: string
    model_no?: string
    serial_no?: string
    code?: string
    machine_type_id?: number
  } | null
  last_service_date: string | null
  next_service_date: string | null
  notes: string | null
  type: number | null
  priority: number | null
  assigned_to: number | null
  action_plan: string | null
  machine_type_id: number | null
  files: string | null
  status: number
  is_active: number
  created_at: string
  updated_at: string
  createdByUser: { id: number; name: string; emp_code: string | null } | null
  updatedByUser: { id: number; name: string; emp_code: string | null } | null
  created_by_name?: string | null
  updated_by_name?: string | null
  machineType: { id: number; type_name: string } | null
  serviceType: { id: number; type: string; value: string } | null
  priorityInfo: { id: number; type: string; value: string } | null
  assignedUser: { id: number; name: string; emp_code: string | null } | null
  branch_id?: number | null
  branch_name?: string | null
  branch?: { id: number; branch_name?: string; name?: string } | null
  line_id?: number | number[] | null
  line_name?: string | string[] | null
  zone_id?: number | number[] | null
  zone_name?: string | string[] | null
  operation_id?: number | null
  operation_name?: string | null
}

export interface BranchOption {
  id: number
  branch_name: string
}
