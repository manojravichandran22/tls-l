'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import FormTextarea from '@/components/ui/FormTextarea'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast from '@/components/ui/Toast'
import PageHeader from '@/components/ui/PageHeader'
import { Search, Plus, Pencil, Trash2, QrCode, ArrowRight, Download, Upload, MoreVertical } from 'lucide-react'
import { apiCall, apiUpload } from '@/services/apiClient'
import { useDropdownData } from '@/hooks/useDropdownData'
import type { ToastData } from '@/components/ui/Toast'

// ── Types ──────────────────────────────────────────────────────────────────────
interface MachineType {
  id: number
  uuid: string
  type_name: string
  needle?: string
  name?: string
  notes?: string | null
  status: number
  is_active: number
  machines_count?: number
  specs_count?: number
}

interface MachineSpec {
  id: number
  uuid: string
  machine_no: string
  machine_type_id: number
  brand: string
  model_no: string
  condition: number
  serial_no: string
  purchase_date: string
  last_oil_change: string | null
  next_maintenance: string | null
  warranty: number | null
  branch_id: number | null
  qr_code: string | null
  is_active: number
  branch?: { id: number; branch_name: string; address?: string } | null
  conditionInfo?: { id: number; type: string; value: string } | null
  stockType?: { id: number; type_name: string; needle: string; name: string }
  file?: string | null
}

const CONDITION_OPTIONS = [
  { value: '1', label: 'Good' },
  { value: '2', label: 'Fair' },
  { value: '3', label: 'Poor' },
]

const conditionLabel = (val: string) => CONDITION_OPTIONS.find(o => o.value === String(val))?.label ?? val

// ── Add / Edit Machine Type Modal ─────────────────────────────────────────────
function MachineTypeModal({ editType, onClose, onSaved, onError }: {
  editType?: MachineType | null
  onClose: () => void
  onSaved: (msg: string) => void
  onError: (msg: string) => void
}) {
  const isEdit = !!editType
  const [form, setForm] = useState({ type_name: editType?.type_name ?? '', notes: editType?.notes ?? '' })
  const [saving, setSaving] = useState(false)
  const [fieldError, setFieldError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.type_name.trim()) { setFieldError('Machine type name is required'); return }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { type_name: form.type_name, notes: form.notes }
      if (isEdit) payload.uuid = editType.uuid
      const res = await apiCall<{ success?: boolean | number; message?: string }>(
        isEdit ? '/machine/update' : '/machine/create',
        { payload }
      )
      if (!res.success) { onError(res.message || (isEdit ? 'Update failed' : 'Create failed')); onClose(); return }
      onSaved(res.message || (isEdit ? 'Machine type updated' : 'Machine type created'))
      onClose()
    } catch { onError(isEdit ? 'Failed to update machine type' : 'Failed to create machine type'); onClose() }
    finally { setSaving(false) }
  }

  return (
    <Modal title={isEdit ? 'Edit Machine Type' : 'Add Machine Type'} onClose={onClose} footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" form="machine-type-form" isLoading={saving}>
          {isEdit ? 'Update Machine Type' : 'Add Machine Type'}
        </Button>
      </>
    }>
      <form id="machine-type-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormInput
          label="Machine Type Name" required
          value={form.type_name}
          onChange={e => { setForm(f => ({ ...f, type_name: e.target.value })); setFieldError('') }}
          placeholder="e.g. 2T Flatlock"
          error={fieldError} touched={!!fieldError}
          autoFocus
        />
        <FormTextarea
          label="Notes"
          value={form.notes ?? ''}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Optional description"
          rows={3}
        />
      </form>
    </Modal>
  )
}

