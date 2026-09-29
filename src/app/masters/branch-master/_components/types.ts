import { type ValidationRules } from '@/lib/validation'

export interface Branch {
  id: number
  uuid: string
  company_id: number
  branch_name: string
  branch_code: string
  address: string
  status: number
  company?: { id: number; company_name: string; company_code: string }
}

export interface CompanyOption {
  id: number
  company_name: string
}

export type FormField = 'company_id' | 'branch_name' | 'address'
export type FormErrors = Partial<Record<FormField, string>>
export type Touched = Partial<Record<FormField, boolean>>

export const rules: ValidationRules<FormField> = {
  company_id: { required: 'Company is required' },
  branch_name: {
    required: 'Branch name is required',
    minLength: { value: 2, message: 'Minimum 2 characters' },
    maxLength: { value: 100, message: 'Maximum 100 characters' },
  },
  address: {
    required: 'Address is required',
    minLength: { value: 3, message: 'Minimum 3 characters' },
  },
}
