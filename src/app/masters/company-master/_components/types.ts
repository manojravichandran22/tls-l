import { type ValidationRules } from '@/lib/validation'

export interface Company {
  id: number
  uuid: string
  company_name: string
  company_code?: string
  address: string
  location: { lat: number; lng: number }
  company_type: string
  max_slot: number
  status: number
}

export type FormField = 'company_name' | 'address' | 'lat' | 'lng' | 'company_type' | 'max_slot'
export type FormErrors = Partial<Record<FormField, string>>
export type Touched = Partial<Record<FormField, boolean>>

export const COMPANY_TYPE_OPTIONS = [
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Service', label: 'Service' },
  { value: 'Trading', label: 'Trading' },
  { value: 'Other', label: 'Other' },
]

export const rules: ValidationRules<FormField> = {
  company_name: {
    required: 'Company name is required',
    minLength: { value: 2, message: 'Minimum 2 characters' },
    maxLength: { value: 100, message: 'Maximum 100 characters' },
  },
  address: {
    required: 'Address is required',
    minLength: { value: 3, message: 'Minimum 3 characters' },
    maxLength: { value: 300, message: 'Maximum 300 characters' },
  },
  company_type: {
    required: 'Company type is required',
  },
  max_slot: {
    required: 'Max slot is required',
    min: { value: 1, message: 'Minimum value is 1' },
    max: { value: 50, message: 'Maximum value is 50' },
  },
  lat: {
    required: 'Latitude is required',
    pattern: { value: /^-?\d+(\.\d+)?$/, message: 'Please enter a valid Latitude' },
    min: { value: -90, message: 'Latitude must be between -90 and 90' },
    max: { value: 90, message: 'Latitude must be between -90 and 90' },
  },
  lng: {
    required: 'Longitude is required',
    pattern: { value: /^-?\d+(\.\d+)?$/, message: 'Please enter a valid Longitude' },
    min: { value: -180, message: 'Longitude must be between -180 and 180' },
    max: { value: 180, message: 'Longitude must be between -180 and 180' },
  },
}
