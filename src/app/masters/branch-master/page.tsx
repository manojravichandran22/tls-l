'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast, { type ToastData } from '@/components/ui/Toast'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import BranchList from './_components/BranchList'
import BranchForm from './_components/BranchForm'
import BranchView from './_components/BranchView'
import { useDropdownData } from '@/hooks/useDropdownData'
import { clearDropdownCache } from '@/services/dropdownService'
import type { Branch } from './_components/types'
import { useExport } from '@/hooks/useExport'
import { useBranchAccess } from '@/hooks/useBranchAccess'

export default function BranchMasterPage() {
  const { companies } = useDropdownData({ companies: true })
  const { branchId, isAdmin } = useBranchAccess()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCompanyId, setFilterCompanyId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [selected, setSelected] = useState<string[]>([])

  const [showForm, setShowForm] = useState(false)
  const [editBranch, setEditBranch] = useState<Branch | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  const { handleExport, exporting } = useExport<Branch>({
    apiPath: '/branch/branchList',
    payload: {
      search,
      branch_name: '',
      branch_code: '',
      factory_id: '',
      status: filterStatus || '',
      ...(!isAdmin && branchId ? { branch_id: String(branchId) } : {}),
      ...(filterCompanyId ? { company_id: filterCompanyId } : {}),
      ...(selected.length > 0 ? { check_uuid: selected } : {}),
    },
    dataKey: 'branches',
    columns: [
      { key: 'branch_name', header: 'Branch Name', value: r => r.branch_name },
      { key: 'branch_code', header: 'Branch Code', value: r => r.branch_code || '' },
      { key: 'company_name', header: 'Company Name', value: r => r.company?.company_name || '' },
      { key: 'company_code', header: 'Company Code', value: r => r.company?.company_code || '' },
      { key: 'address', header: 'Address', value: r => r.address || '' },
      { key: 'status', header: 'Status', value: r => r.status === 1 ? 'Active' : 'Inactive' },
    ],
    filename: 'Branches',
  })

  const fetchBranches = useCallback(async () => {
    setLoading(true)
    try {
      const payload: Record<string, string> = { page: String(page), per_page: String(perPage), search, branch_name: '', branch_code: '', factory_id: '' }
      if (!isAdmin && branchId) payload.branch_id = String(branchId)
      if (filterCompanyId) payload.company_id = filterCompanyId
      if (filterStatus) payload.status = filterStatus
       console.log("Payload:", payload)
      const res = await apiCall<{ data?: { branches?: Branch[]; pagination?: { total: number; total_pages: number } } }>(
        '/branch/branchList',
        { method: 'GET', encrypt: false, payload }
      )
      const nested = res.data
      const rows = nested?.branches ?? []
      setBranches(rows)
      setTotalCount(nested?.pagination?.total ?? rows.length)
      setTotalPages(nested?.pagination?.total_pages ?? 1)
    } catch {
      setBranches([])
    } finally {
      setLoading(false)
    }
  }, [page, perPage, search, filterCompanyId, filterStatus, branchId, isAdmin])

  useEffect(() => { fetchBranches() }, [fetchBranches])

  // ── View ───────────────────────────────────────────
  const handleView = async (uuid: string) => {
    setViewLoading(true)
    setViewData({})
    try {
      const payload: Record<string, string> = { uuid }
      if (!isAdmin && branchId) payload.branch_id = String(branchId)
      const res = await apiCall<{ data?: Record<string, unknown> }>('/branch/show', { method: 'GET', encrypt: false, payload })
      const rawData: any = res.data ?? res
      setViewData(rawData?.branch ?? rawData?.data ?? rawData)
    } catch { setViewData(null) }
    finally { setViewLoading(false) }
  }

  // ── Create / Edit ──────────────────────────────────
  const openAdd = () => { setEditBranch(null); setFormError(null); setShowForm(true) }
  const openEdit = (branch: Branch) => { setEditBranch(branch); setFormError(null); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditBranch(null) }

  const handleSave = async (payload: Record<string, unknown>) => {
    setSaving(true)
    setFormError(null)
    try {
      if (editBranch) {
        const res = await apiCall<{ success?: boolean; message?: string }>('/branch/update', { payload })
        if (res.success === false) { setFormError(res.message || 'Update failed'); return }
        setToast({ message: res.message || 'Branch updated successfully', type: 'success' })
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/branch/create', { payload })
        if (res.success === false) { setFormError(res.message || 'Creation failed'); return }
        setToast({ message: res.message || 'Branch created successfully', type: 'success' })
      }
      // Bust branches dropdown cache so Team, Employee etc. see the new branch immediately
      clearDropdownCache('branches')
      closeForm()
      fetchBranches()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setFormError(e.response?.data?.message || e.message || 'Failed to save branch')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/branch/delete', { payload: { uuid: deleteTarget.uuid } })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Branch deleted successfully', type: 'success' })
      clearDropdownCache('branches')
      setDeleteTarget(null)
      fetchBranches()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setToast({ message: e.response?.data?.message || e.message || 'Failed to delete branch', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader title="Branch Master" description="Manage branch locations, assignments and factory mappings." />

      <BranchList
        branches={branches}
        loading={loading}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        totalCount={totalCount}
        search={search}
        filterCompanyId={filterCompanyId}
        filterStatus={filterStatus}
        companies={companies}
        selected={selected}
        onSelectionChange={setSelected}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onFilterCompanyChange={val => { setFilterCompanyId(val); setPage(1) }}
        onFilterStatusChange={val => { setFilterStatus(val); setPage(1) }}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onView={handleView}
        onExport={handleExport}
        exporting={exporting}
      />

      <BranchView viewData={viewData} viewLoading={viewLoading} onClose={() => setViewData(null)} />

      {showForm && (
        <BranchForm
          editBranch={editBranch}
          companies={companies}
          saving={saving}
          formError={formError}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Branch"
          message={<span>Are you sure you want to delete <strong>{deleteTarget.branch_name}</strong>? This action cannot be undone.</span>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}
    </AppLayout>
  )
}
