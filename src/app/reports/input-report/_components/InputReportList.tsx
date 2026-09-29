'use client'

import Toolbar from '@/components/ui/Toolbar'
import ReportTable, { type ReportColumn } from '@/components/ui/ReportTable'
import Badge from '@/components/ui/Badge'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { type LineInputRecord } from '../types'
import { type BranchOption, type ShiftOption, type TeamOption } from '@/hooks/useDropdownData'
import { useExport } from '@/hooks/useExport'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useBranchAccess } from '@/hooks/useBranchAccess'

function formatDateOnly(val?: string): string {
  if (!val) return '—'
  const trimmed = String(val).trim()
  if (!trimmed) return '—'

  // Handle ISO string e.g. "2026-07-31T01:02:27.047Z" or formatted "31/07/2026, 12:02 pm"
  const datePart = trimmed.split(/[\s,T]+/)[0]
  if (!datePart) return '—'

  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(datePart)) {
    const parts = datePart.split(/[\/\-]/)
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    const year = parts[2]
    return `${day}/${month}/${year}`
  }

  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(datePart)) {
    const parts = datePart.split(/[\/\-]/)
    const year = parts[0]
    const month = parts[1].padStart(2, '0')
    const day = parts[2].padStart(2, '0')
    return `${day}/${month}/${year}`
  }

  return datePart
}

interface InputReportListProps {
  records: LineInputRecord[]
  loading: boolean
  search: string
  branchFilter: string
  teamFilter: string
  shiftFilter: string
  fromDate: string
  toDate: string
  statusFilter: string
  returnFilter: string
  totalCount: number
  branches: BranchOption[]
  teams: TeamOption[]
  shifts: ShiftOption[]
  onSearchChange: (val: string) => void
  onBranchFilterChange: (val: string) => void
  onTeamFilterChange: (val: string) => void
  onShiftFilterChange: (val: string) => void
  onDateRangeChange: (start: string, end: string) => void
  onStatusFilterChange: (val: string) => void
  onReturnFilterChange: (val: string) => void
}

