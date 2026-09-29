'use client'

import { useState, useMemo, useEffect } from 'react'
import { CheckCircle2, Clock, XCircle, AlertCircle, Loader2, X } from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import AdvancedTable, { type AdvancedColumn } from '@/components/ui/AdvancedTable'
import type { TlsIssueRecord, CapItem } from '../types'
import type { BranchOption, ShiftOption, TeamOption } from '@/hooks/useDropdownData'
import { tlsSocket } from '@/services/socketService'

// ── FORMATTING HELPERS ───────────────────────────────────────────────────────

function formatDateTime(val?: string): string {
  if (!val) return '—'
  try {
    const d = new Date(val)
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      return `${day}/${month}/${year} ${time}`
    }
  } catch { }
  return val
}

function parseCapItems(capData?: string | CapItem[] | null): string[] {
  if (!capData) return []
  if (Array.isArray(capData)) {
    return capData
      .map((c) => (typeof c === 'object' && c ? (c.cap_name || c.short_name || (c as any).name || JSON.stringify(c)) : String(c)))
      .filter(Boolean)
  }
  if (typeof capData === 'string') {
    const trimmed = capData.trim()
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === '—') return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .map((c: any) => (typeof c === 'object' && c ? (c.cap_name || c.short_name || (c as any).name || JSON.stringify(c)) : String(c)))
          .filter(Boolean)
      }
    } catch { }
    if (trimmed.includes(',')) {
      return trimmed.split(',').map((s) => s.trim()).filter(Boolean)
    }
    return [trimmed]
  }
  return []
}

function parseCapText(capData?: string | CapItem[] | null): string {
  const items = parseCapItems(capData)
  return items.length > 0 ? items.join(', ') : '—'
}

function getNameOrDash(name?: string | null, id?: string | number | null, fallbackField?: string | null): string {
  if (name && String(name).trim() && String(name).trim() !== 'null' && String(name).trim() !== 'undefined') {
    return String(name).trim()
  }
  if (fallbackField && String(fallbackField).trim() && String(fallbackField).trim() !== 'null' && String(fallbackField).trim() !== 'undefined') {
    return String(fallbackField).trim()
  }
  if (id != null) {
    const strId = String(id).trim()
    if (strId && isNaN(Number(strId)) && strId !== 'null' && strId !== 'undefined') {
      return strId
    }
  }
  return '—'
}

// ── STATUS BADGE COMPONENT ───────────────────────────────────────────────────

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

function getColorNameFromHex(hex?: string | null): string | null {
  if (!hex) return null
  const h = hex.toLowerCase().trim()
  if (h === '#ff0000' || h === '#ef4444' || h === '#dc2626') return 'Red'
  if (h === '#ffff00' || h === '#ffc000' || h === '#f59e0b' || h === '#eab308') return 'Yellow'
  if (h === '#00ff00' || h === '#00b050' || h === '#22c55e' || h === '#16a34a' || h === '#10b981') return 'Green'
  if (h === '#ffa500' || h === '#f97316' || h === '#ea580c') return 'Orange'
  if (h === '#3b82f6' || h === '#2563eb' || h === '#0000ff') return 'Blue'
  return null
}

