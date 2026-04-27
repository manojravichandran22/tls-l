'use client'

import { useState, useEffect } from 'react'
import { apiCall } from '@/services/apiClient'

interface DropdownOptions {
  branches?: boolean
  companies?: boolean
  zones?: boolean
  lines?: boolean
  roles?: boolean
  departments?: boolean
}

interface BranchOption { id: number; branch_name: string; company_id?: number }
interface CompanyOption { id: number; company_name: string; max_slot?: number }
interface ZoneOption { id: number; zone_name: string; company_id: number; branch_id: number }
interface LineOption { id: number; line_name: string; branch_id?: number }
interface RoleOption { id: number; uuid: string; name: string; role: number }
interface DeptOption { id: number; name: string; branch_id?: number }

export function useDropdownData(options: DropdownOptions) {
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [zones, setZones] = useState<ZoneOption[]>([])
  const [lines, setLines] = useState<LineOption[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [departments, setDepartments] = useState<DeptOption[]>([])

  useEffect(() => {
    const fetchParams = { page: '1', per_page: '100', search: '', status: 'all' }

    if (options.companies) {
      apiCall<{ data?: { companies?: CompanyOption[] } }>('/company/companyList', { method: 'GET', encrypt: false, payload: fetchParams })
        .then(res => setCompanies(res.data?.companies ?? []))
        .catch(() => { })
    }

    if (options.branches) {
      apiCall<{ data?: { branches?: BranchOption[] } }>('/branch/branchList', { method: 'GET', encrypt: false, payload: fetchParams })
        .then(res => setBranches(res.data?.branches ?? []))
        .catch(() => { })
    }

    if (options.zones) {
      apiCall<{ data?: { zones?: ZoneOption[] } }>('/zone/zoneList', { method: 'GET', encrypt: false, payload: fetchParams })
        .then(res => setZones(res.data?.zones ?? []))
        .catch(() => { })
    }

    if (options.lines) {
      apiCall<{ data?: { lines?: LineOption[] } }>('/line/list', { method: 'GET', encrypt: false, payload: fetchParams })
        .then(res => setLines(res.data?.lines ?? []))
        .catch(() => { })
    }

    if (options.roles) {
      apiCall<{ data?: { roles?: RoleOption[] } }>('/role/list', { method: 'GET', encrypt: false, payload: fetchParams })
        .then(res => setRoles(res.data?.roles ?? []))
        .catch(() => { })
    }

    if (options.departments) {
      apiCall<{ data?: { departments?: DeptOption[] } }>('/department/list', { method: 'GET', encrypt: false, payload: fetchParams })
        .then(res => setDepartments(res.data?.departments ?? []))
        .catch(() => { })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { branches, companies, zones, lines, roles, departments }
}
