'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import CheckingReportList from './_components/CheckingReportList'
import type { CheckingReportData } from './types'
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

export default function CheckingReportPage() {
  const { can } = usePermissions('Reports')
  const canList = can('report.checkingreport')

  const [data, setData] = useState<CheckingReportData | null>(null)
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

  const [toast, setToast] = useState<ToastData | null>(null)

  const fetchRecords = useCallback(async () => {
    if (!canList) {
      setLoading(false)
      setData(null)
      return
    }
    setLoading(true)
    const payload: Record<string, any> = {
      type: '',
      date_from: fromDate,
      date_to: toDate || fromDate,
    }
    if (branchFilter) payload.branch_id = branchFilter
    if (shiftFilter) payload.shift_id = shiftFilter
    if (teamFilter) payload.team_id = teamFilter
    if (search) payload.search = search

    try {
      const res = await apiCall<{
        success?: boolean
        message?: string
        data?: CheckingReportData
      }>('/report/checkingreport', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      if (res.data) {
        setData(res.data)
      } else {
        setData(null)
      }
    } catch (err: any) {
      console.error('Failed to fetch checking report:', err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [canList, branchFilter, shiftFilter, teamFilter, fromDate, toDate, search])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  if (!canList && !loading) {
    return (
      <AppLayout fixedHeight>
        <PageHeader
          title="Checking Report"
          description="View garment checking audit report summary by shift, order, buyer, and size."
        />
        <div className="flex-1 flex items-center justify-center text-t-secondary font-medium p-8">
          You do not have permission to view Checking Report.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Checking Report"
        description="View garment checking audit report summary by shift, order, buyer, and size."
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <CheckingReportList
        data={data}
        loading={loading}
        search={search}
        branchFilter={branchFilter}
        teamFilter={teamFilter}
        shiftFilter={shiftFilter}
        fromDate={fromDate}
        toDate={toDate}
        branches={branches}
        teams={teams}
        shifts={shifts}
        onSearchChange={setSearch}
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
      />
    </AppLayout>
  )
}
