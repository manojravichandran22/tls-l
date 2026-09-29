'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import { validateField, validateAll, hasErrors } from '@/lib/validation'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { fetchDepartments, type DeptOption } from '@/services/dropdownService'
import { type Designation, type BranchOption, type FormField, type FormErrors, type Touched, rules } from './types'

interface DesignationFormProps {
  designation: Designation | null
  departments: DeptOption[] | { id: number; name: string; branch_id?: number }[]
  branches: BranchOption[]
  onClose: () => void
  onSave: (payload: Record<string, unknown>) => Promise<{ success?: boolean; message?: string }>
}

export default function DesignationForm({
  designation,
  departments,
  branches,
  onClose,
  onSave,
}: DesignationFormProps) {
  const isEdit = !!designation
  const { branchId: userBranchId, isAdmin } = useBranchAccess()

  const [form, setForm] = useState({
    name: designation?.name ?? '',
    dept_id: designation?.dept_id?.toString() ?? '',
    branch_id: designation?.branch_id?.toString() ?? (userBranchId ? String(userBranchId) : ''),
  })

  const [branchDepts, setBranchDepts] = useState<DeptOption[] | { id: number; name: string; branch_id?: number }[]>(departments)
  const [loadingDepts, setLoadingDepts] = useState(false)

  useEffect(() => {
    if (!isAdmin && userBranchId) {
      setForm(f => ({ ...f, branch_id: String(userBranchId) }))
    }
  }, [isAdmin, userBranchId])

  useEffect(() => {
    if (!form.branch_id) {
      setBranchDepts(departments)
      return
    }

    const filtered = departments.filter(
      (d) => d.branch_id != null && String(d.branch_id) === String(form.branch_id)
    )
    if (filtered.length > 0) {
      setBranchDepts(filtered)
    }

    setLoadingDepts(true)
    fetchDepartments(form.branch_id)
      .then((data) => {
        setBranchDepts(data)
      })
      .catch(() => {
        if (filtered.length > 0) setBranchDepts(filtered)
      })
      .finally(() => {
        setLoadingDepts(false)
      })
  }, [form.branch_id, departments])

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
    const allTouched: Touched = { name: true, dept_id: true }
    setTouched(allTouched)
    const allErrors = validateAll(form, rules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return

    setSaving(true)
    setFormError('')
    try {
      const payload: Record<string, unknown> = {
        designation_name: form.name,
        dept_id: form.dept_id,
        branch_id: form.branch_id,
      }
      if (isEdit) payload.uuid = designation.uuid

      const res = await onSave(payload)
      if (res.success === false) {
        setFormError(res.message || (isEdit ? 'Update failed' : 'Creation failed'))
        return
      }
      onClose()
    } catch {
      setFormError('Failed to save designation. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Designation' : 'Add Designation'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="designation-form" isLoading={saving}>
            {isEdit ? 'Update Designation' : 'Add Designation'}
          </Button>
        </>
      }
    >
      {formError && (
        <div className="mb-3 px-3 py-2 border border-red-300 rounded-input text-xs text-red-600">
          {formError}
        </div>
      )}
      <form id="designation-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormSelect
          label="Branch"
          value={form.branch_id}
          onChange={e => {
            const bId = e.target.value
            setForm(f => ({ ...f, branch_id: bId, dept_id: '' }))
            setErrors(er => ({ ...er, branch_id: undefined, dept_id: undefined }))
          }}
          onBlur={() => handleBlur('branch_id')}
          options={branches.map(b => ({ value: b.id, label: b.branch_name }))}
          placeholder="Select branch"
          error={errors.branch_id}
          touched={touched.branch_id}
          disabled={!isAdmin}
        />
        <FormInput
          label="Designation Name"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder="e.g. Senior Engineer"
          error={errors.name}
          touched={touched.name}
          required
        />
        <FormSelect
          label="Department"
          value={form.dept_id}
          onChange={e => {
            set('dept_id', e.target.value)
            setTouched(t => ({ ...t, dept_id: true }))
            setErrors(er => ({ ...er, dept_id: validateField(e.target.value, rules.dept_id) }))
          }}
          onBlur={() => handleBlur('dept_id')}
          options={branchDepts.map(d => ({ value: d.id, label: d.name }))}
          placeholder={form.branch_id ? (loadingDepts ? "Loading departments..." : "Select department") : (isAdmin ? "Select branch first" : "Select department")}
          error={errors.dept_id}
          touched={touched.dept_id}
          disabled={!form.branch_id && isAdmin}
          required
        />
      </form>
    </Modal>
  )
}

