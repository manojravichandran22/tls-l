import type { ValidationRules } from '@/lib/validation'

export interface OrderSize {
  id?: number
  uuid?: string
  size: string
  ord_qty: number
  prod_qty?: number
  prod_per: number
  input_qty?: number
  output_qty?: number
  rej_qty?: number
  rej_per?: number
  wip?: number
  rework_qty?: number
}

export interface Order {
  id: number
  uuid: string
  order_no: number
  colour: string
  order_qty: number
  prod_qty: number
  input_qty: number
  prod_per: number
  output_qty: number
  rej_qty: number
  diff_qty: number
  rework_qty: number
  rework_per: number
  rej_per: number
  wip: number
  style_id: number | null
  total_size: number | null
  order_code: string | null
  status: number
  is_active: number
  created_at: string
  updated_at: string
  orderSizes: OrderSize[]
  tot_prd_ord_qty: number
  style: { buyer: string; style_no: string; style_name: string } | null
  ex_fac_date?: string
  cost_of_pic?: number
  currency_type?: string
  notes?: string | null
  branch_id?: number | string | null
  branch?: { id: number; branch_name: string } | null
  /** 1 = order is mapped/locked → hide Edit & Delete; 0 = show Edit & Delete */
  is_edit?: number
}

export interface LinkOrder {
  id: number
  uuid: string
  order_no: number
  colour: string | null
  buyer?: string
  style_id: number | null
  order_code: string | null
  created_at: string
  updated_at: string
  style: { buyer: string; style_no: string; style_name: string } | null
  branch_id?: number | string | null
  branch_name?: string | null
  branch?: { id: number; branch_name: string } | null
  ex_fac_date?: string | null
  order_qty?: number
  prod_qty?: number
  tot_prd_ord_qty?: number
  status?: number
  is_active?: number
  notes?: string | null
  /** 1 = order is mapped/locked → hide Edit & Delete; 0 = show Edit & Delete */
  is_edit?: number
}

export interface StyleOption {
  id: number
  uuid?: string
  style_no: string
  style_name: string
  buyer: string
}

export interface OrderSizeRow {
  size: string
  ord_qty: string
  prod_per: string
}

export type OrderFormField =
  | 'order_no'
  | 'colour'
  | 'buyer'
  | 'order_qty'
  | 'prod_per'
  | 'ex_fac_date'
  | 'currency_type'
  | 'cost_of_pic'
  | 'branch_id'
export type FormErrors = Partial<Record<OrderFormField, string>>
export type FormTouched = Partial<Record<OrderFormField, boolean>>

export const orderRules: ValidationRules<OrderFormField> = {
  order_no: { required: 'Order number is required' },
  colour: { required: 'Colour is required' },
  buyer: { required: 'Buyer is required' },
  branch_id: { required: 'Branch is required' },
  order_qty: { required: 'Order quantity is required' },
  prod_per: { required: 'Prod. Qty % is required' },
  ex_fac_date: { required: 'Ex-Factory date is required' },
  currency_type: { required: 'Currency type is required' },
  cost_of_pic: { required: 'Factory cost per piece is required' },
}
