'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Toast from '@/components/ui/Toast'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { apiCall } from '@/services/apiClient'
import { useCrudApi } from '@/hooks/useCrudApi'
import { useMasterPage } from '@/hooks/useMasterPage'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import type { Department } from './_components/types'
import DepartmentList from './_components/DepartmentList'
import DepartmentForm from './_components/DepartmentForm'
import DepartmentView from './_components/DepartmentView'
import { useExport } from '@/hooks/useExport'

export default function DepartmentMasterPage() {
  const [filterStatus, setFilterStatus] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const { branchId, isAdmin } = useBranchAccess()
  const { branches } = useDropdownData({ branches: true })

  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : branchFilter

  const api = useCrudApi<Department>({
    basePath: '/department',
    listKey: 'departments',
    listParams: {
      status: filterStatus || 'all',
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
    },
  })

  const { handleExport, exporting } = useExport<Department>({
    apiPath: '/department/list',
    payload: {
      search: api.search,
      status: filterStatus || 'all',
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
    },
    dataKey: 'departments',
    columns: [
      { header: 'Department Name', value: r => r.name },
      { header: 'Dept Code', value: r => r.dept_code || '' },
      { header: 'Branch', value: r => r.branch?.branch_name || r.branch_name || branches.find(b => b.id === Number(r.branch_id))?.branch_name || '' },
      { header: 'Branch Code', value: r => r.branch?.branch_code || '' },
      { header: 'Status', value: r => r.is_active === 1 ? 'Active' : 'Inactive' },
    ],
    filename: 'Departments',
  })

  const {
    showModal, editItem, openAdd, openEdit, closeModal,
    deleteTarget, setDeleteTarget, deleting, setDeleting,
    toast, showSuccess, showError, clearToast,
    viewData, viewLoading, startView, setView, closeView,
  } = useMasterPage<Department>()

  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    api.fetchList()
  }, [api.fetchList, filterStatus, branchFilter, branchId, isAdmin])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const payload: Record<string, unknown> = { uuid: deleteTarget.uuid }
      if (!isAdmin && branchId) payload.branch_id = String(branchId)
      const res = await apiCall<{ success?: boolean; message?: string }>('/department/delete', { payload })
      if (res.success === false) { showError(res.message || 'Delete failed'); return }
      showSuccess(res.message || 'Department deleted successfully')
      setDeleteTarget(null)
      api.fetchList()
    } catch { showError('Failed to delete department') }
    finally { setDeleting(false) }
  }

  const handleSaved = (msg: string) => { showSuccess(msg); api.fetchList() }

  const handleView = async (uuid: string) => {
    startView()
    const payload: Record<string, unknown> = { uuid }
    if (!isAdmin && branchId) payload.branch_id = String(branchId)
    const res = await apiCall<{ data?: Record<string, unknown> }>('/department/show', {
      method: 'GET',
      encrypt: false,
      payload,
    }).catch(() => null)
    setView(res?.data ?? res ?? null)
  }

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      <DepartmentView viewData={viewData} viewLoading={viewLoading} onClose={closeView} />

      {showModal && (
        <DepartmentForm
          dept={editItem}
          branches={branches}
          onClose={closeModal}
          onSave={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Department"
          message={<>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader title="Department Master" description="Manage departments and their branch assignments." />

      <DepartmentList
        data={api.data}
        loading={api.loading}
        search={api.search}
        filterStatus={filterStatus}
        branchFilter={branchFilter}
        branches={branches}
        page={api.page}
        perPage={api.perPage}
        totalPages={api.totalPages}
        totalCount={api.totalCount}
        onSearchChange={api.setSearch}
        onFilterStatusChange={val => { setFilterStatus(val); api.setPage(1); }}
        onBranchChange={val => { setBranchFilter(val); api.setPage(1); }}
        onAdd={openAdd}
        onView={handleView}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onPageChange={api.setPage}
        onPerPageChange={api.setPerPage}
        onExport={handleExport}
        exporting={exporting}
        selected={selected}
        onSelectionChange={setSelected}
      />
    </AppLayout>
  )
}

