import { type ValidationRules } from '@/lib/validation'

export interface OptionBranch {
  id: number
  branch_name: string
  branch_code?: string
}

export interface OptionRecord {
  id: number
  uuid: string
  module: string
  type: string
  value: string
  status: number
  is_active: number
  branch_id?: number | string
  branch?: OptionBranch
  created_at?: string
  updated_at?: string
}

export type FormField = 'module' | 'type' | 'value' | 'branch_id'
export type FormErrors = Partial<Record<FormField, string>>
export type Touched = Partial<Record<FormField, boolean>>

export const rules: ValidationRules<FormField> = {
  module: { required: 'Module is required' },
  type: { required: 'Option type is required' },
  value: { required: 'Value is required' },
  branch_id: { required: 'Branch is required' },
}
