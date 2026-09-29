'use client'

import { useMemo, useState } from 'react'
import {
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import ReportTable, { type ReportColumn } from '@/components/ui/ReportTable'
import DateRangePicker from '@/components/ui/DateRangePicker'
import Modal from '@/components/ui/Modal'
import type { TlsAuditRecord, TlsAuditMeta } from '../types'
import type { BranchOption, ShiftOption, TeamOption } from '@/hooks/useDropdownData'
import { useExport, type ExportColumn } from '@/hooks/useExport'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useBranchAccess } from '@/hooks/useBranchAccess'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDateTime(val?: string | null): string {
  if (!val) return '—'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return val
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hh}:${mm}`
  } catch {
    return val ?? '—'
  }
}

function formatDateOnly(val?: string | null): string {
  if (!val) return '—'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return val
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return val ?? '—'
  }
}

function getSeverityBadge(name?: string | null) {
  const sev = String(name || '').toLowerCase()
  if (sev.includes('critical'))
    return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
  if (sev.includes('major'))
    return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
  if (sev.includes('minor'))
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300'
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
}

function getCapStatusBadge(statusName?: string | null) {
  if (!statusName || String(statusName).trim() === '' || String(statusName).trim().toUpperCase() === 'NA') {
    return {
      cls: 'bg-amber-100 text-amber-800 border border-amber-300/60 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      label: 'NA',
    }
  }

  const s = String(statusName).toLowerCase().trim()

  if (s === 'closed' || s === 'resolved' || s === 'pass' || s === 'qc pass') {
    return {
      cls: 'bg-emerald-100 text-emerald-700 border border-emerald-300/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      label: statusName,
    }
  }

  if (s === 'open' || s === 'pending' || s === 'new' || s === 'fail') {
    return {
      cls: 'bg-red-100 text-red-700 border border-red-300/60 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
      label: statusName,
    }
  }

  if (s.includes('progress') || s.includes('working')) {
    return {
      cls: 'bg-blue-100 text-blue-700 border border-blue-300/60 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
      label: statusName,
    }
  }

  return {
    cls: 'bg-amber-100 text-amber-800 border border-amber-300/60 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    label: statusName,
  }
}

// Extracts status from the quality_check array by check_name keyword
function getCheckStatus(qualityCheck: any, keyword: string): string | null {
  if (!qualityCheck) return null
  const arr = Array.isArray(qualityCheck) ? qualityCheck : [qualityCheck]
  const item = arr.find((c: any) =>
    String(c?.check_name || '').toLowerCase().includes(keyword.toLowerCase())
  )
  return item ? String(item?.status ?? '') : null
}

// Renders a Pass / Fail badge (or — if null)
function CheckBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-t-lighter text-xs">—</span>
  const isPass = status.toLowerCase() === 'pass'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${isPass
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
      : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
      }`}>
      {status}
    </span>
  )
}

function getContrastTextColor(hex?: string | null): string {
  if (!hex) return '#ffffff'
  const cleanHex = hex.replace('#', '').trim()
  if (cleanHex.length !== 6 && cleanHex.length !== 3) return '#ffffff'
  const r = parseInt(cleanHex.length === 3 ? cleanHex[0] + cleanHex[0] : cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.length === 3 ? cleanHex[1] + cleanHex[1] : cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.length === 3 ? cleanHex[2] + cleanHex[2] : cleanHex.substring(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 155 ? '#111827' : '#ffffff'
}

function LightColorBadge({
  color,
  hex,
}: {
  color?: string | null
  hex?: string | null
}) {
  const name = color || (hex ? (hex.toLowerCase() === '#ff0000' ? 'Red' : hex.toLowerCase() === '#ffc000' ? 'Amber' : hex.toLowerCase() === '#00b050' || hex.toLowerCase() === '#00ff00' ? 'Green' : hex) : null)
  if (!name || String(name).trim() === '' || String(name).trim() === 'null') {
    return <span className="text-t-lighter text-xs">—</span>
  }

  const effectiveHex = hex && String(hex).trim().startsWith('#')
    ? String(hex).trim()
    : color && String(color).trim().startsWith('#')
      ? String(color).trim()
      : undefined

  const c = String(name).trim().toLowerCase()
  let badgeCls = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'

  if (c === 'green' || c === 'pass' || c === 'ok') {
    badgeCls = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  } else if (c === 'yellow' || c === 'amber' || c === 'pending') {
    badgeCls = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  } else if (c === 'red' || c === 'fail') {
    badgeCls = 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800'
  } else if (c === 'orange') {
    badgeCls = 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800'
  } else if (c === 'blue') {
    badgeCls = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
  }

  const textColor = effectiveHex ? getContrastTextColor(effectiveHex) : undefined

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded text-xs font-semibold border ${badgeCls}`}
      style={
        effectiveHex
          ? {
            backgroundColor: effectiveHex,
            borderColor: effectiveHex,
            color: textColor,
          }
          : undefined
      }
    >
      {name}
    </span>
  )
}

// Renders TLS Color badge
function TlsColorBadge({ color }: { color?: string | null }) {
  if (!color) return <span className="text-t-lighter text-xs">—</span>
  const c = String(color).trim().toLowerCase()
  let badgeCls = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  let dotCls = 'bg-gray-500'

  if (c === 'green') {
    badgeCls = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
    dotCls = 'bg-emerald-500'
  } else if (c === 'yellow' || c === 'amber') {
    badgeCls = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
    dotCls = 'bg-amber-500'
  } else if (c === 'red') {
    badgeCls = 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
    dotCls = 'bg-red-500'
  } else if (c === 'orange') {
    badgeCls = 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
    dotCls = 'bg-orange-500'
  } else if (c === 'blue') {
    badgeCls = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
    dotCls = 'bg-blue-500'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCls}`} />
      {color}
    </span>
  )
}

