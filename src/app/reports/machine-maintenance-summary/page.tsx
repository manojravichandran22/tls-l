'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import MachineMaintenanceSummaryList from './_components/MachineMaintenanceSummaryList'
import type { MaintenanceHistoryRecord } from './types'
import { apiCall } from '@/services/apiClient'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'

import { usePermissions } from '@/hooks/usePermissions'

function getTodayDateString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function MachineMaintenanceSummaryPage() {
  const { can } = usePermissions('Reports')
  const canList = can('report.maintenancehistory')

  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const [branchFilter, setBranchFilter] = useState(() => (!isAdmin && userBranchId ? String(userBranchId) : ''))

  useEffect(() => {
    if (!isAdmin && userBranchId && !branchFilter) {
      setBranchFilter(String(userBranchId))
    }
  }, [isAdmin, userBranchId, branchFilter])

  const { branches } = useDropdownData({
    branches: true,
    global: true,
  })

  const [records, setRecords] = useState<MaintenanceHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState(getTodayDateString())
  const [toDate, setToDate] = useState(getTodayDateString())
  const [statusFilter, setStatusFilter] = useState('all')

  const [totalCount, setTotalCount] = useState(0)

  const [toast, setToast] = useState<ToastData | null>(null)

  const fetchMaintenanceHistory = useCallback(async () => {
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
          data?: MaintenanceHistoryRecord[]
          total?: number
          limit?: number
          page?: number
          count?: number
          totalPages?: number
          pagination?: { total: number; total_pages: number }
        } | MaintenanceHistoryRecord[]
      }>('/report/maintenancehistory', {
        method: 'POST',
        encrypt: false,
        payload: {
          page: '1',
          per_page: '10000',
          date_from: fromDate,
          date_to: toDate,
          type: '',
          machine_id: '',
          branch_id: branchFilter,
          machine_type_id: '',
          status: statusFilter === 'all' ? '' : statusFilter,
          search: search,
        },
      })

      const rawData = res.data
      let list: MaintenanceHistoryRecord[] = []
      let total = 0

      if (Array.isArray(rawData)) {
        list = rawData
        total = rawData.length
      } else if (rawData && typeof rawData === 'object') {
        list = Array.isArray(rawData.data) ? rawData.data : []
        total = rawData.total ?? rawData.pagination?.total ?? rawData.count ?? list.length
      }

      setRecords(list)
      setTotalCount(total)
    } catch (error) {
      console.error('Failed to fetch machine maintenance history data:', error)
      setToast({ type: 'error', message: 'Failed to load Machine Maintenance Summary data' })
      setRecords([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [search, branchFilter, fromDate, toDate, statusFilter, canList])

  useEffect(() => {
    fetchMaintenanceHistory()
  }, [fetchMaintenanceHistory])

  if (!canList && !loading) {
    return (
      <AppLayout fixedHeight>
        <PageHeader
          title="Machine Maintenance Summary"
          description="View and filter machine maintenance history by date, branch, and status."
        />
        <div className="flex-1 flex items-center justify-center text-t-secondary font-medium p-8">
          You do not have permission to view Machine Maintenance Summary.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Machine Maintenance Summary"
        description="View and filter machine maintenance history by date, branch, and status."
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <MachineMaintenanceSummaryList
        records={records}
        loading={loading}
        search={search}
        branchFilter={branchFilter}
        fromDate={fromDate}
        toDate={toDate}
        statusFilter={statusFilter}
        totalCount={totalCount}
        branches={branches}
        onSearchChange={(val) => setSearch(val)}
        onBranchFilterChange={(val) => setBranchFilter(val)}
        onDateRangeChange={(start, end) => {
          setFromDate(start)
          setToDate(end)
        }}
        onStatusFilterChange={(val) => setStatusFilter(val)}
      />
    </AppLayout>
  )
}
