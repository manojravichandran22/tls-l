'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import ReworkCostAnalysisList from './_components/ReworkCostAnalysisList'
import type { ReworkCostRecord, ReworkCostSummary } from './types'
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

export default function ReworkCostAnalysisPage() {
  const { can } = usePermissions('Reports')
  const canList = can('report.defectwisereworkreport')

  const [records, setRecords] = useState<ReworkCostRecord[]>([])
  const [summary, setSummary] = useState<ReworkCostSummary | undefined>(undefined)
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
      setRecords([])
      return
    }
    setLoading(true)
    const payload: Record<string, any> = {
      type: '',
      date_from: fromDate,
      date_to: toDate || fromDate,
      from_date: fromDate,
      to_date: toDate || fromDate,
    }
    if (branchFilter) payload.branch_id = branchFilter
    if (shiftFilter) payload.shift_id = shiftFilter
    if (teamFilter) payload.team_id = teamFilter
    if (search) payload.search = search

    try {
      const res = await apiCall<{
        success?: boolean
        message?: string
        data?: {
          total?: number
          summary?: ReworkCostSummary
          data?: ReworkCostRecord[]
        } | ReworkCostRecord[]
      }>('/report/defectwisereworkreport', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      const rawData = res.data
      let list: ReworkCostRecord[] = []
      let sumData: ReworkCostSummary | undefined = undefined

      if (Array.isArray(rawData)) {
        list = rawData
      } else if (rawData && typeof rawData === 'object') {
        if (Array.isArray((rawData as any).data)) {
          list = (rawData as any).data
        }
        if ((rawData as any).summary) {
          sumData = (rawData as any).summary
        }
      }

      setRecords(list)
      setSummary(sumData)
    } catch (err: any) {
      console.error('Failed to fetch rework cost analysis report:', err)
      setToast({
        type: 'error',
        message: err.message || 'Failed to load rework cost analysis report',
      })
      setRecords([])
      setSummary(undefined)
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
          title="Rework Cost Analysis Report"
          description="Defect wise rework cost analysis report with metrics on pieces, severity, time taken, cost per min, and estimated loss."
        />
        <div className="flex-1 flex items-center justify-center text-t-secondary font-medium p-8">
          You do not have permission to view Rework Cost Analysis Report.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Rework Cost Analysis Report"
        description="Defect wise rework cost analysis report with metrics on pieces, severity, time taken, cost per min, and estimated loss."
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ReworkCostAnalysisList
        records={records}
        summary={summary}
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
        onRefresh={fetchRecords}
      />
    </AppLayout>
  )
}
