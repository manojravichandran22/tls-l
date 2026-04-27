'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import PageHeader from '@/components/ui/PageHeader'
import DataTable from '@/components/ui/DataTable'
import Toolbar from '@/components/ui/Toolbar'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Badge from '@/components/ui/Badge'
import Toast from '@/components/ui/Toast'
import { Pencil, Trash2, Plus, Minus, X, MoreVertical, Clock } from 'lucide-react'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import { validateField, validateAll, hasErrors, type ValidationRules } from '@/lib/validation'
import type { ToastData } from '@/components/ui/Toast'
import { useDropdownData } from '@/hooks/useDropdownData'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Cap {
  id?: number
  cap_name: string
  short_name: string
  notes: string
}

interface Defect {
  id: number
  uuid: string
  code: string
  defect_name: string
  category: string
  severity: string
  escalation_flag: number
  department_id: number | null
  is_active: number
  department?: { id: number; name: string }
  caps?: Cap[]
  caps_count?: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function severityBadge(severity: string) {
  const s = severity?.toLowerCase()
  if (s === 'critical') return <Badge variant="error">Critical</Badge>
  if (s === 'major') return <Badge variant="warning">Major</Badge>
  return <Badge variant="success">Minor</Badge>
}

// ── Add/Edit Modal ─────────────────────────────────────────────────────────────
type FormField = 'defect_name' | 'category' | 'severity'
type FormErrors = Partial<Record<FormField | 'department_id', string>>
type Touched = Partial<Record<FormField | 'department_id', boolean>>

const rules: ValidationRules<FormField> = {
  defect_name: { required: 'Defect name is required', minLength: { value: 2, message: 'Minimum 2 characters' } },
  category: { required: 'Category is required' },
  severity: { required: 'Severity is required' },
}

interface DefectForm {
  defect_name: string
  category: string
  severity: string
  escalation_flag: boolean
  department_id: string
  caps: Cap[]
}

function DefectModal({ defect, departments, onClose, onSaved }: {
  defect: Defect | null
  departments: { id: number; name: string }[]
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const isEdit = !!defect

  const [form, setForm] = useState<DefectForm>({
    defect_name: defect?.defect_name ?? '',
    category: defect?.category ?? '',
    severity: defect?.severity ?? '',
    escalation_flag: (defect?.escalation_flag ?? 0) === 1,
    department_id: defect?.department_id?.toString() ?? '',
    caps: defect?.caps?.length ? defect.caps.map(c => ({ cap_name: c.cap_name, short_name: c.short_name ?? '', notes: c.notes ?? '' })) : [{ cap_name: '', short_name: '', notes: '' }],
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})

  const setField = (key: keyof DefectForm, val: string | boolean) => {
    setForm(f => ({ ...f, [key]: val }))
    if (key === 'escalation_flag') {
      setForm(f => ({ ...f, escalation_flag: val as boolean, department_id: val ? f.department_id : '' }))
      return
    }
    if (key in rules && touched[key as FormField]) {
      setErrors(e => ({ ...e, [key]: validateField(val as string, rules[key as FormField]) }))
    }
  }

  const handleBlur = (key: FormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    setErrors(e => ({ ...e, [key]: validateField(form[key], rules[key]) }))
  }

  const addCap = () => setForm(f => ({ ...f, caps: [...f.caps, { cap_name: '', short_name: '', notes: '' }] }))
  const removeCap = (i: number) => setForm(f => ({ ...f, caps: f.caps.filter((_, idx) => idx !== i) }))
  const setCap = (i: number, field: keyof Cap, val: string) =>
    setForm(f => ({ ...f, caps: f.caps.map((c, idx) => idx === i ? { ...c, [field]: val } : c) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: Touched = { defect_name: true, category: true, severity: true }
    setTouched(allTouched)

    const allErrors = validateAll({ defect_name: form.defect_name, category: form.category, severity: form.severity }, rules)
    setErrors(allErrors as FormErrors)
    if (hasErrors(allErrors)) return

    const capsInvalid = form.caps.some(c => !c.cap_name.trim())
    if (capsInvalid) { setErrors(e => ({ ...e, defect_name: 'All CAP name fields are required' })); return }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        defect_name: form.defect_name,
        category: form.category,
        severity: form.severity,
        escalation_flag: form.escalation_flag ? 1 : 0,
        department_id: form.escalation_flag ? form.department_id : '',
        caps: form.caps.map(c => ({ cap_name: c.cap_name, short_name: c.short_name, notes: c.notes })),
      }
      let res: { success?: boolean; message?: string }
      if (isEdit) {
        payload.uuid = defect.uuid
        res = await apiCall('/defect/update', { payload })
      } else {
        res = await apiCall('/defect/create', { payload })
      }
      if (res.success === false) { setErrors({ defect_name: res.message || 'Save failed' }); return }
      onSaved(res.message || (isEdit ? 'Defect updated' : 'Defect created'))
      onClose()
    } catch {
      setErrors({ defect_name: 'Failed to save defect. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Defect' : 'Add Defect'} onClose={onClose} size="sm" footer={
      <>
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" form="defect-form" isLoading={saving}>
          {isEdit ? 'Update Defect' : 'Add Defect'}
        </Button>
      </>
    }>
      <form id="defect-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormInput
          label="Defect Name"
          value={form.defect_name}
          onChange={e => setField('defect_name', e.target.value)}
          onBlur={() => handleBlur('defect_name')}
          placeholder="e.g. Machine Oil Stain"
          error={errors.defect_name}
          touched={touched.defect_name}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Category"
            value={form.category}
            onChange={e => setField('category', e.target.value)}
            onBlur={() => handleBlur('category')}
            placeholder="e.g. Stitch"
            error={errors.category}
            touched={touched.category}
            required
          />
          <FormInput
            label="Severity"
            value={form.severity}
            onChange={e => setField('severity', e.target.value)}
            onBlur={() => handleBlur('severity')}
            placeholder="e.g. Minor"
            error={errors.severity}
            touched={touched.severity}
            required
          />
        </div>

        {/* Escalation toggle */}
        <div className="flex items-center justify-between py-1">
          <label className="text-xs font-medium text-t-body">Escalation</label>
          <button
            type="button"
            onClick={() => setField('escalation_flag', !form.escalation_flag)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
              ${form.escalation_flag ? 'bg-accent' : 'bg-[var(--color-table-border)]'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
              ${form.escalation_flag ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Department — only when escalation is ON */}
        {form.escalation_flag && (
          <FormSelect
            label="Department"
            value={form.department_id}
            onChange={e => {
              setField('department_id', e.target.value)
              setTouched(t => ({ ...t, department_id: true }))
              setErrors(er => ({ ...er, department_id: e.target.value ? '' : 'Department is required' }))
            }}
            onBlur={() => {
              setTouched(t => ({ ...t, department_id: true }))
              setErrors(er => ({ ...er, department_id: form.department_id ? '' : 'Department is required' }))
            }}
            options={departments.map(d => ({ value: d.id, label: d.name }))}
            placeholder="Select department"
            error={errors.department_id}
            touched={touched.department_id}
          />
        )}

        {/* CAP section */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-medium text-t-body">Corrective Action Plan (CAP)</label>
          {form.caps.map((cap, i) => (
            <div key={i} className="flex flex-col gap-2 p-3 rounded-card border border-[var(--color-table-border)] bg-[var(--color-table-row-alt-bg)] relative">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-accent">CAP-{i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeCap(i)}
                  disabled={form.caps.length === 1}
                  className="w-6 h-6 flex items-center justify-center rounded-full border border-[var(--color-table-border)] text-t-lighter hover:text-red-500 hover:border-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-t-lighter disabled:hover:border-[var(--color-table-border)]">
                  <Minus size={11} />
                </button>
              </div>
              <FormInput
                label="CAP Name"
                value={cap.cap_name}
                onChange={e => setCap(i, 'cap_name', e.target.value)}
                placeholder="e.g. Clean the Machine"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <FormInput
                  label="Short Name"
                  value={cap.short_name}
                  onChange={e => setCap(i, 'short_name', e.target.value)}
                  placeholder="e.g. Cap"
                />
                <FormInput
                  label="Notes"
                  value={cap.notes}
                  onChange={e => setCap(i, 'notes', e.target.value)}
                  placeholder="Optional notes"
                />
              </div>
            </div>
          ))}
          <button type="button" onClick={addCap}
            className="flex items-center gap-1.5 text-xs text-accent hover:underline w-fit">
            <Plus size={13} /> Add More CAP
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── View Panel (right side drawer) ────────────────────────────────────────────
function DefectViewPanel({ defect, loading, onClose, onAddCap }: {
  defect: Record<string, unknown> | null
  loading: boolean
  onClose: () => void
  onAddCap: (defectId: number, cap: { cap_name: string; short_name: string; notes: string }) => Promise<void>
}) {
  const [addingCap, setAddingCap] = useState(false)
  const [newCap, setNewCap] = useState({ cap_name: '', short_name: '', notes: '' })
  const [capSaving, setCapSaving] = useState(false)

  if (!defect && !loading) return null

  const caps = (defect?.caps as Cap[] | undefined) ?? []
  const department = (defect?.department as Record<string, unknown> | undefined)

  const handleAddCap = async () => {
    if (!newCap.cap_name.trim()) return
    setCapSaving(true)
    await onAddCap(defect!.id as number, newCap)
    setNewCap({ cap_name: '', short_name: '', notes: '' })
    setAddingCap(false)
    setCapSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[9997] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-[1] bg-[var(--color-modal-bg)] w-full max-w-[500px] h-full flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex-1 min-w-0">
            {loading || !defect ? (
              <div className="h-5 w-48 bg-[var(--color-table-border)] rounded animate-pulse" />
            ) : (
              <>
                <h2 className="text-base font-bold text-t-primary leading-snug">
                  {String(defect.code ?? '')} | {String(defect.defect_name ?? '')}
                </h2>
                {defect.description && (
                  <p className="text-xs text-t-lighter mt-1.5 leading-relaxed">{String(defect.description)}</p>
                )}
              </>
            )}
          </div>
          <button onClick={onClose} className="ml-3 mt-0.5 p-1 text-t-lighter hover:text-t-body transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Meta chips */}
        {!loading && defect && (
          <div className="flex items-center gap-3 px-6 pb-4 shrink-0">
            {!!defect.category && <span className="text-sm text-t-body">{String(defect.category)}</span>}
            {!!department?.name && <span className="text-sm text-t-body">{String(department.name)}</span>}
            {severityBadge(String(defect.severity ?? ''))}
          </div>
        )}

        <div className="h-px bg-[var(--color-table-border)] mx-6 shrink-0" />

        {/* CAP section */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map(n => <div key={n} className="h-10 bg-[var(--color-table-border)] rounded animate-pulse" />)}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-t-primary">
                  Corrective Action Plans ({caps.length})
                </h3>
                <button
                  onClick={() => setAddingCap(v => !v)}
                  className="flex items-center gap-1 text-xs font-medium text-accent border border-accent/40 rounded px-2.5 py-1 hover:bg-accent/5 transition-colors"
                >
                  <Plus size={12} /> Add CAP
                </button>
              </div>

              {addingCap && (
                <div className="flex flex-col gap-2 mb-4 p-3 rounded-card border border-[var(--color-table-border)] bg-[var(--color-table-row-alt-bg)]">
                  <FormInput
                    label="CAP Name"
                    value={newCap.cap_name}
                    onChange={e => setNewCap(v => ({ ...v, cap_name: e.target.value }))}
                    placeholder="e.g. Adjust needle position"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <FormInput
                      label="Short Name"
                      value={newCap.short_name}
                      onChange={e => setNewCap(v => ({ ...v, short_name: e.target.value }))}
                      placeholder="e.g. Cap name short"
                    />
                    <FormInput
                      label="Notes"
                      value={newCap.notes}
                      onChange={e => setNewCap(v => ({ ...v, notes: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <Button variant="outline" onClick={() => { setAddingCap(false); setNewCap({ cap_name: '', short_name: '', notes: '' }) }}>Cancel</Button>
                    <Button variant="primary" onClick={handleAddCap} isLoading={capSaving}>Save CAP</Button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {caps.length === 0 && (
                  <p className="text-xs text-t-lighter py-6 text-center">No corrective action plans added.</p>
                )}
                {caps.map((cap, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 rounded-card border border-[var(--color-table-border)] bg-[var(--color-table-row-bg)]">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-accent shrink-0">CAP-{i + 1}</span>
                      <span className="text-sm text-t-body truncate">{cap.cap_name}</span>
                    </div>
                    <button className="text-t-lighter hover:text-t-body p-1 shrink-0"><MoreVertical size={14} /></button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function DefectMasterPage() {
  const [defects, setDefects] = useState<Defect[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [showModal, setShowModal] = useState(false)
  const [editDefect, setEditDefect] = useState<Defect | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Defect | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewDefect, setViewDefect] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  const { departments } = useDropdownData({ departments: true })

  const fetchDefects = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{ data?: { defects?: Defect[]; pagination?: { total: number; total_pages: number } } }>(
        '/defect/list',
        { method: 'GET', encrypt: false, payload: { page: String(page), per_page: String(perPage), search, status: 'all' } }
      )
      setDefects(res.data?.defects ?? [])
      setTotalCount(res.data?.pagination?.total ?? 0)
      setTotalPages(res.data?.pagination?.total_pages ?? 1)
    } catch { setDefects([]) }
    finally { setLoading(false) }
  }, [page, perPage, search])

  useEffect(() => { fetchDefects() }, [fetchDefects])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/defect/delete', { payload: { uuid: deleteTarget.uuid } })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Defect deleted', type: 'success' })
      setDeleteTarget(null)
      fetchDefects()
    } catch { setToast({ message: 'Failed to delete defect', type: 'error' }) }
    finally { setDeleting(false) }
  }

  const handleView = async (uuid: string) => {
    setViewLoading(true)
    setViewDefect({})
    try {
      const res = await apiCall<{ data?: Record<string, unknown> }>('/defect/show', { method: 'GET', encrypt: false, payload: { uuid } })
      setViewDefect(res.data ?? res)
    } catch { setViewDefect(null) }
    finally { setViewLoading(false) }
  }

  const handleAddCap = async (defectId: number, cap: { cap_name: string; short_name: string; notes: string }) => {
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>(
        '/defect/capmap',
        { payload: { defect_id: String(defectId), cap_name: cap.cap_name, short_name: cap.short_name || cap.cap_name.slice(0, 10), notes: cap.notes } }
      )
      if (res.success !== false) {
        setViewDefect(v => v ? { ...v, caps: [...((v.caps as Cap[]) ?? []), cap] } : v)
      }
      setToast({ message: res.message || 'CAP added', type: 'success' })
    } catch { setToast({ message: 'Failed to add CAP', type: 'error' }) }
  }

  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setOpenMenuId(id)
  }

  const columns = [
    {
      key: '#', header: '#',
      render: (_: Defect, i: number) => <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>,
    },
    {
      key: 'code', header: 'Defect Code',
      render: (row: Defect) => <span className="font-mono text-xs font-semibold text-t-body">{row.code || '—'}</span>,
    },
    {
      key: 'category', header: 'Category',
      render: (row: Defect) => <span className="text-t-body text-xs">{row.category}</span>,
    },
    {
      key: 'defect_name', header: 'Defect Name',
      render: (row: Defect) => <span className="text-accent font-semibold">{row.defect_name}</span>,
    },
    {
      key: 'caps', header: 'CAP',
      render: (row: Defect) => (
        <span className="flex items-center gap-1 text-xs text-t-lighter">
          <Clock size={12} />{row.caps_count ?? row.caps?.length ?? 0}
        </span>
      ),
    },
    {
      key: 'severity', header: 'Severity',
      render: (row: Defect) => severityBadge(row.severity),
    },
    {
      key: 'department', header: 'Designation',
      render: (row: Defect) => <span className="text-t-body text-xs">{row.department?.name ?? '—'}</span>,
    },
    {
      key: 'view', header: '',
      render: (row: Defect) => (
        <button
          onClick={() => handleView(row.uuid)}
          className="w-7 h-7 flex items-center justify-center rounded border border-[var(--color-table-border)] text-t-lighter hover:text-accent hover:border-accent transition-colors"
          title="View CAPs"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      ),
    },
    {
      key: 'actions', header: '',
      render: (row: Defect) => (
        <button
          onClick={e => openMenu(e, row.id)}
          className="w-7 h-7 flex items-center justify-center rounded text-t-lighter hover:text-t-body hover:bg-[var(--color-table-row-alt-bg)] transition-colors"
        >
          <MoreVertical size={14} />
        </button>
      ),
    },
  ]

  return (
    <AppLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showModal && (
        <DefectModal
          defect={editDefect}
          departments={departments}
          onClose={() => setShowModal(false)}
          onSaved={msg => { setToast({ message: msg, type: 'success' }); fetchDefects() }}
        />
      )}

      {(viewDefect !== null) && (
        <DefectViewPanel
          defect={viewLoading ? null : viewDefect}
          loading={viewLoading}
          onClose={() => setViewDefect(null)}
          onAddCap={handleAddCap}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Defect"
          message={<>Are you sure you want to delete <strong>{deleteTarget.defect_name}</strong>?</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader title="Defect Master" description="Master list of defect types with severity classification and department ownership." />

      <Toolbar
        title="All Defects"
        search={search}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onAdd={() => { setEditDefect(null); setShowModal(true) }}
        addLabel="Add Defect"
      />

      <DataTable
        columns={columns}
        data={defects}
        loading={loading}
        emptyMessage="No defects found"
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        countLabel="defect"
      />

      {/* Fixed-position ⋮ dropdown — escapes overflow:hidden */}
      {openMenuId !== null && (
        <>
          <div className="fixed inset-0 z-[9990]" onClick={() => setOpenMenuId(null)} />
          <div
            className="fixed z-[9991] bg-[var(--color-modal-bg)] border border-[var(--color-table-border)] rounded-card shadow-lg py-1 min-w-[130px]"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button
              onClick={() => {
                const row = defects.find(d => d.id === openMenuId)
                if (row) { setEditDefect(row); setShowModal(true) }
                setOpenMenuId(null)
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-t-body hover:bg-[var(--color-table-row-alt-bg)] transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              onClick={() => {
                const row = defects.find(d => d.id === openMenuId)
                if (row) setDeleteTarget(row)
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
