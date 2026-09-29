'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'
import { Trash2, GripVertical, Download, Upload, X, ChevronUp, ChevronDown, Search } from 'lucide-react'
import { apiCall } from '@/services/apiClient'
import { fetchBuyers, type OptionsDropdownItem } from '@/services/dropdownService'
import type { ToastData } from '@/components/ui/Toast'
import { usePermissions } from '@/hooks/usePermissions'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { log } from 'node:console'

// ── Constants ──────────────────────────────────────────────────────────────────
const SHIFT_HOURS = 8
const WORKING_MINS = SHIFT_HOURS * 60 // 480

// ── Types ──────────────────────────────────────────────────────────────────────
interface LeftOp {
  id: number
  uuid: string
  operation_name: string
  code: string
  sam: string | number
  machine_type_id: number | null
  machine_type_name?: string | null
  machine_id?: number | null
  branch_id?: number | string | null
  branch_name?: string | null
  branch?: { id: number; branch_name: string }
  machineType?: { id: number; type_name: string }
  machine?: { id: number; machine_no: string }
}

interface OBRow {
  key: string
  operationId: number
  operationUuid: string
  operationName: string
  machineTypeId: number | null
  machineTypeName: string
  machine_id: number | null
  sam: number
  seq: number
  alloc: number  // per-row editable (Excel H col), default = allocManning input
  branch_id?: number | string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatValue(val: number) { return parseFloat(Number(val).toFixed(2)) }
function fmt(n: number) {
  if (!isFinite(n) || n === 0) return '0'
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Excel formulas:
// F = 60 / SAM  (100%/Hr)
// G = alloc100Hr / F   (Req Manning = alloc100Hr / row100Hr)
// I = H × F     (Alloc Manni 100%HR = alloc × row100Hr)
function calcRow(row: OBRow, alloc100Hr: number, req100Hr: number) {
  const row100Hr = row.sam > 0 ? formatValue(60 / row.sam) : 0
  const reqManning = row100Hr > 0 ? req100Hr / row100Hr : 0
  // const reqManning = row100Hr > 0 ? formatValue(req100Hr / row100Hr) : 0
  const allocManni100Hr = formatValue(row.alloc * row100Hr)
  return { row100Hr, reqManning, allocManni100Hr }
}

// ── Stepper ────────────────────────────────────────────────────────────────────
function Stepper({ value, onChange, step = 0.25, min = 0 }: {
  value: number; onChange: (v: number) => void; step?: number; min?: number
}) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {/* <span className="text-xs font-mono text-t-secondary min-w-[32px] text-right">{value.toFixed(2)}</span> */}
      <input type="number" step={step} min={min} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-14 h-6 border border-input-line rounded text-xs text-center outline-none" />
      <div className="flex flex-col">
        <button type="button"
          onClick={() => onChange(formatValue(value + step))}
          className="h-3 w-4 flex items-center justify-center text-t-lighter hover:text-accent">
          <ChevronUp size={9} strokeWidth={2.5} />
        </button>
        <button type="button"
          onClick={() => onChange(Math.max(min, formatValue(value - step)))}
          className="h-3 w-4 flex items-center justify-center text-t-lighter hover:text-accent">
          <ChevronDown size={9} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

// ── Stat Card (header row) ─────────────────────────────────────────────────────
function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-3.5 border-r border-table-line last:border-r-0">
      <span className="text-md font-bold text-t-primary">{value}</span>
      <span className="text-2xs text-t-lighter mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  )
}

// ── Stat Pill (right panel alloc row) ─────────────────────────────────────────
function StatPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[80px]">
      <span className="text-sm font-bold text-t-primary leading-tight">{value}</span>
      <span className="text-2xs text-t-lighter text-center leading-tight whitespace-nowrap">{label}</span>
    </div>
  )
}

