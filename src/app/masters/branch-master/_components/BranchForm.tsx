'use client'

import { useState, useEffect, useRef } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import FormTextarea from '@/components/ui/FormTextarea'
import { validateField, validateAll, hasErrors } from '@/lib/validation'
import type { Branch, CompanyOption, FormField, FormErrors, Touched } from './types'
import { rules } from './types'

interface Props {
  editBranch: Branch | null
  companies: CompanyOption[]
  saving: boolean
  formError: string | null
  onSave: (payload: Record<string, unknown>) => void
  onClose: () => void
}

export default function BranchForm({ editBranch, companies, saving, formError, onSave, onClose }: Props) {
  const [form, setForm] = useState({ company_id: '', branch_name: '', address: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})
  const [noChange, setNoChange] = useState(false)
  const initialFormRef = useRef<typeof form | null>(null)

  useEffect(() => {
    if (editBranch) {
      const initial = {
        company_id: editBranch.company_id?.toString() ?? '',
        branch_name: editBranch.branch_name ?? '',
        address: editBranch.address ?? '',
      }
      setForm(initial)
      initialFormRef.current = initial
    } else {
      setForm({ company_id: '', branch_name: '', address: '' })
      initialFormRef.current = null
    }
    setErrors({})
    setTouched({})
    setNoChange(false)
  }, [editBranch])

  const set = (key: FormField, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    if (touched[key]) setErrors(e => ({ ...e, [key]: validateField(val, rules[key]) }))
  }

  const handleBlur = (key: FormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    setErrors(e => ({ ...e, [key]: validateField(form[key], rules[key]) }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ company_id: true, branch_name: true, address: true })
    const allErrors = validateAll(form, rules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return

    if (editBranch && initialFormRef.current && JSON.stringify(form) === JSON.stringify(initialFormRef.current)) {
      setNoChange(true)
      return
    }
    setNoChange(false)

    const payload: Record<string, unknown> = {
      company_id: form.company_id,
      branch_name: form.branch_name,
      address: form.address,
    }
    if (editBranch) payload.uuid = editBranch.uuid
    onSave(payload)
  }

  const companyOptions = companies.map(c => ({ value: c.id, label: c.company_name }))

  const footer = (
    <>
      <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
      <Button variant="primary" type="submit" form="branch-form" isLoading={saving}>
        {editBranch ? 'Update Branch' : 'Add Branch'}
      </Button>
    </>
  )

  return (
    <Modal title={editBranch ? 'Edit Branch' : 'Add Branch'} onClose={onClose} footer={footer}>
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
      <form id="branch-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormSelect
          label="Company"
          value={form.company_id}
          onChange={e => set('company_id', e.target.value)}
          onBlur={() => handleBlur('company_id')}
          options={companyOptions}
          placeholder="Select company"
          error={errors.company_id}
          touched={touched.company_id}
          required
        />
        <FormInput
          label="Branch Name"
          value={form.branch_name}
          onChange={e => set('branch_name', e.target.value)}
          onBlur={() => handleBlur('branch_name')}
          placeholder="Enter branch name"
          error={errors.branch_name}
          touched={touched.branch_name}
          required
        />
        <FormTextarea
          label="Address"
          value={form.address}
          onChange={e => set('address', e.target.value)}
          onBlur={() => handleBlur('address')}
          placeholder="Enter address"
          error={errors.address}
          touched={touched.address}
          required
        />
      </form>
    </Modal>
  )
}
