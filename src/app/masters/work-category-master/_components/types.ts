import { type ValidationRules } from '@/lib/validation'

export interface WorkCategory {
  id: number
  uuid: string
  name: string
  code: string
  dept_id: number
  desig_id: number
  branch_id?: number
  branch_name?: string
  status: number
  is_active: number
  department?: { id: number; name: string }
  designation?: { id: number; name: string }
  branch?: { id: number; branch_name?: string; name?: string; branch_code?: string }
}

export interface DepartmentOption {
  id: number
  name: string
}

export interface DesignationOption {
  id: number
  designation_name: string
  name?: string
  dept_id?: number
}

export interface BranchOption {
  id: number
  branch_name: string
}

export type FormField = 'name' | 'dept_id' | 'branch_id'
export type FormErrors = Partial<Record<FormField, string>>
export type Touched = Partial<Record<FormField, boolean>>

export const rules: ValidationRules<FormField> = {
  name: {
    required: 'Work category name is required',
    minLength: { value: 2, message: 'Minimum 2 characters' },
    maxLength: { value: 100, message: 'Maximum 100 characters' },
  },
  dept_id: { required: 'Department is required' },
}

