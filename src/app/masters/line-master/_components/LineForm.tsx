'use client'

import { useState, useEffect, useRef } from 'react'
import { apiCall } from '@/services/apiClient'
import { validateField, validateAll, hasErrors } from '@/lib/validation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import {
  type Line,
  type CompanyOption,
  type BranchOption,
  type ZoneOption,
  type FormSlot,
  type FormErrors,
  type FormField,
  type Touched,
  formRules,
} from './types'

interface LineFormProps {
  line: Line | null
  companies: CompanyOption[]
  allBranches: BranchOption[]
  allZones: ZoneOption[]
  onClose: () => void
  onSave: (msg: string) => void
}

const getCurrentTime = () => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export default function LineForm({
  line, companies, allBranches, allZones, onClose, onSave,
}: LineFormProps) {
  const isEdit = !!line
  const [companyId, setCompanyId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [lineName, setLineName] = useState('')
  const [slots, setSlots] = useState<FormSlot[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})
  const [noChange, setNoChange] = useState(false)
  const [formError, setFormError] = useState('')
  const { branchId: userBranchId, isAdmin } = useBranchAccess()

  const initialFormRef = useRef<{
    companyId: string
    branchId: string
    zoneId: string
    lineName: string
    slots: { slot_name: string; start_time: string; end_time: string }[]
  } | null>(null)

  useEffect(() => {
    if (line) {
      const targetZone = allZones.find(z => z.id === line.zone_id)
      const targetBranch = allBranches.find(b => b.id === line.branch_id)
      const initCompanyId = (targetZone?.company_id ?? targetBranch?.company_id ?? line.zone?.company_id)?.toString() ?? ''
      const initBranchId = (line.branch_id ?? targetZone?.branch_id)?.toString() ?? ''
      const initZoneId = line.zone_id?.toString() ?? ''
      const initLineName = line.line_name ?? ''

      const targetCompany = companies.find(c => c.id === parseInt(initCompanyId))
      const companyMaxSlot = targetCompany?.max_slot ?? 1
      const lineSlotsCount = line.slots?.length ?? 0
      const slotCount = Math.max(companyMaxSlot, lineSlotsCount, 1)

      const computedSlots: FormSlot[] = Array.from({ length: slotCount }, (_, i) => {
        const s = line.slots?.[i]
        if (s) {
          return {
            slot_name: s.slot_name ?? `Slot ${i + 1}`,
            start_time: s.start?.slice(0, 5) || '',
            end_time: s.end?.slice(0, 5) || '',
            _key: s.id?.toString() ?? `slot-${i}`,
          }
        }
        return {
          slot_name: `Slot ${i + 1}`,
          start_time: '',
          end_time: '',
          _key: `slot-${i}`,
        }
      })

      setCompanyId(initCompanyId)
      setBranchId(initBranchId)
      setZoneId(initZoneId)
      setLineName(initLineName)
      setSlots(computedSlots)

      initialFormRef.current = {
        companyId: initCompanyId,
        branchId: initBranchId,
        zoneId: initZoneId,
        lineName: initLineName,
        slots: computedSlots.map(s => ({
          slot_name: s.slot_name,
          start_time: s.start_time,
          end_time: s.end_time,
        })),
      }
    } else {
      let initCompanyId = ''
      let initBranchId = ''
      if (!isAdmin && userBranchId) {
        const branch = allBranches.find(
          b => b.id === Number(userBranchId)
        )
        initCompanyId = branch?.company_id?.toString() ?? ''
        initBranchId = String(userBranchId)
      }

      setCompanyId(initCompanyId)
      setBranchId(initBranchId)
      setZoneId('')
      setLineName('')

      const targetCompany = initCompanyId ? companies.find(c => c.id === parseInt(initCompanyId)) : null
      const slotCount = targetCompany?.max_slot ?? 1
      const current = getCurrentTime()
      setSlots(
        Array.from({ length: slotCount }, (_, i) => ({
          slot_name: `Slot ${i + 1}`,
          start_time: current,
          end_time: '',
          _key: `slot-0-${i}`,
        }))
      )

      initialFormRef.current = null
    }
    setErrors({})
    setTouched({})
    setNoChange(false)
  }, [line, isAdmin, userBranchId, allBranches, allZones, companies])

  const filteredBranches = companyId ? allBranches.filter(b => b.company_id === parseInt(companyId)) : allBranches
  const filteredZones = allZones.filter(z => {
    if (companyId && z.company_id && z.company_id !== parseInt(companyId)) return false
    if (branchId && z.branch_id && z.branch_id !== parseInt(branchId)) return false
    return true
  })

  const handleBlur = (key: FormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    const val = key === 'company_id' ? companyId : key === 'branch_id' ? branchId : key === 'zone_id' ? zoneId : lineName
    setErrors(e => ({ ...e, [key]: validateField(val, formRules[key]) }))
  }

  const handleCompanyChange = (val: string) => {
    setCompanyId(val)
    setBranchId('')
    setZoneId('')
    setTouched(t => ({ ...t, company_id: true }))
    setErrors(e => ({ ...e, company_id: validateField(val, formRules.company_id) }))
    setNoChange(false)

    const company = companies.find(c => c.id === parseInt(val))
    const slotCount = company?.max_slot ?? 1
    const current = getCurrentTime()
    setSlots(
      Array.from({ length: slotCount }, (_, i) => ({
        slot_name: `Slot ${i + 1}`,
        start_time: current,
        end_time: '',
        _key: `slot-${Date.now()}-${i}`,
      }))
    )
  }

  const handleBranchChange = (val: string) => {
    setBranchId(val)
    setZoneId('')
    setTouched(t => ({ ...t, branch_id: true }))
    setErrors(e => ({ ...e, branch_id: validateField(val, formRules.branch_id) }))
    setNoChange(false)
  }

  const updateSlot = (i: number, key: keyof FormSlot, val: string) => {
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s))
    setNoChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const allTouched: Touched = { company_id: true, branch_id: true, zone_id: true, line_name: true }
    setTouched(allTouched)
    const formData = { company_id: companyId, branch_id: branchId, zone_id: zoneId, line_name: lineName }
    const allErrors = validateAll(formData, formRules)
    const validSlots = slots
      .filter(s => s.slot_name && s.start_time && s.end_time)
    const slotsError = validSlots.length === 0 ? 'At least one complete slot is required' : undefined
    setErrors({ ...allErrors, slots: slotsError } as FormErrors)
    if (hasErrors(allErrors) || slotsError) return

    const currentSlots = slots.map(s => ({
      slot_name: s.slot_name,
      start_time: s.start_time,
      end_time: s.end_time,
    }))

    const isUnchanged =
      isEdit &&
      initialFormRef.current &&
      companyId === initialFormRef.current.companyId &&
      branchId === initialFormRef.current.branchId &&
      zoneId === initialFormRef.current.zoneId &&
      lineName === initialFormRef.current.lineName &&
      JSON.stringify(currentSlots) === JSON.stringify(initialFormRef.current.slots)

    if (isUnchanged) {
      setNoChange(true)
      return
    }
    setNoChange(false)

    setSaving(true)
    setFormError('')
    try {
      const payload: Record<string, unknown> = {
        zone_id: zoneId,
        branch_id: branchId,
        line_name: lineName,
        slots: validSlots.map(s => ({ slot_name: s.slot_name, start_time: s.start_time, end_time: s.end_time })),
      }

      if (isEdit) {
        payload.uuid = line.uuid
        const res = await apiCall<{ success?: boolean; message?: string }>('/line/update', { payload })
        if (res.success === false) { setFormError(res.message || 'Update failed'); return }
        onSave(res.message || 'Line updated successfully')
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/line/create', { payload })
        if (res.success === false) { setFormError(res.message || 'Creation failed'); return }
        onSave(res.message || 'Line created successfully')
      }
      onClose()
    } catch {
      setFormError('Failed to save line. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Line' : 'Add Line'}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="line-form" isLoading={saving}>
            {isEdit ? 'Update Line' : 'Add Line'}
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
      <form id="line-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormSelect
          label="Company"
          value={companyId}
          onChange={e => handleCompanyChange(e.target.value)}
          onBlur={() => handleBlur('company_id')}
          touched={touched.company_id}
          options={companies.map(c => ({ value: c.id, label: c.company_name }))}
          placeholder="Select company"
          error={errors.company_id}
          required
          disabled={!isAdmin}
        />

        <div className="grid grid-cols-2 gap-2.5">
          <FormSelect
            label="Branch"
            value={branchId}
            onChange={e => handleBranchChange(e.target.value)}
            onBlur={() => handleBlur('branch_id')}
            touched={touched.branch_id}
            options={filteredBranches.map(b => ({ value: b.id, label: b.branch_name }))}
            placeholder={companyId ? 'Select branch' : 'Select company first'}
            disabled={!companyId || !isAdmin}
            error={errors.branch_id}
            required
          />
          <FormSelect
            label="Zone"
            value={zoneId}
            onChange={e => {
              const val = e.target.value
              setZoneId(val)
              setTouched(t => ({ ...t, zone_id: true }))
              setErrors(er => ({ ...er, zone_id: validateField(val, formRules.zone_id) }))
              setNoChange(false)
            }}
            onBlur={() => handleBlur('zone_id')}
            touched={touched.zone_id}
            options={filteredZones.map(z => ({ value: z.id, label: z.zone_name }))}
            placeholder={branchId ? 'Select zone' : 'Select branch first'}
            disabled={!branchId}
            error={errors.zone_id}
            required
          />
        </div>

        <FormInput
          label="Line Name"
          value={lineName}
          onChange={e => {
            setLineName(e.target.value)
            if (touched.line_name) {
              setErrors(er => ({ ...er, line_name: validateField(e.target.value, formRules.line_name) }))
            }
            setNoChange(false)
          }}
          onBlur={() => handleBlur('line_name')}
          touched={touched.line_name}
          placeholder="Enter line name"
          error={errors.line_name}
          required
        />

        {slots.length > 0 && (
          <div>
            <div className="mb-3">
              <span className="text-xs2 font-bold text-t-lighter tracking-wider uppercase">
                Audit Slot Timings
              </span>
            </div>
            {errors.slots && (
              <span className="text-xs2 text-red-500 mb-2 block">{errors.slots}</span>
            )}
            <div className="flex flex-col gap-3">
              {slots.map((slot, i) => (
                <div key={slot._key ?? `slot-${i}`}>
                  <FormInput
                    label={`Slot ${i + 1} Name`}
                    placeholder="e.g. Morning"
                    value={slot.slot_name}
                    onChange={e => updateSlot(i, 'slot_name', e.target.value)}
                    className="mb-2"
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    <FormInput
                      label="Start Time"
                      type="time"
                      value={slot.start_time || ''}
                      onChange={e => updateSlot(i, 'start_time', e.target.value)}
                    />
                    <FormInput
                      label="End Time"
                      type="time"
                      value={slot.end_time || ''}
                      onChange={e => updateSlot(i, 'end_time', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
