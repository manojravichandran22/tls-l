'use client'

import { useMemo } from 'react'
import {
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Award,
} from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import ReportTable, { type ReportColumn } from '@/components/ui/ReportTable'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import type {
  EfficiencyReportZone,
  EfficiencyReportTotal,
  EfficiencyReportFlatRow,
} from '../types'
import type {
  BranchOption,
  TeamOption,
  ShiftOption,
  ZoneOption,
  LineOption,
} from '@/hooks/useDropdownData'
import { useExport, type ExportColumn } from '@/hooks/useExport'
import { useExportPdf } from '@/hooks/useExportPdf'

interface EfficiencyReportListProps {
  zones: EfficiencyReportZone[]
  grandTotal?: EfficiencyReportTotal
  loading: boolean
  search: string
  branchFilter: string
  teamFilter: string
  shiftFilter: string
  zoneFilter: string
  lineFilter: string
  fromDate: string
  toDate: string
  branches?: BranchOption[] | { id: number; name: string }[]
  teams?: TeamOption[] | { id: number; name: string }[]
  shifts?: ShiftOption[] | { id: number; name: string; shift_name?: string }[]
  zonesList?: ZoneOption[] | { id: number; name: string }[]
  linesList?: LineOption[] | { id: number; name: string }[]
  onSearchChange: (val: string) => void
  onBranchFilterChange: (val: string) => void
  onTeamFilterChange: (val: string) => void
  onShiftFilterChange: (val: string) => void
  onZoneFilterChange: (val: string) => void
  onLineFilterChange: (val: string) => void
  onDateRangeChange: (start: string, end: string) => void
  onRefresh?: () => void
}

function fmtNum(val: any, _decimals?: number): string {
  if (val === undefined || val === null || val === '') return '0'
  return String(val)
}

function fmtPct(val: any): string {
  if (val === undefined || val === null || val === '') return '0%'
  const str = String(val).trim()
  return str.endsWith('%') ? str : `${str}%`
}

function computeContiguousSpans<T>(items: T[], getKey: (item: T) => string): number[] {
  const spans: number[] = new Array(items.length).fill(0)
  let i = 0
  while (i < items.length) {
    let count = 1
    const key = getKey(items[i])
    while (i + count < items.length && getKey(items[i + count]) === key) {
      count++
    }
    spans[i] = count
    for (let j = 1; j < count; j++) {
      spans[i + j] = 0
    }
    i += count
  }
  return spans
}

