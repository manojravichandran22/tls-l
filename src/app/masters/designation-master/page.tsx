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
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import { useCrudApi } from '@/hooks/useCrudApi'
import { useMasterPage } from '@/hooks/useMasterPage'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useState } from 'react'

// ── Types ──
interface Designation {
  id: number
  uuid: string
  designation_name: string
  dept_id: number
  status: number
  is_active: number
  department?: { id: number; name: string }
}

// ── Validation ──
type FormField = 'designation_name' | 'dept_id'
type FormErrors = Partial<Record<FormField, string>>
type Touched = Partial<Record<FormField, boolean>>

const rules: ValidationRules<FormField> = {
  designation_name: {
    required: 'Designation name is required',
    minLength: { value: 2, message: 'Minimum 2 characters' },
    maxLength: { value: 100, message: 'Maximum 100 characters' },
  },
  dept_id: { required: 'Department is required' },
}

// ── Modal ──
function DesignationModal({ designation, departments, onClose, onSaved }: {
  designation: Designation | null
  departments: { id: number; name: string }[]
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const isEdit = !!designation
  const api = useCrudApi<Designation>({ basePath: '/designation', listKey: 'designations' })

  const [form, setForm] = useState({
    designation_name: designation?.designation_name ?? '',
    dept_id: designation?.dept_id?.toString() ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})

  const set = (key: FormField, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    if (touched[key]) setErrors(e => ({ ...e, [key]: validateField(val, rules[key]) }))
  }

  const handleBlur = (key: FormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    setErrors(e => ({ ...e, [key]: validateField(form[key], rules[key]) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: Touched = { designation_name: true, dept_id: true }
    setTouched(allTouched)
    const allErrors = validateAll(form, rules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        designation_name: form.designation_name,
        dept_id: form.dept_id,
      }
      if (isEdit) {
        payload.uuid = designation.uuid
        const res = await api.update(payload)
        if (res.success === false) { setErrors({ designation_name: res.message || 'Update failed' }); return }
        onSaved(res.message || 'Designation updated successfully')
      } else {
        const res = await api.create(payload)
        if (res.success === false) { setErrors({ designation_name: res.message || 'Creation failed' }); return }
        onSaved(res.message || 'Designation created successfully')
      }
      onClose()
    } catch {
      setErrors({ designation_name: 'Failed to save designation. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Designation' : 'Add Designation'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="designation-form" isLoading={saving}>
            {isEdit ? 'Update Designation' : 'Add Designation'}
          </Button>
        </>
      }
    >
      <form id="designation-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormInput
          label="Designation Name"
          value={form.designation_name}
          onChange={e => set('designation_name', e.target.value)}
          onBlur={() => handleBlur('designation_name')}
          placeholder="e.g. Senior Engineer"
          error={errors.designation_name}
          touched={touched.designation_name}
          required
        />
        <FormSelect
          label="Department"
          value={form.dept_id}
          onChange={e => {
            set('dept_id', e.target.value)
            setTouched(t => ({ ...t, dept_id: true }))
            setErrors(er => ({ ...er, dept_id: validateField(e.target.value, rules.dept_id) }))
          }}
          onBlur={() => handleBlur('dept_id')}
          options={departments.map(d => ({ value: d.id, label: d.name }))}
          placeholder="Select department"
          error={errors.dept_id}
          touched={touched.dept_id}
          required
        />
      </form>
    </Modal>
  )
}

// ── Main Page ──
export default function DesignationMasterPage() {
  const api = useCrudApi<Designation>({ basePath: '/designation', listKey: 'designations' })
  const { showModal, editItem, openAdd, openEdit, closeModal, deleteTarget, setDeleteTarget, deleting, setDeleting, toast, showSuccess, showError, clearToast, viewData, viewLoading, startView, setView, closeView } = useMasterPage<Designation>()
  const { departments } = useDropdownData({ departments: true })

  useEffect(() => { api.fetchList() }, [api.fetchList])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await api.remove(deleteTarget.uuid)
      if (res.success === false) { showError(res.message || 'Delete failed'); return }
      showSuccess(res.message || 'Designation deleted successfully')
      setDeleteTarget(null)
      api.fetchList()
    } catch { showError('Failed to delete designation') }
    finally { setDeleting(false) }
  }

  const handleSaved = (msg: string) => { showSuccess(msg); api.fetchList() }

  const handleView = async (uuid: string) => {
    startView()
    setView(await api.show(uuid))
  }

  const columns = [
    { key: '#', header: '#', render: (_: Designation, i: number) => <span className="text-t-lighter text-xs">{(api.page - 1) * api.perPage + i + 1}</span> },
    { key: 'designation_name', header: 'Designation Name', render: (row: Designation) => <span className="text-accent font-semibold">{row.designation_name}</span> },
    { key: 'department', header: 'Department', render: (row: Designation) => <span className="text-t-body">{row.department?.name ?? '—'}</span> },
    { key: 'status', header: 'Status', render: (row: Designation) => <Badge variant={row.is_active === 1 ? 'success' : 'default'}>{row.is_active === 1 ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', header: '',
      render: (row: Designation) => (
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
        <ViewModal title="Designation Details" loading={viewLoading} onClose={closeView} fields={[
          { label: 'Designation Name', value: (viewData as Record<string, unknown>).designation_name as string },
          { label: 'Department', value: ((viewData as Record<string, unknown>).department as Record<string, unknown>)?.name as string ?? '—' },
          { label: 'Status', value: <Badge variant={(viewData as Record<string, unknown>).is_active === 1 ? 'success' : 'default'}>{(viewData as Record<string, unknown>).is_active === 1 ? 'Active' : 'Inactive'}</Badge> },
        ]} />
      )}

      {showModal && (
        <DesignationModal
          designation={editItem}
          departments={departments}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Designation"
          message={<>Are you sure you want to delete <strong>{deleteTarget.designation_name}</strong>?</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader title="Designation Master" description="Manage designations and their department assignments." />

      <Toolbar title="All Designations" search={api.search} onSearchChange={api.setSearch} onAdd={openAdd} addLabel="Add Designation" />

      <DataTable columns={columns} data={api.data} loading={api.loading} emptyMessage="No designations found"
        page={api.page} totalPages={api.totalPages} totalCount={api.totalCount} perPage={api.perPage}
        onPageChange={api.setPage} onPerPageChange={api.setPerPage} countLabel="designation" />
    </AppLayout>
  )
}
