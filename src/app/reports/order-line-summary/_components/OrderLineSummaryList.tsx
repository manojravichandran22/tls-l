'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Search, Loader2 } from 'lucide-react'
import ReportTable, { type ReportColumn } from '@/components/ui/ReportTable'
import { apiCall } from '@/services/apiClient'
import type { OrderLineSummaryRecord, OrderLineSummaryRow } from '../types'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useExport } from '@/hooks/useExport'
import { useExportPdf } from '@/hooks/useExportPdf'
import { formatDate } from '@/lib/formatDate'

function fmt(val: any): string {
  if (val === null || val === undefined || val === '') return '—'
  return String(val)
}

function fmtNum(val: any): number {
  const n = Number(val ?? 0)
  return isNaN(n) ? 0 : n
}

function flattenLineRecords(records: OrderLineSummaryRecord[]): OrderLineSummaryRow[] {
  const rows: OrderLineSummaryRow[] = []
  let lineGlobalIndex = 0

  records.forEach((rec, ri) => {
    const order = (rec.order || {}) as any
    const style = order.style || {}
    const daysLeft = order.days_left

    let lineGroups: Array<{
      line_id?: number | string
      line_name?: string
      shift_name?: string
      team_name?: string
      rows: any[]
      summary?: any
    }> = []

    if (rec.line_wise_summary && rec.line_wise_summary.length > 0) {
      lineGroups = rec.line_wise_summary.map((lg) => ({
        line_id: lg.line_id,
        line_name: lg.line_name,
        shift_name: lg.shift_name,
        team_name: lg.team_name,
        rows: lg.rows || [],
        summary: lg.summary,
      }))
    } else if (rec.input_details && rec.input_details.length > 0) {
      const map = new Map<string, { line_id?: any; line_name?: string; shift_name?: string; team_name?: string; rows: any[] }>()
      rec.input_details.forEach((item) => {
        const lineKey = `${item.line_id || item.line_name || 'line'}_${item.shift_name || ''}_${item.team_name || ''}`
        if (!map.has(lineKey)) {
          map.set(lineKey, {
            line_id: item.line_id,
            line_name: item.line_name || item.line?.line_name,
            shift_name: item.shift_name || item.shift?.shift_name,
            team_name: item.team_name || item.team?.team_name,
            rows: [],
          })
        }
        map.get(lineKey)!.rows.push(item)
      })
      lineGroups = Array.from(map.values())
    } else {
      lineGroups = [
        {
          rows: [{}],
        },
      ]
    }

    let totalOrderRows = 0
    lineGroups.forEach((lg) => {
      totalOrderRows += lg.rows.length + (lg.summary ? 1 : 0)
    })

    let orderRowIndex = 0

    lineGroups.forEach((lg, lgi) => {
      const lineRowsCount = lg.rows.length + (lg.summary ? 1 : 0)
      const lineShiftName = lg.shift_name || lg.rows[0]?.shift_name || lg.rows[0]?.shift?.shift_name || '—'
      const lineTeamName = lg.team_name || lg.rows[0]?.team_name || lg.rows[0]?.team?.team_name || '—'
      const lineLineName = lg.line_name || lg.rows[0]?.line_name || lg.rows[0]?.line?.line_name || '—'
      const currentLineIdx = lineGlobalIndex
      lineGlobalIndex++

      lg.rows.forEach((item, ii) => {
        const isOrderFirstRow = orderRowIndex === 0
        const isLineFirstRow = ii === 0

        const totalOrderQty = order.order_qty ?? item.ord_qty ?? 0
        const ordQty = isOrderFirstRow ? (item.ord_qty ?? totalOrderQty) : (item.ord_qty ?? 0)
        const prodQty = fmtNum(item.prod_qty ?? (isOrderFirstRow ? order.prod_qty : undefined))
        const inputQty = fmtNum(item.input_qty ?? item.total_input_qty ?? (isOrderFirstRow ? order.input_qty : undefined))
        const balInput = fmtNum(item.balance_to_input ?? item.balance_qty ?? (isOrderFirstRow ? (order.balance_to_input ?? order.balance_qty) : undefined))
        const outputQty = (item.output_qty !== undefined && item.output_qty !== null)
          ? fmtNum(item.output_qty)
          : (item.pass_qty !== undefined && item.pass_qty !== null)
            ? fmtNum(item.pass_qty)
            : (item.aql_pass_qty !== undefined && item.aql_pass_qty !== null)
              ? fmtNum(item.aql_pass_qty)
              : (isOrderFirstRow && order.output_qty !== undefined && order.output_qty !== null)
                ? fmtNum(order.output_qty)
                : undefined
        const wipQty = fmtNum(item.wip ?? item.wip_qty ?? (isOrderFirstRow ? (order.wip_qty ?? order.wip) : undefined))
        const checkedQty = item.checked_qty !== undefined && item.checked_qty !== null
          ? fmtNum(item.checked_qty)
          : (isOrderFirstRow && order.checked_qty !== undefined && order.checked_qty !== null ? fmtNum(order.checked_qty) : undefined)
        const reworkQty = item.rework_qty !== undefined && item.rework_qty !== null
          ? fmtNum(item.rework_qty)
          : (isOrderFirstRow && order.rework_qty !== undefined && order.rework_qty !== null ? fmtNum(order.rework_qty) : undefined)
        const rejQty = item.rej_qty !== undefined && item.rej_qty !== null
          ? fmtNum(item.rej_qty)
          : (item.rejection_qty !== undefined && item.rejection_qty !== null
            ? fmtNum(item.rejection_qty)
            : (isOrderFirstRow && (order.rej_qty !== undefined || order.rejection_qty !== undefined)
              ? fmtNum(order.rej_qty ?? order.rejection_qty)
              : undefined))
        const totalDefect = item.total_defect !== undefined && item.total_defect !== null
          ? fmtNum(item.total_defect)
          : (isOrderFirstRow && order.total_defect !== undefined && order.total_defect !== null ? fmtNum(order.total_defect) : undefined)
        const tlsOpen = item.tls_open !== undefined && item.tls_open !== null
          ? fmtNum(item.tls_open)
          : (isOrderFirstRow && order.tls_open !== undefined && order.tls_open !== null ? fmtNum(order.tls_open) : undefined)
        const tlsClosed = item.tls_closed !== undefined && item.tls_closed !== null
          ? fmtNum(item.tls_closed)
          : (isOrderFirstRow && order.tls_closed !== undefined && order.tls_closed !== null ? fmtNum(order.tls_closed) : undefined)
        const totalTlsIssues = item.total_tls_issues !== undefined && item.total_tls_issues !== null
          ? fmtNum(item.total_tls_issues)
          : (item.total_tls_issue !== undefined && item.total_tls_issue !== null
            ? fmtNum(item.total_tls_issue)
            : (isOrderFirstRow && (order.total_tls_issues !== undefined || order.total_tls_issue !== undefined)
              ? fmtNum(order.total_tls_issues ?? order.total_tls_issue)
              : undefined))

        const prodPer = item.prod_per !== undefined && item.prod_per !== null ? (typeof item.prod_per === 'number' ? `${item.prod_per}%` : item.prod_per) : (order.prod_per !== undefined && order.prod_per !== null ? order.prod_per : '—')
        const inputPer = item.input_per !== undefined && item.input_per !== null ? item.input_per : (item['input%'] !== undefined && item['input%'] !== null ? item['input%'] : (order.input_per !== undefined && order.input_per !== null ? order.input_per : ((order as any)['input%'] ?? '—')))
        const outputPer = item.output_per !== undefined && item.output_per !== null ? item.output_per : (item['output%'] !== undefined && item['output%'] !== null ? item['output%'] : (order.output_per !== undefined && order.output_per !== null ? order.output_per : ((order as any)['output%'] ?? '—')))
        const reworkPer = item.rework_per !== undefined && item.rework_per !== null ? item.rework_per : (item['rework%'] !== undefined && item['rework%'] !== null ? item['rework%'] : (order.rework_per !== undefined && order.rework_per !== null ? order.rework_per : ((order as any)['rework%'] ?? '—')))
        const rejPer = item.rej_per !== undefined && item.rej_per !== null ? item.rej_per : (item['rej%'] !== undefined && item['rej%'] !== null ? item['rej%'] : (order.rej_per !== undefined && order.rej_per !== null ? order.rej_per : ((order as any)['rej%'] ?? '—')))
        const dhuPer = item.dhu_per !== undefined && item.dhu_per !== null ? item.dhu_per : (item['dhu%'] !== undefined && item['dhu%'] !== null ? item['dhu%'] : (order.dhu_per !== undefined && order.dhu_per !== null ? order.dhu_per : ((order as any)['dhu%'] ?? '—')))

        rows.push({
          _rowId: `${ri}_${lgi}_${ii}_${orderRowIndex}`,
          _isFirstSize: isOrderFirstRow,
          _orderRowSpan: isOrderFirstRow ? totalOrderRows : 0,
          _lineRowSpan: isLineFirstRow ? lineRowsCount : 0,
          _lineIndex: currentLineIdx,
          _orderIndex: ri,
          _isSummary: false,
          shift_name: lineShiftName,
          team_name: lineTeamName,
          line_name: lineLineName,
          buyer: style.buyer || order.buyer || (rec as any).buyer || (order.style && order.style.buyer) || '—',
          style_name: style.style_name || order.style_name || (rec as any).style_name || (order.style && order.style.style_name) || '—',
          style_no: style.style_no || order.style_no || (rec as any).style_no || (order.style && order.style.style_no) || '—',
          ex_fac_date: order.ex_fac_date || (rec as any).ex_fac_date || '—',
          days_left: daysLeft !== undefined && daysLeft !== null ? Number(daysLeft) : ((rec as any).days_left !== undefined ? Number((rec as any).days_left) : undefined),
          order_no: order.order_no || (rec as any).order_no || '—',
          colour: item.color || item.colour || order.colour || order.color || (rec as any).colour || (rec as any).color || '—',
          size: item.size || '—',
          ord_qty: ordQty,
          prod_per: prodPer,
          prod_qty: prodQty,
          input_qty: inputQty,
          balance_to_input: balInput,
          input_per: inputPer,
          output_qty: outputQty,
          output_per: outputPer,
          wip: wipQty,
          checked_qty: checkedQty,
          rework_qty: reworkQty,
          rework_per: reworkPer,
          rej_qty: rejQty,
          rej_per: rejPer,
          total_defect: totalDefect,
          dhu_per: dhuPer,
          tls_open: tlsOpen,
          tls_closed: tlsClosed,
          total_tls_issues: totalTlsIssues,
          is_return: item.is_return,
          is_mobile: item.is_mobile,
          wip_qty: fmtNum(item.wip_qty),
          status: item.status !== undefined && item.status !== null ? (item.status === 1 || item.status === '1' ? 'Active' : 'Inactive') : '',
        })

        orderRowIndex++
      })

      if (lg.summary) {
        const sum = lg.summary
        const isOrderFirstRow = orderRowIndex === 0
        const ordQtySum = fmtNum(sum.ord_qty)
        const prodQtySum = fmtNum(sum.prod_qty)
        const inputQtySum = fmtNum(sum.input_qty)
        const outputQtySum = fmtNum(sum.output_qty)
        const reworkQtySum = fmtNum(sum.rework_qty)
        const rejQtySum = fmtNum(sum.rej_qty)
        const totalDefectSum = sum.total_defect !== undefined && sum.total_defect !== null ? fmtNum(sum.total_defect) : undefined

        const prodPerSum = sum['prod%'] ?? sum.prod_per ?? (order.prod_per !== undefined && order.prod_per !== null ? order.prod_per : '-')
        const inputPerSum = sum['input%'] ?? sum.input_per ?? '-'
        const outputPerSum = sum['output%'] ?? sum.output_per ?? '-'
        const reworkPerSum = sum['rework%'] ?? sum.rework_per ?? '-'
        const rejPerSum = sum['rej%'] ?? sum.rej_per ?? '-'
        const dhuPerSum = sum['dhu%'] ?? sum.dhu_per ?? '-'

        rows.push({
          _rowId: `${ri}_${lgi}_summary`,
          _isFirstSize: isOrderFirstRow,
          _orderRowSpan: isOrderFirstRow ? totalOrderRows : 0,
          _lineRowSpan: 0,
          _lineIndex: currentLineIdx,
          _orderIndex: ri,
          _isSummary: true,
          shift_name: lineShiftName,
          team_name: lineTeamName,
          line_name: lineLineName,
          buyer: style.buyer || order.buyer || (rec as any).buyer || (order.style && order.style.buyer) || '—',
          style_name: style.style_name || order.style_name || (rec as any).style_name || (order.style && order.style.style_name) || '—',
          style_no: style.style_no || order.style_no || (rec as any).style_no || (order.style && order.style.style_no) || '—',
          ex_fac_date: order.ex_fac_date || (rec as any).ex_fac_date || '—',
          days_left: daysLeft !== undefined && daysLeft !== null ? Number(daysLeft) : ((rec as any).days_left !== undefined ? Number((rec as any).days_left) : undefined),
          order_no: order.order_no || (rec as any).order_no || '—',
          colour: order.colour || (rec as any).colour || '—',
          size: 'Summary',
          ord_qty: ordQtySum,
          prod_per: prodPerSum,
          prod_qty: prodQtySum,
          input_qty: inputQtySum,
          balance_to_input: fmtNum(sum.balance_to_input),
          input_per: inputPerSum,
          output_qty: outputQtySum,
          output_per: outputPerSum,
          wip: fmtNum(sum.wip ?? sum.wip_qty),
          checked_qty: fmtNum(sum.checked_qty),
          rework_qty: reworkQtySum,
          rework_per: reworkPerSum,
          rej_qty: rejQtySum,
          rej_per: rejPerSum,
          total_defect: totalDefectSum,
          dhu_per: dhuPerSum,
          tls_open: fmtNum(sum.tls_open),
          tls_closed: fmtNum(sum.tls_closed),
          total_tls_issues: fmtNum(sum.total_tls_issue ?? sum.total_tls_issues),
          is_return: '',
          is_mobile: '',
          wip_qty: fmtNum(sum.wip_qty),
          status: '',
        })

        orderRowIndex++
      }
    })
  })

  return rows
}

