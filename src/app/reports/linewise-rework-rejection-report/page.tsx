'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import LinewiseReworkRejectionReportList from './_components/LinewiseReworkRejectionReportList'
import type { LinewiseReportData } from './types'
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

export default function LinewiseReworkRejectionReportPage() {
  const { can } = usePermissions('Reports')
  const canList = can('report.linewisereworkrejectionreport')

  const [reportData, setReportData] = useState<LinewiseReportData | null>(null)
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

  const fetchReportData = useCallback(async () => {
    if (!canList) {
      setLoading(false)
      setReportData(null)
      return
    }
    setLoading(true)
    const payload: Record<string, any> = {
      type: '',
      search: search || '',
      date_from: fromDate,
      date_to: toDate || fromDate,
      shift_id: shiftFilter || '',
      branch_id: branchFilter || '',
      team_id: teamFilter || '',
    }

    try {
      const res = await apiCall<{
        success?: boolean
        message?: string
        data?: LinewiseReportData
      }>('/report/linewisereworkrejectionreport', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      if (res && res.data) {
        setReportData(res.data)
      } else {
        setReportData(null)
      }
    } catch (err: any) {
      console.error('Failed to fetch linewise rework and rejection report:', err)
      setReportData(null)
    } finally {
      setLoading(false)
    }
  }, [canList, branchFilter, shiftFilter, teamFilter, fromDate, toDate, search])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  if (!canList && !loading) {
    return (
      <AppLayout fixedHeight>
        <PageHeader
          title="Line Wise Rework & Rejection Summary Report"
          description="Detailed breakdown of rework and rejection occurrences across production lines."
        />
        <div className="flex-1 flex items-center justify-center text-t-secondary font-medium p-8">
          You do not have permission to view Line Wise Rework & Rejection Report.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Line Wise Rework & Rejection Summary Report"
        description="Detailed breakdown of rework and rejection occurrences across production lines."
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <LinewiseReworkRejectionReportList
        data={reportData}
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
        onDateRangeChange={(start, end) => {
          setFromDate(start)
          setToDate(end)
        }}
      />
    </AppLayout>
  )
}
