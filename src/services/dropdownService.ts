import { apiCall } from './apiClient'

// ── Shared types ────────────────────────────────────────────────────────────────
export interface CompanyOption { id: number; company_name: string; max_slot?: number }
export interface BranchOption { id: number; branch_name: string; company_id?: number }
export interface ZoneOption { id: number; zone_name: string; company_id?: number; branch_id?: number }
// export interface LineOption { id: number; line_name: string; branch_id?: number }
export interface LineOption { id: number; line_id?: number; line_name: string; zone_id?: number; zone_name?: string; branch_id?: number; branch_name?: string }
export interface RoleOption { id: number; uuid?: string; name: string; role?: number }
export interface DeptOption { id: number; name: string; branch_id?: number }
export interface DesignationOption { id: number; designation_name: string; name?: string; dept_id?: number }
export interface ShiftOption { id: number; shift_name: string; type?: string; start_time?: string; end_time?: string }
import { getAuthUser } from '@/lib/cookies'

// ── Internal cache ──────────────────────────────────────────────────────────────
const _cache = new Map<string, unknown[]>()
const _pending = new Map<string, Promise<unknown[]>>()

const PARAMS = { page: '1', per_page: '500', search: '', status: 'all' }

async function fetchOnce<T>(key: string, fetcher: () => Promise<T[]>): Promise<T[]> {
  if (_cache.has(key)) return _cache.get(key) as T[]
  if (_pending.has(key)) return _pending.get(key) as Promise<T[]>

  const p = fetcher()
    .then(data => { _cache.set(key, data as unknown[]); _pending.delete(key); return data })
    .catch(err => { _pending.delete(key); throw err })

  _pending.set(key, p as Promise<unknown[]>)
  return p
}

/** Call after creating/updating a master to bust its dropdown cache */
export function clearDropdownCache(key?: 'companies' | 'branches' | 'zones' | 'lines' | 'roles' | 'departments' | 'designations' | 'shifts' | 'teams') {
  if (key) {
    for (const k of Array.from(_cache.keys())) {
      if (k === key || k.startsWith(`${key}_`) || k.startsWith(`${key}List`)) _cache.delete(k)
    }
    for (const k of Array.from(_pending.keys())) {
      if (k === key || k.startsWith(`${key}_`) || k.startsWith(`${key}List`)) _pending.delete(k)
    }
  } else {
    _cache.clear()
    _pending.clear()
  }
}

// ── Public fetch functions ──────────────────────────────────────────────────────
export const fetchCompanies = () =>
  fetchOnce<CompanyOption>('companies', async () => {
    const r = await apiCall<{ success?: boolean; data?: CompanyOption[] }>('/dropdown/companyList', { method: 'GET', encrypt: false })
    return Array.isArray(r.data) ? r.data : []
  })

export const fetchBranches = () =>
  fetchOnce<BranchOption>('branches', async () => {
    const r = await apiCall<{ success?: boolean; data?: BranchOption[] }>('/dropdown/branchList', { method: 'GET', encrypt: false })
    return Array.isArray(r.data) ? r.data : []
  })

export const fetchZones = (branchId?: string) => {
  const user = getAuthUser()
  const bId = branchId !== undefined && branchId !== '' ? branchId : (user?.branch_id != null ? String(user.branch_id) : '')
  const cacheKey = bId ? `zones_branch_${bId}` : 'zones_all'
  return fetchOnce<ZoneOption>(cacheKey, async () => {
    const payload = bId ? { branch_id: bId } : {}
    const r = await apiCall<{
      success?: boolean
      data?: ZoneOption[]
    }>('/dropdown/zoneList', {
      method: 'GET',
      encrypt: false,
      payload,
    })

    return Array.isArray(r.data) ? r.data : []
  })
}

export const fetchLines = (branchId?: string, zoneId?: string) => {
  const user = getAuthUser()
  const bId = branchId !== undefined && branchId !== '' ? branchId : (user?.branch_id != null ? String(user.branch_id) : '')
  const zId = zoneId || ''
  const cacheKey = `lines_b_${bId}_z_${zId}`
  return fetchOnce<LineOption>(cacheKey, async () => {
    const payload: Record<string, string> = {}
    if (bId) payload.branch_id = bId
    if (zId) payload.zone_id = zId

    const r = await apiCall<{
      success?: boolean
      data?: LineOption[]
    }>('/dropdown/lineList', {
      method: 'GET',
      encrypt: false,
      payload,
    })

    const list = Array.isArray(r.data) ? r.data : []

    return list.map(l => ({
      ...l,
      id: l.line_id ?? l.id,
    }))
  })
}

