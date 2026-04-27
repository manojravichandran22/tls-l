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
interface Employee {
  id: number
  uuid: string
  name: string
  last_name: string
  emp_code: string
  email: string | null
  mobile: string
  role: number
  join_date: string
  department_id: number
  branch_id: number
  status: number
  is_active: number
  branch?: { id: number; branch_name: string; branch_code: string }
  department?: { id: number; name: string; dept_code: string }
  roleInfo?: { id: number; name: string; short_name: string }
}

interface BranchOption { id: number; branch_name: string }
interface RoleOption { id: number; uuid: string; name: string; role: number }
interface DeptOption { id: number; name: string; branch_id?: number }

// ── Validation ──
type FormField = 'name' | 'last_name' | 'mobile' | 'role' | 'join_date' | 'department_id' | 'branch_id'
type FormErrors = Partial<Record<FormField | 'email', string>>
type Touched = Partial<Record<FormField, boolean>>

const rules: ValidationRules<FormField> = {
  name: { required: 'First name is required', minLength: { value: 2, message: 'Minimum 2 characters' } },
  last_name: { required: 'Last name is required', minLength: { value: 1, message: 'Required' } },
  mobile: { required: 'Mobile is required', pattern: { value: /^\d{10}$/, message: 'Enter valid 10-digit number' } },
  role: { required: 'Role is required' },
  join_date: { required: 'Join date is required' },
  department_id: { required: 'Department is required' },
  branch_id: { required: 'Branch is required' },
}

