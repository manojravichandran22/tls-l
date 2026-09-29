'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import PageHeader from '@/components/ui/PageHeader'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'
import Toolbar from '@/components/ui/Toolbar'
import { MoreVertical } from 'lucide-react'
import { useSortableData } from '@/hooks/useSortableData'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useExport } from '@/hooks/useExport'
import DateRangePicker from '@/components/ui/DateRangePicker'

function getTodayDateString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface LineMappingRecord {
  id?: number | string
  uuid?: string
  seq_no?: number | null
  line_id?: number | null
  line_name?: string | null
  order_id?: number | null
  order_code?: string | null
  order_no?: string | null
  buyer?: string | null
  buyer_name?: string | null
  colour?: string | null
  style_id?: number | null
  style_name?: string | null
  style_no?: string | null
  style_number?: string | null
  machine_id?: number | null
  machine_name?: string | null
  machine_type?: string | null
  brand?: string | null
  model_no?: string | null
  operation_id?: number | null
  operation_name?: string | null
  work_station?: number | string | null
  work_station_name?: string | null
  tls_id?: string | number | null
  branch_id?: number | string | null
  branch_name?: string | null
  branch?: { id: number; branch_name: string }
  status?: number | string | null
  is_active?: number | string | null
  [key: string]: any
}

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'branch_name', label: 'Branch' },
  { key: 'line_name', label: 'Line' },
  { key: 'buyer', label: 'Buyer' },
  { key: 'style_name', label: 'Style name' },
  { key: 'style_number', label: 'Style number' },
  { key: 'order_no', label: 'Order' },
  { key: 'colour', label: 'Colour' },
  { key: 'operation_name', label: 'Operation' },
  { key: 'tls_id', label: 'Device ID' },
  { key: 'machine_name', label: 'Machine' },
  { key: 'status', label: 'Status' },
]

function formatExportHeadings(headings: string[]): string[] {
  return headings
}

