'use client'

import { useState, useEffect } from 'react'
import {
  fetchCompanies, fetchBranches, fetchZones, fetchLines, fetchRoles, fetchDepartments, fetchDesignations, fetchShifts, fetchTeams,
  fetchReportShifts, fetchReportTeams,
  type CompanyOption, type BranchOption, type ZoneOption, type LineOption, type RoleOption, type DeptOption, type DesignationOption, type ShiftOption, type TeamOption
} from '@/services/dropdownService'

export type { CompanyOption, BranchOption, ZoneOption, LineOption, RoleOption, DeptOption, DesignationOption, ShiftOption, TeamOption }

interface DropdownOptions {
  companies?: boolean
  branches?: boolean
  zones?: boolean
  lines?: boolean
  roles?: boolean
  departments?: boolean
  designations?: boolean
  shifts?: boolean
  teams?: boolean
  /** When provided, items will be fetched filtered by this branch ID */
  branchId?: string | number | null
  /** When provided, lines will be fetched filtered by this zone ID */
  zoneId?: string | number | null
  /** When provided, teams will be fetched filtered by this shift ID (for reports) */
  shiftId?: string | number | null
  /** When provided, shifts will be fetched filtered by this team ID */
  teamId?: string | number | null
  /** When true, fetches all items globally without branch restrictions */
  global?: boolean
  /** When true, uses /dropdown/shiftallocationname for shifts and /dropdown/shifttoteam for teams */
  isReport?: boolean
}

export function useDropdownData(options: DropdownOptions) {
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [zones, setZones] = useState<ZoneOption[]>([])
  const [lines, setLines] = useState<LineOption[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [departments, setDepartments] = useState<DeptOption[]>([])
  const [designations, setDesignations] = useState<DesignationOption[]>([])
  const [shifts, setShifts] = useState<ShiftOption[]>([])
  const [teams, setTeams] = useState<TeamOption[]>([])

  const branchId = options.branchId != null ? String(options.branchId) : ''
  const zoneId = options.zoneId != null ? String(options.zoneId) : ''
  const shiftId = options.shiftId != null ? String(options.shiftId) : ''
  const teamId = options.teamId != null ? String(options.teamId) : ''

  useEffect(() => {
    if (options.companies) fetchCompanies().then(setCompanies).catch(() => { })
    if (options.branches) fetchBranches().then(setBranches).catch(() => { })
    if (options.zones) fetchZones(options.global ? undefined : branchId).then(setZones).catch(() => { })
    if (options.lines) fetchLines(options.global ? undefined : branchId, options.global ? undefined : zoneId).then(setLines).catch(() => { })
    if (options.roles) fetchRoles(branchId).then(setRoles).catch(() => { })
    if (options.departments) fetchDepartments(branchId).then(setDepartments).catch(() => { })
    if (options.designations) fetchDesignations().then(setDesignations).catch(() => { })
    if (options.shifts) {
      if (options.isReport) {
        fetchReportShifts(branchId, teamId).then(setShifts).catch(() => { })
      } else {
        fetchShifts(branchId).then(setShifts).catch(() => { })
      }
    }
    if (options.teams) {
      if (options.isReport) {
        fetchReportTeams(branchId, shiftId).then(setTeams).catch(() => { })
      } else {
        fetchTeams(branchId).then(setTeams).catch(() => { })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, zoneId, shiftId, teamId, options.global])

  return { companies, branches, zones, lines, roles, departments, designations, shifts, teams }
}