// Filtered fetch by zone/branch when needed
export const fetchLinesByZone = (zoneId: string, branchId?: string) =>
  fetchOnce<LineOption>(`lines_zone_${zoneId}_branch_${branchId ?? ''}`, async () => {
    const r = await apiCall<{ success?: boolean; data?: LineOption[] }>('/dropdown/lineList', {
      method: 'GET',
      encrypt: false,
      payload: { zone_id: zoneId, branch_id: branchId ?? '', factory_id: '' }
    })
    const list = Array.isArray(r.data) ? r.data : []
    return list.map(l => ({ ...l, id: l.line_id ?? l.id }))
  })
export const fetchRoles = (branchId?: string) =>
  fetchOnce<RoleOption>(branchId ? `roles_branch_${branchId}` : 'roles', async () => {
    const payload = branchId ? { ...PARAMS, branch_id: branchId } : PARAMS
    const r = await apiCall<any>('/dropdown/roleList', { method: 'GET', encrypt: false, payload })
    return Array.isArray(r.data) ? r.data : r.data?.roles ?? []
  })

export const fetchDepartments = (branchId?: string) => {
  const cacheKey = branchId ? `departments_branch_${branchId}` : 'departments'
  return fetchOnce<DeptOption>(cacheKey, async () => {
    const payload = branchId ? { ...PARAMS, branch_id: branchId } : PARAMS
    const r = await apiCall<any>('/dropdown/departmentList', { method: 'GET', encrypt: false, payload })
    return Array.isArray(r.data) ? r.data : (r.data?.departments ?? [])
  })
}

export interface DesignationOption { id: number; name?: string; dept_id?: number }

export const fetchDesignations = () =>
  fetchOnce<DesignationOption>('designations', async () => {
    const r = await apiCall<any>('/dropdown/designationList', { method: 'GET', encrypt: false, payload: PARAMS })
    return Array.isArray(r.data) ? r.data : r.data?.designations ?? []
  })

export const fetchShifts = (branchId?: string) => {
  const user = getAuthUser()
  const bId = branchId !== undefined ? branchId : (user?.branch_id != null ? String(user.branch_id) : '')
  const cacheKey = bId ? `shifts_branch_${bId}` : 'shifts_all'
  return fetchOnce<ShiftOption>(cacheKey, async () => {
    const payload = bId ? { branch_id: bId } : {}
    const r = await apiCall<any>('/dropdown/shiftList', { method: 'GET', encrypt: false, payload })
    if (r.success && Array.isArray(r.data)) return r.data
    if (Array.isArray(r)) return r
    if (Array.isArray(r.data?.shifts)) return r.data.shifts
    return []
  })
}

/** Fetch designations filtered by department id */
export const fetchDesignationsByDept = (departmentId: string) =>
  fetchOnce<DesignationOption>(`designations_dept_${departmentId}`, async () => {
    console.log('Designations by dept response:', departmentId);
    const payload = { ...PARAMS, department_id: departmentId }
    const r = await apiCall<any>('/dropdown/designationList', { method: 'GET', encrypt: false, payload })
    const list = Array.isArray(r.data) ? r.data : r.data?.designations ?? []
    return list
  })

export interface WorkCategoryOption { id: number; name: string; work_category_name?: string }

export const fetchWorkCategories = () =>
  fetchOnce<WorkCategoryOption>('workCategories', async () => {
    const r = await apiCall<any>('/work-category/list', { method: 'GET', encrypt: false, payload: { per_page: '500' } });
    const rawList = Array.isArray(r.data)
      ? r.data
      : r.data?.WorkCategories ?? r.data?.work_categories ?? r.data?.workCategoryList ?? r.data?.workCategories ?? [];
    return rawList.map((item: any) => ({
      id: item.id,
      name: item.name ?? item.work_category_name ?? item.workcategory_name ?? '',
    }));
  });

