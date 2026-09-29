'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import TlsAuditList from './_components/TlsAuditList'
import type { TlsAuditRecord, TlsAuditMeta } from './types'
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

export default function TlsAuditPage() {
  const { can } = usePermissions('Reports')
  const canList = can('report.tlsauditreport') || can('report.tlsaudit')

  const [records, setRecords] = useState<TlsAuditRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [shiftFilter, setShiftFilter] = useState('')
  const [fromDate, setFromDate] = useState(getTodayDateString())
  const [toDate, setToDate] = useState(getTodayDateString())
  const [severityFilter, setSeverityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<TlsAuditMeta | null>(null)

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

  const [toast, setToast] = useState<ToastData | null>(null)

  const fetchAuditData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{
        success?: boolean
        message?: string
        data?: {
          total?: number
          page?: number
          limit?: number
          total_pages?: number
          data?: TlsAuditRecord[]
        }
      }>('/report/tlsauditreport', {
        method: 'POST',
        encrypt: false,
        payload: {
          page: String(page),
          limit: '10000',
          date_from: fromDate,
          date_to: toDate || fromDate,
          from_date: fromDate,
          to_date: toDate || fromDate,
          branch_id: branchFilter,
          shift_id: shiftFilter,
          team_id: teamFilter,
          search: search,
          severity_id: severityFilter,
        },
      })

      const outer = res.data
      let list: TlsAuditRecord[] = []

      if (outer && typeof outer === 'object' && Array.isArray(outer.data)) {
        list = outer.data
        setMeta({
          total: outer.total ?? list.length,
          page: outer.page ?? 1,
          limit: outer.limit ?? 20,
          total_pages: outer.total_pages ?? 1,
        })
      } else if (Array.isArray(outer)) {
        list = outer as TlsAuditRecord[]
        setMeta(null)
      }

      setRecords(list)
    } catch (error) {
      console.error('Failed to fetch TLS audit data:', error)
      setToast({ type: 'error', message: 'Failed to load TLS Audit data' })
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [search, branchFilter, teamFilter, shiftFilter, fromDate, toDate, severityFilter, page])

  useEffect(() => {
    fetchAuditData()
  }, [fetchAuditData])

  if (!canList && !loading) {
    return (
      <AppLayout fixedHeight>
        <PageHeader
          title="TLS Audit Report"
          description="View and analyze TLS quality audit records by shift, team, defect, and severity."
        />
        <div className="flex-1 flex items-center justify-center text-t-secondary font-medium p-8">
          You do not have permission to view TLS Audit Report.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="TLS Audit Report"
        description="View and analyze TLS quality audit records by shift, team, defect, and severity."
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <TlsAuditList
        records={records}
        loading={loading}
        search={search}
        branchFilter={branchFilter}
        teamFilter={teamFilter}
        shiftFilter={shiftFilter}
        severityFilter={severityFilter}
        fromDate={fromDate}
        toDate={toDate}
        branches={branches}
        teams={teams}
        shifts={shifts}
        onSearchChange={(val) => setSearch(val)}
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
        onSeverityFilterChange={(val) => setSeverityFilter(val)}
        onDateRangeChange={(start, end) => {
          setFromDate(start)
          setToDate(end)
        }}
        onRefresh={fetchAuditData}
        meta={meta}
      />
    </AppLayout>
  )
}
