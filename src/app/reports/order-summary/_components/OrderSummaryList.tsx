'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Search, Download, Loader2, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react'
import ReportTable, { type ReportColumn } from '@/components/ui/ReportTable'
import { apiCall } from '@/services/apiClient'
import type { OrderSummaryRecord, OrderSummaryRow } from '../types'
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

// Each order_sizes entry becomes one row; order-level info is row-spanned per order
function flattenRecords(records: OrderSummaryRecord[]): OrderSummaryRow[] {
  const rows: OrderSummaryRow[] = []

  records.forEach((rec, ri) => {
    const order = rec.order || {}
    const style = order.style || {}
    const daysLeft = order.days_left ?? (rec as any).days_left
    const sizes = rec.order_sizes && rec.order_sizes.length > 0 ? rec.order_sizes : [{}]
    const orderRowsCount = sizes.length

    sizes.forEach((sz: any, si: number) => {
      const isFirst = si === 0

      rows.push({
        _rowId: `${ri}_${si}_${order.id || order.uuid || ri}`,
        _isFirstSize: isFirst,
        _rowSpan: isFirst ? orderRowsCount : 0,
        _orderIndex: ri,
        buyer: style.buyer,
        style_name: style.style_name,
        style_no: style.style_no,
        ex_fac_date: order.ex_fac_date,
        days_left: daysLeft !== undefined && daysLeft !== null ? Number(daysLeft) : undefined,
        order_no: order.order_no,
        colour: order.colour,
        size: sz.size,
        ord_qty: sz.ord_qty,
        prod_qty: sz.prod_qty,
        prod_per: sz.prod_per,
        input_qty: sz.input_qty,
        output_qty: sz.output_qty,
        rej_qty: sz.rej_qty,
        rework_qty: sz.rework_qty,
        checked_qty: sz.checked_qty,
        balance_input: sz.balance_input ?? sz.balance_to_input,
        input_per: sz['input%'] ?? sz.input_per,
        output_per: sz['output%'] ?? sz.output_per,
        wip: sz.wip ?? sz.wip_qty,
        rework_per: sz['rework%'] ?? sz.rework_per,
        rej_per: sz['rej%'] ?? sz.rej_per,
        total_defect: sz.total_defect,
        tls_open: sz.tls_open ?? order.tls_open ?? (rec as any).tls_open,
        tls_closed: sz.tls_closed ?? order.tls_closed ?? (rec as any).tls_closed,
        total_tls_issues: sz.total_tls_issue ?? sz.total_tls_issues ?? order.total_tls_issue ?? order.total_tls_issues ?? (rec as any).total_tls_issues ?? (rec as any).total_tls_issue,
        dhu_per: sz['dhu%'] ?? sz.dhu_per,
      })
    })
  })

  return rows
}

interface OrderSummaryListProps {
  onDataLoaded?: (exportExcel: () => void, exportPdf: () => void, exporting: boolean) => void
}