// ── Props ──────────────────────────────────────────────────────────────────

interface TlsAuditListProps {
  records: TlsAuditRecord[]
  loading: boolean
  search: string
  branchFilter: string
  teamFilter: string
  shiftFilter: string
  severityFilter: string
  fromDate: string
  toDate: string
  branches: BranchOption[]
  teams: TeamOption[]
  shifts: ShiftOption[]
  meta: TlsAuditMeta | null
  onSearchChange: (val: string) => void
  onBranchFilterChange: (val: string) => void
  onTeamFilterChange: (val: string) => void
  onShiftFilterChange: (val: string) => void
  onSeverityFilterChange: (val: string) => void
  onDateRangeChange: (start: string, end: string) => void
  onRefresh?: () => void
}

// ── Component ──────────────────────────────────────────────────────────────

export default function TlsAuditList({
  records,
  loading,
  search,
  branchFilter,
  teamFilter,
  shiftFilter,
  severityFilter,
  fromDate,
  toDate,
  branches,
  teams,
  shifts,
  meta,
  onSearchChange,
  onBranchFilterChange,
  onTeamFilterChange,
  onShiftFilterChange,
  onSeverityFilterChange,
  onDateRangeChange,
  onRefresh,
}: TlsAuditListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const [selectedCapModal, setSelectedCapModal] = useState<{
    defectName?: string
    caps: any[]
  } | null>(null)

  // ── Records grouped by qc_audit_id for row-spanning (matching PDF layout) ──
  const processedRecords: TlsAuditRecord[] = useMemo(() => {
    if (!records || records.length === 0) return []

    const result: TlsAuditRecord[] = []
    let auditIndex = 1

    // Check if backend returns nested defects format
    const hasNestedDefects = records.some((r) => Array.isArray(r.defects))

    if (hasNestedDefects) {
      records.forEach((audit, aIdx) => {
        const defectList = Array.isArray(audit.defects) && audit.defects.length > 0
          ? audit.defects
          : [null]

        const groupSize = defectList.length

        defectList.forEach((d, dIdx) => {
          const isFirst = dIdx === 0
          result.push({
            ...audit,
            category_name: d?.category_name ?? audit.category_name ?? '',
            defect: d?.defect ?? d?.defect_name ?? audit.defect ?? '',
            defect_name: d?.defect_name ?? d?.defect ?? audit.defect_name ?? '',
            severity_name: d?.severity_name ?? audit.severity_name ?? '',
            assigned_to: d?.assigned_to ?? audit.assigned_to ?? null,
            elapsed_time: d?.elapsed_time ?? audit.elapsed_time ?? null,
            tls_issue_status_name: d?.tls_issue_status_name ?? audit.tls_issue_status_name ?? null,
            cap: d?.cap ?? audit.cap ?? [],
            cap_by_name: d?.cap_by_name ?? audit.cap_by_name ?? null,
            cap_by: d?.cap_by ?? audit.cap_by ?? null,
            cap_time: d?.cap_time ?? audit.cap_time ?? null,
            _groupKey: `${audit.order_no}_${audit.create_at}_${audit.audit_time}_${aIdx}`,
            _auditRowSpan: isFirst ? groupSize : 0,
            _isFirstInAudit: isFirst,
            _auditIndex: auditIndex,
          })
        })
        auditIndex++
      })
    } else {
      // Flat format: group by qc_audit_id
      const auditMap = new Map<string, TlsAuditRecord[]>()
      records.forEach((r, idx) => {
        const key = String(
          r.qc_audit_id ||
          `${r.order_no}_${r.create_at}_${r.slot}_${r.line_id}_${r.machine_no}_${r.op_id}_${r.audit_time}` ||
          `row_${idx}`
        )
        if (!auditMap.has(key)) {
          auditMap.set(key, [])
        }
        auditMap.get(key)!.push(r)
      })

      auditMap.forEach((groupRecords, groupKey) => {
        const groupSize = groupRecords.length
        groupRecords.forEach((r, i) => {
          result.push({
            ...r,
            _groupKey: groupKey,
            _auditRowSpan: i === 0 ? groupSize : 0,
            _isFirstInAudit: i === 0,
            _auditIndex: auditIndex,
          })
        })
        auditIndex++
      })
    }

    return result
  }, [records])

  const filteredRecords = processedRecords

  // ── KPI Summary ──────────────────────────────────────────────────────────
  const totalAudits = records?.length || 0

  const { minorCount, majorCount, criticalCount } = useMemo(() => {
    let minor = 0
    let major = 0
    let critical = 0

    processedRecords.forEach((r) => {
      const s = String(r.severity_name || '').toLowerCase()
      if (s.includes('minor')) minor++
      else if (s.includes('major')) major++
      else if (s.includes('critical')) critical++
    })

    return { minorCount: minor, majorCount: major, criticalCount: critical }
  }, [processedRecords])

  const totalQty = useMemo(
    () => filteredRecords.reduce((acc, r) => acc + (Number(r.qty_id) || 0), 0),
    [filteredRecords]
  )

  // ── Export ────────────────────────────────────────────────────────────────
  const exportPayload = useMemo(
    () => ({
      date_from: fromDate,
      date_to: toDate || fromDate,
      branch_id: branchFilter,
      shift_id: shiftFilter,
      team_id: teamFilter,
      search,
      severity_id: severityFilter,
      page: '1',
      limit: '10000',
    }),
    [fromDate, toDate, branchFilter, shiftFilter, teamFilter, search, severityFilter]
  )

  const exportColumns: ExportColumn<TlsAuditRecord>[] = useMemo(
    () => [
      { header: 'Branch', value: (r) => r.branch_name || r.branch || '' },
      { header: 'Shift', value: (r) => r.shift_name || r.shift || '' },
      { header: 'Team', value: (r) => r.team_name || r.team || '' },
      { header: 'Zone', value: (r) => r.zone_name || '' },
      { header: 'Line Name', value: (r) => r.line_name || '' },
      { header: 'Audit Date', value: (r) => formatDateOnly(r.create_at) },
      { header: 'Order No', value: (r) => r.order_no || '' },
      { header: 'Colour', value: (r) => r.colour || '' },
      { header: 'Style Name', value: (r) => r.style_name || '' },
      { header: 'Style Number', value: (r) => r.style_number || '' },
      { header: 'Slot', value: (r) => r.slot || '' },
      { header: 'Operator', value: (r) => r.operator_name || String(r.operator_id || '') },
      { header: 'OP ID', value: (r) => r.op_id || '' },
      { header: 'Operation', value: (r) => r.operation || '' },
      { header: 'M/C Type', value: (r) => r.mc_type || '' },
      { header: 'M/C No', value: (r) => r.machine_no || '' },
      { header: 'SPI Count', value: (r) => r.spi_count ?? '' },
      { header: 'SPI', value: (r) => getCheckStatus(r.quality_check, 'spi') || '' },
      { header: 'Trim', value: (r) => getCheckStatus(r.quality_check, 'trim') || '' },
      { header: 'Thread Tension', value: (r) => getCheckStatus(r.quality_check, 'tension') || '' },
      { header: 'Total Defects', value: (r) => r.audit_obs || '' },
      { header: 'TLS Color', value: (r) => r.light_color || r.tls_color || '' },
      { header: 'Defect Category', value: (r) => r.category_name || '' },
      { header: 'Defect Name', value: (r) => r.defect_name || r.defect || '' },
      // { header: 'Qty', value: (r) => r.qty_id ?? 0 },
      { header: 'Severity', value: (r) => r.severity_name || '' },
      { header: 'QC ID', value: (r) => r.qc_id || '' },
      { header: 'QC Name', value: (r) => r.qc_name || r.qc_user_name || '' },
      { header: 'Audit Time', value: (r) => formatDateTime(r.audit_time) },
      { header: 'Assigned To', value: (r) => String(r.assigned_to || '') },
      { header: 'Elapsed Time', value: (r) => String(r.elapsed_time || '') },
      { header: 'CAP Status', value: (r) => r.tls_issue_status_name || 'NA' },
      { header: 'CAP', value: (r) => Array.isArray(r.cap) ? r.cap.map((i: any) => i?.cap_name || i?.name || i || '').filter(Boolean).join(', ') : String(r.cap || '') },
      { header: 'CAP By', value: (r) => r.cap_by_name || '' },
      { header: 'CAP By ID', value: (r) => r.cap_by || r.cap_by_id || '' },
      { header: 'CAP Time', value: (r) => formatDateTime(r.cap_time) },
      { header: 'After CAP', value: (r) => r.after_cap_light_color || r.after_cap || '' },
      { header: 'QC Verification', value: (r) => r.qc_verification_status_name || '' },
      { header: 'Rev By', value: (r) => String(r.rev_by_name || r.rev_by || '') },
      { header: 'Rev ID', value: (r) => String(r.rev_id || '') },
      { header: 'Rev Time', value: (r) => formatDateTime(r.rev_time) },
    ],
    []
  )

  const { handleExport, exporting } = useExport<TlsAuditRecord>({
    apiPath: '/report/tlsauditreport',
    payload: exportPayload,
    dataKey: 'data',
    columns: exportColumns,
    filename: 'TLS_Audit_Report',
    method: 'POST',
  })

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/report/tlsauditreport',
    payload: exportPayload,
    filename: 'TLS_Audit_Report',
  })

  // ── Table Columns — all fields from API response ──────────────────────────
  const columns: ReportColumn<TlsAuditRecord>[] = [
    // ── 1. Serial ─────────────────────────────────────────────────────────
    {
      key: 'index',
      header: 'S.No',
      rowSpan: (r) => r._auditRowSpan,
      render: (row: TlsAuditRecord) => (
        <span className="text-t-primary font-medium">{row._auditIndex ?? 1}</span>
      ),
    },
    {
      key: 'branch_name',
      header: 'Branch',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.branch_name || row.branch || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap">
          {row.branch_name || row.branch || '—'}
        </span>
      ),
    },
    {
      key: 'shift_name',
      header: 'Shift',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.shift_name || row.shift || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap">
          {row.shift_name || row.shift || '—'}
        </span>
      ),
    },
    {
      key: 'team_name',
      header: 'Team',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.team_name || row.team || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap">
          {row.team_name || row.team || '—'}
        </span>
      ),
    },

    // ── Zone ───────────────────────────────────────────────────────────────
    {
      key: 'zone_name',
      header: 'Zone',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.zone_name || '',
      render: (row) => (
        <span className="text-t-body text-xs font-medium whitespace-nowrap">
          {row.zone_name || '—'}
        </span>
      ),
    },

    // ── Line Name ───────────────────────────────────────────────────────────
    {
      key: 'line_name',
      header: 'Line Name',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.line_name || '',
      render: (row) => (
        <span className="text-t-body text-xs font-medium whitespace-nowrap">
          {row.line_name || '—'}
        </span>
      ),
    },

    // ── 2. Audit Date (create_at) ──────────────────────────────────────────
    {
      key: 'create_at',
      header: 'Audit Dt',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.create_at || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap">
          {formatDateOnly(row.create_at)}
        </span>
      ),
    },

    // ── 3. Order No ────────────────────────────────────────────────────────
    {
      key: 'order_no',
      header: 'Order No',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.order_no || '',
      render: (row) => (
        <span className="text-[#007b83] dark:text-[#2dd4bf] font-semibold text-xs whitespace-nowrap">
          {row.order_no || '—'}
        </span>
      ),
    },

    // ── 4. Colour ─────────────────────────────────────────────────────────
    {
      key: 'colour',
      header: 'Colour',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.colour || '',
      render: (row) => (
        <span className="text-t-body text-xs font-medium whitespace-nowrap">{row.colour || '—'}</span>
      ),
    },

    // ── 5. Style Name ─────────────────────────────────────────────────────
    {
      key: 'style_name',
      header: 'Style Name',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.style_name || '',
      render: (row) => (
        <span className="text-t-body text-xs font-semibold whitespace-nowrap">
          {row.style_name || '—'}
        </span>
      ),
    },

    // ── 6. Style Number ───────────────────────────────────────────────────
    {
      key: 'style_number',
      header: 'Style No',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.style_number || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap">{row.style_number || '—'}</span>
      ),
    },

    // ── 7. Slot ───────────────────────────────────────────────────────────
    {
      key: 'slot',
      header: 'Slot',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.slot || '',
      render: (row) => (
        <span className="text-t-body text-xs">{row.slot || '—'}</span>
      ),
    },

    // ── 8. Operator ───────────────────────────────────────────────────────
    {
      key: 'operator_name',
      header: 'Operator',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.operator_name || String(row.operator_id || ''),
      render: (row) => (
        <span className="text-t-body text-xs">{row.operator_name || row.operator_id || '—'}</span>
      ),
    },

    // ── 9. OP ID ──────────────────────────────────────────────────────────
    {
      key: 'op_id',
      header: 'OP ID',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.op_id || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap">{row.op_id || '—'}</span>
      ),
    },

    // ── 10. Operation ─────────────────────────────────────────────────────
    {
      key: 'operation',
      header: 'Operation',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.operation || '',
      render: (row) => (
        <span className="text-t-body text-xs font-medium min-w-[120px] inline-block">
          {row.operation || '—'}
        </span>
      ),
    },

    // ── 11. M/C Type ──────────────────────────────────────────────────────
    {
      key: 'mc_type',
      header: 'M/C Type',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.mc_type || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap">{row.mc_type || '—'}</span>
      ),
    },

    // ── 12. M/C No ────────────────────────────────────────────────────────
    {
      key: 'machine_no',
      header: 'M/C No',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.machine_no || '',
      render: (row) => (
        <span className="text-t-body text-xs font-semibold whitespace-nowrap">
          {row.machine_no || '—'}
        </span>
      ),
    },

    // ── 13. SPI Count ─────────────────────────────────────────────────────
    {
      key: 'spi_count',
      header: 'SPI Cnt',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => Number(row.spi_count ?? 0),
      render: (row) => (
        <span className="text-t-body text-xs text-center block">
          {row.spi_count ?? '—'}
        </span>
      ),
    },

    // ── 14. SPI (from quality_check array — "SPI Check") ──────────────────
    {
      key: 'spi_check',
      header: 'SPI',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => getCheckStatus(row.quality_check, 'spi') || '',
      render: (row) => <CheckBadge status={getCheckStatus(row.quality_check, 'spi')} />,
    },

    // ── 15. Trim (from quality_check array — "Trim Check") ────────────────
    {
      key: 'trim_check',
      header: 'Trim',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => getCheckStatus(row.quality_check, 'trim') || '',
      render: (row) => <CheckBadge status={getCheckStatus(row.quality_check, 'trim')} />,
    },

    // ── 16. Thread Tension (from quality_check array — "Tension Check") ───
    {
      key: 'tension_check',
      header: 'Thread Tension',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => getCheckStatus(row.quality_check, 'tension') || '',
      render: (row) => <CheckBadge status={getCheckStatus(row.quality_check, 'tension')} />,
    },

    // ── 17. Audit Obs ─────────────────────────────────────────────────────
    {
      key: 'audit_obs',
      header: 'Total Defects',
      rowSpan: (r) => r._auditRowSpan,
      sortable: false,
      render: (row) => (
        <span className="text-t-body text-xs max-w-[140px] inline-block truncate text-center block" title={row.audit_obs || ''}>
          {row.audit_obs || 0}
        </span>
      ),
    },

    // ── 18. TLS Color ─────────────────────────────────────────────────────
    {
      key: 'tls_color',
      header: 'TLS Color',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.light_color || row.tls_color || '',
      render: (row) => (
        <LightColorBadge
          color={row.light_color || row.tls_color}
          hex={row.light_hexcode}
        />
      ),
    },

    // ── 16. Defect Category ───────────────────────────────────────────────
    {
      key: 'category_name',
      header: 'Category',
      sortable: true,
      sortValue: (row) => row.category_name || '',
      render: (row) => (
        <span className="text-t-body text-xs font-medium whitespace-nowrap">
          {row.category_name || '—'}
        </span>
      ),
    },

    // ── 17. Defect Name ───────────────────────────────────────────────────
    {
      key: 'defect_name',
      header: 'Defect',
      sortable: true,
      sortValue: (row) => row.defect_name || row.defect || '',
      render: (row) => (
        <span className="font-semibold text-red-600 dark:text-red-400 text-xs whitespace-nowrap">
          {row.defect_name || row.defect || '—'}
        </span>
      ),
    },

    // ── 18. Qty ───────────────────────────────────────────────────────────
    // {
    //   key: 'qty_id',
    //   header: 'Qty',
    //   sortable: true,
    //   sortValue: (row) => Number(row.qty_id ?? 0),
    //   render: (row) => (
    //     <span className="font-bold text-t-primary text-center block">{row.qty_id ?? 0}</span>
    //   ),
    //   footer: () => (
    //     <span className="font-bold text-[#007b83] dark:text-[#2dd4bf]">{totalQty}</span>
    //   ),
    // },

    // ── 19. Severity ──────────────────────────────────────────────────────
    {
      key: 'severity_name',
      header: 'Severity',
      sortable: true,
      sortValue: (row) => row.severity_name || '',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getSeverityBadge(row.severity_name)}`}
        >
          {row.severity_name || '—'}
        </span>
      ),
    },

    // ── 20. QC ID ─────────────────────────────────────────────────────────
    {
      key: 'qc_id',
      header: 'QC ID',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.qc_id || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap">
          {row.qc_id || '—'}
        </span>
      ),
    },

    // ── QC Name ───────────────────────────────────────────────────────────
    {
      key: 'qc_name',
      header: 'QC Name',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.qc_name || row.qc_user_name || '',
      render: (row) => (
        <span className="text-t-body text-xs font-medium whitespace-nowrap">
          {row.qc_name || row.qc_user_name || '—'}
        </span>
      ),
    },

    // ── 21. Audit Time ────────────────────────────────────────────────────
    {
      key: 'audit_time',
      header: 'Audit Time',
      rowSpan: (r) => r._auditRowSpan,
      sortable: true,
      sortValue: (row) => row.audit_time || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap font-medium">
          {formatDateTime(row.audit_time)}
        </span>
      ),
    },

    // ── 22. Assigned To ───────────────────────────────────────────────────
    {
      key: 'assigned_to',
      header: 'Assigned To',
      sortable: true,
      sortValue: (row) => String(row.assigned_to || ''),
      render: (row) => (
        <span className="text-t-body text-xs">{row.assigned_to || '—'}</span>
      ),
    },

    // ── 23. Elapsed Time ──────────────────────────────────────────────────
    {
      key: 'elapsed_time',
      header: 'Elapsed Time',
      sortable: true,
      sortValue: (row) => String(row.elapsed_time || ''),
      render: (row) => (
        <span className="text-t-body text-xs">{row.elapsed_time ?? '—'}</span>
      ),
    },

    // ── 24. CAP Status (tls_issue_status_name) ────────────────────────────
    {
      key: 'tls_issue_status_name',
      header: 'CAP Status',
      sortable: true,
      sortValue: (row) => row.tls_issue_status_name || '',
      render: (row) => {
        const { cls, label } = getCapStatusBadge(row.tls_issue_status_name)
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
            {label}
          </span>
        )
      },
    },

    // ── 25. CAP ───────────────────────────────────────────────────────────
    {
      key: 'cap',
      header: 'CAP',
      sortable: true,
      sortValue: (row) => {
        const v = row.cap
        if (!v || !Array.isArray(v) || v.length === 0) return ''
        const first = v[0]
        return String(first?.cap_name || first?.name || first || '')
      },
      render: (row) => {
        const v = row.cap
        if (!v || !Array.isArray(v) || v.length === 0)
          return <span className="text-t-lighter text-xs">—</span>

        const names: string[] = v
          .map((i: any) => String(i?.cap_name || i?.name || i || '').trim())
          .filter((n: string) => n && n !== 'null' && n !== 'undefined')

        if (names.length === 0) return <span className="text-t-lighter text-xs">—</span>

        const first = names[0]
        const rest = names.length - 1

        return (
          <span className="flex items-center gap-1.5 max-w-[180px]">
            <span className="text-t-body text-xs truncate" title={names.join(' | ')}>
              {first}
            </span>
            {rest > 0 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedCapModal({
                    defectName: row.defect_name || row.defect,
                    caps: v,
                  })
                }
                title="Click to view all CAPs"
                className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#006a71]/10 text-[#006a71] dark:bg-[#006a71]/20 dark:text-[#2dd4bf] hover:bg-[#006a71]/20 transition-all cursor-pointer shadow-2xs hover:scale-105"
              >
                +{rest}
              </button>
            )}
          </span>
        )
      },
    },

    // ── 26. CAP By ────────────────────────────────────────────────────────
    {
      key: 'cap_by',
      header: 'CAP By',
      sortable: true,
      sortValue: (row) => row.cap_by_name || '',
      render: (row) => (
        <span className="text-t-body text-xs font-medium whitespace-nowrap">{row.cap_by_name || '—'}</span>
      ),
    },

    // ── 27. CAP By ID ─────────────────────────────────────────────────────
    {
      key: 'cap_by_id',
      header: 'CAP By ID',
      sortable: true,
      sortValue: (row) => row.cap_by || row.cap_by_id || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap">
          {row.cap_by || row.cap_by_id || '—'}
        </span>
      ),
    },

    // ── 28. CAP Time ──────────────────────────────────────────────────────
    {
      key: 'cap_time',
      header: 'CAP Time',
      sortable: true,
      sortValue: (row) => row.cap_time || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap">
          {formatDateTime(row.cap_time)}
        </span>
      ),
    },

    // ── 28b. After CAP ────────────────────────────────────────────────
    {
      key: 'after_cap',
      header: 'After CAP',
      sortable: true,
      sortValue: (row) => row.after_cap_light_color || row.after_cap || '',
      render: (row) => (
        <LightColorBadge
          color={row.after_cap_light_color || row.after_cap}
          hex={row.after_cap_light_hexcode}
        />
      ),
    },

    // ── 28c. QC Verification ───────────────────────────────────────────────
    {
      key: 'qc_verification_status_name',
      header: 'QC Verification',
      sortable: true,
      sortValue: (row) => row.qc_verification_status_name || '',
      render: (row) => {
        if (!row.qc_verification_status_name) return <span className="text-t-lighter text-xs">—</span>
        const isPass = String(row.qc_verification_status_name).toUpperCase().includes('PASS')
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${isPass
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
              }`}
          >
            {row.qc_verification_status_name}
          </span>
        )
      },
    },

    // ── 29. Rev By ────────────────────────────────────────────────────────
    {
      key: 'rev_by',
      header: 'Rev By',
      sortable: true,
      sortValue: (row) => String(row.rev_by_name || row.rev_by || ''),
      render: (row) => (
        <span className="text-t-body text-xs">{row.rev_by_name || row.rev_by || '—'}</span>
      ),
    },

    // ── 30. Rev ID ────────────────────────────────────────────────────────
    {
      key: 'rev_id',
      header: 'Rev ID',
      sortable: true,
      sortValue: (row) => row.rev_id || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap">
          {row.rev_id || '—'}
        </span>
      ),
    },

    // ── 31. Rev Time ──────────────────────────────────────────────────────
    {
      key: 'rev_time',
      header: 'Rev Time',
      sortable: true,
      sortValue: (row) => row.rev_time || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap">
          {formatDateTime(row.rev_time)}
        </span>
      ),
    },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <ReportTable<TlsAuditRecord>
        columns={columns}
        data={filteredRecords}
        loading={loading}
        rowKey={(r: TlsAuditRecord) =>
          `${r._groupKey || r.order_no || 'audit'}_${r.defect || r.defect_name || ''}_${r.category_name || ''}_${r._auditIndex || ''}`
        }
        rowClassName={(r) =>
          r._isFirstInAudit && r._auditIndex && r._auditIndex > 1
            ? 'border-t-2 border-[#94a3b8] dark:border-[#475569]'
            : ''
        }
        header={
          <>
            {/* ── KPI Summary Cards ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 pt-3 pb-1">
              {/* Total Audits */}
              <div
                className="bg-card border border-border/60 rounded-xl px-3.5 py-2 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow"
                style={{ borderTop: '3px solid #006a71' }}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] text-t-secondary font-semibold uppercase tracking-wider">
                    Total Audits
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-bold text-t-primary leading-tight">
                      {totalAudits.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-t-lighter truncate">
                      ({filteredRecords.length} Defect{filteredRecords.length === 1 ? '' : 's'})
                    </span>
                  </div>
                </div>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ml-2"
                  style={{ backgroundColor: '#006a7118', color: '#006a71' }}
                >
                  <ClipboardList size={18} />
                </div>
              </div>

              {/* Minor Defects (Amber accent matching Major card) */}
              <div
                className="bg-card border border-border/60 rounded-xl px-3.5 py-2 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow"
                style={{ borderTop: '3px solid #FFC000' }}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] text-t-secondary font-semibold uppercase tracking-wider">
                    Minor
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold text-amber-600 dark:text-amber-400 leading-tight">
                      {minorCount.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-medium text-t-secondary">records</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ml-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <AlertCircle size={18} />
                </div>
              </div>

              {/* Major Defects (Amber accent) */}
              <div
                className="bg-card border border-border/60 rounded-xl px-3.5 py-2 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow"
                style={{ borderTop: '3px solid #FFC000' }}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] text-t-secondary font-semibold uppercase tracking-wider">
                    Major
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold text-amber-600 dark:text-amber-400 leading-tight">
                      {majorCount.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-medium text-t-secondary">records</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ml-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={18} />
                </div>
              </div>

              {/* Critical Defects (Red accent) */}
              <div
                className="bg-card border border-border/60 rounded-xl px-3.5 py-2 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow"
                style={{ borderTop: '3px solid #FF0000' }}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] text-t-secondary font-semibold uppercase tracking-wider">
                    Critical
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold text-red-600 dark:text-red-400 leading-tight">
                      {criticalCount.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-medium text-t-secondary">records</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ml-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                  <ShieldAlert size={18} />
                </div>
              </div>
            </div>

            {/* ── Toolbar ───────────────────────────────────────────────── */}
            <Toolbar
              search={search}
              onSearchChange={onSearchChange}
              searchPlaceholder="Search order, style, defect, machine, QC..."
              showExport
              onExport={handleExport}
              onExportPdf={handleExportPdf}
              exporting={exporting || exportingPdf}
            >
              <div className="flex items-center gap-1.5 flex-nowrap">
                {/* Branch */}
                <select
                  value={branchFilter}
                  onChange={(e) => onBranchFilterChange(e.target.value)}
                  disabled={!isAdmin && Boolean(userBranchId)}
                  className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[110px] shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {!(!isAdmin && userBranchId) && <option value="">All Branches</option>}
                  {branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.branch_name}
                    </option>
                  ))}
                </select>

                {/* Shift */}
                <select
                  value={shiftFilter}
                  onChange={(e) => onShiftFilterChange(e.target.value)}
                  className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[100px] shrink-0"
                >
                  <option value="">All Shifts</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.shift_name}
                    </option>
                  ))}
                </select>


                {/* Team */}
                <select
                  value={teamFilter}
                  onChange={(e) => onTeamFilterChange(e.target.value)}
                  className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[100px] shrink-0"
                >
                  <option value="">All Teams</option>
                  {teams.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.team_name || t.name || `Team ${t.id}`}
                    </option>
                  ))}
                </select>




                {/* Date Range */}
                <div className="relative z-[9999] w-[190px] shrink-0">
                  <DateRangePicker
                    startDate={fromDate}
                    endDate={toDate}
                    onChange={onDateRangeChange}
                  />
                </div>

              </div>
            </Toolbar>
          </>
        }
        totalCount={totalAudits}
        countLabel="Audit"
        countLabelPlural="Audits"
        countSuffix={`(${filteredRecords.length} Defect Records)`}
        emptyMessage="No TLS audit records found for the selected criteria"
      />

      {selectedCapModal && (
        <Modal
          title="Corrective Action Plan (CAP) Details"
          size="md"
          onClose={() => setSelectedCapModal(null)}
          footer={
            <button
              type="button"
              onClick={() => setSelectedCapModal(null)}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#0d939d] text-white hover:bg-[#0b828b] transition-colors cursor-pointer"
            >
              Close
            </button>
          }
        >
          <div className="flex flex-col gap-3">
            {selectedCapModal.defectName && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card-alt border border-table-line">
                <span className="text-xs text-t-secondary font-medium">Defect:</span>
                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                  {selectedCapModal.defectName}
                </span>
              </div>
            )}

            <div className="border border-table-line rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0d939d] text-white font-semibold">
                  <tr>
                    <th className="px-3 py-2 text-center w-12">S.No</th>
                    <th className="px-3 py-2">CAP Name</th>
                    <th className="px-3 py-2">Short Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-table-line">
                  {selectedCapModal.caps.map((item: any, idx: number) => {
                    const capName = String(item?.cap_name || item?.name || item || '—')
                    const shortName = String(item?.short_name || '—')
                    return (
                      <tr key={idx} className="hover:bg-card-alt/50 transition-colors">
                        <td className="px-3 py-2 text-center text-t-secondary font-medium">{idx + 1}</td>
                        <td className="px-3 py-2 font-semibold text-t-primary">{capName}</td>
                        <td className="px-3 py-2 text-t-secondary">{shortName}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
