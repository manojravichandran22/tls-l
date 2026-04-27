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
interface Workstation {
  id: number
  uuid: string
  name: string
  code: string
  line_id: number
  branch_id: number
  qr_code: string
  status: number
  is_active: number
  line?: { id: number; line_name: string }
  branch?: { id: number; branch_name: string; branch_code: string }
}

interface BranchOption { id: number; branch_name: string }
interface LineOption { id: number; line_name: string; branch_id?: number }

// ── Validation ──
type FormField = 'name' | 'line_id' | 'branch_id' | 'qr_code'
type FormErrors = Partial<Record<FormField, string>>
type Touched = Partial<Record<FormField, boolean>>

const rules: ValidationRules<FormField> = {
  name: { required: 'Workstation name is required', minLength: { value: 2, message: 'Minimum 2 characters' } },
  branch_id: { required: 'Branch is required' },
  line_id: { required: 'Line is required' },
  qr_code: { required: 'QR Code is required' },
}

// ── Add / Edit Modal ──
function WorkstationModal({ ws, branches, allLines, onClose, onSaved }: {
  ws: Workstation | null
  branches: BranchOption[]
  allLines: LineOption[]
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const isEdit = !!ws
  const [form, setForm] = useState({
    name: ws?.name ?? '',
    branch_id: ws?.branch_id?.toString() ?? '',
    line_id: ws?.line_id?.toString() ?? '',
    qr_code: ws?.qr_code ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})

  const filteredLines = allLines.filter(l => !form.branch_id || l.branch_id === parseInt(form.branch_id))

  const set = (key: FormField, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    if (touched[key]) setErrors(e => ({ ...e, [key]: validateField(val, rules[key]) }))
  }

  const handleBlur = (key: FormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    setErrors(e => ({ ...e, [key]: validateField(form[key], rules[key]) }))
  }

  const handleBranchChange = (val: string) => {
    setForm(f => ({ ...f, branch_id: val, line_id: '' }))
    setTouched(t => ({ ...t, branch_id: true }))
    setErrors(e => ({ ...e, branch_id: validateField(val, rules.branch_id) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: Touched = { name: true, branch_id: true, line_id: true, qr_code: true }
    setTouched(allTouched)
    const allErrors = validateAll(form, rules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        branch_id: form.branch_id,
        line_id: form.line_id,
        qr_code: form.qr_code,
      }
      if (isEdit) {
        payload.uuid = ws.uuid
        payload.code = ws.code
        const res = await apiCall<{ success?: boolean; message?: string }>('/workstation/update', { payload })
        if (res.success === false) { setErrors({ name: res.message || 'Update failed' }); return }
        onSaved(res.message || 'Workstation updated successfully')
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/workstation/create', { payload })
        if (res.success === false) { setErrors({ name: res.message || 'Creation failed' }); return }
        onSaved(res.message || 'Workstation created successfully')
      }
      onClose()
    } catch {
      setErrors({ name: 'Failed to save workstation. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Workstation' : 'Add Workstation'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="ws-form" isLoading={saving}>
            {isEdit ? 'Update Workstation' : 'Add Workstation'}
          </Button>
        </>
      }
    >
      <form id="ws-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormInput label="Workstation Name" value={form.name} onChange={e => set('name', e.target.value)} onBlur={() => handleBlur('name')} placeholder="e.g. WorkStation 1" error={errors.name} touched={touched.name} required />
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
            label="Line"
            value={form.line_id}
            onChange={e => { set('line_id', e.target.value); setTouched(t => ({ ...t, line_id: true })); setErrors(er => ({ ...er, line_id: validateField(e.target.value, rules.line_id) })) }}
            onBlur={() => handleBlur('line_id')}
            options={filteredLines.map(l => ({ value: l.id, label: l.line_name }))}
            placeholder={form.branch_id ? 'Select line' : 'Select branch first'}
            disabled={!form.branch_id}
            error={errors.line_id}
            touched={touched.line_id}
            required
          />
        </div>
        <FormInput label="QR Code" value={form.qr_code} onChange={e => set('qr_code', e.target.value)} onBlur={() => handleBlur('qr_code')} placeholder="e.g. QRCODE123" error={errors.qr_code} touched={touched.qr_code} required />
      </form>
    </Modal>
  )
}

// ── Main Page ──
export default function WorkstationMasterPage() {
  const [workstations, setWorkstations] = useState<Workstation[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [allLines, setAllLines] = useState<LineOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [deleting, setDeleting] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editWs, setEditWs] = useState<Workstation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Workstation | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  useEffect(() => {
    apiCall<{ data?: { branches?: BranchOption[] } }>('/branch/branchList', { method: 'GET', encrypt: false, payload: { page: '1', per_page: '100', search: '', status: 'all' } })
      .then(res => setBranches(res.data?.branches ?? [])).catch(() => {})
    apiCall<{ data?: { lines?: LineOption[] } }>('/line/list', { method: 'GET', encrypt: false, payload: { page: '1', per_page: '100', search: '', status: 'all' } })
      .then(res => setAllLines(res.data?.lines ?? [])).catch(() => {})
  }, [])

  const fetchWorkstations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{ data?: { workstations?: Workstation[]; pagination?: { total: number; total_pages: number } } }>('/workstation/list', {
        method: 'GET', encrypt: false,
        payload: { page: String(page), per_page: String(perPage), search, line_id: '', branch_id: '', status: 'all' },
      })
      const data = res.data
      setWorkstations(data?.workstations ?? [])
      setTotalCount(data?.pagination?.total ?? 0)
      setTotalPages(data?.pagination?.total_pages ?? 1)
    } catch { setWorkstations([]) }
    finally { setLoading(false) }
  }, [search, page, perPage])

  useEffect(() => { fetchWorkstations() }, [fetchWorkstations])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/workstation/delete', { payload: { uuid: deleteTarget.uuid } })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Workstation deleted successfully', type: 'success' })
      setDeleteTarget(null)
      fetchWorkstations()
    } catch { setToast({ message: 'Failed to delete workstation', type: 'error' }) }
    finally { setDeleting(false) }
  }

  const handleSaved = (msg: string) => { setToast({ message: msg, type: 'success' }); fetchWorkstations() }

  const handleView = async (uuid: string) => {
    setViewLoading(true); setViewData({})
    try {
      const res = await apiCall<{ data?: Record<string, unknown> }>('/workstation/show', { method: 'GET', encrypt: false, payload: { uuid } })
      setViewData(res.data ?? res)
    } catch { setViewData(null) }
    finally { setViewLoading(false) }
  }

  const columns = [
    { key: '#', header: '#', render: (_: Workstation, i: number) => <span className="text-t-lighter text-xs">{(page - 1) * PER_PAGE + i + 1}</span> },
    { key: 'name', header: 'Workstation', render: (row: Workstation) => <span className="text-accent font-semibold">{row.name}</span> },
    { key: 'code', header: 'Code', render: (row: Workstation) => <span className="text-t-body font-mono text-xs">{row.code}</span> },
    { key: 'line', header: 'Line', render: (row: Workstation) => <span className="text-t-body">{row.line?.line_name ?? '—'}</span> },
    { key: 'branch', header: 'Branch', render: (row: Workstation) => <span className="text-t-body">{row.branch?.branch_name ?? '—'}</span> },
    { key: 'qr_code', header: 'QR Code', render: (row: Workstation) => <span className="text-t-body font-mono text-xs">{row.qr_code}</span> },
    { key: 'status', header: 'Status', render: (row: Workstation) => <Badge variant={row.is_active === 1 ? 'success' : 'default'}>{row.is_active === 1 ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', header: '',
      render: (row: Workstation) => (
        <div className="flex gap-1.5 items-center">
          <IconButton variant="accent" onClick={() => handleView(row.uuid)} title="View"><Eye size={13} /></IconButton>
          <IconButton variant="accent" onClick={() => { setEditWs(row); setShowModal(true) }} title="Edit"><Pencil size={13} /></IconButton>
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
          title="Workstation Details"
          loading={viewLoading}
          onClose={() => setViewData(null)}
          fields={[
            { label: 'Workstation Name', value: (viewData as Record<string, unknown>).name as string },
            { label: 'Code', value: (viewData as Record<string, unknown>).code as string },
            { label: 'Line', value: ((viewData as Record<string, unknown>).line as Record<string, unknown>)?.line_name as string ?? '—' },
            { label: 'Branch', value: ((viewData as Record<string, unknown>).branch as Record<string, unknown>)?.branch_name as string ?? '—' },
            { label: 'QR Code', value: (viewData as Record<string, unknown>).qr_code as string },
            { label: 'Status', value: <Badge variant={(viewData as Record<string, unknown>).is_active === 1 ? 'success' : 'default'}>{(viewData as Record<string, unknown>).is_active === 1 ? 'Active' : 'Inactive'}</Badge> },
          ]}
        />
      )}

      {showModal && (
        <WorkstationModal
          ws={editWs}
          branches={branches}
          allLines={allLines}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Workstation"
          message={<>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader title="Work station Master" description="Manage workstations, line assignments and QR codes." />

      <Toolbar
        title="All Work stations"
        search={search}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onAdd={() => { setEditWs(null); setShowModal(true) }}
        addLabel="Add Workstation"
      />

      <DataTable
        columns={columns}
        data={workstations}
        loading={loading}
        emptyMessage="No workstations found"
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        countLabel="workstation"
      />
    </AppLayout>
  )
}
