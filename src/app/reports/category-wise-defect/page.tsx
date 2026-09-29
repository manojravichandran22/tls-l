'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import CategoryWiseDefectList from './_components/CategoryWiseDefectList'
import type { CategoryWiseDefectRecord, CategoryWiseDefectSummary, CategoryWiseDefectFilterMetadata } from './types'
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

import { Lock } from 'lucide-react'

export default function CategoryWiseDefectPage() {
  const { can } = usePermissions('Reports')
  const canList = can('report.categorywisedefectreport') || can('categorywisedefectreport')

  const [records, setRecords] = useState<CategoryWiseDefectRecord[]>([])
  const [summary, setSummary] = useState<CategoryWiseDefectSummary | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [shiftFilter, setShiftFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [lineFilter, setLineFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [defectFilter, setDefectFilter] = useState('')

  const [filterMetadata, setFilterMetadata] = useState<CategoryWiseDefectFilterMetadata>({
    branches: [],
    teams: [],
    shifts: [],
    zones: [],
    lines: [],
    defect_categories: [],
    severities: [],
    defects: [],
  })

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

  const branchList = useMemo(() => branches.map(b => ({ id: b.id, name: b.branch_name })), [branches])
  const shiftList = useMemo(() => shifts.map(s => ({ id: s.id, name: s.shift_name })), [shifts])
  const teamList = useMemo(() => teams.map(t => ({ id: t.id, name: t.team_name || (t as any).name || '' })), [teams])
  const zoneList = useMemo(() => zones.map(z => ({ id: z.id, name: z.zone_name || (z as any).name || '' })), [zones])
  const lineList = useMemo(() => lines.map(l => ({ id: l.id, name: l.line_name || (l as any).line_no || (l as any).name || '' })), [lines])

  const defectCategories = useMemo(() => {
    const list = filterMetadata.defect_categories || []
    const seen = new Set()
    return list.filter((item) => {
      const key = item.id ?? item.name
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [filterMetadata.defect_categories])

  const severities = useMemo(() => {
    const list = filterMetadata.severities || []
    const seen = new Set()
    return list.filter((item) => {
      const key = item.id ?? item.name
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [filterMetadata.severities])

  const defects = useMemo(() => {
    const list = filterMetadata.defects || []
    const seen = new Set()
    return list.filter((item) => {
      const key = item.id ?? item.name
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [filterMetadata.defects])

  const [fromDate, setFromDate] = useState(getTodayDateString())
  const [toDate, setToDate] = useState(getTodayDateString())

  const [toast, setToast] = useState<ToastData | null>(null)

  // Fetch filter metadata from POST /livetracking/categorywisedefectreport/filters
  useEffect(() => {
    let isMounted = true
    apiCall<any>('/livetracking/categorywisedefectreport/filters', {
      method: 'POST',
      encrypt: false,
      payload: {
        branch_id: branchFilter || '',
        team_id: teamFilter || '',
        shift_id: shiftFilter || '',
        zone_id: zoneFilter || '',
        line_id: lineFilter || '',
        def_category: categoryFilter || '',
        severity: severityFilter || '',
        defect: defectFilter || '',
        type: '',
      },
    })
      .then((res) => {
        if (!isMounted) return
        const data = res?.data || {}
        setFilterMetadata({
          branches: Array.isArray(data.branches) ? data.branches : [],
          teams: Array.isArray(data.teams) ? data.teams : [],
          shifts: Array.isArray(data.shifts) ? data.shifts : [],
          zones: Array.isArray(data.zones) ? data.zones : [],
          lines: Array.isArray(data.lines) ? data.lines : [],
          defect_categories: Array.isArray(data.defect_categories) ? data.defect_categories : [],
          severities: Array.isArray(data.severities) ? data.severities : [],
          defects: Array.isArray(data.defects) ? data.defects : [],
        })
      })
      .catch((err) => {
        console.error('Failed to fetch filter metadata:', err)
      })

    return () => {
      isMounted = false
    }
  }, [branchFilter, teamFilter, shiftFilter, zoneFilter, lineFilter, categoryFilter, severityFilter, defectFilter])

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const payload: Record<string, any> = {
      search: search || '',
      date_from: fromDate,
      date_to: toDate || fromDate,
      from_date: fromDate,
      to_date: toDate || fromDate,
      branch_id: branchFilter || '',
      team_id: teamFilter || '',
      shift_id: shiftFilter || '',
      shift_allocation_id: shiftFilter || '',
      zone_id: zoneFilter || '',
      line_id: lineFilter || '',
      def_category: categoryFilter || '',
      severity: severityFilter || '',
      defect: defectFilter || '',
      type: '',
    }

    try {
      const res = await apiCall<{
        success?: boolean
        message?: string
        data?: {
          total?: number
          data?: CategoryWiseDefectRecord[]
          summary?: CategoryWiseDefectSummary
        } | CategoryWiseDefectRecord[]
      }>('/livetracking/categorywisedefectreport', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      const rawData = res?.data
      let list: CategoryWiseDefectRecord[] = []
      let sum: CategoryWiseDefectSummary | undefined = undefined

      if (Array.isArray(rawData)) {
        list = rawData
      } else if (rawData && typeof rawData === 'object') {
        if (Array.isArray((rawData as any).data)) {
          list = (rawData as any).data
        }
        if ((rawData as any).summary) {
          sum = (rawData as any).summary
        }
      }

      setRecords(list)
      setSummary(sum)
    } catch (err: any) {
      console.error('Failed to fetch category wise defect report:', err)
      setToast({
        type: 'error',
        message: err.message || 'Failed to load category wise defect report data',
      })
      setRecords([])
      setSummary(undefined)
    } finally {
      setLoading(false)
    }
  }, [branchFilter, teamFilter, shiftFilter, zoneFilter, lineFilter, categoryFilter, severityFilter, defectFilter, fromDate, toDate, search])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  if (!canList) {
    return (
      <AppLayout fixedHeight>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center mb-4 text-t-muted">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-semibold text-t-primary mb-2">Access Restricted</h2>
          <p className="text-sm text-t-secondary max-w-md">
            You do not have permission to view the Category Wise Defect Report. Please contact your administrator.
          </p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Category Wise Defect Report"
        description="Comprehensive category-wise defect report with output, rejections, efficiency %, defects, severity, cost per piece, and estimated loss."
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <CategoryWiseDefectList
        records={records}
        summary={summary}
        loading={loading}
        search={search}
        branchFilter={branchFilter}
        teamFilter={teamFilter}
        shiftFilter={shiftFilter}
        zoneFilter={zoneFilter}
        lineFilter={lineFilter}
        categoryFilter={categoryFilter}
        severityFilter={severityFilter}
        defectFilter={defectFilter}
        fromDate={fromDate}
        toDate={toDate}
        branches={branchList}
        teams={teamList}
        shifts={shiftList}
        zones={zoneList}
        lines={lineList}
        defectCategories={defectCategories}
        severities={severities}
        defects={defects}
        onSearchChange={setSearch}
        onBranchFilterChange={(val) => {
          setBranchFilter(val)
          setTeamFilter('')
          setShiftFilter('')
          setZoneFilter('')
          setLineFilter('')
          setCategoryFilter('')
          setSeverityFilter('')
          setDefectFilter('')
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
        onCategoryFilterChange={setCategoryFilter}
        onSeverityFilterChange={setSeverityFilter}
        onDefectFilterChange={setDefectFilter}
        onDateRangeChange={(start, end) => {
          setFromDate(start)
          setToDate(end)
        }}
        onRefresh={fetchRecords}
      />
    </AppLayout>
  )
}
