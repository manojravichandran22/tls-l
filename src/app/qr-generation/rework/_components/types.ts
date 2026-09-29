export interface ReworkQrRecord {
  id?: number | string
  uuid?: string
  qr_code?: string
  qr?: string | number
  code?: string
  branch_id?: number | string
  branch_name?: string
  branch?: { id: number; branch_name: string }
  created_at?: string
  updated_at?: string
}
