'use client'

import { useState, useEffect } from 'react'
import { validateField, validateAll, hasErrors } from '@/lib/validation'
import { useCrudApi } from '@/hooks/useCrudApi'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import { type Role, type FormField, type FormErrors, type Touched, rules } from './types'

interface RoleFormProps {
  role: Role | null
  onClose: () => void
  onSave: (msg: string) => void
}

export default function RoleForm({ role, onClose, onSave }: RoleFormProps) {
  const isEdit = !!role
  const api = useCrudApi<Role>({ basePath: '/role', listKey: 'roles' })
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const { branches } = useDropdownData({ branches: true })

  const [form, setForm] = useState({
    name: role?.name ?? '',
    short_name: role?.short_name ?? '',
    role: role?.role?.toString() ?? '',
    branch_id: role?.branch_id?.toString() ?? (userBranchId ? String(userBranchId) : ''),
  })

  useEffect(() => {
    if (!isAdmin && userBranchId) {
      setForm(f => ({ ...f, branch_id: String(userBranchId) }))
    }
  }, [isAdmin, userBranchId])

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
    const allTouched: Touched = { name: true, short_name: true, role: true }
    setTouched(allTouched)
    const allErrors = validateAll(form, rules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return

    setSaving(true)
    setFormError('')
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        short_name: form.short_name,
        branch_id: form.branch_id,
      }
      if (isEdit) {
        payload.uuid = role.uuid
        const res = await api.update(payload)
        if (res.success === false) { setFormError(res.message || 'Update failed'); return }
        onSave(res.message || 'Role updated successfully')
      } else {
        const res = await api.create(payload)
        if (res.success === false) { setFormError(res.message || 'Creation failed'); return }
        onSave(res.message || 'Role created successfully')
      }
      onClose()
    } catch {
      setFormError('Failed to save role. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Role' : 'Add Role'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="role-form" isLoading={saving}>
            {isEdit ? 'Update Role' : 'Add Role'}
          </Button>
        </>
      }
    >
      {formError && (
        <div className="mb-3 px-3 py-2 border border-red-300 rounded-input text-xs text-red-600">
          {formError}
        </div>
      )}
      <form id="role-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormSelect
          label="Branch"
          value={form.branch_id}
          onChange={e => set('branch_id', e.target.value)}
          onBlur={() => handleBlur('branch_id')}
          options={branches.map(b => ({ value: b.id, label: b.branch_name }))}
          placeholder="Select Branch"
          touched={touched.branch_id}
          error={errors.branch_id}
          disabled={!isAdmin}
        />
        <FormInput
          label="Role Name"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder="e.g. Admin"
          error={errors.name}
          touched={touched.name}
          required
        />
        <FormInput
          label="Short Name"
          value={form.short_name}
          onChange={e => set('short_name', e.target.value)}
          onBlur={() => handleBlur('short_name')}
          placeholder="e.g. admin"
          error={errors.short_name}
          touched={touched.short_name}
          required
        />
      </form>
    </Modal>
  )
}

