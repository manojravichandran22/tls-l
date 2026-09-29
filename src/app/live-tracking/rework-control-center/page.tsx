'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import ReworkControlCenterList from './_components/ReworkControlCenterList'
import type { ReworkRecord } from './types'
import { PER_PAGE } from '@/lib/constants'
import { apiCall } from '@/services/apiClient'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'

export default function ReworkControlCenterPage() {
  const { branchId: userBranchId } = useBranchAccess()
  const [branchFilter, setBranchFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [shiftFilter, setShiftFilter] = useState('')

  const { branches, teams, shifts } = useDropdownData({
    branches: true,
    teams: true,
    shifts: true,
    branchId: branchFilter,
    shiftId: shiftFilter,
    teamId: teamFilter,
    isReport: true,
  })

  const [records, setRecords] = useState<ReworkRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [toast, setToast] = useState<ToastData | null>(null)

  // Auto-initialize branch filter if user is restricted to a specific branch
  useEffect(() => {
    if (userBranchId && !branchFilter) {
      setBranchFilter(String(userBranchId))
    }
  }, [userBranchId, branchFilter])

  const fetchRecords = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    const payload: Record<string, any> = {
      type: '',
      page: String(page),
      limit: String(perPage),
      per_page: String(perPage),
    }
    if (fromDate) {
      payload.from_date = fromDate
      payload.date_from = fromDate
    }
    if (toDate) {
      payload.to_date = toDate
      payload.date_to = toDate
    }
    if (branchFilter) payload.branch_id = branchFilter
    if (shiftFilter) payload.shift_id = shiftFilter
    if (teamFilter) payload.team_id = teamFilter
    if (search) payload.search = search
    if (statusFilter && statusFilter !== 'all') payload.status = statusFilter

    try {
      const res = await apiCall<{
        success?: boolean
        message?: string
        data?: {
          total?: number
          page?: number
          limit?: number
          totalPages?: number
          data?: ReworkRecord[]
        } | ReworkRecord[]
      }>('/livetracking/reworkcontrolcenter', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      const rawData = res.data
      let list: ReworkRecord[] = []
      let total = 0
      let pages = 1

      if (Array.isArray(rawData)) {
        list = rawData
        total = rawData.length
      } else if (rawData && typeof rawData === 'object') {
        if (Array.isArray(rawData.data)) {
          list = rawData.data
          total = rawData.total ?? list.length
          pages = (rawData as any).total_pages ?? rawData.totalPages ?? (Math.ceil(total / perPage) || 1)
        }
      }

      setRecords(list)
      setTotalCount(total)
      setTotalPages(pages || 1)
    } catch (err: any) {
      console.error('Failed to fetch rework control center list:', err)
      if (!isSilent) {
        setToast({
          type: 'error',
          message: err.message || 'Failed to load rework control center data',
        })
        setRecords([])
      }
    } finally {
      setLoading(false)
    }
  }, [branchFilter, shiftFilter, teamFilter, fromDate, toDate, search, statusFilter, page, perPage])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Rework Control Center"
        description="Monitor and manage live rework control issues by branch, team, shift, and status."
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ReworkControlCenterList
        records={records}
        loading={loading}
        search={search}
        branchFilter={branchFilter}
        teamFilter={teamFilter}
        shiftFilter={shiftFilter}
        statusFilter={statusFilter}
        fromDate={fromDate}
        toDate={toDate}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        totalCount={totalCount}
        branches={branches}
        teams={teams}
        shifts={shifts}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        onBranchFilterChange={(val) => {
          setBranchFilter(val)
          setShiftFilter('')
          setTeamFilter('')
          setPage(1)
        }}
        onShiftFilterChange={(val) => {
          setShiftFilter(val)
          setTeamFilter('')
          setPage(1)
        }}
        onTeamFilterChange={(val) => {
          setTeamFilter(val)
          setPage(1)
        }}
        onStatusFilterChange={(val) => {
          setStatusFilter(val)
          setPage(1)
        }}
        onDateChange={(from, to) => {
          setFromDate(from)
          setToDate(to)
          setPage(1)
        }}
        onPageChange={setPage}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage)
          setPage(1)
        }}
        onRefresh={fetchRecords}
      />
    </AppLayout>
  )
}
