'use client'

import { useState } from 'react'
import { apiCall } from '@/services/apiClient'
import { validateField, validateAll, hasErrors } from '@/lib/validation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import { type Shift, type BranchOption, type ZoneOption, type FormField, type FormErrors, type Touched, rules, SHIFT_TYPES } from './types'
import { useBranchAccess } from '@/hooks/useBranchAccess'
interface ShiftMasterFormProps {
  shift: Shift | null
  branches: BranchOption[]
  onClose: () => void
  onSave: (msg: string) => void
}

const getFormErrors = (values: Record<string, any>, currentTouched: Touched): FormErrors => {
  const baseErrors = validateAll(values as Record<FormField, string>, rules)
  const crossErrors: FormErrors = {}

  // if (values.start_time && values.end_time && values.start_time >= values.end_time) {
  //   crossErrors.end_time = 'End time must be after start time'
  // }
  // if (values.start_buffer_time && values.end_buffer_time && values.start_buffer_time >= values.end_buffer_time) {
  //   crossErrors.end_buffer_time = 'Buffer logout must be after buffer login'
  // }
  if (values.lunch_start && values.lunch_end && values.lunch_start >= values.lunch_end) {
    crossErrors.lunch_end = 'Meal end must be after meal start'
  }
  if (values.lunch_start && !values.lunch_end) {
    crossErrors.lunch_end = 'Meal end is required when meal start is set'
  }
  if (!values.lunch_start && values.lunch_end) {
    crossErrors.lunch_start = 'Meal start is required when meal end is set'
  }
  if (values.mrg_break_start && !values.mrg_break_end) {
    crossErrors.mrg_break_end = 'Morning break end is required'
  }
  if (!values.mrg_break_start && values.mrg_break_end) {
    crossErrors.mrg_break_start = 'Morning break start is required'
  }
  if (values.mrg_break_start && values.mrg_break_end && values.mrg_break_start >= values.mrg_break_end) {
    crossErrors.mrg_break_end = 'Morning break end must be after break start'
  }

  if (values.evg_break_start && !values.evg_break_end) {
    crossErrors.evg_break_end = 'Evening break end is required'
  }
  if (!values.evg_break_start && values.evg_break_end) {
    crossErrors.evg_break_start = 'Evening break start is required'
  }
  if (values.evg_break_start && values.evg_break_end && values.evg_break_start >= values.evg_break_end) {
    crossErrors.evg_break_end = 'Evening break end must be after break start'
  }

  const filteredErrors: FormErrors = {}
  for (const key of Object.keys(rules) as FormField[]) {
    if (currentTouched[key]) {
      const err = baseErrors[key] || crossErrors[key]
      if (err) filteredErrors[key] = err
    }
  }

  const crossKeys: FormField[] = [
    'end_time', 'end_buffer_time', 'lunch_end',
    'mrg_break_start', 'mrg_break_end',
    'evg_break_start', 'evg_break_end'
  ]
  for (const key of crossKeys) {
    if (currentTouched[key] && crossErrors[key]) {
      filteredErrors[key] = crossErrors[key]
    }
  }

  return filteredErrors
}

