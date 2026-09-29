import type { ValidationRules } from '@/lib/validation'

export interface Role {
  id: number
  uuid: string
  name: string
  short_name: string
  role: number
  status: number
  is_active: number
  branch_id?: number
  branch_name?: string
  branch?: {
    id: number
    branch_name?: string
    name?: string
    branch_code?: string
  }
}

export type FormField = 'name' | 'short_name' | 'role' | 'branch_id'
export type FormErrors = Partial<Record<FormField, string>>
export type Touched = Partial<Record<FormField, boolean>>

export const rules: ValidationRules<FormField> = {
  name: {
    required: 'Role name is required',
    minLength: { value: 2, message: 'Minimum 2 characters' },
    maxLength: { value: 50, message: 'Maximum 50 characters' },
  },
  short_name: {
    required: 'Short name is required',
    minLength: { value: 2, message: 'Minimum 2 characters' },
    maxLength: { value: 20, message: 'Maximum 20 characters' },
  },
}