function flattenEfficiencyData(
  zones: EfficiencyReportZone[],
  grandTotal?: EfficiencyReportTotal,
  searchTerm: string = ''
): EfficiencyReportFlatRow[] {
  const rows: EfficiencyReportFlatRow[] = []
  if (!Array.isArray(zones)) return rows

  const s = searchTerm.toLowerCase().trim()

  zones.forEach((zone, zIdx) => {
    const lines = zone.lines || []
    let zoneHasMatchingOrders = false
    const zoneOrderRows: EfficiencyReportFlatRow[] = []

    lines.forEach((line, lIdx) => {
      const orders = line.orders || []

      // Filter orders by search term if provided
      const filteredOrders = s
        ? orders.filter((ord) => {
          const haystack = [
            ord.io_no,
            ord.style_name,
            ord.style_no,
            ord.colour,
            ord.shift,
            ord.team,
            line.line,
            zone.zone_name,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return haystack.includes(s)
        })
        : orders

      if (filteredOrders.length > 0) {
        zoneHasMatchingOrders = true

        const shiftSpans = computeContiguousSpans(filteredOrders, (o) => o.shift || '-')
        const teamSpans = computeContiguousSpans(filteredOrders, (o) => o.team || '-')

        const lineBlockKey = `z${zIdx}_l${lIdx}_${line.line_id || lIdx}_${line.shift_id || 'n'}_${line.team_id || 'n'}`

        filteredOrders.forEach((ord, oIdx) => {
          zoneOrderRows.push({
            _rowId: `z${zIdx}_l${lIdx}_o${oIdx}_${ord.order_id || oIdx}`,
            _rowType: 'order',
            _zoneName: zone.zone_name,
            _lineName: line.line,
            _lineBlockKey: lineBlockKey,
            _lineRowSpan: oIdx === 0 ? filteredOrders.length : 0,
            _shiftRowSpan: shiftSpans[oIdx],
            _teamRowSpan: teamSpans[oIdx],
            shift: ord.shift || '-',
            team: ord.team || '-',
            zone_name: zone.zone_name || line.zone_name || '-',
            line: line.line || '-',
            io_no: ord.io_no || '-',
            colour: ord.colour || '-',
            style_name: ord.style_name || '-',
            style_no: ord.style_no || '-',
            smv: ord.smv ?? 0,
            manpower: line.manpower,
            working_hours: line.working_hours,
            available_sah: line.available_sah,
            style_wise_sah: ord.style_wise_sah ?? 0,
            achieved_sah: line.achieved_sah,
            tls_closed: ord.tls_closed ?? 0,
            tls_open: ord.tls_open ?? 0,
            tls_total: ord.tls_total ?? 0,
            checked_pcs: ord.checked_pcs ?? 0,
            rework_qty: ord.rework_qty ?? 0,
            rework_pct: ord.rework_pct ?? 0,
            rej_qty: ord.rej_qty ?? 0,
            rej_pct: ord.rej_pct ?? 0,
            total_defects: ord.total_defects ?? 0,
            dhu_pct: ord.dhu_pct ?? 0,
            output: ord.output ?? 0,
            eff_pct: line.eff_pct,
          })
        })
      } else if (!s) {
        // Line without orders when not searching
        const lineBlockKey = `z${zIdx}_l${lIdx}_${line.line_id || lIdx}_${line.shift_id || 'n'}_${line.team_id || 'n'}`
        zoneOrderRows.push({
          _rowId: `z${zIdx}_l${lIdx}_empty`,
          _rowType: 'line_empty',
          _zoneName: zone.zone_name,
          _lineName: line.line,
          _lineBlockKey: lineBlockKey,
          _lineRowSpan: 1,
          _shiftRowSpan: 1,
          _teamRowSpan: 1,
          _zoneRowSpan: 1,
          shift: '-',
          team: '-',
          zone_name: zone.zone_name || '-',
          line: line.line || '-',
          io_no: '-',
          colour: '-',
          style_name: '-',
          style_no: '-',
          smv: 0,
          manpower: line.manpower ?? 0,
          working_hours: line.working_hours ?? 0,
          available_sah: line.available_sah ?? 0,
          style_wise_sah: 0,
          achieved_sah: line.achieved_sah ?? 0,
          tls_closed: 0,
          tls_open: 0,
          tls_total: 0,
          checked_pcs: 0,
          rework_qty: 0,
          rework_pct: 0,
          rej_qty: 0,
          rej_pct: 0,
          total_defects: 0,
          dhu_pct: 0,
          output: 0,
          eff_pct: line.eff_pct ?? 0,
        })
      }
    })

    if (zoneOrderRows.length > 0) {
      const zoneSpans = computeContiguousSpans(zoneOrderRows, (r) => r.zone_name || '-')
      const lineSpans = computeContiguousSpans(zoneOrderRows, (r) => r._lineBlockKey || `${r.zone_name || '-'}_${r.line || '-'}`)
      zoneOrderRows.forEach((r, idx) => {
        r._zoneRowSpan = zoneSpans[idx]
        r._lineRowSpan = lineSpans[idx]
      })
      rows.push(...zoneOrderRows)
    }

    // Zone Total Row
    if ((!s || zoneHasMatchingOrders) && zone.zone_total) {
      const zt = zone.zone_total
      rows.push({
        _rowId: `z${zIdx}_total`,
        _rowType: 'zone_total',
        _lineRowSpan: 1,
        _shiftRowSpan: 1,
        _teamRowSpan: 1,
        _zoneRowSpan: 1,
        label: zt.label || `${zone.zone_name || 'Zone'} Total`,
        zone_name: zone.zone_name,
        manpower: zt.manpower ?? 0,
        working_hours: zt.working_hours ?? 0,
        available_sah: zt.available_sah ?? 0,
        style_wise_sah: zt.style_wise_sah ?? 0,
        achieved_sah: zt.achieved_sah ?? 0,
        tls_closed: zt.tls_closed ?? 0,
        tls_open: zt.tls_open ?? 0,
        tls_total: zt.tls_total ?? 0,
        checked_pcs: zt.checked_pcs ?? 0,
        rework_qty: zt.rework_qty ?? 0,
        rework_pct: zt.rework_pct ?? 0,
        rej_qty: zt.rej_qty ?? 0,
        rej_pct: zt.rej_pct ?? 0,
        total_defects: zt.total_defects ?? 0,
        dhu_pct: zt.dhu_pct ?? 0,
        output: zt.output ?? 0,
        eff_pct: zt.eff_pct ?? 0,
        order_count: zt.order_count ?? 0,
      })
    }
  })

  // Grand Total Row
  if (!s && grandTotal) {
    const gt = grandTotal
    rows.push({
      _rowId: 'grand_total',
      _rowType: 'grand_total',
      _lineRowSpan: 1,
      _shiftRowSpan: 1,
      _teamRowSpan: 1,
      _zoneRowSpan: 1,
      label: gt.label || 'Grand Total',
      manpower: gt.manpower ?? 0,
      working_hours: gt.working_hours ?? 0,
      available_sah: gt.available_sah ?? 0,
      style_wise_sah: gt.style_wise_sah ?? 0,
      achieved_sah: gt.achieved_sah ?? 0,
      tls_closed: gt.tls_closed ?? 0,
      tls_open: gt.tls_open ?? 0,
      tls_total: gt.tls_total ?? 0,
      checked_pcs: gt.checked_pcs ?? 0,
      rework_qty: gt.rework_qty ?? 0,
      rework_pct: gt.rework_pct ?? 0,
      rej_qty: gt.rej_qty ?? 0,
      rej_pct: gt.rej_pct ?? 0,
      total_defects: gt.total_defects ?? 0,
      dhu_pct: gt.dhu_pct ?? 0,
      output: gt.output ?? 0,
      eff_pct: gt.eff_pct ?? 0,
      order_count: gt.order_count ?? 0,
    })
  }

  return rows
}

export default function EfficiencyReportList({
  zones,
  grandTotal,
  loading,
  search,
  branchFilter,
  teamFilter,
  shiftFilter,
  zoneFilter,
  lineFilter,
  fromDate,
  toDate,
  branches = [],
  teams = [],
  shifts = [],
  zonesList = [],
  linesList = [],
  onSearchChange,
  onBranchFilterChange,
  onTeamFilterChange,
  onShiftFilterChange,
  onZoneFilterChange,
  onLineFilterChange,
  onDateRangeChange,
}: EfficiencyReportListProps) {
  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  // Flatten hierarchical zone data into table rows
  const tableRows = useMemo(
    () => flattenEfficiencyData(zones, grandTotal, search),
    [zones, grandTotal, search]
  )

  // Export Columns setup
  const exportColumns: ExportColumn<EfficiencyReportFlatRow>[] = useMemo(
    () => [
      { header: 'Shift', value: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : r.shift || '') },
      { header: 'Team', value: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : r.team || '') },
      { header: 'Zone', value: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? r.label || '' : r.zone_name || '') },
      { header: 'Line', value: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : r.line || '') },
      { header: 'IO #', value: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : r.io_no || '') },
      { header: 'Colour', value: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : r.colour || '') },
      { header: 'Style Name', value: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : r.style_name || '') },
      { header: 'Style No', value: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : r.style_no || '') },
      { header: 'SMV', value: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : r.smv ?? 0) },
      { header: 'Manpower', value: (r) => r.manpower ?? 0 },
      { header: 'Working Hours', value: (r) => r.working_hours ?? 0 },
      { header: 'Available SAH', value: (r) => r.available_sah ?? 0 },
      { header: 'Style Wise SAH', value: (r) => r.style_wise_sah ?? 0 },
      { header: 'Achieved SAH', value: (r) => r.achieved_sah ?? 0 },
      { header: 'TLS Issues Closed', value: (r) => r.tls_closed ?? 0 },
      { header: 'TLS Issues Open', value: (r) => r.tls_open ?? 0 },
      { header: 'Total TLS Issue', value: (r) => r.tls_total ?? 0 },
      { header: 'Checked Pcs', value: (r) => r.checked_pcs ?? 0 },
      { header: 'Rework Qty', value: (r) => r.rework_qty ?? 0 },
      { header: 'Rework %', value: (r) => `${r.rework_pct ?? 0}%` },
      { header: 'Rej Qty', value: (r) => r.rej_qty ?? 0 },
      { header: 'Rej%', value: (r) => `${r.rej_pct ?? 0}%` },
      { header: 'Total Defects', value: (r) => r.total_defects ?? 0 },
      { header: 'DHU %', value: (r) => `${r.dhu_pct ?? 0}%` },
      { header: 'Output', value: (r) => r.output ?? 0 },
      { header: 'Eff %', value: (r) => `${r.eff_pct ?? 0}%` },
    ],
    []
  )

  const exportPayload = useMemo(
    () => ({
      search: search || '',
      date_from: fromDate,
      date_to: toDate || fromDate,
      from_date: fromDate,
      to_date: toDate || fromDate,
      branch_id: branchFilter || '',
      team_id: teamFilter || '',
      shift_id: shiftFilter || '',
      zone_id: zoneFilter || '',
      line_id: lineFilter || '',
      type: '',
    }),
    [search, fromDate, toDate, branchFilter, teamFilter, shiftFilter, zoneFilter, lineFilter]
  )

  const { handleExport, exporting } = useExport({
    apiPath: '/livetracking/efficiencyreport',
    payload: exportPayload,
    dataKey: 'data',
    columns: exportColumns,
    filename: 'Efficiency_Report',
    method: 'POST',
  })

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/livetracking/efficiencyreport',
    payload: exportPayload,
    filename: 'Efficiency_Report',
  })

  // Table columns specification
  const columns: ReportColumn<EfficiencyReportFlatRow>[] = useMemo(
    () => [
      // {
      //   key: 'branch_name',
      //   header: 'Branch',
      //   className: 'min-w-[110px]',
      //   render: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : (r as any).branch_name || (r as any).branch || '-'),
      // },
      {
        key: 'shift',
        header: 'Shift',
        className: 'min-w-[80px]',
        rowSpan: (r) => r._shiftRowSpan,
        render: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : r.shift || '-'),
      },
      {
        key: 'team',
        header: 'Team',
        className: 'min-w-[90px]',
        rowSpan: (r) => r._teamRowSpan,
        render: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : r.team || '-'),
      },
      {
        key: 'zone_name',
        header: 'Zone',
        className: 'min-w-[120px] font-medium',
        rowSpan: (r) => r._zoneRowSpan,
        render: (r) => {
          if (r._rowType === 'zone_total' || r._rowType === 'grand_total') {
            return <span className="font-bold">{r.label}</span>
          }
          return r.zone_name || '-'
        },
      },
      {
        key: 'line',
        header: 'Line',
        className: 'min-w-[120px]',
        rowSpan: (r) => r._lineRowSpan,
        render: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : r.line || '-'),
      },
      {
        key: 'io_no',
        header: 'Order No',
        className: 'min-w-[90px]',
        render: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : r.io_no || '-'),
      },
      {
        key: 'colour',
        header: 'COLOUR',
        className: 'min-w-[100px]',
        render: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : r.colour || '-'),
      },
      {
        key: 'style_name',
        header: 'Style Name',
        className: 'min-w-[130px]',
        render: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : r.style_name || '-'),
      },
      {
        key: 'style_no',
        header: 'STYLE number',
        className: 'min-w-[120px]',
        render: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : r.style_no || '-'),
      },
      {
        key: 'smv',
        header: 'SMV',
        className: 'min-w-[70px] text-right',
        render: (r) => (r._rowType === 'zone_total' || r._rowType === 'grand_total' ? '' : fmtNum(r.smv)),
      },
      {
        key: 'manpower',
        header: 'Manpower',
        className: 'min-w-[80px] text-right',
        rowSpan: (r) => r._lineRowSpan,
        render: (r) => (r.manpower !== undefined ? fmtNum(r.manpower) : ''),
      },
      {
        key: 'working_hours',
        header: 'Working Hours',
        className: 'min-w-[90px] text-right',
        rowSpan: (r) => r._lineRowSpan,
        render: (r) => (r.working_hours !== undefined && r.working_hours !== null ? r.working_hours : ''),
      },
      {
        key: 'available_sah',
        header: 'Available SAH',
        className: 'min-w-[90px] text-right',
        rowSpan: (r) => r._lineRowSpan,
        render: (r) => (r.available_sah !== undefined ? fmtNum(r.available_sah) : ''),
      },
      {
        key: 'style_wise_sah',
        header: 'Style wise SAH',
        className: 'min-w-[90px] text-right',
        render: (r) => fmtNum(r.style_wise_sah),
      },
      {
        key: 'achieved_sah',
        header: 'Achieved SAH',
        className: 'min-w-[90px] text-right',
        rowSpan: (r) => r._lineRowSpan,
        render: (r) => (r.achieved_sah !== undefined ? fmtNum(r.achieved_sah) : ''),
      },
      {
        key: 'tls_closed',
        header: 'TLS Issues Closed',
        className: 'min-w-[100px] text-right',
        render: (r) => {
          if (r._rowType === 'grand_total') {
            return <span className="text-white font-bold">{fmtNum(r.tls_closed)}</span>
          }
          if (r._rowType === 'zone_total') {
            return <span className="font-bold">{fmtNum(r.tls_closed)}</span>
          }
          return fmtNum(r.tls_closed)
        },
      },
      {
        key: 'tls_open',
        header: 'TLS Issues Open',
        className: 'min-w-[100px] text-right',
        render: (r) => {
          if (r._rowType === 'grand_total') {
            return <span className="text-white font-bold">{fmtNum(r.tls_open)}</span>
          }
          if (r._rowType === 'zone_total') {
            return <span className="font-bold">{fmtNum(r.tls_open)}</span>
          }
          return fmtNum(r.tls_open)
        },
      },
      {
        key: 'tls_total',
        header: 'Total TLS Issue',
        className: 'min-w-[100px] text-right font-medium',
        render: (r) => {
          if (r._rowType === 'grand_total') return <span className="text-white font-bold">{fmtNum(r.tls_total)}</span>
          if (r._rowType === 'zone_total') return <span className="font-bold">{fmtNum(r.tls_total)}</span>
          return fmtNum(r.tls_total)
        },
      },
      {
        key: 'checked_pcs',
        header: 'Checked Pcs',
        className: 'min-w-[90px] text-right font-medium',
        render: (r) => {
          if (r._rowType === 'grand_total') return <span className="text-white font-bold">{fmtNum(r.checked_pcs)}</span>
          if (r._rowType === 'zone_total') return <span className="font-bold">{fmtNum(r.checked_pcs)}</span>
          return fmtNum(r.checked_pcs)
        },
      },
      {
        key: 'rework_qty',
        header: 'Rework Qty',
        className: 'min-w-[80px] text-right',
        render: (r) => {
          if (r._rowType === 'grand_total') {
            return <span className="text-white font-bold">{fmtNum(r.rework_qty)}</span>
          }
          if (r._rowType === 'zone_total') {
            return <span className="font-bold">{fmtNum(r.rework_qty)}</span>
          }
          return fmtNum(r.rework_qty)
        },
      },
      {
        key: 'rework_pct',
        header: 'Rework %',
        className: 'min-w-[80px] text-right',
        render: (r) => {
          if (r._rowType === 'grand_total') {
            return <span className="text-white font-bold">{fmtPct(r.rework_pct)}</span>
          }
          if (r._rowType === 'zone_total') {
            return <span className="font-bold">{fmtPct(r.rework_pct)}</span>
          }
          return fmtPct(r.rework_pct)
        },
      },
      {
        key: 'rej_qty',
        header: 'Rej Qty',
        className: 'min-w-[80px] text-right',
        render: (r) => {
          if (r._rowType === 'grand_total') {
            return <span className="text-white font-bold">{fmtNum(r.rej_qty)}</span>
          }
          if (r._rowType === 'zone_total') {
            return <span className="font-bold">{fmtNum(r.rej_qty)}</span>
          }
          return fmtNum(r.rej_qty)
        },
      },
      {
        key: 'rej_pct',
        header: 'Rej%',
        className: 'min-w-[80px] text-right',
        render: (r) => {
          if (r._rowType === 'grand_total') {
            return <span className="text-white font-bold">{fmtPct(r.rej_pct)}</span>
          }
          if (r._rowType === 'zone_total') {
            return <span className="font-bold">{fmtPct(r.rej_pct)}</span>
          }
          return fmtPct(r.rej_pct)
        },
      },
      {
        key: 'total_defects',
        header: 'Total Defects',
        className: 'min-w-[90px] text-right font-semibold',
        render: (r) => {
          if (r._rowType === 'grand_total') return <span className="text-white font-bold">{fmtNum(r.total_defects)}</span>
          if (r._rowType === 'zone_total') return <span className="font-bold">{fmtNum(r.total_defects)}</span>
          return fmtNum(r.total_defects)
        },
      },
      {
        key: 'dhu_pct',
        header: 'DHU %',
        className: 'min-w-[80px] text-right font-medium',
        render: (r) => {
          if (r._rowType === 'grand_total') return <span className="text-white font-bold">{fmtPct(r.dhu_pct)}</span>
          if (r._rowType === 'zone_total') return <span className="font-bold">{fmtPct(r.dhu_pct)}</span>
          return fmtPct(r.dhu_pct)
        },
      },
      {
        key: 'output',
        header: 'Output',
        className: 'min-w-[90px] text-right',
        render: (r) => {
          if (r._rowType === 'grand_total') {
            return <span className="text-white font-bold">{fmtNum(r.output)}</span>
          }
          if (r._rowType === 'zone_total') {
            return <span className="font-bold">{fmtNum(r.output)}</span>
          }
          return fmtNum(r.output)
        },
      },
      {
        key: 'eff_pct',
        header: 'Eff %',
        className: 'min-w-[90px] text-right',
        rowSpan: (r) => r._lineRowSpan,
        render: (r) => {
          if (r.eff_pct === undefined) return ''
          if (r._rowType === 'grand_total') {
            return <span className="text-white font-bold">{fmtPct(r.eff_pct)}</span>
          }
          if (r._rowType === 'zone_total') {
            return <span className="font-bold">{fmtPct(r.eff_pct)}</span>
          }
          return fmtPct(r.eff_pct)
        },
      },
    ],
    []
  )

  // Top KPI summary metrics
  const summaryMetrics = useMemo(() => {
    const gt = grandTotal || {}
    return {
      output: gt.output ?? 0,
      checkedPcs: gt.checked_pcs ?? 0,
      effPct: gt.eff_pct ?? 0,
      achievedSah: gt.achieved_sah ?? 0,
      availableSah: gt.available_sah ?? 0,
      totalDefects: gt.total_defects ?? 0,
      dhuPct: gt.dhu_pct ?? 0,
      tlsTotal: gt.tls_total ?? 0,
      tlsClosed: gt.tls_closed ?? 0,
      tlsOpen: gt.tls_open ?? 0,
    }
  }, [grandTotal])

  return (
    <div className="flex flex-col h-full gap-4">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 shrink-0">
        <div className="bg-card p-4 rounded-xl border border-header-line shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-t-lighter font-medium">Total Output</p>
            <h3 className="text-xl font-bold text-t-main mt-0.5">
              {summaryMetrics.output.toLocaleString()}
            </h3>
            <p className="text-xs text-t-lighter mt-1">
              Checked: <span className="font-semibold text-t-main">{summaryMetrics.checkedPcs.toLocaleString()}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-header-line shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-t-lighter font-medium">Overall Efficiency</p>
            <h3 className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-0.5">
              {summaryMetrics.effPct != null ? `${summaryMetrics.effPct}%` : '0%'}
            </h3>
            <p className="text-xs text-t-lighter mt-1">
              Target: <span className="font-semibold text-t-main">100%</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-header-line shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-t-lighter font-medium">Achieved SAH</p>
            <h3 className="text-xl font-bold text-t-main mt-0.5">
              {summaryMetrics.achievedSah}
            </h3>
            <p className="text-xs text-t-lighter mt-1">
              Available: <span className="font-semibold text-t-main">{summaryMetrics.availableSah}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-header-line shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-t-lighter font-medium">Total Defects</p>
            <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {summaryMetrics.totalDefects}
            </h3>
            <p className="text-xs text-t-lighter mt-1">
              DHU: <span className="font-semibold text-amber-600 dark:text-amber-400">{summaryMetrics.dhuPct != null ? `${summaryMetrics.dhuPct}%` : '0%'}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-header-line shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-t-lighter font-medium">TLS Issues</p>
            <h3 className="text-xl font-bold text-t-main mt-0.5">
              {summaryMetrics.tlsTotal.toLocaleString()}
            </h3>
            <p className="text-xs text-t-lighter mt-1">
              Closed: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{summaryMetrics.tlsClosed}</span> | Open: <span className="text-amber-600 dark:text-amber-400 font-semibold">{summaryMetrics.tlsOpen}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <ReportTable<EfficiencyReportFlatRow>
        columns={columns}
        data={tableRows}
        loading={loading}
        rowKey={(r) => r._rowId}
        totalCount={grandTotal?.order_count}
        countLabel="order"
        countLabelPlural="orders"
        emptyMessage="No efficiency data available for selected filters"
        rowClassName={(r) => {
          if (r._rowType === 'zone_total') {
            return 'bg-[#edf7f8] dark:bg-[#0d2a2d] font-bold text-[#007b83] dark:text-[#2dd4bf] border-t border-b border-[#007b83]/30 hover:bg-[#e2f2f4] dark:hover:bg-[#103438]'
          }
          if (r._rowType === 'grand_total') {
            return 'bg-[#007b83] text-white font-bold text-sm border-t-2 border-[#005a60] hover:bg-[#006e75]'
          }
          return ''
        }}
        header={
          <Toolbar
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search IO, Style, Line, Zone..."
            onExport={handleExport}
            onExportPdf={handleExportPdf}
            exporting={exporting || exportingPdf}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {/* Branch Filter */}
              <select
                value={branchFilter}
                onChange={(e) => onBranchFilterChange(e.target.value)}
                disabled={!isAdmin && Boolean(userBranchId)}
                className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[110px] shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {!(!isAdmin && userBranchId) && <option value="">All Branches</option>}
                {branches.map((b: any) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.branch_name || b.name}
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
                {shifts.map((s: any) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.shift_name || s.name}
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
                {teams.map((t: any) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.team_name || t.name || `Team ${t.id}`}
                  </option>
                ))}
              </select>

              

              {/* Zone Filter */}
              {zonesList.length > 0 && (
                <select
                  value={zoneFilter}
                  onChange={(e) => onZoneFilterChange(e.target.value)}
                  className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[100px] shrink-0"
                >
                  <option value="">All Zones</option>
                  {zonesList.map((z: any) => (
                    <option key={z.id} value={String(z.id)}>
                      {z.zone_name || z.name || `Zone ${z.id}`}
                    </option>
                  ))}
                </select>
              )}

              {/* Line Filter */}
              {linesList.length > 0 && (
                <select
                  value={lineFilter}
                  onChange={(e) => onLineFilterChange(e.target.value)}
                  className="h-8 px-2 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent w-[100px] shrink-0"
                >
                  <option value="">All Lines</option>
                  {linesList.map((l: any) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.line_name || l.line_no || l.name || `Line ${l.id}`}
                    </option>
                  ))}
                </select>
              )}

              <div className="relative z-[9999] w-[190px] shrink-0">
                <DateRangePicker
                  startDate={fromDate}
                  endDate={toDate}
                  onChange={onDateRangeChange}
                />
              </div>
            </div>
          </Toolbar>
        }
      />
    </div>
  )
}
