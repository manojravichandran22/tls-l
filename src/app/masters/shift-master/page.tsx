'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import { validateField, validateAll, hasErrors, type ValidationRules } from '@/lib/validation'
import Toast, { type ToastData } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import Badge from '@/components/ui/Badge'
import ViewModal from '@/components/ui/ViewModal'

// ── Types ──
interface Shift {
  id: number
  uuid: string
  shift_name: string
  type: string
  start_time: string
  end_time: string
  hrs: string
  breakMins: string
  start_buffer_time: string
  end_buffer_time: string
  branch_id: number
  zone_id: number
  lunch_start: string
  lunch_end: string
  mrg_break_start: string
  mrg_break_end: string
  evg_break_start: string
  evg_break_end: string
  status: number
  is_active: number
  branch?: { id: number; branch_name: string }
  zone?: { id: number; zone_name: string }
}

interface BranchOption { id: number; branch_name: string }
interface ZoneOption { id: number; zone_name: string; branch_id: number }

// ── Validation ──
type FormField = 'shift_name' | 'type' | 'start_time' | 'end_time' | 'hrs' | 'breakMins' | 'branch_id' | 'zone_id'
type FormErrors = Partial<Record<string, string>>
type Touched = Partial<Record<FormField, boolean>>

const rules: ValidationRules<FormField> = {
  shift_name: { required: 'Shift name is required', minLength: { value: 2, message: 'Minimum 2 characters' } },
  type: { required: 'Type is required' },
  start_time: { required: 'Start time is required' },
  end_time: { required: 'End time is required' },
  hrs: { required: 'Hours is required' },
  breakMins: { required: 'Break minutes is required' },
  branch_id: { required: 'Branch is required' },
  zone_id: { required: 'Zone is required' },
}

const SHIFT_TYPES = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'night', label: 'Night' },
]

