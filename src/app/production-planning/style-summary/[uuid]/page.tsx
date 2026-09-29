'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import Toast, { type ToastData } from '@/components/ui/Toast'
import { apiCall } from '@/services/apiClient'
import AdvancedTable from '@/components/ui/AdvancedTable'
import Toolbar from '@/components/ui/Toolbar'
import { ArrowLeft } from 'lucide-react'
import { PER_PAGE } from '@/lib/constants'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useExport } from '@/hooks/useExport'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'

// types based on the API response
interface Operation {
  id: number
  operation_name: string
  code: string
}

interface Machine {
  id: number
  type_name: string
  needle: string
  name: string
}

interface StyleSummaryShowItem {
  id: number
  seq_no: number
  sam: number
  all_manning: number
  target_hun_hr: number
  req_manning: number
  all_manning_target_hun_hr: number
  machine: Machine
  operation: Operation
}

interface PaginationInfo {
  total_records?: number
  total?: number
  current_page: number
  per_page: number
  total_pages: number
}

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'seq_no', label: 'Seq No.' },
  { key: 'operation', label: 'Operation' },
  { key: 'machine_type_name', label: 'Machine Type' },
  { key: 'sam', label: 'SAM' },
  { key: 'req_manning', label: 'Req Manning' },
  { key: 'allocated_manning', label: 'Alloc Manning' },
  { key: 'req_target_hun_hr', label: 'Target 100%/Hr' },
  { key: 'all_manning_target_hun_hr', label: 'Alloc 100%/Hr' },
]

function formatExportHeadings(headings: string[]): string[] {
  const set = new Set<string>()
  headings.forEach((h) => {
    set.add(h)
    if (h === 'seq_no') set.add('seq_no')
    if (h === 'operation') {
      set.add('operation')
      set.add('operation_code')
      set.add('operation_name')
    }
    if (h === 'machine_type_name') {
      set.add('machine_type_name')
      set.add('machine_type')
      set.add('machine')
    }
    if (h === 'sam') {
      set.add('sam')
      set.add('total_sam')
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
      set.add('target_hun_hr')
      set.add('item_target_hun_hr')
    }
    if (h === 'all_manning_target_hun_hr') {
      set.add('all_manning_target_hun_hr')
      set.add('all_target_hun_hr')
      set.add('item_all_manning_target_hun_hr')
    }
  })
  if (set.size > 0) {
    set.add('style_no')
    set.add('shift_hours')
    set.add('working_mins')
  }
  return Array.from(set)
}

