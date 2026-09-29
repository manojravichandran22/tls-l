'use client'

import { useState, useEffect, useRef } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import { fetchBranches } from '@/services/dropdownService'
import { validateField, validateAll, hasErrors } from '@/lib/validation'
import type { Team, FormField, FormErrors, Touched } from './types'
import { rules } from './types'
import { useBranchAccess } from '@/hooks/useBranchAccess'

interface Props {
  editTeam: Team | null
  saving: boolean
  formError: string | null
  onSave: (payload: Record<string, unknown>) => void
  onClose: () => void
}

export default function TeamForm({ editTeam, saving, formError, onSave, onClose }: Props) {
  const [form, setForm] = useState({ team_name: '', branch_id: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})
  const [noChange, setNoChange] = useState(false)
  const [branches, setBranches] = useState<{ value: number, label: string }[]>([])


  const initialFormRef = useRef<typeof form | null>(null)
  const { branchId, isAdmin } = useBranchAccess()

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await fetchBranches()
        //console.log('Branches:',data.map(b => ({id: b.id,name: b.branch_name,})))
        setBranches(data.map(b => ({ value: b.id, label: b.branch_name })))
      } catch (err) {
        //console.error('Failed to fetch branches', err)
      }
    }
    loadBranches()
  }, [])

  useEffect(() => {
    if (editTeam) {
      const initial = {
        team_name: editTeam.team_name ?? '',
        branch_id: editTeam.branch_id ? String(editTeam.branch_id) : ''
      }
      setForm(initial)

      initialFormRef.current = initial
    } else {
      //console.log('Form Branch:', isAdmin ? '' : String(branchId ?? ''))
      setForm({
        team_name: '', branch_id: isAdmin ? '' : String(branchId ?? ''),
      })
      initialFormRef.current = null
    }
    setErrors({})
    setTouched({})
    setNoChange(false)
  }, [editTeam, branchId, isAdmin])

  const set = (key: FormField, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: validateField(val, rules[key]) }))
  }

  const handleBlur = (key: FormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    setErrors(e => ({ ...e, [key]: validateField(form[key], rules[key]) }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ team_name: true, branch_id: true })
    const allErrors = validateAll(form, rules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return

    if (editTeam && initialFormRef.current && JSON.stringify(form) === JSON.stringify(initialFormRef.current)) {
      setNoChange(true)
      return
    }
    setNoChange(false)

    const payload: Record<string, unknown> = {
      team_name: form.team_name,
      branch_id: form.branch_id ? Number(form.branch_id) : '',
    }
    if (editTeam) payload.uuid = editTeam.uuid
    onSave(payload)
  }

  const footer = (
    <>
      <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
      <Button variant="primary" type="submit" form="team-form" isLoading={saving}>
        {editTeam ? 'Update Team' : 'Add Team'}
      </Button>
    </>
  )

  return (
    <Modal title={editTeam ? 'Edit Team' : 'Add Team'} onClose={onClose} footer={footer}>
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
      <form id="team-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FormSelect
          label="Branch"
          value={form.branch_id}
          onChange={e => set('branch_id', e.target.value)}
          onBlur={() => handleBlur('branch_id')}
          options={branches}
          placeholder="Select Branch"
          error={errors.branch_id}
          touched={touched.branch_id}
          required
          disabled={!isAdmin}
        />
        <FormInput
          label="Team Name"
          value={form.team_name}
          onChange={e => set('team_name', e.target.value)}
          onBlur={() => handleBlur('team_name')}
          placeholder="Enter team name"
          error={errors.team_name}
          touched={touched.team_name}
          maxLength={50}
          required
        />
      </form>
    </Modal>
  )
}