export default function LineMappingPage() {
  const [records, setRecords] = useState<LineMappingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState<string>(() => getTodayDateString())
  const [toDate, setToDate] = useState<string>(() => getTodayDateString())
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [branchFilter, setBranchFilter] = useState('')
  const { can } = usePermissions('MobilelinemappingList')
  const canList = can('Mobilelinemapping.list')

  const { branchId, isAdmin } = useBranchAccess()
  const { branches } = useDropdownData({ branches: true })

  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : branchFilter

  const { sortedData, sortState, setSortState } = useSortableData(records)

  // Column checkbox heading state for export
  const [selectedHeadings, setSelectedHeadings] = useState<string[]>(
    HEADING_OPTIONS.map((h) => h.key)
  )

  const toggleHeading = (key: string) => {
    setSelectedHeadings((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const allHeadingsSelected = selectedHeadings.length === HEADING_OPTIONS.length
  const toggleAllHeadings = () => {
    setSelectedHeadings(allHeadingsSelected ? [] : HEADING_OPTIONS.map((h) => h.key))
  }

  const renderHeader = (key: string, label: string) => (
    <div
      className="inline-flex items-center gap-1.5 cursor-pointer select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={selectedHeadings.includes(key)}
        onChange={() => toggleHeading(key)}
        className="w-3.5 h-3.5 rounded accent-accent cursor-pointer"
        title={`Include ${label} in export`}
      />
      <span>{label}</span>
    </div>
  )

  // Export PDF & Excel
  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/mappingline/list',
    payload: {
      search,
      status: 'active',
      date_from: fromDate,
      date_to: toDate || fromDate,
      from_date: fromDate,
      to_date: toDate || fromDate,
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      check_box_heading: selectedHeadings,
    },
    filename: 'line_mapping_list',
  })

  const { handleExport: handleExportExcel, exporting: exportingExcel } = useExport({
    apiPath: '/mappingline/list',
    payload: {
      search,
      status: 'active',
      date_from: fromDate,
      date_to: toDate || fromDate,
      from_date: fromDate,
      to_date: toDate || fromDate,
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      check_box_heading: selectedHeadings,
      type: 'excel',
    },
    filename: 'line_mapping_list',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{
        data?: {
          tlsSummary?: Array<{
            tls_id: string
            order_count: number
            orders: LineMappingRecord[]
          }>
          data?: LineMappingRecord[]
          pagination?: { total: number; total_pages: number }
        }
      }>('/mappingline/list', {
        method: 'POST',
        encrypt: false,
        payload: {
          search,
          page: String(page),
          per_page: String(perPage),
          date_from: fromDate,
          date_to: toDate || fromDate,
          from_date: fromDate,
          to_date: toDate || fromDate,
          ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
        },
      })

      const summary = res.data?.tlsSummary ?? (res.data as any)?.data?.tlsSummary
      const list = res.data?.data ?? (res.data as any)?.records ?? (res as any)?.data
      let flatRows: LineMappingRecord[] = []

      if (Array.isArray(summary)) {
        let groupIdx = 0
        summary.forEach((item) => {
          const orders = item.orders || []
          const count = orders.length
          groupIdx += 1
          if (count === 0) {
            flatRows.push({
              tls_id: item.tls_id,
              _tlsRowSpan: 1,
              _isFirstTlsRow: true,
              _tlsGroupIndex: groupIdx,
            })
          } else {
            orders.forEach((o: LineMappingRecord, idx: number) => {
              flatRows.push({
                ...o,
                tls_id: o.tls_id || item.tls_id,
                _tlsRowSpan: idx === 0 ? count : 0,
                _isFirstTlsRow: idx === 0,
                _tlsGroupIndex: groupIdx,
              })
            })
          }
        })
      } else if (Array.isArray(list)) {
        flatRows = list.map((item, idx) => ({
          ...item,
          _tlsRowSpan: 1,
          _isFirstTlsRow: true,
          _tlsGroupIndex: idx + 1,
        }))
      }

      setRecords(flatRows)
      setTotalCount(res.data?.pagination?.total ?? flatRows.length)
      setTotalPages(res.data?.pagination?.total_pages ?? 1)
    } catch (error) {
      console.error('Failed to fetch line mapping list:', error)
      setRecords([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [search, page, perPage, effectiveBranchId, fromDate, toDate])

  useEffect(() => {
    if (canList) {
      fetchData()
    }
  }, [fetchData, canList])

  const columns = [
    {
      key: 's_no',
      header: (
        <div
          className="inline-flex items-center gap-1.5 cursor-pointer select-none"
          title="Select all column headings for export"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={allHeadingsSelected}
            onChange={toggleAllHeadings}
            className="w-3.5 h-3.5 rounded accent-accent cursor-pointer"
          />
          <span>S.no</span>
        </div>
      ),
      sortable: false,
      render: (row: LineMappingRecord, index: number) => (
        <span className="text-t-lighter font-mono font-medium">
          {row._tlsGroupIndex !== undefined ? (page - 1) * perPage + row._tlsGroupIndex : (page - 1) * perPage + index + 1}
        </span>
      ),
    },
    {
      key: 'branch_name',
      header: renderHeader('branch_name', 'Branch'),
      sortable: true,
      render: (row: LineMappingRecord) => (
        <span className="text-sm text-t-secondary">{row.branch_name ?? row.branch?.branch_name ?? '—'}</span>
      ),
    },
    {
      key: 'line_name',
      header: renderHeader('line_name', 'Line'),
      sortable: true,
      render: (row: LineMappingRecord) => (
        <span className="text-sm font-medium text-t-primary">{row.line_name || '—'}</span>
      ),
    },
    {
      key: 'buyer',
      header: renderHeader('buyer', 'Buyer'),
      sortable: true,
      render: (row: LineMappingRecord) => (
        <span className="text-sm text-t-secondary font-medium">{row.buyer || row.buyer_name || '—'}</span>
      ),
    },
    {
      key: 'style_name',
      header: renderHeader('style_name', 'Style name'),
      sortable: true,
      render: (row: LineMappingRecord) => (
        <span className="text-sm text-t-secondary">{row.style_name || '—'}</span>
      ),
    },
    {
      key: 'style_number',
      header: renderHeader('style_number', 'Style number'),
      sortable: true,
      render: (row: LineMappingRecord) => (
        <span className="text-sm text-t-secondary font-mono">{row.style_number || row.style_no || '—'}</span>
      ),
    },
    {
      key: 'order_no',
      header: renderHeader('order_no', 'Order'),
      sortable: true,
      render: (row: LineMappingRecord) => (
        <span className="text-sm font-medium text-t-primary">{row.order_no || row.order_code || '—'}</span>
      ),
    },
    {
      key: 'colour',
      header: renderHeader('colour', 'Colour'),
      sortable: true,
      render: (row: LineMappingRecord) => (
        <div className="flex items-center gap-2">
          {row.colour && (
            <div
              className="w-3 h-3 rounded-full border border-gray-200"
              style={{ backgroundColor: row.colour.toLowerCase() }}
            />
          )}
          <span className="text-sm text-t-secondary capitalize">{row.colour || '—'}</span>
        </div>
      ),
    },
    {
      key: 'operation_name',
      header: renderHeader('operation_name', 'Operation'),
      sortable: true,
      render: (row: LineMappingRecord) => (
        <span className="text-sm text-t-secondary font-medium">{row.operation_name || '—'}</span>
      ),
    },
    {
      key: 'tls_id',
      header: renderHeader('tls_id', 'Device ID'),
      sortable: true,
      render: (row: LineMappingRecord) => (
        <span className="font-mono text-xs font-semibold text-accent">{row.tls_id ?? '—'}</span>
      ),
    },
    {
      key: 'machine_name',
      header: renderHeader('machine_name', 'Machine'),
      sortable: true,
      render: (row: LineMappingRecord) => (
        <span className="text-sm text-t-secondary">{row.machine_name || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      render: (row: LineMappingRecord) => (
        <Badge variant={row.is_active === 1 || row.status === 1 || String(row.status).toLowerCase() === 'active' ? 'success' : 'default'}>
          {row.is_active === 1 || row.status === 1 || String(row.status).toLowerCase() === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      sortable: false,
      render: () => (
        <button
          type="button"
          className="w-7 h-7 flex items-center justify-center rounded text-t-lighter hover:text-t-body hover:bg-card-alt transition-colors cursor-pointer"
        >
          <MoreVertical size={15} />
        </button>
      ),
    },
  ]

  if (!canList) {
    return null
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <PageHeader
          title="Line Mapping List"
          description="View and track line mapping records"
        />

        <Toolbar
          title="All Mappings"
          search={search}
          onSearchChange={(val) => { setSearch(val); setPage(1) }}
          onExport={() => handleExportExcel({ check_box_heading: selectedHeadings, date_from: fromDate, date_to: toDate })}
          onExportPdf={handleExportPdf}
          exporting={exportingExcel || exportingPdf}
        >
          {isAdmin && (
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value)
                setPage(1)
              }}
              className="h-8.5 px-3 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20 w-36 sm:w-40 shrink-0"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          )}

          <DateRangePicker
            startDate={fromDate}
            endDate={toDate}
            onChange={(start, end) => {
              setFromDate(start)
              setToDate(end)
              setPage(1)
            }}
          />
        </Toolbar>

        <DataTable
          columns={columns}
          data={sortedData}
          sortState={sortState}
          onSortChange={setSortState}
          loading={loading}
          emptyMessage="No line mapping records found"
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          countLabel="record"
        />
      </div>
    </AppLayout>
  )
}

