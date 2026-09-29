export interface User {
  id?: number
  uuid: string
  name: string
  email?: string
  role: number
  emp_code: string
  roleInfo?: { id: number; name: string } | null
  branch_id?: number | string | null
  branch_name?: string | null
  branch?: { id: number; branch_name: string } | null
  access_flag?: number
  status?: number
  is_active?: number
}
