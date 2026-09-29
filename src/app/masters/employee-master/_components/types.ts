import { type ValidationRules } from '@/lib/validation'

// ── Entity interfaces ──
export interface Employee {
  id: number
  uuid: string
  name: string
  last_name: string
  code: string
  team_id?: number
  email: string | null
  mobile: string
  role: number
  join_date: string
  branch_id: number;
  department_id: number
  design_id?: number
  designation_id?: number
  workcategory_id?: number
  access_flag?: number | string
  status: number
  is_active: number
  branch?: { id: number; branch_name: string; branch_code: string }
  department?: { id: number; name: string; dept_code: string }
  designation?: { id: number; name: string }
  roleInfo?: { id: number; name: string; short_name: string }
  team?: { id: number; team_name: string }
  team_name?: string
  rfid_no?: string | null
  rfid?: string | null
}

export const ACCESS_FLAG_OPTIONS = [
  { value: '0', label: 'None' },
  { value: '1', label: 'Web' },
  { value: '2', label: 'Mobile' },
  { value: '3', label: 'Mobile and Web' },
]

export interface TeamOption {
  id: number
  team_name: string
  code?: string
}

export interface BranchOption { id: number; branch_name: string }
export interface RoleOption { id: number; uuid?: string; name: string; role?: number; branch_id?: number | string }
export interface DeptOption { id: number; name: string; branch_id?: number }

export interface DesignationOption { id: number; designation_name?: string; name?: string; dept_id?: number }
export interface WorkCategoryOption { id: number; name: string; work_category_name?: string }

// ── Form types ──
export type FormField = 'name' | 'last_name' | 'code' | 'mobile' | 'role' | 'join_date' | 'department_id' | 'branch_id' | 'designation_id' | 'workcategory_id' | 'team_id' | 'access_flag'
export type FormErrors = Partial<Record<FormField | 'email', string>>
export type Touched = Partial<Record<FormField, boolean>>

export const rules: ValidationRules<FormField> = {
  name: { required: 'First name is required', minLength: { value: 2, message: 'Minimum 2 characters' } },
  last_name: { required: 'Last name is required', minLength: { value: 1, message: 'Minimum 1 characters' } },
  code: { required: 'Employee code is required' },
  mobile: { required: 'Mobile is required', pattern: { value: /^\d{10}$/, message: 'Enter valid 10-digit number' } },
  role: { required: 'Role is required' },
  join_date: { required: 'Join date is required' },
  department_id: { required: 'Department is required' },
  branch_id: { required: 'Branch is required' },
  designation_id: { required: 'Designation is required' },
  workcategory_id: { required: 'Work Category is required' },
  team_id: { required: 'Team is required' },
  access_flag: { required: 'Access is required' },
}