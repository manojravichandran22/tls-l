'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import IconButton from '@/components/ui/IconButton'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import Toast, { type ToastData } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import DataTable from '@/components/ui/DataTable'
import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'
import Toolbar from '@/components/ui/Toolbar'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import { validateField, validateAll, hasErrors, type ValidationRules } from '@/lib/validation'

// ── Types ────────────────────────────────────────────
interface Zone {
  id: number
  company_id: number
  branch_id: number
  zone_name: string
  zone_code: string
  status: number
  company?: { id: number; company_name: string; company_code: string }
  branch?: { id: number; branch_name: string; branch_code: string }
}

interface CompanyOption { id: number; company_name: string }
interface BranchOption { id: number; company_id: number; branch_name: string }

interface FormErrors {
  company_id?: string
  branch_id?: string
  zone_name?: string
}

type FormField = 'company_id' | 'branch_id' | 'zone_name'
type Touched = Partial<Record<FormField, boolean>>

const rules: ValidationRules<FormField> = {
  company_id: { required: 'Company is required' },
  branch_id: { required: 'Branch is required' },
  zone_name: {
    required: 'Zone name is required',
    minLength: { value: 2, message: 'Minimum 2 characters' },
    maxLength: { value: 50, message: 'Maximum 50 characters' },
  },
}