export default function ShiftMasterForm({ shift, branches, onClose, onSave }: ShiftMasterFormProps) {
  const isEdit = !!shift
  const { branchId, isAdmin } = useBranchAccess()
  const convert12To24 = (time?: string) => {
    if (!time) return ''

    // Already 24-hour format
    if (!/AM|PM/i.test(time)) {
      return time.slice(0, 5)
    }

    const [timePart, modifier] = time.split(' ')
    let [hours, minutes] = timePart.split(':').map(Number)

    if (modifier.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12
    }

    if (modifier.toUpperCase() === 'AM' && hours === 12) {
      hours = 0
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }
  const [form, setForm] = useState({
    shift_name: shift?.shift_name ?? '',
    type: shift?.type ?? '',
    start_time: convert12To24(shift?.start_time ?? shift?.start),
    end_time: convert12To24(shift?.end_time ?? shift?.end),
    hrs: String(shift?.hrs ?? ''),
    breakMins: String(shift?.breakMins ?? shift?.break ?? ''),
    start_buffer_time: convert12To24(shift?.start_buffer_time),
    end_buffer_time: convert12To24(shift?.end_buffer_time),
    branch_id: shift?.branch_id?.toString() ??
      (!isAdmin && branchId ? String(branchId) : ''), lunch_start: convert12To24(shift?.lunch_start),
    lunch_end: convert12To24(shift?.lunch_end),
    mrg_break_start: convert12To24(shift?.mrg_break_start),
    mrg_break_end: convert12To24(shift?.mrg_break_end),
    evg_break_start: convert12To24(shift?.evg_break_start),
    evg_break_end: convert12To24(shift?.evg_break_end),
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})
  const [formError, setFormError] = useState('')

  const calculateHours = (start: string, end: string): string => {
    if (!start || !end) return ''
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return ''

    let diffMins = (endH * 60 + endM) - (startH * 60 + startM)
    if (diffMins < 0) {
      diffMins += 24 * 60 // crosses midnight
    }
    const diffHrs = diffMins / 60
    return Number(diffHrs.toFixed(2)).toString()
  }

  const calculateMinutes = (start: string, end: string): string => {
    if (!start || !end) return ''
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return ''

    let diffMins = (endH * 60 + endM) - (startH * 60 + startM)
    if (diffMins < 0) {
      diffMins += 24 * 60 // crosses midnight
    }
    return String(diffMins)
  }

  const set = (key: string, val: string) => {
    setForm(f => {
      const updated = { ...f, [key]: val }

      // if (key === 'start_time' || key === 'end_time') {
      //   const calculatedHrs = calculateHours(updated.start_time, updated.end_time)
      //   if (calculatedHrs) {
      //     updated.hrs = calculatedHrs
      //   }
      // }

      if (key === 'start_time' || key === 'end_time') {
        updated.hrs = calculateHours(updated.start_time, updated.end_time)
      }

      // if (key === 'lunch_start' || key === 'lunch_end') {
      //   const calculatedBreak = calculateMinutes(updated.lunch_start, updated.lunch_end)
      //   if (calculatedBreak) {
      //     updated.breakMins = calculatedBreak
      //   }
      // }

      if (
        key === 'lunch_start' ||
        key === 'lunch_end' ||
        key === 'mrg_break_start' ||
        key === 'mrg_break_end' ||
        key === 'evg_break_start' ||
        key === 'evg_break_end'
      ) {
        const lunch =
          Number(calculateMinutes(updated.lunch_start, updated.lunch_end) || 0)

        const morning =
          Number(calculateMinutes(updated.mrg_break_start, updated.mrg_break_end) || 0)

        const evening =
          Number(calculateMinutes(updated.evg_break_start, updated.evg_break_end) || 0)

        updated.breakMins = String(lunch + morning + evening)
      }

      setErrors(getFormErrors(updated, touched))
      return updated
    })
  }

  const handleBlur = (key: FormField) => {
    setTouched(t => {
      const updated = { ...t, [key]: true }
      setErrors(getFormErrors(form, updated))
      return updated
    })
  }

  const handleBranchChange = (val: string) => {
    setForm(f => {
      const updated = { ...f, branch_id: val }
      setErrors(getFormErrors(updated, { ...touched, branch_id: true }))
      return updated
    })
    setTouched(t => ({ ...t, branch_id: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: Touched = {
      shift_name: true, type: true, start_time: true, end_time: true, hrs: true, breakMins: true, branch_id: true,
      start_buffer_time: true, end_buffer_time: true,
      mrg_break_start: true, mrg_break_end: true,
      evg_break_start: true, evg_break_end: true,
    }
    setTouched(allTouched)
    const allErrors = getFormErrors(form, allTouched)
    setErrors(allErrors)
    if (Object.keys(allErrors).length > 0) return

    setSaving(true)
    setFormError('')
    try {
      const payload: Record<string, unknown> = {
        ...form,
      }
      if (isEdit) {
        payload.uuid = shift.uuid
        const res = await apiCall<{ success?: boolean; message?: string }>('/shift/update', { payload })
        if (res.success === false) { setFormError(res.message || 'Update failed'); return }
        onSave(res.message || 'Shift updated successfully')
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/shift/create', { payload })
        if (res.success === false) { setFormError(res.message || 'Creation failed'); return }
        onSave(res.message || 'Shift created successfully')
      }
      onClose()
    } catch {
      setFormError('Failed to save shift. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const sectionTitle = (text: string) => (
    <p className="text-xs font-bold text-t-secondary mt-1 mb-0">{text}</p>
  )

  return (
    <Modal
      title={isEdit ? 'Edit Shift' : 'Add Shift'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="shift-form" isLoading={saving}>
            {isEdit ? 'Update Shift' : 'Add Shift'}
          </Button>
        </>
      }
    >
      {formError && (
        <div className="mb-3 px-3 py-2 border border-red-300 rounded-input text-xs text-red-600">
          {formError}
        </div>
      )}
      <div className="mb-3.5 px-3 py-2 bg-info-bg text-info-text border border-info-text/15 rounded-input text-xs flex items-center gap-2 font-medium">
        <span className="shrink-0 text-sm">ℹ️</span>
        <span>Note: Please enter all time fields in 12-hour format (e.g., 09:00 AM, 06:00 PM).</span>
      </div>
      <form id="shift-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
          {/* ── Left Column ── */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2.5">
              <FormSelect label="Branch" value={form.branch_id} onChange={e => handleBranchChange(e.target.value)} onBlur={() => handleBlur('branch_id')} options={branches.map(b => ({ value: b.id, label: b.branch_name }))} placeholder="Select branch" error={errors.branch_id} touched={touched.branch_id} required disabled={!isAdmin} />
              <FormInput label="Shift Name" value={form.shift_name} onChange={e => set('shift_name', e.target.value)} onBlur={() => handleBlur('shift_name')} placeholder="Shift A" error={errors.shift_name} touched={touched.shift_name} required />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <FormSelect label="Type" value={form.type} onChange={e => { set('type', e.target.value); setTouched(t => ({ ...t, type: true })); setErrors(er => ({ ...er, type: validateField(e.target.value, rules.type) })) }} options={SHIFT_TYPES} placeholder="Select type" error={errors.type} touched={touched.type} required />
            </div>

            {sectionTitle('Shift window')}
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Start time" type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} onBlur={() => handleBlur('start_time')} error={errors.start_time} touched={touched.start_time} required />
              <FormInput label="End time" type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} onBlur={() => handleBlur('end_time')} error={errors.end_time} touched={touched.end_time} required />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput
                label="Buffer login"
                type="time"
                value={form.start_buffer_time}
                onChange={e => set('start_buffer_time', e.target.value)}
                onBlur={() => handleBlur('start_buffer_time')}
                placeholder="00:10"
                error={errors.start_buffer_time}
                touched={touched.start_buffer_time}
                required
              />
              <FormInput
                label="Buffer logout"
                type="time"
                value={form.end_buffer_time}
                onChange={e => set('end_buffer_time', e.target.value)}
                onBlur={() => handleBlur('end_buffer_time')}
                placeholder="00:15"
                error={errors.end_buffer_time}
                touched={touched.end_buffer_time}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Hours" value={form.hrs} onChange={e => set('hrs', e.target.value)} onBlur={() => handleBlur('hrs')} placeholder="8" error={errors.hrs} touched={touched.hrs} required readOnly />
              <FormInput label="Break (mins)" value={form.breakMins} onChange={e => set('breakMins', e.target.value)} onBlur={() => handleBlur('breakMins')} placeholder="30" error={errors.breakMins} touched={touched.breakMins} required readOnly />
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="flex flex-col gap-3 md:border-l md:border-header-line md:pl-6 pt-3 md:pt-0">
            {sectionTitle('Meal break')}
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Meal start" type="time" value={form.lunch_start} onChange={e => set('lunch_start', e.target.value)} onBlur={() => handleBlur('lunch_start')} error={errors.lunch_start} touched={touched.lunch_start} />
              <FormInput label="Meal end" type="time" value={form.lunch_end} onChange={e => set('lunch_end', e.target.value)} onBlur={() => handleBlur('lunch_end')} error={errors.lunch_end} touched={touched.lunch_end} />
            </div>

            {sectionTitle('Short Break -1')}
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Break start" type="time" value={form.mrg_break_start} onChange={e => set('mrg_break_start', e.target.value)} onBlur={() => handleBlur('mrg_break_start')} error={errors.mrg_break_start} touched={touched.mrg_break_start} />
              <FormInput label="Break end" type="time" value={form.mrg_break_end} onChange={e => set('mrg_break_end', e.target.value)} onBlur={() => handleBlur('mrg_break_end')} error={errors.mrg_break_end} touched={touched.mrg_break_end} />
            </div>

            {sectionTitle('Short Break -2')}
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Break start" type="time" value={form.evg_break_start} onChange={e => set('evg_break_start', e.target.value)} onBlur={() => handleBlur('evg_break_start')} error={errors.evg_break_start} touched={touched.evg_break_start} />
              <FormInput label="Break end" type="time" value={form.evg_break_end} onChange={e => set('evg_break_end', e.target.value)} onBlur={() => handleBlur('evg_break_end')} error={errors.evg_break_end} touched={touched.evg_break_end} />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}
