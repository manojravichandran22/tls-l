'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import CheckingHourlyReportList from './_components/CheckingHourlyReportList'
import type { CheckingHourlyReportData } from './types'
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

export default function CheckingHourlyReportPage() {
  const { can } = usePermissions('Reports')
  const canList = can('report.checkinghourlyreport')

  const [data, setData] = useState<CheckingHourlyReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [search, setSearch] = useState('')
  const [shiftFilter, setShiftFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [lineFilter, setLineFilter] = useState('')

  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const [branchFilter, setBranchFilter] = useState(() => (!isAdmin && userBranchId ? String(userBranchId) : ''))

  useEffect(() => {
    if (!isAdmin && userBranchId && !branchFilter) {
      setBranchFilter(String(userBranchId))
    }
  }, [isAdmin, userBranchId, branchFilter])

  const { branches, shifts, teams, zones, lines } = useDropdownData({
    branches: true,
    shifts: true,
    teams: true,
    zones: true,
    lines: true,
    branchId: branchFilter,
    zoneId: zoneFilter,
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
    if (!branchFilter || !shiftFilter) {
      setLoading(false)
      return
    }
    setLoading(true)
    const payload: Record<string, any> = {
      type: '',
      from_date: fromDate,
      to_date: toDate || fromDate,
      search,
      branch_id: branchFilter,
      shift_id: shiftFilter,
      zone_id: zoneFilter,
      line_id: lineFilter,
    }
    if (teamFilter) payload.team_id = teamFilter

    try {
      const res = await apiCall<{
        success?: boolean
        message?: string
        data?: CheckingHourlyReportData
      }>('/newreports/checkinghourlyreport', {
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
      console.error('Failed to fetch checking hourly report:', err)
      setToast({ type: 'error', message: err.message || 'Failed to load checking hourly report' })
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [canList, fromDate, toDate, search, shiftFilter, zoneFilter, lineFilter, branchFilter, teamFilter])

  const handleSubmit = useCallback(() => {
    if (!branchFilter) {
      setToast({ type: 'error', message: 'Please select a Branch' })
      return
    }
    if (!shiftFilter) {
      setToast({ type: 'error', message: 'Please select a Shift' })
      return
    }
    setHasSubmitted(true)
    fetchRecords()
  }, [branchFilter, shiftFilter, fetchRecords])

  const handleRefresh = useCallback(() => {
    if (hasSubmitted && branchFilter && shiftFilter) {
      fetchRecords()
    }
  }, [hasSubmitted, branchFilter, shiftFilter, fetchRecords])

  if (!canList && !loading) {
    return (
      <AppLayout fixedHeight>
        <PageHeader
          title="Checking Hourly Report"
          description="View hourly checking quantities by checker, shift, line, and zone."
        />
        <div className="flex-1 flex items-center justify-center text-t-secondary font-medium p-8">
          You do not have permission to view Checking Hourly Report.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Checking Hourly Report"
        description="View hourly checking quantities by checker, shift, line, and zone."
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <CheckingHourlyReportList
        data={data}
        loading={loading}
        hasSubmitted={hasSubmitted}
        search={search}
        branchFilter={branchFilter}
        shiftFilter={shiftFilter}
        teamFilter={teamFilter}
        zoneFilter={zoneFilter}
        lineFilter={lineFilter}
        fromDate={fromDate}
        toDate={toDate}
        branches={branches}
        shifts={shifts}
        teams={teams}
        zones={zones}
        lines={lines}
        onSearchChange={setSearch}
        onBranchFilterChange={(val) => {
          setBranchFilter(val)
          setShiftFilter('')
          setTeamFilter('')
          setData(null)
          setHasSubmitted(false)
        }}
        onShiftFilterChange={(val) => {
          setShiftFilter(val)
          setTeamFilter('')
          setData(null)
          setHasSubmitted(false)
        }}
        onTeamFilterChange={(val) => {
          setTeamFilter(val)
        }}
        onZoneFilterChange={(val) => {
          setZoneFilter(val)
        }}
        onLineFilterChange={(val) => {
          setLineFilter(val)
        }}
        onDateRangeChange={(start, end) => {
          setFromDate(start)
          setToDate(end)
        }}
        onSubmit={handleSubmit}
        onRefresh={handleRefresh}
      />
    </AppLayout>
  )
}
