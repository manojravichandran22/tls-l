'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import EfficiencyReportList from './_components/EfficiencyReportList'
import type { EfficiencyReportZone, EfficiencyReportTotal } from './types'
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

export default function EfficiencyReportPage() {
  const { can } = usePermissions('Reports')
  const canList = can('report.efficiencyreport')

  const [zones, setZones] = useState<EfficiencyReportZone[]>([])
  const [grandTotal, setGrandTotal] = useState<EfficiencyReportTotal | undefined>(undefined)
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
      setZones([])
      setGrandTotal(undefined)
      return
    }
    setLoading(true)

    const payload: Record<string, any> = {
      search: search || '',
      from_date: fromDate,
      to_date: toDate || fromDate,
      date_from: fromDate,
      date_to: toDate || fromDate,
      branch_id: branchFilter || '',
      team_id: teamFilter || '',
      shift_id: shiftFilter || '',
      zone_id: zoneFilter || '',
      line_id: lineFilter || '',
      type: '',
    }

    try {
      const res = await apiCall<{
        success?: boolean
        message?: string
        data?: {
          date_from?: string
          date_to?: string
          data?: EfficiencyReportZone[]
          grand_total?: EfficiencyReportTotal
        } | EfficiencyReportZone[]
      }>('/livetracking/efficiencyreport', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      const rawData = res?.data
      if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
        setZones(Array.isArray(rawData.data) ? rawData.data : [])
        setGrandTotal(rawData.grand_total)
      } else if (Array.isArray(rawData)) {
        setZones(rawData)
        setGrandTotal(undefined)
      } else {
        setZones([])
        setGrandTotal(undefined)
      }
    } catch (err: any) {
      console.error('Failed to fetch efficiency report data:', err)
      setToast({
        type: 'error',
        message: err.message || 'Failed to fetch efficiency report data',
      })
      setZones([])
      setGrandTotal(undefined)
    } finally {
      setLoading(false)
    }
  }, [canList, search, fromDate, toDate, branchFilter, teamFilter, shiftFilter, zoneFilter, lineFilter])

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
          title="Efficiency Report"
          description="View line and order efficiency metrics, SAH achievement, defects, and output tracking"
        />

        {toast && (
          <div className="mb-4">
            <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-hidden">
          <EfficiencyReportList
            zones={zones}
            grandTotal={grandTotal}
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
            shifts={dropdownShifts}
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
