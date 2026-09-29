'use client'

import { useState, useEffect, useRef } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import { validateField, validateAll, hasErrors } from '@/lib/validation'
import type { Zone, CompanyOption, BranchOption, FormField, FormErrors, Touched } from './types'
import { rules } from './types'
import { useBranchAccess } from '@/hooks/useBranchAccess'

interface Props {
  editZone: Zone | null
  companies: CompanyOption[]
  allBranches: BranchOption[]
  saving: boolean
  formError: string | null
  onSave: (payload: Record<string, unknown>) => void
  onClose: () => void
}

export default function ZoneForm({ editZone, companies, allBranches, saving, formError, onSave, onClose }: Props) {
  const [companyId, setCompanyId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [zoneName, setZoneName] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})
  const [noChange, setNoChange] = useState(false)
  const initialRef = useRef<{ companyId: string; branchId: string; zoneName: string } | null>(null)
  const { branchId: userBranchId, isAdmin } = useBranchAccess()

  useEffect(() => {
    console.log('Edit Zone:', editZone)
    if (editZone) {
      const initial = {
        companyId: editZone.company_id?.toString() ?? '',
        branchId: editZone.branch_id?.toString() ?? '',
        zoneName: editZone.zone_name ?? '',
        uuid: editZone.uuid ?? '',
      }
      setCompanyId(initial.companyId)
      setBranchId(initial.branchId)
      setZoneName(initial.zoneName)
      initialRef.current = initial
    } else {
      if (!isAdmin && userBranchId) {
  const branch = allBranches.find(b => b.id === Number(userBranchId))

  setCompanyId(branch?.company_id?.toString() ?? '')
  setBranchId(String(userBranchId))
} else {
  setCompanyId('')
  setBranchId('')
}

setZoneName('')
initialRef.current = null
    }
    setErrors({})
    setTouched({})
    setNoChange(false)
  }, [editZone,isAdmin, userBranchId, allBranches])

  const filteredBranches = allBranches.filter(b => b.company_id === parseInt(companyId))

  const handleCompanyChange = (val: string) => {
    setCompanyId(val)
    setBranchId('')
    setTouched(t => ({ ...t, company_id: true }))
    setErrors(e => ({ ...e, company_id: validateField(val, rules.company_id) }))
  }

  const handleBranchChange = (val: string) => {
    setBranchId(val)
    setTouched(t => ({ ...t, branch_id: true }))
    setErrors(e => ({ ...e, branch_id: validateField(val, rules.branch_id) }))
  }

  const handleZoneNameChange = (val: string) => {
    setZoneName(val)
    if (touched.zone_name) {
      setErrors(e => ({ ...e, zone_name: validateField(val, rules.zone_name) }))
    }
  }

  const handleBlur = (key: FormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    const val = key === 'company_id' ? companyId : key === 'branch_id' ? branchId : zoneName
    setErrors(e => ({ ...e, [key]: validateField(val, rules[key]) }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ company_id: true, branch_id: true, zone_name: true })
    const formData = { company_id: companyId, branch_id: branchId, zone_name: zoneName }
    const allErrors = validateAll(formData, rules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return

    if (editZone && initialRef.current &&
      companyId === initialRef.current.companyId &&
      branchId === initialRef.current.branchId &&
      zoneName === initialRef.current.zoneName) {
      setNoChange(true)
      return
    }
    setNoChange(false)

    const payload: Record<string, unknown> = {
      zone_name: zoneName,
      company_id: companyId,
      branch_id: branchId,
      uuid: editZone?.uuid || '',
      id: editZone?.id || '',
    }
    onSave(payload)
  }

  const footer = (
    <>
      <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
      <Button variant="primary" type="submit" form="zone-form" isLoading={saving}>
        {editZone ? 'Update Zone' : 'Add Zone'}
      </Button>
    </>
  )

  return (
    <Modal title={editZone ? 'Edit Zone' : 'Add Zone'} onClose={onClose} footer={footer}>
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
      <form id="zone-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormSelect
          label="Company"
          value={companyId}
          onChange={e => handleCompanyChange(e.target.value)}
          onBlur={() => handleBlur('company_id')}
          options={companies.map(c => ({ value: c.id, label: c.company_name }))}
          placeholder="Select company"
          error={errors.company_id}
          touched={touched.company_id}
          required
          disabled={!isAdmin}
          
        />

        <FormSelect
          label="Branch"
          value={branchId}
          onChange={e => handleBranchChange(e.target.value)}
          onBlur={() => handleBlur('branch_id')}
          options={filteredBranches.map(b => ({ value: b.id, label: b.branch_name }))}
          placeholder={companyId ? 'Select branch' : 'Select company first'}
           disabled={!companyId || !isAdmin}
          error={errors.branch_id}
          touched={touched.branch_id}
          required
         

        />

        <FormInput
          label="Zone Name"
          value={zoneName}
          onChange={e => handleZoneNameChange(e.target.value)}
          onBlur={() => handleBlur('zone_name')}
          placeholder="Enter zone name"
          error={errors.zone_name}
          touched={touched.zone_name}
          required
        />
      </form>
    </Modal>
  )
}
