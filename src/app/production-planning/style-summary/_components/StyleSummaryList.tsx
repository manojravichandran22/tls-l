'use client'

import { useState } from 'react'
import { Eye } from 'lucide-react'
import Link from 'next/link'
import AdvancedTable, { type ActionItem } from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import type { StyleSummary } from './types'
import { usePermissions } from '@/hooks/usePermissions'
import { useExportPdf } from '@/hooks/useExportPdf'

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'buyer', label: 'Buyer' },
  { key: 'style_no', label: 'Style No.' },
  { key: 'style_name', label: 'Style Name' },
  { key: 'branch', label: 'Branch' },
  { key: 'total_sam', label: 'Total SAM' },
  { key: 'req_manning', label: 'Req Manning' },
  { key: 'allocated_manning', label: 'Alloc Manning' },
  { key: 'req_target_hun_hr', label: 'Req 100%/Hr' },
  { key: 'req_target_hun_day', label: 'Req 100%/Day' },
  { key: 'req_target_six_hr', label: 'Req 60%/Hr' },
  { key: 'req_target_six_day', label: 'Req 60%/Day' },
  { key: 'all_target_hun_hr', label: 'Alloc 100%/Hr' },
  { key: 'all_target_hun_day', label: 'Alloc 100%/Day' },
  { key: 'all_target_six_hr', label: 'Alloc 60%/Hr' },
  { key: 'all_target_six_day', label: 'Alloc 60%/Day' },
]

function formatExportHeadings(headings: string[]): string[] {
  const set = new Set<string>()
  headings.forEach((h) => {
    set.add(h)
    if (h === 'style_no') set.add('style_no')
    if (h === 'buyer') set.add('buyer')
    if (h === 'style_name') set.add('style_name')
    if (h === 'branch') set.add('branch_name')
    if (h === 'total_sam') {
      set.add('total_sam')
      set.add('sam')
      set.add('item_sam')
    }
    if (h === 'req_manning') {
      set.add('req_manning')
      set.add('item_req_manning')
    }
    if (h === 'allocated_manning') {
      set.add('allocated_manning')
      set.add('all_manning')
      set.add('item_all_manning')
    }
    if (h === 'req_target_hun_hr') {
      set.add('req_target_hun_hr')
      set.add('req_target_hun_hz')
      set.add('target_hun_hr')
      set.add('item_target_hun_hr')
    }
    if (h === 'all_target_hun_hr') {
      set.add('all_target_hun_hr')
      set.add('all_manning_target_hun_hr')
      set.add('item_all_manning_target_hun_hr')
    }
    if (h === 'req_target_hun_day') set.add('req_target_hun_day')
    if (h === 'req_target_six_hr') set.add('req_target_six_hr')
    if (h === 'req_target_six_day') set.add('req_target_six_day')
    if (h === 'all_target_hun_day') set.add('all_target_hun_day')
    if (h === 'all_target_six_hr') set.add('all_target_six_hr')
    if (h === 'all_target_six_day') set.add('all_target_six_day')
  })
  if (set.has('style_no') || set.size > 0) {
    set.add('seq_no')
    set.add('machine')
    set.add('operation')
    set.add('shift_hours')
    set.add('working_mins')
  }
  return Array.from(set)
}

interface BranchOption {
  id: number
  branch_name: string
}

interface Props {
  data: StyleSummary[]
  loading: boolean
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  search: string
  onSearchChange: (v: string) => void
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  onPageChange: (p: number) => void
  onPerPageChange: (n: number) => void
  onView: (uuid: string) => void
  isAdmin: boolean
  branches: BranchOption[]
  branchFilter: string
  onBranchFilterChange: (v: string) => void
  effectiveBranchId: string
  onExport?: (extraPayload?: Record<string, any>) => void
  exporting?: boolean
}

