export interface LineInputRecord {
  id: number | string
  uuid?: string
  line_id?: number | string
  line_name?: string
  branch_id?: number | string
  branch_name?: string
  team_id?: number | string
  team_name?: string
  buyer?: string
  buyer_name?: string
  shift_id?: number | string
  shift_name?: string
  order_id?: number | string
  order_no?: string
  order_code?: string
  style_id?: number | string
  style_name?: string
  style_number?: string
  style_no?: string
  color?: string
  size?: string
  balance_qty?: number | string
  is_return?: string
  type?: string
  input_qty?: number | string
  quantity?: number | string
  pcs_count?: number | string
  date_time?: string
  date?: string
  created_at?: string
  status?: string | number
  [key: string]: any
}
