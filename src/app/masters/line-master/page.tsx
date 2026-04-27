'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import Toast, { type ToastData } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import Toolbar from '@/components/ui/Toolbar'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'
import { validateField, validateAll, hasErrors, type ValidationRules } from '@/lib/validation'

// ── Types ────────────────────────────────────────────
interface Slot {
  id?: number
  slot_name: string
  start: string
  end: string
}

interface Line {
  id: number
  uuid: string
  zone_id: number
  branch_id: number
  line_name: string
  status: number
  slots: Slot[]
  zone?: {
    id: number
    zone_name: string
    zone_code: string
    company_id: number
    company?: { id: number; company_name: string; company_code: string }
    branch?: { id: number; branch_name: string; branch_code: string }
  }
  branch?: { id: number; branch_name: string; branch_code: string }
}

interface CompanyOption { id: number; company_name: string; max_slot?: number }
interface BranchOption { id: number; company_id: number; branch_name: string }
interface ZoneOption { id: number; company_id: number; branch_id: number; zone_name: string }

interface FormSlot {
  slot_name: string
  start_time: string
  end_time: string
}

interface FormErrors {
  company_id?: string
  branch_id?: string
  zone_id?: string
  line_name?: string
  slots?: string
}

type FormField = 'company_id' | 'branch_id' | 'zone_id' | 'line_name'
type Touched = Partial<Record<FormField, boolean>>

const formRules: ValidationRules<FormField> = {
  company_id: { required: 'Company is required' },
  branch_id: { required: 'Branch is required' },
  zone_id: { required: 'Zone is required' },
  line_name: {
    required: 'Line name is required',
    minLength: { value: 2, message: 'Minimum 2 characters' },
    maxLength: { value: 50, message: 'Maximum 50 characters' },
  },
}

