'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import Toast, { type ToastData } from '@/components/ui/Toast'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { type OptionRecord } from './_components/types'
import OptionList from './_components/OptionList'
import OptionForm from './_components/OptionForm'
import OptionView from './_components/OptionView'
import { useExport } from '@/hooks/useExport'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'

export default function OptionMasterPage() {
  const [options, setOptions] = useState<OptionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [deleting, setDeleting] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editOption, setEditOption] = useState<OptionRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<OptionRecord | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  // ── Branch access ─────────────────────────────────────────────────────────────
  const [branchFilter, setBranchFilter] = useState('')
  const { branchId, isAdmin } = useBranchAccess()
  const { branches } = useDropdownData({ branches: true })
  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : branchFilter

  const { handleExport, exporting } = useExport<Record<string, unknown>>({
    apiPath: '/option/list',
    payload: {
      search,
      type: typeFilter,
      status: filterStatus || 'all',
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
    },
    dataKey: 'records',
    columns: [
      { header: 'Type', value: r => (r as Record<string, unknown>).type as string || '' },
      { header: 'Value', value: r => (r as Record<string, unknown>).value as string || '' },
      { header: 'Branch', value: r => ((r as any)?.branch?.branch_name || '') },
      { header: 'Status', value: r => (r as Record<string, unknown>).is_active === 1 ? 'Active' : 'Inactive' },
    ],
    filename: 'Options',
  })

  const fetchOptions = useCallback(async () => {
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        page: String(page),
        per_page: String(perPage),
        search,
        type: typeFilter,
        status: filterStatus || 'all',
      }
      if (effectiveBranchId) payload.branch_id = effectiveBranchId

      const res = await apiCall<{
        data?: {
          records?: OptionRecord[]
          pagination?: { total: number; total_pages: number }
        }
      }>('/option/list', {
        method: 'GET',
        encrypt: false,
        payload,
      })
      const nested = res.data
      const rows = nested?.records ?? []
      setOptions(rows)
      setTotalCount(nested?.pagination?.total ?? rows.length)
      setTotalPages(nested?.pagination?.total_pages ?? 1)
    } catch {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [page, perPage, search, typeFilter, filterStatus, effectiveBranchId])

  useEffect(() => { fetchOptions() }, [fetchOptions])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const payload: Record<string, unknown> = { id: deleteTarget.id, uuid: deleteTarget.uuid }
      if (effectiveBranchId) payload.branch_id = effectiveBranchId

      const res = await apiCall<{ success?: boolean; message?: string }>('/option/delete', { payload })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Option deleted successfully', type: 'success' })
      setDeleteTarget(null)
      fetchOptions()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      setToast({ message: axiosErr.response?.data?.message || axiosErr.message || 'Failed to delete option', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const handleSaved = (msg: string) => {
    setToast({ message: msg, type: 'success' })
    fetchOptions()
  }

  const handleView = async (id: number) => {
    setViewLoading(true)
    setViewData({})
    try {
      const payload: Record<string, unknown> = { id: String(id) }
      if (effectiveBranchId) payload.branch_id = effectiveBranchId

      const res = await apiCall<{ data?: Record<string, unknown> }>('/option/show', { method: 'GET', encrypt: false, payload })
      setViewData(res.data ?? res)
    } catch {
      setViewData(null)
    } finally {
      setViewLoading(false)
    }
  }

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <OptionView
        viewData={viewData}
        viewLoading={viewLoading}
        onClose={() => setViewData(null)}
      />

      {showModal && (
        <OptionForm
          option={editOption}
          branches={branches}
          onClose={() => setShowModal(false)}
          onSave={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Option"
          message={<span>Are you sure you want to delete <strong>{deleteTarget.value}</strong>? This action cannot be undone.</span>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader
        title="Master Options"
        description="Manage generic application options like categories, severities, and machine types."
      />

      <OptionList
        options={options}
        loading={loading}
        search={search}
        typeFilter={typeFilter}
        filterStatus={filterStatus}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onTypeFilterChange={val => { setTypeFilter(val); setPage(1) }}
        onFilterStatusChange={val => { setFilterStatus(val); setPage(1) }}
        onAdd={() => { setEditOption(null); setShowModal(true) }}
        onView={handleView}
        onEdit={option => { setEditOption(option); setShowModal(true) }}
        onDelete={setDeleteTarget}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onExport={handleExport}
        exporting={exporting}
        selected={selected}
        onSelectionChange={setSelected}
        isAdmin={isAdmin}
        branches={branches}
        branchFilter={branchFilter}
        onBranchChange={val => { setBranchFilter(val); setPage(1) }}
        effectiveBranchId={effectiveBranchId}
      />
    </AppLayout>
  )
}
