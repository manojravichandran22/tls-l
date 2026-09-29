'use client'

import { useState, useEffect } from 'react'
import { fetchDesignationsByDept, fetchWorkCategoriesByDept, fetchRoles, fetchTeams } from '@/services/dropdownService'
import { validateField, validateAll, hasErrors } from '@/lib/validation'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'
import { apiCall } from '@/services/apiClient'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import {
  type Employee,
  type BranchOption,
  type RoleOption,
  type DeptOption,
  type DesignationOption,
  type WorkCategoryOption,
  type TeamOption,
  type FormField,
  type FormErrors,
  type Touched,
  ACCESS_FLAG_OPTIONS,
  rules,
} from './types'

interface EmployeeFormProps {
  emp: Employee | null
  branches: BranchOption[]
  roles: RoleOption[]
  allDepts: DeptOption[]
  onClose: () => void
  onSaved: (msg: string) => void
}

export default function EmployeeForm({
  emp,
  branches,
  roles,
  allDepts,
  onClose,
  onSaved,
}: EmployeeFormProps) {
  const isEdit = !!emp
  const { branchId: userBranchId, isAdmin } = useBranchAccess()

  const [form, setForm] = useState({
    name: emp?.name ?? '',
    last_name: emp?.last_name ?? '',
    code: emp?.code ?? '',
    mobile: emp?.mobile ?? '',
    role: emp?.role?.toString() ?? '',
    join_date: emp?.join_date ?? '',
    department_id: emp?.department_id?.toString() ?? '',
    branch_id: emp?.branch_id?.toString() ?? (userBranchId ? String(userBranchId) : ''),
    designation_id: emp?.design_id?.toString() ?? '', // <-- FIX
    workcategory_id: emp?.workcategory_id?.toString() ?? '',
    team_id: emp?.team_id?.toString() ?? '',
    access_flag: emp?.access_flag?.toString() ?? '',
    email: emp?.email ?? '',
    rfid_no: emp?.rfid_no ?? emp?.rfid ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Touched>({})
  const [formError, setFormError] = useState('')
  const [designations, setDesignations] = useState<DesignationOption[]>([])
  const [workCategories, setWorkCategories] = useState<WorkCategoryOption[]>([])
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [branchRoles, setBranchRoles] = useState<RoleOption[]>(roles)

  const filteredDepts = allDepts.filter(
    d => !form.branch_id || d.branch_id === parseInt(form.branch_id)
  )

  const set = (key: FormField | 'email' | 'rfid_no', val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    if (key !== 'email' && key !== 'rfid_no' && touched[key as FormField]) {
      setErrors(e => ({ ...e, [key]: validateField(val, rules[key as FormField]) }))
    }
  }

  const handleBlur = (key: FormField) => {
    setTouched(t => ({ ...t, [key]: true }))
    setErrors(e => ({ ...e, [key]: validateField(form[key], rules[key]) }))
  }

  const handleBranchChange = (val: string) => {
    setForm(f => ({ ...f, branch_id: val, department_id: '', role: '', designation_id: '', workcategory_id: '', team_id: '' }));
    setTouched(t => ({ ...t, branch_id: true, department_id: false, role: false, team_id: false }));
    setErrors(e => ({ ...e, branch_id: validateField(val, rules.branch_id), department_id: undefined, role: undefined, team_id: undefined }));
  };

  useEffect(() => {
    if (!form.branch_id) {
      setBranchRoles(roles)
      return
    }
    fetchRoles(form.branch_id)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setBranchRoles(data)
        } else {
          setBranchRoles(roles.filter(r => !r.branch_id || String(r.branch_id) === String(form.branch_id)))
        }
      })
      .catch(() => {
        setBranchRoles(roles.filter(r => !r.branch_id || String(r.branch_id) === String(form.branch_id)))
      })
  }, [form.branch_id, roles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: Touched = {
      name: true,
      last_name: true,
      code: true,
      mobile: true,
      role: true,
      join_date: true,
      department_id: true,
      branch_id: true,
      designation_id: true,
      workcategory_id: true,
      team_id: true,
      access_flag: true,
    }
    setTouched(allTouched)
    const formData = {
      name: form.name,
      last_name: form.last_name,
      code: form.code,
      mobile: form.mobile,
      role: form.role,
      join_date: form.join_date,
      department_id: form.department_id,
      branch_id: form.branch_id,
      designation_id: form.designation_id,
      workcategory_id: form.workcategory_id,
      team_id: form.team_id,
      access_flag: form.access_flag,
    }
    const allErrors = validateAll(formData, rules)
    setErrors(allErrors)
    if (hasErrors(allErrors)) return

    setSaving(true)
    setFormError('')
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        last_name: form.last_name,
        code: form.code,
        mobile: form.mobile,
        role: form.role,
        join_date: form.join_date,
        department_id: form.department_id,
        email: form.email || null,
        designation_id: form.designation_id,
        workcategory_id: form.workcategory_id,
        branch_id: form.branch_id,
        team_id: form.team_id,
        access_flag: form.access_flag,
        rfid: form.rfid_no || null,
      }
      if (isEdit) {
        payload.uuid = emp.uuid
        const res = await apiCall<{ success?: boolean; message?: string }>('/employee/update', { payload })
        if (res.success === false) { setFormError(res.message || 'Update failed'); return }
        onSaved(res.message || 'Employee updated successfully')
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/employee/create', { payload })
        if (res.success === false) { setFormError(res.message || 'Creation failed'); return }
        onSaved(res.message || 'Employee created successfully')
      }
      onClose()
    } catch {
      setFormError('Failed to save employee. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!form.branch_id) {
      setTeams([])
      return
    }
    fetchTeams(form.branch_id)
      .then(data => {
        setTeams(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        setTeams([])
      })
  }, [form.branch_id])

  // Fetch designations whenever department changes
  useEffect(() => {
    if (!form.department_id) {
      setDesignations([]);
      set('designation_id', '');
      return;
    }
    // Use the department‑filtered fetcher
    fetchDesignationsByDept(form.department_id).then(data => {
      console.log('Designations for dept', form.department_id, data);
      setDesignations(data);
    }).catch(err => {
      console.error('Failed to fetch designations', err);
      setDesignations([]);
    });
  }, [form.department_id]);
  useEffect(() => {
    if (!form.department_id) {
      setWorkCategories([]);
      set('workcategory_id', '');
      return;
    }
   

    fetchWorkCategoriesByDept(form.department_id)
      .then(data => {
        console.log('Work Categories:', data);
        setWorkCategories(data);
      })
      .catch(err => {
        console.error('Failed to fetch work categories', err);
        setWorkCategories([]);
      });
  }, [form.department_id]);
  return (
    <Modal
      title={isEdit ? 'Edit Employee' : 'Add Employee'}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="emp-form" isLoading={saving}>
            {isEdit ? 'Update Employee' : 'Add Employee'}
          </Button>
        </>
      }
    >
      {formError && (
        <div className="mb-3 px-3 py-2 border border-red-300 rounded-input text-xs text-red-600">
          {formError}
        </div>
      )}
      <form
        id="emp-form"
        onSubmit={handleSubmit}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
          }
        }}
        className="flex flex-col gap-3"
      >
        <div className="grid grid-cols-2 gap-2.5">
          <FormInput
            label="First Name"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            placeholder="e.g. John"
            error={errors.name}
            touched={touched.name}
            required
          />
          <FormInput
            label="Last Name"
            value={form.last_name}
            onChange={e => set('last_name', e.target.value)}
            onBlur={() => handleBlur('last_name')}
            placeholder="e.g. Doe"
            error={errors.last_name}
            touched={touched.last_name}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <FormInput
            label="Employee Code"
            value={form.code}
            onChange={e => set('code', e.target.value)}
            onBlur={() => handleBlur('code')}
            placeholder="e.g. EMP001"
            error={errors.code}
            touched={touched.code}
            required
          />
          <FormInput
            label="Mobile"
            value={form.mobile}
            onChange={e => set('mobile', e.target.value)}
            onBlur={() => handleBlur('mobile')}
            placeholder="10-digit number"
            error={errors.mobile}
            touched={touched.mobile}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <FormInput
            label="Email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="Optional"
            type="email"
          />
          <FormSelect
            label="Access"
            value={form.access_flag}
            onChange={e => {
              set('access_flag', e.target.value)
              setTouched(t => ({ ...t, access_flag: true }))
              setErrors(er => ({
                ...er,
                access_flag: validateField(e.target.value, rules.access_flag),
              }))
            }}
            onBlur={() => handleBlur('access_flag')}
            options={ACCESS_FLAG_OPTIONS}
            placeholder="Select Access"
            error={errors.access_flag}
            touched={touched.access_flag}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <FormSelect
            label="Branch"
            value={form.branch_id}
            onChange={e => handleBranchChange(e.target.value)}
            onBlur={() => handleBlur('branch_id')}
            options={branches.map(b => ({ value: b.id, label: b.branch_name }))}
            placeholder="Select branch"
            disabled={!isAdmin}
            error={errors.branch_id}
            touched={touched.branch_id}
            required
          />
          <FormSelect
            label="Department"
            value={form.department_id}
            onChange={e => {
              set('department_id', e.target.value);
              // reset dependant fields
              set('designation_id', '');
              set('workcategory_id', '');
              setTouched(t => ({ ...t, department_id: true, designation_id: true, workcategory_id: true }));
              setErrors(er => ({ ...er, department_id: validateField(e.target.value, rules.department_id), designation_id: undefined, workcategory_id: undefined }));
            }}
            onBlur={() => handleBlur('department_id')}
            options={filteredDepts.map(d => ({ value: d.id, label: d.name }))}
            placeholder={form.branch_id ? 'Select department' : 'Select branch first'}
            disabled={!form.branch_id}
            error={errors.department_id}
            touched={touched.department_id}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <FormSelect
            label="Designation"
            value={form.designation_id}
            onChange={e => {
              set('designation_id', e.target.value);
              setTouched(t => ({ ...t, designation_id: true }));
              setErrors(er => ({ ...er, designation_id: validateField(e.target.value, rules.designation_id) }));
            }}
            onBlur={() => handleBlur('designation_id')}
            options={designations.map(d => ({ value: d.id, label: d.name ?? d.designation_name ?? '' }))}
            placeholder={form.department_id ? 'Select designation' : 'Select department first'}
            disabled={!form.department_id}
            error={errors.designation_id}
            touched={touched.designation_id}
            required
          />
          <FormSelect
            label="Work Category"
            value={form.workcategory_id}
            onChange={e => {
              set('workcategory_id', e.target.value);
              setTouched(t => ({ ...t, workcategory_id: true }));
              setErrors(er => ({ ...er, workcategory_id: validateField(e.target.value, rules.workcategory_id) }));
            }}
            onBlur={() => handleBlur('workcategory_id')}
            options={workCategories.map(w => ({ value: w.id.toString(), label: w.name ?? w.work_category_name ?? '' }))}
            placeholder={form.department_id ? 'Select work category' : 'Select department first'}
            disabled={!form.department_id}
            error={errors.workcategory_id}
            touched={touched.workcategory_id}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <FormSelect
            label="Team"
            value={form.team_id}
            onChange={e => {
              set('team_id', e.target.value)
              setTouched(t => ({ ...t, team_id: true }))
              setErrors(er => ({
                ...er,
                team_id: validateField(e.target.value, rules.team_id),
              }))
            }}
            onBlur={() => handleBlur('team_id')}
            options={teams.map(team => ({
              value: team.id,
              label: team.team_name,
            }))}
            placeholder={form.branch_id ? 'Select Team' : 'Select branch first'}
            disabled={!form.branch_id}
            error={errors.team_id}
            touched={touched.team_id}
            required
          />
          <FormSelect
            label="Role"
            value={form.role}
            onChange={e => {
              set('role', e.target.value);
              setTouched(t => ({ ...t, role: true }));
              setErrors(er => ({ ...er, role: validateField(e.target.value, rules.role) }));
            }}
            onBlur={() => handleBlur('role')}
            options={branchRoles.map(r => ({ value: r.role ?? r.id, label: r.name }))}
            placeholder={form.branch_id ? 'Select role' : 'Select branch first'}
            disabled={!form.branch_id}
            error={errors.role}
            touched={touched.role}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <FormInput
            label="Join Date"
            type="date"
            value={form.join_date}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => set('join_date', e.target.value)}
            onBlur={() => handleBlur('join_date')}
            onKeyDown={(e) => e.preventDefault()}
            error={errors.join_date}
            touched={touched.join_date}
            required
          />
          <FormInput
            label="RFID No"
            value={form.rfid_no}
            onChange={e => set('rfid_no', e.target.value.replace(/[\r\n]+/g, ''))}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
            placeholder="Scan or enter RFID card"
          />
        </div>
      </form>
    </Modal>
  )
}
