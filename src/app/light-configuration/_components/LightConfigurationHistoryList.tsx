'use client'

import { useMemo } from 'react'
import AdvancedTable, { type AdvancedColumn } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useExport } from '@/hooks/useExport'
import type { LightConfigHistoryRecord } from '../types'
import type { BranchOption } from '@/hooks/useDropdownData'

interface LightConfigurationHistoryListProps {
  records: LightConfigHistoryRecord[]
  loading: boolean
  search: string
  onSearchChange: (val: string) => void
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  onPageChange: (p: number) => void
  onPerPageChange: (pp: number) => void
  isAdmin?: boolean
  branchId?: number | null
  branches?: BranchOption[]
  branchFilter?: string
  onBranchFilterChange?: (val: string) => void
  canList?: boolean
}

// ── Light badge helper ─────────────────────────────────────────────────────
function getLightBadge(color?: string | null) {
  if (!color) return <span className="text-t-muted text-xs">—</span>
  const c = color.trim().toLowerCase()
  if (c === 'red')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
        <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
        <span>{color}</span>
      </span>
    )
  if (c === 'green')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        <span>{color}</span>
      </span>
    )
  if (c === 'amber' || c === 'yellow' || c === 'orange')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
        <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
        <span>{color}</span>
      </span>
    )
  return <span>{color}</span>
}

function formatDateTime(val?: string | null): string {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

export default function LightConfigurationHistoryList({
  records,
  loading,
  search,
  onSearchChange,
  page,
  perPage,
  totalPages,
  totalCount,
  onPageChange,
  onPerPageChange,
  isAdmin = false,
  branchId = null,
  branches = [],
  branchFilter = '',
  onBranchFilterChange,
  canList = true,
}: LightConfigurationHistoryListProps) {
  const effectiveBranch =
    branchId != null
      ? String(branchId)
      : (branchFilter || (branches && branches.length > 0 ? String(branches[0].id) : ''))

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/tlsAuditLightConfiguration/historylist',
    payload: {
      type: 'pdf',
      ...(effectiveBranch ? { branch_id: effectiveBranch } : {}),
      ...(search ? { search } : {}),
    },
    filename: 'Audit_Light_Configuration_History_Report',
  })

  const { handleExport: handleExportExcel, exporting: exportingExcel } = useExport<LightConfigHistoryRecord>({
    apiPath: '/tlsAuditLightConfiguration/historylist',
    payload: {
      type: 'excel',
      ...(effectiveBranch ? { branch_id: effectiveBranch } : {}),
      ...(search ? { search } : {}),
    },
    filename: 'Audit_Light_Configuration_History_Report',
  })

  const columns: AdvancedColumn<LightConfigHistoryRecord>[] = useMemo(
    () => [
      {
        key: 'sl_no',
        header: 'S.No',
        className: 'w-14 text-center',
        headerClassName: 'w-14 text-center',
        render: (_r, idx) => (
          <span className="text-xs text-t-muted">{(page - 1) * perPage + idx + 1}</span>
        ),
      },
      {
        key: 'module',
        header: 'Module',
        className: 'min-w-[130px]',
        headerClassName: 'min-w-[130px]',
        sortable: true,
        sortValue: (r) => r.module ?? '',
        render: (r) => (
          <span className="font-semibold text-t-primary text-xs">{r.module || '—'}</span>
        ),
      },
      {
        key: 'present_light',
        header: 'Present Light',
        className: 'min-w-[120px] text-center',
        headerClassName: 'min-w-[120px] text-center',
        render: (r) => getLightBadge(r.present_light),
      },
      {
        key: 'audit_status',
        header: 'Audit Status',
        className: 'min-w-[100px] text-center',
        headerClassName: 'min-w-[100px] text-center',
        sortable: true,
        sortValue: (r) => r.audit_status ?? '',
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
        render: (r) => (
          <span className="font-mono text-xs text-t-secondary">
            {r.condition_operator || '—'}
          </span>
        ),
      },
      {
        key: 'defect_qty',
        header: 'Defect Qty',
        className: 'min-w-[90px] text-center',
        headerClassName: 'min-w-[90px] text-center',
        sortable: true,
        sortValue: (r) => Number(r.defect_qty ?? 0),
        render: (r) => (
          <span className="text-xs font-semibold text-t-primary">
            {r.defect_qty !== null && r.defect_qty !== undefined ? String(r.defect_qty) : '—'}
          </span>
        ),
      },
      {
        key: 'rule_description',
        header: 'Rule Description',
        className: 'min-w-[220px]',
        headerClassName: 'min-w-[220px]',
        render: (r) => (
          <span className="text-t-body text-xs line-clamp-2">{r.rule_description || '—'}</span>
        ),
      },
      {
        key: 'updated_light',
        header: 'Updated Light',
        className: 'min-w-[120px] text-center',
        headerClassName: 'min-w-[120px] text-center',
        render: (r) => getLightBadge(r.updated_light),
      },
      {
        key: 'created_at',
        header: 'Changed At',
        className: 'min-w-[140px] text-center',
        headerClassName: 'min-w-[140px] text-center',
        sortable: true,
        sortValue: (r) => r.created_at ?? '',
        render: (r) => (
          <span className="text-xs text-t-secondary">{formatDateTime(r.created_at)}</span>
        ),
      },
    ],
    [page, perPage]
  )

  return (
    <AdvancedTable<LightConfigHistoryRecord>
      columns={columns}
      data={records}
      loading={loading}
      rowKey={(r) => String(r.id)}
      emptyMessage={canList ? 'No history records found' : 'You do not have permission to view history records'}
      tealHeader={true}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      perPage={perPage}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
      countLabel="record"
      countLabelPlural="records"
      header={
        <Toolbar
          title="Light Configuration History"
          search={search}
          onSearchChange={(val) => {
            onSearchChange(val)
            onPageChange(1)
          }}
          searchPlaceholder="Search module, description, light..."
          onExport={handleExportExcel}
          onExportPdf={handleExportPdf}
          exporting={exportingExcel || exportingPdf}
        />
      }
    />
  )
}
