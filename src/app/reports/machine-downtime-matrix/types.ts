export interface MachineDowntimeMatrixRecord {
  sno: number
  machine_id: number
  machine_no: string
  last_svd: string
  next_svd: string
  downtime_min: number
  cost_per_min: number
  total_loss: number
  rating: string
  status: string
  defects: Record<string, number>
}

export interface MachineDowntimeMatrixSummary {
  average_downtime: string
  total_downtime: string
  factory_machine_rating: string
  factory_machine_status: string
  cost_per_minute: number
  est_loss: string
}

export interface MachineDowntimeMatrixDefectCategories {
  minor: string[]
  major: string[]
  critical: string[]
}

export interface MachineDowntimeMatrixColumnTotals {
  downtime_min: number
  cost_per_min: number
  total_loss: number
  defects: Record<string, number>
}

export interface MachineDowntimeMatrixColumnAverages {
  downtime_min: number
  cost_per_min: number
  total_loss: number
  defects: Record<string, number>
}

export interface MachineDowntimeMatrixData {
  summary: MachineDowntimeMatrixSummary
  defect_categories: MachineDowntimeMatrixDefectCategories
  all_defect_columns: string[]
  records: MachineDowntimeMatrixRecord[]
  column_totals: MachineDowntimeMatrixColumnTotals
  column_averages: MachineDowntimeMatrixColumnAverages
  total: number
}