// ── Add / Edit Modal ──
function ShiftModal({ shift, branches, allZones, onClose, onSaved }: {
  shift: Shift | null
  branches: BranchOption[]
  allZones: ZoneOption[]
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const isEdit = !!shift
  const [form, setForm] = useState({
    shift_name: shift?.shift_name ?? '',
    type: shift?.type ?? '',
    start_time: shift?.start_time?.slice(0, 5) ?? '',
    end_time: shift?.end_time?.slice(0, 5) ?? '',
    hrs: shift?.hrs ?? '',
    breakMins: shift?.breakMins ?? '',
    start_buffer_time: shift?.start_buffer_time?.slice(0, 5) ?? '',
    end_buffer_time: shift?.end_buffer_time?.slice(0, 5) ?? '',
    branch_id: shift?.branch_id?.toString() ?? '',
    zone_id: shift?.zone_id?.toString() ?? '',
    lunch_start: shift?.lunch_start?.slice(0, 5) ?? '',
    lunch_end: shift?.lunch_end?.slice(0, 5) ?? '',
    mrg_break_start: shift?.mrg_break_start?.slice(0, 5) ?? '',
    mrg_break_end: shift?.mrg_break_end?.slice(0, 5) ?? '',
    evg_break_start: shift?.evg_break_start?.slice(0, 5) ?? '',
    evg_break_end: shift?.evg_break_end?.slice(0, 5) ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})

  const filteredZones = allZones.filter(z => z.branch_id === parseInt(form.branch_id))

  const set = (key: string, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    if (touched[key as FormField] && rules[key as FormField]) {
      setErrors(e => ({ ...e, [key]: validateField(val, rules[key as FormField]) }))
    }
  }

  const handleBlur = (key: FormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    setErrors(e => ({ ...e, [key]: validateField(form[key as keyof typeof form], rules[key]) }))
  }

  const handleBranchChange = (val: string) => {
    setForm(f => ({ ...f, branch_id: val, zone_id: '' }))
    setTouched(t => ({ ...t, branch_id: true }))
    setErrors(e => ({ ...e, branch_id: validateField(val, rules.branch_id) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: Touched = { shift_name: true, type: true, start_time: true, end_time: true, hrs: true, breakMins: true, branch_id: true, zone_id: true }
    setTouched(allTouched)
    const formData = { shift_name: form.shift_name, type: form.type, start_time: form.start_time, end_time: form.end_time, hrs: form.hrs, breakMins: form.breakMins, branch_id: form.branch_id, zone_id: form.zone_id }
    const allErrors = validateAll(formData, rules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return

    setSaving(true)
    try {
      const payload: Record<string, unknown> = { ...form }
      if (isEdit) {
        payload.uuid = shift.uuid
        const res = await apiCall<{ success?: boolean; message?: string }>('/shift/update', { payload })
        if (res.success === false) { setErrors({ shift_name: res.message || 'Update failed' }); return }
        onSaved(res.message || 'Shift updated successfully')
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/shift/create', { payload })
        if (res.success === false) { setErrors({ shift_name: res.message || 'Creation failed' }); return }
        onSaved(res.message || 'Shift created successfully')
      }
      onClose()
    } catch {
      setErrors({ shift_name: 'Failed to save shift. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const sectionTitle = (text: string) => (
    <p className="text-xs font-bold text-t-secondary mt-1 mb-0">{text}</p>
  )

  return (
    <Modal
      title={isEdit ? 'Edit Shift' : 'Add Shift'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="shift-form" isLoading={saving}>
            {isEdit ? 'Update Shift' : 'Add Shift'}
          </Button>
        </>
      }
    >
      <form id="shift-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
          {/* ── Left Column ── */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Shift Name" value={form.shift_name} onChange={e => set('shift_name', e.target.value)} onBlur={() => handleBlur('shift_name')} placeholder="Shift A" error={errors.shift_name} touched={touched.shift_name} required />
              <FormSelect label="Type" value={form.type} onChange={e => { set('type', e.target.value); setTouched(t => ({ ...t, type: true })); setErrors(er => ({ ...er, type: validateField(e.target.value, rules.type) })) }} options={SHIFT_TYPES} placeholder="Select type" error={errors.type} touched={touched.type} required />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <FormSelect label="Branch" value={form.branch_id} onChange={e => handleBranchChange(e.target.value)} onBlur={() => handleBlur('branch_id')} options={branches.map(b => ({ value: b.id, label: b.branch_name }))} placeholder="Select branch" error={errors.branch_id} touched={touched.branch_id} required />
              <FormSelect label="Zone" value={form.zone_id} onChange={e => { set('zone_id', e.target.value); setTouched(t => ({ ...t, zone_id: true })); setErrors(er => ({ ...er, zone_id: validateField(e.target.value, rules.zone_id) })) }} options={filteredZones.map(z => ({ value: z.id, label: z.zone_name }))} placeholder={form.branch_id ? 'Select zone' : 'Select branch first'} disabled={!form.branch_id} error={errors.zone_id} touched={touched.zone_id} required />
            </div>

            {sectionTitle('Shift window')}
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Start time" type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} onBlur={() => handleBlur('start_time')} error={errors.start_time} touched={touched.start_time} required />
              <FormInput label="End time" type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} onBlur={() => handleBlur('end_time')} error={errors.end_time} touched={touched.end_time} required />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Buffer login" type="time" value={form.start_buffer_time} onChange={e => set('start_buffer_time', e.target.value)} placeholder="00:10" />
              <FormInput label="Buffer logout" type="time" value={form.end_buffer_time} onChange={e => set('end_buffer_time', e.target.value)} placeholder="00:15" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Hours" value={form.hrs} onChange={e => set('hrs', e.target.value)} onBlur={() => handleBlur('hrs')} placeholder="8" error={errors.hrs} touched={touched.hrs} required />
              <FormInput label="Break (mins)" value={form.breakMins} onChange={e => set('breakMins', e.target.value)} onBlur={() => handleBlur('breakMins')} placeholder="30" error={errors.breakMins} touched={touched.breakMins} required />
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="flex flex-col gap-3 md:border-l md:border-header-line md:pl-6 pt-3 md:pt-0">
            {sectionTitle('Lunch break')}
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Lunch start" type="time" value={form.lunch_start} onChange={e => set('lunch_start', e.target.value)} />
              <FormInput label="Lunch end" type="time" value={form.lunch_end} onChange={e => set('lunch_end', e.target.value)} />
            </div>

            {sectionTitle('Morning Short breaks')}
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Break start" type="time" value={form.mrg_break_start} onChange={e => set('mrg_break_start', e.target.value)} />
              <FormInput label="Break end" type="time" value={form.mrg_break_end} onChange={e => set('mrg_break_end', e.target.value)} />
            </div>

            {sectionTitle('Evening Short breaks')}
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Break start" type="time" value={form.evg_break_start} onChange={e => set('evg_break_start', e.target.value)} />
              <FormInput label="Break end" type="time" value={form.evg_break_end} onChange={e => set('evg_break_end', e.target.value)} />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}

// ── Main Page ──
export default function ShiftMasterPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [allZones, setAllZones] = useState<ZoneOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [deleting, setDeleting] = useState(false)

  const [activeTab, setActiveTab] = useState<'Shift(s)' | 'Calendar'>('Shift(s)')
  const [selected, setSelected] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editShift, setEditShift] = useState<Shift | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  useEffect(() => {
    apiCall<{ data?: { branches?: BranchOption[] } }>('/branch/branchList', { method: 'GET', encrypt: false, payload: { page: '1', per_page: '100', search: '' } })
      .then(res => setBranches(res.data?.branches ?? [])).catch(() => {})
    apiCall<{ data?: { zones?: ZoneOption[] } }>('/zone/zoneList', { method: 'GET', encrypt: false, payload: { page: '1', per_page: '100', search: '' } })
      .then(res => setAllZones(res.data?.zones ?? [])).catch(() => {})
  }, [])

  const fetchShifts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{ data?: { shifts?: Shift[]; pagination?: { total: number; total_pages: number } } }>('/shift/list', {
        method: 'GET', encrypt: false,
        payload: { page: String(page), per_page: String(perPage), search, branch_id: '' },
      })
      const data = res.data
      setShifts(data?.shifts ?? [])
      setTotalCount(data?.pagination?.total ?? 0)
      setTotalPages(data?.pagination?.total_pages ?? 1)
    } catch { setShifts([]) }
    finally { setLoading(false) }
  }, [search, page, perPage])

  useEffect(() => { fetchShifts() }, [fetchShifts])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/shift/delete', { payload: { uuid: deleteTarget.uuid } })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Shift deleted successfully', type: 'success' })
      setDeleteTarget(null)
      fetchShifts()
    } catch { setToast({ message: 'Failed to delete shift', type: 'error' }) }
    finally { setDeleting(false) }
  }

  const handleSaved = (msg: string) => { setToast({ message: msg, type: 'success' }); fetchShifts() }

  const handleView = async (uuid: string) => {
    setViewLoading(true); setViewData({})
    try {
      const res = await apiCall<{ data?: Record<string, unknown> }>('/shift/show', { method: 'GET', encrypt: false, payload: { uuid } })
      setViewData(res.data ?? res)
    } catch { setViewData(null) }
    finally { setViewLoading(false) }
  }

  const formatTime12 = (t?: string) => {
    if (!t) return '—'
    const [h, m] = t.slice(0, 5).split(':')
    const hr = parseInt(h)
    const ampm = hr >= 12 ? 'PM' : 'AM'
    const h12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr
    return `${String(h12).padStart(2, '0')}:${m} ${ampm}`
  }

  const typeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'morning': return 'text-success-text bg-success-bg'
      case 'afternoon': return 'text-info-text bg-info-bg'
      case 'night': return 'text-error-text bg-error-bg'
      default: return 'text-t-body bg-card-alt'
    }
  }

  const columns: AdvancedColumn<Shift>[] = [
    {
      key: 'factory',
      header: 'Factory',
      sortable: true,
      render: (row) => (
        <div>
          <span className="text-t-secondary block font-medium">{row.branch?.branch_name ?? '—'}</span>
          <span className="text-t-lighter text-2xs">{row.zone?.zone_name ?? ''}</span>
        </div>
      ),
    },
    {
      key: 'shift_name',
      header: 'Shift Name',
      sortable: true,
      render: (row) => <span className="text-accent font-medium">{row.shift_name}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className={`inline-block px-2.5 py-0.5 rounded text-xs2 font-medium capitalize ${typeColor(row.type)}`}>
          {row.type}
        </span>
      ),
    },
    { key: 'start_time', header: 'Start', render: (row) => <span className="text-t-body">{formatTime12(row.start_time)}</span> },
    { key: 'end_time', header: 'End', render: (row) => <span className="text-t-body">{formatTime12(row.end_time)}</span> },
    { key: 'hrs', header: 'Hrs', render: (row) => <span className="text-t-body font-semibold">{row.hrs}h</span> },
    { key: 'breakMins', header: 'Break', render: (row) => <span className="text-t-body">{row.breakMins}m</span> },
    { key: 'buffer', header: 'Buffer ti...', render: (row) => <span className="text-t-body">{row.start_buffer_time?.slice(0, 5) ?? '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.is_active === 1 ? 'success' : 'default'}>{row.is_active === 1 ? 'Active' : 'Inactive'}</Badge> },
  ]

  const getActions = (row: Shift): ActionItem[] => [
    { label: 'View', icon: <Eye size={13} />, onClick: () => handleView(row.uuid) },
    { label: 'Edit', icon: <Pencil size={13} />, onClick: () => { setEditShift(row); setShowModal(true) } },
    { label: 'Delete', icon: <Trash2 size={13} />, onClick: () => setDeleteTarget(row), variant: 'danger' },
  ]

  return (
    <AppLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {viewData && (
        <ViewModal
          title="Shift Details"
          loading={viewLoading}
          onClose={() => setViewData(null)}
          size="md"
          fields={[
            { label: 'Shift Name', value: (viewData as Record<string, unknown>).shift_name as string },
            { label: 'Type', value: <Badge variant="info">{(viewData as Record<string, unknown>).type as string}</Badge> },
            { label: 'Branch', value: ((viewData as Record<string, unknown>).branch as Record<string, unknown>)?.branch_name as string ?? '—' },
            { label: 'Zone', value: ((viewData as Record<string, unknown>).zone as Record<string, unknown>)?.zone_name as string ?? '—' },
            { label: 'Start Time', value: ((viewData as Record<string, unknown>).start_time as string)?.slice(0, 5) },
            { label: 'End Time', value: ((viewData as Record<string, unknown>).end_time as string)?.slice(0, 5) },
            { label: 'Hours', value: `${(viewData as Record<string, unknown>).hrs}h` },
            { label: 'Break', value: `${(viewData as Record<string, unknown>).breakMins}m` },
            { label: 'Buffer Login', value: ((viewData as Record<string, unknown>).start_buffer_time as string)?.slice(0, 5) ?? '—' },
            { label: 'Buffer Logout', value: ((viewData as Record<string, unknown>).end_buffer_time as string)?.slice(0, 5) ?? '—' },
            { label: 'Lunch Start', value: ((viewData as Record<string, unknown>).lunch_start as string)?.slice(0, 5) ?? '—' },
            { label: 'Lunch End', value: ((viewData as Record<string, unknown>).lunch_end as string)?.slice(0, 5) ?? '—' },
            { label: 'Status', value: <Badge variant={(viewData as Record<string, unknown>).is_active === 1 ? 'success' : 'default'}>{(viewData as Record<string, unknown>).is_active === 1 ? 'Active' : 'Inactive'}</Badge> },
          ]}
        />
      )}

      {showModal && (
        <ShiftModal
          shift={editShift}
          branches={branches}
          allZones={allZones}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Shift"
          message={<>Are you sure you want to delete <strong>{deleteTarget.shift_name}</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader title="Shift Master" description="Define factory shifts with working hours and break times." />

      {/* Tabs */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex gap-0 border-b border-header-line">
          {(['Shift(s)', 'Calendar'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-none bg-transparent cursor-pointer text-sm font-inherit select-none -mb-px
                ${activeTab === tab ? 'font-semibold text-accent border-b-2 border-b-accent' : 'font-normal text-t-light border-b-2 border-b-transparent'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <Toolbar
          search={search}
          onSearchChange={val => { setSearch(val); setPage(1) }}
          onAdd={() => { setEditShift(null); setShowModal(true) }}
          addLabel="Add Shift"
        />
      </div>

      {activeTab === 'Shift(s)' ? (
        <AdvancedTable
          columns={columns}
          data={shifts}
          loading={loading}
          emptyMessage="No shifts found"
          rowKey={(row) => row.uuid}
          selectable
          selected={selected}
          onSelectionChange={setSelected}
          actions={getActions}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
        onPerPageChange={setPerPage}
          countLabel="shift"
        />
      ) : (
        <div className="bg-card rounded-card border border-header-line p-8 text-center text-t-lighter text-sm">
          Calendar view coming soon
        </div>
      )}
    </AppLayout>
  )
}
