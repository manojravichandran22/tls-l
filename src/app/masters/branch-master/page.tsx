'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import IconButton from '@/components/ui/IconButton'
import { Pencil, Trash2, Eye } from 'lucide-react'
import Button from '@/components/ui/Button'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import Toast, { type ToastData } from '@/components/ui/Toast'
import PageHeader from '@/components/ui/PageHeader'
import DataTable from '@/components/ui/DataTable'
import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'
import Toolbar from '@/components/ui/Toolbar'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import FormTextarea from '@/components/ui/FormTextarea'
import { validateField, validateAll, hasErrors, type ValidationRules } from '@/lib/validation'

// ── Types ────────────────────────────────────────────
interface Branch {
  id: number
  uuid: string
  company_id: number
  branch_name: string
  branch_code: string
  address: string
  status: number
  company?: { id: number; company_name: string; company_code: string }
}

interface CompanyOption {
  id: number
  uuid: string
  company_name: string
}

type FormField = 'company_id' | 'branch_name' | 'address'
type FormErrors = Partial<Record<FormField, string>>
type Touched = Partial<Record<FormField, boolean>>

const rules: ValidationRules<FormField> = {
  company_id: { required: 'Company is required' },
  branch_name: {
    required: 'Branch name is required',
    minLength: { value: 2, message: 'Minimum 2 characters' },
    maxLength: { value: 100, message: 'Maximum 100 characters' },
  },
  address: {
    required: 'Address is required',
    minLength: { value: 3, message: 'Minimum 3 characters' },
  },
}

