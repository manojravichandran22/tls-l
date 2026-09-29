import { type ValidationRules } from '@/lib/validation'

export interface Team {
  id: number
  uuid: string
  team_name: string
  code: string
  status: number
  is_active: number
  created_by: number
  updated_by: number | null
  createdAt: string
  updatedAt: string
  shifts?: unknown[]
  branch_id?: number
  branch?: {
    id: number
    branch_name: string
  }
}

export type FormField = 'team_name' | 'branch_id'
export type FormErrors = Partial<Record<FormField, string>>
export type Touched = Partial<Record<FormField, boolean>>

export const rules: ValidationRules<FormField> = {
  team_name: {
    required: 'Team name is required',
    minLength: { value: 2, message: 'Minimum 2 characters' },
    maxLength: { value: 50, message: 'Team name cannot exceed 50 characters' },
  },
  branch_id: {
    required: 'Branch is required',
  },
}
