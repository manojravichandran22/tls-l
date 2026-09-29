'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import TlsControlCenterList from './_components/TlsControlCenterList'
import type { TlsIssueRecord } from './types'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'

export default function TlsControlCenterPage() {
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

  const [records, setRecords] = useState<TlsIssueRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')

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

  const fetchTlsIssues = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const res = await apiCall<{
        success?: boolean
        message?: string
        data?: {
          data?: TlsIssueRecord[]
          total?: number
          limit?: number
          page?: number
          count?: number
          totalPages?: number
          pagination?: { total: number; total_pages: number }
        } | TlsIssueRecord[]
      }>('/livetracking/tlsissue', {
        method: 'POST',
        encrypt: false,
        payload: {
          search: search || '',
          status: statusFilter === 'all' ? '' : statusFilter,
          branch_id: branchFilter || '',
          team_id: teamFilter || '',
          shift_id: shiftFilter || '',
          type: '',
          page: String(page),
          limit: String(perPage),
          per_page: String(perPage),
        },
      })

      const rawData = res?.data
      let list: TlsIssueRecord[] = []
      let total = 0
      let totalP = 1

      if (Array.isArray(rawData)) {
        list = rawData
        total = rawData.length
        totalP = Math.ceil(total / perPage) || 1
      } else if (rawData && typeof rawData === 'object') {
        list = Array.isArray(rawData.data) ? rawData.data : Array.isArray((rawData as any).records) ? (rawData as any).records : []
        total = rawData.total ?? (rawData as any).count ?? list.length
        totalP = (rawData as any).total_pages ?? rawData.totalPages ?? rawData.pagination?.total_pages ?? (Math.ceil(total / perPage) || 1)
      }

      setRecords(list)
      setTotalCount(total)
      setTotalPages(totalP)
    } catch (error: any) {
      console.error('Failed to fetch TLS Control Center issue data:', error)
      if (!isSilent) {
        setToast({ type: 'error', message: 'Failed to load TLS Control Center issue data' })
        setRecords([])
        setTotalCount(0)
        setTotalPages(1)
      }
    } finally {
      setLoading(false)
    }
  }, [page, perPage, search, branchFilter, teamFilter, shiftFilter, statusFilter])

  useEffect(() => {
    fetchTlsIssues()
  }, [fetchTlsIssues])

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="TLS Control Center"
        description="Monitor and manage live TLS issues by branch, team, shift, and status."
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <TlsControlCenterList
        records={records}
        loading={loading}
        search={search}
        branchFilter={branchFilter}
        teamFilter={teamFilter}
        shiftFilter={shiftFilter}
        statusFilter={statusFilter}
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
        onPageChange={setPage}
        onPerPageChange={(newPerPage) => {
          setPerPage(newPerPage)
          setPage(1)
        }}
        onRefresh={fetchTlsIssues}
      />
    </AppLayout>
  )
}
