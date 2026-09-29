'use client'

import { useState, useMemo } from 'react'
import AdvancedTable, { type AdvancedColumn } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { RotateCcw, Save, Loader2, X } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useExport } from '@/hooks/useExport'
import type { BranchOption } from '@/hooks/useDropdownData'
import type { TlsAuditLightConfigItem, UpdateLightConfigPayload } from '../types'

interface LightConfigurationListProps {
  items: TlsAuditLightConfigItem[]
  loading: boolean
  updating: boolean
  resetting: boolean
  search: string
  onSearchChange: (val: string) => void
  onSaveAll: (payloads: UpdateLightConfigPayload[]) => Promise<boolean | void>
  onReset: () => Promise<void>
  isAdmin?: boolean
  branchId?: number | null
  branches?: BranchOption[]
  branchFilter?: string
  onBranchFilterChange?: (val: string) => void
}

function getPresentLightBadge(color?: string | null) {
  if (!color) return <span className="text-t-muted text-xs">—</span>

  const c = color.trim().toLowerCase()

  if (c === 'red') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
        <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
        <span>{color}</span>
      </span>
    )
  }

  if (c === 'green') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        <span>{color}</span>
      </span>
    )
  }

  if (c === 'amber' || c === 'yellow' || c === 'orange') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
        <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
        <span>{color}</span>
      </span>
    )
  }

  return <span>{color}</span>
}

function normalizeLight(val?: string | null): 'Red' | 'Amber' | 'Green' {
  if (!val) return 'Red'
  const c = val.trim().toLowerCase()
  if (c === 'green') return 'Green'
  if (c === 'amber' || c === 'yellow' || c === 'orange') return 'Amber'
  return 'Red'
}