export default function InputReportList({
  records,
  loading,
  search,
  branchFilter,
  teamFilter,
  shiftFilter,
  fromDate,
  toDate,
  statusFilter,
  returnFilter,
  totalCount,
  branches,
  teams,
  shifts,
  onSearchChange,
  onBranchFilterChange,
  onTeamFilterChange,
  onShiftFilterChange,
  onDateRangeChange,
  onStatusFilterChange,
  onReturnFilterChange,
}: InputReportListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()

  // Client-side filter by is_return
  const filteredRecords = returnFilter === 'all' || !returnFilter
    ? records
    : records.filter((r) => {
      const val = String(r.is_return || 'Input').toLowerCase()
      return val === returnFilter.toLowerCase()
    })

  const exportPayload = {
    search,
    branch_id: branchFilter,
    team_id: teamFilter,
    shift_id: shiftFilter,
    date: fromDate,
    date_from: fromDate,
    date_to: toDate || fromDate,
    from_date: fromDate,
    to_date: toDate || fromDate,
    status: statusFilter === 'all' ? '' : statusFilter,
    line_id: '',
    color: 'all',
    type: returnFilter === 'all' ? '' : returnFilter,
    order_id: '',
    style_id: '',
    page: '1',
    per_page: '10000',
  }

  const { handleExport, exporting } = useExport<LineInputRecord>({
    apiPath: '/webinputmodule/list',
    payload: exportPayload,
    dataKey: 'data',
    method: 'POST',
    columns: [
      { key: 'line_name', header: 'Line Name', value: (r) => r.line_name || r.line?.line_name || '—' },
      { key: 'branch_name', header: 'Branch', value: (r) => r.branch_name || r.branch?.branch_name || '—' },
      { key: 'shift_name', header: 'Shift', value: (r) => r.shift_name || r.shift?.shift_name || '—' },
      { key: 'team_name', header: 'Team', value: (r) => r.team_name || r.team?.team_name || '—' },
      { key: 'buyer', header: 'Buyer', value: (r) => r.buyer || r.buyer_name || r.style?.buyer_name || '—' },
      { key: 'style_name', header: 'Style Name', value: (r) => r.style_name || r.style?.style_name || '—' },
      { key: 'style_number', header: 'Style No', value: (r) => r.style_number || r.style_no || r.style_code || r.style?.style_number || '—' },
      { key: 'order_no', header: 'Order No', value: (r) => r.order_no || r.order_code || r.order?.order_number || '—' },
      { key: 'color', header: 'Color', value: (r) => r.color || '—' },
      { key: 'size', header: 'Size', value: (r) => r.size || '—' },
      { key: 'balance_qty', header: 'Balance Qty', value: (r) => String(r.balance_qty ?? 0) },
      { key: 'input_qty', header: 'Input Qty', value: (r) => String(r.input_qty ?? r.quantity ?? r.pcs_count ?? 0) },
      { key: 'is_return', header: 'Is Return', value: (r) => String(r.is_return || 'Input') },
      { key: 'date', header: 'Date', value: (r) => formatDateOnly(r.date_time || r.date || r.created_at) },
      { key: 'status', header: 'Status', value: (r) => String(r.status || 'Active') },
    ],
    filename: 'Input_Report',
  })

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/webinputmodule/list',
    payload: exportPayload,
    filename: 'Input_Report',
  })

  const columns: ReportColumn<LineInputRecord>[] = [
    {
      key: 'index',
      header: 'S.No',
      render: (_: LineInputRecord, i: number) => (
        <span className="text-t-primary font-medium">{i + 1}</span>
      ),
      footer: () => <span className="font-bold text-white">Total</span>,
    },
    {
      key: 'branch_name',
      header: 'Branch',
      sortable: true,
      sortValue: (row) => row.branch_name || row.branch?.branch_name || '',
      render: (row) => (
        <span className="text-t-body font-medium whitespace-nowrap">
          {row.branch_name || row.branch?.branch_name || '—'}
        </span>
      ),
    },
      {
      key: 'shift_name',
      header: 'Shift',
      sortable: true,
      sortValue: (row) => row.shift_name || row.shift?.shift_name || '',
      render: (row) => (
        <span className="text-t-primary font-semibold whitespace-nowrap">
          {row.shift_name || row.shift?.shift_name || '—'}
        </span>
      ),
    },
    {
      key: 'line_name',
      header: 'Line ',
      sortable: true,
      sortValue: (row) => row.line_name || row.line?.line_name || '',
      render: (row) => (
        <span className="text-[#0d939d] dark:text-[#2dd4bf] font-semibold">
          {row.line_name || row.line?.line_name || '—'}
        </span>
      ),
    },
    {
      key: 'team_name',
      header: 'Team',
      sortable: true,
      sortValue: (row) => row.team_name || row.team?.team_name || '',
      render: (row) => (
        <span className="text-t-body font-medium">
          {row.team_name || row.team?.team_name || '—'}
        </span>
      ),
    },
    {
      key: 'buyer',
      header: 'Buyer',
      sortable: true,
      sortValue: (row) => row.buyer || row.buyer_name || row.style?.buyer_name || '',
      render: (row) => (
        <span className="text-t-body font-medium whitespace-nowrap">
          {row.buyer || row.buyer_name || row.style?.buyer_name || '—'}
        </span>
      ),
    },
    {
      key: 'style_name',
      header: 'Style Name', 
      sortable: true,
      sortValue: (row) => row.style_name || row.style?.style_name || '',
      render: (row) => (
        <span className="text-t-body font-medium">
          {row.style_name || row.style?.style_name || '—'}
        </span>
      ),
    },
    {
      key: 'style_number',
      header: 'Style No',
      sortable: true,
      sortValue: (row) => row.style_number || row.style_no || row.style_code || row.style?.style_number || '',
      render: (row) => (
        <span className="text-t-body font-medium whitespace-nowrap">
          {row.style_number || row.style_no || row.style_code || row.style?.style_number || '—'}
        </span>
      ),
    },
  
    {
      key: 'order_no',
      header: 'Order No',
      sortable: true,
      sortValue: (row) => row.order_no || row.order_code || row.order?.order_number || '',
      render: (row) => (
        <span className="text-t-body font-medium">
          {row.order_no || row.order_code || row.order?.order_number || '—'}
        </span>
      ),
    },
    
    {
      key: 'color',
      header: 'Color',
      sortable: true,
      sortValue: (row) => row.color || '',
      render: (row) => (
        <span className="text-t-body font-medium">
          {row.color || '—'}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      sortable: true,
      sortValue: (row) => row.size || '',
      render: (row) => (
        <span className="text-t-body font-medium">
          {row.size || '—'}
        </span>
      ),
    },
    // {
    //   key: 'balance_qty',
    //   header: 'Balance Qty',
    //   sortable: true,
    //   sortValue: (row) => Number(row.balance_qty ?? 0),
    //   render: (row) => (
    //     <span className="font-medium text-t-primary">
    //       {row.balance_qty ?? 0}
    //     </span>
    //   ),
    // },
    {
      key: 'input_qty',
      header: 'Input Qty',
      sortable: true,
      sortValue: (row) => Number(row.input_qty ?? row.quantity ?? row.pcs_count ?? 0),
      render: (row) => (
        <span className="font-bold text-t-primary">
          {row.input_qty ?? row.quantity ?? row.pcs_count ?? 0}
        </span>
      ),
      footer: (data) => {
        const inputQty = data
          .filter((r) => String(r.is_return || '').toLowerCase() !== 'return')
          .reduce(
            (sum, r) => sum + Number(r.input_qty ?? r.quantity ?? r.pcs_count ?? 0),
            0
          )
        return <span className="font-bold text-white whitespace-nowrap">Input: {inputQty.toLocaleString()}</span>
      },
    },
    {
      key: 'is_return',
      header: 'Type',
      sortable: true,
      sortValue: (row) => String(row.is_return || ''),
      render: (row) => {
        const isReturn = String(row.is_return || '').toLowerCase() === 'return'
        return isReturn ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
            Return
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#0d939d]/10 text-[#0d939d] dark:text-[#2dd4bf] border border-[#0d939d]/20">
            {row.is_return || 'Input'}
          </span>
        )
      },
      footer: (data) => {
        const returnQty = data
          .filter((r) => String(r.is_return || '').toLowerCase() === 'return')
          .reduce(
            (sum, r) => sum + Number(r.input_qty ?? r.quantity ?? r.pcs_count ?? 0),
            0
          )
        return <span className="font-bold text-white whitespace-nowrap">Return: {returnQty.toLocaleString()}</span>
      },
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      sortValue: (row) => row.date_time || row.date || row.created_at || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap font-medium">
          {formatDateOnly(row.date_time || row.date || row.created_at)}
        </span>
      ),
      footer: (data) => {
        const total = data.reduce(
          (sum, r) => sum + Number(r.input_qty ?? r.quantity ?? r.pcs_count ?? 0),
          0
        )
        return (
          <span className="font-bold text-white whitespace-nowrap">
            Total: {total.toLocaleString()}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (row) => String(row.status ?? ''),
      render: (row) => {
        const isAct = row.status === 1 || row.status === '1' || String(row.status).toLowerCase() === 'active'
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${isAct
            ? 'bg-[#c6f6d5] text-[#22543d] dark:bg-emerald-950/60 dark:text-emerald-300'
            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}>
            {isAct ? 'Active' : String(row.status || 'Inactive')}
          </span>
        )
      },
    },
  ]

  return (
    <ReportTable<LineInputRecord>
      columns={columns}
      data={filteredRecords}
      loading={loading}
      rowKey={(r) => String(r.id)}
      header={
        <Toolbar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search..."
          showExport
          onExport={handleExport}
          onExportPdf={handleExportPdf}
          exporting={exporting || exportingPdf}
        >
          {/* All filters in one nowrap row so Toolbar never wraps them */}
          <div className="flex items-center gap-1.5 flex-nowrap">
            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => onBranchFilterChange(e.target.value)}
              disabled={!isAdmin && Boolean(userBranchId)}
              className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[110px] shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {!(!isAdmin && userBranchId) && <option value="">All Branches</option>}
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
              ))}
            </select>

            {/* Shift Filter */}
            <select
              value={shiftFilter}
              onChange={(e) => onShiftFilterChange(e.target.value)}
              className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[100px] shrink-0"
            >
              <option value="">All Shifts</option>
              {shifts.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.shift_name}</option>
              ))}
            </select>

            {/* Team Filter */}
            <select
              value={teamFilter}
              onChange={(e) => onTeamFilterChange(e.target.value)}
              className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[100px] shrink-0"
            >
              <option value="">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={String(t.id)}>{t.team_name || t.name || `Team ${t.id}`}</option>
              ))}
            </select>

            {/* Date Range Picker */}
            <div className="relative z-[9999] w-[190px] shrink-0">
              <DateRangePicker
                startDate={fromDate}
                endDate={toDate}
                onChange={onDateRangeChange}
              />
            </div>

            {/* Return Type Filter */}
            <select
              value={returnFilter}
              onChange={(e) => onReturnFilterChange(e.target.value)}
              className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[90px] shrink-0"
            >
              <option value="all">All Types</option>
              <option value="Input">Input</option>
              <option value="Return">Return</option>
            </select>

          </div>
        </Toolbar>
      }
      totalCount={filteredRecords.length}
      emptyMessage="No input records found"
      countLabel="input report"
      countLabelPlural="input reports"
    />
  )
}
