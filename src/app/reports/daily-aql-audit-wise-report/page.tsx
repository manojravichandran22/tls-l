'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import DailyAqlAuditWiseReportList from './_components/DailyAqlAuditWiseReportList'
import type { AqlAuditReportResponseData } from './types'
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

export default function DailyAqlAuditWiseReportPage() {
  const { can } = usePermissions('Reports')
  const canList = can('report.aqlauditreport') || can('report.aqlauditlinesummaryreport')

  const [data, setData] = useState<AqlAuditReportResponseData | null>(null)
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

  const fetchRecords = useCallback(async () => {
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
        data?: AqlAuditReportResponseData
      }>('/report/aqlauditreport', {
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
      console.error('Failed to fetch AQL audit report:', err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [branchFilter, shiftFilter, teamFilter, fromDate, toDate, search])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleDateRangeChange = (start: string, end: string) => {
    setFromDate(start)
    setToDate(end)
  }

  return (
    <AppLayout fixedHeight>
      <div className="flex flex-col h-full overflow-hidden">
        <PageHeader
          title="Daily AQL Audit Wise Report"
          description="Comprehensive daily AQL audit report with sample size, allowed defects, defect categorization, and inspection results."
        />

        <div className="flex-1 overflow-hidden">
          <DailyAqlAuditWiseReportList
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
            onTeamFilterChange={setTeamFilter}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>
      </div>
    </AppLayout>
  )
}
