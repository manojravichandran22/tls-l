import { type ValidationRules } from '@/lib/validation'

export interface Shift {
  id: number
  uuid: string
  shift_name: string
  type: string
  start: string
  end: string
  start_time?: string
  end_time?: string
  hrs: string | number
  break?: string | number
  breakMins?: string | number
  start_buffer_time: string
  end_buffer_time: string
  branch_id: number
  zone_id: number | number[]
  team_id?: number | string
  shift_id?: number | string
  lunch_start: string
  lunch_end: string
  mrg_break_start: string
  mrg_break_end: string
  evg_break_start: string
  evg_break_end: string
  date?: string
  from_date?: string
  to_date?: string
  status: number
  is_active: number
  branch?: { id: number; branch_name: string }
  zone?: { id: number; zone_name: string }
}

export interface BranchOption { id: number; branch_name: string }
export interface ZoneOption { id: number; zone_name: string; branch_id?: number }
export interface TeamOption { id: number; team_name: string; code?: string }

export type FormField =
  | 'shift_name' | 'type' | 'start_time' | 'end_time' | 'hrs' | 'breakMins' | 'branch_id' | 'zone_id' | 'team_id'
  | 'start_buffer_time' | 'end_buffer_time'
  | 'lunch_start' | 'lunch_end'
  | 'mrg_break_start' | 'mrg_break_end'
  | 'evg_break_start' | 'evg_break_end'
export type FormErrors = Partial<Record<string, string>>
export type Touched = Partial<Record<FormField, boolean>>

export const rules: ValidationRules<FormField> = {
  shift_name: { required: 'Shift name is required', minLength: { value: 2, message: 'Minimum 2 characters' } },
  type: { required: 'Type is required' },
  start_time: { required: 'Start time is required' },
  end_time: { required: 'End time is required' },
  hrs: { required: 'Hours is required' },
  breakMins: { required: 'Break minutes is required' },
  branch_id: { required: 'Branch is required' },
  // zone_id: { required: 'Zone is required' },
  start_buffer_time: { required: 'Buffer login is required' },
  end_buffer_time: { required: 'Buffer logout is required' },
  // lunch_start: { required: 'Lunch start is required' },
  // lunch_end: { required: 'Lunch end is required' },
  // mrg_break_start: { required: 'Morning break start is required' },
  // mrg_break_end: { required: 'Morning break end is required' },
  // evg_break_start: { required: 'Evening break start is required' },
  // evg_break_end: { required: 'Evening break end is required' },
}

export const SHIFT_TYPES = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'night', label: 'Night' },
]