export default function StyleSummaryList({
  data, loading, search, onSearchChange,
  page, perPage, totalPages, totalCount, onPageChange, onPerPageChange, selected, onSelectionChange,
  onView,
  isAdmin, branches, branchFilter, onBranchFilterChange, effectiveBranchId,
  onExport, exporting = false,
}: Props) {
  const { can } = usePermissions('Operation-Bulletin')

  const canList = can('operationbuiltin.stylesummarylist')
  const canView = can('operationbuiltin.stylesummaryview')
  const canShow = can('operationbuiltin.stylesummaryshow')

  // Selected column headings state for export
  const [selectedHeadings, setSelectedHeadings] = useState<string[]>(
    HEADING_OPTIONS.map((h) => h.key)
  )

  const toggleHeading = (key: string) => {
    setSelectedHeadings((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const allHeadingsSelected = selectedHeadings.length === HEADING_OPTIONS.length
  const toggleAllHeadings = () => {
    setSelectedHeadings(allHeadingsSelected ? [] : HEADING_OPTIONS.map((h) => h.key))
  }

  const renderHeader = (key: string, label: string) => (
    <div
      className="inline-flex items-center gap-1.5 cursor-pointer select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={selectedHeadings.includes(key)}
        onChange={() => toggleHeading(key)}
        className="w-3.5 h-3.5 rounded accent-accent cursor-pointer"
        title={`Include ${label} in export`}
      />
      <span>{label}</span>
    </div>
  )

  const isFiltered = Boolean(search || branchFilter)
  const exportUuids = selected.length > 0 ? selected : (isFiltered ? data.map(r => r.uuid).filter(Boolean) : [])

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/operationbullatin/stylesummary',
    payload: {
      search: search ?? '',
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      ...(exportUuids.length > 0 ? { check_uuid: exportUuids } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'style_summary',
  })

  const getActions = (row: StyleSummary): ActionItem[] => [
    ...(canView
      ? [
        {
          label: 'View',
          icon: <Eye size={13} />,
          onClick: () => onView(row.uuid),
        },
      ]
      : []),
  ]

  const columns = [
    {
      key: '#',
      header: (
        <div
          className="inline-flex items-center gap-1.5 cursor-pointer select-none"
          title="Select all column headings for export"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={allHeadingsSelected}
            onChange={toggleAllHeadings}
            className="w-3.5 h-3.5 rounded accent-accent cursor-pointer"
          />
          <span>#</span>
        </div>
      ),
      sortable: false,
      render: (_row: StyleSummary, index: number) => (
        <span className="text-t-secondary">{(page - 1) * perPage + index + 1}</span>
      ),
    },
    {
      key: 'buyer',
      header: renderHeader('buyer', 'Buyer'),
      sortable: true,
      sortValue: (row: StyleSummary) => row.buyer ?? '',
      render: (row: StyleSummary) => <span className="font-medium text-t-body">{row.buyer}</span>,
    },
    {
      key: 'style_no',
      header: renderHeader('style_no', 'Style No.'),
      sortable: true,
      sortValue: (row: StyleSummary) => row.style_no ?? '',
      render: (row: StyleSummary) => <span className="font-mono text-t-secondary">{row.style_no}</span>,
    },
    {
      key: 'style_name',
      header: renderHeader('style_name', 'Style Name'),
      sortable: true,
      sortValue: (row: StyleSummary) => row.style_name ?? '',
      render: (row: StyleSummary) => (
        canShow ? (
          <Link
            href={`/production-planning/style-summary/${row.uuid}?style_id=${row.style_id}`}
            className="font-semibold text-accent hover:underline cursor-pointer"
          >
            {row.style_name}
          </Link>
        ) : (
          <span className="font-semibold text-t-primary">{row.style_name}</span>
        )
      ),
    },
    {
      key: 'branch',
      header: renderHeader('branch', 'Branch'),
      sortable: true,
      sortValue: (row: StyleSummary) => row.branch?.branch_name ?? '',
      render: (row: StyleSummary) => (
        <span className="text-t-body text-xs">{row.branch?.branch_name ?? '—'}</span>
      ),
    },
    {
      key: 'total_sam',
      header: renderHeader('total_sam', 'Total SAM'),
      sortable: true,
      sortValue: (row: StyleSummary) => row.total_sam ?? 0,
      className: 'text-right',
      render: (row: StyleSummary) => <span className="text-t-body">{fmt(row.total_sam)}</span>,
    },
    {
      key: 'req_manning',
      header: renderHeader('req_manning', 'Req Manning'),
      sortable: true,
      sortValue: (row: StyleSummary) => row.req_manning ?? 0,
      className: 'text-right',
      render: (row: StyleSummary) => <span className="text-t-body">{fmt(row.req_manning)}</span>,
    },
    {
      key: 'allocated_manning',
      header: renderHeader('allocated_manning', 'Alloc Manning'),
      sortable: true,
      sortValue: (row: StyleSummary) => row.allocated_manning ?? 0,
      className: 'text-right',
      render: (row: StyleSummary) => <span className="text-t-body">{fmt(row.allocated_manning)}</span>,
    },
    {
      key: 'req_target_hun_hr',
      header: renderHeader('req_target_hun_hr', 'Req 100%/Hr'),
      sortable: true,
      sortValue: (row: StyleSummary) => row.req_target_hun_hr ?? 0,
      className: 'text-right',
      render: (row: StyleSummary) => <span className="font-semibold text-accent">{fmt(row.req_target_hun_hr)}</span>,
    },
    {
      key: 'req_target_hun_day',
      header: renderHeader('req_target_hun_day', 'Req 100%/Day'),
      sortable: true,
      sortValue: (row: StyleSummary) => row.req_target_hun_day ?? 0,
      className: 'text-right',
      render: (row: StyleSummary) => <span className="text-t-body">{fmt(row.req_target_hun_day)}</span>,
    },
    {
      key: 'req_target_six_hr',
      header: renderHeader('req_target_six_hr', 'Req 60%/Hr'),
      sortable: true,
      sortValue: (row: StyleSummary) => row.req_target_six_hr ?? 0,
      className: 'text-right',
      render: (row: StyleSummary) => <span className="text-t-body">{fmt(row.req_target_six_hr)}</span>,
    },
    {
      key: 'req_target_six_day',
      header: renderHeader('req_target_six_day', 'Req 60%/Day'),
      sortable: true,
      sortValue: (row: StyleSummary) => row.req_target_six_day ?? 0,
      className: 'text-right',
      render: (row: StyleSummary) => <span className="text-t-body">{fmt(row.req_target_six_day)}</span>,
    },
    {
      key: 'all_target_hun_hr',
      header: renderHeader('all_target_hun_hr', 'Alloc 100%/Hr'),
      sortable: true,
      sortValue: (row: StyleSummary) => row.all_target_hun_hr ?? 0,
      className: 'text-right',
      render: (row: StyleSummary) => <span className="font-semibold text-accent">{fmt(row.all_target_hun_hr)}</span>,
    },
    {
      key: 'all_target_hun_day',
      header: renderHeader('all_target_hun_day', 'Alloc 100%/Day'),
      sortable: true,
      sortValue: (row: StyleSummary) => row.all_target_hun_day ?? 0,
      className: 'text-right',
      render: (row: StyleSummary) => <span className="text-t-body">{fmt(row.all_target_hun_day)}</span>,
    },
    {
      key: 'all_target_six_hr',
      header: renderHeader('all_target_six_hr', 'Alloc 60%/Hr'),
      sortable: true,
      sortValue: (row: StyleSummary) => row.all_target_six_hr ?? 0,
      className: 'text-right',
      render: (row: StyleSummary) => <span className="text-t-body">{fmt(row.all_target_six_hr)}</span>,
    },
    {
      key: 'all_target_six_day',
      header: renderHeader('all_target_six_day', 'Alloc 60%/Day'),
      sortable: true,
      sortValue: (row: StyleSummary) => row.all_target_six_day ?? 0,
      className: 'text-right',
      render: (row: StyleSummary) => <span className="text-t-body">{fmt(row.all_target_six_day)}</span>,
    },
  ]

  if (!canList) {
    return null
  }

  return (
    <>
      <AdvancedTable<StyleSummary>
        header={
          <Toolbar
            title="All Style Summaries"
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by buyer, style no. or name..."
            onExport={onExport ? () => onExport({
              search: search ?? '',
              ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
              ...(exportUuids.length > 0 ? { check_uuid: exportUuids } : {}),
              check_box_heading: formatExportHeadings(selectedHeadings),
            }) : undefined}
            exporting={exporting || exportingPdf}
            onExportPdf={handleExportPdf}
          >
            {isAdmin && (
              <select
                value={branchFilter}
                onChange={e => onBranchFilterChange(e.target.value)}
                className="h-8 px-2.5 text-xs bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-secondary cursor-pointer"
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
                ))}
              </select>
            )}
          </Toolbar>
        }
        columns={columns}
        rowKey={(row) => row.uuid}
        data={data}
        loading={loading}
        emptyMessage="No style summary records found."
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        actions={getActions}
        countLabel="style summary record"
        countLabelPlural="style summary records"
        selectable
        selected={selected}
        onSelectionChange={onSelectionChange}
      />
    </>
  )
}
