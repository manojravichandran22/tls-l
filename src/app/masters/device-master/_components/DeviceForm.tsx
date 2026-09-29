'use client'

import { useState } from 'react'
import { apiCall } from '@/services/apiClient'
import { validateField, validateAll, hasErrors } from '@/lib/validation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import {
  type Device,
  type BranchOption,
  type FormField,
  type FormErrors,
  type Touched,
  rules,
} from './types'

interface DeviceFormProps {
  device: Device | null
  branches: BranchOption[]
  onClose: () => void
  onSave: (msg: string) => void
}

export default function DeviceForm({ device, branches, onClose, onSave }: DeviceFormProps) {
  const isEdit = !!device
  const { branchId: userBranchId, isAdmin } = useBranchAccess()

  const [form, setForm] = useState({
    tls_id: device?.tls_id?.toString() ?? '',
    qr_code: device?.qr_code ?? '',
    mac_id: device?.mac_id ?? '',
    branch_id: device?.branch_id?.toString() ?? (userBranchId ? String(userBranchId) : ''),
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})
  const [formError, setFormError] = useState('')

  const set = (key: FormField, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    if (touched[key]) setErrors(e => ({ ...e, [key]: validateField(val, rules[key]) }))
  }

  const handleBlur = (key: FormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    setErrors(e => ({ ...e, [key]: validateField(form[key], rules[key]) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: Touched = { tls_id: true, mac_id: true, branch_id: true }
    setTouched(allTouched)
    const allErrors = validateAll(form, rules)
    setErrors(allErrors as FormErrors)
    if (hasErrors(allErrors)) return

    setSaving(true)
    setFormError('')
    try {
      const payload: Record<string, unknown> = {
        tls_id: form.tls_id,
        mac_id: form.mac_id,
        branch_id: form.branch_id,
      }
      if (form.qr_code) payload.qr_code = form.qr_code

      if (isEdit) {
        payload.uuid = device.uuid
        const res = await apiCall<{ success?: boolean; message?: string }>('/devices/update', { payload })
        if (res.success === false) { setFormError(res.message || 'Update failed'); return }
        onSave(res.message || 'Device updated successfully')
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/devices/create', { payload })
        if (res.success === false) { setFormError(res.message || 'Creation failed'); return }
        onSave(res.message || 'Device created successfully')
      }
      onClose()
    } catch {
      setFormError('Failed to save device. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Device' : 'Add Device'}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="device-form" isLoading={saving}>
            {isEdit ? 'Update Device' : 'Add Device'}
          </Button>
        </>
      }
    >
      {formError && (
        <div className="mb-3 px-3 py-2 border border-red-300 rounded-input text-xs text-red-600">
          {formError}
        </div>
      )}
      <form id="device-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Qone ID"
            type="text"
            value={form.tls_id}
            onChange={e => set('tls_id', e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={() => handleBlur('tls_id')}
            touched={touched.tls_id}
            placeholder="e.g. 21"
            error={errors.tls_id}
            required
          />
        </div> */}

        <FormSelect
          label="Branch"
          value={form.branch_id}
          onChange={e => set('branch_id', e.target.value)}
          onBlur={() => handleBlur('branch_id')}
          options={branches.map(b => ({ value: b.id, label: b.branch_name }))}
          placeholder="Select branch"
          disabled={!isAdmin}
          error={errors.branch_id}
          touched={touched.branch_id}
          required
        />

        <FormInput
          label="MAC Address / IP"
          value={form.mac_id}
          onChange={e => set('mac_id', e.target.value)}
          onBlur={() => handleBlur('mac_id')}
          touched={touched.mac_id}
          placeholder="e.g. 127.90.87.88 or 00:1A:2B:3C:4D:5E"
          error={errors.mac_id}
        />

        {isEdit && device?.code && (
          <div className="bg-table-head p-3 rounded-lg border border-header-line">
            <span className="text-xs2 font-bold text-t-lighter uppercase tracking-wider block mb-1">Device Code</span>
            <span className="text-sm font-mono text-accent">{device.code}</span>
          </div>
        )}
      </form>
    </Modal>
  )
}
