import { type ValidationRules } from '@/lib/validation'

export interface Zone {
  id: number
  company_id: number
  branch_id: number
  zone_name: string
  zone_code: string
  status: number
  company?: { id: number; company_name: string; company_code: string }
  branch?: { id: number; branch_name: string; branch_code: string }
  uuid: string
}

export interface CompanyOption {
  id: number
  company_name: string
}

export interface BranchOption {
  id: number
  company_id?: number
  branch_name: string
}

export type FormField = 'company_id' | 'branch_id' | 'zone_name'
export type FormErrors = Partial<Record<FormField, string>>
export type Touched = Partial<Record<FormField, boolean>>

export const rules: ValidationRules<FormField> = {
  company_id: { required: 'Company is required' },
  branch_id: { required: 'Branch is required' },
  zone_name: {
    required: 'Zone name is required',
    minLength: { value: 2, message: 'Minimum 2 characters' },
    maxLength: { value: 50, message: 'Maximum 50 characters' },
    pattern: { value: /^[a-zA-Z0-9\s\-]+$/, message: 'Invalid Zone Name. It must contain only alphabets and numbers' },
  },
}
