'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import DailyMachineDowntimeList from './_components/DailyMachineDowntimeList'
import type { DailyMachineDowntimeRecord, DailyMachineDowntimeSummary } from './types'
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

export default function DailyMachineDowntimePage() {
  const { can } = usePermissions('Reports')
  const canList = can('report.dailymachinedowntimereport') || can('report.maintenancehistory') || true

  const [records, setRecords] = useState<DailyMachineDowntimeRecord[]>([])
  const [summary, setSummary] = useState<DailyMachineDowntimeSummary | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [shiftFilter, setShiftFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [lineFilter, setLineFilter] = useState('')
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const [branchFilter, setBranchFilter] = useState(() => (!isAdmin && userBranchId ? String(userBranchId) : ''))

  useEffect(() => {
    if (!isAdmin && userBranchId && !branchFilter) {
      setBranchFilter(String(userBranchId))
    }
  }, [isAdmin, userBranchId, branchFilter])

  const { branches, teams, zones, lines, shifts } = useDropdownData({
    branches: true,
    teams: true,
    zones: true,
    lines: true,
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
      setRecords([])
      return
    }
    setLoading(true)
    const payload: Record<string, any> = {
      type: '',
      search: search || '',
      date_from: fromDate || '',
      date_to: toDate || fromDate || '',
      from_date: fromDate || '',
      to_date: toDate || fromDate || '',
      branch_id: branchFilter || '',
      team_id: teamFilter || '',
      shift_id: shiftFilter || '',
      zone_id: zoneFilter || '',
      line_id: lineFilter || '',
    }

    try {
      const res = await apiCall<any>('/report/dailymachinedowntime', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      console.log('Daily Machine Downtime Response:', res)

      let list: DailyMachineDowntimeRecord[] = []
      let sumData: DailyMachineDowntimeSummary | undefined = undefined

      const responseObj = res

      const isRecordItem = (obj: any) =>
        obj &&
        typeof obj === 'object' &&
        !Array.isArray(obj) &&
        (obj.shift_allocation_id !== undefined ||
          obj.machine_id !== undefined ||
          obj.line_id !== undefined ||
          obj.category_id !== undefined ||
          obj.defect_id !== undefined ||
          obj.machine_no !== undefined ||
          obj.mechanic_code !== undefined ||
          obj.mechanic_name !== undefined ||
          obj.shift_allocation_name !== undefined ||
          obj.order_id !== undefined ||
          obj.order_no !== undefined ||
          obj.audit_id !== undefined)

      if (Array.isArray(responseObj)) {
        list = responseObj
      } else if (responseObj && typeof responseObj === 'object') {
        const d = responseObj.data
        if (Array.isArray(d)) {
          list = d
        } else if (d && typeof d === 'object') {
          if (Array.isArray(d.data)) {
            list = d.data
          } else if (Array.isArray(d.records)) {
            list = d.records
          } else if (Array.isArray(d.items)) {
            list = d.items
          } else if (isRecordItem(d)) {
            list = [d]
          }
          if (d.summary) {
            sumData = d.summary
          }
        } else if (isRecordItem(responseObj)) {
          list = [responseObj]
        }

        if (responseObj.summary) {
          sumData = responseObj.summary
        }
      }

      setRecords(list)
      setSummary(sumData)
    } catch (err: any) {
      console.error('Failed to fetch daily machine downtime report:', err)
      setToast({
        type: 'error',
        message: err.message || 'Failed to load daily machine downtime report data',
      })
      setRecords([])
      setSummary(undefined)
    } finally {
      setLoading(false)
    }
  }, [canList, branchFilter, shiftFilter, teamFilter, zoneFilter, lineFilter, fromDate, toDate, search])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  if (!canList && !loading) {
    return (
      <AppLayout fixedHeight>
        <PageHeader
          title="Daily Machine Downtime Report"
          description="Comprehensive report on daily machine downtime due to quality issues, with metrics on downtime, cost per minute, and estimated loss."
        />
        <div className="flex-1 flex items-center justify-center text-t-secondary font-medium p-8">
          You do not have permission to view Daily Machine Downtime Report.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Daily Machine Downtime Report"
        description="Comprehensive report on daily machine downtime due to quality issues, with metrics on downtime, cost per minute, and estimated loss."
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <DailyMachineDowntimeList
        records={records}
        summary={summary}
        loading={loading}
        search={search}
        branchFilter={branchFilter}
        teamFilter={teamFilter}
        shiftFilter={shiftFilter}
        zoneFilter={zoneFilter}
        lineFilter={lineFilter}
        fromDate={fromDate}
        toDate={toDate}
        branches={branches}
        teams={teams}
        shifts={shifts}
        zones={zones}
        lines={lines}
        onSearchChange={setSearch}
        onBranchFilterChange={(val) => {
          setBranchFilter(val)
          setTeamFilter('')
          setShiftFilter('')
          setZoneFilter('')
          setLineFilter('')
        }}
        onTeamFilterChange={(val) => {
          setTeamFilter(val)
        }}
        onShiftFilterChange={(val) => {
          setShiftFilter(val)
          setTeamFilter('')
        }}
        onZoneFilterChange={(val) => {
          setZoneFilter(val)
          setLineFilter('')
        }}
        onLineFilterChange={setLineFilter}
        onDateRangeChange={(start, end) => {
          setFromDate(start)
          setToDate(end)
        }}
        onRefresh={fetchRecords}
      />
    </AppLayout>
  )
}
