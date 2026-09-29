'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import WorkListList from './_components/WorkListList'
import type { WorkEntry } from './_components/types'
import { apiCall } from '@/services/apiClient'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'

const formatDate = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getTodayStr = () => formatDate(new Date())

const getMondayStr = () => {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(today)
  monday.setDate(diff)
  return formatDate(monday)
}

export default function WorkListMasterPage() {
  const { can } = usePermissions('MobileCheckinList')
  const canList = can('mobilecheckin.list') || can('mobilecheckin')

  const { branchId: userBranchId } = useBranchAccess()

  const [activeTab, setActiveTab] = useState<'Today' | 'This Week'>('Today')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState(getTodayStr)
  const [endDate, setEndDate] = useState(getTodayStr)
  const [branchId, setBranchId] = useState('')
  const [shiftId, setShiftId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [entries, setEntries] = useState<WorkEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Initialize branch filter from user access if restricted to a specific branch
  useEffect(() => {
    if (userBranchId && !branchId) {
      setBranchId(String(userBranchId))
    }
  }, [userBranchId, branchId])

  const fetchWorkEntries = useCallback(async () => {
    if (!canList) {
      setLoading(false)
      setEntries([])
      return
    }
    setLoading(true)
    try {
      const res = await apiCall<{
        data?: {
          checkins?: Array<{
            id?: number
            user_id: number
            user_name: string
            employee_id: string
            role_id?: number
            role_name: string
            branch_id?: number | string
            branch_name: string
            shift_id?: number
            shift_name: string | null
            team_id?: number | string
            team_name?: string | null
            line_name: string
            status: number
            start_time: string
          }>
        }
      }>('/mobilecheckin/list', {
        method: 'POST',
        encrypt: false,
        payload: {
          from_date: startDate,
          to_date: endDate,
          search: search,
          user_id: '',
          employee_id: '',
          role_id: roleId,
          zone_id: '',
          shift_id: shiftId,
          team_id: teamId,
          company_id: '',
          branch_id: branchId,
          page: '1',
          per_page: '1000',
        },
      })

      const checkins = res.data?.checkins ?? []
      const mapped: WorkEntry[] = checkins.map((row, index) => ({
        id: row.id || row.user_id || (index + 1),
        branchName: row.branch_name ?? '',
        branchId: row.branch_id,
        shiftName: row.shift_name ?? '',
        shiftId: row.shift_id,
        teamName: row.team_name ?? '',
        teamId: row.team_id,
        role: row.role_name ?? '',
        roleId: row.role_id,
        empId: row.employee_id ?? '',
        title: row.employee_id ?? '',
        name: row.user_name ?? '',
        lines: row.line_name ? row.line_name.split(',').map(l => l.trim()).filter(Boolean) : [],
        status: row.status === 1 ? 'Active' : 'Inactive',
        startTime: row.start_time ?? '',
      }))

      setEntries(mapped)
    } catch (error) {
      console.error('Failed to fetch work entries:', error)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [canList, search, startDate, endDate, branchId, shiftId, teamId, roleId])

  useEffect(() => {
    fetchWorkEntries()
  }, [fetchWorkEntries])

  if (!canList && !loading) {
    return (
      <AppLayout fixedHeight>
        <PageHeader
          title="Work List Master"
          description="Define work types and department assignments for employees."
        />
        <div className="flex-1 flex items-center justify-center text-t-secondary font-medium p-8">
          You do not have permission to view Work List Master.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Work List Master"
        description="Define work types and department assignments for employees."
      />
      <WorkListList
        entries={entries}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        activeTab={activeTab}
        onTabChange={(tab) => {
          const newTab = tab as 'Today' | 'This Week'
          setActiveTab(newTab)
          if (newTab === 'Today') {
            setStartDate(getTodayStr())
            setEndDate(getTodayStr())
          } else if (newTab === 'This Week') {
            setStartDate(getMondayStr())
            setEndDate(getTodayStr())
          }
        }}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={(start, end) => {
          setStartDate(start)
          setEndDate(end)
        }}
        branchId={branchId}
        onBranchChange={(val) => {
          setBranchId(val)
          setShiftId('')
          setTeamId('')
        }}
        shiftId={shiftId}
        onShiftChange={(val) => {
          setShiftId(val)
          setTeamId('')
        }}
        teamId={teamId}
        onTeamChange={(val) => { setTeamId(val) }}
        roleId={roleId}
        onRoleChange={(val) => { setRoleId(val) }}
      />
    </AppLayout>
  )
}
