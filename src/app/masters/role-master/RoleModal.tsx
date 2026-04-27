'use client'

import { useState } from 'react'
import { validateField, validateAll, hasErrors } from '@/lib/validation'
import { useCrudApi } from '@/hooks/useCrudApi'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FormInput from '@/components/ui/FormInput'
import { type Role, type RoleFormField, roleRules } from './page'

type FormErrors = Partial<Record<RoleFormField, string>>
type Touched = Partial<Record<RoleFormField, boolean>>

interface RoleModalProps {
  role: Role | null
  onClose: () => void
  onSaved: (msg: string) => void
}

export default function RoleModal({ role, onClose, onSaved }: RoleModalProps) {
  const isEdit = !!role
  const api = useCrudApi<Role>({ basePath: '/role', listKey: 'roles' })

  const [form, setForm] = useState({
    name: role?.name ?? '',
    short_name: role?.short_name ?? '',
    role: role?.role?.toString() ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})

  const set = (key: RoleFormField, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    if (touched[key]) setErrors(e => ({ ...e, [key]: validateField(val, roleRules[key]) }))
  }

  const handleBlur = (key: RoleFormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    setErrors(e => ({ ...e, [key]: validateField(form[key], roleRules[key]) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: Touched = { name: true, short_name: true, role: true }
    setTouched(allTouched)
    const allErrors = validateAll(form, roleRules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return

    setSaving(true)
    try {
      const payload: Record<string, unknown> = { name: form.name, short_name: form.short_name, role: form.role }
      if (isEdit) {
        payload.uuid = role.uuid
        const res = await api.update(payload)
        if (res.success === false) { setErrors({ name: res.message || 'Update failed' }); return }
        onSaved(res.message || 'Role updated successfully')
      } else {
        const res = await api.create(payload)
        if (res.success === false) { setErrors({ name: res.message || 'Creation failed' }); return }
        onSaved(res.message || 'Role created successfully')
      }
      onClose()
    } catch {
      setErrors({ name: 'Failed to save role. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Role' : 'Add Role'} onClose={onClose} footer={
      <>
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" form="role-form" isLoading={saving}>
          {isEdit ? 'Update Role' : 'Add Role'}
        </Button>
      </>
    }>
      <form id="role-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormInput label="Role Name" value={form.name} onChange={e => set('name', e.target.value)} onBlur={() => handleBlur('name')} placeholder="e.g. Admin" error={errors.name} touched={touched.name} required />
        <FormInput label="Short Name" value={form.short_name} onChange={e => set('short_name', e.target.value)} onBlur={() => handleBlur('short_name')} placeholder="e.g. admin" error={errors.short_name} touched={touched.short_name} required />
        <FormInput label="Role Code" value={form.role} onChange={e => set('role', e.target.value)} onBlur={() => handleBlur('role')} placeholder="e.g. 80" error={errors.role} touched={touched.role} required />
      </form>
    </Modal>
  )
}