// ── Add / Edit Modal ─────────────────────────────────
function ZoneModal({
  zone, companies, allBranches, onClose, onSaved,
}: {
  zone: Zone | null
  companies: CompanyOption[]
  allBranches: BranchOption[]
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const isEdit = !!zone
  const [companyId, setCompanyId] = useState(zone?.company_id?.toString() ?? '')
  const [branchId, setBranchId] = useState(zone?.branch_id?.toString() ?? '')
  const [zoneName, setZoneName] = useState(zone?.zone_name ?? '')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})

  const filteredBranches = allBranches.filter(b => b.company_id === parseInt(companyId))

  const handleCompanyChange = (val: string) => {
    setCompanyId(val)
    setBranchId('')
    setTouched(t => ({ ...t, company_id: true }))
    setErrors(e => ({ ...e, company_id: validateField(val, rules.company_id) }))
  }

  const handleBranchChange = (val: string) => {
    setBranchId(val)
    setTouched(t => ({ ...t, branch_id: true }))
    setErrors(e => ({ ...e, branch_id: validateField(val, rules.branch_id) }))
  }

  const handleZoneNameChange = (val: string) => {
    setZoneName(val)
    if (touched.zone_name) {
      setErrors(e => ({ ...e, zone_name: validateField(val, rules.zone_name) }))
    }
  }

  const handleBlur = (key: FormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    const val = key === 'company_id' ? companyId : key === 'branch_id' ? branchId : zoneName
    setErrors(e => ({ ...e, [key]: validateField(val, rules[key]) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const allTouched: Touched = { company_id: true, branch_id: true, zone_name: true }
    setTouched(allTouched)
    const formData = { company_id: companyId, branch_id: branchId, zone_name: zoneName }
    const allErrors = validateAll(formData, rules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        zone_name: zoneName,
        company_id: companyId,
        branch_id: branchId,
      }

      if (isEdit) {
        payload.id = zone.id
        const res = await apiCall<{ success?: boolean; message?: string }>('/zone/update', { payload })
        if (res.success === false) { setErrors({ zone_name: res.message || 'Update failed' }); return }
        onSaved(res.message || 'Zone updated successfully')
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/zone/create', { payload })
        if (res.success === false) { setErrors({ zone_name: res.message || 'Creation failed' }); return }
        onSaved(res.message || 'Zone created successfully')
      }
      onClose()
    } catch {
      setErrors({ zone_name: 'Failed to save zone. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Zone' : 'Add Zone'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="zone-form" isLoading={saving}>
            {isEdit ? 'Update Zone' : 'Add Zone'}
          </Button>
        </>
      }
    >
      <form id="zone-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormSelect
          label="Company"
          value={companyId}
          onChange={e => handleCompanyChange(e.target.value)}
          onBlur={() => handleBlur('company_id')}
          options={companies.map(c => ({ value: c.id, label: c.company_name }))}
          placeholder="Select company"
          error={errors.company_id}
          touched={touched.company_id}
          required
        />

        <FormSelect
          label="Branch"
          value={branchId}
          onChange={e => handleBranchChange(e.target.value)}
          onBlur={() => handleBlur('branch_id')}
          options={filteredBranches.map(b => ({ value: b.id, label: b.branch_name }))}
          placeholder={companyId ? 'Select branch' : 'Select company first'}
          disabled={!companyId}
          error={errors.branch_id}
          touched={touched.branch_id}
          required
        />

        <FormInput
          label="Zone Name"
          value={zoneName}
          onChange={e => handleZoneNameChange(e.target.value)}
          onBlur={() => handleBlur('zone_name')}
          placeholder="Enter zone name"
          error={errors.zone_name}
          touched={touched.zone_name}
          required
        />
      </form>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────
export default function ZoneMasterPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [allBranches, setAllBranches] = useState<BranchOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [deleting, setDeleting] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editZone, setEditZone] = useState<Zone | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Zone | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  const handleView = async (id: number) => {
    setViewLoading(true)
    setViewData({})
    try {
      const res = await apiCall<{ data?: Record<string, unknown> }>('/zone/show', { method: 'GET', encrypt: false, payload: { id: String(id) } })
      setViewData(res.data ?? res)
    } catch { setViewData(null) }
    finally { setViewLoading(false) }
  }

  // Fetch dropdown data
  useEffect(() => {
    apiCall<{ data?: { companies?: CompanyOption[] } }>('/company/companyList', { method: 'GET', encrypt: false, payload: { page: '1', per_page: '100', search: '' } })
      .then(res => setCompanies(res.data?.companies ?? []))
      .catch(() => {})

    apiCall<{ data?: { branches?: BranchOption[] } }>('/branch/branchList', { method: 'GET', encrypt: false, payload: { page: '1', per_page: '100', search: '' } })
      .then(res => setAllBranches(res.data?.branches ?? []))
      .catch(() => {})
  }, [])

  const fetchZones = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{
        data?: {
          zones?: Zone[]
          pagination?: { total: number; total_pages: number }
        }
      }>('/zone/zoneList', {
        method: 'GET', encrypt: false, payload: { search, page: String(page), per_page: String(perPage) },
      })

      const data = res.data
      setZones(data?.zones ?? [])
      setTotalCount(data?.pagination?.total ?? 0)
      setTotalPages(data?.pagination?.total_pages ?? 1)
    } catch {
      setZones([])
    } finally {
      setLoading(false)
    }
  }, [search, page, perPage])

  useEffect(() => {
    fetchZones()
  }, [fetchZones])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/zone/delete', { payload: { id: deleteTarget.id } })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Zone deleted successfully', type: 'success' })
      setDeleteTarget(null)
      fetchZones()
    } catch {
      setToast({ message: 'Failed to delete zone', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const handleSaved = (msg: string) => {
    setToast({ message: msg, type: 'success' })
    fetchZones()
  }

  const columns = [
    {
      key: '#',
      header: '#',
      render: (_: Zone, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * 30 + i + 1}</span>
      ),
    },
    {
      key: 'zone_name',
      header: 'Zone Name',
      render: (row: Zone) => (
        <span className="text-accent font-semibold">{row.zone_name}</span>
      ),
    },
    {
      key: 'zone_code',
      header: 'Zone Code',
      render: (row: Zone) => (
        <span className="font-mono text-xs text-t-body">{row.zone_code}</span>
      ),
    },
    {
      key: 'company_name',
      header: 'Company Name',
      render: (row: Zone) => (
        <span className="text-t-body">{row.company?.company_name ?? '\u2014'}</span>
      ),
    },
    {
      key: 'company_code',
      header: 'Company Code',
      render: (row: Zone) => (
        <span className="font-mono text-xs text-t-body">{row.company?.company_code ?? '\u2014'}</span>
      ),
    },
    {
      key: 'branch_name',
      header: 'Branch Name',
      render: (row: Zone) => (
        <span className="text-t-body">{row.branch?.branch_name ?? '\u2014'}</span>
      ),
    },
    {
      key: 'branch_code',
      header: 'Branch Code',
      render: (row: Zone) => (
        <span className="font-mono text-xs text-t-body">{row.branch?.branch_code ?? '\u2014'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Zone) => <Badge variant={row.status === 1 ? 'success' : 'default'}>{row.status === 1 ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row: Zone) => (
        <div className="flex gap-1.5 items-center">
          <IconButton variant="accent" onClick={() => handleView(row.id)} title="View"><Eye size={13} /></IconButton>
          <IconButton variant="accent" onClick={() => { setEditZone(row); setShowModal(true) }} title="Edit"><Pencil size={13} /></IconButton>
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
          title="Zone Details"
          loading={viewLoading}
          onClose={() => setViewData(null)}
          fields={[
            { label: 'Zone Name', value: (viewData as Record<string, unknown>).zone_name as string },
            { label: 'Zone Code', value: (viewData as Record<string, unknown>).zone_code as string },
            { label: 'Company', value: ((viewData as Record<string, unknown>).company as Record<string, unknown>)?.company_name as string ?? '—' },
            { label: 'Branch', value: ((viewData as Record<string, unknown>).branch as Record<string, unknown>)?.branch_name as string ?? '—' },
            { label: 'Status', value: <Badge variant={(viewData as Record<string, unknown>).status === 1 ? 'success' : 'default'}>{(viewData as Record<string, unknown>).status === 1 ? 'Active' : 'Inactive'}</Badge> },
          ]}
        />
      )}

      {showModal && (
        <ZoneModal
          zone={editZone}
          companies={companies}
          allBranches={allBranches}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Zone"
          message={<>Are you sure you want to delete <strong>{deleteTarget.zone_name}</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader title="Zone Master" description="Manage production zones within company branches." />

      <Toolbar
        title="All Zones"
        search={search}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onAdd={() => { setEditZone(null); setShowModal(true) }}
        addLabel="Add Zone"
      />

      <DataTable
        columns={columns}
        data={zones}
        loading={loading}
        emptyMessage="No zones found"
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        countLabel="zone"
      />
    </AppLayout>
  )
}
