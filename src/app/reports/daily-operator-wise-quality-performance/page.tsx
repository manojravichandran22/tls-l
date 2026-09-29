'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import DailyOperatorQualityList from './_components/DailyOperatorQualityList'
import type {
  DailyOperatorQualityCards,
  DailyOperatorQualityRow,
  DailyOperatorQualityAverage,
  DailyOperatorQualityFactorySummary,
} from './types'
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

export default function DailyOperatorQualityPerformancePage() {
  const { can } = usePermissions('Reports')
  const canList = can('report.getdailyoperatorwisequalityperformancereport')

  const [cards, setCards] = useState<DailyOperatorQualityCards | undefined>(undefined)
  const [rows, setRows] = useState<DailyOperatorQualityRow[]>([])
  const [average, setAverage] = useState<DailyOperatorQualityAverage | undefined>(undefined)
  const [factorySummary, setFactorySummary] = useState<DailyOperatorQualityFactorySummary | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

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

  const { branches, teams, zones: dropdownZones, lines: dropdownLines, shifts: dropdownShifts } = useDropdownData({
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
      setRows([])
      setCards(undefined)
      setAverage(undefined)
      setFactorySummary(undefined)
      return
    }

    setLoading(true)

    const payload: Record<string, any> = {
      type: '',
      from_date: fromDate,
      to_date: toDate || fromDate,
      search: debouncedSearch || '',
      branch_id: branchFilter || '',
      shift_id: shiftFilter || '',
      team_id: teamFilter || '',
      zone_id: zoneFilter || '',
      line_id: lineFilter || '',
    }

    try {
      const res = await apiCall<any>('/newreports/getdailyqualityperformancereport', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      // Handle payload placed at res root or res.data
      const respData = res?.data?.rows ? res.data : res

      if (respData && typeof respData === 'object') {
        setCards(respData.cards || undefined)
        setRows(Array.isArray(respData.rows) ? respData.rows : [])
        setAverage(respData.average || undefined)
        setFactorySummary(respData.factory_summary || undefined)
      } else {
        setCards(undefined)
        setRows([])
        setAverage(undefined)
        setFactorySummary(undefined)
      }
    } catch (err: any) {
      console.error('Failed to fetch daily operator quality performance report:', err)
      setToast({
        type: 'error',
        message: err.message || 'Failed to fetch daily operator quality performance report',
      })
      setCards(undefined)
      setRows([])
      setAverage(undefined)
      setFactorySummary(undefined)
    } finally {
      setLoading(false)
    }
  }, [canList, fromDate, toDate, debouncedSearch, branchFilter, shiftFilter, teamFilter, zoneFilter, lineFilter])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleDateRangeChange = (start: string, end: string) => {
    setFromDate(start)
    setToDate(end)
  }

  return (
    <AppLayout>
      <div className="p-6 flex flex-col h-full overflow-hidden">
        <PageHeader
          title="Daily Operator Wise Quality Performance Report"
          description="View daily operator performance, mistake rates, rework/rejection metrics, and quality scores"
        />

        {toast && (
          <div className="mb-4">
            <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-hidden">
          <DailyOperatorQualityList
            cards={cards}
            rows={rows}
            average={average}
            factorySummary={factorySummary}
            loading={loading}
            search={search}
            branchFilter={branchFilter}
            shiftFilter={shiftFilter}
            teamFilter={teamFilter}
            zoneFilter={zoneFilter}
            lineFilter={lineFilter}
            fromDate={fromDate}
            toDate={toDate}
            branches={branches}
            shifts={dropdownShifts}
            teams={teams}
            zonesList={dropdownZones}
            linesList={dropdownLines}
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
            onZoneFilterChange={setZoneFilter}
            onLineFilterChange={setLineFilter}
            onDateRangeChange={handleDateRangeChange}
            onRefresh={fetchRecords}
          />
        </div>
      </div>
    </AppLayout>
  )
}