function StatusColorBadge({
  color,
  hex,
  label,
  fallback = '—',
}: {
  color?: string | null
  hex?: string | null
  label?: string | null
  fallback?: string
}) {
  const effectiveHex = hex && String(hex).trim().startsWith('#')
    ? String(hex).trim()
    : color && String(color).trim().startsWith('#')
      ? String(color).trim()
      : undefined

  const derivedLabel = label || color || (effectiveHex ? getColorNameFromHex(effectiveHex) || effectiveHex : null)
  if (!derivedLabel || String(derivedLabel).trim() === '' || String(derivedLabel).trim() === 'null') {
    return <span className="text-t-secondary">{fallback}</span>
  }

  const text = String(derivedLabel)
  const lower = text.toLowerCase().trim()
  let bgClass = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700'

  if (lower.includes('red') || lower === 'critical' || lower === 'fail' || lower.includes('fail')) {
    bgClass = 'bg-gradient-to-r from-red-600 to-red-500 text-white border-red-700 shadow-xs'
  } else if (lower.includes('yellow') || lower === 'attention' || lower.includes('pending')) {
    bgClass = 'bg-gradient-to-r from-amber-400 to-amber-500 text-black border-amber-500 font-bold shadow-xs'
  } else if (lower.includes('green') || lower === 'pass' || lower === 'normal' || lower.includes('closed') || lower === 'success') {
    bgClass = 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white border-emerald-700 shadow-xs'
  } else if (lower.includes('orange') || lower.includes('escalate')) {
    bgClass = 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-700 shadow-xs'
  }

  const textColor = effectiveHex ? getContrastTextColor(effectiveHex) : undefined

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-md border text-center whitespace-nowrap min-w-[70px] ${bgClass}`}
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
      {text}
    </span>
  )
}

// ── PROPS ────────────────────────────────────────────────────────────────────

interface TlsControlCenterListProps {
  records: TlsIssueRecord[]
  loading: boolean
  search: string
  branchFilter: string
  teamFilter: string
  shiftFilter: string
  statusFilter: string
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  branches: BranchOption[]
  teams: TeamOption[]
  shifts: ShiftOption[]
  onSearchChange: (val: string) => void
  onBranchFilterChange: (val: string) => void
  onTeamFilterChange: (val: string) => void
  onShiftFilterChange: (val: string) => void
  onStatusFilterChange: (val: string) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onRefresh?: (isSilent?: boolean) => void
}

export default function TlsControlCenterList({
  records,
  loading,
  search,
  branchFilter,
  teamFilter,
  shiftFilter,
  statusFilter,
  page,
  perPage,
  totalPages,
  totalCount,
  branches,
  teams,
  shifts,
  onSearchChange,
  onBranchFilterChange,
  onTeamFilterChange,
  onShiftFilterChange,
  onStatusFilterChange,
  onPageChange,
  onPerPageChange,
  onRefresh,
}: TlsControlCenterListProps) {
  const [updatingRecordIds, setUpdatingRecordIds] = useState<Set<string>>(new Set())
  const [liveSyncing, setLiveSyncing] = useState(false)
  const [capModal, setCapModal] = useState<{
    isOpen: boolean
    title: string
    items: string[]
  }>({
    isOpen: false,
    title: '',
    items: [],
  })

  const openCapModal = (title: string, items: string[]) => {
    setCapModal({ isOpen: true, title, items })
  }

  const closeCapModal = () => {
    setCapModal({ isOpen: false, title: '', items: [] })
  }

  useEffect(() => {
    tlsSocket.connect()

    const handleLiveSocketData = (eventType: string, data: any) => {
      console.log(`⚡ [FRONTEND] Socket event '${eventType}':`, data)

      const rawId = data?.id ?? data?.issue_id ?? data?.tls_id ?? data?.qc_audit_id ?? data?.data?.id ?? data?.record_id
      const targetIdStr = rawId !== undefined && rawId !== null ? String(rawId) : null

      if (targetIdStr) {
        setUpdatingRecordIds((prev) => new Set(prev).add(targetIdStr))
      }
      setLiveSyncing(true)

      // SILENT REFETCH — keeps loading=false so whole table doesn't refresh/flash!
      if (onRefresh) {
        onRefresh(true)
      }

      setTimeout(() => {
        if (targetIdStr) {
          setUpdatingRecordIds((prev) => {
            const next = new Set(prev)
            next.delete(targetIdStr)
            return next
          })
        }
        setLiveSyncing(false)
      }, 2500)
    }

    tlsSocket.on('connect', () => {
      console.log('🔌 [FRONTEND] TLS socket connected:', tlsSocket.id)
    })

    tlsSocket.on('tlsIssueInserted', (data) => handleLiveSocketData('tlsIssueInserted', data))
    tlsSocket.on('tlsIssueUpdated', (data) => handleLiveSocketData('tlsIssueUpdated', data))
    tlsSocket.on('tlsIssueStatusChanged', (data) => handleLiveSocketData('tlsIssueStatusChanged', data))
    tlsSocket.on('tlsStatusUpdated', (data) => handleLiveSocketData('tlsStatusUpdated', data))
    tlsSocket.on('tlsStatusChanged', (data) => handleLiveSocketData('tlsStatusChanged', data))
    tlsSocket.on('updateTlsStatus', (data) => handleLiveSocketData('updateTlsStatus', data))

    tlsSocket.on('connect_error', (error) => console.error('❌ [FRONTEND] TLS Socket connection error:', error))
    tlsSocket.on('disconnect', (reason) => console.log('🔌 [FRONTEND] TLS socket disconnected:', reason))

    return () => {
      tlsSocket.off('connect')
      tlsSocket.off('tlsIssueInserted')
      tlsSocket.off('tlsIssueUpdated')
      tlsSocket.off('tlsIssueStatusChanged')
      tlsSocket.off('tlsStatusUpdated')
      tlsSocket.off('tlsStatusChanged')
      tlsSocket.off('updateTlsStatus')
      tlsSocket.off('connect_error')
      tlsSocket.off('disconnect')
      tlsSocket.disconnect()
    }
  }, [onRefresh])

  // Status stats counters
  const stats = useMemo(() => {
    const capClosed = records.filter((r) => {
      const st = String(r.issue_status || '').trim().toLowerCase()
      return st.includes('closed') || st.includes('pass') || st.includes('completed')
    }).length
    const capPending = records.filter((r) => {
      const st = String(r.issue_status || '').trim().toLowerCase()
      return st.includes('pending') || st.includes('open') || st === 'new'
    }).length
    const qcPass = records.filter((r) => {
      const st = String(r.qc_status || '').trim().toLowerCase()
      return st.includes('pass')
    }).length
    const qcFail = records.filter((r) => {
      const st = String(r.qc_status || '').trim().toLowerCase()
      return st.includes('fail') || st.includes('reject')
    }).length
    return { total: totalCount || records.length, capClosed, capPending, qcPass, qcFail }
  }, [records, totalCount])

  // ── COLUMNS (Matching Excel Layout) ────────────────────────────────────────

  const columns: AdvancedColumn<TlsIssueRecord>[] = [
    {
      key: 'index',
      header: 'S.No',
      render: (_: TlsIssueRecord, i: number) => (
        <span className="text-t-secondary font-medium">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    // 1. Shift
    {
      key: 'shift_name',
      header: 'Shift',
      sortable: true,
      sortValue: (row) => getNameOrDash(row.shift_name, row.shift_id),
      render: (row) => (
        <span className="font-semibold text-t-primary whitespace-nowrap">
          {getNameOrDash(row.shift_name, row.shift_id)}
        </span>
      ),
    },
    // 2. Zone
    {
      key: 'zone',
      header: 'Zone',
      sortable: true,
      sortValue: (row) => String(row.zone_name || row.zone || ''),
      render: (row) => (
        <span className="font-medium text-t-body whitespace-nowrap">
          {row.zone_name || row.zone || '—'}
        </span>
      ),
    },
    // 3. Slot
    {
      key: 'slot',
      header: 'Slot',
      sortable: true,
      sortValue: (row) => String(row.slot_name || ''),
      render: (row) => (
        <span className="font-medium text-t-body whitespace-nowrap">
          {row.slot_name || '—'}
        </span>
      ),
    },
    // 4. Line.no
    {
      key: 'line_name',
      header: 'Line.no',
      sortable: true,
      sortValue: (row) => getNameOrDash(row.line_name, row.line_id),
      render: (row) => (
        <span className="text-accent font-bold whitespace-nowrap">
          {getNameOrDash(row.line_name, row.line_id)}
        </span>
      ),
    },
    // 5. Order number (Multi-line info: Order / Style / Buyer)
    {
      key: 'order_no',
      header: 'Order number',
      sortable: true,
      sortValue: (row) => row.order_no || row.order_code || String(row.order_id || ''),
      render: (row) => {
        const orderText = row.order_no || row.order_code || (row.order_id ? String(row.order_id) : '—')
        const subDetails = [row.buyer, row.style_no, row.style_name].filter(Boolean).join(' | ')
        return (
          <div className="flex flex-col min-w-[140px]">
            <span className="text-t-primary font-bold">{orderText}</span>
            {subDetails && (
              <span className="text-[11px] text-t-secondary font-medium truncate" title={subDetails}>
                {subDetails}
              </span>
            )}
          </div>
        )
      },
    },
    // 6. Colour
    {
      key: 'present_color',
      header: 'Colour',
      sortable: true,
      sortValue: (row) => row.present_color || row.color_name || row.color_id || '',
      render: (row) => {
        const colorName = row.present_color || row.color_name || row.color_id || '—'
        const hex = row.hex_code || (colorName.startsWith('#') ? colorName : undefined)
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {hex && (
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/15 dark:border-white/20 shadow-xs shrink-0 inline-block"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            )}
            <span className="text-t-body capitalize font-medium">{colorName}</span>
          </div>
        )
      },
    },
    // 7. Employee Name
    {
      key: 'operator_name',
      header: 'Employee Name',
      sortable: true,
      sortValue: (row) => getNameOrDash(row.operator_name, row.operator_id, (row as any).employee_name),
      render: (row) => (
        <span className="text-t-body font-medium whitespace-nowrap">
          {getNameOrDash(row.operator_name, row.operator_id, (row as any).employee_name)}
        </span>
      ),
    },
    // 8. Employee ID
    {
      key: 'operator_code',
      header: 'Employee ID',
      sortable: true,
      sortValue: (row) => row.operator_code || String(row.operator_id || ''),
      render: (row) => (
        <span className="font-mono text-xs text-t-secondary whitespace-nowrap">
          {row.operator_code || (row.operator_id ? String(row.operator_id) : '—')}
        </span>
      ),
    },
    // 9. Machine Type
    {
      key: 'machine_type',
      header: 'Machine Type',
      sortable: true,
      sortValue: (row) => row.machine_type_name || row.machine_type || (row as any).machine_category || '',
      render: (row) => (
        <span className="text-t-body whitespace-nowrap">
          {row.machine_type_name || row.machine_type || (row as any).machine_category || '—'}
        </span>
      ),
    },
    // 10. Machine ID
    {
      key: 'machine_no',
      header: 'Machine ID',
      sortable: true,
      sortValue: (row) => row.machine_no || (row as any).machine_name || String(row.machine_id || ''),
      render: (row) => (
        <span className="text-t-body font-medium whitespace-nowrap">
          {row.machine_no || (row as any).machine_name || (row.machine_id ? `MC-${row.machine_id}` : '—')}
        </span>
      ),
    },
    // 11. Operation
    {
      key: 'operation_name',
      header: 'Operation',
      sortable: true,
      sortValue: (row) => getNameOrDash(row.operation_name, row.operation_id, (row as any).operation),
      render: (row) => (
        <span className="text-t-body font-medium whitespace-nowrap">
          {getNameOrDash(row.operation_name, row.operation_id, (row as any).operation)}
        </span>
      ),
    },
    // 12. Defect Category
    {
      key: 'category_name',
      header: 'Defect Category',
      sortable: true,
      sortValue: (row) => getNameOrDash(row.category_name, row.category_id, (row as any).category),
      render: (row) => (
        <span className="text-t-body whitespace-nowrap">
          {getNameOrDash(row.category_name, row.category_id, (row as any).category)}
        </span>
      ),
    },
    // 13. Severity
    {
      key: 'severity_name',
      header: 'Severity',
      sortable: true,
      sortValue: (row) => getNameOrDash(row.severity_name, row.severity_id, (row as any).severity),
      render: (row) => (
        <span className="text-t-body font-medium whitespace-nowrap">
          {getNameOrDash(row.severity_name, row.severity_id, (row as any).severity)}
        </span>
      ),
    },
    // 14. Defect Found
    {
      key: 'defect_name',
      header: 'Defect Found',
      sortable: true,
      sortValue: (row) => getNameOrDash(row.defect_name, row.defect_id, (row as any).defect),
      render: (row) => (
        <span className="text-t-primary font-medium whitespace-nowrap">
          {getNameOrDash(row.defect_name, row.defect_id, (row as any).defect)}
        </span>
      ),
    },
    // 15. Size
    // {
    //   key: 'size',
    //   header: 'Size',
    //   sortable: true,
    //   sortValue: (row) => row.size || (row as any).size_name || '',
    //   render: (row) => (
    //     <span className="text-t-body text-center whitespace-nowrap">
    //       {row.size || (row as any).size_name || '—'}
    //     </span>
    //   ),
    // },
    // 16. Defect Qty
    {
      key: 'defect_qty',
      header: 'Defect Qty',
      sortable: true,
      sortValue: (row) => row.qty ?? row.defect_qty ?? '',
      render: (row) => (
        <span className="text-t-primary font-bold text-center whitespace-nowrap">
          {row.qty !== undefined && row.qty !== null ? String(row.qty) : row.defect_qty !== undefined && row.defect_qty !== null ? String(row.defect_qty) : '—'}
        </span>
      ),
    },
    // 17. TLS Status
    {
      key: 'tls_status_color',
      header: 'TLS Status',
      sortable: true,
      sortValue: (row) => row.tls_status_color || row.tls_status_hexcode || row.present_color || '',
      render: (row) => (
        <StatusColorBadge
          color={row.tls_status_color || row.present_color}
          hex={row.tls_status_hexcode || (row.tls_status_color?.startsWith('#') ? row.tls_status_color : undefined) || row.hex_code}
          label={row.tls_status_color}
        />
      ),
    },
    // 18. Line QC name   
    {
      key: 'line_qc_name',
      header: 'Line QC name',
      sortable: true,
      sortValue: (row) => row.qc_emp_name || row.line_qc_name || '',
      render: (row) => (
        <span className="text-t-body whitespace-nowrap">
          {row.qc_emp_name || row.line_qc_name || '—'}
        </span>
      ),
    },
    // 19. Line QC ID
    {
      key: 'line_qc_id',
      header: 'Line QC ID',
      sortable: true,
      sortValue: (row) => row.qc_emp_code || row.line_qc_id || '',
      render: (row) => (
        <span className="font-mono text-xs text-t-secondary whitespace-nowrap">
          {row.qc_emp_code || row.line_qc_id || '—'}
        </span>
      ),
    },
    // 20. Audit Time
    {
      key: 'audit_time',
      header: 'Audit Time',
      sortable: true,
      sortValue: (row) => row.work_audit_at || row.scan_time || row.created_at || '',
      render: (row) => (
        <span className="text-t-body text-xs whitespace-nowrap">
          {formatDateTime(row.work_audit_at || row.scan_time || row.created_at)}
        </span>
      ),
    },
    // 21. Issue assigned - Work category
    {
      key: 'work_cat_id',
      header: 'Issue assigned - Work category',
      sortable: true,
      sortValue: (row) => row.workcategory_name || row.work_cat_name || String(row.work_cat_id || ''),
      render: (row) => (
        <span className="text-t-body whitespace-nowrap">
          {row.workcategory_name || row.work_cat_name || (row as any).work_category || (row.work_cat_id ? String(row.work_cat_id) : '—')}
        </span>
      ),
    },
    // 22. Work Category - Employee ID
    {
      key: 'work_cat_emp_id',
      header: 'Work Category - Employee ID',
      sortable: true,
      sortValue: (row) => row.work_category_empcode || row.work_cat_emp_id || '',
      render: (row) => (
        <span className="font-mono text-xs text-t-secondary whitespace-nowrap">
          {row.work_category_empcode || row.work_cat_emp_id || '—'}
        </span>
      ),
    },
    // 23. Work Category - Employee Name
    {
      key: 'work_cat_emp_name',
      header: 'Work Category - Employee Name',
      sortable: true,
      sortValue: (row) => row.work_category_empname || row.work_cat_emp_name || '',
      render: (row) => (
        <span className="text-t-body whitespace-nowrap">
          {row.work_category_empname || row.work_cat_emp_name || '—'}
        </span>
      ),
    },
    // 24. Elapsed Time in Minutes
    {
      key: 'elapsed_time',
      header: 'Elapsed Time in Minutes',
      sortable: true,
      sortValue: (row) => row.elapsed_time ?? 0,
      render: (row) => (
        <span className="text-t-body font-mono text-xs text-center whitespace-nowrap">
          {row.elapsed_time !== undefined && row.elapsed_time !== null ? `${row.elapsed_time} min` : '—'}
        </span>
      ),
    },
    // 25. Pre Defined CAP
    {
      key: 'cap',
      header: 'Pre Defined CAP',
      render: (row) => {
        const items = parseCapItems(row.cap)
        if (items.length === 0) return <span className="text-t-muted">—</span>
        const first = items[0]
        const remaining = items.length - 1
        return (
          <div className="flex items-center gap-1.5 max-w-[220px]">
            <span className="text-xs text-t-body truncate" title={first}>
              {first}
            </span>
            {remaining > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  openCapModal('Pre Defined CAP', items)
                }}
                className="shrink-0 px-1.5 py-0.5 text-[11px] font-bold rounded-md bg-[#0d939d]/10 text-[#0d939d] hover:bg-[#0d939d] hover:text-white transition-colors cursor-pointer border border-[#0d939d]/30"
                title={`Click to view all ${items.length} items`}
              >
                +{remaining}
              </button>
            )}
          </div>
        )
      },
    },
    // 26. Corrective action taken
    {
      key: 'selected_cap',
      header: 'Corrective action taken',
      render: (row) => {
        const items = parseCapItems(row.selected_cap)
        if (items.length === 0) return <span className="text-t-muted">—</span>
        const first = items[0]
        const remaining = items.length - 1
        return (
          <div className="flex items-center gap-1.5 max-w-[220px]">
            <span className="text-xs text-t-body truncate" title={first}>
              {first}
            </span>
            {remaining > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  openCapModal('Corrective Action Taken', items)
                }}
                className="shrink-0 px-1.5 py-0.5 text-[11px] font-bold rounded-md bg-[#0d939d]/10 text-[#0d939d] hover:bg-[#0d939d] hover:text-white transition-colors cursor-pointer border border-[#0d939d]/30"
                title={`Click to view all ${items.length} items`}
              >
                +{remaining}
              </button>
            )}
          </div>
        )
      },
    },
    // 27. Notes
    {
      key: 'comments',
      header: 'Notes',
      sortable: true,
      sortValue: (row) => row.comments || row.reason_for_closure || row.notes || '',
      render: (row) => {
        const text = row.comments || row.reason_for_closure || row.notes || ''
        return (
          <span className="text-t-secondary text-xs max-w-[150px] truncate block" title={text}>
            {text || '—'}
          </span>
        )
      },
    },
    // 28. CAP Status (ISSUE)
    {
      key: 'issue_status',
      header: 'CAP Status (ISSUE)',
      sortable: true,
      sortValue: (row) => row.issue_status || '',
      render: (row) => (
        <StatusColorBadge
          color={row.issue_color}
          label={row.issue_status}
          fallback="Pending"
        />
      ),
    },
    // 29. QC review
    {
      key: 'qc_status',
      header: 'QC review',
      sortable: true,
      sortValue: (row) => row.qc_status || '',
      render: (row) => (
        <StatusColorBadge
          color={row.qc_color}
          label={row.qc_status}
          fallback="Pending"
        />
      ),
    },
    // 30. Updated TLS Status
    {
      key: 'update_tls_status_color',
      header: 'Updated TLS Status',
      sortable: true,
      sortValue: (row) => row.update_tls_status_color || row.update_tls_status_hexcode || '',
      render: (row) => (
        <StatusColorBadge
          color={row.update_tls_status_color}
          hex={row.update_tls_status_hexcode || (row.update_tls_status_color?.startsWith('#') ? row.update_tls_status_color : undefined)}
          label={row.update_tls_status_color}
          fallback="Pending Review"
        />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-card border border-table-line rounded-xl p-3.5 flex items-center justify-between shadow-xs" style={{ borderTop: '4px solid #006a71' }}>
          <div>
            <p className="text-xs text-t-secondary font-medium">Total TLS Issues</p>
            <p className="text-xl font-bold text-t-primary mt-0.5">{stats.total}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <AlertCircle size={18} />
          </div>
        </div>

        <div className="bg-card border border-table-line rounded-xl p-3.5 flex items-center justify-between shadow-xs" style={{ borderTop: '4px solid #006a71' }}>
          <div>
            <p className="text-xs text-t-secondary font-medium">CAP Closed</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.capClosed}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-card border border-table-line rounded-xl p-3.5 flex items-center justify-between shadow-xs" style={{ borderTop: '4px solid #006a71' }}>
          <div>
            <p className="text-xs text-t-secondary font-medium">CAP Pending</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{stats.capPending}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-card border border-table-line rounded-xl p-3.5 flex items-center justify-between shadow-xs" style={{ borderTop: '4px solid #006a71' }}>
          <div>
            <p className="text-xs text-t-secondary font-medium">QC Pass</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.qcPass}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-card border border-table-line rounded-xl p-3.5 flex items-center justify-between shadow-xs" style={{ borderTop: '4px solid #006a71' }}>
          <div>
            <p className="text-xs text-t-secondary font-medium">QC Fail</p>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{stats.qcFail}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <XCircle size={18} />
          </div>
        </div>
      </div>

      <AdvancedTable<TlsIssueRecord>
        columns={columns}
        data={records}
        loading={loading}
        rowKey={(r) => String(r.id)}
        header={
          <Toolbar
            title="TLS Control Center"
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by Line, Order, Machine, Defect..."
          >
            {liveSyncing && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20 animate-pulse shrink-0">
                <Loader2 size={12} className="animate-spin text-brand" /> Live Records...
              </span>
            )}

            {/* Branch Filter Dropdown */}
            <select
              value={branchFilter}
              onChange={(e) => onBranchFilterChange(e.target.value)}
              className="h-8.5 px-3 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20 w-36 sm:w-40 shrink-0"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.branch_name}
                </option>
              ))}
            </select>

            {/* Shift Filter Dropdown */}
            <select
              value={shiftFilter}
              onChange={(e) => onShiftFilterChange(e.target.value)}
              className="h-8.5 px-3 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20 w-32 sm:w-36 shrink-0"
            >
              <option value="">All Shifts</option>
              {shifts.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.shift_name}
                </option>
              ))}
            </select>

            {/* Team Filter Dropdown */}
            <select
              value={teamFilter}
              onChange={(e) => onTeamFilterChange(e.target.value)}
              className="h-8.5 px-3 text-xs font-medium cursor-pointer text-t-secondary bg-card border border-input-line hover:border-accent/50 rounded-lg outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/20 w-36 sm:w-40 shrink-0"
            >
              <option value="">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.team_name || t.name || `Team ${t.id}`}
                </option>
              ))}
            </select>
          </Toolbar>
        }
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        emptyMessage="No TLS issues found"
        countLabel="issue"
        countLabelPlural="issues"
        tealHeader
      />

      {/* CAP Items Details Modal */}
      {capModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-input-line overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Modal Header with #0d939d */}
            <div className="bg-[#0d939d] px-5 py-3.5 flex items-center justify-between text-white shadow-xs">
              <h3 className="text-sm font-bold tracking-wide">{capModal.title}</h3>
              <button
                type="button"
                onClick={closeCapModal}
                className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: List of CAP items */}
            <div className="p-5 overflow-y-auto space-y-2 flex-1">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-table-line">
                <span className="text-xs font-semibold text-t-secondary uppercase tracking-wider">Assigned Items</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#0d939d]/10 text-[#0d939d]">
                  {capModal.items.length} {capModal.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="space-y-2">
                {capModal.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-card-alt border border-table-line/60 text-xs text-t-primary"
                  >
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#0d939d]/15 text-[#0d939d] font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-medium pt-0.5 leading-relaxed break-words flex-1">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer with #0d939d Close Button */}
            <div className="px-5 py-3 bg-card-alt border-t border-table-line flex justify-end">
              <button
                type="button"
                onClick={closeCapModal}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0d939d] hover:bg-[#0b828b] rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
