'use client'

import { useState, useMemo, useEffect } from 'react'
import IconButton from '@/components/ui/IconButton'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Tabs from '@/components/ui/Tabs'
import { Search, Plus, Pencil, Trash2, QrCode, Download, ArrowRight, MoreVertical, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react'
import { conditionLabel, downloadQrCode } from './types'
import type { MachineTypeGroup, MachineTypeItem, MachineSpec, SpecPagination, SpecCounts } from './types'
import { formatDate } from '@/lib/formatDate'
import { apiCall } from '@/services/apiClient'
import { useBranchAccess } from '@/hooks/useBranchAccess'

interface ConditionOption {
  id: number
  value: string
}

interface Props {
  // Left panel
  groups: MachineTypeGroup[]
  typesLoading: boolean
  searchType: string
  onSearchTypeChange: (val: string) => void
  selectedId: number | null
  onSelectType: (id: number) => void
  branchFilter?: string
  onBranchFilterChange?: (val: string) => void
  branches?: Array<{ id: number; branch_name: string }>
  isAdmin?: boolean
  effectiveBranchId?: string

  // Right panel — type header
  selected: MachineTypeItem | null
  onEditType: (type: MachineTypeItem) => void
  onDeleteType: (type: MachineTypeItem) => void

  // Right panel — spec sub-tab
  subTab: 'Machine Specification' | 'Operation Master'
  onSubTabChange: (tab: 'Machine Specification' | 'Operation Master') => void

  // Right panel — specs
  specs: MachineSpec[]
  specsLoading: boolean
  onAddSpec: () => void
  onViewSpec: (uuid: string) => void
  onEditSpec: (spec: MachineSpec) => void
  onDeleteSpec: (spec: MachineSpec) => void

  // Spec row context menu
  openMenuId: number | null
  menuPos: { top: number; right: number }
  onOpenSpecMenu: (e: React.MouseEvent<HTMLButtonElement>, id: number) => void
  onCloseMenu: () => void

  // Server-side filter & pagination props
  searchSpec: string
  onSearchSpecChange: (val: string) => void
  statusFilter: string
  onStatusFilterChange: (val: string) => void
  conditionFilter: string
  onConditionFilterChange: (val: string) => void
  page: number
  onPageChange: (page: number) => void
  perPage: number
  onPerPageChange: (val: number) => void
  pagination: SpecPagination | null
  counts: SpecCounts | null
  canMachineList?: boolean
  canEditType?: boolean
  canDeleteType?: boolean
  canSpecList?: boolean
  canCreateSpec?: boolean
  canEditSpec?: boolean
  canDeleteSpec?: boolean
}

export default function MachineHubList({
  groups, typesLoading, searchType, onSearchTypeChange, selectedId, onSelectType,
  branchFilter = '', onBranchFilterChange = () => { }, branches = [], isAdmin = false, effectiveBranchId = '',
  selected, onEditType, onDeleteType,
  subTab, onSubTabChange,
  specs, specsLoading, onAddSpec, onViewSpec, onEditSpec, onDeleteSpec,
  openMenuId, menuPos, onOpenSpecMenu, onCloseMenu,
  searchSpec, onSearchSpecChange,
  statusFilter, onStatusFilterChange,
  conditionFilter, onConditionFilterChange,
  page, onPageChange,
  perPage, onPerPageChange,
  pagination, counts,
  canMachineList = false,
  canEditType = false,
  canDeleteType = false,
  canSpecList = false,
  canCreateSpec = false,
  canEditSpec = false,
  canDeleteSpec = false,
}: Props) {
  const { branchId: userBranchId, user } = useBranchAccess()
  const [conditionOpen, setConditionOpen] = useState(false)
  const [conditionOptions, setConditionOptions] = useState<ConditionOption[]>([])
  const [previewQr, setPreviewQr] = useState<{ imgSrc: string; code: string; fileName: string } | null>(null)

  const currentBranchId = effectiveBranchId || branchFilter || (userBranchId ? String(userBranchId) : '')
  const userBranchName = (user as any)?.branch_name ?? ''

  // Fetch condition options from API
  useEffect(() => {
    const payload: Record<string, unknown> = { type: 'machine_condition' }
    if (effectiveBranchId) payload.branch_id = effectiveBranchId
    apiCall<any>('/dropdown/options-dropdown', {
      method: 'GET',
      encrypt: false,
      payload,
    })
      .then(res => {
        const records = res?.data?.records?.machine_condition ?? []
        setConditionOptions(Array.isArray(records) ? records : [])
      })
      .catch(() => setConditionOptions([]))
  }, [effectiveBranchId])

  const handleSelectType = (id: number) => {
    onSelectType(id)
  }

  return (
    <>
      <div className="flex gap-0 flex-1 min-h-0">

        {/* Left: grouped machine type list */}
        {canMachineList && (
          <div className="w-[270px] shrink-0 bg-card rounded-l-lg border border-header-line flex flex-col overflow-hidden">
            <div className="px-3 py-2.5 border-b border-table-line shrink-0 flex flex-col gap-2">
              <select
                value={currentBranchId}
                onChange={e => onBranchFilterChange(e.target.value)}
                disabled={!isAdmin}
                className="w-full h-7 px-2 text-xs bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-secondary cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isAdmin && <option value="">Select Branch</option>}
                {!isAdmin && currentBranchId && !branches.some(b => String(b.id) === String(currentBranchId)) && (
                  <option value={String(currentBranchId)}>
                    {userBranchName || `Branch ${currentBranchId}`}
                  </option>
                )}
                {branches.map(b => (
                  <option key={b.id} value={String(b.id)}>
                    {b.branch_name}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-t-lighter pointer-events-none" />
                <input
                  placeholder="Search type"
                  value={searchType}
                  onChange={e => onSearchTypeChange(e.target.value)}
                  className="w-full h-[30px] pl-[26px] pr-2 text-xs font-inherit text-t-secondary bg-table-head border border-header-line rounded-input outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {typesLoading ? (
                <div className="flex flex-col gap-0">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="px-3.5 py-3 border-b border-table-line">
                      <div className="h-3 w-24 bg-table-head rounded animate-pulse mb-1.5" />
                      <div className="h-2.5 w-16 bg-table-head rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : !effectiveBranchId ? (
                <p className="text-xs text-t-lighter text-center py-8">Select a branch to view machine types</p>
              ) : groups.length === 0 ? (
                <p className="text-xs text-t-lighter text-center py-8">No machine types found</p>
              ) : (
                groups.map(group => (
                  <div key={group.variant}>
                    {/* Group header */}
                    <div className="px-3.5 py-2 border-b border-table-line bg-table-head sticky top-0 z-10 flex items-center justify-between gap-2">
                      <p className="m-0 text-xs font-bold text-t-secondary">{group.variant}</p>
                      <p className="m-0 text-xs2 text-t-lighter shrink-0">
                        {group.variant_count} variants | {group.total_machine_count} machines
                      </p>
                    </div>
                    {/* Individual type items */}
                    {group.data.map(t => (
                      <div
                        key={t.id}
                        onClick={() => handleSelectType(t.id)}
                        className={`pl-5 pr-3.5 py-2.5 cursor-pointer border-b border-table-line flex justify-between items-center border-l-2 transition-colors
                        ${t.is_active === 0
                            ? (selectedId === t.id ? 'bg-red-100/70 border-l-accent' : 'bg-red-50 hover:bg-red-100/70 border-l-transparent')
                            : (selectedId === t.id ? 'bg-accent/5 border-l-accent' : 'bg-card hover:bg-card-alt border-l-transparent')}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className={`m-0 text-sm truncate ${selectedId === t.id ? 'font-semibold text-accent' : 'font-medium text-t-secondary'}`}>
                            {t.type_name}
                          </p>
                          {t.name && (
                            <p className="m-0 text-xs2 text-accent/70 truncate">{t.name}</p>
                          )}
                        </div>
                        <span className="shrink-0 ml-2 min-w-[20px] text-center text-xs2 font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
                          {t.machine_count}
                        </span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Right: detail panel */}
        <div className="flex-1 min-w-0 border border-header-line border-l-0 rounded-r-lg bg-card flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-t-lighter text-sm">
              {typesLoading ? 'Loading...' : !effectiveBranchId ? 'Select a branch to view machine types' : 'Select a machine type'}
            </div>
          ) : (
            <>
              {/* Type header */}
              <div className="px-4 py-3.5 border-b border-table-line shrink-0">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {selected.needle && (
                      <span className="mt-0.5 text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded shrink-0">
                        {selected.name ? selected.name.slice(0, 2).toUpperCase() : ''}-{selected.needle}
                        {/^\d+$/.test(selected.needle) ? 'T' : ''}
                      </span>
                    )}
                    <div>
                      <p className="m-0 text-sm font-bold text-t-primary">{selected.type_name}</p>
                      {selected.notes && (
                        <p className="m-0 text-xs text-t-lighter mt-0.5">{selected.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {canEditType && (
                      <Button variant="outline" size="sm" onClick={() => onEditType(selected)}>
                        <Pencil size={12} /> Edit
                      </Button>
                    )}
                    {canDeleteType && (
                      <Button variant="danger" size="sm" onClick={() => onDeleteType(selected)}>
                        <Trash2 size={12} /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Stat cards — each acts as a status filter */}
              <div className="px-4 py-3 border-b border-table-line shrink-0 grid grid-cols-4 gap-3">
                {([
                  {
                    label: 'Machines', filter: 'all',
                    value: specsLoading ? null : (counts?.total ?? 0),
                    numColor: 'text-accent',
                    activeStyle: 'border-accent bg-accent/10',
                    idleStyle: 'border-table-line bg-card-alt hover:border-accent/50 hover:bg-accent/5',
                  },
                  {
                    label: 'Active', filter: 'active',
                    value: specsLoading ? null : (counts?.active ?? 0),
                    numColor: 'text-emerald-600 dark:text-emerald-400',
                    activeStyle: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
                    idleStyle: 'border-table-line bg-card-alt hover:border-emerald-400/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20',
                  },
                  {
                    label: 'Inactive', filter: 'inactive',
                    value: specsLoading ? null : (counts?.inactive ?? 0),
                    numColor: 'text-slate-500 dark:text-slate-400',
                    activeStyle: 'border-slate-400 bg-slate-100 dark:bg-slate-800/30',
                    idleStyle: 'border-table-line bg-card-alt hover:border-slate-400/60 hover:bg-slate-50 dark:hover:bg-slate-800/20',
                  },
                  {
                    label: 'In Maintenance', filter: 'maintenance',
                    value: specsLoading ? null : (counts?.inmaintenance ?? 0),
                    numColor: 'text-amber-600 dark:text-amber-400',
                    activeStyle: 'border-amber-500 bg-amber-50 dark:bg-amber-950/30',
                    idleStyle: 'border-table-line bg-card-alt hover:border-amber-400/60 hover:bg-amber-50/50 dark:hover:bg-amber-950/20',
                  },
                ] as const).map(card => {
                  const isActive = statusFilter === card.filter
                  return (
                    <button
                      key={card.label}
                      onClick={() => {
                        const next = isActive && card.filter !== 'all' ? 'all' : card.filter
                        onStatusFilterChange(next)
                        onPageChange(1)
                      }}
                      title={isActive && card.filter !== 'all' ? 'Click to clear filter' : `Filter by ${card.label}`}
                      className={`flex flex-col gap-0.5 px-4 py-3 rounded-lg border-2 text-left w-full cursor-pointer transition-all ${isActive ? card.activeStyle + ' shadow-sm' : card.idleStyle
                        }`}
                    >
                      <p className="m-0 text-xs text-t-lighter font-medium">{card.label}</p>
                      <p className={`m-0 text-xl font-bold ${isActive ? card.numColor : 'text-t-primary'}`}>
                        {card.value === null ? '--' : card.value}
                      </p>
                      {isActive && (
                        <span className={`text-xs2 font-semibold ${card.numColor}`}>● Filtering</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center justify-between px-4 shrink-0">
                <Tabs
                  tabs={[
                    ...(canSpecList ? ['Machine Specification'] : []),
                    'Operation Master'
                  ]}
                  active={subTab}
                  onChange={tab => onSubTabChange(tab as 'Machine Specification' | 'Operation Master')}
                />
                {subTab === 'Machine Specification' && canCreateSpec && (
                  <Button variant="primary" size="sm" onClick={onAddSpec}>
                    <Plus size={12} /> Add New
                  </Button>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {subTab === 'Machine Specification' ? (
                  <>
                    {/* Search + Condition filter bar */}
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-table-line bg-table-head sticky top-0 z-10">
                      {/* Common search */}
                      <div className="relative flex-1 min-w-[160px] max-w-xs">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t-lighter" />
                        <input
                          placeholder="Search machine, brand, serial…"
                          value={searchSpec}
                          onChange={e => {
                            onSearchSpecChange(e.target.value)
                            onPageChange(1)
                          }}
                          className="w-full h-[30px] pl-[26px] pr-2 text-xs font-inherit text-t-secondary bg-card border border-header-line rounded-input outline-none focus:border-accent"
                        />
                      </div>
                      {/* Condition dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setConditionOpen(o => !o)}
                          className="flex items-center gap-1.5 h-[30px] px-3 text-xs text-t-secondary bg-card border border-header-line rounded-input hover:border-accent transition-colors min-w-[130px]"
                        >
                          <span className="text-t-lighter">Condition:</span>
                          <span className="font-medium flex-1 text-left">
                            {conditionFilter
                              ? conditionOptions.find(o => String(o.id) === conditionFilter)?.value ?? 'All'
                              : 'All'}
                          </span>
                          <ChevronDown size={11} className={`transition-transform ${conditionOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {conditionOpen && (
                          <>
                            <div className="fixed inset-0 z-[100]" onClick={() => setConditionOpen(false)} />
                            <div className="absolute top-full left-0 mt-1 z-[101] bg-modal border border-table-line rounded-card shadow-lg py-1 min-w-[130px]">
                              <button
                                onClick={() => {
                                  onConditionFilterChange('')
                                  onPageChange(1)
                                  setConditionOpen(false)
                                }}
                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-card-alt transition-colors ${!conditionFilter ? 'font-semibold text-accent' : 'text-t-body'}`}
                              >All</button>
                              {conditionOptions.length === 0 ? (
                                <p className="px-3 py-1.5 text-xs text-t-lighter">Loading…</p>
                              ) : (
                                conditionOptions.map(opt => (
                                  <button
                                    key={opt.id}
                                    onClick={() => {
                                      onConditionFilterChange(String(opt.id))
                                      onPageChange(1)
                                      setConditionOpen(false)
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-card-alt transition-colors ${conditionFilter === String(opt.id) ? 'font-semibold text-accent' : 'text-t-body'}`}
                                  >{opt.value}</button>
                                ))
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {/* Clear filters */}
                      {(statusFilter !== 'all' || searchSpec || conditionFilter) && (
                        <button
                          onClick={() => {
                            onStatusFilterChange('all')
                            onSearchSpecChange('')
                            onConditionFilterChange('')
                            onPageChange(1)
                          }}
                          className="text-xs text-accent hover:underline shrink-0"
                        >Clear filters</button>
                      )}
                      <span className="ml-auto text-xs2 text-t-lighter shrink-0">
                        {pagination ? `Total: ${pagination.total}` : `${specs.length} machines`}
                      </span>
                    </div>

                    {specsLoading ? (
                      <div className="p-6 text-center text-t-lighter text-sm flex-1">Loading...</div>
                    ) : specs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 gap-2 text-t-lighter text-sm flex-1">
                        <span>No machines match the current filters</span>
                        <button
                          onClick={() => {
                            onStatusFilterChange('all')
                            onSearchSpecChange('')
                            onConditionFilterChange('')
                            onPageChange(1)
                          }}
                          className="text-xs text-accent hover:underline"
                        >Clear filters</button>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto">
                        <table className="w-full border-collapse text-sm2">
                          <thead>
                            <tr className="bg-table-head">
                              {['M - No.', 'Brand', 'Model No', 'Serial No', 'Condition', 'Next Maint.', 'Branch', 'Status', 'QR Code', 'action'].map(
                                (h) => (
                                  <th
                                    key={h}
                                    className="px-3.5 py-2.5 text-left font-semibold text-xs text-t-light border-b border-header-line whitespace-nowrap"
                                  >
                                    {h}
                                  </th>
                                )
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {specs.map((spec, i) => (
                              <tr
                                key={spec.uuid}
                                className={`border-b border-table-line ${i % 2 === 0 ? 'bg-card' : 'bg-card-alt'}`}
                              >
                                <td className="px-3.5 py-2.5 text-accent font-semibold">{spec.machine_no}</td>
                                <td className="px-3.5 py-2.5 text-t-body">{spec.brand || '—'}</td>
                                <td className="px-3.5 py-2.5 text-t-body text-xs">{spec.model_no || '—'}</td>
                                <td className="px-3.5 py-2.5 text-t-body text-xs">{spec.serial_no || '—'}</td>
                                <td className="px-3.5 py-2.5 text-t-body">
                                  {spec.conditionInfo?.value ?? conditionLabel(String(spec.condition))}
                                </td>
                                <td className="px-3.5 py-2.5 text-t-body text-xs">{formatDate(spec.next_maintenance)}</td>
                                <td className="px-3.5 py-2.5 text-t-body text-xs">{spec.branch?.branch_name ?? '—'}</td>
                                <td className="px-3.5 py-2.5">
                                  <Badge variant={spec.is_active === 1 ? 'success' : 'default'}>
                                    {spec.is_active === 1 ? 'Active' : 'Inactive'}
                                  </Badge>
                                </td>
                                <td className="px-3.5 py-2.5">
                                   {spec.qr_code ? (
                                     (() => {
                                       const qrVal = spec.qr_code
                                       const imgSrc = qrVal.startsWith('data:image/')
                                         ? qrVal
                                         : `data:image/png;base64,${qrVal}`
                                       const fileName = `Machine_${spec.machine_no}_qrcode.png`
                                       return (
                                         <div className="flex items-center gap-2">
                                           <img
                                             src={imgSrc}
                                             alt="QR Code"
                                             className="w-8 h-8 rounded border border-input-line object-cover cursor-pointer bg-white hover:scale-110 transition-transform p-0.5"
                                             onClick={() => {
                                               setPreviewQr({
                                                 imgSrc,
                                                 code: String(spec.machine_no || 'Machine'),
                                                 fileName,
                                               })
                                             }}
                                             title="Click to view QR code"
                                           />
                                           <button
                                             type="button"
                                             onClick={() => downloadQrCode(qrVal, fileName)}
                                             className="p-1 text-t-lighter hover:text-accent rounded transition-colors"
                                             title="Download QR Code"
                                           >
                                             <Download size={14} />
                                           </button>
                                         </div>
                                       )
                                     })()
                                   ) : (
                                    <span className="text-t-lighter text-xs">—</span>
                                  )}
                                </td>
                                <td className="px-3.5 py-2.5">
                                  <div className="flex items-center gap-1">
                                    {canSpecList && (
                                      <IconButton
                                        variant="accent"
                                        title="View"
                                        onClick={() => onViewSpec(spec.uuid)}
                                      >
                                        <ArrowRight size={13} />
                                      </IconButton>
                                    )}
                                    {(canEditSpec || canDeleteSpec) && (
                                      <IconButton
                                        variant="default"
                                        onClick={e => onOpenSpecMenu(e, spec.id)}
                                      >
                                        <MoreVertical size={13} />
                                      </IconButton>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {pagination && pagination.total > 0 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-table-line bg-card shrink-0">
                        <div className="flex items-center gap-4 text-xs text-t-lighter font-medium">
                          <span>
                            Showing {pagination.total === 0 ? 0 : (pagination.current_page - 1) * pagination.per_page + 1}-
                            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                            {pagination.total} machines
                          </span>
                          <div className="flex items-center gap-1.5 ml-2">
                            <span>Per page:</span>
                            <select
                              value={perPage}
                              onChange={e => {
                                onPerPageChange(Number(e.target.value))
                                onPageChange(1)
                              }}
                              className="h-[30px] px-2 text-xs text-t-secondary bg-card border border-header-line rounded outline-none cursor-pointer focus:border-accent"
                            >
                              {[10, 20, 30, 50, 100].map(size => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            disabled={page <= 1}
                            onClick={() => onPageChange(1)}
                            className="h-[30px] w-[30px] flex items-center justify-center rounded border border-header-line bg-card hover:border-accent disabled:opacity-40 disabled:hover:border-header-line disabled:cursor-not-allowed text-t-secondary hover:text-accent transition-colors"
                            title="First Page"
                          >
                            <ChevronsLeft size={14} />
                          </button>
                          <button
                            disabled={!pagination.has_prev}
                            onClick={() => onPageChange(page - 1)}
                            className="h-[30px] w-[30px] flex items-center justify-center rounded border border-header-line bg-card hover:border-accent disabled:opacity-40 disabled:hover:border-header-line disabled:cursor-not-allowed text-t-secondary hover:text-accent transition-colors"
                            title="Previous Page"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          {Array.from({ length: pagination.total_pages }, (_, idx) => {
                            const pageNum = idx + 1
                            const isCurrent = pageNum === page
                            if (
                              pagination.total_pages > 6 &&
                              Math.abs(pageNum - page) > 1 &&
                              pageNum !== 1 &&
                              pageNum !== pagination.total_pages
                            ) {
                              if (pageNum === 2 || pageNum === pagination.total_pages - 1) {
                                return <span key={pageNum} className="px-1.5 text-t-lighter text-xs select-none">...</span>
                              }
                              return null
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`h-[30px] min-w-[30px] px-2.5 rounded text-xs font-semibold transition-colors border
                                    ${isCurrent
                                    ? 'bg-accent border-accent text-white'
                                    : 'bg-card border-header-line text-t-secondary hover:border-accent'}`}
                              >
                                {pageNum}
                              </button>
                            )
                          })}
                          <button
                            disabled={!pagination.has_next}
                            onClick={() => onPageChange(page + 1)}
                            className="h-[30px] w-[30px] flex items-center justify-center rounded border border-header-line bg-card hover:border-accent disabled:opacity-40 disabled:hover:border-header-line disabled:cursor-not-allowed text-t-secondary hover:text-accent transition-colors"
                            title="Next Page"
                          >
                            <ChevronRight size={14} />
                          </button>
                          <button
                            disabled={page >= pagination.total_pages}
                            onClick={() => onPageChange(pagination.total_pages)}
                            className="h-[30px] w-[30px] flex items-center justify-center rounded border border-header-line bg-card hover:border-accent disabled:opacity-40 disabled:hover:border-header-line disabled:cursor-not-allowed text-t-secondary hover:text-accent transition-colors"
                            title="Last Page"
                          >
                            <ChevronsRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-t-lighter text-sm flex-1">
                    Operation Master — coming soon
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fixed ⋮ dropdown for spec rows */}
      {openMenuId !== null && (
        <>
          <div className="fixed inset-0 z-[9990]" onClick={onCloseMenu} />
          <div
            className="fixed z-[9991] bg-modal border border-table-line rounded-card shadow-lg py-1 min-w-[130px]"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            {canEditSpec && (
              <Button
                variant="ghost"
                onClick={() => { const s = specs.find(x => x.id === openMenuId); if (s) onEditSpec(s); onCloseMenu() }}
                className="w-full justify-start px-3 py-1.5 text-xs text-t-body hover:bg-card-alt rounded-none h-auto"
              >
                <Pencil size={12} /> Edit
              </Button>
            )}
            {canDeleteSpec && (
              <Button
                variant="ghost"
                onClick={() => { const s = specs.find(x => x.id === openMenuId); if (s) onDeleteSpec(s); onCloseMenu() }}
                className="w-full justify-start px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-none h-auto"
              >
                <Trash2 size={12} /> Delete
              </Button>
            )}
          </div>
        </>
      )}

      {/* ── QR Code Preview Modal ── */}
      {previewQr && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-table-line rounded-card shadow-2xl max-w-sm w-full p-5 flex flex-col items-center gap-4 relative">
            <button
              type="button"
              onClick={() => setPreviewQr(null)}
              className="absolute top-3 right-3 text-t-muted hover:text-t-primary p-1 rounded-md transition-colors cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>

            <div className="text-center w-full border-b border-table-line pb-3">
              <h3 className="text-sm font-bold text-t-primary">QR Code Preview</h3>
              <p className="text-xs text-t-muted mt-0.5">{previewQr.code}</p>
            </div>

            <div className="bg-white p-4 border border-table-line rounded-xl shadow-inner flex items-center justify-center">
              <img
                src={previewQr.imgSrc}
                alt="QR Code Preview"
                className="w-56 h-56 object-contain"
              />
            </div>

            <div className="flex items-center justify-center w-full pt-1">
              <button
                type="button"
                onClick={() => setPreviewQr(null)}
                className="px-5 py-1.5 text-xs font-semibold text-t-secondary bg-card border border-input-line hover:bg-card-alt rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
