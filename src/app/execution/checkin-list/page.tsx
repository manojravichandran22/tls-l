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

function formatDateTime(isoStr?: string | null): string {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return isoStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    return `${day}/${month}/${year} ${time}`
  } catch {
    return isoStr
  }
}

function formatArrayOrString(val: any): string {
  if (Array.isArray(val)) {
    return val.filter(Boolean).join(', ') || '—'
  }
  return val !== null && val !== undefined && val !== '' ? String(val) : '—'
}

export interface CheckinRowRecord {
  id?: number
  uuid?: string
  user_id?: number
  user_name?: string
  emp_id?: number
  emp_code?: string
  employee_name?: string
  line_id?: number[] | number
  line_name?: string[] | string
  zone_id?: number[] | number
  zone_name?: string[] | string
  shift_id?: number
  shift_name?: string
  branch_id?: string | number
  branch_name?: string
  team_id?: string | number
  team_name?: string
  start_time?: string
  end_time?: string | null
  status?: number
  status_name?: string
  is_active?: boolean | number
  created_by?: number
  updated_by?: number | null
  created_at?: string
  updated_at?: string
  source_table?: string
  [key: string]: any
}

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'user_name', label: 'Employee Name' },
  { key: 'emp_code', label: 'Employee Code' },
  { key: 'branch_name', label: 'Branch' },
  { key: 'shift_name', label: 'Shift' },
  { key: 'team_name', label: 'Team' },
  { key: 'line_name', label: 'Line' },
  { key: 'zone_name', label: 'Zone' },
  { key: 'start_time', label: 'Start Time' },
  { key: 'end_time', label: 'End Time' },
  { key: 'status_name', label: 'Status' },
]

