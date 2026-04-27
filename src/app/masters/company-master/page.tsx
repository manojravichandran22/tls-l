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
import FormTextarea from '@/components/ui/FormTextarea'
import FormSelect from '@/components/ui/FormSelect'
import Badge from '@/components/ui/Badge'
import ViewModal, { type ViewField } from '@/components/ui/ViewModal'

// ── Types ────────────────────────────────────────────
interface Company {
  uuid: string
  company_name: string
  address: string
  location: { lat: number; lng: number }
  company_type: string
  max_slot: number
  status: number
}

interface FormData {
  company_name: string
  address: string
  lat: string
  lng: string
  company_type: string
  max_slot: string
}

type FormField = 'company_name' | 'address' | 'lat' | 'lng' | 'company_type' | 'max_slot'
type FormErrors = Partial<Record<FormField, string>>
type Touched = Partial<Record<FormField, boolean>>

const rules: ValidationRules<FormField> = {
  company_name: {
    required: 'Company name is required',
    minLength: { value: 2, message: 'Minimum 2 characters' },
    maxLength: { value: 100, message: 'Maximum 100 characters' },
  },
  address: {
    required: 'Address is required',
    minLength: { value: 3, message: 'Minimum 3 characters' },
  },
  company_type: {
    required: 'Company type is required',
  },
  max_slot: {
    required: 'Max slot is required',
    min: { value: 1, message: 'Minimum value is 1' },
    max: { value: 50, message: 'Maximum value is 50' },
  },
  lat: {
    pattern: { value: /^-?\d+(\.\d+)?$/, message: 'Enter a valid latitude' },
  },
  lng: {
    pattern: { value: /^-?\d+(\.\d+)?$/, message: 'Enter a valid longitude' },
  },
}

const COMPANY_TYPE_OPTIONS = [
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Service', label: 'Service' },
  { value: 'Trading', label: 'Trading' },
  { value: 'Other', label: 'Other' },
]

