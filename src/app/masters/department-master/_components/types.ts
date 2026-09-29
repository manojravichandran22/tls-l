import type { ValidationRules } from '@/lib/validation'

export interface Department {
  id: number
  uuid: string
  name: string
  dept_code: string
  branch_id: number
  branch_name?: string
  status: number
  is_active: number
  branch?: { id: number; branch_name: string; branch_code: string }
}

export interface BranchOption {
  id: number
  branch_name: string
}

export type FormField = 'name' | 'branch_id'
export type FormErrors = Partial<Record<FormField, string>>
export type Touched = Partial<Record<FormField, boolean>>

export const rules: ValidationRules<FormField> = {
  name: {
    required: 'Department name is required',
    minLength: { value: 2, message: 'Minimum 1 characters' },
    maxLength: { value: 50, message: 'Maximum 50 characters' },
  },
  branch_id: {
    required: 'Branch is required',
  },
}