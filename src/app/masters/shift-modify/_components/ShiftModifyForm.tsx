'use client'

import { useState, useEffect } from 'react'
import { apiCall } from '@/services/apiClient'
import { validateField, validateAll, hasErrors } from '@/lib/validation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { type Shift, type BranchOption, type ZoneOption, type TeamOption, type FormField, type FormErrors, type Touched, rules, SHIFT_TYPES } from './types'
import { useBranchAccess } from '@/hooks/useBranchAccess'
interface ShiftModifyFormProps {
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
  // if (values.lunch_start && values.lunch_end && values.lunch_start >= values.lunch_end) {
  //   crossErrors.lunch_end = 'Lunch end must be after lunch start'
  // }
  // if (values.mrg_break_start && values.mrg_break_end && values.mrg_break_start >= values.mrg_break_end) {
  //   crossErrors.mrg_break_end = 'Morning break end must be after break start'
  // }
  // if (values.evg_break_start && values.evg_break_end && values.evg_break_start >= values.evg_break_end) {
  //   crossErrors.evg_break_end = 'Evening break end must be after break start'
  // }

  const filteredErrors: FormErrors = {}
  for (const key of Object.keys(rules) as FormField[]) {
    if (currentTouched[key]) {
      const err = baseErrors[key] || crossErrors[key]
      if (err) filteredErrors[key] = err
    }
  }

  const crossKeys: FormField[] = ['end_time', 'end_buffer_time', 'lunch_end', 'mrg_break_end', 'evg_break_end']
  for (const key of crossKeys) {
    if (currentTouched[key] && crossErrors[key]) {
      filteredErrors[key] = crossErrors[key]
    }
  }

  return filteredErrors
}

