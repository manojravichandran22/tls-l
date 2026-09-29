'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import ReworkSummaryList from './_components/ReworkSummaryList'
import type { ReworkSummaryRecord } from './types'
import { apiCall } from '@/services/apiClient'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { usePermissions } from '@/hooks/usePermissions'

import type { ShiftOption } from '@/services/dropdownService'

function getTodayDateString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ReworkSummaryPage() {
  const { can } = usePermissions('Reports')
  const canList = can('report.reworkreport')

  const [records, setRecords] = useState<ReworkSummaryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [shiftFilter, setShiftFilter] = useState('')
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const [branchFilter, setBranchFilter] = useState(() => (!isAdmin && userBranchId ? String(userBranchId) : ''))

  useEffect(() => {
    if (!isAdmin && userBranchId && !branchFilter) {
      setBranchFilter(String(userBranchId))
    }
  }, [isAdmin, userBranchId, branchFilter])

  const { branches, teams, shifts } = useDropdownData({
    branches: true,
    teams: true,
    shifts: true,
    branchId: branchFilter,
    shiftId: shiftFilter,
    isReport: true,
  })

  const [fromDate, setFromDate] = useState(getTodayDateString())
  const [toDate, setToDate] = useState(getTodayDateString())
  const [statusFilter, setStatusFilter] = useState('all')

  const [toast, setToast] = useState<ToastData | null>(null)

  const fetchRecords = useCallback(async () => {
    if (!canList) {
      setLoading(false)
      setRecords([])
      return
    }
    setLoading(true)
    const payload: Record<string, any> = {
      type: '',
      from_date: fromDate,
      to_date: toDate || fromDate,
    }
    if (branchFilter) payload.branch_id = branchFilter
    if (shiftFilter) payload.shift_id = shiftFilter
    if (teamFilter) payload.team_id = teamFilter
    if (search) payload.search = search
    if (statusFilter && statusFilter !== 'all') payload.status = statusFilter

    try {
      const res = await apiCall<{
        success?: boolean
        message?: string
        data?: {
          total?: number
          data?: ReworkSummaryRecord[]
        } | ReworkSummaryRecord[]
      }>('/report/reworkreport', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      const rawData = res.data
      let list: ReworkSummaryRecord[] = []
      if (Array.isArray(rawData)) {
        list = rawData
      } else if (rawData && typeof rawData === 'object' && Array.isArray((rawData as any).data)) {
        list = (rawData as any).data
      }

      setRecords(list)
    } catch (err: any) {
      console.error('Failed to fetch rework summary report:', err)
      setToast({
        type: 'error',
        message: err.message || 'Failed to load rework report data',
      })
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [canList, branchFilter, shiftFilter, teamFilter, fromDate, toDate, search, statusFilter])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Rework Summary Report"
        description="Comprehensive overview and summary of rework events, operator quality, defects, and status."
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ReworkSummaryList
        records={records}
        loading={loading}
        search={search}
        branchFilter={branchFilter}
        teamFilter={teamFilter}
        shiftFilter={shiftFilter}
        statusFilter={statusFilter}
        fromDate={fromDate}
        toDate={toDate}
        branches={branches}
        teams={teams}
        shifts={shifts}
        onSearchChange={setSearch}
        onBranchFilterChange={(val) => {
          setBranchFilter(val)
          setTeamFilter('')
          setShiftFilter('')
        }}
        onTeamFilterChange={(val) => {
          setTeamFilter(val)
        }}
        onShiftFilterChange={(val) => {
          setShiftFilter(val)
          setTeamFilter('')
        }}
        onStatusFilterChange={setStatusFilter}
        onDateRangeChange={(start, end) => {
          setFromDate(start)
          setToDate(end)
        }}
        onRefresh={fetchRecords}
      />
    </AppLayout>
  )
}
