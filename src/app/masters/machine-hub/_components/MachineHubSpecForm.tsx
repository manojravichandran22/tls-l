'use client'

import { useState, useEffect, useRef } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import { apiCall, apiUpload } from '@/services/apiClient'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { Upload } from 'lucide-react'
import type { MachineSpec } from './types'

interface Props {
  spec: MachineSpec | null
  machineTypeId: number
  maintenanceFlag?: number
  selectedBranchId?: string
  selectedBranchName?: string
  onClose: () => void
  onSaved: (msg: string) => void
  onError: (msg: string) => void
}

export default function MachineHubSpecForm({ spec, machineTypeId, maintenanceFlag = 1, selectedBranchId = '', selectedBranchName = '', onClose, onSaved, onError }: Props) {
  const isEdit = !!spec
  const { branchId: userBranchId, user } = useBranchAccess()
  const userBranchName: string = (user as any)?.branch_name ?? ''
  const { branches } = useDropdownData({ branches: true })
  const fileRef = useRef<HTMLInputElement>(null)

  // Determine effective branch: spec's branch (edit) → selected machine type's branch → user's branch
  const initBranchId =
    spec?.branch_id?.toString() ||
    selectedBranchId ||
    (userBranchId ? String(userBranchId) : '')

  const [form, setForm] = useState({
    machine_no: spec?.machine_no ?? '',
    brand: spec?.brand ?? '',
    model_no: spec?.model_no ?? '',
    condition: spec?.condition?.toString() ?? '',
    serial_no: spec?.serial_no ?? '',
    purchase_date: spec?.purchase_date ?? '',
    last_oil_change: spec?.last_oil_change ?? '',
    next_maintenance: spec?.next_maintenance ?? '',
    warranty: spec?.warranty?.toString() ?? '',
    branch_id: initBranchId,
    qr_code: spec?.qr_code?.toString() ?? '',
    process_audit: spec?.process_audit ?? 1,
  })

  // Sync branch_id when userBranchId becomes available (handles init timing)
  useEffect(() => {
    if (!form.branch_id && (selectedBranchId || userBranchId)) {
      setForm(f => ({ ...f, branch_id: selectedBranchId || String(userBranchId) }))
    }
  }, [userBranchId, selectedBranchId])
  const today = new Date().toISOString().split('T')[0]
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')
  const [conditionOptions, setConditionOptions] = useState<{ id: number; value: string }[]>([])

  useEffect(() => {
    const payload: Record<string, unknown> = { type: 'machine_condition' }
    if (userBranchId) payload.branch_id = String(userBranchId)
    apiCall<any>('/dropdown/options-dropdown', {
      method: 'GET',
      encrypt: false,
      payload,
    })
      .then(res => {
        const records = res?.data?.records?.machine_condition ?? []
        setConditionOptions(Array.isArray(records) ? records : [])
      })
      .catch(() => setConditionOptions([]))
  }, [userBranchId])

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setFormError('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.machine_no.trim()) {
      setFieldError('Machine No is required')
      return
    }
    setSaving(true)
    setFormError('')
    // Validate date fields (prevent future dates)
    const todayDate = new Date().toISOString().split('T')[0]
    const dateFields = [
      { key: 'purchase_date', label: 'Purchase Date' },
      { key: 'last_oil_change', label: 'Last Oil Change' },
    ]
    for (const { key, label } of dateFields) {
      const val = (form as any)[key]
      if (val && val > todayDate) {
        setFormError(`${label} cannot be in the future`)
        return
      }
    }
    try {
      let res: { success?: boolean | number; message?: string }
      const { qr_code, ...restForm } = form
      const cleanForm = qr_code ? form : restForm
      if (isEdit) {
        const payload: Record<string, unknown> = { uuid: spec.uuid, ...cleanForm, machine_type_id: machineTypeId }
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
        Object.entries({ ...cleanForm, machine_type_id: machineTypeId }).forEach(([k, v]) =>
          fd.append(k, String(v))
        )
        if (file) fd.append('file', file)
        res = await apiUpload('/specification/create', fd)
      }
      if (!res.success) {
        setFormError(res.message || 'Save failed')
        return
      }
      onSaved(res.message || (isEdit ? 'Specification updated' : 'Specification created'))
      onClose()
    } catch {
      setFormError('Failed to save specification')
    } finally {
      setSaving(false)
    }
  }

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="primary" type="submit" form="spec-form" isLoading={saving}>
        {isEdit ? 'Update' : 'Add Specification'}
      </Button>
    </>
  )

  return (
    <Modal
      title={isEdit ? 'Edit Specification' : 'Add Machine Specification'}
      onClose={onClose}
      size="lg"
      footer={footer}
    >
      {formError && (
        <div className="mb-3 px-3 py-2 border border-red-300 rounded-input text-xs text-red-600">
          {formError}
        </div>
      )}
      <form id="spec-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Machine No"
            value={form.machine_no}
            onChange={e => { set('machine_no', e.target.value); setFieldError('') }}
            placeholder="e.g. MA006"
            required
            error={fieldError}
            touched={!!fieldError}
          />
          {maintenanceFlag === 1 && (
            <FormInput
              label="Brand"
              value={form.brand}
              onChange={e => set('brand', e.target.value)}
              placeholder="e.g. Dream Stich"
              required
            />
          )}
        </div>
        {maintenanceFlag === 1 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="Model No"
                value={form.model_no}
                onChange={e => set('model_no', e.target.value)}
                placeholder="e.g. 2020LL1"
                required
              />
              <FormSelect
                label="Condition"
                value={form.condition}
                onChange={e => set('condition', e.target.value)}
                options={conditionOptions.map(c => ({ value: c.id.toString(), label: c.value }))}
                placeholder="Select condition"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="Serial No"
                value={form.serial_no}
                onChange={e => set('serial_no', e.target.value)}
                placeholder="e.g. SN006"
                required
              />
              <FormInput
                label="Warranty (years)"
                type="number"
                value={form.warranty}
                onChange={e => set('warranty', e.target.value)}
                placeholder="e.g. 2"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormInput
                label="Purchase Date"
                type="date"
                value={form.purchase_date}
                onChange={e => set('purchase_date', e.target.value)}
                max={today}
                required
              />
              <FormInput
                label="Last Oil Change"
                type="date"
                value={form.last_oil_change}
                onChange={e => set('last_oil_change', e.target.value)}
                max={today}
                required
              />
              <FormInput
                label="Next Maintenance"
                type="date"
                value={form.next_maintenance}
                onChange={e => set('next_maintenance', e.target.value)}
                min={today}
                required
              />
            </div>
          </>
        )}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-t-body">Branch <span className="text-red-400">*</span></label>
            <input
              type="text"
              readOnly
              value={
                branches.find(b => String(b.id) === String(form.branch_id))?.branch_name ||
                spec?.branch?.branch_name ||
                selectedBranchName ||
                userBranchName ||
                '—'
              }
              className="w-full h-input-h px-2.5 text-sm2 bg-card-alt border border-input-line rounded-input outline-none text-t-primary font-medium cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-input border border-input-line px-3 py-2">
          <span className="text-sm font-medium">Process Audit</span>
          <button
            type="button"
            onClick={() =>
              setForm(f => ({
                ...f,
                process_audit: f.process_audit === 1 ? 0 : 1,
              }))
            }
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${form.process_audit === 1
              ? 'bg-green-500'
              : 'bg-gray-300'
              }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${form.process_audit === 1
                ? 'translate-x-5'
                : 'translate-x-0'
                }`}
            />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-t-body">Attachment (PDF / Image)</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 h-input-h px-2.5 border border-dashed border-input-line rounded-input cursor-pointer hover:border-accent transition-colors"
          >
            <Upload size={13} className="text-t-lighter" />
            <span className="text-sm2 text-t-lighter">
              {file ? file.name : 'Click to upload file'}
            </span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </form>
    </Modal>
  )
}
