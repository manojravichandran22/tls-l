'use client'

import { useState, useEffect, useRef } from 'react'
import { validateField, validateAll, hasErrors } from '@/lib/validation'
import { apiCall } from '@/services/apiClient'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import { type Department, type BranchOption, type FormField, type FormErrors, type Touched, rules } from './types'

interface DepartmentFormProps {
  dept: Department | null
  branches: BranchOption[]
  onClose: () => void
  onSave: (msg: string) => void
}

export default function DepartmentForm({ dept, branches, onClose, onSave }: DepartmentFormProps) {
  const isEdit = !!dept
  const { branchId: userBranchId, isAdmin } = useBranchAccess()

  const [form, setForm] = useState({
    name: dept?.name ?? '',
    branch_id: dept?.branch_id?.toString() ?? (userBranchId ? String(userBranchId) : ''),
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})
  const [noChange, setNoChange] = useState(false)
  const [formError, setFormError] = useState('')
  const initialFormRef = useRef<typeof form | null>(null)

  useEffect(() => {
    if (dept) {
      const initial = {
        name: dept.name ?? '',
        branch_id: dept.branch_id?.toString() ?? '',
      }
      setForm(initial)
      initialFormRef.current = initial
    } else {
      const initBranchId = !isAdmin && userBranchId ? String(userBranchId) : ''
      setForm({ name: '', branch_id: initBranchId })
      initialFormRef.current = null
    }
    setErrors({})
    setTouched({})
    setNoChange(false)
  }, [dept, isAdmin, userBranchId])

  const set = (key: FormField, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    if (touched[key]) setErrors(e => ({ ...e, [key]: validateField(val, rules[key]) }))
    setNoChange(false)
  }
  const handleBlur = (key: FormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    setErrors(e => ({ ...e, [key]: validateField(form[key], rules[key]) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: Touched = { name: true, branch_id: true }
    setTouched(allTouched)
    const allErrors = validateAll(form, rules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return

    if (isEdit && initialFormRef.current && JSON.stringify(form) === JSON.stringify(initialFormRef.current)) {
      setNoChange(true)
      return
    }
    setNoChange(false)

    setSaving(true)
    setFormError('')
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        branch_id: form.branch_id,
      }
      if (isEdit) {
        payload.uuid = dept.uuid
        const res = await apiCall<{ success?: boolean; message?: string }>('/department/update', { payload })
        if (res.success === false) { setFormError(res.message || 'Update failed'); return }
        onSave(res.message || 'Department updated successfully')
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/department/create', { payload })
        if (res.success === false) { setFormError(res.message || 'Creation failed'); return }
        onSave(res.message || 'Department created successfully')
      }
      onClose()
    } catch {
      setFormError('Failed to save department. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Department' : 'Add Department'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="dept-form" isLoading={saving}>
            {isEdit ? 'Update Department' : 'Add Department'}
          </Button>
        </>
      }
    >
      {noChange && (
        <div className="mb-3 px-3 py-2 border border-amber-300 bg-amber-50 rounded-input text-xs text-amber-700">
          No changes were made.
        </div>
      )}
      {formError && (
        <div className="mb-3 px-3 py-2 border border-red-300 rounded-input text-xs text-red-600">
          {formError}
        </div>
      )}
      <form id="dept-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormInput
          label="Department Name"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder="e.g. Spinning"
          error={errors.name}
          touched={touched.name}
          required
        />
        <FormSelect
          label="Branch"
          value={form.branch_id}
          onChange={e => {
            set('branch_id', e.target.value)
            setTouched(t => ({ ...t, branch_id: true }))
            setErrors(er => ({ ...er, branch_id: validateField(e.target.value, rules.branch_id) }))
          }}
          onBlur={() => handleBlur('branch_id')}
          options={branches.map(b => ({ value: b.id, label: b.branch_name }))}
          placeholder="Select branch"
          error={errors.branch_id}
          touched={touched.branch_id}
          required
          disabled={!isAdmin}
        />
      </form>
    </Modal>
  )
}

