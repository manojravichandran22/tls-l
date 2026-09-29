'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import RejectionCostAnalysisList from './_components/RejectionCostAnalysisList'
import type { RejectionCostRecord, RejectionCostSummary } from './types'
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

export default function RejectionCostAnalysisPage() {
  const { can } = usePermissions('Reports')
  const canList = can('report.defectwiserejectionreport')

  const [records, setRecords] = useState<RejectionCostRecord[]>([])
  const [summary, setSummary] = useState<RejectionCostSummary | undefined>(undefined)
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
        data?: {
          total?: number
          summary?: RejectionCostSummary
          data?: RejectionCostRecord[]
        } | RejectionCostRecord[]
      }>('/report/defectwiserejectionreport', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      const rawData = res.data
      let list: RejectionCostRecord[] = []
      let sumData: RejectionCostSummary | undefined = undefined

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
      console.error('Failed to fetch rejection cost report:', err)
      setToast({ type: 'error', message: err.message || 'Failed to load rejection cost report data' })
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
          title="Rejection Cost Analysis Report"
          description="Defect wise rejection cost analysis report with metrics on pieces, severity, cost per piece, and estimated loss."
        />
        <div className="flex-1 flex items-center justify-center text-t-secondary font-medium p-8">
          You do not have permission to view Rejection Cost Analysis Report.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Rejection Cost Analysis Report"
        description="Defect wise rejection cost analysis report with metrics on pieces, severity, cost per piece, and estimated loss."
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <RejectionCostAnalysisList
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
        onBranchFilterChange={(val: string) => {
          setBranchFilter(val)
          setTeamFilter('')
          setShiftFilter('')
        }}
        onTeamFilterChange={(val: string) => {
          setTeamFilter(val)
        }}
        onShiftFilterChange={(val: string) => {
          setShiftFilter(val)
          setTeamFilter('')
        }}
        onDateRangeChange={(start: string, end: string) => {
          setFromDate(start)
          setToDate(end)
        }}
        onRefresh={fetchRecords}
      />
    </AppLayout>
  )
}