export default function OrderSummaryList({ onDataLoaded }: OrderSummaryListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const [selectedBranch, setSelectedBranch] = useState(() => (!isAdmin && userBranchId ? String(userBranchId) : ''))
  const effectiveBranchId = !isAdmin && userBranchId ? String(userBranchId) : selectedBranch

  const { branches } = useDropdownData({ branches: true })
  const [inputValue, setInputValue] = useState('')
  const [searchedOrder, setSearchedOrder] = useState('')
  const [rows, setRows] = useState<OrderSummaryRow[]>([])
  const [totalSummary, setTotalSummary] = useState<any>(null)
  const [orderCount, setOrderCount] = useState(0)
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
    branch_id: effectiveBranchId,
    style_id: '',
    colour: selectedColour.trim(),
    order_no: inputValue.trim(),
    status: '',
  }

  const { handleExport, exporting } = useExport({
    apiPath: '/report/ordersummary',
    payload: exportPayload,
    filename: 'Order_Summary_Report',
  })

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/report/ordersummary',
    payload: exportPayload,
    filename: 'Order_Summary_Report',
  })

  useEffect(() => {
    onDataLoaded?.(handleExport, handleExportPdf, exporting || exportingPdf)
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
          records?: OrderSummaryRecord[]
          total_summary?: any
          pagination?: { total: number | string }
        }
      }>('/report/ordersummary', {
        method: 'POST',
        encrypt: false,
        payload: {
          type: '',
          from_date: '',
          to_date: '',
          branch_id: branchId,
          style_id: '',
          colour: colour.trim(),
          order_no: orderNo.trim(),
          status: '',
        },
      })

      const records = res.data?.records ?? []
      const flattened = flattenRecords(records)
      setRows(flattened)
      setOrderCount(Number(res.data?.total ?? records.length))
      setSizeCount(flattened.length)
      setTotalSummary(res.data?.total_summary ?? (res as any)?.total_summary ?? null)
    } catch (err) {
      console.error('Failed to fetch order summary:', err)
      setRows([])
      setOrderCount(0)
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

  const columns: ReportColumn<OrderSummaryRow>[] = [
    {
      key: 'sno',
      header: 'S.No',
      rowSpan: (r) => r._rowSpan,
      render: (row) => (
        <span className="text-t-body whitespace-nowrap">
          {((row as any)._orderIndex ?? 0) + 1}
        </span>
      ),
      footer: () => <span className="font-bold text-white">Total</span>,
    },
    {
      key: 'buyer',
      header: 'Buyer',
      rowSpan: (r) => r._rowSpan,
      render: (row) =>
        row.buyer ? (
          <span className="text-t-body whitespace-nowrap">
            {row.buyer}
          </span>
        ) : null,
    },
    {
      key: 'style_name',
      header: 'Style Name',
      rowSpan: (r) => r._rowSpan,
      render: (row) =>
        row.style_name ? (
          <span className="text-t-body whitespace-nowrap">{row.style_name}</span>
        ) : null,
    },
    {
      key: 'style_no',
      header: 'Style Number',
      rowSpan: (r) => r._rowSpan,
      render: (row) =>
        row.style_no ? (
          <span className="text-t-body whitespace-nowrap">{row.style_no}</span>
        ) : null,
    },
    {
      key: 'ex_fac_date',
      header: 'Ex-Factory Date',
      rowSpan: (r) => r._rowSpan,
      render: (row) =>
        row.ex_fac_date ? (
          <span className="text-t-body text-xs whitespace-nowrap">{formatDate(row.ex_fac_date)}</span>
        ) : null,
    },
    {
      key: 'days_left',
      header: 'Days Left',
      rowSpan: (r) => r._rowSpan,
      render: (row) => {
        if (row.days_left === undefined || row.days_left === null) return null
        const n = row.days_left
        const color = n < 0 ? 'text-red-500 font-semibold' : 'text-t-body'
        return <span className={`whitespace-nowrap ${color}`}>{n}</span>
      },
    },
    {
      key: 'order_no',
      header: 'Order No',
      rowSpan: (r) => r._rowSpan,
      render: (row) =>
        row.order_no ? (
          <span className="text-t-body whitespace-nowrap">{row.order_no}</span>
        ) : null,
    },
    {
      key: 'colour',
      header: 'Colour',
      rowSpan: (r) => r._rowSpan,
      render: (row) =>
        row.colour ? (
          <span className="text-t-body whitespace-nowrap">{row.colour}</span>
        ) : null,
    },

    {
      key: 'size',
      header: 'Size',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-card-alt border border-input-line text-t-primary uppercase">
          {fmt(row.size)}
        </span>
      ),
    },
    {
      key: 'ord_qty',
      header: 'Order Qty',
      render: (row) => (
        <span className="text-t-body">{fmtNum(row.ord_qty).toLocaleString()}</span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.ord_qty !== undefined && totalSummary?.ord_qty !== null ? fmtNum(totalSummary.ord_qty).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'prod_per',
      header: 'Prod Order%',
      render: (row) => <span className="text-t-body">{fmt(row.prod_per)}</span>,
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.['prod%'] ?? totalSummary?.prod_per ?? '—'}
        </span>
      ),
    },
    {
      key: 'prod_qty',
      header: 'Prod Qty',
      render: (row) => (
        <span className="text-t-body">{fmtNum(row.prod_qty).toLocaleString()}</span>
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
        <span className="text-t-body">{fmtNum(row.input_qty).toLocaleString()}</span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.input_qty !== undefined && totalSummary?.input_qty !== null ? fmtNum(totalSummary.input_qty).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'balance_input',
      header: 'Bal to Input',
      render: (row) => (
        <span className="text-t-body">{fmtNum(row.balance_input).toLocaleString()}</span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.balance_input !== undefined || totalSummary?.balance_to_input !== undefined
            ? fmtNum(totalSummary.balance_input ?? totalSummary.balance_to_input).toLocaleString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'input_per',
      header: 'Input%',
      render: (row) => <span className="text-t-body">{fmt(row.input_per)}</span>,
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
        <span className="text-t-body">{fmtNum(row.output_qty).toLocaleString()}</span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.output_qty !== undefined && totalSummary?.output_qty !== null ? fmtNum(totalSummary.output_qty).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'output_per',
      header: 'Output%',
      render: (row) => <span className="text-t-body">{fmt(row.output_per)}</span>,
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
        <span className="text-t-body">
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
        <span className="text-t-body">{fmtNum(row.checked_qty).toLocaleString()}</span>
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
        <span className="text-t-body">
          {fmtNum(row.rework_qty).toLocaleString()}
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
      header: 'Rework%',
      render: (row) => <span className="text-t-body">{fmt(row.rework_per)}</span>,
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
        <span className="text-t-body">
          {fmtNum(row.rej_qty).toLocaleString()}
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
      header: 'Rej%',
      render: (row) => <span className="text-t-body">{fmt(row.rej_per)}</span>,
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.['rej%'] ?? totalSummary?.rej_per ?? '—'}
        </span>
      ),
    },
    {
      key: 'total_defect',
      header: 'Total Defect',
      render: (row) => (
        <span className="text-t-body">
          {row.total_defect !== undefined && row.total_defect !== null ? row.total_defect : '—'}
        </span>
      ),
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.total_defect !== undefined && totalSummary?.total_defect !== null ? fmtNum(totalSummary.total_defect).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'dhu_per',
      header: 'DHU%',
      render: (row) => <span className="text-t-body">{fmt(row.dhu_per)}</span>,
      footer: () => (
        <span className="font-bold text-white">
          {totalSummary?.['dhu%'] ?? totalSummary?.dhu_per ?? '—'}
        </span>
      ),
    },
    {
      key: 'tls_open',
      header: 'TLS Open',
      rowSpan: (r) => r._rowSpan,
      render: (row) =>
        row.tls_open !== undefined && row.tls_open !== null ? (
          <span className="text-t-body">
            {row.tls_open}
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
      rowSpan: (r) => r._rowSpan,
      render: (row) =>
        row.tls_closed !== undefined && row.tls_closed !== null ? (
          <span className="text-t-body">
            {row.tls_closed}
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
      rowSpan: (r) => r._rowSpan,
      render: (row) =>
        row.total_tls_issues !== undefined && row.total_tls_issues !== null ? (
          <span className="text-t-body">
            {row.total_tls_issues}
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
          <ReportTable<OrderSummaryRow>
            columns={columns}
            data={rows}
            loading={loading}
            rowKey={(r) => r._rowId}
            totalCount={orderCount}
            emptyMessage={`No records found for order "${searchedOrder}"${selectedColour ? ` (Colour: ${selectedColour})` : ''}`}
            countLabel="order"
            countLabelPlural="orders"
            countSuffix={`| Total Size records: ${sizeCount}`}
          />
        </div>
      )}
    </div>
  )
}
