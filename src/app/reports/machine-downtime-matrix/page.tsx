'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import MachineDowntimeMatrixList from './_components/MachineDowntimeMatrixList'
import type {
  MachineDowntimeMatrixRecord,
  MachineDowntimeMatrixSummary,
  MachineDowntimeMatrixDefectCategories,
  MachineDowntimeMatrixColumnTotals,
  MachineDowntimeMatrixColumnAverages,
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

export default function MachineDowntimeMatrixPage() {
  const { can } = usePermissions('Reports')
  const canList = can('report.machinedowntimematrixreport')

  const [records, setRecords] = useState<MachineDowntimeMatrixRecord[]>([])
  const [summary, setSummary] = useState<MachineDowntimeMatrixSummary | undefined>(undefined)
  const [defectCategories, setDefectCategories] = useState<MachineDowntimeMatrixDefectCategories | undefined>(undefined)
  const [allDefectColumns, setAllDefectColumns] = useState<string[]>([])
  const [columnTotals, setColumnTotals] = useState<MachineDowntimeMatrixColumnTotals | undefined>(undefined)
  const [columnAverages, setColumnAverages] = useState<MachineDowntimeMatrixColumnAverages | undefined>(undefined)

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const [branchFilter, setBranchFilter] = useState(() =>
    !isAdmin && userBranchId ? String(userBranchId) : ''
  )

  useEffect(() => {
    if (!isAdmin && userBranchId && !branchFilter) {
      setBranchFilter(String(userBranchId))
    }
  }, [isAdmin, userBranchId, branchFilter])

  const { branches } = useDropdownData({
    branches: true,
    branchId: branchFilter,
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
      from_date: fromDate || '',
      to_date: toDate || fromDate || '',
      type: '',
      search: search || '',
      ...(branchFilter ? { branch_id: branchFilter } : {}),
    }

    try {
      const res = await apiCall<any>('/newreports/machinedowntimematrixreport', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      console.log('Machine Downtime Matrix Response:', res)

      let list: MachineDowntimeMatrixRecord[] = []
      let sumData: MachineDowntimeMatrixSummary | undefined = undefined
      let defCats: MachineDowntimeMatrixDefectCategories | undefined = undefined
      let defCols: string[] = []
      let colTotals: MachineDowntimeMatrixColumnTotals | undefined = undefined
      let colAvgs: MachineDowntimeMatrixColumnAverages | undefined = undefined

      const d = res?.data

      if (d) {
        if (Array.isArray(d.records)) list = d.records
        if (d.summary)              sumData  = d.summary
        if (d.defect_categories)    defCats  = d.defect_categories
        if (Array.isArray(d.all_defect_columns)) defCols = d.all_defect_columns
        if (d.column_totals)        colTotals = d.column_totals
        if (d.column_averages)      colAvgs   = d.column_averages
      }

      setRecords(list)
      setSummary(sumData)
      setDefectCategories(defCats)
      setAllDefectColumns(defCols)
      setColumnTotals(colTotals)
      setColumnAverages(colAvgs)
    } catch (err: any) {
      console.error('Failed to fetch machine downtime matrix report:', err)
      setToast({
        type: 'error',
        message: err.message || 'Failed to load machine downtime matrix report data',
      })
      setRecords([])
      setSummary(undefined)
    } finally {
      setLoading(false)
    }
  }, [canList, branchFilter, fromDate, toDate, search])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  if (!canList && !loading) {
    return (
      <AppLayout fixedHeight>
        <PageHeader
          title="Machine Downtime Matrix"
          description="Comprehensive matrix report of machine health, downtime, defect counts, and financial impact across all machines."
        />
        <div className="flex-1 flex items-center justify-center text-t-secondary font-medium p-8">
          You do not have permission to view Machine Downtime Matrix.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Machine Downtime Matrix"
        description="Comprehensive matrix report of machine health, downtime, defect counts, and financial impact across all machines."
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <MachineDowntimeMatrixList
        records={records}
        summary={summary}
        defectCategories={defectCategories}
        allDefectColumns={allDefectColumns}
        columnTotals={columnTotals}
        columnAverages={columnAverages}
        loading={loading}
        search={search}
        fromDate={fromDate}
        toDate={toDate}
        branches={branches}
        branchFilter={branchFilter}
        onSearchChange={setSearch}
        onBranchFilterChange={(val) => setBranchFilter(val)}
        onDateRangeChange={(start, end) => {
          setFromDate(start)
          setToDate(end)
        }}
      />
    </AppLayout>
  )
}
