'use client'

import { useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import IconButton from '@/components/ui/IconButton'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { validateField, validateAll, hasErrors, type ValidationRules } from '@/lib/validation'
import Toast from '@/components/ui/Toast'
import PageHeader from '@/components/ui/PageHeader'
import DataTable from '@/components/ui/DataTable'
import Toolbar from '@/components/ui/Toolbar'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Badge from '@/components/ui/Badge'
import ViewModal from '@/components/ui/ViewModal'
import { useCrudApi } from '@/hooks/useCrudApi'
import { useMasterPage } from '@/hooks/useMasterPage'
import RoleModal from './RoleModal'

// ── Types ──
export interface Role {
  id: number
  uuid: string
  name: string
  short_name: string
  role: number
  status: number
  is_active: number
}

// ── Validation (exported for modal) ──
export type RoleFormField = 'name' | 'short_name' | 'role'

export const roleRules: ValidationRules<RoleFormField> = {
  name: { required: 'Role name is required', minLength: { value: 2, message: 'Minimum 2 characters' }, maxLength: { value: 50, message: 'Maximum 50 characters' } },
  short_name: { required: 'Short name is required', minLength: { value: 2, message: 'Minimum 2 characters' }, maxLength: { value: 20, message: 'Maximum 20 characters' } },
  role: { required: 'Role code is required', pattern: { value: /^\d+$/, message: 'Must be a number' } },
}

// ── Main Page ──
export default function RoleMasterPage() {
  const api = useCrudApi<Role>({ basePath: '/role', listKey: 'roles' })
  const { showModal, editItem, openAdd, openEdit, closeModal, deleteTarget, setDeleteTarget, deleting, setDeleting, toast, showSuccess, showError, clearToast, viewData, viewLoading, startView, setView, closeView } = useMasterPage<Role>()

  useEffect(() => { api.fetchList() }, [api.fetchList])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await api.remove(deleteTarget.uuid)
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
    setView(await api.show(uuid))
  }

  const columns = [
    { key: '#', header: '#', render: (_: Role, i: number) => <span className="text-t-lighter text-xs">{(api.page - 1) * api.perPage + i + 1}</span> },
    { key: 'name', header: 'Role Name', render: (row: Role) => <span className="text-accent font-semibold">{row.name}</span> },
    { key: 'short_name', header: 'Short Name', render: (row: Role) => <span className="text-t-body font-mono text-xs">{row.short_name}</span> },
    { key: 'role', header: 'Role Code', render: (row: Role) => <span className="text-t-body font-semibold">{row.role}</span> },
    { key: 'status', header: 'Status', render: (row: Role) => <Badge variant={row.is_active === 1 ? 'success' : 'default'}>{row.is_active === 1 ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', header: '',
      render: (row: Role) => (
        <div className="flex gap-1.5 items-center">
          <IconButton variant="accent" onClick={() => handleView(row.uuid)} title="View"><Eye size={13} /></IconButton>
          <IconButton variant="accent" onClick={() => openEdit(row)} title="Edit"><Pencil size={13} /></IconButton>
          <IconButton variant="danger" onClick={() => setDeleteTarget(row)} title="Delete"><Trash2 size={13} /></IconButton>
        </div>
      ),
    },
  ]

  return (
    <AppLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {viewData && (
        <ViewModal title="Role Details" loading={viewLoading} onClose={closeView} fields={[
          { label: 'Role Name', value: (viewData as Record<string, unknown>).name as string },
          { label: 'Short Name', value: (viewData as Record<string, unknown>).short_name as string },
          { label: 'Role Code', value: String((viewData as Record<string, unknown>).role ?? '—') },
          { label: 'Status', value: <Badge variant={(viewData as Record<string, unknown>).is_active === 1 ? 'success' : 'default'}>{(viewData as Record<string, unknown>).is_active === 1 ? 'Active' : 'Inactive'}</Badge> },
        ]} />
      )}

      {showModal && <RoleModal role={editItem} onClose={closeModal} onSaved={handleSaved} />}

      {deleteTarget && (
        <ConfirmDialog title="Delete Role" message={<>Are you sure you want to delete <strong>{deleteTarget.name}</strong>?</>}
          confirmLabel="Delete" onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} loading={deleting} variant="danger" />
      )}

      <PageHeader title="Role Master" description="Manage user roles, permissions and access levels." />

      <Toolbar title="All Roles" search={api.search} onSearchChange={api.setSearch} onAdd={openAdd} addLabel="Add Role" />

      <DataTable columns={columns} data={api.data} loading={api.loading} emptyMessage="No roles found"
        page={api.page} totalPages={api.totalPages} totalCount={api.totalCount} perPage={api.perPage}
        onPageChange={api.setPage} onPerPageChange={api.setPerPage} countLabel="role" />
    </AppLayout>
  )
}
