'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import Tabs from '@/components/ui/Tabs'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'
import type { KpiMasterItem, KpiMasterSections, KpiHistoryRecord, UpdateKpiPayload } from './types'
import KpiConfigurationList from './_components/KpiConfigurationList'
import KpiConfigurationHistoryList from './_components/KpiConfigurationHistoryList'

type Tab = 'configuration' | 'history'

export default function KpiConfigurationPage() {
  const { can, permSet } = usePermissions('Kpimaster')

  // Allow access if user has explicit permission (kpiMaster.list) OR fallback if permissions not loaded yet
  const canList = can('kpiMaster.list') || can('kpiConfiguration.list') || permSet.size === 0
  const canHistoryList = can('kpiMaster.historylist') || can('kpiConfiguration.historylist') || permSet.size === 0

  const availableTabs = useMemo(() => [
    ...(canList ? [{ value: 'configuration' as Tab, label: 'Configuration' }] : []),
    ...(canHistoryList ? [{ value: 'history' as Tab, label: 'History' }] : []),
  ], [canList, canHistoryList])

  const [tab, setTab] = useState<Tab>('configuration')

  // Auto-switch tab based on permissions
  useEffect(() => {
    if (!canList && canHistoryList) {
      setTab('history')
    } else if (canList && !canHistoryList) {
      setTab('configuration')
    }
  }, [canList, canHistoryList])

  const [sections, setSections] = useState<KpiMasterSections>({})
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [search, setSearch] = useState('')

  // ── Branch Access (Hidden in UI, automatically passed to APIs) ───────────────
  const [branchFilter, setBranchFilter] = useState('')
  const { branchId, isAdmin, user } = useBranchAccess()
  const { branches } = useDropdownData({ branches: true })
  const effectiveBranchId =
    branchId != null
      ? String(branchId)
      : (user?.['branch_id'] != null
          ? String(user['branch_id'])
          : (branchFilter || (branches && branches.length > 0 ? String(branches[0].id) : '')))

  const handleBranchFilterChange = (val: string) => {
    setBranchFilter(val)
    setHistoryPage(1)
  }

  // ── Configuration Tab ──────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    if (!canList) {
      setLoading(false)
      setSections({})
      return
    }

    setLoading(true)
    try {
      const payload: any = {
        module: '',
        search: search || '',
        type: '',
        ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      }

      const res = await apiCall<any>('/kpimaster/list', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      console.log('[KpiMaster List] API Response:', res)

      // Expected format: res.data = { "MASTER INPUTS": [ ... ], "TLS AUDIT FAILURE": [ ... ] }
      const rawData = res?.data ?? res
      const grouped: KpiMasterSections = {}

      if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
        const target = rawData.data && typeof rawData.data === 'object' && !Array.isArray(rawData.data)
          ? rawData.data
          : rawData

        Object.entries(target).forEach(([secName, val]) => {
          if (Array.isArray(val)) {
            grouped[secName] = val.map((it: any) => ({
              ...it,
              module: it.module || secName,
            }))
          }
        })
      } else if (Array.isArray(rawData)) {
        rawData.forEach((it: any) => {
          const sec = it.module || 'MASTER INPUTS'
          if (!grouped[sec]) grouped[sec] = []
          grouped[sec].push(it)
        })
      }

      setSections(grouped)
    } catch (err: any) {
      console.error('Failed to fetch KPI configurations:', err)
      setToast({
        type: 'error',
        message: err.message || 'Failed to fetch KPI configurations',
      })
      setSections({})
    } finally {
      setLoading(false)
    }
  }, [canList, search, effectiveBranchId])

  useEffect(() => {
    if (tab === 'configuration' && canList) {
      fetchList()
    }
  }, [fetchList, tab, canList])

  const handleSaveAll = async (payloads: UpdateKpiPayload[]): Promise<boolean | void> => {
    setUpdating(true)
    try {
      const results = await Promise.all(
        payloads.map((p) =>
          apiCall<any>('/kpimaster/update', {
            method: 'POST',
            encrypt: false,
            payload: {
              id: Number(p.id) || p.id,
              threshold: String(p.threshold),
              ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
            },
          })
        )
      )

      const hasError = results.some((r) => r && (r.success === false || r.status === false))
      if (hasError) {
        setToast({
          type: 'error',
          message: 'Some KPI thresholds could not be updated',
        })
        return false
      }

      setToast({
        type: 'success',
        message: 'KPI configuration saved successfully',
      })

      await fetchList()
      return true
    } catch (err: any) {
      console.error('Failed to update KPI configuration:', err)
      setToast({
        type: 'error',
        message: err.message || 'Failed to update KPI configuration',
      })
      return false
    } finally {
      setUpdating(false)
    }
  }

  // ── History Tab ───────────────────────────────────────────────────────────────
  const [historyRecords, setHistoryRecords] = useState<KpiHistoryRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPerPage, setHistoryPerPage] = useState(PER_PAGE)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)
  const [historyTotalCount, setHistoryTotalCount] = useState(0)

  const fetchHistory = useCallback(async () => {
    if (!canHistoryList) {
      setHistoryLoading(false)
      setHistoryRecords([])
      return
    }

    setHistoryLoading(true)
    try {
      const payload: any = {
        module: '',
        search: historySearch || '',
        type: '',
        page: historyPage,
        per_page: historyPerPage,
        ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      }

      const res = await apiCall<any>('/kpimaster/historylist', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      console.log('[KpiMaster History] API Response:', res)

      const nested = res?.data
      let rows: KpiHistoryRecord[] = []
      let total = 0
      let totalPages = 1

      if (Array.isArray(nested)) {
        rows = nested
        total = nested.length
      } else if (Array.isArray(nested?.data)) {
        rows = nested.data
        total = nested?.pagination?.total ?? nested.data.length
        totalPages = nested?.pagination?.total_pages ?? 1
      } else if (nested && typeof nested === 'object') {
        Object.entries(nested).forEach(([sec, val]) => {
          if (Array.isArray(val)) {
            val.forEach((item: any) => {
              rows.push({
                ...item,
                module: item.module || sec,
              })
            })
          }
        })
        total = rows.length
      } else if (Array.isArray(res)) {
        rows = res
        total = res.length
      }

      setHistoryRecords(rows)
      setHistoryTotalCount(total)
      setHistoryTotalPages(totalPages)
    } catch (err: any) {
      console.error('Failed to fetch KPI configuration history:', err)
      setHistoryRecords([])
    } finally {
      setHistoryLoading(false)
    }
  }, [canHistoryList, historySearch, historyPage, historyPerPage, effectiveBranchId])

  useEffect(() => {
    if (tab === 'history' && canHistoryList) {
      fetchHistory()
    }
  }, [fetchHistory, tab, canHistoryList])

  return (
    <AppLayout fixedHeight>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      <PageHeader
        title="KPI Configuration Master"
        description="Manage and customize KPI benchmark scores, thresholds, and target values"
      />

      {availableTabs.length > 0 && (
        <Tabs
          tabs={availableTabs}
          active={tab}
          onChange={(t) => setTab(t as Tab)}
        />
      )}

      <div className="flex-1 min-h-0 flex flex-col mt-2">
        {tab === 'configuration' && canList && (
          <KpiConfigurationList
            sections={sections}
            loading={loading}
            updating={updating}
            search={search}
            onSearchChange={setSearch}
            onSaveAll={handleSaveAll}
            isAdmin={isAdmin}
            branchId={branchId}
            branches={branches}
            branchFilter={branchFilter}
            onBranchFilterChange={handleBranchFilterChange}
          />
        )}

        {tab === 'history' && canHistoryList && (
          <KpiConfigurationHistoryList
            records={historyRecords}
            loading={historyLoading}
            search={historySearch}
            onSearchChange={(val) => {
              setHistorySearch(val)
              setHistoryPage(1)
            }}
            page={historyPage}
            perPage={historyPerPage}
            totalPages={historyTotalPages}
            totalCount={historyTotalCount}
            onPageChange={setHistoryPage}
            onPerPageChange={(pp) => {
              setHistoryPerPage(pp)
              setHistoryPage(1)
            }}
            canList={canHistoryList}
            isAdmin={isAdmin}
            branchId={branchId}
            branches={branches}
            branchFilter={branchFilter}
            onBranchFilterChange={handleBranchFilterChange}
          />
        )}
      </div>

      {!canList && !canHistoryList && (
        <div className="flex-1 flex items-center justify-center p-8 bg-card rounded-xl border border-input-line text-center">
          <div>
            <p className="text-sm font-semibold text-t-primary">Access Restricted</p>
            <p className="text-xs text-t-muted mt-1">
              You do not have permission to view KPI Configuration or History.
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