export const fetchWorkCategoriesByDept = (departmentId: string) =>
  fetchOnce<WorkCategoryOption>(`workCategories_dept_${departmentId}`, async () => {
    const r = await apiCall<any>('/work-category/list', {
      method: 'GET',
      encrypt: false,
      payload: { page: '1', per_page: '500', department_id: departmentId },
    })

    const rawList = Array.isArray(r.data)
      ? r.data
      : r.data?.WorkCategories ?? r.data?.work_categories ?? r.data?.data ?? []

    return rawList.map((item: any) => ({
      id: item.id,
      name: item.name ?? item.work_category_name ?? item.workcategory_name ?? '',
    }))
  })

export interface OptionsDropdownItem { id: number; value: string }

/** Generic fetch for /dropdown/options-dropdown — pass the `type` param (e.g. 'buyer', 'season') */
export const fetchOptionsByType = (type: string) =>
  fetchOnce<OptionsDropdownItem>(`options_${type}`, async () => {
    const r = await apiCall<{ success?: boolean; data?: { records?: Record<string, OptionsDropdownItem[]> } }>(
      '/dropdown/options-dropdown',
      { method: 'GET', encrypt: false, payload: { type } }
    )
    return r.data?.records?.[type] ?? []
  })

export const fetchBuyers = () => fetchOptionsByType('buyer')

export interface TeamOption { id: number; team_name: string; name?: string; code?: string; branch_id?: number }

export const fetchTeams = (branchId?: string) => {
  const user = getAuthUser()
  const bId = branchId !== undefined ? branchId : (user?.branch_id != null ? String(user.branch_id) : '')
  const cacheKey = bId ? `teams_branch_${bId}` : 'teams_all'
  return fetchOnce<TeamOption>(cacheKey, async () => {
    const payload = bId ? { branch_id: bId } : {}
    const r = await apiCall<any>('/dropdown/teamlist', { method: 'GET', encrypt: false, payload })
    if (r?.success && Array.isArray(r?.data)) return r.data
    if (Array.isArray(r?.data)) return r.data
    if (Array.isArray(r)) return r
    if (Array.isArray(r?.data?.teams)) return r.data.teams
    return []
  })
}

export const fetchReportShifts = (branchId: string = '', teamId: string = '') => {
  const cacheKey = `report_shifts_b_${branchId}_t_${teamId}`
  return fetchOnce<ShiftOption>(cacheKey, async () => {
    const r = await apiCall<any>('/dropdown/shiftallocationname', {
      method: 'GET',
      encrypt: false,
      payload: { branch_id: branchId, team_id: teamId },
    })
    const raw = Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : []
    const list: ShiftOption[] = []
    const seen = new Set<string | number>()

    raw.forEach((item: any) => {
      if (Array.isArray(item.shifts)) {
        item.shifts.forEach((s: any) => {
          const id = s.shift_id ?? s.id
          if (id != null && !seen.has(id)) {
            seen.add(id)
            list.push({
              id: Number(id),
              shift_name: s.shift_name || s.name || `Shift ${id}`,
            })
          }
        })
      } else if (item.shift_id || item.id) {
        const id = item.shift_id ?? item.id
        if (id != null && !seen.has(id)) {
          seen.add(id)
          list.push({
            id: Number(id),
            shift_name: item.shift_name || item.name || `Shift ${id}`,
          })
        }
      }
    })

    return list
  })
}

export const fetchReportTeams = (branchId: string = '', shiftId: string = '') => {
  const cacheKey = `report_teams_b_${branchId}_s_${shiftId}`
  return fetchOnce<TeamOption>(cacheKey, async () => {
    const r = await apiCall<any>('/dropdown/shifttoteam', {
      method: 'GET',
      encrypt: false,
      payload: { branch_id: branchId, shift_id: shiftId },
    })
    const raw = Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : []
    const list: TeamOption[] = []
    const seen = new Set<string | number>()

    raw.forEach((item: any) => {
      const id = item.team_id ?? item.id
      if (id != null && !seen.has(id)) {
        seen.add(id)
        const name = item.team_name || item.name || `Team ${id}`
        list.push({
          id: Number(id),
          team_name: name,
          name: name,
        })
      }
    })

    return list
  })
}

