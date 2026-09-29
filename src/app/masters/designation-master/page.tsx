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
import type { Designation } from './_components/types'
import DesignationList from './_components/DesignationList'
import DesignationForm from './_components/DesignationForm'
import DesignationView from './_components/DesignationView'
import { useExport } from '@/hooks/useExport'

export default function DesignationMasterPage() {
  const [filterDepartmentId, setFilterDepartmentId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const { branchId, isAdmin } = useBranchAccess()

  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : branchFilter

  const { branches, departments } = useDropdownData({
    branches: true,
    departments: true,
    branchId: effectiveBranchId || null,
  })

  const api = useCrudApi<Designation>({
    basePath: '/designation',
    listKey: 'designations',
    listParams: {
      department_id: filterDepartmentId || 'all',
      status: filterStatus || 'all',
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
    },
  })

  const { handleExport, exporting } = useExport<Designation>({
    apiPath: '/designation/list',
    payload: {
      search: api.search,
      department_id: filterDepartmentId || 'all',
      status: filterStatus || 'all',
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
    },
    dataKey: 'designations',
    columns: [
      { header: 'Designation Name', value: r => r.name },
      { header: 'Code', value: r => r.code || '' },
      { header: 'Department', value: r => r.department?.name || '' },
      { header: 'Branch', value: r => r.branch?.branch_name || r.branch_name || branches.find(b => b.id === Number(r.branch_id))?.branch_name || '' },
      { header: 'Status', value: r => r.is_active === 1 ? 'Active' : 'Inactive' },
    ],
    filename: 'Designations',
  })

  const {
    showModal, editItem, openAdd, openEdit, closeModal,
    deleteTarget, setDeleteTarget, deleting, setDeleting,
    toast, showSuccess, showError, clearToast,
    viewData, viewLoading, startView, setView, closeView,
  } = useMasterPage<Designation>()

  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    api.fetchList()
  }, [api.fetchList, filterDepartmentId, filterStatus, branchFilter, branchId, isAdmin])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const payload: Record<string, unknown> = { uuid: deleteTarget.uuid }
      if (!isAdmin && branchId) payload.branch_id = String(branchId)
      const res = await apiCall<{ success?: boolean; message?: string }>('/designation/delete', { payload })
      if (res.success === false) { showError(res.message || 'Delete failed'); return }
      showSuccess(res.message || 'Designation deleted successfully')
      setDeleteTarget(null)
      api.fetchList()
    } catch {
      showError('Failed to delete designation')
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = async (payload: Record<string, unknown>) => {
    const isEdit = !!editItem
    const res = isEdit ? await api.update(payload) : await api.create(payload)
    if (res.success !== false) {
      showSuccess(res.message || (isEdit ? 'Designation updated successfully' : 'Designation created successfully'))
      api.fetchList()
    }
    return res
  }

  const handleView = async (uuid: string) => {
    startView()
    const payload: Record<string, unknown> = { uuid }
    if (!isAdmin && branchId) payload.branch_id = String(branchId)
    const res = await apiCall<{ data?: Record<string, unknown> }>('/designation/show', {
      method: 'GET',
      encrypt: false,
      payload,
    }).catch(() => null)
    setView(res?.data ?? res ?? null)
  }

  const filteredData = filterDepartmentId
    ? api.data.filter(item => {
        const itemDeptId = item.dept_id ?? item.department?.id
        return String(itemDeptId) === String(filterDepartmentId)
      })
    : api.data

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      <DesignationView viewData={viewData} viewLoading={viewLoading} onClose={closeView} />

      {showModal && (
        <DesignationForm
          designation={editItem}
          departments={departments}
          branches={branches}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Designation"
          message={<>Are you sure you want to delete <strong>{deleteTarget.name}</strong>?</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader title="Designation Master" description="Manage designations and their department assignments." />

      <DesignationList
        data={filteredData}
        loading={api.loading}
        search={api.search}
        filterDepartmentId={filterDepartmentId}
        filterStatus={filterStatus}
        branchFilter={branchFilter}
        branches={branches}
        departments={departments}
        page={api.page}
        perPage={api.perPage}
        totalPages={filterDepartmentId ? Math.ceil(filteredData.length / api.perPage) || 1 : api.totalPages}
        totalCount={filterDepartmentId ? filteredData.length : api.totalCount}
        onSearchChange={api.setSearch}
        onFilterDepartmentChange={val => { setFilterDepartmentId(val); api.setPage(1); }}
        onFilterStatusChange={val => { setFilterStatus(val); api.setPage(1); }}
        onBranchChange={val => { setBranchFilter(val); api.setPage(1); }}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onView={handleView}
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

