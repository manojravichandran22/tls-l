'use client'

import { useState, useEffect } from 'react'
import { apiCall } from '@/services/apiClient'
import { validateField, validateAll, hasErrors } from '@/lib/validation'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormInput from '@/components/ui/FormInput'
import {
  type OptionRecord,
  type FormField,
  type FormErrors,
  type Touched,
  rules,
} from './types'

const SELECT_CLS =
  'w-full h-input-h px-2.5 text-sm2 font-inherit text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-focus-ring/15 placeholder:text-t-lighter appearance-none pr-7 cursor-pointer'

interface BranchOption { id: number; branch_name: string }

interface OptionFormProps {
  option: OptionRecord | null
  branches?: BranchOption[]
  onClose: () => void
  onSave: (msg: string) => void
}

export default function OptionForm({ option, branches = [], onClose, onSave }: OptionFormProps) {
  const isEdit = !!option
  const { branchId: userBranchId, isAdmin } = useBranchAccess()

  const [form, setForm] = useState({
    module: option?.module ?? '',
    type: option?.type ?? '',
    value: option?.value ?? '',
    branch_id: option?.branch_id?.toString() ?? (userBranchId ? String(userBranchId) : ''),
  })

  // ── Module list ──────────────────────────────────────────────────────────────
  const [modules, setModules] = useState<{ module: string }[]>([])
  // const [optionTypes, setOptionTypes] = useState<{ type: string; module: string }[]>([])
  const [modulesLoading, setModulesLoading] = useState(true)

  // ── Option types list (filtered by selected module) ──────────────────────────
  const [optionTypes, setOptionTypes] = useState<{ type: string }[]>([])
  const [optionTypesLoading, setOptionTypesLoading] = useState(false)

  useEffect(() => {
    setForm({
      module: option?.module ?? '',
      type: option?.type ?? '',
      value: option?.value ?? '',
      branch_id: option?.branch_id?.toString() ?? (userBranchId ? String(userBranchId) : ''),
    })
  }, [option, userBranchId])

  const activeBranchId = form.branch_id || (userBranchId ? String(userBranchId) : '')

  // Fetch module list (re-fetch when branch changes)
  useEffect(() => {
    setModulesLoading(true)
    const payload: Record<string, unknown> = {}
    if (activeBranchId) payload.branch_id = activeBranchId

    apiCall<{ success?: boolean; data?: { modules?: { module: string }[] } }>(
      '/dropdown/modules',
      { method: 'GET', encrypt: false, payload }
    )
      .then(res => setModules(res.data?.modules ?? []))
      .catch(() => setModules([]))
      .finally(() => setModulesLoading(false))
  }, [activeBranchId])

  // Fetch option types whenever module changes
  useEffect(() => {
    if (!form.module) {
      setOptionTypes([])
      return
    }
    setOptionTypesLoading(true)
    const payload: Record<string, unknown> = { module: form.module }
    if (activeBranchId) payload.branch_id = activeBranchId

    apiCall<{ success?: boolean; message?: string; data?: { type: string }[] }>(
      '/dropdown/typemodules',
      { method: 'GET', encrypt: false, payload }
    )
      .then(res => setOptionTypes(res.data ?? []))
      .catch(() => setOptionTypes([]))
      .finally(() => setOptionTypesLoading(false))
  }, [form.module, activeBranchId])
  // ── Form state ───────────────────────────────────────────────────────────────
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
    const allTouched: Touched = { module: true, type: true, value: true, branch_id: true }
    setTouched(allTouched)
    const allErrors = validateAll(form, rules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return

    setSaving(true)
    setFormError('')
    try {
      const payload: Record<string, unknown> = {
        module: form.module,
        type: form.type,
        value: form.value,
        branch_id: form.branch_id,
      }
      if (isEdit) {
        payload.id = option.id
        payload.uuid = option.uuid
        const res = await apiCall<{ success?: boolean; message?: string }>('/option/update', { payload })
        if (res.success === false) { setFormError(res.message || 'Update failed'); return }
        onSave(res.message || 'Option updated successfully')
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/option/create', { payload })
        if (res.success === false) { setFormError(res.message || 'Creation failed'); return }
        onSave(res.message || 'Option created successfully')
      }
      onClose()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string }
      setFormError(axiosErr.response?.data?.message || axiosErr.message || 'Failed to save option')
    } finally {
      setSaving(false)
    }
  }

  const labelFor = (key: string | null | undefined) =>
    (key ?? '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())


  return (
    <Modal
      title={isEdit ? 'Edit Option' : 'Add Option'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="option-form" isLoading={saving}>
            {isEdit ? 'Update Option' : 'Add Option'}
          </Button>
        </>
      }
    >
      {formError && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-input text-xs text-red-700">
          {formError}
        </div>
      )}
      <form id="option-form" onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* 0. Branch */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-t-body">
            Branch <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <select
              value={form.branch_id}
              onChange={e => set('branch_id', e.target.value)}
              onBlur={() => handleBlur('branch_id')}
              disabled={!isAdmin}
              className={`${SELECT_CLS} ${errors.branch_id && touched.branch_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''} ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <option value="">Select branch…</option>
              {branches.map(b => (
                <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-t-lighter text-xs">▾</span>
          </div>
          {errors.branch_id && touched.branch_id && (
            <span className="text-xs text-red-500 mt-0.5">{errors.branch_id}</span>
          )}
        </div>

        {/* 1. Module */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-t-body">
            Module <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <select
              value={form.module}
              onChange={e => {
                const val = e.target.value
                setForm(f => ({ ...f, module: val, type: '', value: '' }))
                if (touched.module) setErrors(er => ({ ...er, module: validateField(val, rules.module) }))
              }}
              onBlur={() => handleBlur('module')}
              disabled={modulesLoading}
              className={`${SELECT_CLS} ${errors.module && touched.module ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''} ${modulesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">{modulesLoading ? 'Loading modules…' : 'Select module…'}</option>
              {modules.map((m, i) => (
                <option key={m.module ?? i} value={m.module ?? ''}>
                  {labelFor(m.module)}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-t-lighter text-xs">▾</span>
          </div>
          {errors.module && touched.module && (
            <span className="text-xs text-red-500 mt-0.5">{errors.module}</span>
          )}
        </div>

        {/* 2. Option Type */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-t-body">
            Option Type <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <select
              value={form.type}
              onChange={e => set('type', e.target.value)}
              onBlur={() => handleBlur('type')}
              disabled={!form.module || optionTypesLoading}
              className={`${SELECT_CLS} ${errors.type && touched.type ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''} ${!form.module || optionTypesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">
                {!form.module
                  ? 'Select a module first…'
                  : optionTypesLoading
                    ? 'Loading types…'
                    : 'Select option type…'}
              </option>
              {optionTypes.map((opt, i) => (
                <option key={opt.type ?? i} value={opt.type}>
                  {labelFor(opt.type)}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-t-lighter text-xs">▾</span>
          </div>
          {errors.type && touched.type && (
            <span className="text-xs text-red-500 mt-0.5">{errors.type}</span>
          )}
        </div>

        {/* 3. Option Value */}
        <FormInput
          label="Option Value"
          value={form.value}
          onChange={e => set('value', e.target.value)}
          onBlur={() => handleBlur('value')}
          placeholder="e.g. Machine, Major"
          error={errors.value}
          touched={touched.value}
          required
        />

      </form>
    </Modal>
  )
}
