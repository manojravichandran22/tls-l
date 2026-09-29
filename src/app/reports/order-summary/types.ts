export interface OrderStyle {
  style_id?: number | string
  buyer?: string
  style_no?: string
  style_name?: string
}

export interface OrderInfo {
  id?: number | string
  uuid?: string
  order_no?: string
  colour?: string
  style_id?: number | string
  ex_fac_date?: string
  cost_of_pic?: string
  currency_type?: string
  status?: number | string
  is_active?: number | string
  days_left?: number | string
  style?: OrderStyle
  tls_open?: number
  tls_closed?: number
  total_tls_issue?: number
  total_tls_issues?: number
}

export interface OrderSizeRow {
  id?: number | string
  size?: string
  ord_qty?: number
  prod_qty?: number
  prod_per?: number | string
  input_qty?: number
  output_qty?: number
  'input%'?: string
  input_per?: string
  'output%'?: string
  output_per?: string
  rej_qty?: number
  rej_per?: string
  'rej%'?: string
  rework_qty?: number
  rework_per?: string
  'rework%'?: string
  total_defect?: number
  tls_open?: number
  tls_closed?: number
  total_tls_issue?: number
  total_tls_issues?: number
  checked_qty?: number
  balance_input?: number
  balance_to_input?: number
  wip?: number
  wip_qty?: number
  'dhu%'?: string
  dhu_per?: string
}

// Flattened row used in the table (order info + one size row merged)
export interface OrderSummaryRow {
  _rowId: string
  _isFirstSize?: boolean
  _rowSpan?: number
  _orderIndex?: number
  // From order (shown only on first size row for visual grouping)
  order_no?: string
  colour?: string
  ex_fac_date?: string
  buyer?: string
  style_no?: string
  style_name?: string
  days_left?: number
  // From order_sizes
  size?: string
  ord_qty?: number
  prod_qty?: number
  prod_per?: number | string
  input_qty?: number
  output_qty?: number
  rej_qty?: number
  rej_per?: string
  rework_qty?: number
  rework_per?: string
  checked_qty?: number
  balance_input?: number
  input_per?: string
  output_per?: string
  wip?: number
  total_defect?: number
  tls_open?: number
  tls_closed?: number
  total_tls_issues?: number
  dhu_per?: string
}

export interface OrderSummaryRecord {
  order?: OrderInfo
  order_sizes?: OrderSizeRow[]
}
