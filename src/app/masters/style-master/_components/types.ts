import { type ValidationRules } from '@/lib/validation'

export interface Style {
  id: number
  uuid: string
  buyer: string
  style_no: string
  style_name: string
  status: number
  is_active: number
  created_at: string
  updated_at: string
  createdByUser?: { id: number; name: string; emp_code: string }
  updatedByUser?: { id: number; name: string; emp_code: string } | null
  sam?: number
  target_hun_hr?: number
  target_six_hr?: number
  req_manning?: number
  all_manning?: number
  operation_bulletin_id?: number | null
}

export interface OBOption {
  id: number
  uuid?: string
  total_sam?: number
  req_manning?: number
  style_id?: number | null
  created_at?: string
}

export type FormField = 'buyer' | 'style_name' | 'style_no' | 'operation_bulletin_id'
export type FormErrors = Partial<Record<FormField, string>>
export type Touched   = Partial<Record<FormField, boolean>>

export const rules: ValidationRules<FormField> = {
  buyer:      { required: 'Buyer is required' },
  style_name: { required: 'Style name is required', minLength: { value: 2, message: 'Minimum 2 characters' } },
  style_no:   {},
  operation_bulletin_id: {},
}
