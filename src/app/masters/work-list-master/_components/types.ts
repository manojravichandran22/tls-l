export type WorkStatus = 'Active' | 'Inactive'

export interface WorkEntry {
  id: number
  branchName?: string
  branchId?: number | string
  shiftName: string
  shiftId?: number | string
  teamName?: string
  teamId?: number | string
  role: string
  roleId?: number | string
  empId: string
  title: string
  name: string
  lines: string[]
  status: WorkStatus
  startTime?: string
}

export const LINE_COLORS: Record<string, { bg: string; text: string }> = {
  'Line-1': { bg: 'bg-info-bg', text: 'text-chip-blue-text' },
  'Line-2': { bg: 'bg-chip-green-bg', text: 'text-success-text' },
  'Line-3': { bg: 'bg-chip-red-bg', text: 'text-error-text' },
  'Line-4': { bg: 'bg-chip-yellow-bg', text: 'text-chip-yellow-text' },
}

export const lineChip = (line: string): { bg: string; text: string } =>
  LINE_COLORS[line] ?? { bg: 'bg-card-alt', text: 'text-t-body' }
