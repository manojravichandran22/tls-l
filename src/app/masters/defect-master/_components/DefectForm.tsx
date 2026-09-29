'use client'

import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import { validateField, validateAll, hasErrors } from '@/lib/validation'
import Toggle from '@/components/ui/Toggle'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { apiCall } from '@/services/apiClient'
import {
  type Defect,
  type Cap,
  type DefectForm as DefectFormState,
  type FormField,
  type FormErrors,
  type Touched,
  rules,
} from './types'

interface DefectFormProps {
  defect: Defect | null
  workCategories: { id: number; name: string }[]
  categoryOptions: { id: number; value: string }[]
  severityOptions: { id: number; value: string }[]
  branches: { id: number; branch_name: string }[]
  onClose: () => void
  onSave: (payload: Record<string, unknown>) => Promise<{ success?: boolean; message?: string }>
}

export default function DefectForm({
  defect,
  workCategories,
  categoryOptions,
  severityOptions,
  branches,
  onClose,
  onSave,
}: DefectFormProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  console.log('DefectForm props - workCategories count:', workCategories?.length);
  console.log('Category options count:', categoryOptions?.length);
  console.log('Escalation flag initial:', !!defect?.escalation_flag);
  const isEdit = !!defect

  const safeOptions = Array.isArray(severityOptions) ? severityOptions : [];
  console.log('Severity options fetched:', safeOptions.length, safeOptions);

  const matchedSeverity = safeOptions.find(
    o =>
      String(o.id) === String(defect?.severity ?? '') ||
      o.value.toLowerCase() === String(defect?.severity ?? '').toLowerCase()
  )

  const [form, setForm] = useState<DefectFormState & { branch_id: string }>({
    defect_name: defect?.defect_name ?? '',
    // Use IDs for edit mode; fallback to empty string for new
    category: defect?.category_id?.toString() ?? '',
    severity: defect?.severity_id?.toString() ?? '',
    escalation_flag: (defect?.escalation_flag ?? 0) === 1,
    department_id: defect?.workcategory_id?.toString() ?? '',
    branch_id: (defect as any)?.branch_id?.toString() ?? (userBranchId ? String(userBranchId) : ''),
    caps: defect?.caps?.length
      ? defect.caps.map((c, i) => ({ cap_name: c.cap_name, short_name: c.short_name ?? '', notes: c.notes ?? '', _key: c.id?.toString() ?? `cap-${i}` }))
      : [{ cap_name: '', short_name: '', notes: '', _key: 'cap-0' }],
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})
  const [formError, setFormError] = useState('')
  const [formWorkCategories, setFormWorkCategories] = useState<{ id: number; name: string }[]>(workCategories || [])
  const [loadingWorkCategories, setLoadingWorkCategories] = useState(false)
  const [formCategoryOptions, setFormCategoryOptions] = useState<{ id: number; value: string }[]>(
    form.branch_id ? [] : (categoryOptions || [])
  )
  const [formSeverityOptions, setFormSeverityOptions] = useState<{ id: number; value: string }[]>(
    form.branch_id ? [] : (severityOptions || [])
  )

  useEffect(() => {
    let isMounted = true
    setLoadingWorkCategories(true)
    apiCall<any>(
      '/dropdown/workCategoryList',
      {
        method: 'GET',
        encrypt: false,
        payload: form.branch_id ? { branch_id: form.branch_id } : {},
      }
    )
      .then(res => {
        if (!isMounted) return
        const data = res?.data ?? res
        const records = data?.records ?? data
        let list: any[] = []
        if (Array.isArray(records)) {
          list = records
        } else if (records && typeof records === 'object') {
          list = records.workCategory ?? records.work_category ?? records.workCategories ?? records.workCategoryList ?? []
        }
        const filtered = Array.isArray(list)
          ? list
              .filter((item: any) => item && typeof item === 'object' && item.type !== 'branch')
              .map((item: any) => ({
                id: Number(item.id),
                name: String(item.name ?? item.workcategory_name ?? item.work_category_name ?? item.work_category ?? ''),
              }))
              .filter(item => Boolean(item.id && item.name))
          : []
        setFormWorkCategories(filtered)
      })
      .catch(() => {
        if (isMounted) setFormWorkCategories(form.branch_id ? [] : (workCategories || []))
      })
      .finally(() => {
        if (isMounted) setLoadingWorkCategories(false)
      })

    return () => {
      isMounted = false
    }
  }, [form.branch_id, workCategories])

  // Fetch Category options when branch_id changes
  useEffect(() => {
    let isMounted = true
    if (!form.branch_id) {
      setFormCategoryOptions(categoryOptions || [])
      return
    }
    apiCall<any>('/dropdown/options-dropdown', {
      method: 'GET',
      encrypt: false,
      payload: {
        type: 'category',
        branch_id: form.branch_id,
      },
    })
      .then(res => {
        if (!isMounted) return
        const records = res?.data?.records?.category ?? (Array.isArray(res?.data?.records) ? res?.data?.records : [])
        setFormCategoryOptions(Array.isArray(records) ? records : [])
      })
      .catch(() => {
        if (isMounted) setFormCategoryOptions([])
      })

    return () => { isMounted = false }
  }, [form.branch_id, categoryOptions])

  // Fetch Severity options when branch_id changes
  useEffect(() => {
    let isMounted = true
    if (!form.branch_id) {
      setFormSeverityOptions(severityOptions || [])
      return
    }
    apiCall<any>('/dropdown/options-dropdown', {
      method: 'GET',
      encrypt: false,
      payload: {
        type: 'severity',
        branch_id: form.branch_id,
      },
    })
      .then(res => {
        if (!isMounted) return
        const records = res?.data?.records?.severity ?? (Array.isArray(res?.data?.records) ? res?.data?.records : [])
        setFormSeverityOptions(Array.isArray(records) ? records : [])
      })
      .catch(() => {
        if (isMounted) setFormSeverityOptions([])
      })

    return () => { isMounted = false }
  }, [form.branch_id, severityOptions])

  const setField = (key: keyof DefectFormState, val: string | boolean) => {
    if (key === 'escalation_flag') {
      setForm(f => ({ ...f, escalation_flag: val as boolean, department_id: val ? f.department_id : '' }))
      return
    }
    setForm(f => ({ ...f, [key]: val }))
    if (key in rules && touched[key as FormField]) {
      setErrors(e => ({ ...e, [key]: validateField(val as string, rules[key as FormField]) }))
    }
  }

  const handleBranchChange = (newBranchId: string) => {
    setForm(f => ({
      ...f,
      branch_id: newBranchId,
      category: '',
      severity: '',
      department_id: '',
    }))
    setErrors(er => ({ ...er, category: '', severity: '', department_id: '' }))
  }

  const handleBlur = (key: FormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    setErrors(e => ({ ...e, [key]: validateField(form[key], rules[key]) }))
  }

  const addCap = () => setForm(f => ({ ...f, caps: [...f.caps, { cap_name: '', short_name: '', notes: '', _key: `cap-${Date.now()}` }] }))
  const removeCap = (i: number) => setForm(f => ({ ...f, caps: f.caps.filter((_, idx) => idx !== i) }))
  const setCap = (i: number, field: keyof Cap, val: string) =>
    setForm(f => ({ ...f, caps: f.caps.map((c, idx) => (idx === i ? { ...c, [field]: val } : c)) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: Touched = { defect_name: true, category: true, severity: true }
    setTouched(allTouched)

    const allErrors = validateAll(
      { defect_name: form.defect_name, category: form.category, severity: form.severity },
      rules
    )
    setErrors(allErrors as FormErrors)
    if (hasErrors(allErrors)) return

    const capsInvalid = form.caps.some(c => !c.cap_name.trim())
    if (capsInvalid) {
      setErrors(e => ({ ...e, defect_name: 'All CAP name fields are required' }))
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const payload: Record<string, unknown> = {
        defect_name: form.defect_name,
        category: form.category,
        severity: form.severity,
        escalation_flag: form.escalation_flag ? 1 : 0,
        // work category ID (selected from dropdown)
        workcategory_id: form.department_id,
        branch_id: form.branch_id,
        caps: form.caps.map(c => ({ cap_name: c.cap_name, short_name: c.short_name, notes: c.notes })),
      }
      if (isEdit) {
        payload.uuid = defect.uuid
        if (defect.code) payload.code = defect.code
      }

      const res = await onSave(payload)
      if (res.success === false) {
        setFormError(res.message || 'Save failed')
        return
      }
      onClose()
    } catch {
      setFormError('Failed to save defect. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Defect' : 'Add Defect'}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="defect-form" isLoading={saving}>
            {isEdit ? 'Update Defect' : 'Add Defect'}
          </Button>
        </>
      }
    >
      {formError && (
        <div className="mb-3 px-3 py-2 border border-red-300 rounded-input text-xs text-red-600">
          {formError}
        </div>
      )}
      <form id="defect-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormInput
          label="Defect Name"
          value={form.defect_name}
          onChange={e => setField('defect_name', e.target.value)}
          onBlur={() => handleBlur('defect_name')}
          placeholder="e.g. Machine Oil Stain"
          error={errors.defect_name}
          touched={touched.defect_name}
          required
        />

        <FormSelect
          label="Branch"
          value={form.branch_id}
          onChange={e => handleBranchChange(e.target.value)}
          options={branches.map(b => ({ value: String(b.id), label: b.branch_name }))}
          placeholder="Select branch"
          disabled={!isAdmin}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormSelect
            label="Category"
            value={form.category}
            onChange={e => setField('category', e.target.value)}
            onBlur={() => handleBlur('category')}
            options={formCategoryOptions.map(c => ({ value: c.id.toString(), label: c.value }))}
            placeholder={form.branch_id ? 'Select category' : 'Select branch first'}
            disabled={!form.branch_id}
            error={errors.category}
            touched={touched.category}
            required
          />
          <FormSelect
            label="Severity"
            value={form.severity}
            onChange={e => {
              setField('severity', e.target.value)
              if (touched.severity)
                setErrors(er => ({ ...er, severity: e.target.value ? '' : 'Severity is required' }))
            }}
            onBlur={() => handleBlur('severity')}
            options={formSeverityOptions.map(o => ({ value: o.id.toString(), label: o.value }))}
            placeholder={form.branch_id ? 'Select severity' : 'Select branch first'}
            disabled={!form.branch_id}
            error={errors.severity}
            touched={touched.severity}
            required
          />
        </div>

        {/* Escalation toggle */}
        <div className="flex items-center justify-between py-1">
          <label className="text-xs font-medium text-t-body">Escalation</label>
          <Toggle checked={form.escalation_flag} onChange={val => setField('escalation_flag', val)} />
        </div>

        {/* Department — shown when escalation is ON */}
        {form.escalation_flag && (
          <FormSelect
            label="Work Category"
            value={form.department_id}
            onChange={e => {
              setField('department_id', e.target.value)
              setTouched(t => ({ ...t, department_id: true }))
              setErrors(er => ({ ...er, department_id: e.target.value ? '' : 'Work Category is required' }))
            }}
            onBlur={() => {
              setTouched(t => ({ ...t, department_id: true }))
              setErrors(er => ({ ...er, department_id: form.department_id ? '' : 'Work Category is required' }))
            }}
            options={formWorkCategories.map(d => ({ value: d.id.toString(), label: d.name }))}
            placeholder={
              loadingWorkCategories
                ? 'Loading work categories...'
                : form.branch_id
                ? 'Select work category'
                : 'Select branch first'
            }
            disabled={loadingWorkCategories || !form.branch_id}
            error={errors.department_id}
            touched={touched.department_id}
          />
        )}

        {/* CAP section */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-medium text-t-body">Corrective Action Plan (CAP)</label>
          {form.caps.map((cap, i) => (
            <div
              key={cap._key ?? `cap-${i}`}
              className="flex flex-col gap-2 p-3 rounded-card border border-table-line bg-card-alt relative"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-accent">CAP-{i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeCap(i)}
                  className="w-5 h-5 flex items-center justify-center rounded-full text-t-lighter hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  title="Remove CAP card"
                >
                  <X size={14} />
                </button>
              </div>
              <FormInput
                label="CAP Name"
                value={cap.cap_name}
                onChange={e => setCap(i, 'cap_name', e.target.value)}
                placeholder="e.g. Clean the Machine"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <FormInput
                  label="Short Name"
                  value={cap.short_name}
                  onChange={e => setCap(i, 'short_name', e.target.value)}
                  placeholder="e.g. Cap"
                />
                <FormInput
                  label="Notes"
                  value={cap.notes}
                  onChange={e => setCap(i, 'notes', e.target.value)}
                  placeholder="Optional notes"
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={addCap}
            leftIcon={<Plus size={13} />}
            className="text-xs text-accent hover:underline p-0 h-auto hover:bg-transparent w-fit"
          >
            Add More CAP
          </Button>
        </div>
      </form>
    </Modal>
  )
}