// ── Main Page ────────────────────────────────────────
export default function BranchMasterPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)

  const [showModal, setShowModal] = useState(false)
  const [editBranch, setEditBranch] = useState<Branch | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({ company_id: '', branch_name: '', address: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  const handleView = async (uuid: string) => {
    setViewLoading(true)
    setViewData({})
    try {
      const res = await apiCall<{ data?: Record<string, unknown> }>('/branch/show', { method: 'GET', encrypt: false, payload: { uuid } })
      setViewData(res.data ?? res)
    } catch { setViewData(null) }
    finally { setViewLoading(false) }
  }

  const set = (key: FormField, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    if (touched[key]) {
      setErrors(e => ({ ...e, [key]: validateField(val, rules[key]) }))
    }
  }

  const handleBlur = (key: FormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    setErrors(e => ({ ...e, [key]: validateField(form[key], rules[key]) }))
  }

  // Fetch companies for dropdown
  useEffect(() => {
    apiCall<{ data?: { companies?: CompanyOption[] } }>('/company/companyList', { method: 'GET', encrypt: false, payload: { page: '1', per_page: '100', search: '' } })
      .then(res => setCompanies(res.data?.companies ?? []))
      .catch(() => {})
  }, [])

  const fetchBranches = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{ data?: { branches?: Branch[]; pagination?: { total: number; total_pages: number } } }>(
        '/branch/branchList', { method: 'GET', encrypt: false, payload: { page: String(page), per_page: String(perPage), search, branch_name: '', branch_code: '', factory_id: '' } }
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
  }, [page, search])

  useEffect(() => { fetchBranches() }, [fetchBranches])

  // Filtered branches by search
  const filtered = search
    ? branches.filter(b =>
        b.branch_name.toLowerCase().includes(search.toLowerCase()) ||
        b.branch_code?.toLowerCase().includes(search.toLowerCase()) ||
        b.company?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        b.address?.toLowerCase().includes(search.toLowerCase())
      )
    : branches

  // ── Modal open/close ───────────────────────────────
  const openAdd = () => {
    setEditBranch(null)
    setForm({ company_id: '', branch_name: '', address: '' })
    setErrors({})
    setTouched({})
    setFormError(null)
    setShowModal(true)
  }

  const openEdit = (branch: Branch) => {
    setEditBranch(branch)
    setForm({
      company_id: branch.company_id?.toString() ?? '',
      branch_name: branch.branch_name ?? '',
      address: branch.address ?? '',
    })
    setErrors({})
    setTouched({})
    setFormError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditBranch(null)
  }

  // ── Save (Create / Update) ─────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: Touched = { company_id: true, branch_name: true, address: true }
    setTouched(allTouched)
    const allErrors = validateAll(form, rules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return
    setSaving(true)
    setFormError(null)
    try {
      const payload: Record<string, unknown> = {
        company_id: form.company_id,
        branch_name: form.branch_name,
        address: form.address,
      }
      if (editBranch) {
        payload.uuid = editBranch.uuid
        const res = await apiCall<{ success?: boolean; message?: string }>('/branch/update', { payload })
        if (res.success === false) { setFormError(res.message || 'Update failed'); return }
        setToast({ message: res.message || 'Branch updated successfully', type: 'success' })
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/branch/create', { payload })
        if (res.success === false) { setFormError(res.message || 'Creation failed'); return }
        setToast({ message: res.message || 'Branch created successfully', type: 'success' })
      }
      closeModal()
      fetchBranches()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      setFormError(axiosErr.response?.data?.message || axiosErr.message || 'Failed to save branch')
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
      setDeleteTarget(null)
      fetchBranches()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      setToast({ message: axiosErr.response?.data?.message || axiosErr.message || 'Failed to delete branch', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  // ── Table columns ──────────────────────────────────
  const columns = [
    {
      key: '#',
      header: '#',
      render: (_: Branch, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * 10 + i + 1}</span>
      ),
    },
    {
      key: 'branch_name',
      header: 'Branch Name',
      render: (row: Branch) => (
        <span className="text-accent font-semibold">{row.branch_name}</span>
      ),
    },
    {
      key: 'branch_code',
      header: 'Branch Code',
      render: (row: Branch) => (
        <span className="font-mono text-xs text-t-body">{row.branch_code}</span>
      ),
    },
    {
      key: 'company_name',
      header: 'Company Name',
      render: (row: Branch) => (
        <span className="text-t-body">{row.company?.company_name ?? '—'}</span>
      ),
    },
    {
      key: 'company_code',
      header: 'Company Code',
      render: (row: Branch) => (
        <span className="font-mono text-xs text-t-body">{row.company?.company_code ?? '—'}</span>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (row: Branch) => (
        <span className="text-t-body max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap block">
          {row.address}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Branch) => <Badge variant={row.status === 1 ? 'success' : 'default'}>{row.status === 1 ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row: Branch) => (
        <div className="flex gap-1.5 items-center">
          <IconButton variant="accent" onClick={() => handleView(row.uuid)} title="View"><Eye size={13} /></IconButton>
          <IconButton variant="accent" onClick={() => openEdit(row)} title="Edit"><Pencil size={13} /></IconButton>
          <IconButton variant="danger" onClick={() => setDeleteTarget(row)} title="Delete"><Trash2 size={13} /></IconButton>
        </div>
      ),
    },
  ]

  // ── Company options for FormSelect ─────────────────
  const companyOptions = companies.map(c => ({
    value: c.id,
    label: c.company_name,
  }))

  // ── Modal footer ───────────────────────────────────
  const modalFooter = (
    <>
      <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
      <Button variant="primary" type="submit" form="branch-form" isLoading={saving}>
        {editBranch ? 'Update Branch' : 'Add Branch'}
      </Button>
    </>
  )

  return (
    <AppLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}


      <PageHeader
        title="Branch Master"
        description="Manage branch locations, assignments and factory mappings."
      />

      <Toolbar
        title="All Branches"
        search={search}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        searchPlaceholder="Search"
        onAdd={openAdd}
        addLabel="Add Branch"
      />

      <DataTable<Branch>
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="No branches found"
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        countLabel="branch"
      />

      {/* View Modal */}
      {viewData && (
        <ViewModal
          title="Branch Details"
          loading={viewLoading}
          onClose={() => setViewData(null)}
          fields={[
            { label: 'Branch Name', value: (viewData as Record<string, unknown>).branch_name as string },
            { label: 'Branch Code', value: (viewData as Record<string, unknown>).branch_code as string },
            { label: 'Company', value: ((viewData as Record<string, unknown>).company as Record<string, unknown>)?.company_name as string ?? '—' },
            { label: 'Company Code', value: ((viewData as Record<string, unknown>).company as Record<string, unknown>)?.company_code as string ?? '—' },
            { label: 'Address', value: (viewData as Record<string, unknown>).address as string, fullWidth: true },
            { label: 'Status', value: <Badge variant={(viewData as Record<string, unknown>).status === 1 ? 'success' : 'default'}>{(viewData as Record<string, unknown>).status === 1 ? 'Active' : 'Inactive'}</Badge> },
          ]}
        />
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          title={editBranch ? 'Edit Branch' : 'Add Branch'}
          onClose={closeModal}
          footer={modalFooter}
        >
          {formError && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-input text-xs text-red-700">
              {formError}
            </div>
          )}
          <form id="branch-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
            <FormSelect
              label="Company"
              value={form.company_id}
              onChange={e => set('company_id', e.target.value)}
              onBlur={() => handleBlur('company_id')}
              options={companyOptions}
              placeholder="Select company"
              error={errors.company_id}
              touched={touched.company_id}
              required
            />
            <FormInput
              label="Branch Name"
              value={form.branch_name}
              onChange={e => set('branch_name', e.target.value)}
              onBlur={() => handleBlur('branch_name')}
              placeholder="Enter branch name"
              error={errors.branch_name}
              touched={touched.branch_name}
              required
            />
            <FormTextarea
              label="Address"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              onBlur={() => handleBlur('address')}
              placeholder="Enter address"
              error={errors.address}
              touched={touched.address}
              required
            />
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Branch"
          message={
            <span>
              Are you sure you want to delete <strong>{deleteTarget.branch_name}</strong>? This action cannot be undone.
            </span>
          }
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
