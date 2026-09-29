import { type ValidationRules } from '@/lib/validation'

export interface Slot {
  id?: number
  slot_name: string
  start: string
  end: string
}

export interface Line {
  id: number
  uuid: string
  zone_id: number
  branch_id: number
  line_name: string
  status: number
  slots: Slot[]
  zone?: {
    id: number
    zone_name: string
    zone_code: string
    company_id: number
    company?: { id: number; company_name: string; company_code: string }
    branch?: { id: number; branch_name: string; branch_code: string }
  }
  branch?: { id: number; branch_name: string; branch_code: string }
}

export interface CompanyOption {
  id: number
  company_name: string
  max_slot?: number
}

export interface BranchOption {
  id: number
  company_id?: number
  branch_name: string
}

export interface ZoneOption {
  id: number
  company_id?: number
  branch_id?: number
  zone_name: string
}

export interface FormSlot {
  slot_name: string
  start_time: string
  end_time: string
  _key?: string
}

export interface FormErrors {
  company_id?: string
  branch_id?: string
  zone_id?: string
  line_name?: string
  slots?: string
}

export type FormField = 'company_id' | 'branch_id' | 'zone_id' | 'line_name'
export type Touched = Partial<Record<FormField, boolean>>

export const formRules: ValidationRules<FormField> = {
  company_id: { required: 'Company is required' },
  branch_id: { required: 'Branch is required' },
  zone_id: { required: 'Zone is required' },
  line_name: {
    required: 'Line name is required',
    minLength: { value: 2, message: 'Minimum 2 characters' },
    maxLength: { value: 50, message: 'Maximum 50 characters' },
  },
}