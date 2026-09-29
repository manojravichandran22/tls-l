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
import type { TlsAuditLightConfigItem, UpdateLightConfigPayload, LightConfigHistoryRecord } from './types'
import LightConfigurationList from './_components/LightConfigurationList'
import LightConfigurationHistoryList from './_components/LightConfigurationHistoryList'

type Tab = 'configuration' | 'history'

export default function LightConfigurationPage() {
  const { can } = usePermissions('LightConfiguration')
  const canList = can('lightConfiguration.list')
  const canHistoryList = can('lightConfiguration.historylist')

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

  const [items, setItems] = useState<TlsAuditLightConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)

  const [search, setSearch] = useState('')

  // ── Branch access ─────────────────────────────────────────────────────────────
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

  // ── Configuration tab ─────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    if (!canList) {
      setLoading(false)
      setItems([])
      return
    }

    setLoading(true)
    try {
      const payload: Record<string, any> = {}
      if (effectiveBranchId) {
        payload.branch_id = effectiveBranchId
      }

      const res = await apiCall<any>('/tlsAuditLightConfiguration/list', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      // Parse list data from response
      const listData = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res)
            ? res
            : []

      setItems(listData)
    } catch (err: any) {
      console.error('Failed to fetch light configurations:', err)
      setToast({
        type: 'error',
        message: err.message || 'Failed to fetch light configurations',
      })
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [canList, effectiveBranchId])

  useEffect(() => {
    if (tab === 'configuration' && canList) fetchList()
  }, [fetchList, tab, canList])

  const handleSaveAll = async (payloads: UpdateLightConfigPayload[]) => {
    setUpdating(true)
    try {
      const results = await Promise.all(
        payloads.map((payload) =>
          apiCall<any>('/tlsAuditLightConfiguration/update', {
            method: 'POST',
            encrypt: false,
            payload: {
              id: payload.id,
              defect_qty: payload.defect_qty === '' ? null : payload.defect_qty,
              updated_light: payload.updated_light,
              ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
            },
          })
        )
      )

      const hasError = results.some((res) => res && res.success === false)
      if (hasError) {
        setToast({
          type: 'error',
          message: 'Some configurations could not be updated',
        })
        return false
      }

      setToast({
        type: 'success',
        message: 'Configuration saved successfully',
      })

      await fetchList()
      return true
    } catch (err: any) {
      console.error('Failed to update light configuration:', err)
      setToast({
        type: 'error',
        message: err.message || 'Failed to update light configuration',
      })
      return false
    } finally {
      setUpdating(false)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      const payload: Record<string, any> = {}
      if (effectiveBranchId) {
        payload.branch_id = effectiveBranchId
      }

      const res = await apiCall<any>('/tlsAuditLightConfiguration/reset', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      if (res && res.success === false) {
        setToast({
          type: 'error',
          message: res.message || 'Failed to reset light configurations',
        })
        return
      }

      setToast({
        type: 'success',
        message: 'All light configurations have been reset to defaults',
      })

      await fetchList()
    } catch (err: any) {
      console.error('Failed to reset light configurations:', err)
      setToast({
        type: 'error',
        message: err.message || 'Failed to reset light configurations',
      })
    } finally {
      setResetting(false)
    }
  }

  // ── History tab ───────────────────────────────────────────────────────────────
  const [historyRecords, setHistoryRecords] = useState<LightConfigHistoryRecord[]>([])
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
      const payload: Record<string, any> = {
        page: historyPage,
        per_page: historyPerPage,
        search: historySearch,
      }
      if (effectiveBranchId) {
        payload.branch_id = effectiveBranchId
      }

      const res = await apiCall<any>('/tlsAuditLightConfiguration/historylist', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      console.log('[LightConfig History] API Response:', res)

      // Normalise: support { data: [...] } | { data: { data: [...], pagination: {...} } } | [...]
      const nested = res?.data
      let rows: LightConfigHistoryRecord[] = []
      let total = 0
      let totalPages = 1

      if (Array.isArray(nested)) {
        rows = nested
        total = nested.length
      } else if (Array.isArray(nested?.data)) {
        rows = nested.data
        total = nested?.pagination?.total ?? nested.data.length
        totalPages = nested?.pagination?.total_pages ?? 1
      } else if (Array.isArray(res)) {
        rows = res
        total = res.length
      }

      setHistoryRecords(rows)
      setHistoryTotalCount(total)
      setHistoryTotalPages(totalPages)
    } catch (err: any) {
      console.error('Failed to fetch light configuration history:', err)
      setHistoryRecords([])
    } finally {
      setHistoryLoading(false)
    }
  }, [canHistoryList, historySearch, historyPage, historyPerPage, effectiveBranchId])

  useEffect(() => {
    if (tab === 'history' && canHistoryList) fetchHistory()
  }, [fetchHistory, tab, canHistoryList])

  return (
    <AppLayout fixedHeight>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      <PageHeader
        title="Light Configuration"
        description="Manage and customize light alert signals and defect thresholds for TLS audit and quality checks"
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
          <LightConfigurationList
            items={items}
            loading={loading}
            updating={updating}
            resetting={resetting}
            search={search}
            onSearchChange={setSearch}
            onSaveAll={handleSaveAll}
            onReset={handleReset}
            isAdmin={isAdmin}
            branchId={branchId}
            branches={branches}
            branchFilter={branchFilter}
            onBranchFilterChange={handleBranchFilterChange}
          />
        )}

        {tab === 'history' && canHistoryList && (
          <LightConfigurationHistoryList
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
            isAdmin={isAdmin}
            branchId={branchId}
            branches={branches}
            branchFilter={branchFilter}
            onBranchFilterChange={handleBranchFilterChange}
            canList={canHistoryList}
          />
        )}
      </div>

      {!canList && !canHistoryList && (
        <div className="flex-1 flex items-center justify-center p-8 bg-card rounded-xl border border-input-line text-center">
          <div>
            <p className="text-sm font-semibold text-t-primary">Access Restricted</p>
            <p className="text-xs text-t-muted mt-1">
              You do not have permission to view Light Configuration or History.
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