// ── Add / Edit Specification Modal ─────────────────────────────────────────────
function SpecModal({ spec, machineTypeId, onClose, onSaved, onError }: {
  spec: MachineSpec | null
  machineTypeId: number
  onClose: () => void
  onSaved: (msg: string) => void
  onError: (msg: string) => void
}) {
  const isEdit = !!spec
  const { branches } = useDropdownData({ branches: true })
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    machine_no: spec?.machine_no ?? '',
    brand: spec?.brand ?? '',
    model_no: spec?.model_no ?? '',
    condition: spec?.condition?.toString() ?? '1',
    serial_no: spec?.serial_no ?? '',
    purchase_date: spec?.purchase_date ?? '',
    last_oil_change: spec?.last_oil_change ?? '',
    next_maintenance: spec?.next_maintenance ?? '',
    warranty: spec?.warranty?.toString() ?? '',
    branch_id: spec?.branch_id?.toString() ?? '',
    qr_code: spec?.qr_code?.toString() ?? '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [fieldError, setFieldError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.machine_no.trim()) { setFieldError('Machine No is required'); return }
    setSaving(true)
    try {
      let res: { success?: boolean | number; message?: string }
      if (isEdit) {
        const payload: Record<string, unknown> = { uuid: spec.uuid, ...form, machine_type_id: machineTypeId }
        if (file) {
          const fd = new FormData()
          Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)))
          fd.append('file', file)
          res = await apiUpload('/specification/update', fd)
        } else {
          res = await apiCall('/specification/update', { payload })
        }
      } else {
        const fd = new FormData()
        Object.entries({ ...form, machine_type_id: machineTypeId }).forEach(([k, v]) => fd.append(k, String(v)))
        if (file) fd.append('file', file)
        res = await apiUpload('/specification/create', fd)
      }
      if (!res.success) { onError(res.message || 'Save failed'); onClose(); return }
      onSaved(res.message || (isEdit ? 'Specification updated' : 'Specification created'))
      onClose()
    } catch { onError('Failed to save specification'); onClose() }
    finally { setSaving(false) }
  }

  return (
    <Modal title={isEdit ? 'Edit Specification' : 'Add Machine Specification'} onClose={onClose} size="lg" footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" form="spec-form" isLoading={saving}>
          {isEdit ? 'Update' : 'Add Specification'}
        </Button>
      </>
    }>
      <form id="spec-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <FormInput label="Machine No" value={form.machine_no} onChange={e => { set('machine_no', e.target.value); setFieldError('') }} placeholder="e.g. MA006" required error={fieldError} touched={!!fieldError} />
          <FormInput label="Brand" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Dream Stich" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormInput label="Model No" value={form.model_no} onChange={e => set('model_no', e.target.value)} placeholder="e.g. 2020LL1" />
          <FormSelect
            label="Condition"
            value={form.condition}
            onChange={e => set('condition', e.target.value)}
            options={CONDITION_OPTIONS}
            placeholder="Select condition"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormInput label="Serial No" value={form.serial_no} onChange={e => set('serial_no', e.target.value)} placeholder="e.g. SN006" />
          <FormInput label="Warranty (years)" type="number" value={form.warranty} onChange={e => set('warranty', e.target.value)} placeholder="e.g. 2" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <FormInput label="Purchase Date" type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} />
          <FormInput label="Last Oil Change" type="date" value={form.last_oil_change} onChange={e => set('last_oil_change', e.target.value)} />
          <FormInput label="Next Maintenance" type="date" value={form.next_maintenance} onChange={e => set('next_maintenance', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormSelect
            label="Branch"
            value={form.branch_id}
            onChange={e => set('branch_id', e.target.value)}
            options={branches.map(b => ({ value: b.id, label: b.branch_name }))}
            placeholder="Select branch"
          />
          <FormInput label="QR Code" value={form.qr_code} onChange={e => set('qr_code', e.target.value)} placeholder="e.g. 56" />
        </div>

        {/* File upload */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-t-body">Attachment (PDF / Image)</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 h-input-h px-2.5 border border-dashed border-input-line rounded-input cursor-pointer hover:border-accent transition-colors"
          >
            <Upload size={13} className="text-t-lighter" />
            <span className="text-sm2 text-t-lighter">{file ? file.name : 'Click to upload file'}</span>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </div>
      </form>
    </Modal>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function MachineHubPage() {
  const [types, setTypes] = useState<MachineType[]>([])
  const [typesLoading, setTypesLoading] = useState(true)
  const [searchType, setSearchType] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [subTab, setSubTab] = useState<'Machine Specification' | 'Operation Master'>('Machine Specification')

  const [specs, setSpecs] = useState<MachineSpec[]>([])
  const [specsLoading, setSpecsLoading] = useState(false)

  const [showAddType, setShowAddType] = useState(false)
  const [editTypeItem, setEditTypeItem] = useState<MachineType | null>(null)
  const [showSpecModal, setShowSpecModal] = useState(false)
  const [editSpec, setEditSpec] = useState<MachineSpec | null>(null)
  const [deleteSpec, setDeleteSpec] = useState<MachineSpec | null>(null)
  const [deletingSpec, setDeletingSpec] = useState(false)

  const [deleteType, setDeleteType] = useState<MachineType | null>(null)
  const [deletingType, setDeletingType] = useState(false)

  const [toast, setToast] = useState<ToastData | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })

  // ── Load machine types ──
  const fetchTypes = useCallback(async () => {
    setTypesLoading(true)
    try {
      const res = await apiCall<{ success?: boolean | number; message?: string; data?: { stitch_types?: MachineType[] } }>(
        '/machine/list',
        { method: 'GET', encrypt: false, payload: { page: '1', per_page: '100', search: searchType, status: 'all', machine_type: '' } }
      )
      if (!res.success) {
        setToast({ message: res.message || 'Failed to load machine types', type: 'error' })
        setTypes([])
        return
      }
      const list = res.data?.stitch_types ?? []
      setTypes(list)
      if (list.length > 0 && selectedId === null) setSelectedId(list[0].id)
    } catch { setToast({ message: 'Failed to load machine types', type: 'error' }); setTypes([]) }
    finally { setTypesLoading(false) }
  }, [searchType, selectedId])

  useEffect(() => { fetchTypes() }, [fetchTypes])

  // ── Load specs for selected machine type ──
  const fetchSpecs = useCallback(async () => {
    if (!selectedId) return
    setSpecsLoading(true)
    try {
      const res = await apiCall<{ success?: boolean | number; message?: string; data?: MachineSpec[] }>(
        '/machine/machinespecificationlist',
        { method: 'GET', encrypt: false, payload: { machine_id: String(selectedId) } }
      )
      if (!res.success) {
        setToast({ message: res.message || 'Failed to load specifications', type: 'error' })
        setSpecs([])
        return
      }
      setSpecs(Array.isArray(res.data) ? res.data : [])
    } catch { setToast({ message: 'Failed to load specifications', type: 'error' }); setSpecs([]) }
    finally { setSpecsLoading(false) }
  }, [selectedId])

  useEffect(() => {
    if (subTab === 'Machine Specification') fetchSpecs()
  }, [fetchSpecs, subTab])

  const handleDeleteSpec = async () => {
    if (!deleteSpec) return
    setDeletingSpec(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/specification/delete', { payload: { uuid: deleteSpec.uuid } })
      if (!res.success) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Specification deleted', type: 'success' })
      setDeleteSpec(null)
      fetchSpecs()
    } catch { setToast({ message: 'Failed to delete', type: 'error' }) }
    finally { setDeletingSpec(false) }
  }

  const handleDeleteType = async () => {
    if (!deleteType) return
    setDeletingType(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/machine/delete', { payload: { uuid: deleteType.uuid } })
      if (!res.success) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Machine type deleted', type: 'success' })
      setDeleteType(null)
      setSelectedId(null)
      fetchTypes()
    } catch { setToast({ message: 'Failed to delete', type: 'error' }) }
    finally { setDeletingType(false) }
  }

  const openSpecMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setOpenMenuId(id)
  }

  const selected = types.find(t => t.id === selectedId)
  const filteredTypes = types.filter(t =>
    t.type_name?.toLowerCase().includes(searchType.toLowerCase())
  )

  return (
    <AppLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {(showAddType || editTypeItem) && (
        <MachineTypeModal
          editType={editTypeItem}
          onClose={() => { setShowAddType(false); setEditTypeItem(null) }}
          onSaved={msg => { setToast({ message: msg, type: 'success' }); fetchTypes() }}
          onError={msg => setToast({ message: msg, type: 'error' })}
        />
      )}

      {showSpecModal && selectedId && (
        <SpecModal
          spec={editSpec}
          machineTypeId={selectedId}
          onClose={() => { setShowSpecModal(false); setEditSpec(null) }}
          onSaved={msg => { setToast({ message: msg, type: 'success' }); fetchSpecs() }}
          onError={msg => setToast({ message: msg, type: 'error' })}
        />
      )}

      {deleteSpec && (
        <ConfirmDialog
          title="Delete Specification"
          message={<>Delete specification <strong>{deleteSpec.machine_no}</strong>?</>}
          confirmLabel="Delete" variant="danger"
          onConfirm={handleDeleteSpec}
          onClose={() => setDeleteSpec(null)}
          loading={deletingSpec}
        />
      )}

      {deleteType && (
        <ConfirmDialog
          title="Delete Machine Type"
          message={<>Delete machine type <strong>{deleteType.type_name}</strong>?</>}
          confirmLabel="Delete" variant="danger"
          onConfirm={handleDeleteType}
          onClose={() => setDeleteType(null)}
          loading={deletingType}
        />
      )}

      <PageHeader title="Machine Hub" description="Manage machine types and their specifications.">
        <div className="flex gap-2 items-center">
          <button className="h-8 px-3 flex items-center gap-1.5 bg-card border border-input-line rounded-input cursor-pointer text-sm2 text-t-body font-inherit hover:bg-table-head">
            <Download size={13} /> Export
          </button>
          <button className="h-8 px-3 flex items-center gap-1.5 bg-card border border-input-line rounded-input cursor-pointer text-sm2 text-t-body font-inherit hover:bg-table-head">
            <Upload size={13} /> Import
          </button>
          <button
            onClick={() => setShowAddType(true)}
            className="h-8 px-3.5 flex items-center gap-1.5 bg-accent hover:bg-accent-hover border-none rounded-input cursor-pointer text-sm2 text-white font-semibold font-inherit"
          >
            <Plus size={13} /> Add Machine Type
          </button>
        </div>
      </PageHeader>

      {/* Body */}
      <div className="flex gap-0 h-[calc(100vh-220px)] min-h-[400px]">

        {/* Left: machine type list */}
        <div className="w-[220px] shrink-0 bg-card rounded-l-lg border border-header-line flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-table-line shrink-0">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-t-lighter" />
              <input
                placeholder="Search type"
                value={searchType}
                onChange={e => setSearchType(e.target.value)}
                className="w-full h-[30px] pl-[26px] pr-2 text-xs font-inherit text-t-secondary bg-table-head border border-header-line rounded-input outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {typesLoading ? (
              <div className="flex flex-col gap-0">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="px-3.5 py-3 border-b border-table-line">
                    <div className="h-3 w-24 bg-table-head rounded animate-pulse mb-1.5" />
                    <div className="h-2.5 w-16 bg-table-head rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : filteredTypes.length === 0 ? (
              <p className="text-xs text-t-lighter text-center py-6">No machine types found</p>
            ) : (
              filteredTypes.map(t => (
                <div
                  key={t.id}
                  onClick={() => { setSelectedId(t.id); setSpecs([]) }}
                  className={`px-3.5 py-2.5 cursor-pointer border-b border-table-line flex justify-between items-center
                    ${selectedId === t.id ? 'bg-accent/5' : 'bg-card hover:bg-card-alt'}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`m-0 mb-0.5 text-sm truncate ${selectedId === t.id ? 'font-semibold text-accent' : 'font-medium text-t-secondary'}`}>
                      {t.type_name}
                    </p>
                    {(t.needle || t.name) && (
                      <p className="m-0 text-xs2 text-t-lighter truncate">
                        {[t.needle, t.name].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <Badge variant={t.is_active === 1 ? 'success' : 'default'} className="shrink-0 ml-1 text-xs2">
                    {t.is_active === 1 ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="flex-1 min-w-0 border border-header-line border-l-0 rounded-r-lg bg-card flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-t-lighter text-sm">
              {typesLoading ? 'Loading...' : 'Select a machine type'}
            </div>
          ) : (
            <>
              {/* Type header */}
              <div className="px-4 py-3.5 border-b border-table-line shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="m-0 text-sm font-bold text-t-primary">{selected.type_name}</p>
                      {selected.needle && (
                        <span className="text-2xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">{selected.needle}</span>
                      )}
                      <Badge variant={selected.is_active === 1 ? 'success' : 'default'}>
                        {selected.is_active === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {selected.notes && <p className="m-0 text-xs text-t-lighter">{selected.notes}</p>}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setEditTypeItem(selected)}
                      className="h-[30px] px-3 flex items-center gap-1 bg-card border border-input-line rounded-input cursor-pointer text-xs text-t-body font-inherit hover:bg-table-head"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteType(selected)}
                      className="h-[30px] px-3 flex items-center gap-1 bg-card border border-red-300 rounded-input cursor-pointer text-xs text-red-500 font-inherit hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center justify-between px-4 border-b border-table-line shrink-0">
                <div className="flex gap-0">
                  {(['Machine Specification', 'Operation Master'] as const).map(tab => (
                    <button key={tab} onClick={() => setSubTab(tab)}
                      className={`px-3.5 py-2.5 border-none bg-transparent cursor-pointer text-sm2 font-inherit whitespace-nowrap -mb-px
                        ${subTab === tab ? 'font-semibold text-accent border-b-2 border-b-accent' : 'font-normal text-t-light border-b-2 border-b-transparent'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
                {subTab === 'Machine Specification' && (
                  <button
                    onClick={() => { setEditSpec(null); setShowSpecModal(true) }}
                    className="h-7 px-3 flex items-center gap-1 bg-accent hover:bg-accent-hover border-none rounded-input cursor-pointer text-xs text-white font-semibold font-inherit"
                  >
                    <Plus size={12} /> Add New
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {subTab === 'Machine Specification' ? (
                  specsLoading ? (
                    <div className="p-6 text-center text-t-lighter text-sm">Loading...</div>
                  ) : specs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-t-lighter text-sm">
                      No machines registered for this type yet
                    </div>
                  ) : (
                    <table className="w-full border-collapse text-sm2">
                      <thead>
                        <tr className="bg-table-head">
                          {['Machine No', 'Brand', 'Model No', 'Serial No', 'Condition', 'Next Maint.', 'Branch', 'Status', ''].map((h, i) => (
                            <th key={i} className="px-3.5 py-2.5 text-left font-semibold text-xs text-t-light border-b border-header-line whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {specs.map((spec, i) => (
                          <tr key={spec.uuid} className={`border-b border-table-line ${i % 2 === 0 ? 'bg-card' : 'bg-card-alt'}`}>
                            <td className="px-3.5 py-2.5 text-accent font-semibold">{spec.machine_no}</td>
                            <td className="px-3.5 py-2.5 text-t-body">{spec.brand || '—'}</td>
                            <td className="px-3.5 py-2.5 text-t-body font-mono text-xs">{spec.model_no || '—'}</td>
                            <td className="px-3.5 py-2.5 text-t-body font-mono text-xs">{spec.serial_no || '—'}</td>
                            <td className="px-3.5 py-2.5 text-t-body">{spec.conditionInfo?.value ?? conditionLabel(String(spec.condition))}</td>
                            <td className="px-3.5 py-2.5 text-t-body text-xs">{spec.next_maintenance ?? '—'}</td>
                            <td className="px-3.5 py-2.5 text-t-body text-xs">{spec.branch?.branch_name ?? '—'}</td>
                            <td className="px-3.5 py-2.5">
                              <Badge variant={spec.is_active === 1 ? 'success' : 'default'}>
                                {spec.is_active === 1 ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="px-3.5 py-2.5">
                              <div className="flex items-center gap-1">
                                <button className="p-1 text-t-lighter hover:text-t-light" title="QR Code"><QrCode size={13} /></button>
                                <button className="p-1 text-accent hover:text-accent-hover" title="View"><ArrowRight size={13} /></button>
                                <button
                                  onClick={e => openSpecMenu(e, spec.id)}
                                  className="p-1 text-t-lighter hover:text-t-body"
                                >
                                  <MoreVertical size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-t-lighter text-sm">
                    Operation Master — coming soon
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fixed ⋮ dropdown for spec rows */}
      {openMenuId !== null && (
        <>
          <div className="fixed inset-0 z-[9990]" onClick={() => setOpenMenuId(null)} />
          <div
            className="fixed z-[9991] bg-[var(--color-modal-bg)] border border-[var(--color-table-border)] rounded-card shadow-lg py-1 min-w-[130px]"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button
              onClick={() => {
                const s = specs.find(x => x.id === openMenuId)
                if (s) { setEditSpec(s); setShowSpecModal(true) }
                setOpenMenuId(null)
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-t-body hover:bg-[var(--color-table-row-alt-bg)] transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              onClick={() => {
                const s = specs.find(x => x.id === openMenuId)
                if (s) setDeleteSpec(s)
                setOpenMenuId(null)
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </>
      )}
    </AppLayout>
  )
}
