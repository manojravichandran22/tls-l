'use client'

import Toolbar from '@/components/ui/Toolbar'
import ReportTable, { type ReportColumn } from '@/components/ui/ReportTable'
import Badge from '@/components/ui/Badge'
import { type MaintenanceHistoryRecord } from '../types'
import { type BranchOption } from '@/hooks/useDropdownData'
import { useExport } from '@/hooks/useExport'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useBranchAccess } from '@/hooks/useBranchAccess'

import DateRangePicker from '@/components/ui/DateRangePicker'

function formatDateOnly(val?: string): string {
  if (!val) return '—'
  const trimmed = String(val).trim()
  if (!trimmed) return '—'

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

interface MachineMaintenanceSummaryListProps {
  records: MaintenanceHistoryRecord[]
  loading: boolean
  search: string
  branchFilter: string
  fromDate: string
  toDate: string
  statusFilter: string
  totalCount: number
  branches: BranchOption[]
  onSearchChange: (val: string) => void
  onBranchFilterChange: (val: string) => void
  onDateRangeChange: (start: string, end: string) => void
  onStatusFilterChange: (val: string) => void
}

export default function MachineMaintenanceSummaryList({
  records,
  loading,
  search,
  branchFilter,
  fromDate,
  toDate,
  statusFilter,
  totalCount,
  branches,
  onSearchChange,
  onBranchFilterChange,
  onDateRangeChange,
  onStatusFilterChange,
}: MachineMaintenanceSummaryListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()

  const exportPayload = {
    search,
    date_from: fromDate,
    date_to: toDate,
    branch_id: branchFilter,
    status: statusFilter === 'all' ? '' : statusFilter,
    type: '',
    machine_id: '',
    machine_type_id: '',
    page: '1',
    per_page: '10000',
  }

  const { handleExport, exporting } = useExport<MaintenanceHistoryRecord>({
    apiPath: '/report/maintenancehistory',
    payload: exportPayload,
    dataKey: 'data',
    method: 'POST',
    columns: [
      { key: 'machine_no', header: 'Machine No', value: (r) => r.machine_no || '—' },
      { key: 'branch_name', header: 'Branch', value: (r) => r.branch_name || '—' },
      { key: 'machine_type_name', header: 'Machine Type', value: (r) => r.machine_type_name || '—' },
      { key: 'brand', header: 'Brand', value: (r) => r.brand || '—' },
      { key: 'model_no', header: 'Model No', value: (r) => r.model_no || '—' },
      { key: 'last_service_date', header: 'Last Service Date', value: (r) => formatDateOnly(r.last_service_date) },
      { key: 'next_service_date', header: 'Next Service Date', value: (r) => formatDateOnly(r.next_service_date) },
      { key: 'status', header: 'Status', value: (r) => (r.status === 1 || r.status === '1' ? 'Active' : 'Inactive') },
    ],
    filename: 'Machine_Maintenance_Summary',
  })

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/report/maintenancehistory',
    payload: exportPayload,
    filename: 'Machine_Maintenance_Summary',
  })

  const columns: ReportColumn<MaintenanceHistoryRecord>[] = [
    {
      key: 'index',
      header: 'Sn.',
      render: (_: MaintenanceHistoryRecord, i: number) => (
        <span className="text-t-secondary font-medium">{i + 1}</span>
      ),
      footer: () => <span className="font-bold text-white">Summary</span>,
    },
    {
      key: 'branch_name',
      header: 'Branch',
      sortable: true,
      sortValue: (row) => row.branch_name || '',
      render: (row) => (
        <span className="text-t-primary font-medium whitespace-nowrap">
          {row.branch_name || '—'}
        </span>
      ),
      footer: (data) => {
        const uniqueBranches = new Set(data.map((r) => r.branch_name).filter(Boolean)).size
        return <span className="font-bold text-white">{uniqueBranches ? `${uniqueBranches} Branches` : '—'}</span>
      },
    },
    {
      key: 'machine_no',
      header: 'Machine No',
      sortValue: (row) => row.machine_no || '',
      render: (row) => (
        <span className="text-accent font-semibold">
          {row.machine_no || '—'}
        </span>
      ),
      footer: (data) => (
        <span className="font-bold text-white">{data.length} Machines</span>
      ),
    },
    {
      key: 'machine_type_name',
      header: 'Machine Type',
      sortable: true,
      sortValue: (row) => row.machine_type_name || '',
      render: (row) => (
        <span className="text-t-body">
          {row.machine_type_name || '—'}
        </span>
      ),
    },
    {
      key: 'brand',
      header: 'Brand',
      sortable: true,
      sortValue: (row) => row.brand || '',
      render: (row) => (
        <span className="text-t-body">
          {row.brand || '—'}
        </span>
      ),
    },
    {
      key: 'model_no',
      header: 'Model No',
      sortable: true,
      sortValue: (row) => row.model_no || '',
      render: (row) => (
        <span className="text-t-body">
          {row.model_no || '—'}
        </span>
      ),
    },
    {
      key: 'last_service_date',
      header: 'Last Service Date',
      sortable: true,
      sortValue: (row) => row.last_service_date || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap">
          {formatDateOnly(row.last_service_date)}
        </span>
      ),
    },
    {
      key: 'next_service_date',
      header: 'Next Service Date',
      sortable: true,
      sortValue: (row) => row.next_service_date || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap">
          {formatDateOnly(row.next_service_date)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (row) => String(row.status ?? ''),
      render: (row) => {
        const isAct = row.status === 1 || row.status === '1' || String(row.status).toLowerCase() === 'active'
        return (
          <Badge variant={isAct ? 'success' : 'default'}>
            {isAct ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
      footer: (data) => {
        const activeCount = data.filter((r) => r.status === 1 || r.status === '1' || String(r.status).toLowerCase() === 'active').length
        return <span className="font-bold text-white">{activeCount} Active</span>
      },
    },
  ]

  return (
    <ReportTable<MaintenanceHistoryRecord>
      columns={columns}
      data={records}
      loading={loading}
      rowKey={(r) => String(r.id)}
      header={
        <Toolbar
          title="Machine Maintenance Summary"
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by Machine No, Brand, Model..."
          showExport
          onExport={handleExport}
          onExportPdf={handleExportPdf}
          exporting={exporting || exportingPdf}
        >
          {/* Branch Filter Dropdown */}
          <select
            value={branchFilter}
            onChange={(e) => onBranchFilterChange(e.target.value)}
            disabled={!isAdmin && Boolean(userBranchId)}
            className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {!(!isAdmin && userBranchId) && <option value="">All Branches</option>}
            {branches.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.branch_name}
              </option>
            ))}
          </select>

          {/* Date Range Picker */}
          <div className="relative z-[100]">
            <DateRangePicker
              startDate={fromDate}
              endDate={toDate}
              onChange={onDateRangeChange}
            />
          </div>

          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
          >
            <option value="all">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </Toolbar>
      }
      totalCount={totalCount}
      emptyMessage="No maintenance records found"
      countLabel="maintenance record"
      countLabelPlural="maintenance records"
    />
  )
}
