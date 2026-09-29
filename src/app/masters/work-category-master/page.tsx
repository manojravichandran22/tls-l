'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiCall } from '@/services/apiClient'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { PER_PAGE } from '@/lib/constants'
import Toast, { type ToastData } from '@/components/ui/Toast'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { type WorkCategory } from './_components/types'
import WorkCategoryList from './_components/WorkCategoryList'
import WorkCategoryForm from './_components/WorkCategoryForm'
import WorkCategoryView from './_components/WorkCategoryView'
import { useExport } from '@/hooks/useExport'

export default function WorkCategoryMasterPage() {
  const [workCategories, setWorkCategories] = useState<WorkCategory[]>([])
  const [branchFilter, setBranchFilter] = useState('')
  const { branchId, isAdmin } = useBranchAccess()

  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : branchFilter

  const { branches, departments, designations } = useDropdownData({
    branches: true,
    departments: true,
    designations: true,
    branchId: effectiveBranchId || null,
  })

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [filterDepartmentId, setFilterDepartmentId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editWc, setEditWc] = useState<WorkCategory | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WorkCategory | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const { handleExport, exporting } = useExport<Record<string, unknown>>({
    apiPath: '/work-category/list',
    payload: {
      search,
      status: filterStatus || 'all',
      department_id: filterDepartmentId || 'all',
      dept_id: filterDepartmentId || 'all',
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
    },
    dataKey: 'WorkCategories',
    columns: [
      { header: 'Work Category Name', value: r => (r as Record<string, unknown>).name as string || '' },
      { header: 'Code', value: r => (r as Record<string, unknown>).code as string || '' },
      { header: 'Branch', value: r => (r as Record<string, unknown>).branch_name as string || branches.find(b => b.id === Number((r as Record<string, unknown>).branch_id))?.branch_name || '' },
      { header: 'Status', value: r => (r as Record<string, unknown>).is_active === 1 ? 'Active' : 'Inactive' },
    ],
    filename: 'WorkCategories',
  })

  const fetchWorkCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{
        data?: {
          WorkCategories?: WorkCategory[]
          pagination?: { total: number; total_pages: number }
        }
      }>('/work-category/list', {
        method: 'GET',
        encrypt: false,
        payload: {
          page: String(page),
          per_page: String(perPage),
          search,
          status: filterStatus || 'all',
          department_id: filterDepartmentId || 'all',
          ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
        },
      })
      const data = res.data
      setWorkCategories(data?.WorkCategories ?? [])
      setTotalCount(data?.pagination?.total ?? 0)
      setTotalPages(data?.pagination?.total_pages ?? 1)
    } catch {
      setWorkCategories([])
    } finally {
      setLoading(false)
    }
  }, [search, page, perPage, filterDepartmentId, filterStatus, effectiveBranchId])

  useEffect(() => {
    fetchWorkCategories()
  }, [fetchWorkCategories])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const payload: Record<string, unknown> = { uuid: deleteTarget.uuid }
      if (!isAdmin && branchId) payload.branch_id = String(branchId)
      const res = await apiCall<{ success?: boolean; message?: string }>('/work-category/delete', { payload })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Work Category deleted successfully', type: 'success' })
      setDeleteTarget(null)
      fetchWorkCategories()
    } catch {
      setToast({ message: 'Failed to delete work category', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const handleSaved = (msg: string) => {
    setToast({ message: msg, type: 'success' })
    fetchWorkCategories()
  }

  const handleEdit = async (item: WorkCategory) => {
    try {
      const payload: Record<string, unknown> = { uuid: item.uuid }
      if (!isAdmin && branchId) payload.branch_id = String(branchId)
      const res = await apiCall<any>('/work-category/show', { method: 'GET', encrypt: false, payload })
      const fullData = res.data?.WorkCategory ?? res.data?.workCategory ?? res.data ?? res
      setEditWc(fullData)
    } catch {
      setEditWc(item)
    }
    setShowModal(true)
  }

  const handleView = async (uuid: string) => {
    setViewLoading(true)
    setViewData({})
    try {
      const payload: Record<string, unknown> = { uuid }
      if (!isAdmin && branchId) payload.branch_id = String(branchId)
      const res = await apiCall<{ data?: Record<string, unknown> }>('/work-category/show', { method: 'GET', encrypt: false, payload })
      const raw = res.data as any
      setViewData(raw?.WorkCategory ?? raw?.workCategory ?? raw ?? res)
    } catch {
      setViewData(null)
    } finally {
      setViewLoading(false)
    }
  }

  const filteredWorkCategories = filterDepartmentId
    ? workCategories.filter(wc => String(wc.dept_id ?? wc.department?.id) === String(filterDepartmentId))
    : workCategories

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <WorkCategoryView
        viewData={viewData}
        viewLoading={viewLoading}
        onClose={() => setViewData(null)}
      />

      {showModal && (
        <WorkCategoryForm
          workCategory={editWc}
          departments={departments}
          designations={designations}
          branches={branches}
          onClose={() => setShowModal(false)}
          onSave={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Work Category"
          message={<>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader title="Work Category Master" description="Manage work categories and their department/designation assignments." />

      <WorkCategoryList
        workCategories={filteredWorkCategories}
        departments={departments}
        designations={designations}
        branches={branches}
        loading={loading}
        search={search}
        page={page}
        perPage={perPage}
        totalPages={filterDepartmentId ? Math.ceil(filteredWorkCategories.length / perPage) || 1 : totalPages}
        totalCount={filterDepartmentId ? filteredWorkCategories.length : totalCount}
        filterDepartmentId={filterDepartmentId}
        filterStatus={filterStatus}
        branchFilter={branchFilter}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onFilterDepartmentChange={val => { setFilterDepartmentId(val); setPage(1) }}
        onFilterStatusChange={val => { setFilterStatus(val); setPage(1) }}
        onBranchChange={val => { setBranchFilter(val); setPage(1) }}
        onAdd={() => { setEditWc(null); setShowModal(true) }}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onExport={handleExport}
        exporting={exporting}
        selected={selected}
        onSelectionChange={setSelected}
      />
    </AppLayout>
  )
}

