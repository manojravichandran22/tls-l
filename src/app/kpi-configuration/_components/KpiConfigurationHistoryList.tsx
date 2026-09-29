'use client'

import { useMemo } from 'react'
import AdvancedTable, { type AdvancedColumn } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useExport } from '@/hooks/useExport'
import type { BranchOption } from '@/hooks/useDropdownData'
import type { KpiHistoryRecord } from '../types'

interface KpiConfigurationHistoryListProps {
  records: KpiHistoryRecord[]
  loading: boolean
  search: string
  onSearchChange: (val: string) => void
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  onPageChange: (p: number) => void
  onPerPageChange: (pp: number) => void
  canList?: boolean
  isAdmin?: boolean
  branchId?: number | null
  branches?: BranchOption[]
  branchFilter?: string
  onBranchFilterChange?: (val: string) => void
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

function formatScoreWithPercent(score?: string | number | null): string {
  if (score === undefined || score === null || score === '') return ''
  const str = String(score).trim()
  if (str === '—') return ''
  return str.endsWith('%') ? str : `${str}%`
}

export default function KpiConfigurationHistoryList({
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
  canList = true,
  isAdmin = false,
  branchId = null,
  branches = [],
  branchFilter = '',
  onBranchFilterChange,
}: KpiConfigurationHistoryListProps) {
  const effectiveBranch = branchId
    ? String(branchId)
    : (branchFilter || (branches && branches.length > 0 ? String(branches[0].id) : ''))

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/kpimaster/historylist',
    payload: {
      type: 'pdf',
      ...(effectiveBranch ? { branch_id: effectiveBranch } : {}),
      ...(search ? { search } : {}),
    },
    filename: 'KPI_Configuration_History_Report',
  })

  const { handleExport: handleExportExcel, exporting: exportingExcel } = useExport<KpiHistoryRecord>({
    apiPath: '/kpimaster/historylist',
    payload: {
      type: 'excel',
      ...(effectiveBranch ? { branch_id: effectiveBranch } : {}),
      ...(search ? { search } : {}),
    },
    filename: 'KPI_Configuration_History_Report',
  })

  const columns: AdvancedColumn<KpiHistoryRecord>[] = useMemo(
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
          <span className="font-semibold text-t-primary text-xs">{r.module || 'Master Inputs'}</span>
        ),
      },
      {
        key: 'score',
        header: 'KPI / Score',
        className: 'min-w-[180px]',
        headerClassName: 'min-w-[180px]',
        sortable: true,
        sortValue: (r) => r.score ?? r.kpi_name ?? '',
        render: (r) => (
          <span className="font-semibold text-t-primary text-xs">
            {formatScoreWithPercent(r.score) || r.kpi_name || '—'}
          </span>
        ),
      },
      {
        key: 'condition',
        header: 'Condition',
        className: 'min-w-[100px] text-center',
        headerClassName: 'min-w-[100px] text-center',
        render: (r) => (
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted/60 text-t-secondary font-bold">
            {r.condition || '—'}
          </span>
        ),
      },
      // {
      //   key: 'threshold',
      //   header: 'Threshold',
      //   className: 'min-w-[110px] text-center',
      //   headerClassName: 'min-w-[110px] text-center',
      //   sortable: true,
      //   sortValue: (r) => Number(r.threshold ?? r.new_threshold ?? 0),
      //   render: (r) => {
      //     const val = r.threshold ?? r.new_threshold
      //     return (
      //       <span className="text-xs font-bold text-accent px-2 py-0.5 rounded bg-accent/10">
      //         {val !== null && val !== undefined ? String(val) : '—'}
      //       </span>
      //     )
      //   },
      // },
      {
        key: 'previous_threshold',
        header: 'Previous Threshold',
        className: 'min-w-[130px] text-center',
        headerClassName: 'min-w-[130px] text-center',
        render: (r) => {
          const val = r.previous_threshold ?? r.old_threshold
          return (
            <span className="text-xs text-t-muted">
              {val !== null && val !== undefined ? String(val) : '—'}
            </span>
          )
        },
      },
      {
        key: 'unit',
        header: 'Unit',
        className: 'min-w-[100px] text-center',
        headerClassName: 'min-w-[100px] text-center',
        render: (r) => <span className="text-xs text-t-secondary">{r.unit || '—'}</span>,
      },


    ],
    [page, perPage]
  )

  return (
    <AdvancedTable<KpiHistoryRecord>
      columns={columns}
      data={records}
      loading={loading}
      rowKey={(r) => String(r.id)}
      emptyMessage={canList ? 'No KPI history records found' : 'You do not have permission to view history'}
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
          title="KPI Configuration History"
          search={search}
          onSearchChange={(val) => {
            onSearchChange(val)
            onPageChange(1)
          }}
          searchPlaceholder="Search KPI, condition, unit..."
          onExport={handleExportExcel}
          onExportPdf={handleExportPdf}
          exporting={exportingExcel || exportingPdf}
        />
      }
    />
  )
}
