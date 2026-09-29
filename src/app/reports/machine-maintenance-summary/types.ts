export interface MaintenanceHistoryRecord {
  id: number
  uuid?: string
  machine_id?: number
  branch_id?: number
  machine_no?: string
  brand?: string
  model_no?: string
  branch_name?: string
  machine_type_name?: string
  status?: number | string
  created_at?: string
  date?: string
  last_service_date?: string
  next_service_date?: string
}