export default function StyleSummaryShowPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const uuid = params.uuid as string
  const style_id = searchParams.get('style_id')

  const { can } = usePermissions('Operation-Bulletin')
  const canShow = can('operationbuiltin.stylesummaryshow')

  const { branchId, isAdmin } = useBranchAccess()
  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : ''

  const [data, setData] = useState<StyleSummaryShowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastData | null>(null)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)

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

  // Export PDF & Excel
  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/operationbullatin/stylesummaryshow',
    payload: {
      uuid: uuid ?? '',
      ...(style_id ? { style_id } : {}),
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'style_summary_details',
  })

  const { handleExport: handleExportExcel, exporting: exportingExcel } = useExport<StyleSummaryShowItem>({
    apiPath: '/operationbullatin/stylesummaryshow',
    payload: {
      uuid: uuid ?? '',
      ...(style_id ? { style_id } : {}),
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
      type: 'excel',
    },
    dataKey: 'bulletin_list',
    columns: [
      { key: 'seq_no', header: 'Seq No.', value: r => r.seq_no },
      { key: 'operation_code', header: 'Operation Code', value: r => r.operation?.code },
      { key: 'operation_name', header: 'Operation Name', value: r => r.operation?.operation_name },
      { key: 'machine_type', header: 'Machine Type', value: r => r.machine?.type_name },
      { key: 'sam', header: 'SAM', value: r => r.sam },
      { key: 'req_manning', header: 'Req Manning', value: r => r.req_manning },
      { key: 'all_manning', header: 'Alloc Manning', value: r => r.all_manning },
      { key: 'target_hun_hr', header: 'Target 100%/Hr', value: r => r.target_hun_hr },
      { key: 'all_manning_target_hun_hr', header: 'Alloc 100%/Hr', value: r => r.all_manning_target_hun_hr },
    ],
    filename: 'style_summary_details',
    method: 'GET',
  })

  const fetchData = useCallback(async () => {
    if (!uuid || !canShow) return
    setLoading(true)
    try {
      const res = await apiCall<any>(
        '/operationbullatin/stylesummaryshow',
        {
          method: 'GET',
          encrypt: false,
          payload: {
            uuid,
            style_id: style_id ? Number(style_id) : undefined,
            page,
            per_page: perPage,
            ...(search ? { search } : {}),
            ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
          }
        }
      )

      let parsedData: StyleSummaryShowItem[] = []
      const responseObj = res?.data || res

      if (Array.isArray(responseObj)) {
        parsedData = responseObj
      } else if (responseObj && Array.isArray(responseObj.bulletin_list)) {
        parsedData = responseObj.bulletin_list
        if (responseObj.pagination) {
          setPagination(responseObj.pagination)
        }
      } else if (responseObj && Array.isArray(responseObj.records)) {
        parsedData = responseObj.records
        if (responseObj.pagination) {
          setPagination(responseObj.pagination)
        }
      } else if (responseObj && typeof responseObj === 'object') {
        parsedData = [responseObj]
      }

      setData(parsedData)
    } catch {
      setData([])
      setPagination(null)
      setToast({ message: 'Failed to load style summary details', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [uuid, style_id, page, perPage, search, canShow])

  useEffect(() => {
    if (canShow) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [fetchData, canShow])

  const columns = [
    {
      key: 's_no',
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
          <span>S.No</span>
        </div>
      ),
      sortable: false,
      render: (_row: StyleSummaryShowItem, index: number) => (
        <span className="text-t-lighter font-mono">{(page - 1) * perPage + index + 1}</span>
      ),
    },
    {
      key: 'seq_no',
      header: renderHeader('seq_no', 'Seq No.'),
      sortable: true,
      sortValue: (row: StyleSummaryShowItem) => row.seq_no ?? 0,
      render: (row: StyleSummaryShowItem) => <span className="text-t-body font-mono">{row.seq_no}</span>,
    },
    {
      key: 'operation_code',
      header: renderHeader('operation', 'Operation Code'),
      sortable: true,
      sortValue: (row: StyleSummaryShowItem) => row.operation?.code ?? '',
      render: (row: StyleSummaryShowItem) => <span className="font-medium text-t-body">{row.operation?.code}</span>,
    },
    {
      key: 'operation_name',
      header: renderHeader('operation', 'Operation Name'),
      sortable: true,
      sortValue: (row: StyleSummaryShowItem) => row.operation?.operation_name ?? '',
      render: (row: StyleSummaryShowItem) => <span className="font-semibold text-t-primary">{row.operation?.operation_name}</span>,
    },
    {
      key: 'machine_type',
      header: renderHeader('machine_type_name', 'Machine Type'),
      sortable: true,
      sortValue: (row: StyleSummaryShowItem) => row.machine?.type_name ?? '',
      render: (row: StyleSummaryShowItem) => <span className="text-t-body">{row.machine?.type_name}</span>,
    },
    {
      key: 'sam',
      header: renderHeader('sam', 'SAM'),
      sortable: true,
      sortValue: (row: StyleSummaryShowItem) => row.sam ?? 0,
      className: 'text-right',
      render: (row: StyleSummaryShowItem) => <span className="text-t-body">{fmt(row.sam)}</span>,
    },
    {
      key: 'req_manning',
      header: renderHeader('req_manning', 'Req Manning'),
      sortable: true,
      sortValue: (row: StyleSummaryShowItem) => row.req_manning ?? 0,
      className: 'text-right',
      render: (row: StyleSummaryShowItem) => <span className="text-t-body">{fmt(row.req_manning)}</span>,
    },
    {
      key: 'all_manning',
      header: renderHeader('allocated_manning', 'Alloc Manning'),
      sortable: true,
      sortValue: (row: StyleSummaryShowItem) => row.all_manning ?? 0,
      className: 'text-right',
      render: (row: StyleSummaryShowItem) => <span className="text-t-body">{fmt(row.all_manning)}</span>,
    },
    {
      key: 'target_hun_hr',
      header: renderHeader('req_target_hun_hr', 'Target 100%/Hr'),
      sortable: true,
      sortValue: (row: StyleSummaryShowItem) => row.target_hun_hr ?? 0,
      className: 'text-right',
      render: (row: StyleSummaryShowItem) => <span className="font-semibold text-accent">{fmt(row.target_hun_hr)}</span>,
    },
    {
      key: 'all_manning_target_hun_hr',
      header: renderHeader('all_manning_target_hun_hr', 'Alloc 100%/Hr'),
      sortable: true,
      sortValue: (row: StyleSummaryShowItem) => row.all_manning_target_hun_hr ?? 0,
      className: 'text-right',
      render: (row: StyleSummaryShowItem) => <span className="font-semibold text-accent">{fmt(row.all_manning_target_hun_hr)}</span>,
    },
  ]

  const totalCount = pagination?.total_records ?? pagination?.total ?? 0

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-hover transition-colors text-t-secondary hover:text-t-primary"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-t-primary">Style Summary Details</h1>
          <p className="text-xs text-t-lighter mt-0.5">
            Operations and machine details for this style
          </p>
        </div>
      </div>
      <div className="border-b border-header-line mb-0" />

      {canShow && (
        <AdvancedTable<StyleSummaryShowItem>
          header={
            <Toolbar
              search={search}
              onSearchChange={(val) => {
                setSearch(val)
                setPage(1)
              }}
              searchPlaceholder="Search operation, code or machine..."
              onExport={() => handleExportExcel({ check_box_heading: formatExportHeadings(selectedHeadings) })}
              onExportPdf={handleExportPdf}
              exporting={exportingExcel || exportingPdf}
            />
          }
          columns={columns}
          rowKey={(row) => row.id?.toString() ?? Math.random().toString()}
          data={data}
          loading={loading}
          emptyMessage="No details found."
          page={page}
          totalPages={pagination?.total_pages ?? 1}
          totalCount={totalCount}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />
      )}
    </AppLayout>
  )
}