// ── Add / Edit Modal ─────────────────────────────────
function LineModal({
  line, companies, allBranches, allZones, onClose, onSaved,
}: {
  line: Line | null
  companies: CompanyOption[]
  allBranches: BranchOption[]
  allZones: ZoneOption[]
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const isEdit = !!line
  const [companyId, setCompanyId] = useState(line?.zone?.company_id?.toString() ?? '')
  const [branchId, setBranchId] = useState(line?.branch_id?.toString() ?? '')
  const [zoneId, setZoneId] = useState(line?.zone_id?.toString() ?? '')
  const [lineName, setLineName] = useState(line?.line_name ?? '')
  const [slots, setSlots] = useState<FormSlot[]>(
    line?.slots?.map(s => ({
      slot_name: s.slot_name,
      start_time: s.start?.slice(0, 5) || '',
      end_time: s.end?.slice(0, 5) || '',
    })) ?? [{ slot_name: '', start_time: '', end_time: '' }]
  )
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})

  const filteredBranches = allBranches.filter(b => b.company_id === parseInt(companyId))
  const filteredZones = allZones.filter(z =>
    z.company_id === parseInt(companyId) && z.branch_id === parseInt(branchId)
  )

  const handleBlur = (key: FormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    const val = key === 'company_id' ? companyId : key === 'branch_id' ? branchId : key === 'zone_id' ? zoneId : lineName
    setErrors(e => ({ ...e, [key]: validateField(val, formRules[key]) }))
  }

  const handleCompanyChange = (val: string) => {
    setCompanyId(val)
    setBranchId('')
    setZoneId('')
    setTouched(t => ({ ...t, company_id: true }))
    setErrors(e => ({ ...e, company_id: validateField(val, formRules.company_id) }))

    // Auto-generate slots based on company max_slot
    const company = companies.find(c => c.id === parseInt(val))
    const slotCount = company?.max_slot ?? 1
    setSlots(
      Array.from({ length: slotCount }, (_, i) => ({
        slot_name: `Slot ${i + 1}`,
        start_time: '',
        end_time: '',
      }))
    )
  }

  const handleBranchChange = (val: string) => {
    setBranchId(val)
    setZoneId('')
    setTouched(t => ({ ...t, branch_id: true }))
    setErrors(e => ({ ...e, branch_id: validateField(val, formRules.branch_id) }))
  }
  const updateSlot = (i: number, key: keyof FormSlot, val: string) =>
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const allTouched: Touched = { company_id: true, branch_id: true, zone_id: true, line_name: true }
    setTouched(allTouched)
    const formData = { company_id: companyId, branch_id: branchId, zone_id: zoneId, line_name: lineName }
    const allErrors = validateAll(formData, formRules)
    // Also validate slots
    const validSlots = slots.filter(s => s.slot_name && s.start_time && s.end_time)
    if (validSlots.length === 0) allErrors.line_name = (allErrors.line_name ?? '') // keep existing
    const slotsError = validSlots.length === 0 ? 'At least one complete slot is required' : undefined
    setErrors({ ...allErrors, slots: slotsError } as any)
    if (hasErrors(allErrors) || slotsError) return

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        zone_id: zoneId,
        branch_id: branchId,
        line_name: lineName,
        slots: validSlots.map(s => ({ slot_name: s.slot_name, start_time: s.start_time, end_time: s.end_time })),
      }

      if (isEdit) {
        payload.uuid = line.uuid
        const res = await apiCall<{ success?: boolean; message?: string }>('/line/update', { payload })
        if (res.success === false) { setErrors({ line_name: res.message || 'Update failed' }); return }
        onSaved(res.message || 'Line updated successfully')
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/line/create', { payload })
        if (res.success === false) { setErrors({ line_name: res.message || 'Creation failed' }); return }
        onSaved(res.message || 'Line created successfully')
      }
      onClose()
    } catch {
      setErrors({ line_name: 'Failed to save line. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Line' : 'Add Line'}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="line-form" isLoading={saving}>
            {isEdit ? 'Update Line' : 'Add Line'}
          </Button>
        </>
      }
    >
      <form id="line-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormSelect
          label="Company"
          value={companyId}
          onChange={e => handleCompanyChange(e.target.value)}
          onBlur={() => handleBlur('company_id')}
          touched={touched.company_id}
          options={companies.map(c => ({ value: c.id, label: c.company_name }))}
          placeholder="Select company"
          error={errors.company_id}
          required
        />

        <div className="grid grid-cols-2 gap-2.5">
          <FormSelect
            label="Branch"
            value={branchId}
            onChange={e => handleBranchChange(e.target.value)}
            onBlur={() => handleBlur('branch_id')}
            touched={touched.branch_id}
            options={filteredBranches.map(b => ({ value: b.id, label: b.branch_name }))}
            placeholder={companyId ? 'Select branch' : 'Select company first'}
            disabled={!companyId}
            error={errors.branch_id}
            required
          />
          <FormSelect
            label="Zone"
            value={zoneId}
            onChange={e => {
              const val = e.target.value
              setZoneId(val)
              setTouched(t => ({ ...t, zone_id: true }))
              setErrors(er => ({ ...er, zone_id: validateField(val, formRules.zone_id) }))
            }}
            onBlur={() => handleBlur('zone_id')}
            touched={touched.zone_id}
            options={filteredZones.map(z => ({ value: z.id, label: z.zone_name }))}
            placeholder={branchId ? 'Select zone' : 'Select branch first'}
            disabled={!branchId}
            error={errors.zone_id}
            required
          />
        </div>

        <FormInput
          label="Line Name"
          value={lineName}
          onChange={e => {
            setLineName(e.target.value)
            if (touched.line_name) {
              setErrors(er => ({ ...er, line_name: validateField(e.target.value, formRules.line_name) }))
            }
          }}
          onBlur={() => handleBlur('line_name')}
          touched={touched.line_name}
          placeholder="Enter line name"
          error={errors.line_name}
          required
        />

        {/* Audit Slot Timings */}
        {slots.length > 0 && (
        <div>
          <div className="mb-3">
            <span className="text-xs2 font-bold text-t-lighter tracking-wider uppercase">
              Audit Slot Timings
            </span>
          </div>
          {errors.slots && (
            <span className="text-xs2 text-red-500 mb-2 block">{errors.slots}</span>
          )}
          <div className="flex flex-col gap-3">
            {slots.map((slot, i) => (
              <div key={i}>
                <FormInput
                  label={`Slot ${i + 1} Name`}
                  placeholder="e.g. Morning"
                  value={slot.slot_name}
                  onChange={e => updateSlot(i, 'slot_name', e.target.value)}
                  className="mb-2"
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <FormInput
                    label="Start Time"
                    type="time"
                    value={slot.start_time}
                    onChange={e => updateSlot(i, 'start_time', e.target.value)}
                  />
                  <FormInput
                    label="End Time"
                    type="time"
                    value={slot.end_time}
                    onChange={e => updateSlot(i, 'end_time', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </form>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────
export default function LineMasterPage() {
  const [lines, setLines] = useState<Line[]>([])
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [allBranches, setAllBranches] = useState<BranchOption[]>([])
  const [allZones, setAllZones] = useState<ZoneOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [deleting, setDeleting] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const [showModal, setShowModal] = useState(false)
  const [editLine, setEditLine] = useState<Line | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Line | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  const handleView = async (uuid: string) => {
    setViewLoading(true)
    setViewData({})
    try {
      const res = await apiCall<{ data?: Record<string, unknown> }>('/line/show', { method: 'GET', encrypt: false, payload: { uuid } })
      setViewData(res.data ?? res)
    } catch {
      setViewData(null)
    } finally {
      setViewLoading(false)
    }
  }

  // Fetch dropdown data
  useEffect(() => {
    apiCall<{ data?: { companies?: CompanyOption[] } }>('/company/companyList', { method: 'GET', encrypt: false, payload: { page: '1', per_page: '100', search: '' } })
      .then(res => setCompanies(res.data?.companies ?? []))
      .catch(() => {})

    apiCall<{ data?: { branches?: BranchOption[] } }>('/branch/branchList', { method: 'GET', encrypt: false, payload: { page: '1', per_page: '100', search: '' } })
      .then(res => setAllBranches(res.data?.branches ?? []))
      .catch(() => {})

    apiCall<{ data?: { zones?: ZoneOption[] } }>('/zone/zoneList', { method: 'GET', encrypt: false, payload: { page: '1', per_page: '100', search: '' } })
      .then(res => setAllZones(res.data?.zones ?? []))
      .catch(() => {})
  }, [])

  const fetchLines = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{
        data?: {
          lines?: Line[]
          pagination?: { total: number; total_pages: number }
        }
      }>('/line/list', {
        method: 'GET', encrypt: false, payload: { search, page: String(page), per_page: String(perPage), line_name: '', zone_id: '', branch_id: '' },
      })

      const data = res.data
      setLines(data?.lines ?? [])
      setTotalCount(data?.pagination?.total ?? 0)
      setTotalPages(data?.pagination?.total_pages ?? 1)
    } catch {
      setLines([])
    } finally {
      setLoading(false)
    }
  }, [search, page, perPage])

  useEffect(() => {
    fetchLines()
  }, [fetchLines])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/line/delete', { payload: { uuid: deleteTarget.uuid } })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Line deleted successfully', type: 'success' })
      setDeleteTarget(null)
      fetchLines()
    } catch {
      setToast({ message: 'Failed to delete line', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const handleSaved = (msg: string) => {
    setToast({ message: msg, type: 'success' })
    fetchLines()
  }

  // Helpers
  const getSlots5 = (row: Line) => {
    const s = (row.slots ?? []).slice(0, 5)
    while (s.length < 5) s.push({ slot_name: `Slot-${s.length + 1}`, start: '', end: '' })
    return s
  }

  const formatTime = (t?: string) => {
    if (!t) return '—'
    const [h, m] = t.slice(0, 5).split(':')
    const hr = parseInt(h)
    const ampm = hr >= 12 ? 'PM' : 'AM'
    const h12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr
    return `${h12}:${m} ${ampm}`
  }

  const renderSlotCell = (slot: Slot) => (
    slot.start ? (
      <div className="text-xs2 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-stat-green"></span>
          <span className="text-t-body">S : {formatTime(slot.start)}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
          <span className="text-t-body">E : {formatTime(slot.end)}</span>
        </div>
      </div>
    ) : <span className="text-t-lighter">—</span>
  )

  const columns: AdvancedColumn<Line>[] = [
    {
      key: 'zone',
      header: 'Zone',
      sortable: true,
      render: (row) => <span className="text-t-body">{row.zone?.zone_name ?? '—'}</span>,
    },
    {
      key: 'line_name',
      header: 'Line',
      sortable: true,
      render: (row) => <span className="text-t-body font-medium">{row.line_name}</span>,
    },
    ...([1, 2, 3, 4, 5].map(n => ({
      key: `slot-${n}`,
      header: `Slot-${n}`,
      render: (row: Line) => {
        const slots5 = getSlots5(row)
        return renderSlotCell(slots5[n - 1])
      },
      className: `!py-2`,
    })) as AdvancedColumn<Line>[]),
  ]

  const getActions = (row: Line): ActionItem[] => [
    {
      label: 'View',
      icon: <Eye size={13} />,
      onClick: () => handleView(row.uuid),
    },
    {
      label: 'Edit',
      icon: <Pencil size={13} />,
      onClick: () => { setEditLine(row); setShowModal(true) },
    },
    {
      label: 'Delete',
      icon: <Trash2 size={13} />,
      onClick: () => setDeleteTarget(row),
      variant: 'danger',
    },
  ]

  return (
    <AppLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {viewData && (
        <ViewModal
          title="Line Details"
          loading={viewLoading}
          onClose={() => setViewData(null)}
          size="md"
          fields={[
            { label: 'Line Name', value: (viewData as Record<string, unknown>).line_name as string },
            { label: 'Zone', value: ((viewData as Record<string, unknown>).zone as Record<string, unknown>)?.zone_name as string ?? '—' },
            { label: 'Branch', value: ((viewData as Record<string, unknown>).branch as Record<string, unknown>)?.branch_name as string ?? '—' },
            { label: 'Company', value: (((viewData as Record<string, unknown>).zone as Record<string, unknown>)?.company as Record<string, unknown>)?.company_name as string ?? '—' },
            { label: 'Status', value: <Badge variant={(viewData as Record<string, unknown>).status === 1 ? 'success' : 'default'}>{(viewData as Record<string, unknown>).status === 1 ? 'Active' : 'Inactive'}</Badge> },
            { label: 'Slots', value: ((viewData as Record<string, unknown>).slots as Array<Record<string, unknown>>)?.map((s, i) => (
              <div key={i} className="text-xs2 mb-1">
                <span className="font-medium">{s.slot_name as string}:</span> {(s.start as string)?.slice(0, 5)} - {(s.end as string)?.slice(0, 5)}
              </div>
            )) ?? '—', fullWidth: true },
          ]}
        />
      )}

      {showModal && (
        <LineModal
          line={editLine}
          companies={companies}
          allBranches={allBranches}
          allZones={allZones}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Line"
          message={<>Are you sure you want to delete <strong>{deleteTarget.line_name}</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader title="TLS audit trimming master" description="Production line definitions with capacity and supervisor assignment." />

      <Toolbar
        title="All Lines"
        search={search}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onAdd={() => { setEditLine(null); setShowModal(true) }}
        addLabel="Add Line"
      />

      <AdvancedTable
        columns={columns}
        data={lines}
        loading={loading}
        emptyMessage="No lines found"
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
        countLabel="line"
      />
    </AppLayout>
  )
}