// ── Add / Edit Modal ──
function EmployeeModal({ emp, branches, roles, allDepts, onClose, onSaved }: {
  emp: Employee | null
  branches: BranchOption[]
  roles: RoleOption[]
  allDepts: DeptOption[]
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const isEdit = !!emp
  const [form, setForm] = useState({
    name: emp?.name ?? '',
    last_name: emp?.last_name ?? '',
    mobile: emp?.mobile ?? '',
    role: emp?.role?.toString() ?? '',
    join_date: emp?.join_date ?? '',
    department_id: emp?.department_id?.toString() ?? '',
    branch_id: emp?.branch_id?.toString() ?? '',
    email: emp?.email ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})

  const filteredDepts = allDepts.filter(d => !form.branch_id || d.branch_id === parseInt(form.branch_id))

  const set = (key: FormField | 'email', val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    if (key !== 'email' && touched[key as FormField]) {
      setErrors(e => ({ ...e, [key]: validateField(val, rules[key as FormField]) }))
    }
  }

  const handleBlur = (key: FormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    setErrors(e => ({ ...e, [key]: validateField(form[key], rules[key]) }))
  }

  const handleBranchChange = (val: string) => {
    setForm(f => ({ ...f, branch_id: val, department_id: '' }))
    setTouched(t => ({ ...t, branch_id: true }))
    setErrors(e => ({ ...e, branch_id: validateField(val, rules.branch_id) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: Touched = { name: true, last_name: true, mobile: true, role: true, join_date: true, department_id: true, branch_id: true }
    setTouched(allTouched)
    const formData = { name: form.name, last_name: form.last_name, mobile: form.mobile, role: form.role, join_date: form.join_date, department_id: form.department_id, branch_id: form.branch_id }
    const allErrors = validateAll(formData, rules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        last_name: form.last_name,
        mobile: form.mobile,
        role: form.role,
        join_date: form.join_date,
        department_id: form.department_id,
        branch_id: form.branch_id,
        email: form.email || null,
      }
      if (isEdit) {
        payload.uuid = emp.uuid
        const res = await apiCall<{ success?: boolean; message?: string }>('/employee/update', { payload })
        if (res.success === false) { setErrors({ name: res.message || 'Update failed' }); return }
        onSaved(res.message || 'Employee updated successfully')
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/employee/create', { payload })
        if (res.success === false) { setErrors({ name: res.message || 'Creation failed' }); return }
        onSaved(res.message || 'Employee created successfully')
      }
      onClose()
    } catch {
      setErrors({ name: 'Failed to save employee. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Employee' : 'Add Employee'}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="emp-form" isLoading={saving}>
            {isEdit ? 'Update Employee' : 'Add Employee'}
          </Button>
        </>
      }
    >
      <form id="emp-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2.5">
          <FormInput label="First Name" value={form.name} onChange={e => set('name', e.target.value)} onBlur={() => handleBlur('name')} placeholder="e.g. John" error={errors.name} touched={touched.name} required />
          <FormInput label="Last Name" value={form.last_name} onChange={e => set('last_name', e.target.value)} onBlur={() => handleBlur('last_name')} placeholder="e.g. Doe" error={errors.last_name} touched={touched.last_name} required />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <FormInput label="Mobile" value={form.mobile} onChange={e => set('mobile', e.target.value)} onBlur={() => handleBlur('mobile')} placeholder="10-digit number" error={errors.mobile} touched={touched.mobile} required />
          <FormInput label="Email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Optional" type="email" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <FormSelect
            label="Branch"
            value={form.branch_id}
            onChange={e => handleBranchChange(e.target.value)}
            onBlur={() => handleBlur('branch_id')}
            options={branches.map(b => ({ value: b.id, label: b.branch_name }))}
            placeholder="Select branch"
            error={errors.branch_id}
            touched={touched.branch_id}
            required
          />
          <FormSelect
            label="Department"
            value={form.department_id}
            onChange={e => { set('department_id', e.target.value); setTouched(t => ({ ...t, department_id: true })); setErrors(er => ({ ...er, department_id: validateField(e.target.value, rules.department_id) })) }}
            onBlur={() => handleBlur('department_id')}
            options={filteredDepts.map(d => ({ value: d.id, label: d.name }))}
            placeholder={form.branch_id ? 'Select department' : 'Select branch first'}
            disabled={!form.branch_id}
            error={errors.department_id}
            touched={touched.department_id}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <FormSelect
            label="Role"
            value={form.role}
            onChange={e => { set('role', e.target.value); setTouched(t => ({ ...t, role: true })); setErrors(er => ({ ...er, role: validateField(e.target.value, rules.role) })) }}
            onBlur={() => handleBlur('role')}
            options={roles.map(r => ({ value: r.role, label: r.name }))}
            placeholder="Select role"
            error={errors.role}
            touched={touched.role}
            required
          />
          <FormInput label="Join Date" type="date" value={form.join_date} onChange={e => set('join_date', e.target.value)} onBlur={() => handleBlur('join_date')} error={errors.join_date} touched={touched.join_date} required />
        </div>
      </form>
    </Modal>
  )
}

// ── Main Page ──
export default function EmployeeMasterPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [allDepts, setAllDepts] = useState<DeptOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [deleting, setDeleting] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editEmp, setEditEmp] = useState<Employee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  // Fetch dropdowns
  useEffect(() => {
    apiCall<{ data?: { branches?: BranchOption[] } }>('/branch/branchList', { method: 'GET', encrypt: false, payload: { page: '1', per_page: '100', search: '' } })
      .then(res => setBranches(res.data?.branches ?? [])).catch(() => { })
    apiCall<{ data?: { roles?: RoleOption[] } }>('/role/list', { method: 'GET', encrypt: false, payload: { page: '1', per_page: '100', search: '' } })
      .then(res => setRoles(res.data?.roles ?? [])).catch(() => { })
    apiCall<{ data?: { departments?: DeptOption[] } }>('/department/list', { method: 'GET', encrypt: false, payload: { page: '1', per_page: '100', search: '' } })
      .then(res => setAllDepts(res.data?.departments ?? [])).catch(() => { })
  }, [])

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{
        data?: { employees?: Employee[]; pagination?: { total: number; total_pages: number } }
      }>('/employee/list', {
        method: 'GET', encrypt: false,
        payload: { page: String(page), per_page: String(perPage), search, branch_id: '', role: '', name: '' },
      })
      const data = res.data
      setEmployees(data?.employees ?? [])
      setTotalCount(data?.pagination?.total ?? 0)
      setTotalPages(data?.pagination?.total_pages ?? 1)
    } catch { setEmployees([]) }
    finally { setLoading(false) }
  }, [search, page, perPage])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/employee/delete', { payload: { uuid: deleteTarget.uuid } })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Employee deleted successfully', type: 'success' })
      setDeleteTarget(null)
      fetchEmployees()
    } catch { setToast({ message: 'Failed to delete employee', type: 'error' }) }
    finally { setDeleting(false) }
  }

  const handleSaved = (msg: string) => { setToast({ message: msg, type: 'success' }); fetchEmployees() }

  const handleView = async (uuid: string) => {
    setViewLoading(true); setViewData({})
    try {
      const res = await apiCall<{ data?: Record<string, unknown> }>('/employee/show', { method: 'GET', encrypt: false, payload: { uuid } })
      setViewData(res.data ?? res)
    } catch { setViewData(null) }
    finally { setViewLoading(false) }
  }

  const columns = [
    { key: '#', header: '#', render: (_: Employee, i: number) => <span className="text-t-lighter text-xs">{(page - 1) * PER_PAGE + i + 1}</span> },
    { key: 'emp_code', header: 'Emp Code', render: (row: Employee) => <span className="text-t-body font-mono text-xs">{row.emp_code}</span> },
    { key: 'name', header: 'Name', render: (row: Employee) => <span className="text-accent font-semibold">{row.name} {row.last_name}</span> },
    { key: 'mobile', header: 'Mobile', render: (row: Employee) => <span className="text-t-body">{row.mobile}</span> },
    { key: 'role', header: 'Role', render: (row: Employee) => <Badge variant="info">{row.roleInfo?.name ?? row.role}</Badge> },
    { key: 'department', header: 'Department', render: (row: Employee) => <span className="text-t-body">{row.department?.name ?? '—'}</span> },
    { key: 'branch', header: 'Branch', render: (row: Employee) => <span className="text-t-body">{row.branch?.branch_name ?? '—'}</span> },
    { key: 'join_date', header: 'Join Date', render: (row: Employee) => <span className="text-t-body text-xs">{row.join_date}</span> },
    { key: 'status', header: 'Status', render: (row: Employee) => <Badge variant={row.is_active === 1 ? 'success' : 'default'}>{row.is_active === 1 ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', header: '',
      render: (row: Employee) => (
        <div className="flex gap-1.5 items-center">
          <IconButton variant="accent" onClick={() => handleView(row.uuid)} title="View"><Eye size={13} /></IconButton>
          <IconButton variant="accent" onClick={() => { setEditEmp(row); setShowModal(true) }} title="Edit"><Pencil size={13} /></IconButton>
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
          title="Employee Details"
          loading={viewLoading}
          onClose={() => setViewData(null)}
          size="md"
          fields={[
            { label: 'Employee Code', value: (viewData as Record<string, unknown>).emp_code as string },
            { label: 'Name', value: `${(viewData as Record<string, unknown>).name} ${(viewData as Record<string, unknown>).last_name}` },
            { label: 'Mobile', value: (viewData as Record<string, unknown>).mobile as string },
            { label: 'Email', value: (viewData as Record<string, unknown>).email as string ?? '—' },
            { label: 'Role', value: <Badge variant="info">{((viewData as Record<string, unknown>).roleInfo as Record<string, unknown>)?.name as string ?? (viewData as Record<string, unknown>).role}</Badge> },
            { label: 'Department', value: ((viewData as Record<string, unknown>).department as Record<string, unknown>)?.name as string ?? '—' },
            { label: 'Branch', value: ((viewData as Record<string, unknown>).branch as Record<string, unknown>)?.branch_name as string ?? '—' },
            { label: 'Join Date', value: (viewData as Record<string, unknown>).join_date as string },
            { label: 'Status', value: <Badge variant={(viewData as Record<string, unknown>).is_active === 1 ? 'success' : 'default'}>{(viewData as Record<string, unknown>).is_active === 1 ? 'Active' : 'Inactive'}</Badge> },
          ]}
        />
      )}

      {showModal && (
        <EmployeeModal
          emp={editEmp}
          branches={branches}
          roles={roles}
          allDepts={allDepts}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Employee"
          message={<>Are you sure you want to delete <strong>{deleteTarget.name} {deleteTarget.last_name}</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader title="Employee Master" description="Manage employees, roles, departments and branch assignments." />

      <Toolbar
        title="All Employees"
        search={search}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onAdd={() => { setEditEmp(null); setShowModal(true) }}
        addLabel="Add Employee"
      />

      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        emptyMessage="No employees found"
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        countLabel="employee"
      />
    </AppLayout>
  )
}