export default function ShiftModifyForm({ shift, branches, onClose, onSave }: ShiftModifyFormProps) {
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

  const parseDateToIso = (dateStr?: string): string => {
    if (!dateStr) return ''
    const s = String(dateStr).trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
    if (/^\d{2}-\d{2}-\d{4}/.test(s)) {
      const [dd, mm, yyyy] = s.slice(0, 10).split('-')
      return `${yyyy}-${mm}-${dd}`
    }
    return s
  }

  const parseBreakTime = (time?: string) => {
    if (!time) return ''
    const t = String(time).trim()
    if (t === '00:00:00' || t === '00:00' || t === '12:00 AM' || t === '12:00:00 AM') return ''
    return convert12To24(time)
  }

  const [form, setForm] = useState({
    shift_id: shift?.shift_id?.toString() ?? shift?.id?.toString() ?? '',
    shift_name: shift?.shift_name ?? '',
    type: shift?.type ?? '',
    start_time: convert12To24(shift?.start_time ?? shift?.start),
    end_time: convert12To24(shift?.end_time ?? shift?.end),
    hrs: String(shift?.hrs ?? ''),
    breakMins: String(shift?.breakMins ?? shift?.break ?? ''),
    start_buffer_time: convert12To24(shift?.start_buffer_time),
    end_buffer_time: convert12To24(shift?.end_buffer_time),
    branch_id:
      shift?.branch_id?.toString() ??
      (!isAdmin && branchId ? String(branchId) : ''),
    team_id: shift?.team_id?.toString() ?? '',
    from_date: parseDateToIso(shift?.from_date || shift?.date),
    to_date: parseDateToIso(shift?.to_date || shift?.date),
    lunch_start: parseBreakTime(shift?.lunch_start),
    lunch_end: parseBreakTime(shift?.lunch_end),
    mrg_break_start: parseBreakTime(shift?.mrg_break_start),
    mrg_break_end: parseBreakTime(shift?.mrg_break_end),
    evg_break_start: parseBreakTime(shift?.evg_break_start),
    evg_break_end: parseBreakTime(shift?.evg_break_end),
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})
  const [formError, setFormError] = useState('')
  const [shifts, setShifts] = useState<any[]>([])
  const [shiftDetails, setShiftDetails] = useState<any[]>([])
  const [shiftsLoading, setShiftsLoading] = useState(false)
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [teamsLoading, setTeamsLoading] = useState(false)



  useEffect(() => {
    if (!form.branch_id) {
      setShifts([])
      return
    }
    setShiftsLoading(true)
    apiCall<any>('/dropdown/shiftname', {
      method: 'GET',
      encrypt: false,
      payload: { branch_id: form.branch_id },
    })
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setShifts(res.data)
        } else if (Array.isArray(res)) {
          setShifts(res)
        } else {
          setShifts([])
        }
      })
      .catch(err => {
        console.error('Failed to fetch shifts', err)
        setShifts([])
      })
      .finally(() => setShiftsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.branch_id])

  useEffect(() => {
    apiCall<any>('/dropdown/shiftList', {
      method: 'GET',
      encrypt: false,
      payload: { branch_id: !isAdmin && branchId ? String(branchId) : undefined }
    })
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setShiftDetails(res.data)
        } else if (Array.isArray(res)) {
          setShiftDetails(res)
        }
      })
      .catch(err => {
        console.error('Failed to fetch shift list', err)
      })
  }, [])

  useEffect(() => {
    const targetBranch = form.branch_id || (!isAdmin && branchId ? String(branchId) : undefined)
    setTeamsLoading(true)
    apiCall<any>('/dropdown/teamlist', {
      method: 'GET',
      encrypt: false,
      payload: { branch_id: targetBranch }
    })
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          const list = targetBranch ? res.data.filter((t: any) => !t.branch_id || String(t.branch_id) === String(targetBranch)) : res.data
          setTeams(list.length > 0 ? list : res.data)
        } else if (Array.isArray(res)) {
          const list = targetBranch ? res.filter((t: any) => !t.branch_id || String(t.branch_id) === String(targetBranch)) : res
          setTeams(list.length > 0 ? list : res)
        } else {
          setTeams([])
        }
      })
      .catch(err => {
        console.error('Failed to fetch teams', err)
        setTeams([])
      })
      .finally(() => setTeamsLoading(false))
  }, [form.branch_id, branchId, isAdmin])


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

  const handleShiftChange = (shiftName: string) => {
    setForm(f => {
      const branchShift = shifts.find(s => s.shift_name === shiftName)
      const selectedShift = shiftDetails.find(s => s.shift_name === shiftName)
      const updated = {
        ...f,
        shift_id: branchShift ? String(branchShift.shift_id) : (selectedShift ? String(selectedShift.id) : ''),
        shift_name: shiftName,
        ...(selectedShift ? {
          type: selectedShift.type || f.type,
          start_time: selectedShift.start?.slice(0, 5) || selectedShift.start_time?.slice(0, 5) || f.start_time,
          end_time: selectedShift.end?.slice(0, 5) || selectedShift.end_time?.slice(0, 5) || f.end_time,
          hrs: selectedShift.hrs !== undefined ? String(selectedShift.hrs) : f.hrs,
          breakMins: selectedShift.breakMins !== undefined ? String(selectedShift.breakMins) : (selectedShift.break !== undefined ? String(selectedShift.break) : f.breakMins),
          start_buffer_time: selectedShift.start_buffer_time?.slice(0, 5) || f.start_buffer_time,
          end_buffer_time: selectedShift.end_buffer_time?.slice(0, 5) || f.end_buffer_time,
          lunch_start: parseBreakTime(selectedShift.lunch_start),
          lunch_end: parseBreakTime(selectedShift.lunch_end),
          mrg_break_start: parseBreakTime(selectedShift.mrg_break_start),
          mrg_break_end: parseBreakTime(selectedShift.mrg_break_end),
          evg_break_start: parseBreakTime(selectedShift.evg_break_start),
          evg_break_end: parseBreakTime(selectedShift.evg_break_end),
        } : {})
      }
      setErrors(getFormErrors(updated, { ...touched, shift_name: true }))
      return updated
    })
    setTouched(t => ({ ...t, shift_name: true }))
  }

  const handleBranchChange = (val: string) => {
    setForm(f => {
      const updated = { ...f, branch_id: val, shift_name: '', type: '', team_id: '' }
      setErrors(getFormErrors(updated, { ...touched, branch_id: true }))
      return updated
    })
    setTouched(t => ({ ...t, branch_id: true }))
  }

  const getDatesInRange = (startDate: string, endDate: string) => {
    const dates: string[] = []
    const current = new Date(startDate)
    const end = new Date(endDate)
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: Touched = {
      shift_name: true, type: true, start_time: true, end_time: true, hrs: true, breakMins: true, branch_id: true,
      start_buffer_time: true, end_buffer_time: true,
      lunch_start: true, lunch_end: true,
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
      const { from_date, to_date, team_id, ...restForm } = form
      // Only include team_id if user actually selected a team
      const teamPayload = team_id ? { team_id } : {}
      const finalFromDate = parseDateToIso(from_date)
      const finalToDate = parseDateToIso(to_date) || finalFromDate

      if (isEdit) {
        const payload = {
          uuid: String(shift.uuid),
          shift_name: String(form.shift_name),
          shift_id: String(shift.shift_id ?? form.shift_id ?? shift.id),
          team_id: String(form.team_id || shift.team_id || ''),
          type: String(form.type),
          start_time: String(form.start_time),
          end_time: String(form.end_time),
          hrs: String(Math.round(Number(form.hrs) || 0)),
          breakMins: String(Math.round(Number(form.breakMins) || 0)),
          start_buffer_time: String(form.start_buffer_time || '00:00'),
          end_buffer_time: String(form.end_buffer_time || '00:00'),
          branch_id: String(form.branch_id || shift.branch_id),
          lunch_start: String(form.lunch_start || '00:00'),
          lunch_end: String(form.lunch_end || '00:00'),
          mrg_break_start: String(form.mrg_break_start || '00:00'),
          mrg_break_end: String(form.mrg_break_end || '00:00'),
          evg_break_start: String(form.evg_break_start || '00:00'),
          evg_break_end: String(form.evg_break_end || '00:00'),
          from_date: String(finalFromDate),
          to_date: String(finalToDate),
        }
        const res = await apiCall<{ success?: boolean; message?: string }>('/shiftmodify/update', { payload })
        if (res.success === false) { setFormError(res.message || 'Update failed'); return }
        onSave(res.message || 'Shift updated successfully')
      } else {
        const payload = {
          ...restForm,
          ...teamPayload,
          from_date: finalFromDate,
          to_date: finalToDate,
        }
        const res = await apiCall<{ success?: boolean; message?: string }>('/shiftmodify/create', { payload })
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
      title={isEdit ? 'Edit Shift Allocation' : 'Add Shift Allocation'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="shift-modify-form" isLoading={saving}>
            {isEdit ? 'Update Shift Allocation' : 'Add Shift Allocation'}
          </Button>
        </>
      }
    >
      {formError && (
        <div className="mb-3 px-3 py-2 border border-red-300 rounded-input text-xs text-red-600">
          {formError}
        </div>
      )}
      {/* <div className="mb-3.5 px-3 py-2 bg-info-bg text-info-text border border-info-text/15 rounded-input text-xs flex items-center gap-2 font-medium">
        <span className="shrink-0 text-sm">ℹ️</span>
        <span>Note: Please enter all time fields in 12-hour format (e.g., 09:00 AM, 06:00 PM).</span>
      </div> */}
      {/* {(() => {
        const selectedShift = shiftDetails.find(s => s.shift_name === form.shift_name)
        if (!selectedShift) return null
        return (
          <div className="mb-4 p-3 bg-secondary-bg/50 border border-border rounded-input text-xs">
            <h4 className="font-semibold text-t-primary mb-2 flex items-center gap-1">
              <span>🕒</span> Original Shift Details: <span className="text-accent">{selectedShift.shift_name}</span> ({selectedShift.type})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-t-body">
              <div><strong>Shift Window:</strong> {selectedShift.start?.slice(0, 5) || selectedShift.start_time?.slice(0, 5) || '—'} - {selectedShift.end?.slice(0, 5) || selectedShift.end_time?.slice(0, 5) || '—'}</div>
              <div><strong>Buffer:</strong> {selectedShift.start_buffer_time?.slice(0, 5) || '—'} / {selectedShift.end_buffer_time?.slice(0, 5) || '—'}</div>
              <div><strong>Lunch:</strong> {selectedShift.lunch_start?.slice(0, 5) || '—'} - {selectedShift.lunch_end?.slice(0, 5) || '—'}</div>
              <div><strong>Morn Break:</strong> {selectedShift.mrg_break_start?.slice(0, 5) || '—'} - {selectedShift.mrg_break_end?.slice(0, 5) || '—'}</div>
              <div><strong>Eve Break:</strong> {selectedShift.evg_break_start?.slice(0, 5) || '—'} - {selectedShift.evg_break_end?.slice(0, 5) || '—'}</div>
              <div><strong>Hours / Break:</strong> {selectedShift.hrs || '—'} hrs / {selectedShift.breakMins || selectedShift.break || '—'} mins</div>
            </div>
          </div>
        )
      })()} */}
      <form id="shift-modify-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
          {/* ── Left Column ── */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2.5">
              <FormSelect label="Branch" value={form.branch_id} onChange={e => handleBranchChange(e.target.value)} onBlur={() => handleBlur('branch_id')} options={branches.map(b => ({ value: b.id, label: b.branch_name }))} placeholder="Select branch" error={errors.branch_id} touched={touched.branch_id} required disabled={!isAdmin} />
              <FormSelect
                label="Shift Name"
                value={form.shift_name}
                onChange={e => handleShiftChange(e.target.value)}
                onBlur={() => handleBlur('shift_name')}
                options={shifts.map(s => ({ value: s.shift_name, label: s.shift_name }))}
                placeholder={
                  !form.branch_id ? 'Select branch first'
                    : shiftsLoading ? 'Loading...'
                      : 'Select shift'
                }
                error={errors.shift_name}
                touched={touched.shift_name}
                disabled={!form.branch_id || shiftsLoading}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <FormSelect label="Type" value={form.type} onChange={e => { set('type', e.target.value); setTouched(t => ({ ...t, type: true })); setErrors(er => ({ ...er, type: validateField(e.target.value, rules.type) })) }} options={SHIFT_TYPES} placeholder="Select type" error={errors.type} touched={touched.type} required disabled />
              <FormSelect
                label="Team"
                value={form.team_id}
                onChange={e => { set('team_id', e.target.value); setTouched(t => ({ ...t, team_id: true })) }}
                onBlur={() => handleBlur('team_id')}
                options={teams.map(t => ({ value: String(t.id), label: t.team_name }))}
                placeholder={
                  !form.branch_id && isAdmin ? 'Select branch first'
                    : teamsLoading ? 'Loading...'
                      : 'Select team'
                }
                disabled={(!form.branch_id && isAdmin) || teamsLoading}
              />
            </div>

            {sectionTitle('Shift window')}
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Start time" type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} onBlur={() => handleBlur('start_time')} error={errors.start_time} touched={touched.start_time} required readOnly />
              <FormInput label="End time" type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} onBlur={() => handleBlur('end_time')} error={errors.end_time} touched={touched.end_time} required readOnly />
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
                readOnly
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
                readOnly
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Hours" value={form.hrs} onChange={e => set('hrs', e.target.value)} onBlur={() => handleBlur('hrs')} placeholder="8" error={errors.hrs} touched={touched.hrs} required readOnly />
              <FormInput label="Break (mins)" value={form.breakMins} onChange={e => set('breakMins', e.target.value)} onBlur={() => handleBlur('breakMins')} placeholder="30" error={errors.breakMins} touched={touched.breakMins} readOnly />
            </div>
            <DateRangePicker
              label="Date Range"
              startDate={form.from_date}
              endDate={form.to_date}
              onChange={(start, end) => {
                set('from_date', start)
                set('to_date', end)
              }}
              required
            />
          </div>

          {/* ── Right Column ── */}
          <div className="flex flex-col gap-3 md:border-l md:border-header-line md:pl-6 pt-3 md:pt-0">
            {sectionTitle('Meal break')}
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Meal start" type="time" value={form.lunch_start} onChange={e => set('lunch_start', e.target.value)} onBlur={() => handleBlur('lunch_start')} error={errors.lunch_start} touched={touched.lunch_start} readOnly />
              <FormInput label="Meal end" type="time" value={form.lunch_end} onChange={e => set('lunch_end', e.target.value)} onBlur={() => handleBlur('lunch_end')} error={errors.lunch_end} touched={touched.lunch_end} readOnly />
            </div>

            {sectionTitle('Short Break -1')}
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Break start" type="time" value={form.mrg_break_start} onChange={e => set('mrg_break_start', e.target.value)} onBlur={() => handleBlur('mrg_break_start')} error={errors.mrg_break_start} touched={touched.mrg_break_start} readOnly />
              <FormInput label="Break end" type="time" value={form.mrg_break_end} onChange={e => set('mrg_break_end', e.target.value)} onBlur={() => handleBlur('mrg_break_end')} error={errors.mrg_break_end} touched={touched.mrg_break_end} readOnly />
            </div>

            {sectionTitle('Short Break -2')}
            <div className="grid grid-cols-2 gap-2.5">
              <FormInput label="Break start" type="time" value={form.evg_break_start} onChange={e => set('evg_break_start', e.target.value)} onBlur={() => handleBlur('evg_break_start')} error={errors.evg_break_start} touched={touched.evg_break_start} readOnly />
              <FormInput label="Break end" type="time" value={form.evg_break_end} onChange={e => set('evg_break_end', e.target.value)} onBlur={() => handleBlur('evg_break_end')} error={errors.evg_break_end} touched={touched.evg_break_end} readOnly />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}
