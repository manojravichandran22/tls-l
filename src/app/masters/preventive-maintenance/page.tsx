'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import PreventiveMaintenanceList from './_components/PreventiveMaintenanceList'
import PreventiveMaintenanceForm from './_components/PreventiveMaintenanceForm'
import type { MachineHistory, HistoryRecord } from './_components/types'
import { useExport } from '@/hooks/useExport'
import Tabs from '@/components/ui/Tabs'
import PreventiveMaintenanceHistoryList from './_components/PreventiveMaintenanceHistoryList'
import PreventiveMaintenanceHistoryDetail from './_components/PreventiveMaintenanceHistoryDetail'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'


export default function PreventiveMaintenancePage() {
  type Tab = 'maintenance' | 'history'
  const [tab, setTab] = useState<Tab>('maintenance')

  const { branchId, isAdmin } = useBranchAccess()
  const { branches } = useDropdownData({ branches: true })
  const [branchFilter, setBranchFilter] = useState('')
  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : branchFilter

  const { can } = usePermissions('Machine-History')
  const canList = can('maintenance.list')
  const canUpdate = can('maintenance.update')
  const canHistoryList = can('machine_history.list')
  const canHistoryShow = can('machine_history.show')

  const [toast, setToast] = useState<ToastData | null>(null)

  // ── Maintenance Tab State ──────────────────────────────────────────────────
  const [machines, setMachines] = useState<MachineHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [selected, setSelected] = useState<string[]>([])

  // Maintenance form state
  const [showForm, setShowForm] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<MachineHistory | null>(null)

  const { handleExport, exporting } = useExport<MachineHistory>({
    apiPath: '/history/historylist',
    payload: { search, ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}) },
    dataKey: 'machine_list',
    columns: [
      { header: 'Machine No', value: r => r.machine_no },
      { header: 'Brand', value: r => r.brand },
      { header: 'Model No', value: r => r.model_no },
      { header: 'Machine Type', value: r => r.machine_type_name },
      { header: 'Serial No', value: r => r.serial_no },
      { header: 'Last Oil Change', value: r => r.last_oil_change },
      { header: 'Next Maintenance', value: r => r.next_maintenance },
      { header: 'Remaining Days', value: r => String(r.rem_days) },
      { header: 'Branch', value: r => r.branch_name },
      { header: 'Zone', value: r => Array.isArray(r.zone_name) ? r.zone_name.filter(Boolean).join(', ') : (r.zone_name ?? '') },
      { header: 'Line', value: r => Array.isArray(r.line_name) ? r.line_name.filter(Boolean).join(', ') : (r.line_name ?? '') },
      { header: 'Condition', value: r => r.option_name },
    ],
    filename: 'Preventive_Maintenance',
  })

  const fetchMaintenance = useCallback(async () => {
    if (!canList) { setLoading(false); return }
    setLoading(true)
    try {
      const payload: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
        search,
        ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      }
      const res = await apiCall<{
        data?: {
          machine_list?: MachineHistory[]
          pagination?: { total: number; total_pages: number }
        }
      }>('/history/historylist', { method: 'GET', encrypt: false, payload })

      console.log('[PreventiveMaintenance] API Response:', res)

      const nested = res.data
      const rows = nested?.machine_list ?? []
      setMachines(rows)
      setTotalCount(nested?.pagination?.total ?? rows.length)
      setTotalPages(nested?.pagination?.total_pages ?? 1)
    } catch {
      setMachines([])
    } finally {
      setLoading(false)
    }
  }, [search, page, perPage, canList, effectiveBranchId])

  useEffect(() => { if (tab === 'maintenance') fetchMaintenance() }, [fetchMaintenance, tab])

  const handleMaintenanceClick = (machine: MachineHistory) => {
    setSelectedMachine(machine)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedMachine(null)
  }

  const handleFormSaved = (message: string) => {
    setToast({ message, type: 'success' })
    fetchMaintenance()
  }

  const handleFormError = (message: string) => {
    setToast({ message, type: 'error' })
  }

  // ── History Tab State ──────────────────────────────────────────────────────
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historyDateFrom, setHistoryDateFrom] = useState('')
  const [historyDateTo, setHistoryDateTo] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)
  const [historyTotalCount, setHistoryTotalCount] = useState(0)
  const [historyPerPage, setHistoryPerPage] = useState(PER_PAGE)

  const { handleExport: handleHistoryExport, exporting: historyExporting } = useExport<HistoryRecord>({
    apiPath: '/history/list',
    method: 'POST',
    payload: {
      search: historySearch,
      page: String(historyPage),
      per_page: String(historyPerPage),
      date_from: historyDateFrom,
      date_to: historyDateTo,
      status: 'all',
      assigned_to: '',
      machine_id: '',
      type: '',
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
    },
    dataKey: 'records',
    columns: [
      { header: 'Machine Name', value: r => r.machineType?.type_name ?? '' },
      { header: 'Machine No', value: r => r.machine_no ?? r.machine?.machine_no ?? '' },
      { header: 'Brand', value: r => r.machine?.brand ?? '' },
      { header: 'Model No', value: r => r.model_no ?? r.machine?.model_no ?? '' },
      { header: 'Serial No', value: r => r.serial_no ?? r.machine?.serial_no ?? '' },
      { header: 'Branch', value: r => r.branch?.branch_name ?? r.branch_name ?? '' },
      { header: 'Last Service Date', value: r => r.last_service_date?.slice(0, 10) ?? '' },
      { header: 'Next Service Date', value: r => r.next_service_date?.slice(0, 10) ?? '' },
      { header: 'Notes', value: r => r.notes ?? '' },
      { header: 'Status', value: r => (r.status === 1 ? 'Active' : 'Inactive') },
    ],
    filename: 'Machine_History',
  })

  const fetchMachineHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const payload: Record<string, any> = {
        page: historyPage,
        per_page: historyPerPage,
        search: historySearch,
        date_from: historyDateFrom,
        date_to: historyDateTo,
        status: 'all',
        assigned_to: '',
        machine_id: '',
        type: '',
        check_uuid: [],
        check_box_heading: [],
        ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      }
      const res = await apiCall<{
        data?: {
          records?: HistoryRecord[]
          pagination?: { total: number; total_pages: number }
        }
      }>('/history/list', { method: 'POST', encrypt: false, payload })

      console.log('[History] API Response:', res)

      const nested = res.data
      const rows = nested?.records ?? []
      setHistoryRecords(rows)
      setHistoryTotalCount(nested?.pagination?.total ?? rows.length)
      setHistoryTotalPages(nested?.pagination?.total_pages ?? 1)
    } catch {
      setHistoryRecords([])
    } finally {
      setHistoryLoading(false)
    }
  }, [historySearch, historyPage, historyPerPage, historyDateFrom, historyDateTo, effectiveBranchId])

  useEffect(() => { if (tab === 'history') fetchMachineHistory() }, [fetchMachineHistory, tab])

  const [historyDetail, setHistoryDetail] = useState<HistoryRecord | null>(null)
  const [historyDetailLoading, setHistoryDetailLoading] = useState(false)

  const handleHistoryView = async (row: HistoryRecord) => {
    setHistoryDetailLoading(true)
    try {
      const targetBranchId = row.branch_id ? String(row.branch_id) : effectiveBranchId
      const payload: Record<string, string> = { uuid: row.uuid }
      if (targetBranchId) payload.branch_id = targetBranchId

      const res = await apiCall<{ data?: HistoryRecord }>(
        '/history/show',
        { method: 'GET', encrypt: false, payload }
      )
      console.log('[History Show] API Response:', res)
      setHistoryDetail(res.data ?? null)
    } catch {
      setToast({ message: 'Failed to load history detail', type: 'error' })
    } finally {
      setHistoryDetailLoading(false)
    }
  }

  const handleHistoryDetailClose = () => setHistoryDetail(null)

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {historyDetail && (
        <PreventiveMaintenanceHistoryDetail
          record={historyDetail}
          onClose={handleHistoryDetailClose}
        />
      )}

      {showForm && selectedMachine && (
        <PreventiveMaintenanceForm
          machine={selectedMachine}
          branches={branches}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
          onError={handleFormError}
        />
      )}

      <PageHeader title="Preventive Maintenance" description="View history and preventive maintenance of machines." />
      <Tabs
        tabs={[
          { value: 'maintenance', label: 'Maintenance' },
          { value: 'history', label: 'History' },
        ]}
        active={tab}
        onChange={t => setTab(t as Tab)}
      />

      {tab === 'maintenance' && (
        <PreventiveMaintenanceList
          machines={machines}
          branches={branches}
          branchFilter={branchFilter}
          onBranchChange={val => { setBranchFilter(val); setPage(1) }}
          loading={loading}
          page={page}
          perPage={perPage}
          totalPages={totalPages}
          totalCount={totalCount}
          search={search}
          onSearchChange={val => {
            setSearch(val)
            setPage(1)
          }}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          onExport={handleExport}
          exporting={exporting}
          onMaintenanceClick={handleMaintenanceClick}
          canList={canList}
          canUpdate={canUpdate}
        />
      )}

      {tab === 'history' && (
        <PreventiveMaintenanceHistoryList
          records={historyRecords}
          branches={branches}
          branchFilter={branchFilter}
          onBranchChange={val => { setBranchFilter(val); setHistoryPage(1) }}
          dateFrom={historyDateFrom}
          dateTo={historyDateTo}
          onDateRangeChange={(start, end) => {
            setHistoryDateFrom(start)
            setHistoryDateTo(end)
            setHistoryPage(1)
          }}
          loading={historyLoading}
          page={historyPage}
          perPage={historyPerPage}
          totalPages={historyTotalPages}
          totalCount={historyTotalCount}
          search={historySearch}
          onSearchChange={val => {
            setHistorySearch(val)
            setHistoryPage(1)
          }}
          onPageChange={setHistoryPage}
          onPerPageChange={setHistoryPerPage}
          onExport={handleHistoryExport}
          exporting={historyExporting}
          onViewClick={handleHistoryView}
          canList={canHistoryList}
          canShow={canHistoryShow}
        />
      )}
    </AppLayout>
  )
}