interface OrderLineSummaryListProps {
  onDataLoaded?: (exportExcel: () => void, exportPdf: () => void, exporting: boolean) => void
}

export default function OrderLineSummaryList({ onDataLoaded }: OrderLineSummaryListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const [selectedBranch, setSelectedBranch] = useState(() => (!isAdmin && userBranchId ? String(userBranchId) : ''))
  const effectiveBranchId = !isAdmin && userBranchId ? String(userBranchId) : selectedBranch

  const { branches } = useDropdownData({ branches: true })
  const [inputValue, setInputValue] = useState('')
  const [searchedOrder, setSearchedOrder] = useState('')
  const [rows, setRows] = useState<OrderLineSummaryRow[]>([])
  const [totalSummary, setTotalSummary] = useState<any>(null)
  const [orderCount, setOrderCount] = useState(0)
  const [lineCount, setLineCount] = useState(0)
  const [sizeCount, setSizeCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  interface OrderDropdownItem {
    order_no?: string
    order_number?: string
    colour?: string
    color?: string
    name?: string
    [key: string]: any
  }

  const [orderDropdownItems, setOrderDropdownItems] = useState<OrderDropdownItem[]>([])
  const [selectedColour, setSelectedColour] = useState('')
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  // Auto-initialize branch filter if user is restricted to a specific branch
  useEffect(() => {
    if (!isAdmin && userBranchId && !selectedBranch) {
      setSelectedBranch(String(userBranchId))
    }
  }, [userBranchId, isAdmin, selectedBranch])

  // Fetch order dropdown options whenever selectedBranch changes
  useEffect(() => {
    if (!effectiveBranchId) {
      setOrderDropdownItems([])
      setSelectedColour('')
      return
    }

    let isMounted = true
    setLoadingOrders(true)

    apiCall<any>('/dropdown/getorderdropdown', {
      method: 'GET',
      encrypt: false,
      payload: { branch_id: effectiveBranchId },
    })
      .then((res) => {
        if (!isMounted) return
        const raw: OrderDropdownItem[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.data?.records)
            ? res.data.records
            : Array.isArray(res?.data)
              ? res.data
              : []

        setOrderDropdownItems(raw)
      })
      .catch((err) => {
        console.error('Failed to fetch order dropdown options:', err)
        if (isMounted) setOrderDropdownItems([])
      })
      .finally(() => {
        if (isMounted) setLoadingOrders(false)
      })

    return () => {
      isMounted = false
    }
  }, [effectiveBranchId])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Distinct order numbers for autocomplete
  const orderOptions = useMemo(() => {
    const list: string[] = orderDropdownItems
      .map((item) => String(item.order_no || item.order_number || item.name || '').trim())
      .filter(Boolean)
    return Array.from(new Set(list))
  }, [orderDropdownItems])

  const filteredOrderOptions = useMemo(() => {
    if (!inputValue.trim()) return orderOptions
    const val = inputValue.trim().toLowerCase()
    return orderOptions.filter((opt) => opt.toLowerCase().includes(val))
  }, [orderOptions, inputValue])

  // Distinct colours for the currently entered/selected order number
  const availableColours = useMemo(() => {
    if (!inputValue.trim()) return []
    const targetOrder = inputValue.trim().toLowerCase()
    const matchingItems = orderDropdownItems.filter((item) => {
      const oNo = String(item.order_no || item.order_number || item.name || '').trim().toLowerCase()
      return oNo === targetOrder
    })

    const colours: string[] = matchingItems
      .map((item) => String(item.colour || item.color || '').trim())
      .filter(Boolean)

    return Array.from(new Set(colours))
  }, [orderDropdownItems, inputValue])

  const exportPayload = {
    type: '',
    from_date: '',
    to_date: '',
    line_id: '',
    branch_id: effectiveBranchId,
    style_id: '',
    colour: selectedColour.trim(),
    order_no: inputValue.trim(),
    status: '',
  }

  const { handleExport, exporting } = useExport({
    apiPath: '/report/lineordersummary',
    payload: exportPayload,
    filename: 'Line_Wise_Order_Summary_Report',
  })

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/report/lineordersummary',
    payload: exportPayload,
    filename: 'Line_Wise_Order_Summary_Report',
  })

  useEffect(() => {
    if (onDataLoaded) {
      onDataLoaded(handleExport, handleExportPdf, exporting || exportingPdf)
    }
  }, [onDataLoaded, handleExport, handleExportPdf, exporting, exportingPdf])

  const fetchReport = useCallback(async (branchId: string, orderNo: string, colour: string) => {
    if (!branchId || !orderNo.trim()) return
    setLoading(true)
    setSearched(true)
    setSearchedOrder(orderNo.trim())
    try {
      const res = await apiCall<{
        success?: boolean
        data?: {
          total?: number | string
          records?: OrderLineSummaryRecord[]
          total_summary?: any
          pagination?: { total: number | string }
        }
      }>('/report/lineordersummary', {
        method: 'POST',
        encrypt: false,
        payload: {
          type: '',
          from_date: '',
          to_date: '',
          line_id: '',
          branch_id: branchId,
          style_id: '',
          colour: colour.trim(),
          order_no: orderNo.trim(),
          status: '',
        },
      })

      const records = res.data?.records ?? []
      const flattened = flattenLineRecords(records)
      setRows(flattened)
      setOrderCount(Number(res.data?.total ?? records.length))
      setLineCount(flattened.filter((r) => (r._lineRowSpan ?? 0) > 0).length)
      setSizeCount(flattened.filter((r) => !r._isSummary).length)
      setTotalSummary(res.data?.total_summary ?? (res as any)?.total_summary ?? null)
    } catch (err) {
      console.error('Failed to fetch line order summary:', err)
      setRows([])
      setOrderCount(0)
      setLineCount(0)
      setSizeCount(0)
      setTotalSummary(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = () => fetchReport(selectedBranch, inputValue, selectedColour)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && selectedBranch && inputValue.trim()) handleSearch()
  }

  const columns: ReportColumn<OrderLineSummaryRow>[] = [
    {
      key: 'sno',
      header: 'S.No',
      rowSpan: (r) => r._lineRowSpan,
      render: (row) => (
        <span className="text-t-body whitespace-nowrap">
          {((row as any)._lineIndex ?? (row as any)._orderIndex ?? 0) + 1}
        </span>
      ),
      footer: () => <span className="font-bold text-white">Total</span>,
    },
    {
      key: 'shift_name',
      header: 'Shift',
      rowSpan: (r) => r._lineRowSpan,
      render: (row) => <span className="text-t-body whitespace-nowrap">{fmt(row.shift_name)}</span>,
    },
    {
      key: 'team_name',
      header: 'Team',
      rowSpan: (r) => r._lineRowSpan,
      render: (row) => <span className="text-t-body whitespace-nowrap">{fmt(row.team_name)}</span>,
    },
    {
      key: 'line_name',
      header: 'Line',
      rowSpan: (r) => r._lineRowSpan,
      render: (row) => <span className="text-t-body whitespace-nowrap">{fmt(row.line_name)}</span>,
    },
    {
      key: 'buyer',
      header: 'Buyer',
      rowSpan: (r) => r._lineRowSpan,
      render: (row) => <span className="text-t-body whitespace-nowrap">{fmt(row.buyer)}</span>,
    },
    {
      key: 'style_name',
      header: 'Style Name',
      rowSpan: (r) => r._lineRowSpan,
      render: (row) => <span className="text-t-body whitespace-nowrap">{fmt(row.style_name)}</span>,
    },
    {
      key: 'style_no',
      header: 'Style Number',
      rowSpan: (r) => r._lineRowSpan,
      render: (row) => <span className="text-t-body whitespace-nowrap">{fmt(row.style_no)}</span>,
    },
    {
      key: 'ex_fac_date',
      header: 'Ex-Factory Date',
      rowSpan: (r) => r._lineRowSpan,
      render: (row) => <span className="text-t-body whitespace-nowrap">{formatDate(row.ex_fac_date)}</span>,
    },
    {
      key: 'days_left',
      header: 'Days Left',
      rowSpan: (r) => r._lineRowSpan,
      render: (row) =>
        row.days_left !== undefined && row.days_left !== null ? (
          <span
            className={`whitespace-nowrap ${Number(row.days_left) < 0 ? 'text-red-500 font-semibold' : 'text-t-body'}`}
          >
            {row.days_left}
          </span>
        ) : (
          <span className="text-t-body whitespace-nowrap">—</span>
        ),
    },
    {
      key: 'order_no',
      header: 'Order No',
      rowSpan: (r) => r._lineRowSpan,
      render: (row) => <span className="text-t-body whitespace-nowrap">{fmt(row.order_no)}</span>,
    },
    {
      key: 'colour',
      header: 'Colour',
      rowSpan: (r) => r._lineRowSpan,
      render: (row) => <span className="text-t-body whitespace-nowrap">{fmt(row.colour)}</span>,
    },

    {
      key: 'size',
      header: 'Size',
      render: (row) =>
        row._isSummary ? (
          <span className="font-bold text-t-primary">Summary</span>
        ) : (
          <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-card-alt border border-input-line rounded text-t-primary">
            {fmt(row.size)}
          </span>
        ),
    },
    {
      key: 'ord_qty',
      header: 'Order Qty',
      render: (row) =>
        row.ord_qty !== undefined && row.ord_qty !== null ? (
          <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>
            {fmtNum(row.ord_qty).toLocaleString()}
          </span>
        ) : null,
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.ord_qty !== undefined && totalSummary?.ord_qty !== null ? fmtNum(totalSummary.ord_qty).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'prod_per',
      header: 'Prod Order%',
      render: (row) => <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>{fmt(row.prod_per)}</span>,
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.['prod%'] ?? totalSummary?.prod_per ?? '—'}
        </span>
      ),
    },
    {
      key: 'prod_qty',
      header: 'Prod O.Qty',
      render: (row) => (
        <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>
          {fmtNum(row.prod_qty).toLocaleString()}
        </span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.prod_qty !== undefined && totalSummary?.prod_qty !== null ? fmtNum(totalSummary.prod_qty).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'input_qty',
      header: 'Input Qty',
      render: (row) => (
        <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>
          {fmtNum(row.input_qty).toLocaleString()}
        </span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.input_qty !== undefined && totalSummary?.input_qty !== null ? fmtNum(totalSummary.input_qty).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'balance_to_input',
      header: 'Bal to Input',
      render: (row) => (
        <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>
          {fmtNum(row.balance_to_input).toLocaleString()}
        </span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.balance_to_input !== undefined || totalSummary?.balance_input !== undefined
            ? fmtNum(totalSummary.balance_to_input ?? totalSummary.balance_input).toLocaleString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'input_per',
      header: 'Input %',
      render: (row) => <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>{fmt(row.input_per)}</span>,
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.['input%'] ?? totalSummary?.input_per ?? '—'}
        </span>
      ),
    },
    {
      key: 'output_qty',
      header: 'Output Qty',
      render: (row) => (
        <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>
          {row.output_qty !== undefined && row.output_qty !== null ? fmtNum(row.output_qty).toLocaleString() : '—'}
        </span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.output_qty !== undefined && totalSummary?.output_qty !== null ? fmtNum(totalSummary.output_qty).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'output_per',
      header: 'Output %',
      render: (row) => <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>{fmt(row.output_per)}</span>,
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.['output%'] ?? totalSummary?.output_per ?? '—'}
        </span>
      ),
    },
    {
      key: 'wip',
      header: 'Sewing WIP',
      render: (row) => (
        <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>
          {fmtNum(row.wip).toLocaleString()}
        </span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.wip !== undefined && totalSummary?.wip !== null ? fmtNum(totalSummary.wip).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'checked_qty',
      header: 'Checked Qty',
      render: (row) => (
        <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>
          {row.checked_qty !== undefined && row.checked_qty !== null ? fmtNum(row.checked_qty).toLocaleString() : '—'}
        </span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.checked_qty !== undefined && totalSummary?.checked_qty !== null ? fmtNum(totalSummary.checked_qty).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'rework_qty',
      header: 'Rework Qty',
      render: (row) => (
        <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>
          {row.rework_qty !== undefined && row.rework_qty !== null ? fmtNum(row.rework_qty).toLocaleString() : '—'}
        </span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.rework_qty !== undefined && totalSummary?.rework_qty !== null ? fmtNum(totalSummary.rework_qty).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'rework_per',
      header: 'Rework %',
      render: (row) => <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>{fmt(row.rework_per)}</span>,
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.['rework%'] ?? totalSummary?.rework_per ?? '—'}
        </span>
      ),
    },
    {
      key: 'rej_qty',
      header: 'Rej Qty',
      render: (row) => (
        <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>
          {row.rej_qty !== undefined && row.rej_qty !== null ? fmtNum(row.rej_qty).toLocaleString() : '—'}
        </span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.rej_qty !== undefined && totalSummary?.rej_qty !== null ? fmtNum(totalSummary.rej_qty).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'rej_per',
      header: 'Rej %',
      render: (row) => <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>{fmt(row.rej_per)}</span>,
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.['rej%'] ?? totalSummary?.rej_per ?? '—'}
        </span>
      ),
    },
    {
      key: 'dhu_per',
      header: 'DHU%',
      render: (row) => <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>{fmt(row.dhu_per)}</span>,
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.['dhu%'] ?? totalSummary?.dhu_per ?? '—'}
        </span>
      ),
    },
    {
      key: 'total_defect',
      header: 'Total Defect',
      render: (row) => (
        <span className={`text-t-body ${row._isSummary ? 'font-bold' : 'font-medium'}`}>
          {row.total_defect !== undefined && row.total_defect !== null ? fmtNum(row.total_defect).toLocaleString() : '—'}
        </span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.total_defect !== undefined && totalSummary?.total_defect !== null ? fmtNum(totalSummary.total_defect).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'tls_open',
      header: 'TLS Open',
      rowSpan: (r) => r._lineRowSpan,
      render: (row) =>
        row.tls_open !== undefined && row.tls_open !== null ? (
          <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>
            {fmtNum(row.tls_open).toLocaleString()}
          </span>
        ) : null,
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.tls_open !== undefined && totalSummary?.tls_open !== null ? String(totalSummary.tls_open) : '—'}
        </span>
      ),
    },
    {
      key: 'tls_closed',
      header: 'TLS Closed',
      rowSpan: (r) => r._lineRowSpan,
      render: (row) =>
        row.tls_closed !== undefined && row.tls_closed !== null ? (
          <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>
            {fmtNum(row.tls_closed).toLocaleString()}
          </span>
        ) : null,
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.tls_closed !== undefined && totalSummary?.tls_closed !== null ? String(totalSummary.tls_closed) : '—'}
        </span>
      ),
    },
    {
      key: 'total_tls_issues',
      header: 'Total TLS Issues',
      rowSpan: (r) => r._lineRowSpan,
      render: (row) =>
        row.total_tls_issues !== undefined && row.total_tls_issues !== null ? (
          <span className={`text-t-body ${row._isSummary ? 'font-bold' : ''}`}>
            {fmtNum(row.total_tls_issues).toLocaleString()}
          </span>
        ) : null,
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.total_tls_issue !== undefined || totalSummary?.total_tls_issues !== undefined
            ? String(totalSummary.total_tls_issue ?? totalSummary.total_tls_issues)
            : '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* ── Search Row ── */}
      <div className="flex items-end gap-3 flex-wrap">
        {/* Branch Selection (Compulsory) */}
        <div className="flex flex-col gap-1 w-52 shrink-0">
          <label className="text-xs font-semibold text-t-secondary">
            Branch <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value)
              setInputValue('')
              setSelectedColour('')
              setShowSuggestions(false)
            }}
            disabled={!isAdmin && Boolean(userBranchId)}
            className="w-full h-9 px-3 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            <option value="">Select Branch</option>
            {branches.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.branch_name}
              </option>
            ))}
          </select>
        </div>

        {/* Order No Input with Autocomplete (Compulsory) */}
        <div className="flex flex-col gap-1 flex-1 min-w-[220px] max-w-[400px] relative" ref={autocompleteRef}>
          <label className="text-xs font-semibold text-t-secondary">
            Order No <span className="text-red-500">*</span>
          </label>
          <div className="relative w-full">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                const val = e.target.value
                setInputValue(val)
                setShowSuggestions(true)
                if (!val.trim()) {
                  setSelectedColour('')
                }
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder={loadingOrders ? "Loading orders..." : "Enter Order No"}
              className="w-full h-9 pl-3 pr-8 text-sm border border-input-line rounded-lg bg-card text-t-primary outline-none focus:border-accent transition-colors placeholder:text-t-lighter"
            />
            {loadingOrders && (
              <Loader2 size={14} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-t-muted" />
            )}
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && filteredOrderOptions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-card border border-input-line rounded-lg shadow-xl z-[9999] divide-y divide-table-line">
              {filteredOrderOptions.map((opt) => (
                <li
                  key={opt}
                  onClick={() => {
                    setInputValue(opt)
                    setShowSuggestions(false)
                    // Check available colours for selected order
                    const matching = orderDropdownItems.filter(
                      (item) => String(item.order_no || item.order_number || item.name || '').trim().toLowerCase() === opt.toLowerCase()
                    )
                    const cols = Array.from(new Set(matching.map((item) => String(item.colour || item.color || '').trim()).filter(Boolean)))
                    if (cols.length === 1) {
                      setSelectedColour(cols[0])
                    } else {
                      setSelectedColour('')
                    }
                  }}
                  className="px-3.5 py-2 text-xs text-t-primary hover:bg-[#007b83] hover:text-white cursor-pointer transition-colors font-medium flex items-center justify-between"
                >
                  <span>{opt}</span>
                </li>
              ))}
            </ul>
          )}
          {showSuggestions && !loadingOrders && inputValue.trim() && filteredOrderOptions.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 px-3.5 py-2.5 bg-card border border-input-line rounded-lg shadow-xl z-[9999] text-xs text-t-muted italic">
              No matching orders found
            </div>
          )}
        </div>

        {/* Colour Dropdown (Always visible, selectable only when Order No is provided) */}
        <div className="flex flex-col gap-1 w-48 shrink-0">
          <label className="text-xs font-semibold text-t-secondary">
            Colour
          </label>
          <select
            value={selectedColour}
            onChange={(e) => setSelectedColour(e.target.value)}
            disabled={!inputValue.trim()}
            className="w-full h-9 px-3 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">{inputValue.trim() ? "All Colours" : "Select Colour"}</option>
            {availableColours.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !selectedBranch || !inputValue.trim()}
          className="h-9 px-5 flex items-center gap-2 bg-[#007b83] hover:bg-[#006a71] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          View Report
        </button>
      </div>

      {/* ── Table (only after first search) ── */}
      {searched && (
        <div className="flex flex-col flex-1 min-h-0">
          <ReportTable<OrderLineSummaryRow>
            columns={columns}
            data={rows}
            loading={loading}
            rowKey={(r) => r._rowId}
            totalCount={orderCount}
            emptyMessage={`No records found for order "${searchedOrder}"${selectedColour ? ` (Colour: ${selectedColour})` : ''}`}
            countLabel="order"
            countLabelPlural="orders"
            countSuffix={`| Total Lines: ${lineCount} | Total Size records: ${sizeCount}`}
          />
        </div>
      )}
    </div>
  )
}