export default function LightConfigurationList({
  items,
  loading,
  updating,
  resetting,
  search,
  onSearchChange,
  onSaveAll,
  onReset,
  isAdmin = false,
  branchId = null,
  branches = [],
  branchFilter = '',
  onBranchFilterChange,
}: LightConfigurationListProps) {
  const { can } = usePermissions('LightConfiguration')
  const canUpdate = can('lightConfiguration.update')
  const canReset = can('lightConfiguration.reset')

  const effectiveBranch =
    branchId != null
      ? String(branchId)
      : (branchFilter || (branches && branches.length > 0 ? String(branches[0].id) : ''))

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/tlsAuditLightConfiguration/list',
    payload: {
      type: 'pdf',
      ...(effectiveBranch ? { branch_id: effectiveBranch } : {}),
      ...(search ? { search } : {}),
    },
    filename: 'Audit_Light_Configuration_Report',
  })

  const { handleExport: handleExportExcel, exporting: exportingExcel } = useExport<TlsAuditLightConfigItem>({
    apiPath: '/tlsAuditLightConfiguration/list',
    payload: {
      type: 'excel',
      ...(effectiveBranch ? { branch_id: effectiveBranch } : {}),
      ...(search ? { search } : {}),
    },
    filename: 'Audit_Light_Configuration_Report',
  })

  // Local draft edits: keyed by item id
  const [edits, setEdits] = useState<Record<string | number, { defect_qty?: string | number | null; updated_light?: string }>>({})
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Calculate actual diffs against original item values
  const actualChangedEdits = useMemo(() => {
    const diffs: Record<string | number, { defect_qty?: string | number | null; updated_light?: string }> = {}
    Object.entries(edits).forEach(([id, edit]) => {
      const orig = items.find((it) => String(it.id) === String(id))
      if (!orig) return

      const origQty = orig.defect_qty === null || orig.defect_qty === undefined ? '' : String(orig.defect_qty)
      const editQty = edit.defect_qty === null || edit.defect_qty === undefined ? '' : String(edit.defect_qty)
      const origLight = normalizeLight(orig.updated_light)
      const editLight = normalizeLight(edit.updated_light)

      if (origQty !== editQty || origLight !== editLight) {
        diffs[id] = edit
      }
    })
    return diffs
  }, [edits, items])

  const changedCount = Object.keys(actualChangedEdits).length

  // Client-side filter
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase().trim()
    return items.filter(
      (it) =>
        it.module?.toLowerCase().includes(q) ||
        it.rule_description?.toLowerCase().includes(q) ||
        it.present_light?.toLowerCase().includes(q) ||
        it.updated_light?.toLowerCase().includes(q) ||
        it.audit_status?.toLowerCase().includes(q) ||
        it.defect_type?.toLowerCase().includes(q)
    )
  }, [items, search])

  const handleDefectQtyChange = (id: string | number, val: string) => {
    // Only allow positive integer numbers (digits 0-9)
    const cleanVal = val.replace(/\D/g, '')
    const originalItem = items.find((it) => String(it.id) === String(id))
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        defect_qty: cleanVal,
        updated_light: prev[id]?.updated_light ?? normalizeLight(originalItem?.updated_light),
      },
    }))
  }

  const handleUpdatedLightChange = (id: string | number, val: string) => {
    const originalItem = items.find((it) => String(it.id) === String(id))
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        defect_qty: prev[id]?.defect_qty !== undefined ? prev[id].defect_qty : (originalItem?.defect_qty ?? ''),
        updated_light: val,
      },
    }))
  }

  const handleSave = async () => {
    const payloads: UpdateLightConfigPayload[] = Object.entries(actualChangedEdits).map(([id, values]) => ({
      id,
      defect_qty: values.defect_qty === '' ? null : values.defect_qty,
      updated_light: values.updated_light,
    }))
    if (payloads.length === 0) return

    const success = await onSaveAll(payloads)
    if (success !== false) {
      setEdits({})
    }
  }

  const handleConfirmReset = async () => {
    setShowResetConfirm(false)
    setEdits({})
    await onReset()
  }

  // Columns specification for AdvancedTable (No pagination needed for S.No)
  const columns: AdvancedColumn<TlsAuditLightConfigItem>[] = useMemo(() => {
    return [
      {
        key: 'sl_no',
        header: 'S.No',
        className: 'w-14 text-center',
        headerClassName: 'w-14 text-center',
        render: (_r, idx) => <span className="text-xs text-t-muted">{idx + 1}</span>,
      },
      {
        key: 'module',
        header: 'Module',
        className: 'min-w-[130px]',
        headerClassName: 'min-w-[130px]',
        render: (r) => <span className="font-semibold text-t-primary text-xs">{r.module || '—'}</span>,
      },
      {
        key: 'present_light',
        header: 'Present Light',
        className: 'min-w-[120px] text-center',
        headerClassName: 'min-w-[120px] text-center',
        render: (r) => getPresentLightBadge(r.present_light),
      },
      {
        key: 'audit_status',
        header: 'Audit Status',
        className: 'min-w-[100px] text-center',
        headerClassName: 'min-w-[100px] text-center',
        render: (r) =>
          r.audit_status ? (
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${r.audit_status.toLowerCase() === 'pass'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                }`}
            >
              {r.audit_status}
            </span>
          ) : (
            <span className="text-t-muted">—</span>
          ),
      },
      {
        key: 'defect_type',
        header: 'Defect Type',
        className: 'min-w-[110px] text-center text-xs',
        headerClassName: 'min-w-[110px] text-center',
        render: (r) => <span>{r.defect_type || '—'}</span>,
      },
      {
        key: 'condition',
        header: 'Condition',
        className: 'min-w-[90px] text-center',
        headerClassName: 'min-w-[90px] text-center',
        render: (r) => <span className="font-mono text-xs text-t-secondary">{r.condition_operator || '—'}</span>,
      },
      {
        key: 'defect_qty',
        header: 'Defect qty',
        className: 'min-w-[100px] text-center',
        headerClassName: 'min-w-[100px] text-center',
        render: (r) => {
          const rowVal =
            edits[r.id]?.defect_qty !== undefined
              ? edits[r.id].defect_qty
              : (r.defect_qty ?? '')
          const displayVal = rowVal === null || rowVal === undefined ? '' : String(rowVal)

          return (
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={displayVal}
              onChange={(e) => handleDefectQtyChange(r.id, e.target.value)}
              disabled={!canUpdate || updating}
              placeholder="—"
              className="w-16 h-7 px-2 text-center text-xs font-semibold bg-card border border-input-line rounded-lg text-t-primary focus:border-accent focus:outline-none transition-colors disabled:opacity-50"
            />
          )
        },
      },
      {
        key: 'rule_description',
        header: 'Rule Description',
        className: 'min-w-[220px]',
        headerClassName: 'min-w-[220px]',
        render: (r) => <span className="text-t-body text-xs line-clamp-2">{r.rule_description || '—'}</span>,
      },
      {
        key: 'updated_light',
        header: 'Updated Light',
        className: 'min-w-[130px] text-center',
        headerClassName: 'min-w-[130px] text-center',
        render: (r) => {
          const rawLight =
            edits[r.id]?.updated_light !== undefined
              ? edits[r.id].updated_light
              : r.updated_light
          const currentLight = normalizeLight(rawLight)

          return (
            <select
              value={currentLight}
              onChange={(e) => handleUpdatedLightChange(r.id, e.target.value)}
              disabled={!canUpdate || updating}
              className={`h-7 px-2.5 py-0.5 text-xs font-semibold rounded-lg border outline-none cursor-pointer transition-colors ${currentLight === 'Red'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                  : currentLight === 'Green'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                } disabled:opacity-50`}
            >
              <option value="Red">Red</option>
              <option value="Amber">Amber</option>
              <option value="Green">Green</option>
            </select>
          )
        },
      },
    ]
  }, [canUpdate, updating, edits])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <AdvancedTable<TlsAuditLightConfigItem>
        columns={columns}
        data={filteredItems}
        loading={loading}
        rowKey={(r) => String(r.id)}
        emptyMessage="No light configuration rules found"
        tealHeader={true}
        header={
          <Toolbar
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search module, description, light..."
            onExport={handleExportExcel}
            onExportPdf={handleExportPdf}
            exporting={exportingExcel || exportingPdf}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {/* Reset to Defaults Button */}
              {canReset && (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={resetting || loading || updating}
                  className="h-8 px-3 rounded-lg text-xs font-semibold text-[#0d939d] dark:text-[#2dd4bf] bg-card border border-[#0d939d] hover:bg-[#0d939d]/10 dark:hover:bg-[#0d939d]/20 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reset all light configurations back to defaults"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                  <span>Reset to Defaults</span>
                </button>
              )}

              {/* Clear / Discard Draft Changes Button */}
              {canUpdate && (
                <button
                  type="button"
                  onClick={() => setEdits({})}
                  disabled={updating || loading || changedCount === 0}
                  className="h-8 px-3 rounded-lg text-xs font-semibold text-t-secondary bg-card border border-input-line hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 dark:hover:border-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title={changedCount > 0 ? 'Discard all unsaved changes' : 'No changes to clear'}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}

              {/* Save Button (placed directly after Reset to Defaults & Clear) */}
              {canUpdate && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={updating || loading || changedCount === 0}
                  className="h-8 px-3.5 rounded-lg text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  title={changedCount > 0 ? `Save ${changedCount} changed configuration(s)` : 'No changes to save'}
                >
                  {updating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save{changedCount > 0 ? ` (${changedCount})` : ''}</span>
                </button>
              )}
            </div>
          </Toolbar>
        }
        footer={
          <div className="px-4 py-3 border-t border-table-line flex items-center justify-between">
            <span className="text-xs font-semibold text-t-secondary">
              Total Light Configurations:{' '}
              <span className="text-accent font-bold">{filteredItems.length}</span>
            </span>
          </div>
        }
      />

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <ConfirmDialog
          title="Reset Light Configurations"
          message="Are you sure you want to reset all light configuration rules to their system defaults? All custom changes will be reverted."
          confirmLabel="Yes, Reset Rules"
          cancelLabel="Cancel"
          variant="primary"
          loading={resetting}
          onConfirm={handleConfirmReset}
          onClose={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  )
}
