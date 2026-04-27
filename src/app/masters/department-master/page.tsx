'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import IconButton from '@/components/ui/IconButton'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import { validateField, validateAll, hasErrors, type ValidationRules } from '@/lib/validation'
import Toast, { type ToastData } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import DataTable from '@/components/ui/DataTable'
import Toolbar from '@/components/ui/Toolbar'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import Badge from '@/components/ui/Badge'
import ViewModal from '@/components/ui/ViewModal'

// ── Types ──
interface Department {
  id: number
  uuid: string
  name: string
  dept_code: string
  branch_id: number
  status: number
  is_active: number
  branch?: { id: number; branch_name: string; branch_code: string }
}

interface BranchOption { id: number; branch_name: string }

// ── Validation ──
type FormField = 'name' | 'branch_id'
type FormErrors = Partial<Record<FormField, string>>
type Touched = Partial<Record<FormField, boolean>>

const rules: ValidationRules<FormField> = {
  name: {
    required: 'Department name is required',
    minLength: { value: 2, message: 'Minimum 2 characters' },
    maxLength: { value: 50, message: 'Maximum 50 characters' },
  },
  branch_id: {
    required: 'Branch is required',
  },
}

// ── Add / Edit Modal ──
function DepartmentModal({ dept, branches, onClose, onSaved }: {
  dept: Department | null
  branches: BranchOption[]
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const isEdit = !!dept
  const [form, setForm] = useState({
    name: dept?.name ?? '',
    branch_id: dept?.branch_id?.toString() ?? '',
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
    const allTouched: Touched = { name: true, branch_id: true }
    setTouched(allTouched)
    const allErrors = validateAll(form, rules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        branch_id: form.branch_id,
      }
      if (isEdit) {
        payload.uuid = dept.uuid
        const res = await apiCall<{ success?: boolean; message?: string }>('/department/update', { payload })
        if (res.success === false) { setErrors({ name: res.message || 'Update failed' }); return }
        onSaved(res.message || 'Department updated successfully')
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/department/create', { payload })
        if (res.success === false) { setErrors({ name: res.message || 'Creation failed' }); return }
        onSaved(res.message || 'Department created successfully')
      }
      onClose()
    } catch {
      setErrors({ name: 'Failed to save department. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Department' : 'Add Department'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="dept-form" isLoading={saving}>
            {isEdit ? 'Update Department' : 'Add Department'}
          </Button>
        </>
      }
    >
      <form id="dept-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormInput
          label="Department Name"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder="e.g. Spinning"
          error={errors.name}
          touched={touched.name}
          required
        />
        <FormSelect
          label="Branch"
          value={form.branch_id}
          onChange={e => {
            set('branch_id', e.target.value)
            setTouched(t => ({ ...t, branch_id: true }))
            setErrors(er => ({ ...er, branch_id: validateField(e.target.value, rules.branch_id) }))
          }}
          onBlur={() => handleBlur('branch_id')}
          options={branches.map(b => ({ value: b.id, label: b.branch_name }))}
          placeholder="Select branch"
          error={errors.branch_id}
          touched={touched.branch_id}
          required
        />
      </form>
    </Modal>
  )
}

// ── Main Page ──
export default function DepartmentMasterPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [deleting, setDeleting] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  // Fetch branches for dropdown
  useEffect(() => {
    apiCall<{ data?: { branches?: BranchOption[] } }>('/branch/branchList', { method: 'GET', encrypt: false, payload: { page: '1', per_page: '100', search: '' } })
      .then(res => setBranches(res.data?.branches ?? []))
      .catch(() => {})
  }, [])

  const fetchDepartments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{
        data?: {
          departments?: Department[]
          pagination?: { total: number; total_pages: number }
        }
      }>('/department/list', {
        method: 'GET', encrypt: false,
        payload: { page: String(page), per_page: String(perPage), search, name: '', dept_code: '', branch_id: '' },
      })
      const data = res.data
      setDepartments(data?.departments ?? [])
      setTotalCount(data?.pagination?.total ?? 0)
      setTotalPages(data?.pagination?.total_pages ?? 1)
    } catch {
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }, [search, page, perPage])

  useEffect(() => { fetchDepartments() }, [fetchDepartments])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/department/delete', { payload: { uuid: deleteTarget.uuid } })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Department deleted successfully', type: 'success' })
      setDeleteTarget(null)
      fetchDepartments()
    } catch {
      setToast({ message: 'Failed to delete department', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const handleSaved = (msg: string) => {
    setToast({ message: msg, type: 'success' })
    fetchDepartments()
  }

  const handleView = async (uuid: string) => {
    setViewLoading(true)
    setViewData({})
    try {
      const res = await apiCall<{ data?: Record<string, unknown> }>('/department/show', { method: 'GET', encrypt: false, payload: { uuid } })
      setViewData(res.data ?? res)
    } catch { setViewData(null) }
    finally { setViewLoading(false) }
  }

  const columns = [
    {
      key: '#',
      header: '#',
      render: (_: Department, i: number) => <span className="text-t-lighter text-xs">{(page - 1) * PER_PAGE + i + 1}</span>,
    },
    {
      key: 'name',
      header: 'Department Name',
      render: (row: Department) => <span className="text-accent font-semibold">{row.name}</span>,
    },
    {
      key: 'dept_code',
      header: 'Dept Code',
      render: (row: Department) => <span className="text-t-body font-mono text-xs">{row.dept_code}</span>,
    },
    {
      key: 'branch',
      header: 'Branch',
      render: (row: Department) => <span className="text-t-body">{row.branch?.branch_name ?? '—'}</span>,
    },
    {
      key: 'branch_code',
      header: 'Branch Code',
      render: (row: Department) => <span className="text-t-body font-mono text-xs">{row.branch?.branch_code ?? '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Department) => <Badge variant={row.is_active === 1 ? 'success' : 'default'}>{row.is_active === 1 ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row: Department) => (
        <div className="flex gap-1.5 items-center">
          <IconButton variant="accent" onClick={() => handleView(row.uuid)} title="View"><Eye size={13} /></IconButton>
          <IconButton variant="accent" onClick={() => { setEditDept(row); setShowModal(true) }} title="Edit"><Pencil size={13} /></IconButton>
          <IconButton variant="danger" onClick={() => setDeleteTarget(row)} title="Delete"><Trash2 size={13} /></IconButton>
        </div>
      ),
    },
  ]

  return (
    <AppLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {viewData && (
        <ViewModal
          title="Department Details"
          loading={viewLoading}
          onClose={() => setViewData(null)}
          fields={[
            { label: 'Department Name', value: (viewData as Record<string, unknown>).name as string },
            { label: 'Dept Code', value: (viewData as Record<string, unknown>).dept_code as string },
            { label: 'Branch', value: ((viewData as Record<string, unknown>).branch as Record<string, unknown>)?.branch_name as string ?? '—' },
            { label: 'Branch Code', value: ((viewData as Record<string, unknown>).branch as Record<string, unknown>)?.branch_code as string ?? '—' },
            { label: 'Status', value: <Badge variant={(viewData as Record<string, unknown>).is_active === 1 ? 'success' : 'default'}>{(viewData as Record<string, unknown>).is_active === 1 ? 'Active' : 'Inactive'}</Badge> },
          ]}
        />
      )}

      {showModal && (
        <DepartmentModal
          dept={editDept}
          branches={branches}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
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

      <Toolbar
        title="All Departments"
        search={search}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onAdd={() => { setEditDept(null); setShowModal(true) }}
        addLabel="Add Department"
      />

      <DataTable
        columns={columns}
        data={departments}
        loading={loading}
        emptyMessage="No departments found"
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        countLabel="department"
      />
    </AppLayout>
  )
}
