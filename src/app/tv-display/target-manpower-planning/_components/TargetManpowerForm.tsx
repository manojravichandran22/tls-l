'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { apiCall } from '@/services/apiClient'
import type { BranchOption, ShiftOption } from '@/services/dropdownService'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import type {
  ManpowerPlanningItem,
  ManpowerLineInput,
  ZoneOptionApi,
  LineOptionApi,
} from './types'

interface TargetManpowerFormProps {
  initialData?: ManpowerPlanningItem | null
  initialBranchId?: string
  initialShiftId?: string
  branches: BranchOption[]
  shifts: ShiftOption[]
  onClose: () => void
  onSaved: () => void
}

interface FormLineRow {
  _key: string
  zone_id: number | string
  zone_name: string
  line_id: number | string
  line_name: string
  sam: number | string
  working_hours: number | string
  working_minutes: number | string
  direct_manpower: number | string
  target_efficiency: number | string
  target_pcs: number | string
}

export default function TargetManpowerForm({
  initialData,
  initialBranchId = '',
  initialShiftId = '',
  branches = [],
  shifts = [],
  onClose,
  onSaved,
}: TargetManpowerFormProps) {
  const isEdit = !!initialData
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const effectiveBranchId = !isAdmin && userBranchId ? String(userBranchId) : ''

  const [branchId, setBranchId] = useState<string>(
    effectiveBranchId || initialBranchId || (initialData?.branch_id ? String(initialData.branch_id) : '')
  )
  const [shiftId, setShiftId] = useState<string>(
    initialShiftId || (initialData?.shift_id ? String(initialData.shift_id) : '')
  )

  const [fetchingConfig, setFetchingConfig] = useState(false)
  const [availableZones, setAvailableZones] = useState<ZoneOptionApi[]>([])
  const [lineRows, setLineRows] = useState<FormLineRow[]>([])
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const selectedBranchName = useMemo(() => {
    return (
      branches.find((b) => String(b.id) === String(branchId))?.branch_name ||
      (branchId ? `Branch ${branchId}` : '—')
    )
  }, [branches, branchId])

  const selectedShiftName = useMemo(() => {
    const s = shifts.find((sh) => String(sh.id) === String(shiftId))
    return s
      ? s.shift_name
        ? `${s.shift_name} (${s.type || 'Shift'})`
        : `Shift ${s.id}`
      : shiftId
        ? `Shift ${shiftId}`
        : '—'
  }, [shifts, shiftId])

  // When editing: fetch full line_details from show API internally (like Branch module)
  useEffect(() => {
    if (!isEdit || !initialData) return

    // If lines already provided (e.g. from parent), use them directly
    if (initialData.lines && initialData.lines.length > 0) {
      const rows: FormLineRow[] = initialData.lines.map((l, i) => ({
        _key: `line-${i}-${Date.now()}`,
        zone_id: l.zone_id ?? '',
        zone_name: l.zone_name ?? `Zone ${l.zone_id}`,
        line_id: l.line_id ?? '',
        line_name: l.line_name ?? `Line ${l.line_id}`,
        sam: l.sam ?? '',
        working_hours: l.working_hours ?? '',
        working_minutes: l.working_minutes ?? '',
        direct_manpower: l.direct_manpower ?? '',
        target_efficiency: l.target_efficiency ?? '',
        target_pcs: l.target_pcs ?? '',
      }))
      setLineRows(rows)
      return
    }

    // Otherwise fetch show API to get line_details
    const uuid = initialData.uuid || ''
    if (!uuid) return

    let cancelled = false
    setFetchingConfig(true)
    apiCall<any>('/manPowerPlanning/show', {
      method: 'GET',
      encrypt: false,
      payload: {
        uuid,
        branch_id: initialData.branch_id || effectiveBranchId || '',
      },
    })
      .then((res) => {
        if (cancelled) return
        const detail = res?.data ?? res
        const lineDetails: any[] = Array.isArray(detail?.line_details) ? detail.line_details : []
        if (lineDetails.length > 0) {
          const rows: FormLineRow[] = lineDetails.map((l, i) => ({
            _key: `line-${i}-${Date.now()}`,
            zone_id: l.zone_id ?? '',
            zone_name: l.zone_name ?? `Zone ${l.zone_id}`,
            line_id: l.line_id ?? '',
            line_name: l.line_name ?? `Line ${l.line_id}`,
            sam: l.sam ?? '',
            working_hours: l.working_hours ?? '',
            working_minutes: l.working_minutes ?? '',
            direct_manpower: l.direct_manpower ?? '',
            target_efficiency: l.target_efficiency ?? '',
            target_pcs: l.target_pcs ?? '',
          }))
          setLineRows(rows)
        }
      })
      .catch((err) => console.error('Failed to fetch edit line details:', err))
      .finally(() => { if (!cancelled) setFetchingConfig(false) })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.uuid])

  useEffect(() => {
    if (!branchId || !shiftId || isEdit) return

    let cancelled = false
    async function loadPlanningConfig() {
      setFetchingConfig(true)
      setErrorMsg('')
      try {
        const res = await apiCall<any>('/manPowerPlanning/manpower-planning', {
          method: 'POST',
          encrypt: false,
          payload: {
            branch_id: Number(branchId),
            shift_id: Number(shiftId),
          },
        })

        if (cancelled) return

        let rawZones: any[] = []
        if (Array.isArray(res)) {
          rawZones = res
        } else if (Array.isArray(res?.data)) {
          rawZones = res.data
        } else if (Array.isArray(res?.data?.zones)) {
          rawZones = res.data.zones
        } else if (Array.isArray(res?.data?.records)) {
          rawZones = res.data.records
        } else if (Array.isArray(res?.zones)) {
          rawZones = res.zones
        } else if (res?.data && typeof res.data === 'object') {
          if (Array.isArray(res.data.zones)) {
            rawZones = res.data.zones
          } else if (Array.isArray(res.data.teams)) {
            res.data.teams.forEach((t: any) => {
              if (Array.isArray(t.zones)) rawZones.push(...t.zones)
            })
          }
        }

        const extractedZones: ZoneOptionApi[] = []

        const processZone = (z: any) => {
          if (!z || (z.zone_id == null && !z.id)) return
          const zId = z.zone_id ?? z.id
          const zName = z.zone_name ?? z.name ?? `Zone ${zId}`
          const linesList: LineOptionApi[] = []

          if (Array.isArray(z.lines)) {
            z.lines.forEach((l: any) => {
              const lId = l.line_id ?? l.id
              const lName = l.line_name ?? l.name ?? `Line ${lId}`
              if (lId != null) {
                linesList.push({ line_id: lId, line_name: lName })
              }
            })
          }

          let existingZone = extractedZones.find((ex) => ex.zone_id === zId)
          if (!existingZone) {
            existingZone = {
              zone_id: zId,
              zone_name: zName,
              lines: linesList,
            }
            extractedZones.push(existingZone)
          } else {
            const existingLineIds = (existingZone.lines || []).map((l) => l.line_id)
            linesList.forEach((l) => {
              if (!existingLineIds.includes(l.line_id)) {
                existingZone!.lines = existingZone!.lines || []
                existingZone!.lines.push(l)
              }
            })
          }
        }

        rawZones.forEach((item: any) => {
          if (item?.zone_id != null || (item?.lines && Array.isArray(item.lines))) {
            processZone(item)
          } else if (Array.isArray(item?.zones)) {
            item.zones.forEach((z: any) => processZone(z))
          }
        })

        setAvailableZones(extractedZones)

        const initialRows: FormLineRow[] = []
        extractedZones.forEach((z) => {
          if (Array.isArray(z.lines) && z.lines.length > 0) {
            z.lines.forEach((line) => {
              initialRows.push({
                _key: `row-${z.zone_id}-${line.line_id}-${Math.random().toString(36).substr(2, 5)}`,
                zone_id: z.zone_id,
                zone_name: z.zone_name,
                line_id: line.line_id,
                line_name: line.line_name,
                sam: '',
                working_hours: '',
                working_minutes: '',
                direct_manpower: '',
                target_efficiency: '',
                target_pcs: '',
              })
            })
          }
        })

        if (initialRows.length > 0) {
          setLineRows(initialRows)
        } else {
          setLineRows([])
        }
      } catch (err: any) {
        console.error('Failed to fetch manpower planning config:', err)
        setErrorMsg(err?.message || 'Failed to fetch zones and lines for selected shift')
      } finally {
        if (!cancelled) setFetchingConfig(false)
      }
    }

    loadPlanningConfig()

    return () => {
      cancelled = true
    }
  }, [branchId, shiftId, isEdit])

function calculateTargetPcs(
  mins: number | string,
  manpower: number | string,
  sam: number | string,
  eff: number | string
): number {
  const m = parseFloat(String(mins)) || 0
  const mp = parseFloat(String(manpower)) || 0
  const s = parseFloat(String(sam)) || 0
  const e = parseFloat(String(eff)) || 0

  if (s <= 0 || m <= 0 || mp <= 0 || e <= 0) return 0

  // Excel formula: =(((Working Minutes * Direct Manpower) / SAM) / 100%) * Target Eff
  const rawTargetPcs = ((m * mp) / s) * (e / 100)
  return Math.round(rawTargetPcs)
}

function calculateTargetEfficiency(
  mins: number | string,
  manpower: number | string,
  sam: number | string,
  pcs: number | string
): number {
  const m = parseFloat(String(mins)) || 0
  const mp = parseFloat(String(manpower)) || 0
  const s = parseFloat(String(sam)) || 0
  const p = parseFloat(String(pcs)) || 0

  if (s <= 0 || m <= 0 || mp <= 0 || p <= 0) return 0

  // Reverse Excel formula: Target Eff % = ((Target Pcs * SAM) / (Working Minutes * Direct Manpower)) * 100
  const rawEff = ((p * s) / (m * mp)) * 100
  return Math.round(rawEff * 10) / 10
}

  const handleRowChange = (index: number, field: keyof FormLineRow, value: any) => {
    setLineRows((prev) => {
      const updated = [...prev]
      const row = { ...updated[index], [field]: value }

      if (field === 'working_hours') {
        const hrs = parseFloat(value) || 0
        row.working_minutes = hrs > 0 ? hrs * 60 : ''
      } else if (field === 'working_minutes') {
        const mins = parseFloat(value) || 0
        row.working_hours = mins > 0 ? mins / 60 : ''
      }

      if (field === 'target_pcs') {
        // When typing Target Pcs -> auto-calculate Target Efficiency %
        const pcsVal = parseFloat(value) || 0
        if (pcsVal > 0) {
          const calculatedEff = calculateTargetEfficiency(
            row.working_minutes,
            row.direct_manpower,
            row.sam,
            pcsVal
          )
          if (calculatedEff > 0) {
            row.target_efficiency = calculatedEff
          }
        } else if (value === '') {
          row.target_efficiency = ''
        }
      } else if (field === 'target_efficiency') {
        // When typing Target Efficiency % -> auto-calculate Target Pcs
        const effVal = parseFloat(value) || 0
        if (effVal > 0) {
          const calculatedPcs = calculateTargetPcs(
            row.working_minutes,
            row.direct_manpower,
            row.sam,
            effVal
          )
          if (calculatedPcs > 0) {
            row.target_pcs = calculatedPcs
          }
        } else if (value === '') {
          row.target_pcs = ''
        }
      } else {
        // When changing other inputs (SAM, Manpower, Working Hours/Mins)
        if (row.target_efficiency && parseFloat(String(row.target_efficiency)) > 0) {
          const calculatedPcs = calculateTargetPcs(
            row.working_minutes,
            row.direct_manpower,
            row.sam,
            row.target_efficiency
          )
          if (calculatedPcs > 0) {
            row.target_pcs = calculatedPcs
          }
        } else if (row.target_pcs && parseFloat(String(row.target_pcs)) > 0) {
          const calculatedEff = calculateTargetEfficiency(
            row.working_minutes,
            row.direct_manpower,
            row.sam,
            row.target_pcs
          )
          if (calculatedEff > 0) {
            row.target_efficiency = calculatedEff
          }
        }
      }

      updated[index] = row
      return updated
    })
  }

  const overallTotals = useMemo(() => {
    let totalManpower = 0
    let totalPcs = 0
    let totalEffSum = 0
    let activeLineCount = 0

    lineRows.forEach((r) => {
      const mp = parseFloat(String(r.direct_manpower)) || 0
      const pcs = parseFloat(String(r.target_pcs)) || 0
      const eff = parseFloat(String(r.target_efficiency)) || 0

      totalManpower += mp
      totalPcs += pcs

      if (mp > 0 || eff > 0 || pcs > 0) {
        totalEffSum += eff
        activeLineCount++
      }
    })

    const avgEff = activeLineCount > 0 ? Math.round((totalEffSum / activeLineCount) * 100) / 100 : 0

    return {
      direct_manpower: totalManpower,
      target_efficiency: avgEff,
      target_pcs: totalPcs,
    }
  }, [lineRows])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!branchId) {
      setErrorMsg('Please select a Branch')
      return
    }
    if (!shiftId) {
      setErrorMsg('Please select a Shift')
      return
    }
    if (lineRows.length === 0) {
      setErrorMsg('At least one line configuration is required')
      return
    }

    for (let i = 0; i < lineRows.length; i++) {
      const r = lineRows[i]
      if (!r.zone_id || !r.line_id) {
        setErrorMsg(`Line item #${i + 1} requires Zone and Line selection`)
        return
      }
    }

    setSaving(true)
    try {
      const formattedLines: ManpowerLineInput[] = lineRows.map((r) => ({
        zone_id: Number(r.zone_id),
        line_id: Number(r.line_id),
        sam: parseFloat(String(r.sam)) || 0,
        working_hours: parseFloat(String(r.working_hours)) || 0,
        working_minutes: parseFloat(String(r.working_minutes)) || 0,
        direct_manpower: parseFloat(String(r.direct_manpower)) || 0,
        target_efficiency: parseFloat(String(r.target_efficiency)) || 0,
        target_pcs: parseFloat(String(r.target_pcs)) || 0,
      }))

      const payload: Record<string, unknown> = {
        branch_id: Number(branchId),
        shift_id: Number(shiftId),
        lines: formattedLines,
        overall_total: {
          direct_manpower: Number(overallTotals.direct_manpower),
          target_efficiency: Number(overallTotals.target_efficiency),
          target_pcs: Number(overallTotals.target_pcs),
        },
      }

      // Include uuid when updating
      if (isEdit && initialData?.uuid) {
        payload.uuid = initialData.uuid
      }

      const endpoint = isEdit
        ? '/manPowerPlanning/manpower-planning/update'
        : '/manPowerPlanning/manpower-planning/create'

      const res = await apiCall<{ success?: boolean; message?: string }>(
        endpoint,
        {
          method: 'POST',
          encrypt: false,
          payload,
        }
      )

      if (res?.success || res?.message?.toLowerCase().includes('success')) {
        onSaved()
      } else {
        setErrorMsg(res?.message || 'Failed to save manpower planning')
      }
    } catch (err: any) {
      console.error('Submit error:', err)
      setErrorMsg(err?.message || 'Failed to submit manpower planning')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Header — back + title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-t-muted hover:text-t-title hover:bg-card-alt border border-border transition-colors flex items-center justify-center cursor-pointer"
          title="Back to List"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-base font-semibold text-t-title">
            {isEdit ? 'Edit Target & Manpower Planning' : 'Add Target & Manpower Planning'}
          </h2>
          <p className="text-xs text-t-muted mt-0.5">Fill in the line-wise targets for the selected branch and shift.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="px-3 py-2 text-xs rounded-lg bg-error-bg text-error-text border border-error-text/20">
            {errorMsg}
          </div>
        )}

        {/* Selected Branch & Shift info bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-card border border-table-line">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-t-muted">Branch:</span>
              <span className="text-xs font-semibold text-t-title">{selectedBranchName}</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-table-line" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-t-muted">Shift:</span>
              <span className="text-xs font-semibold text-accent">{selectedShiftName}</span>
            </div>
          </div>
          {!isEdit && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-t-muted hover:text-t-title underline underline-offset-2 transition-colors cursor-pointer"
            >
              Change Selection
            </button>
          )}
        </div>

        {/* Loading Indicator */}
        {fetchingConfig && (
          <div className="flex items-center justify-center py-10 gap-2 text-t-muted">
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
            <span className="text-xs">Loading zones and lines...</span>
          </div>
        )}

        {/* Main Line Planning Table */}
        {branchId && shiftId && !fetchingConfig && (
          <div className="space-y-4">
            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-table-line bg-card">
              <table className="w-full text-left border-collapse table-fixed min-w-[920px]">
                <thead>
                  <tr className="border-b border-table-line bg-card-alt">
                    <th className="py-2.5 px-3 text-xs font-semibold text-t-muted w-[11%]">Shift</th>
                    <th className="py-2.5 px-3 text-xs font-semibold text-t-muted w-[13%]">Zone</th>
                    <th className="py-2.5 px-3 text-xs font-semibold text-t-muted w-[14%]">Line</th>
                    <th className="py-2.5 px-2 text-xs font-semibold text-t-muted text-center w-[10%]">Manpower</th>
                    <th className="py-2.5 px-2 text-xs font-semibold text-t-muted text-center w-[9%]">SAM</th>
                    <th className="py-2.5 px-2 text-xs font-semibold text-t-muted text-center w-[10%]">Working Hrs</th>
                    <th className="py-2.5 px-2 text-xs font-semibold text-t-muted text-center w-[10%]">Working Mins</th>
                    <th className="py-2.5 px-2 text-xs font-semibold text-t-muted text-center w-[11%]">Target Eff %</th>
                    <th className="py-2.5 px-2 text-xs font-semibold text-t-muted text-center w-[12%]">Target Pcs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-table-line">
                  {lineRows.map((row, idx) => (
                    <tr key={row._key} className="hover:bg-card-alt/50 transition-colors">
                      <td className="py-2 px-3">
                        <span className="text-xs font-semibold text-accent truncate block">
                          {shifts.find((s) => Number(s.id) === Number(shiftId))?.shift_name || shiftId || 'Shift'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-xs font-medium text-t-title truncate block">
                          {row.zone_name || `Zone ${row.zone_id}`}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-xs text-t-secondary font-medium truncate block">
                          {row.line_name || `Line ${row.line_id}`}
                        </span>
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number" step="any" min="0"
                          value={String(row.direct_manpower ?? '')}
                          onChange={(e) => handleRowChange(idx, 'direct_manpower', e.target.value)}
                          className="w-full px-2 py-1 text-xs text-center text-t-title bg-input border border-input-line rounded-input focus:border-accent outline-none transition-colors"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number" step="any" min="0"
                          value={String(row.sam ?? '')}
                          onChange={(e) => handleRowChange(idx, 'sam', e.target.value)}
                          className="w-full px-2 py-1 text-xs text-center text-t-title bg-input border border-input-line rounded-input focus:border-accent outline-none transition-colors"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number" step="any" min="0"
                          value={String(row.working_hours ?? '')}
                          onChange={(e) => handleRowChange(idx, 'working_hours', e.target.value)}
                          className="w-full px-2 py-1 text-xs text-center text-t-title bg-input border border-input-line rounded-input focus:border-accent outline-none transition-colors"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number" step="any" min="0"
                          value={String(row.working_minutes ?? '')}
                          onChange={(e) => handleRowChange(idx, 'working_minutes', e.target.value)}
                          className="w-full px-2 py-1 text-xs text-center text-t-title bg-input border border-input-line rounded-input focus:border-accent outline-none transition-colors"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number" step="any" min="0" max="100"
                          value={String(row.target_efficiency ?? '')}
                          onChange={(e) => handleRowChange(idx, 'target_efficiency', e.target.value)}
                          className="w-full px-2 py-1 text-xs text-center text-t-title bg-input border border-input-line rounded-input focus:border-accent outline-none transition-colors"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number" step="any" min="0"
                          value={String(row.target_pcs ?? '')}
                          onChange={(e) => handleRowChange(idx, 'target_pcs', e.target.value)}
                          className="w-full px-2 py-1 text-xs text-center text-t-title bg-input border border-input-line rounded-input focus:border-accent outline-none transition-colors"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[#007b83] bg-[#007b83] text-white">
                  <tr className="bg-[#007b83] text-white">
                    <td colSpan={3} className="py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-white">
                      Total
                    </td>
                    <td className="py-2.5 px-2 text-xs font-bold text-center text-white">
                      {overallTotals.direct_manpower}
                    </td>
                    <td className="py-2.5 px-2 text-xs font-bold text-center text-white" />
                    <td className="py-2.5 px-2 text-xs font-bold text-center text-white" />
                    <td className="py-2.5 px-2 text-xs font-bold text-center text-white" />
                    <td className="py-2.5 px-2 text-xs font-bold text-center text-white">
                      {overallTotals.target_efficiency}%
                    </td>
                    <td className="py-2.5 px-2 text-xs font-bold text-center text-white">
                      {overallTotals.target_pcs.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-table-line">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={saving}
            disabled={!branchId || !shiftId || lineRows.length === 0}
          >
            Submit
          </Button>
        </div>
      </form>
    </div>
  )
}