// ── Add / Edit Modal ─────────────────────────────────
function CompanyModal({
  company, onClose, onSaved,
}: {
  company: Company | null
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const isEdit = !!company
  const [form, setForm] = useState<FormData>({
    company_name: company?.company_name ?? '',
    address: company?.address ?? '',
    lat: company?.location?.lat?.toString() ?? '',
    lng: company?.location?.lng?.toString() ?? '',
    company_type: company?.company_type ?? '',
    max_slot: company?.max_slot?.toString() ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Mark all as touched
    const allTouched: Touched = { company_name: true, address: true, company_type: true, max_slot: true, lat: true, lng: true }
    setTouched(allTouched)
    const allErrors = validateAll(form, rules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        company_name: form.company_name,
        address: form.address,
        location: {
          lat: parseFloat(form.lat) || 0,
          lng: parseFloat(form.lng) || 0,
        },
        company_type: form.company_type,
        max_slot: parseInt(form.max_slot) || 1,
      }

      if (isEdit) {
        payload.uuid = company.uuid
        const res = await apiCall<{ success?: boolean; message?: string }>('/company/update', { payload })
        if (res.success === false) { setErrors({ company_name: res.message || 'Update failed' }); return }
        onSaved(res.message || 'Company updated successfully')
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/company/create', { payload })
        if (res.success === false) { setErrors({ company_name: res.message || 'Creation failed' }); return }
        onSaved(res.message || 'Company created successfully')
      }
      onClose()
    } catch {
      setErrors({ company_name: 'Failed to save company. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Company' : 'Add Company'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="company-form" isLoading={saving}>
            {isEdit ? 'Update Company' : 'Add Company'}
          </Button>
        </>
      }
    >
      <form id="company-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormInput
          label="Company Name"
          value={form.company_name}
          onChange={e => set('company_name', e.target.value)}
          onBlur={() => handleBlur('company_name')}
          placeholder="TLS Manufacturing"
          error={errors.company_name}
          touched={touched.company_name}
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

        <div className="grid grid-cols-2 gap-2.5">
          <FormInput
            label="Latitude"
            type="number"
            step="any"
            value={form.lat}
            onChange={e => set('lat', e.target.value)}
            onBlur={() => handleBlur('lat')}
            placeholder="12.9675"
            error={errors.lat}
            touched={touched.lat}
          />
          <FormInput
            label="Longitude"
            type="number"
            step="any"
            value={form.lng}
            onChange={e => set('lng', e.target.value)}
            onBlur={() => handleBlur('lng')}
            placeholder="80.1491"
            error={errors.lng}
            touched={touched.lng}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <FormSelect
            label="Company Type"
            options={COMPANY_TYPE_OPTIONS}
            value={form.company_type}
            onChange={e => { set('company_type', e.target.value); handleBlur('company_type') }}
            onBlur={() => handleBlur('company_type')}
            placeholder="Select type"
            error={errors.company_type}
            touched={touched.company_type}
            required
          />
          <FormInput
            label="Max Slot"
            type="number"
            min={1}
            value={form.max_slot}
            onChange={e => set('max_slot', e.target.value)}
            onBlur={() => handleBlur('max_slot')}
            placeholder="3"
            error={errors.max_slot}
            touched={touched.max_slot}
            required
          />
        </div>
      </form>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────
export default function CompanyMasterPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [deleting, setDeleting] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editCompany, setEditCompany] = useState<Company | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  const handleView = async (id: number) => {
    setViewLoading(true)
    setViewData({})
    try {
      const res = await apiCall<{ data?: Record<string, unknown> }>('/company/show', { method: 'GET', encrypt: false, payload: { id: String(id) } })
      setViewData(res.data ?? res)
    } catch {
      setViewData(null)
    } finally {
      setViewLoading(false)
    }
  }

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{
        data?: {
          companies?: Company[]
          count?: number
          totalPages?: number
          pagination?: { total: number; total_pages: number }
        }
      }>('/company/companyList', { method: 'GET', encrypt: false, payload: { page: String(page), per_page: String(perPage), search, company_id: '', status: 'all' } })

      const data = res.data
      const rows: Company[] = data?.companies ?? []
      setCompanies(rows)
      const total = data?.pagination?.total ?? data?.count ?? rows.length
      setTotalCount(total)
      setTotalPages(data?.pagination?.total_pages ?? data?.totalPages ?? (Math.ceil(total / PER_PAGE) || 1))
    } catch {
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }, [search, page, perPage])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/company/delete', { payload: { uuid: deleteTarget.uuid } })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Company deleted successfully', type: 'success' })
      setDeleteTarget(null)
      fetchCompanies()
    } catch {
      setToast({ message: 'Failed to delete company', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const handleSaved = (msg: string) => {
    setToast({ message: msg, type: 'success' })
    fetchCompanies()
  }

  const columns = [
    {
      key: '#',
      header: '#',
      render: (_: Company, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * 10 + i + 1}</span>
      ),
    },
    {
      key: 'company_name',
      header: 'Company Name',
      render: (row: Company) => (
        <span className="text-accent font-semibold">{row.company_name}</span>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (row: Company) => (
        <span className="text-t-body">{row.address}</span>
      ),
    },
    {
      key: 'company_type',
      header: 'Type',
      render: (row: Company) => (
        <Badge variant="info">{row.company_type}</Badge>
      ),
    },
    {
      key: 'max_slot',
      header: 'Max Slot',
      render: (row: Company) => (
        <span className="text-t-body font-semibold">{row.max_slot}</span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (row: Company) => (
        <span className="text-t-light text-xs2">
          {row.location?.lat}, {row.location?.lng}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Company) => <Badge variant={row.status === 1 ? 'success' : 'default'}>{row.status === 1 ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row: Company) => (
        <div className="flex gap-1.5 items-center">
          <IconButton variant="accent" onClick={() => handleView((row as unknown as { id: number }).id)} title="View"><Eye size={13} /></IconButton>
          <IconButton variant="accent" onClick={() => { setEditCompany(row); setShowModal(true) }} title="Edit"><Pencil size={13} /></IconButton>
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
          title="Company Details"
          loading={viewLoading}
          onClose={() => setViewData(null)}
          fields={[
            { label: 'Company Name', value: (viewData as Record<string, unknown>).company_name as string },
            { label: 'Company Code', value: (viewData as Record<string, unknown>).company_code as string },
            { label: 'Company Type', value: <Badge variant="info">{(viewData as Record<string, unknown>).company_type as string}</Badge> },
            { label: 'Max Slot', value: String((viewData as Record<string, unknown>).max_slot ?? '—') },
            { label: 'Address', value: (viewData as Record<string, unknown>).address as string, fullWidth: true },
            { label: 'Location', value: `${((viewData as Record<string, unknown>).location as Record<string, unknown>)?.lat ?? '—'}, ${((viewData as Record<string, unknown>).location as Record<string, unknown>)?.lng ?? '—'}` },
            { label: 'Status', value: <Badge variant={(viewData as Record<string, unknown>).status === 1 ? 'success' : 'default'}>{(viewData as Record<string, unknown>).status === 1 ? 'Active' : 'Inactive'}</Badge> },
          ]}
        />
      )}

      {showModal && (
        <CompanyModal
          company={editCompany}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Company"
          message={<>Are you sure you want to delete <strong>{deleteTarget.company_name}</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader title="Company Master" description="Manage company profiles, locations, types and slot configurations." />

      <Toolbar
        title="All Companies"
        search={search}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onAdd={() => { setEditCompany(null); setShowModal(true) }}
        addLabel="Add Company"
      />

      <DataTable
        columns={columns}
        data={companies}
        loading={loading}
        emptyMessage="No companies found"
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        countLabel="company"
      />
    </AppLayout>
  )
}
