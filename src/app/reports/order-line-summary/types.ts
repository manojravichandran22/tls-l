export interface OrderLineSummaryRecord {
  order?: {
    id?: number | string
    uuid?: string
    order_no?: string
    colour?: string
    style_id?: number | string
    ex_fac_date?: string
    days_left?: number
    order_qty?: number
    prod_qty?: number
    status?: number | string
    is_active?: number | string
    style?: {
      id?: number | string
      buyer?: string
      style_no?: string
      style_name?: string
    }
    branch?: {
      id?: number | string
      branch_name?: string
    }
  }
  line_summary?: Array<{
    line_id?: number | string
    line_name?: string
    total_input_qty?: number
  }>
  line_wise_summary?: Array<{
    line_id?: number | string
    line_name?: string
    shift_name?: string
    team_name?: string
    rows?: Array<{
      id?: number | string
      uuid?: string
      line_id?: number | string
      line_name?: string
      shift_id?: number | string
      shift_name?: string
      team_id?: number | string
      team_name?: string
      order_id?: number | string
      style_id?: number | string
      color?: string
      size?: string
      ord_qty?: number
      prod_qty?: number
      prod_per?: string | number
      input_qty?: number
      total_input_qty?: number
      'input%'?: string
      input_per?: string | number
      balance_to_input?: number
      output_qty?: number
      'output%'?: string
      output_per?: string | number
      wip?: number
      rej_qty?: number
      'rej%'?: string
      rej_per?: string | number
      rework_qty?: number
      'rework%'?: string
      rework_per?: string | number
      total_defect?: number
      'dhu%'?: string
      dhu_per?: string | number
      tls_open?: number
      tls_closed?: number
      total_tls_issue?: number
      total_tls_issues?: number
      checked_qty?: number
      is_return?: number
      is_mobile?: number
      balance_qty?: number
      wip_qty?: number
      status?: number | string
      [key: string]: unknown
    }>
    summary?: {
      ord_qty?: number
      prod_qty?: number
      prod_per?: string | number
      input_qty?: number
      'input%'?: string
      input_per?: string | number
      balance_to_input?: number
      output_qty?: number
      'output%'?: string
      output_per?: string | number
      wip?: number
      checked_qty?: number
      rework_qty?: number
      'rework%'?: string
      rework_per?: string | number
      rej_qty?: number
      'rej%'?: string
      rej_per?: string | number
      total_defect?: number
      'dhu%'?: string
      dhu_per?: string | number
      tls_open?: number
      tls_closed?: number
      total_tls_issue?: number
      total_tls_issues?: number
      wip_qty?: number
      [key: string]: unknown
    }
  }>
  input_details?: Array<{
    id?: number | string
    uuid?: string
    line_id?: number | string
    line_name?: string
    shift_id?: number | string
    shift_name?: string
    team_id?: number | string
    team_name?: string
    order_id?: number | string
    style_id?: number | string
    color?: string
    size?: string
    prod_qty?: number
    input_qty?: number
    total_input_qty?: number
    balance_to_input?: number
    date_time?: string
    status?: number | string
    is_active?: number | string
    branch_id?: number | string
    is_return?: number
    is_mobile?: number
    balance_qty?: number
    wip_qty?: number
    created_at?: string
    updated_at?: string
    line?: { id?: number | string; line_name?: string }
    shift?: { id?: number | string; shift_name?: string }
    team?: { id?: number | string; team_name?: string }
    ord_qty?: number
    prod_per?: string | number
    input_per?: string | number
    output_qty?: number
    pass_qty?: number
    output_per?: string | number
    checked_qty?: number
    rework_qty?: number
    rework_per?: string | number
    rej_qty?: number
    rejection_qty?: number
    rej_per?: string | number
    total_defect?: number
    dhu_per?: string | number
    tls_open?: number
    tls_closed?: number
    total_tls_issues?: number
    [key: string]: unknown
  }>
}

export interface OrderLineSummaryRow {
  _rowId: string
  _isFirstSize?: boolean
  _rowSpan?: number
  _orderRowSpan?: number
  _lineRowSpan?: number
  _lineIndex?: number
  _orderIndex?: number
  _isSummary?: boolean
  shift_name?: string
  team_name?: string
  line_name?: string
  buyer?: string
  style_name?: string
  style_no?: string
  ex_fac_date?: string
  days_left?: number
  order_no?: string
  colour?: string
  size?: string
  ord_qty?: number
  prod_per?: string | number
  prod_qty?: number
  input_qty?: number
  balance_to_input?: number
  input_per?: string | number
  output_qty?: number
  output_per?: string | number
  wip?: number
  checked_qty?: number
  rework_qty?: number
  rework_per?: string | number
  rej_qty?: number
  rej_per?: string | number
  total_defect?: number
  dhu_per?: string | number
  tls_open?: number
  tls_closed?: number
  total_tls_issues?: number
  is_return?: number | string
  is_mobile?: number | string
  wip_qty?: number
  status?: number | string
  [key: string]: unknown
}
