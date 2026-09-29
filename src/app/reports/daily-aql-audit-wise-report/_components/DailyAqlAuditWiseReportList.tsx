'use client'

import { useMemo } from 'react'
import Toolbar from '@/components/ui/Toolbar'
import ReportTable, { type ReportColumn } from '@/components/ui/ReportTable'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useExport } from '@/hooks/useExport'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import type { AqlAuditRecord, AqlAuditRowItem, AqlAuditReportResponseData } from '../types'
import type { BranchOption, TeamOption, ShiftOption } from '@/services/dropdownService'
import { CheckCircle2, XCircle } from 'lucide-react'

interface DailyAqlAuditWiseReportListProps {
  data: AqlAuditReportResponseData | null
  loading: boolean
  search: string
  branchFilter: string
  teamFilter: string
  shiftFilter: string
  fromDate: string
  toDate: string
  branches: BranchOption[]
  teams: TeamOption[]
  shifts: ShiftOption[]
  onSearchChange: (val: string) => void
  onBranchFilterChange: (val: string) => void
  onTeamFilterChange: (val: string) => void
  onShiftFilterChange: (val: string) => void
  onDateRangeChange: (start: string, end: string) => void
}

function formatDateOnly(val?: string): string {
  if (!val) return '—'
  const trimmed = String(val).trim()
  if (!trimmed) return '—'

  const datePart = trimmed.split(/[\s,T]+/)[0]
  if (!datePart) return '—'

  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(datePart)) {
    const parts = datePart.split(/[\/\-]/)
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    const year = parts[2]
    return `${day}/${month}/${year}`
  }

  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(datePart)) {
    const parts = datePart.split(/[\/\-]/)
    const year = parts[0]
    const month = parts[1].padStart(2, '0')
    const day = parts[2].padStart(2, '0')
    return `${day}/${month}/${year}`
  }

  return datePart
}