export default function CheckinListPage() {
  const { can } = usePermissions('Attendance')
  const canList = can('checkinlist')
  const canExport = can('checkinlist')

  const [records, setRecords] = useState<CheckinRowRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState<string>(() => getTodayDateString())
  const [toDate, setToDate] = useState<string>(() => getTodayDateString())
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [statusFilter, setStatusFilter] = useState('')
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

  const exportPayload = {
    search: search ?? '',
    page: '1',
    per_page: '10000',
    date_from: fromDate,
    date_to: toDate || fromDate,
    from_date: fromDate,
    to_date: toDate || fromDate,
    status: statusFilter,
    ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
  }

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/report/checkinlist',
    payload: exportPayload,
    filename: 'checkin_list',
  })

  const { handleExport, exporting } = useExport<CheckinRowRecord>({
    apiPath: '/report/checkinlist',
    payload: exportPayload,
    dataKey: 'data.rows',
    columns: [
      { key: 'user_name', header: 'Employee Name', value: (r) => r.user_name || '' },
      { key: 'emp_code', header: 'Employee Code', value: (r) => r.emp_code || '' },
      { key: 'branch_name', header: 'Branch', value: (r) => r.branch_name || '' },
      { key: 'shift_name', header: 'Shift', value: (r) => r.shift_name || '' },
      { key: 'team_name', header: 'Team', value: (r) => r.team_name || '' },
      { key: 'line_name', header: 'Line', value: (r) => formatArrayOrString(r.line_name) },
      { key: 'zone_name', header: 'Zone', value: (r) => formatArrayOrString(r.zone_name) },
      { key: 'start_time', header: 'Start Time', value: (r) => formatDateTime(r.start_time) },
      { key: 'end_time', header: 'End Time', value: (r) => formatDateTime(r.end_time) },
      { key: 'status_name', header: 'Status', value: (r) => r.status_name || (r.is_active ? 'Active' : 'Inactive') },
    ],
    filename: 'checkin_list',
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
          rows?: CheckinRowRecord[]
          count?: number
          total?: number
          totalPages?: number
          currentPage?: number
          pageSize?: number
          pagination?: { total: number; total_pages: number }
        }
      }>('/report/checkinlist', {
        method: 'POST',
        encrypt: false,
        payload: {
          type: '',
          branch_id: effectiveBranchId,
          status: statusFilter,
          date_from: fromDate,
          date_to: toDate || fromDate,
        },
      })

      const rows = res.data?.rows ?? (Array.isArray(res.data) ? res.data : [])
      const total = res.data?.count ?? res.data?.total ?? (res.data?.pagination?.total ?? rows.length)

      let filtered = rows
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        filtered = rows.filter((r) =>
          String(r.user_name || '').toLowerCase().includes(q) ||
          String(r.emp_code || '').toLowerCase().includes(q) ||
          String(r.branch_name || '').toLowerCase().includes(q) ||
          String(r.shift_name || '').toLowerCase().includes(q) ||
          String(r.team_name || '').toLowerCase().includes(q) ||
          String(r.line_name || '').toLowerCase().includes(q) ||
          String(r.zone_name || '').toLowerCase().includes(q)
        )
      }

      const totalCountVal = filtered.length > 0 ? (res.data?.count ?? filtered.length) : total
      const calculatedPages = Math.ceil(totalCountVal / perPage) || 1

      setRecords(filtered)
      setTotalCount(totalCountVal)
      setTotalPages(calculatedPages)
    } catch (error) {
      console.error('Failed to fetch checkin list:', error)
      setRecords([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [search, effectiveBranchId, statusFilter, fromDate, toDate, perPage, canList])

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
            You do not have permission to view the Checkin List. Please contact your administrator.
          </p>
        </div>
      </AppLayout>
    )
  }

  const columns: AdvancedColumn<CheckinRowRecord>[] = [
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
      render: (_: CheckinRowRecord, i: number) => (
        <span className="text-t-lighter text-xs font-mono font-medium">{(page - 1) * perPage + i + 1}</span>
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
      key: 'emp_code',
      header: renderHeader('emp_code', 'Employee Code'),
      sortable: true,
      sortValue: (row) => row.emp_code || '',
      render: (row) => (
        <span className="text-sm font-mono text-t-primary">{row.emp_code || '—'}</span>
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
        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded">
          {row.shift_name || '—'}
        </span>
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
      sortValue: (row) => formatArrayOrString(row.line_name),
      render: (row) => (
        <span className="text-sm font-medium text-t-primary">{formatArrayOrString(row.line_name)}</span>
      ),
    },
    {
      key: 'zone_name',
      header: renderHeader('zone_name', 'Zone'),
      sortable: true,
      sortValue: (row) => formatArrayOrString(row.zone_name),
      render: (row) => (
        <span className="text-sm text-t-secondary">{formatArrayOrString(row.zone_name)}</span>
      ),
    },
    {
      key: 'start_time',
      header: renderHeader('start_time', 'Start Time'),
      sortable: true,
      sortValue: (row) => row.start_time || '',
      render: (row) => (
        <span className="text-xs font-mono text-t-secondary whitespace-nowrap">{formatDateTime(row.start_time)}</span>
      ),
    },
    {
      key: 'end_time',
      header: renderHeader('end_time', 'End Time'),
      sortable: true,
      sortValue: (row) => row.end_time || '',
      render: (row) => (
        <span className="text-xs font-mono text-t-secondary whitespace-nowrap">{formatDateTime(row.end_time)}</span>
      ),
    },
    {
      key: 'status',
      header: renderHeader('status_name', 'Status'),
      sortable: true,
      sortValue: (row) => Number(row.status ?? (row.is_active ? 1 : 0)),
      render: (row: CheckinRowRecord) => {
        const isActive = row.is_active === true || row.is_active === 1 || row.status === 1 || row.status_name === 'Active'
        return (
          <Badge variant={isActive ? 'success' : 'default'}>
            {row.status_name || (isActive ? 'Active' : 'Inactive')}
          </Badge>
        )
      },
    },
  ]

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Checkin List"
        description="View and track mobile checkin sessions, line allocations, and active statuses"
      />

      <AdvancedTable<CheckinRowRecord>
        header={
          <Toolbar
            title="All Check-ins"
            search={search}
            onSearchChange={(val) => {
              setSearch(val)
              setPage(1)
            }}
            onExport={canExport ? () => {
              const selectedUuids = records
                .filter((r) => selected.includes(String(r.id || r.uuid)))
                .map((r) => r.uuid)
                .filter(Boolean)
              handleExport({
                check_box_heading: selectedHeadings,
                ...(selectedUuids.length > 0 ? { check_uuid: selectedUuids } : {}),
              })
            } : undefined}
            onExportPdf={canExport ? () => {
              const selectedUuids = records
                .filter((r) => selected.includes(String(r.id || r.uuid)))
                .map((r) => r.uuid)
                .filter(Boolean)
              handleExportPdf({
                check_box_heading: selectedHeadings,
                ...(selectedUuids.length > 0 ? { check_uuid: selectedUuids } : {}),
              })
            } : undefined}
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

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>

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
        emptyMessage="No check-in records found."
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
        countLabel="check-in"
        countLabelPlural="check-ins"
      />
    </AppLayout>
  )
}