// ── Preview Modal ──────────────────────────────────────────────────────────────
function PreviewModal({
  rows, onClose, onConfirm, saving, styleForm, activeReqManning
}: {
  rows: (OBRow & { row100Hr: number; reqManning: number; allocManni100Hr: number })[]
  onClose: () => void
  onConfirm: () => void
  saving: boolean
  styleForm: { buyer: string; style_no: string; style_name: string; branch_id?: string }
  activeReqManning: number
}) {
  const totalSam = rows.reduce((s, r) => s + r.sam, 0)
  const allocTotal = rows.reduce((s, r) => s + r.alloc, 0)
  const alloc100Hr = totalSam > 0 ? allocTotal * 60 / totalSam : 0
  const alloc100Day = totalSam > 0 ? allocTotal * WORKING_MINS / totalSam : 0

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-modal rounded-card shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-table-line shrink-0">
          <div>
            <h2 className="text-base font-bold text-t-primary">OBS  Preview — Check All Before Saving</h2>
            <p className="text-xs text-t-lighter mt-1">
              Buyer: <span className="font-medium text-t-secondary">{styleForm.buyer || '—'}</span> | Style No: <span className="font-medium text-t-secondary">{styleForm.style_no || '—'}</span> | Style Name: <span className="font-medium text-t-secondary">{styleForm.style_name || '—'}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-t-lighter hover:text-t-body transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 border-b border-table-line shrink-0 flex flex-col gap-3">
          {/* Line 1: First 6 labels */}
          <div className="grid grid-cols-6 gap-4 text-center">
            <StatPill value={`${SHIFT_HOURS} hrs`} label="Shift Hr" />
            <StatPill value={WORKING_MINS} label="Working Min" />
            <StatPill value={fmt(formatValue(alloc100Day))} label="100 % Target / Day" />
            <StatPill value={fmt(formatValue(alloc100Hr))} label="100 % Target / Hr" />
            <StatPill value={fmt(formatValue(alloc100Day * 0.6))} label="60 % Target / Day" />
            <StatPill value={fmt(formatValue(alloc100Hr * 0.6))} label="60 % Target / Hr" />
          </div>

          {/* Line 2: Second 6 labels */}
          <div className="grid grid-cols-6 gap-4 text-center">
            <StatPill value={activeReqManning} label="Req Manning" />
            <StatPill value={formatValue(allocTotal).toFixed(2)} label="Allocated Manning" />
            <StatPill value={rows.length} label="Total Operation" />
            <StatPill value={fmt(formatValue(totalSam))} label="Total SAM" />
            <StatPill value={fmt(formatValue(alloc100Hr))} label="Alloc Manning 100%/Hr" />
            <StatPill value={fmt(formatValue(alloc100Hr * 0.6))} label="Alloc Manning 60%/Hr" />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-table-head sticky top-0 z-10">
              <tr>
                <th className="px-2 py-2.5 w-6" />
                <th className="px-3 py-2.5 text-left text-t-lighter font-medium">Seq</th>
                <th className="px-3 py-2.5 text-left text-t-lighter font-medium">Machine Type</th>
                <th className="px-3 py-2.5 text-left text-t-lighter font-medium">Operation</th>
                <th className="px-3 py-2.5 text-right text-t-lighter font-medium">SAM</th>
                <th className="px-3 py-2.5 text-right text-t-lighter font-medium text-accent">100%/Hr</th>
                <th className="px-3 py-2.5 text-right text-t-lighter font-medium">Req Manni</th>
                <th className="px-3 py-2.5 text-right text-t-lighter font-medium">Alloc</th>
                <th className="px-3 py-2.5 text-right text-t-lighter font-medium">Alloc Manni 100 % HR</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.key} className={`border-t border-table-line ${i % 2 === 0 ? 'bg-card' : 'bg-card-alt'}`}>
                  <td className="px-2 py-2 text-t-lighter"><GripVertical size={13} /></td>
                  <td className="px-3 py-2 font-mono text-t-secondary">{row.seq}</td>
                  <td className="px-3 py-2 text-t-body">{row.machineTypeName}</td>
                  <td className="px-3 py-2 font-semibold text-accent">{row.operationName}</td>
                  <td className="px-3 py-2 text-right font-mono text-t-secondary">{formatValue(row.sam).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-accent">{fmt(formatValue(row.row100Hr))}</td>
                  <td className="px-3 py-2 text-right text-t-body">{formatValue(row.reqManning).toFixed(2)}</td>
                  {/* <td className="px-3 py-2 text-right text-t-body">{row.reqManning}</td> */}
                  <td className="px-3 py-2 text-right text-t-body">{row.alloc.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-mono text-t-secondary">{fmt(formatValue(row.allocManni100Hr))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="text-center text-xs text-t-lighter py-10">No operations added</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-table-line shrink-0">
          <div className="flex items-center gap-6">
            <span className="text-xs font-semibold text-t-body">
              <span className="text-accent">{rows.length}</span> Ops
            </span>
            <span className="text-xs font-semibold text-t-body">
              <span className="text-accent">{formatValue(totalSam).toFixed(2)}</span> SAM
            </span>
            <span className="text-xs font-semibold text-t-body">
              <span className="text-accent">{formatValue(allocTotal)}</span> Manning
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Back</Button>
            <Button variant="primary" onClick={onConfirm} isLoading={saving}>
              Confirm &amp; Save the Style
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function OperationBulletinPage() {
  const { can: canOB } = usePermissions('Operation-Bulletin')
  const canOBList = canOB('operation.Dropdownoperationlist')
  const canOBCreate = canOB('operation_bulletin.create')

  const { branchId, isAdmin } = useBranchAccess()
  const { branches } = useDropdownData({ branches: true })
  const [leftBranchFilter, setLeftBranchFilter] = useState('')
  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : leftBranchFilter

  const [obRows, setObRows] = useState<OBRow[]>([])
  const [leftOps, setLeftOps] = useState<LeftOp[]>([])
  const [leftSearch, setLeftSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [leftLoading, setLeftLoading] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)
  const [savedObId, setSavedObId] = useState<number | null>(null)
  const [showStyleModal, setShowStyleModal] = useState(false)
  const [styleForm, setStyleForm] = useState({ buyer: '', style_no: '', style_name: '', branch_id: '' })
  const [styleSaving, setStyleSaving] = useState(false)
  const [styleError, setStyleError] = useState('')
  const [buyers, setBuyers] = useState<OptionsDropdownItem[]>([])

  const [userReqManning, setUserReqManning] = useState<number | null>(null)
  const [reqManningStr, setReqManningStr] = useState<string>('')

  useEffect(() => {
    if (obRows.length === 0) {
      setUserReqManning(null)
      setReqManningStr('')
    }
  }, [obRows.length])

  const dragOpRef = useRef<LeftOp | null>(null)
  const dragRowIdx = useRef<number | null>(null)
  const dragOverRowIdx = useRef<number | null>(null)

  // ── Derived ──────────────────────────────────────────────────────────────────
  const totalSam = obRows.reduce((s, r) => s + r.sam, 0)
  const allocTotal = obRows.reduce((s, r) => s + r.alloc, 0) // sum of per-row alloc (Excel B25)

  const activeReqManning = userReqManning !== null ? userReqManning : obRows.length

  // Alloc-based targets (using sum of per-row alloc = Excel B25)
  const alloc100Hr = totalSam > 0 ? allocTotal * 60 / totalSam : 0
  const alloc100Day = totalSam > 0 ? allocTotal * WORKING_MINS / totalSam : 0

  // Req-based line target (using base req manning = activeReqManning)
  const req100Hr = totalSam > 0 ? activeReqManning * 60 / totalSam : 0

  // Per-row calculations
  const computedRows = obRows.map(r => ({ ...r, ...calcRow(r, alloc100Hr, req100Hr) }))

  // Header Req Manning = activeReqManning directly to keep totals identical
  const totalReqManning = activeReqManning
  const line100TgtHr = totalSam > 0 ? totalReqManning * 60 / totalSam : 0
  const line100TgtDay = totalSam > 0 ? totalReqManning * WORKING_MINS / totalSam : 0

  // ── Fetch left ops ────────────────────────────────────────────────────────────
  const fetchOps = useCallback(async () => {
    if (!effectiveBranchId) {
      setLeftOps([])
      setLeftLoading(false)
      return
    }
    setLeftLoading(true)
    try {
      const res = await apiCall<{ data?: { operations?: LeftOp[] } | LeftOp[] }>(
        '/operation/drodownoperationList',
        {
          method: 'GET',
          encrypt: false,
          payload: {
            page: '1',
            per_page: '500',
            search: '',
            branch_id: effectiveBranchId,
          },
        }
      )
      const raw = res.data
      if (Array.isArray(raw)) setLeftOps(raw)
      else setLeftOps((raw as { operations?: LeftOp[] })?.operations ?? [])
    } catch { setLeftOps([]) }
    finally { setLeftLoading(false) }
  }, [effectiveBranchId])

  useEffect(() => {
    fetchOps()
  }, [fetchOps])

  useEffect(() => {
    if (!isAdmin && branchId) {
      setLeftBranchFilter(String(branchId))
    }
  }, [isAdmin, branchId])

  useEffect(() => {
    if (leftBranchFilter) {
      setStyleForm(f => ({ ...f, branch_id: leftBranchFilter }))
    } else if (branchId && !styleForm.branch_id) {
      setStyleForm(f => ({ ...f, branch_id: String(branchId) }))
    }
  }, [leftBranchFilter, branchId])

  useEffect(() => {
    const payload: Record<string, unknown> = { type: 'buyer' }
    if (effectiveBranchId) {
      payload.branch_id = effectiveBranchId
    }

    apiCall<any>('/dropdown/options-dropdown', {
      method: 'GET',
      encrypt: false,
      payload,
    })
      .then(res => {
        const records = res?.data?.records?.buyer ?? [];
        setBuyers(Array.isArray(records) ? records : []);
      })
      .catch(() => { setBuyers([]); });
  }, [effectiveBranchId])

  // ── Add rows ──────────────────────────────────────────────────────────────────
  const addOps = useCallback((ops: LeftOp[]) => {
    const maxSeq = obRows.reduce((m, r) => Math.max(m, r.seq), 0)
    const newRows: OBRow[] = ops.map((op: any, i) => {
      const mTypeId = op.machineType?.id ?? op.machine_type_id ?? op.machine_id ?? null
      const mTypeName = op.machine_type_name
        ?? op.machineType?.type_name
        ?? op.machine_type?.type_name
        ?? '—'

      return {
        key: `${op.id}-${Date.now()}-${i}`,
        operationId: op.id,
        operationUuid: op.uuid,
        operationName: op.operation_name,
        machineTypeId: mTypeId,
        machineTypeName: mTypeName,
        machine_id: op.machine?.id ?? op.machine_id ?? null,
        sam: Math.max(0.01, parseFloat(String(op.sam)) || 0.35),
        seq: maxSeq + (i + 1) * 10,
        alloc: 1,  // default alloc
        branch_id: op.branch_id ?? op.branch?.id ?? null,
      }
    })
    setObRows(prev => [...prev, ...newRows])
    setSelectedIds(new Set())
  }, [obRows])

  // ── Drag: left → right ────────────────────────────────────────────────────────
  const handleLeftDragStart = (op: LeftOp) => { if (canOBCreate) dragOpRef.current = op }
  const handleRightDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (canOBCreate && dragOpRef.current) { addOps([dragOpRef.current]); dragOpRef.current = null }
  }

  // ── Drag: row reorder ─────────────────────────────────────────────────────────
  const handleRowDragStart = (e: React.DragEvent, idx: number) => {
    dragRowIdx.current = idx
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleRowDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    dragOverRowIdx.current = idx
  }
  const handleRowDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const from = dragRowIdx.current
    const to = dragOverRowIdx.current
    if (from === null || to === null || from === to) return
    setObRows(prev => {
      const arr = [...prev]
      const [removed] = arr.splice(from, 1)
      arr.splice(to, 0, removed)
      return arr.map((r, i) => ({ ...r, seq: (i + 1) * 10 }))
    })
    dragRowIdx.current = null
    dragOverRowIdx.current = null
  }

  // ── Row mutations ─────────────────────────────────────────────────────────────
  const updateRow = (idx: number, patch: Partial<OBRow>) =>
    setObRows(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r))

  const deleteRow = (idx: number) =>
    setObRows(prev => {
      const remaining = prev.filter((_, i) => i !== idx)
      return remaining.map((r, i) => ({ ...r, seq: (i + 1) * 10 }))
    })

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleConfirmSave = async () => {
    setSaving(true)
    try {
      console.log('machineTypes', JSON.stringify(computedRows))
      const payload = {
        branch_id: styleForm.branch_id,
        operation_bulletin_data: {
          shift_hours: SHIFT_HOURS,
          working_mins: WORKING_MINS,
          req_manning: formatValue(totalReqManning),
          allocated_manning: formatValue(allocTotal),
          req_target_hun_hr: formatValue(line100TgtHr),
          req_target_hun_day: formatValue(line100TgtDay),
          req_target_six_day: formatValue(line100TgtDay * 0.6),
          req_target_six_hr: formatValue(line100TgtHr * 0.6),
          all_target_hun_day: formatValue(alloc100Day),
          all_target_hun_hr: formatValue(alloc100Hr),
          all_target_six_day: formatValue(alloc100Day * 0.6),
          all_target_six_hr: formatValue(alloc100Hr * 0.6),
          total_sam: formatValue(totalSam),
          style_id: null,
          branch_id: styleForm.branch_id,
        },
        bulletin_list: computedRows.map(row => ({
          ...(row.machineTypeId !== null ? { machine_id: row.machineTypeId } : {}),
          operation_id: row.operationId,
          machine_id: row.machineTypeId,
          seq_no: row.seq,
          target_hun_hr: formatValue(row.row100Hr),
          req_manning: formatValue(row.reqManning),
          all_manning: row.alloc,
          all_manning_target_hun_hr: formatValue(row.allocManni100Hr),
          order_id: null,
          sam: row.sam,
        })),
        style_details: {
          style_name: styleForm.style_name,
          buyer: styleForm.buyer,
          branch_id: styleForm.branch_id,
          ...(styleForm.style_no ? { style_no: styleForm.style_no } : {})
        }
      }
      const res = await apiCall<{ success?: boolean; message?: string }>(
        '/operationbullatin/create', { payload }
      )
      if (res.success === false) { setToast({ message: res.message || 'Save failed', type: 'error' }); return }

      setToast({ message: res.message || 'Operation Bulletin saved successfully', type: 'success' })
      setShowPreview(false)
      setStyleForm({ buyer: '', style_no: '', style_name: '', branch_id: branchId ? String(branchId) : '' })
      setObRows([])
    } catch { setToast({ message: 'Failed to save OB', type: 'error' }) }
    finally { setSaving(false) }
  }

  // ── Filtered ops ──────────────────────────────────────────────────────────────
  const filteredOps = leftOps.filter(op =>
    !leftSearch ||
    op.operation_name.toLowerCase().includes(leftSearch.toLowerCase()) ||
    (op.code ?? '').toLowerCase().includes(leftSearch.toLowerCase())
  )

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectedOps = leftOps.filter(o => selectedIds.has(o.id))

  // ── Create Style after OB save ────────────────────────────────────────────────
  const handleNextToPreview = () => {
    if (!styleForm.buyer.trim()) { setStyleError('Buyer is required'); return }
    if (!styleForm.style_name.trim()) { setStyleError('Style name is required'); return }
    if (!styleForm.branch_id) { setStyleError('Branch is required'); return }
    setStyleError('')
    setShowStyleModal(false)
    setShowPreview(true)
  }

  const handleSaveOB = () => {
    const missingMachine = obRows.filter(r => r.machine_id === null)
    // if (missingMachine.length > 0) {
    //   setToast({
    //     message: `Assign a machine to: ${missingMachine.map(r => r.operationName).join(', ')}`,
    //     type: 'error',
    //   })
    //   return
    // }

    const seqs = obRows.map(r => r.seq)
    const duplicates = seqs.filter((s, idx) => seqs.indexOf(s) !== idx)
    if (duplicates.length > 0) {
      const uniqueDupes = Array.from(new Set(duplicates))
      setToast({
        message: `bulletin_list: duplicate seq_no=${uniqueDupes.join(', ')} found in request`,
        type: 'error',
      })
      return
    }

    // Auto-detect branch_id from added operations if present
    const detectedBranchId = obRows.map(r => r.branch_id).find(b => b != null)
    if (detectedBranchId != null) {
      setStyleForm(f => ({ ...f, branch_id: String(detectedBranchId) }))
    } else if (branchId) {
      setStyleForm(f => ({ ...f, branch_id: String(branchId) }))
    }

    setShowStyleModal(true)
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showPreview && (
        <PreviewModal
          rows={computedRows}
          onClose={() => { setShowPreview(false); setShowStyleModal(true); }}
          onConfirm={handleConfirmSave}
          saving={saving}
          styleForm={styleForm}
          activeReqManning={activeReqManning}
        />
      )}

      {showStyleModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-modal rounded-card shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-table-line">
              <h2 className="text-base font-semibold text-t-primary">Save OB → Create Style</h2>
              <button onClick={() => { setShowStyleModal(false) }}
                className="bg-transparent border-none cursor-pointer text-t-lighter hover:text-t-primary p-1">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 flex flex-col gap-3">
              {styleError && (
                <div className="px-3 py-2 border border-red-300 rounded-input text-xs text-red-600">
                  {styleError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-t-body">Buyer <span className="text-red-400">*</span></label>
                  <select
                    value={styleForm.buyer}
                    onChange={e => { setStyleForm(f => ({ ...f, buyer: e.target.value })); setStyleError('') }}
                    className="w-full h-input-h px-2.5 text-sm2 bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-secondary"
                  >
                    <option value="">Select buyer</option>
                    {buyers.map(b => (
                      <option key={b.id} value={b.value}>{b.value}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-t-body">Style Number</label>
                  <input
                    type="text" value={styleForm.style_no} placeholder="e.g. Et2535"
                    onChange={e => setStyleForm(f => ({ ...f, style_no: e.target.value }))}
                    className="w-full h-input-h px-2.5 text-sm2 bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-t-body">Style Name <span className="text-red-400">*</span></label>
                  <input
                    type="text" value={styleForm.style_name} placeholder="e.g. Legging, Polo T-Shirt"
                    onChange={e => { setStyleForm(f => ({ ...f, style_name: e.target.value })); setStyleError('') }}
                    className="w-full h-input-h px-2.5 text-sm2 bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-secondary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-t-body">Branch <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    readOnly
                    value={
                      branches.find(b => String(b.id) === String(styleForm.branch_id))?.branch_name ||
                      '—'
                    }
                    className="w-full h-input-h px-2.5 text-sm2 bg-card-alt border border-input-line rounded-input outline-none text-t-primary font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-lg border border-table-line bg-table-head px-4 py-3">
                <p className="text-xs font-semibold text-t-lighter mb-2">
                  Style Preview | {styleForm.buyer || '—'} | {styleForm.style_no || '—'} | {styleForm.style_name || '—'}
                </p>
                <div className="flex gap-6">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-t-primary">{obRows.length}</span>
                    <span className="text-xs text-t-lighter">operations</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-t-primary">{formatValue(totalSam).toFixed(2)}</span>
                    <span className="text-xs text-t-lighter">Total SAM</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-t-primary">{formatValue(allocTotal)}</span>
                    <span className="text-xs text-t-lighter">Manning</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-table-line">
              <Button variant="outline" onClick={() => { setShowStyleModal(false) }}>Cancel</Button>
              <Button variant="primary" onClick={handleNextToPreview}>Next</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full overflow-hidden">

        {/* ── Title row ── */}
        <div className="flex items-start justify-between px-5 py-3 border-b border-table-line shrink-0 bg-card">
          <div>
            <h1 className="text-base font-bold text-t-primary">Operation Bulletin (OB)</h1>
            <p className="text-xs text-t-lighter mt-0.5">Assign operations to a style with SAM values, sequence &amp; manning</p>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t-lighter pointer-events-none" />
              <input
                placeholder="Search"
                className="h-8 pl-8 pr-3 text-sm2 bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-secondary w-44"
              />
            </div>
            <Button variant="outline" size="sm" leftIcon={<Download size={13} />}>Export</Button>
            <Button variant="outline" size="sm" leftIcon={<Upload size={13} />}>Import</Button>
          </div>
        </div>

        {/* ── Stat cards (commented out to avoid duplicate information) ── */}
        {/* <div className="flex border-b border-table-line shrink-0 bg-table-head">
          <StatCard value={`${SHIFT_HOURS} hrs`} label="Shift Hrs" />
          <StatCard value={WORKING_MINS} label="Working Min" />
          <StatCard value={totalReqManning} label="Req Manning" />
          <StatCard value={obRows.length} label="Operations" />
          <StatCard value={formatValue(totalSam).toFixed(2)} label="Total SAM" />
          <StatCard value={fmt(formatValue(alloc100Hr))} label="Alloc Manning 100%/Hr" />
          <StatCard value={fmt(formatValue(alloc100Hr * 0.6))} label="Alloc Manning 60%/Hr" />
          <StatCard value={formatValue(allocTotal).toFixed(2)} label="Alloc Manning" />
        </div> */}

        {/* ── Two-panel ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left panel */}
          <div className="w-[240px] shrink-0 border-r border-table-line flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-table-line shrink-0">
              <p className="text-sm font-semibold text-t-secondary">Operation</p>
            </div>

            <>
              <div className="px-3 py-2 shrink-0 flex flex-col gap-2">
                <select
                  value={leftBranchFilter}
                  onChange={e => setLeftBranchFilter(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full h-7 px-2 text-xs bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-secondary cursor-pointer disabled:opacity-60"
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={String(b.id)}>
                      {b.branch_name}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t-lighter pointer-events-none" />
                  <input
                    value={leftSearch}
                    onChange={e => setLeftSearch(e.target.value)}
                    placeholder="Search.."
                    className="w-full h-7 pl-7 pr-3 text-xs bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-secondary"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {leftLoading ? (
                  <div className="flex flex-col gap-1 px-3 py-2">
                    {[1, 2, 3, 4, 5].map(n => <div key={n} className="h-11 bg-table-head rounded animate-pulse" />)}
                  </div>
                ) : !effectiveBranchId ? (
                  <p className="text-xs text-t-lighter text-center py-8">Select a branch to view operations</p>
                ) : filteredOps.length === 0 ? (
                  <p className="text-xs text-t-lighter text-center py-8">No operations found</p>
                ) : (
                  filteredOps.map(op => (
                    <div
                      key={op.id}
                      draggable={canOBCreate}
                      onDragStart={() => handleLeftDragStart(op)}
                      className={`flex items-center gap-2 px-3 py-2.5 border-b border-table-line hover:bg-card-alt select-none group ${canOBCreate ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                    >
                      {canOBCreate && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(op.id)}
                          onChange={() => toggleSelect(op.id)}
                          onClick={e => e.stopPropagation()}
                          className="accent-accent w-3.5 h-3.5 shrink-0 cursor-pointer"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-t-secondary truncate uppercase">{op.operation_name}</p>
                        <p className="text-2xs text-t-lighter truncate mt-0.5">
                          {op.machine_type_name ?? op.machineType?.type_name ?? '—'} &middot; SAM: {parseFloat(String(op.sam)).toFixed(2)}
                        </p>
                      </div>
                      {canOBCreate && (
                        <GripVertical size={13} className="text-t-lighter shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {canOBCreate && (
                <div className="px-3 py-2.5 border-t border-table-line shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => selectedOps.length > 0 ? addOps(selectedOps) : undefined}
                    disabled={selectedOps.length === 0}
                    className="w-full"
                  >
                    → Add to Operation Bulletin (OB)
                  </Button>
                </div>
              )}
            </>
          </div>

          {/* Right panel */}
          <div
            className={`flex-1 flex flex-col overflow-hidden ${canOBCreate && isDragOver ? 'bg-accent/5' : ''}`}
            onDragOver={e => { if (canOBCreate) { e.preventDefault(); setIsDragOver(true) } }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={canOBCreate ? handleRightDrop : undefined}
          >
            {/* Right header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-table-line shrink-0 bg-card">
              <span className="text-sm font-semibold text-t-secondary">Operation Bulletin (OB)</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-t-lighter">
                  Manning: <span className="font-bold text-t-primary">{formatValue(allocTotal).toFixed(2)}</span>
                </span>
                {canOBCreate && (
                  <Button variant="primary" size="sm" onClick={handleSaveOB} disabled={obRows.length === 0}>
                    Save to Operation Bulletin (OB)
                  </Button>
                )}
              </div>
            </div>

            {/* KPI Summary Cards Grid (6 cols x 2 rows) */}
            <div className="flex flex-col border-b border-table-line shrink-0 bg-table-head/40">
              {/* Line 1: First 6 labels */}
              <div className="grid grid-cols-6 w-full border-b border-table-line">
                <StatCard value={`${SHIFT_HOURS} hrs`} label="Shift Hr" />
                <StatCard value={WORKING_MINS} label="Working Min" />
                <StatCard value={fmt(formatValue(line100TgtDay))} label="100 % Target / Day" />
                <StatCard value={fmt(formatValue(line100TgtHr))} label="100 % Target / Hr" />
                <StatCard value={fmt(formatValue(line100TgtDay * 0.6))} label="60 % Target / Day" />
                <StatCard value={fmt(formatValue(line100TgtHr * 0.6))} label="60 % Target / Hr" />
              </div>

              {/* Line 2: Second 6 labels */}
              <div className="grid grid-cols-6 w-full">
                {/* Req Manning Cell */}
                <div className="flex flex-col items-center justify-center flex-1 px-3 py-2 border-r border-table-line bg-table-head/40">
                  <span className="text-2xs font-medium text-t-lighter mb-1 whitespace-nowrap">Req Manning</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={reqManningStr}
                    placeholder={String(totalReqManning)}
                    onChange={e => {
                      let valStr = e.target.value.replace(/[^0-9.]/g, '')
                      const parts = valStr.split('.')
                      if (parts.length > 2) {
                        valStr = parts[0] + '.' + parts.slice(1).join('')
                      }
                      setReqManningStr(valStr)
                      const val = parseFloat(valStr)
                      setUserReqManning(isNaN(val) ? null : val)
                    }}
                    className="w-16 h-6 px-1.5 text-xs text-center font-bold text-t-primary bg-input border border-input-line rounded-input outline-none focus:border-accent cursor-text"
                  />
                </div>
                <StatCard value={formatValue(allocTotal).toFixed(2)} label="Allocated Manning" />
                <StatCard value={obRows.length} label="Total Operation" />
                <StatCard value={fmt(formatValue(totalSam))} label="Total SAM" />
                <StatCard value={fmt(formatValue(alloc100Hr))} label="Alloc Manning 100%/Hr" />
                <StatCard value={fmt(formatValue(alloc100Hr * 0.6))} label="Alloc Manning 60%/Hr" />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {obRows.length === 0 ? (
                <div className={`flex flex-col items-center justify-center h-full gap-3 ${isDragOver ? 'text-accent' : 'text-t-lighter'}`}>
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                    <span className="text-xl font-bold leading-none">+</span>
                  </div>
                  <p className="text-sm font-medium">Drag operations here or select &amp; click Add</p>
                </div>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-table-head sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2.5 w-6" />
                      <th className="px-3 py-2.5 text-center text-t-lighter font-medium w-16">Seq</th>
                      <th className="px-3 py-2.5 text-left text-t-lighter font-medium">Machine Type</th>
                      <th className="px-3 py-2.5 text-left text-t-lighter font-medium">Operation</th>
                      <th className="px-3 py-2.5 text-right text-t-lighter font-medium w-20">SAM</th>
                      <th className="px-3 py-2.5 text-right text-t-lighter font-medium text-accent w-20">100%/Hr</th>
                      <th className="px-3 py-2.5 text-right text-t-lighter font-medium w-20">Req Manning</th>
                      <th className="px-3 py-2.5 text-right text-t-lighter font-medium w-24">Allocated Manning</th>
                      <th className="px-3 py-2.5 text-right text-t-lighter font-medium">Alloc<br />Manni 100 % HR</th>
                      <th className="px-2 py-2.5 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {computedRows.map((row, i) => (
                      <tr
                        key={row.key}
                        draggable
                        onDragStart={e => handleRowDragStart(e, i)}
                        onDragOver={e => handleRowDragOver(e, i)}
                        onDrop={handleRowDrop}
                        className={`border-t border-table-line hover:bg-accent/5 transition-colors ${i % 2 === 0 ? 'bg-card' : 'bg-card-alt'}`}
                      >
                        {/* Drag handle */}
                        <td className="px-2 py-2 text-t-lighter cursor-grab">
                          <GripVertical size={13} />
                        </td>

                        {/* Seq */}
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={row.seq}
                            onChange={e => updateRow(i, { seq: Number(e.target.value) })}
                            className="w-12 h-6 px-1 text-xs font-mono text-t-secondary bg-input border border-input-line rounded text-center outline-none focus:border-accent"
                          />
                        </td>

                        {/* Machine Type */}
                        <td className="px-3 py-2 text-t-body">{row.machineTypeName}</td>

                        {/* Operation */}
                        <td className="px-3 py-2 font-semibold text-accent max-w-[160px] truncate">
                          {row.operationName}
                        </td>

                        {/* SAM — editable stepper */}
                        <td className="px-2 py-1.5">
                          <div className="flex justify-end">
                            <Stepper
                              value={row.sam}
                              step={0.01}
                              min={0.01}
                              onChange={v => updateRow(i, { sam: v })}
                            />
                          </div>
                        </td>

                        {/* 100%/Hr — auto */}
                        <td className="px-3 py-2 text-right font-semibold text-accent">
                          {fmt(formatValue(row.row100Hr))}
                        </td>

                        {/* Req Manni — auto (Excel G = alloc100Hr/row100Hr) */}
                        <td className="px-3 py-2 text-right text-t-body">
                          {formatValue(row.reqManning).toFixed(2)}
                          {/* {row.reqManning} */}
                        </td>

                        {/* Alloc — per-row editable stepper (Excel H, default = allocManning) */}
                        <td className="px-2 py-1.5">
                          <div className="flex justify-end">
                            <Stepper
                              value={row.alloc}
                              step={0.25}
                              min={0}
                              onChange={v => updateRow(i, { alloc: v })}
                            />
                          </div>
                        </td>

                        {/* Alloc Manni 100%HR — auto (Excel I = H×F = alloc × row100Hr) */}
                        <td className="px-3 py-2 text-right font-mono text-t-secondary">
                          {fmt(formatValue(row.allocManni100Hr))}
                        </td>

                        {/* Delete */}
                        {canOBCreate && (
                          <td className="px-2 py-2">
                            <button
                              onClick={() => deleteRow(i)}
                              className="p-1 text-t-lighter hover:text-danger transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}