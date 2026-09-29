'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import PageHeader from '@/components/ui/PageHeader'
import AdvancedTable, { type AdvancedColumn } from '@/components/ui/AdvancedTable'
import Badge from '@/components/ui/Badge'
import Toolbar from '@/components/ui/Toolbar'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'
import { usePermissions } from '@/hooks/usePermissions'
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

function formatCheckinDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function formatTime(isoStr?: string | null): string {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return isoStr
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  } catch {
    return isoStr
  }
}

function formatArrayVal(val: any): string {
  if (Array.isArray(val)) {
    return val.filter(Boolean).join(', ') || '—'
  }
  return val !== null && val !== undefined && val !== '' ? String(val) : '—'
}

export interface OperatorCheckinRecord {
  id?: number
  uuid?: string
  user_id?: number
  user_name?: string
  emp_code?: string
  line_id?: number[] | number
  line_name?: string[] | string
  zone_id?: number[] | number
  zone_name?: string[] | string
  shift_id?: number
  shift_name?: string
  checkin_date?: string
  start_time?: string
  end_time?: string | null
  status?: number
  is_active?: number
  created_by?: number
  updated_by?: number | null
  created_at?: string
  updated_at?: string
  branch_id?: string | number
  branch_name?: string
  branch_code?: string
  team_id?: string | number
  team_name?: string
  rfid?: string
  tls_id?: number | string
  machine_id?: number | string
  machine_details?: {
    id?: number
    machine_no?: string
    [key: string]: any
  }
  source_table?: string
  [key: string]: any
}

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'emp_code', label: 'Emp Code' },
  { key: 'user_name', label: 'Employee Name' },
  { key: 'branch_name', label: 'Branch' },
  { key: 'shift_name', label: 'Shift' },
  { key: 'team_name', label: 'Team' },
  { key: 'line_name', label: 'Line' },
  { key: 'zone_name', label: 'Zone' },
  { key: 'checkin_date', label: 'Checkin Date' },
  { key: 'start_time', label: 'Start Time' },
  { key: 'end_time', label: 'End Time' },
  { key: 'status', label: 'Status' },
  { key: 'rfid', label: 'RFID' },
  { key: 'tls_id', label: 'TLS ID' },
  { key: 'machine_no', label: 'Machine No' },
]

