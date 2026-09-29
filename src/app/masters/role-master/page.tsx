'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import Toast from '@/components/ui/Toast'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useCrudApi } from '@/hooks/useCrudApi'
import { useMasterPage } from '@/hooks/useMasterPage'
import type { Role } from './_components/types'
import RoleList from './_components/RoleList'
import RoleForm from './_components/RoleForm'
import RoleView from './_components/RoleView'
import { useExport } from '@/hooks/useExport'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'
import { apiCall } from '@/services/apiClient'

export default function RoleMasterPage() {
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const { branchId, isAdmin } = useBranchAccess()
  const { branches } = useDropdownData({ branches: true })

  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : branchFilter

  const api = useCrudApi<Role>({
    basePath: '/role',
    listKey: 'roles',
    listParams: {
      status: filterStatus || 'all',
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
    },
  })

  const { handleExport, exporting } = useExport<Role>({
    apiPath: '/role/list',
    payload: {
      search: api.search,
      status: filterStatus || 'all',
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
    },
    dataKey: 'roles',
    columns: [
      { key: 'name', header: 'Role Name', value: r => r.name },
      { key: 'short_name', header: 'Short Name', value: r => r.short_name || '' },
      { key: 'role', header: 'Role Code', value: r => r.role || '' },
      { key: 'branch', header: 'Branch', value: r => r.branch?.branch_name || r.branch_name || branches.find(b => b.id === Number(r.branch_id))?.branch_name || '' },
      { key: 'status', header: 'Status', value: r => r.is_active === 1 ? 'Active' : 'Inactive' },
    ],
    filename: 'Roles',
  })

  const {
    showModal, editItem, openAdd, openEdit, closeModal,
    deleteTarget, setDeleteTarget, deleting, setDeleting,
    toast, showSuccess, showError, clearToast,
    viewData, viewLoading, startView, setView, closeView,
  } = useMasterPage<Role>()
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
      const res = await apiCall<{ success?: boolean; message?: string }>('/role/delete', { payload })
      if (res.success === false) { showError(res.message || 'Delete failed'); return }
      showSuccess(res.message || 'Role deleted successfully')
      setDeleteTarget(null)
      api.fetchList()
    } catch { showError('Failed to delete role') }
    finally { setDeleting(false) }
  }

  const handleSaved = (msg: string) => { showSuccess(msg); api.fetchList() }

  const handleView = async (uuid: string) => {
    startView()
    try {
      const payload: Record<string, unknown> = { uuid }
      if (!isAdmin && branchId) payload.branch_id = String(branchId)
      const res = await apiCall<{ data?: Record<string, unknown> }>('/role/show', { method: 'GET', encrypt: false, payload })
      setView(res.data ?? res)
    } catch { setView(null) }
  }

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      <RoleView viewData={viewData} viewLoading={viewLoading} onClose={closeView} />

      {showModal && (
        <RoleForm role={editItem} onClose={closeModal} onSave={handleSaved} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Role"
          message={<>Are you sure you want to delete <strong>{deleteTarget.name}</strong>?</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader title="Role Master" description="Manage user roles, permissions and access levels." />

      <RoleList
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
        onPermissions={(uuid) => router.push(`/masters/role-master/permissions/${uuid}`)}
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

