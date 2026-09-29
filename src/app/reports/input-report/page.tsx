'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import InputReportList from './_components/InputReportList'
import type { LineInputRecord } from './types'
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

export default function InputReportPage() {
  const { can } = usePermissions('Reports')
  const canList = can('webinput.list')

  const [records, setRecords] = useState<LineInputRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [shiftFilter, setShiftFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
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
  const [returnFilter, setReturnFilter] = useState('all')

  const [totalCount, setTotalCount] = useState(0)

  const [toast, setToast] = useState<ToastData | null>(null)

  const fetchLineInputs = useCallback(async () => {
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
          data?: LineInputRecord[]
          count?: number
          totalPages?: number
          pagination?: { total: number; total_pages: number }
        } | LineInputRecord[]
      }>('/webinputmodule/list', {
        method: 'POST',
        encrypt: false,
        payload: {
          page: '1',
          per_page: '10000',
          line_id: '',
          color: 'all',
          type: '',
          order_id: '',
          branch_id: branchFilter,
          shift_id: shiftFilter,
          team_id: teamFilter,
          style_id: '',
          search: search,
          status: statusFilter === 'all' ? '' : statusFilter,
          date: fromDate,
          date_from: fromDate,
          date_to: toDate || fromDate,
          from_date: fromDate,
          to_date: toDate || fromDate,
        },
      })

      const rawData = res.data
      let list: LineInputRecord[] = []
      let total = 0

      if (Array.isArray(rawData)) {
        list = rawData
        total = rawData.length
      } else if (rawData && typeof rawData === 'object') {
        list = Array.isArray(rawData.data) ? rawData.data : []
        total = rawData.pagination?.total ?? rawData.count ?? list.length
      }

      setRecords(list)
      setTotalCount(total)
    } catch (error) {
      console.error('Failed to fetch input report data:', error)
      setRecords([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [search, branchFilter, teamFilter, shiftFilter, fromDate, toDate, statusFilter, canList])

  useEffect(() => {
    fetchLineInputs()
  }, [fetchLineInputs])

  if (!canList && !loading) {
    return (
      <AppLayout fixedHeight>
        <PageHeader
          title="Input Report"
          description="View and filter input reports by branch, team, shift, and date range."
        />
        <div className="flex-1 flex items-center justify-center text-t-secondary font-medium p-8">
          You do not have permission to view Input Report.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Input Report"
        description="View and filter input reports by branch, team, shift, and date range."
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <InputReportList
        records={records}
        loading={loading}
        search={search}
        branchFilter={branchFilter}
        teamFilter={teamFilter}
        shiftFilter={shiftFilter}
        fromDate={fromDate}
        toDate={toDate}
        statusFilter={statusFilter}
        totalCount={totalCount}
        branches={branches}
        teams={teams}
        shifts={shifts}
        onSearchChange={(val) => setSearch(val)}
        onBranchFilterChange={(val) => {
          setBranchFilter(val)
          setShiftFilter('')
          setTeamFilter('')
        }}
        onShiftFilterChange={(val) => {
          setShiftFilter(val)
          setTeamFilter('')
        }}
        onTeamFilterChange={(val) => {
          setTeamFilter(val)
        }}
        onDateRangeChange={(start, end) => {
          setFromDate(start)
          setToDate(end)
        }}
        onStatusFilterChange={(val) => setStatusFilter(val)}
        returnFilter={returnFilter}
        onReturnFilterChange={(val) => setReturnFilter(val)}
      />
    </AppLayout>
  )
}