export default function OperatorCheckinListPage() {
  const { can } = usePermissions('Attendance')
  const canList = can('operatorcheckinlist')
  const canExport = can('operatorcheckinlist')

  const [records, setRecords] = useState<OperatorCheckinRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState<string>(() => getTodayDateString())
  const [toDate, setToDate] = useState<string>(() => getTodayDateString())
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [selected, setSelected] = useState<string[]>([])

  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const [branchFilter, setBranchFilter] = useState(() => (!isAdmin && userBranchId ? String(userBranchId) : ''))
  const effectiveBranchId = !isAdmin && userBranchId ? String(userBranchId) : branchFilter

  const { branches } = useDropdownData({
    branches: true,
    branchId: effectiveBranchId,
  })

  useEffect(() => {
    if (!isAdmin && userBranchId && !branchFilter) {
      setBranchFilter(String(userBranchId))
    }
  }, [userBranchId, isAdmin, branchFilter])

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
      className="inline-flex items-center gap-1.5 cursor-pointer"
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

  const exportPayload = {
    search,
    page: '1',
    per_page: '10000',
    date_from: fromDate,
    date_to: toDate || fromDate,
    from_date: fromDate,
    to_date: toDate || fromDate,
    ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
  }

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/report/operatorcheckinlist',
    payload: exportPayload,
    filename: 'operator_checkin_list',
  })

  const { handleExport, exporting } = useExport<OperatorCheckinRecord>({
    apiPath: '/report/operatorcheckinlist',
    payload: exportPayload,
    dataKey: 'data.records',
    columns: [
      { key: 'emp_code', header: 'Emp Code', value: (r) => r.emp_code || '' },
      { key: 'user_name', header: 'Employee Name', value: (r) => r.user_name || '' },
      { key: 'branch_name', header: 'Branch', value: (r) => r.branch_name || '' },
      { key: 'shift_name', header: 'Shift', value: (r) => r.shift_name || '' },
      { key: 'team_name', header: 'Team', value: (r) => r.team_name || '' },
      { key: 'line_name', header: 'Line', value: (r) => formatArrayVal(r.line_name) },
      { key: 'zone_name', header: 'Zone', value: (r) => formatArrayVal(r.zone_name) },
      { key: 'checkin_date', header: 'Checkin Date', value: (r) => formatCheckinDate(r.checkin_date) },
      { key: 'start_time', header: 'Start Time', value: (r) => formatTime(r.start_time) },
      { key: 'end_time', header: 'End Time', value: (r) => formatTime(r.end_time) },
      { key: 'status', header: 'Status', value: (r) => (r.status === 1 || r.is_active === 1 ? 'Active' : 'Inactive') },
      { key: 'rfid', header: 'RFID', value: (r) => r.rfid || '' },
      { key: 'tls_id', header: 'TLS ID', value: (r) => r.tls_id || '' },
      { key: 'machine_no', header: 'Machine No', value: (r) => r.machine_details?.machine_no || '' },
    ],
    filename: 'operator_checkin_list',
    method: 'POST',
  })

  const fetchData = useCallback(async () => {
    if (!canList) {
      setLoading(false)
      setRecords([])
      return
    }
    setLoading(true)
    try {
      const res = await apiCall<{
        success?: boolean
        message?: string
        data?: {
          total?: number
          page?: number
          limit?: number
          records?: OperatorCheckinRecord[]
          data?: OperatorCheckinRecord[]
          pagination?: { total: number; total_pages: number }
        }
      }>('/report/operatorcheckinlist', {
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

      const recs = res.data?.records ?? res.data?.data ?? (Array.isArray(res.data) ? res.data : [])
      const total = res.data?.total ?? res.data?.pagination?.total ?? recs.length
      const totalP = res.data?.limit ? Math.ceil(total / res.data.limit) : (res.data?.pagination?.total_pages ?? (Math.ceil(total / perPage) || 1))

      setRecords(recs)
      setTotalCount(total)
      setTotalPages(totalP)
    } catch (error) {
      console.error('Failed to fetch operator checkin list:', error)
      setRecords([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [search, page, perPage, effectiveBranchId, fromDate, toDate, canList])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const paginatedData = useMemo(() => {
    if (records.length <= perPage) return records
    const start = (page - 1) * perPage
    return records.slice(start, start + perPage)
  }, [records, page, perPage])

  if (!canList) {
    return (
      <AppLayout fixedHeight>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <h2 className="text-xl font-semibold text-t-primary mb-2">Access Restricted</h2>
          <p className="text-sm text-t-secondary max-w-md">
            You do not have permission to view the Operator Checkin List. Please contact your administrator.
          </p>
        </div>
      </AppLayout>
    )
  }

  const columns: AdvancedColumn<OperatorCheckinRecord>[] = [
    {
      key: '#',
      header: (
        <div
          className="inline-flex items-center gap-1.5 cursor-pointer"
          title="Select all column headings for export"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={allHeadingsSelected}
            onChange={toggleAllHeadings}
            className="w-3.5 h-3.5 rounded accent-accent cursor-pointer"
          />
          <span>#</span>
        </div>
      ),
      render: (_: OperatorCheckinRecord, i: number) => (
        <span className="text-t-lighter text-xs font-mono font-medium">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'emp_code',
      header: renderHeader('emp_code', 'Emp Code'),
      sortable: true,
      sortValue: (row) => row.emp_code || '',
      render: (row) => (
        <span className="text-sm font-mono text-t-primary">{row.emp_code || '—'}</span>
      ),
    },
    {
      key: 'user_name',
      header: renderHeader('user_name', 'Employee Name'),
      sortable: true,
      sortValue: (row) => row.user_name || '',
      render: (row) => (
        <span className="text-sm font-semibold text-t-primary">{row.user_name || '—'}</span>
      ),
    },
    {
      key: 'branch_name',
      header: renderHeader('branch_name', 'Branch'),
      sortable: true,
      sortValue: (row) => row.branch_name || '',
      render: (row) => (
        <span className="text-sm text-t-secondary">{row.branch_name || '—'}</span>
      ),
    },
    {
      key: 'shift_name',
      header: renderHeader('shift_name', 'Shift'),
      sortable: true,
      sortValue: (row) => row.shift_name || '',
      render: (row) => (
        <span className="text-sm text-t-body">{row.shift_name || '—'}</span>
      ),
    },
    {
      key: 'team_name',
      header: renderHeader('team_name', 'Team'),
      sortable: true,
      sortValue: (row) => row.team_name || '',
      render: (row) => (
        <span className="text-sm text-t-secondary font-medium">{row.team_name || '—'}</span>
      ),
    },
    {
      key: 'line_name',
      header: renderHeader('line_name', 'Line'),
      sortable: true,
      sortValue: (row) => formatArrayVal(row.line_name),
      render: (row) => (
        <span className="text-sm font-medium text-t-primary">{formatArrayVal(row.line_name)}</span>
      ),
    },
    {
      key: 'zone_name',
      header: renderHeader('zone_name', 'Zone'),
      sortable: true,
      sortValue: (row) => formatArrayVal(row.zone_name),
      render: (row) => (
        <span className="text-sm text-t-secondary">{formatArrayVal(row.zone_name)}</span>
      ),
    },
    {
      key: 'checkin_date',
      header: renderHeader('checkin_date', 'Checkin Date'),
      sortable: true,
      sortValue: (row) => row.checkin_date || '',
      render: (row) => (
        <span className="text-sm text-t-secondary whitespace-nowrap">{formatCheckinDate(row.checkin_date)}</span>
      ),
    },
    {
      key: 'start_time',
      header: renderHeader('start_time', 'Start Time'),
      sortable: true,
      sortValue: (row) => row.start_time || '',
      render: (row) => (
        <span className="text-xs font-mono text-t-secondary whitespace-nowrap">{formatTime(row.start_time)}</span>
      ),
    },
    {
      key: 'end_time',
      header: renderHeader('end_time', 'End Time'),
      sortable: true,
      sortValue: (row) => row.end_time || '',
      render: (row) => (
        <span className="text-xs font-mono text-t-secondary whitespace-nowrap">{formatTime(row.end_time)}</span>
      ),
    },
    {
      key: 'status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      sortValue: (row) => row.status ?? row.is_active ?? 0,
      render: (row) => (
        <Badge variant={row.status === 1 || row.is_active === 1 ? 'success' : 'default'}>
          {row.status === 1 || row.is_active === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'rfid',
      header: renderHeader('rfid', 'RFID'),
      sortable: true,
      sortValue: (row) => row.rfid || '',
      render: (row) => (
        <span className="font-mono text-xs text-t-body">
          {row.rfid || '—'}
        </span>
      ),
    },
    {
      key: 'tls_id',
      header: renderHeader('tls_id', 'TLS ID'),
      sortable: true,
      sortValue: (row) => String(row.tls_id || ''),
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-accent">{row.tls_id ?? '—'}</span>
      ),
    },
    {
      key: 'machine_no',
      header: renderHeader('machine_no', 'Machine No'),
      sortable: true,
      sortValue: (row) => row.machine_details?.machine_no || '',
      render: (row) => (
        <span className="text-sm text-t-secondary font-mono">
          {row.machine_details?.machine_no || '—'}
        </span>
      ),
    },
  ]

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Operator Checkin List"
        description="Real-time list of operator check-ins, line allocations, and session times"
      />

      <AdvancedTable<OperatorCheckinRecord>
        header={
          <Toolbar
            title="All Operator Check-ins"
            search={search}
            onSearchChange={(val) => {
              setSearch(val)
              setPage(1)
            }}
            onExport={canExport ? handleExport : undefined}
            onExportPdf={canExport ? handleExportPdf : undefined}
            exporting={exporting || exportingPdf}
          >
            {isAdmin && (
              <select
                value={effectiveBranchId}
                onChange={(e) => {
                  setBranchFilter(e.target.value)
                  setPage(1)
                }}
                className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
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
              onChange={(start: string, end: string) => {
                setFromDate(start)
                setToDate(end)
                setPage(1)
              }}
            />
          </Toolbar>
        }
        columns={columns}
        data={paginatedData}
        loading={loading}
        emptyMessage="No operator check-in records found."
        rowKey={(row) => String(row.id || row.uuid || `${row.user_id}_${row.start_time}`)}
        selectable
        selected={selected}
        onSelectionChange={setSelected}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(pp: number) => {
          setPerPage(pp)
          setPage(1)
        }}
        countLabel="operator check-in"
        countLabelPlural="operator check-ins"
      />
    </AppLayout>
  )
}
