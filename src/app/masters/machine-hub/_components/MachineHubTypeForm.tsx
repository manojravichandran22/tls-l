'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import FormTextarea from '@/components/ui/FormTextarea'
import { apiCall } from '@/services/apiClient'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import type { MachineTypeItem } from './types'

interface Props {
  editType: MachineTypeItem | null
  onClose: () => void
  onSaved: (msg: string) => void
  onError: (msg: string) => void
}

export default function MachineHubTypeForm({ editType, onClose, onSaved, onError }: Props) {
  const isEdit = !!editType
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const { branches } = useDropdownData({ branches: true })

  const [form, setForm] = useState({
    type_name: editType?.type_name ?? '',
    notes: editType?.notes ?? '',
    rem_days: editType?.rem_days?.toString() ?? '30',
    maintenance_flag: editType?.maintenance_flag ?? 1,
    branch_id:
      (editType as any)?.branch_id?.toString() ??
      (editType as any)?.branch?.id?.toString() ??
      (userBranchId ? String(userBranchId) : ''),
  })

  // Sync branch_id from userBranchId once available (handles async resolution)
  useEffect(() => {
    if (!form.branch_id && userBranchId) {
      setForm(f => ({ ...f, branch_id: String(userBranchId) }))
    }
  }, [userBranchId])
  const [saving, setSaving] = useState(false)
  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.type_name.trim()) {
      setFieldError('Machine type name is required')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload: Record<string, unknown> = {
        type_name: form.type_name,
        notes: form.notes,
        maintenance_flag: form.maintenance_flag,
        rem_days: Number(form.rem_days),
        ...(form.branch_id ? { branch_id: form.branch_id } : {}),
      }
      if (isEdit) payload.uuid = editType.uuid
      const res = await apiCall<{ success?: boolean | number; message?: string }>(
        isEdit ? '/machine/update' : '/machine/create',
        { payload }
      )
      console.log("API Response:", res)
      if (!res.success) {
        setFormError(res.message || (isEdit ? 'Update failed' : 'Create failed'))
        return
      }
      onSaved(res.message || (isEdit ? 'Machine type updated' : 'Machine type created'))
      onClose()
    } catch {
      setFormError(isEdit ? 'Failed to update machine type' : 'Failed to create machine type')
    } finally {
      setSaving(false)
    }
  }

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="primary" type="submit" form="machine-type-form" isLoading={saving}>
        {isEdit ? 'Update Machine Type' : 'Add Machine Type'}
      </Button>
    </>
  )

  return (
    <Modal title={isEdit ? 'Edit Machine Type' : 'Add Machine Type'} onClose={onClose} footer={footer}>
      {formError && (
        <div className="mb-3 px-3 py-2 border border-red-300 rounded-input text-xs text-red-600">
          {formError}
        </div>
      )}
      <form id="machine-type-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormInput
          label="Machine Type Name"
          required
          value={form.type_name}
          onChange={e => {
            setForm(f => ({ ...f, type_name: e.target.value }))
            setFieldError('')
          }}
          placeholder="e.g. 2T Flatlock"
          error={fieldError}
          touched={!!fieldError}
          autoFocus
        />

        <FormSelect
          label="Branch"
          required
          value={form.branch_id}
          onChange={e => setForm(f => ({ ...f, branch_id: e.target.value }))}
          options={branches.map(b => ({ value: String(b.id), label: b.branch_name }))}
          placeholder="Select branch"
          disabled={!isAdmin}
        />
        <div className="flex items-center justify-between rounded-input border border-input-line px-3 py-2">
          <span className="text-sm font-medium">Maintenance</span>

          <button
            type="button"
            onClick={() =>
              setForm(f => ({
                ...f,
                maintenance_flag: f.maintenance_flag === 1 ? 0 : 1,
              }))
            }
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${form.maintenance_flag === 1
                ? 'bg-green-500'
                : 'bg-gray-300'
              }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${form.maintenance_flag === 1
                  ? 'translate-x-5'
                  : 'translate-x-0'
                }`}
            />
          </button>
        </div>
        <FormInput
          label="Reminder Days"
          type="number"
          value={form.rem_days}
          onChange={e =>
            setForm(f => ({
              ...f,
              rem_days: e.target.value,
            }))
          }
          placeholder="e.g. 30"
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
