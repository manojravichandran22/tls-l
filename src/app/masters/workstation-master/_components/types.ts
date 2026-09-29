import { type ValidationRules } from '@/lib/validation'

export interface Workstation {
  id: number
  uuid: string
  name: string
  code: string
  line_id: number
  branch_id: number
  qr_code: string
  status: number
  is_active: number
  line?: { id: number; line_name: string }
  branch?: { id: number; branch_name: string; branch_code: string }
}

export interface BranchOption {
  id: number
  branch_name: string
}

export interface LineOption {
  id: number
  line_name: string
  branch_id?: number
}

export type FormField = 'name' | 'line_id' | 'branch_id' | 'qr_code'
export type FormErrors = Partial<Record<FormField, string>>
export type Touched = Partial<Record<FormField, boolean>>

export const rules: ValidationRules<FormField> = {
  name: {
    required: 'Workstation name is required',
    minLength: { value: 2, message: 'Minimum 2 characters' },
    maxLength: { value: 100, message: 'Maximum 100 characters' },
  },
  branch_id: { required: 'Branch is required' },
  line_id: { required: 'Line is required' },
  qr_code: { required: 'QR Code is required' },
}