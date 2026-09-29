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
  type Workstation,
  type BranchOption,
  type LineOption,
  type FormField,
  type FormErrors,
  type Touched,
  rules,
} from './types'

interface WorkstationFormProps {
  ws: Workstation | null
  branches: BranchOption[]
  allLines: LineOption[]
  onClose: () => void
  onSave: (msg: string) => void
}

export default function WorkstationForm({
  ws, branches, allLines, onClose, onSave,
}: WorkstationFormProps) {
  const isEdit = !!ws
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const [form, setForm] = useState({
    name: ws?.name ?? '',
    branch_id: ws?.branch_id?.toString() ?? (userBranchId ? String(userBranchId) : ''),
    line_id: ws?.line_id?.toString() ?? '',
    qr_code: ws?.qr_code ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})
  const [formError, setFormError] = useState('')

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
    setFormError('')
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
        if (res.success === false) { setFormError(res.message || 'Update failed'); return }
        onSave(res.message || 'Workstation updated successfully')
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/workstation/create', { payload })
        if (res.success === false) { setFormError(res.message || 'Creation failed'); return }
        onSave(res.message || 'Workstation created successfully')
      }
      onClose()
    } catch {
      setFormError('Failed to save workstation. Please try again.')
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
      {formError && (
        <div className="mb-3 px-3 py-2 border border-red-300 rounded-input text-xs text-red-600">
          {formError}
        </div>
      )}
      <form id="ws-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormInput
          label="Workstation Name"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder="e.g. WorkStation 1"
          error={errors.name}
          touched={touched.name}
          maxLength={100}
          required
        />
        <div className="grid grid-cols-2 gap-2.5">
          <FormSelect
            label="Branch"
            value={form.branch_id}
            onChange={e => handleBranchChange(e.target.value)}
            onBlur={() => handleBlur('branch_id')}
            options={branches.map(b => ({ value: b.id, label: b.branch_name }))}
            placeholder="Select branch"
            disabled={!isAdmin}
            error={errors.branch_id}
            touched={touched.branch_id}
            required
          />
          <FormSelect
            label="Line"
            value={form.line_id}
            onChange={e => {
              set('line_id', e.target.value)
              setTouched(t => ({ ...t, line_id: true }))
              setErrors(er => ({ ...er, line_id: validateField(e.target.value, rules.line_id) }))
            }}
            onBlur={() => handleBlur('line_id')}
            options={filteredLines.map(l => ({ value: l.id, label: l.line_name }))}
            placeholder={form.branch_id ? 'Select line' : 'Select branch first'}
            disabled={!form.branch_id}
            error={errors.line_id}
            touched={touched.line_id}
            required
          />
        </div>
        <FormInput
          label="QR Code"
          value={form.qr_code}
          onChange={e => set('qr_code', e.target.value)}
          onBlur={() => handleBlur('qr_code')}
          placeholder="e.g. QRCODE123"
          error={errors.qr_code}
          touched={touched.qr_code}
          required
        />
      </form>
    </Modal>
  )
}