function formatDateTime(val?: string): string {
  if (!val) return '—'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return val
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${mins}`
  } catch {
    return val
  }
}

function getSeverityBadgeClass(name?: string | null): string {
  const sev = String(name || '').toLowerCase()
  if (sev.includes('critical')) {
    return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800'
  }
  if (sev.includes('major')) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
  }
  if (sev.includes('minor')) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
}

export default function DailyAqlAuditWiseReportList({
  data,
  loading,
  search,
  branchFilter,
  teamFilter,
  shiftFilter,
  fromDate,
  toDate,
  branches,
  teams,
  shifts,
  onSearchChange,
  onBranchFilterChange,
  onTeamFilterChange,
  onShiftFilterChange,
  onDateRangeChange,
}: DailyAqlAuditWiseReportListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()

  const rawRecords: AqlAuditRecord[] = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data.records)) return data.records
    if (Array.isArray((data as any).data?.records)) return (data as any).data.records
    if (Array.isArray((data as any).data)) return (data as any).data
    if (Array.isArray(data)) return data as any
    return []
  }, [data])

  // Filter raw records by search query
  const filteredRecords = useMemo(() => {
    if (!search.trim()) return rawRecords
    const q = search.toLowerCase()
    return rawRecords.filter((r) => {
      const auditNo = String(r.aql_code || r.audit_no || r.id || '').toLowerCase()
      const orderNo = (r.order_no || '').toLowerCase()
      const buyer = (r.buyer || '').toLowerCase()
      const styleName = (r.style_name || '').toLowerCase()
      const styleNo = (r.style_no || '').toLowerCase()
      const colour = (r.colour || '').toLowerCase()
      const lineName = (r.line_name || '').toLowerCase()
      const auditor = (r.auditor_name || '').toLowerCase()
      const auditorCode = (r.auditor_code || '').toLowerCase()
      const branch = (r.branch_name || '').toLowerCase()
      const shift = (r.shift_name || '').toLowerCase()
      const team = (r.team_name || '').toLowerCase()
      const defectMatches = (r.defects || []).some(
        (d) =>
          (d.defect_name || '').toLowerCase().includes(q) ||
          (d.category_name || '').toLowerCase().includes(q) ||
          (d.severity_name || '').toLowerCase().includes(q)
      )

      return (
        auditNo.includes(q) ||
        orderNo.includes(q) ||
        buyer.includes(q) ||
        styleName.includes(q) ||
        styleNo.includes(q) ||
        colour.includes(q) ||
        lineName.includes(q) ||
        auditor.includes(q) ||
        auditorCode.includes(q) ||
        branch.includes(q) ||
        shift.includes(q) ||
        team.includes(q) ||
        defectMatches
      )
    })
  }, [rawRecords, search])

  // Flatten records per defect so multi-defect audits span rows properly
  const flattenedRows: AqlAuditRowItem[] = useMemo(() => {
    const list: AqlAuditRowItem[] = []

    filteredRecords.forEach((audit, auditIdx) => {
      const defects = audit.defects && Array.isArray(audit.defects) && audit.defects.length > 0 ? audit.defects : []
      const defectCount = Number(audit.defect_count) > 0 ? Number(audit.defect_count) : (defects.length > 0 ? defects.length : 1)

      if (defects.length === 0) {
        // Read directly from backend response fields without frontend calculation
        const rawPct =
          (audit as any).dhu ??
          (audit as any)['dhu%'] ??
          (audit as any).defect_item_pct ??
          audit.defect_percentage ??
          (audit as any).defect_percent ??
          (audit as any).defect_pct ??
          (audit as any).percentage
        const itemPct =
          rawPct !== undefined && rawPct !== null && rawPct !== ''
            ? String(rawPct).trim().endsWith('%')
              ? String(rawPct).trim()
              : `${rawPct}%`
            : '—'

        list.push({
          ...audit,
          _rowKey: `audit-${audit.id ?? audit.uuid ?? auditIdx}-0`,
          auditIndex: auditIdx,
          defectIndex: 0,
          defectCount: 1,
          isFirstDefect: true,
          defect_category_name: (audit as any).defect_category_name || (audit as any).category_name || '—',
          defect_item_name: (audit as any).defect_item_name || (audit as any).defect_name || '—',
          defect_severity_name: (audit as any).defect_severity_name || (audit as any).severity_name || '—',
          defect_item_qty: (audit as any).defect_item_qty ?? (audit as any).defect_qty ?? 0,
          defect_item_pct: itemPct,
        })
      } else {
        defects.forEach((defect, defIdx) => {
          const itemQty = defect.qty ?? (defect as any).defect_qty ?? (defect as any).defect_item_qty ?? 0

          // Read directly from backend response without calculating in frontend
          const rawPct =
            (audit as any).dhu ??
            (audit as any)['dhu%'] ??
            (defect as any).dhu ??
            (defect as any)['dhu%'] ??
            (defect as any).defect_item_pct ??
            defect.defect_percentage ??
            (defect as any).defect_percent ??
            defect.defect_pct ??
            defect.percentage ??
            (defect as any).pct ??
            audit.defect_percentage ??
            (audit as any).defect_percent ??
            (audit as any).defect_pct
          const itemPct =
            rawPct !== undefined && rawPct !== null && rawPct !== ''
              ? String(rawPct).trim().endsWith('%')
                ? String(rawPct).trim()
                : `${rawPct}%`
              : '—'

          list.push({
            ...audit,
            _rowKey: `audit-${audit.id ?? audit.uuid ?? auditIdx}-${defect.id ?? defIdx}`,
            auditIndex: auditIdx,
            defectIndex: defIdx,
            defectCount,
            isFirstDefect: defIdx === 0,
            defect_category_name: defect.category_name || (defect as any).defect_category_name || '—',
            defect_item_name: defect.defect_name || (defect as any).defect_item_name || '—',
            defect_severity_name: defect.severity_name || (defect as any).defect_severity_name || '—',
            defect_item_qty: itemQty,
            defect_item_pct: itemPct,
          })
        })
      }
    })

    return list
  }, [filteredRecords])

  const summary: any = (data as any)?.summary || (data as any)?.data || data || {}

  // Top KPI Summary Cards directly from backend response
  const kpiSummary = useMemo(() => {
    const formatValue = (val?: any) => {
      if (val === undefined || val === null || val === '') return '0'
      const num = Number(val)
      return isNaN(num) ? String(val) : num.toLocaleString()
    }

    const formatPct = (val?: any) => {
      if (val === undefined || val === null || val === '') return '0.0%'
      const str = String(val).trim()
      return str.endsWith('%') ? str : `${str}%`
    }

    return {
      totalInspectedQty: formatValue(summary?.total_inspected_qty ?? summary?.total_inspection_qty ?? summary?.inspected_qty),
      totalPassQty: formatValue(summary?.total_pass_qty ?? summary?.pass_qty),
      totalFailQty: formatValue(summary?.total_fail_qty ?? summary?.fail_qty),
      totalDefects: formatValue(summary?.total_defects ?? summary?.total_defect_qty ?? summary?.defect_qty),
      defectPct: formatPct(summary?.defect_percentage ?? summary?.defect_percent ?? summary?.defect_pct),
      passPct: formatPct(summary?.pass_percentage ?? summary?.pass_percent ?? summary?.pass_pct),
      failPct: formatPct(summary?.fail_percentage ?? summary?.fail_percent ?? summary?.fail_pct),
      totalSampleSize: formatValue(summary?.total_sample_size),
      totalAllowedMajor: formatValue(summary?.total_allowed_major),
      totalAllowedMinor: formatValue(summary?.total_allowed_minor),
      totalMajorDefects: formatValue(summary?.total_major_defects),
      totalMinorDefects: formatValue(summary?.total_minor_defects),
    }
  }, [summary])

  // PDF Export setup
  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/report/aqlauditreport',
    payload: {
      search,
      branch_id: branchFilter,
      team_id: teamFilter,
      shift_id: shiftFilter,
      date_from: fromDate,
      date_to: toDate || fromDate,
    },
    filename: `Daily_AQL_Audit_Wise_Report_${fromDate}_to_${toDate}`,
  })

  // Excel Export setup (direct from backend)
  const { handleExport: handleExportExcel, exporting: exportingExcel } = useExport({
    apiPath: '/report/aqlauditreport',
    payload: {
      search,
      branch_id: branchFilter,
      team_id: teamFilter,
      shift_id: shiftFilter,
      date_from: fromDate,
      date_to: toDate || fromDate,
      type: 'excel',
    },
    filename: `Daily_AQL_Audit_Wise_Report_${fromDate}_to_${toDate}`,
  })

  // Table Columns with rowSpan support matching Client Demo Excel
  const columns: ReportColumn<AqlAuditRowItem>[] = [
    {
      key: 'sno',
      header: 'S.No',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => (
        <span className="text-xs text-t-body font-medium whitespace-nowrap">
          {(r as any).s_no || (r as any).sno || r.auditIndex + 1}
        </span>
      ),
      footer: () => <span className="font-bold text-white">Total</span>,
    },
    {
      key: 'branch_name',
      header: 'Branch',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body whitespace-nowrap font-medium">{r.branch_name || '—'}</span>,
    },
    {
      key: 'audit_no',
      header: 'Audit No.',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => (
        <span className="text-xs text-t-body font-medium whitespace-nowrap">
          {r.aql_code || r.audit_no || '—'}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => (
        <span className="text-xs text-t-body whitespace-nowrap font-medium">
          {formatDateOnly(r.audit_at || r.created_at)}
        </span>
      ),
    },
    {
      key: 'shift_name',
      header: 'Shift',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body whitespace-nowrap font-medium">{r.shift_name || '—'}</span>,
    },
    {
      key: 'team_name',
      header: 'Team',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body whitespace-nowrap font-medium">{r.team_name || '—'}</span>,
    },
    {
      key: 'zone_name',
      header: 'Zone',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body whitespace-nowrap font-medium">{r.zone_name || '—'}</span>,
    },
    {
      key: 'line_name',
      header: 'Line No.',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => (
        <span className="text-xs text-t-body font-medium whitespace-nowrap">
          {r.line_name || '—'}
        </span>
      ),
    },
    {
      key: 'order_no',
      header: 'Order No.',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.order_no || '—'}</span>,
    },
    {
      key: 'colour',
      header: 'Colour',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body whitespace-nowrap font-medium">{r.colour || '—'}</span>,
    },
    {
      key: 'buyer',
      header: 'Buyer',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body whitespace-nowrap font-medium">{r.buyer || '—'}</span>,
    },
    {
      key: 'style_name',
      header: 'Style Name',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.style_name || '—'}</span>,
    },
    {
      key: 'style_no',
      header: 'Style No.',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body whitespace-nowrap font-medium">{r.style_no || '—'}</span>,
    },
    {
      key: 'inspection_level',
      header: 'Insp. Level',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body whitespace-nowrap font-medium">{r.inspection_level || '—'}</span>,
    },
    {
      key: 'aql_level_major',
      header: 'AQL Major',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body whitespace-nowrap font-medium">{r.aql_level_major ?? '—'}</span>,
    },
    {
      key: 'aql_level_minor',
      header: 'AQL Minor',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body whitespace-nowrap font-medium">{r.aql_level_minor ?? '—'}</span>,
    },
    {
      key: 'size',
      header: 'Size',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.size || '—'}</span>,
    },
    {
      key: 'inspection_qty',
      header: 'Insp. Qty',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.inspection_qty ?? 0}</span>,
      footer: () => <span className="font-bold text-white">{kpiSummary.totalInspectedQty}</span>,
    },
    {
      key: 'sample_size',
      header: 'Sample Size',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.sample_size ?? 0}</span>,
      footer: () => <span className="font-bold text-white">{kpiSummary.totalSampleSize}</span>,
    },
    {
      key: 'allowed_major_defects',
      header: 'Allowed Major',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.allowed_major_defects ?? 0}</span>,
      footer: () => <span className="font-bold text-white">{kpiSummary.totalAllowedMajor}</span>,
    },
    {
      key: 'allowed_minor_defects',
      header: 'Allowed Minor',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.allowed_minor_defects ?? 0}</span>,
      footer: () => <span className="font-bold text-white">{kpiSummary.totalAllowedMinor}</span>,
    },
    {
      key: 'major_defect',
      header: 'Major Defects',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.major_defect ?? 0}</span>,
      footer: () => <span className="font-bold text-white">{kpiSummary.totalMajorDefects}</span>,
    },
    {
      key: 'minor_defect',
      header: 'Minor Defects',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.minor_defect ?? 0}</span>,
      footer: () => <span className="font-bold text-white">{kpiSummary.totalMinorDefects}</span>,
    },
    {
      key: 'total_defect',
      header: 'Total Defects',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.total_defect ?? 0}</span>,
      footer: () => <span className="font-bold text-white">{kpiSummary.totalDefects}</span>,
    },
    {
      key: 'defect_pct',
      header: 'DHU%',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.defect_item_pct || '—'}</span>,
      footer: () => <span className="font-bold text-white">{kpiSummary.defectPct}</span>,
    },

    // ── Defect-specific detail columns ──────────────────────────────────────
    {
      key: 'defect_category',
      header: 'Defect Category',
      render: (r) => <span className="text-xs text-t-body whitespace-nowrap font-medium">{r.defect_category_name || '—'}</span>,
    },
    {
      key: 'defect_name',
      header: 'Defect Type',
      render: (r) => (
        <span className="text-xs font-medium text-t-body whitespace-nowrap">
          {r.defect_item_name || '—'}
        </span>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (r) => {
        if (!r.defect_severity_name || r.defect_severity_name === '—') {
          return <span className="text-xs text-t-muted">—</span>
        }
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${getSeverityBadgeClass(r.defect_severity_name)}`}>
            {r.defect_severity_name}
          </span>
        )
      },
    },
    {
      key: 'defect_qty',
      header: 'Defect Qty',
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.defect_item_qty ?? 0}</span>,
      footer: () => <span className="font-bold text-white">{kpiSummary.totalDefects}</span>,
    },

    // ── Audit result & info ────────────────────────────────────────────────
    {
      key: 'inspection_result',
      header: 'Inspection Result',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => {
        const resultText = r.aql_status || (r as any).inspection_result || (r as any).status || (Number(r.aql_result) === 1 ? 'Pass' : 'Fail')
        const isPass = String(resultText).toLowerCase() === 'pass'
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${isPass
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-500/10 text-[#FF0000] border border-[#FF0000]/30'
              }`}
          >
            {isPass ? <CheckCircle2 size={12} className="shrink-0" /> : <XCircle size={12} className="shrink-0 text-[#FF0000]" />}
            {resultText}
          </span>
        )
      },
    },
    {
      key: 'auditor_name',
      header: 'Auditor',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.auditor_name || '—'}</span>,
    },
    {
      key: 'auditor_code',
      header: 'Auditor ID',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => <span className="text-xs text-t-body font-medium whitespace-nowrap">{r.auditor_code || '—'}</span>,
    },
    {
      key: 'audit_at',
      header: 'Audit Time',
      rowSpan: (r) => (r.isFirstDefect ? r.defectCount : 0),
      render: (r) => (
        <span className="text-xs text-t-body font-medium whitespace-nowrap">
          {formatDateTime(r.audit_at || r.created_at)}
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Top KPI Summary Cards Matching Excel Demo ────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 px-4 pt-3 pb-2 shrink-0">
        {/* Card 1: Total Inspected Qty */}
        <div className="bg-card border border-border/70 rounded-xl p-2.5 shadow-sm flex flex-col justify-between" style={{ borderTop: '3.5px solid #2563eb' }}>
          <span className="text-[11px] font-semibold text-t-secondary uppercase tracking-wider">Total Insp. Qty</span>
          <span className="text-base font-bold text-blue-600 dark:text-blue-400 mt-1">{kpiSummary.totalInspectedQty}</span>
        </div>

        {/* Card 2: Total Pass Qty */}
        <div className="bg-card border border-border/70 rounded-xl p-2.5 shadow-sm flex flex-col justify-between" style={{ borderTop: '3.5px solid #10b981' }}>
          <span className="text-[11px] font-semibold text-t-secondary uppercase tracking-wider">Total Pass Qty</span>
          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">{kpiSummary.totalPassQty}</span>
        </div>

        {/* Card 3: Total Fail Qty */}
        <div className="bg-card border border-border/70 rounded-xl p-2.5 shadow-sm flex flex-col justify-between" style={{ borderTop: '3.5px solid #f97316' }}>
          <span className="text-[11px] font-semibold text-t-secondary uppercase tracking-wider">Total Fail Qty</span>
          <span className="text-base font-bold text-orange-600 dark:text-orange-400 mt-1">{kpiSummary.totalFailQty}</span>
        </div>

        {/* Card 4: Defect Qty */}
        <div className="bg-card border border-border/70 rounded-xl p-2.5 shadow-sm flex flex-col justify-between" style={{ borderTop: '3.5px solid #eab308' }}>
          <span className="text-[11px] font-semibold text-t-secondary uppercase tracking-wider">Defect Qty</span>
          <span className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1">{kpiSummary.totalDefects}</span>
        </div>

        {/* Card 5: DHU */}
        <div className="bg-card border border-border/70 rounded-xl p-2.5 shadow-sm flex flex-col justify-between" style={{ borderTop: '3.5px solid #0284c7' }}>
          <span className="text-[11px] font-semibold text-t-secondary uppercase tracking-wider">DHU</span>
          <span className="text-base font-bold text-sky-600 dark:text-sky-400 mt-1">{kpiSummary.defectPct}</span>
        </div>

        {/* Card 6: Pass % */}
        <div className="bg-card border border-border/70 rounded-xl p-2.5 shadow-sm flex flex-col justify-between" style={{ borderTop: '3.5px solid #0d9488' }}>
          <span className="text-[11px] font-semibold text-t-secondary uppercase tracking-wider">Pass %</span>
          <span className="text-base font-bold text-teal-600 dark:text-teal-400 mt-1">{kpiSummary.passPct}</span>
        </div>

        {/* Card 7: Fail % */}
        <div className="bg-card border border-border/70 rounded-xl p-2.5 shadow-sm flex flex-col justify-between" style={{ borderTop: '3.5px solid #FF0000' }}>
          <span className="text-[11px] font-semibold text-t-secondary uppercase tracking-wider">Fail %</span>
          <span className="text-base font-bold text-[#FF0000] mt-1">{kpiSummary.failPct}</span>
        </div>
      </div>

      {/* ── Table Container ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <ReportTable<AqlAuditRowItem>
          columns={columns}
          data={flattenedRows}
          loading={loading}
          rowKey={(r) => r._rowKey}
          header={
            <Toolbar
              search={search}
              onSearchChange={onSearchChange}
              searchPlaceholder="Search audit, order, style, line, auditor..."
              showExport
              onExport={handleExportExcel}
              onExportPdf={handleExportPdf}
              exporting={exportingExcel || exportingPdf}
            >
              <div className="flex items-center gap-1.5 flex-nowrap">
                {/* Branch Filter */}
                <select
                  value={branchFilter}
                  onChange={(e) => onBranchFilterChange(e.target.value)}
                  disabled={!isAdmin && Boolean(userBranchId)}
                  className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[115px] shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {!(!isAdmin && userBranchId) && <option value="">All Branches</option>}
                  {branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.branch_name}
                    </option>
                  ))}
                </select>

                {/* Shift Filter */}
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

                {/* Team Filter */}
                <select
                  value={teamFilter}
                  onChange={(e) => onTeamFilterChange(e.target.value)}
                  className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[100px] shrink-0"
                >
                  <option value="">All Teams</option>
                  {teams.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.team_name}
                    </option>
                  ))}
                </select>

                {/* Date Range Picker */}
                <div className="relative z-[9999] w-[195px] shrink-0">
                  <DateRangePicker
                    startDate={fromDate}
                    endDate={toDate}
                    onChange={onDateRangeChange}
                  />
                </div>
              </div>
            </Toolbar>
          }
          totalCount={filteredRecords.length}
          emptyMessage="No AQL audit records found for the selected filters."
          countLabel="audit record"
          countLabelPlural="audit records"
        />
      </div>
    </div>
  )
}
