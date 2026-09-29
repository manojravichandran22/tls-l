'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Toast, { type ToastData } from '@/components/ui/Toast'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import StyleSummaryList from './_components/StyleSummaryList'
import StyleSummaryViewModal from './_components/StyleSummaryViewModal'
import type { StyleSummary } from './_components/types'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useExport } from '@/hooks/useExport'

interface PaginationInfo {
  total: number
  per_page: number
  current_page: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export default function StyleSummaryPage() {
  const { can } = usePermissions('Operation-Bulletin')
  const canList = can('operationbuiltin.stylesummarylist')

  const { branchId, isAdmin } = useBranchAccess()
  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : ''
  const { branches } = useDropdownData({ branches: isAdmin })
  const [branchFilter, setBranchFilter] = useState('')

  const [records, setRecords] = useState<StyleSummary[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewId, setViewId] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [selected, setSelected] = useState<string[]>([])

  // Effective branch: user's branch (non-admin) or admin's selected filter
  const activeBranchId = effectiveBranchId || branchFilter

  const fetchData = useCallback(async () => {
    if (!canList) return
    setLoading(true)
    try {
      const res = await apiCall<{ data?: { records?: StyleSummary[]; pagination?: PaginationInfo } }>(
        '/operationbullatin/stylesummary',
        {
          method: 'GET',
          encrypt: false,
          payload: {
            page,
            per_page: perPage,
            ...(search ? { search } : {}),
            ...(activeBranchId ? { branch_id: activeBranchId } : {}),
          }
        }
      )
      setRecords(res.data?.records ?? [])
      setPagination(res.data?.pagination ?? null)
    } catch {
      setRecords([])
      setPagination(null)
      setToast({ message: 'Failed to load style summary', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [page, perPage, search, activeBranchId, canList])

  useEffect(() => { fetchData() }, [fetchData])

  const { handleExport, exporting } = useExport<StyleSummary>({
    apiPath: '/operationbullatin/stylesummary',
    payload: {
      search,
      ...(activeBranchId ? { branch_id: activeBranchId } : {}),
    },
    dataKey: 'records',
    columns: [
      { key: 'buyer', header: 'Buyer', value: r => r.buyer || '' },
      { key: 'style_no', header: 'Style No.', value: r => r.style_no || '' },
      { key: 'style_name', header: 'Style Name', value: r => r.style_name || '' },
      { key: 'branch', header: 'Branch', value: r => r.branch?.branch_name || '' },
      { key: 'total_sam', header: 'Total SAM', value: r => r.total_sam ?? '' },
      { key: 'req_manning', header: 'Req Manning', value: r => r.req_manning ?? '' },
      { key: 'allocated_manning', header: 'Alloc Manning', value: r => r.allocated_manning ?? '' },
      { key: 'req_target_hun_hr', header: 'Req 100%/Hr', value: r => r.req_target_hun_hr ?? '' },
      { key: 'req_target_hun_day', header: 'Req 100%/Day', value: r => r.req_target_hun_day ?? '' },
      { key: 'req_target_six_hr', header: 'Req 60%/Hr', value: r => r.req_target_six_hr ?? '' },
      { key: 'req_target_six_day', header: 'Req 60%/Day', value: r => r.req_target_six_day ?? '' },
      { key: 'all_target_hun_hr', header: 'Alloc 100%/Hr', value: r => r.all_target_hun_hr ?? '' },
      { key: 'all_target_hun_day', header: 'Alloc 100%/Day', value: r => r.all_target_hun_day ?? '' },
      { key: 'all_target_six_hr', header: 'Alloc 60%/Hr', value: r => r.all_target_six_hr ?? '' },
      { key: 'all_target_six_day', header: 'Alloc 60%/Day', value: r => r.all_target_six_day ?? '' },
    ],
    filename: 'Style_Summary',
  })

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-start justify-between mb-3">
        <div>
          <h1 className="text-lg font-bold text-t-primary">Style Summary</h1>
          <p className="text-xs text-t-lighter mt-0.5">
            Auto-generated when Operation Bulletin (OB) is saved — all values are read-only
          </p>
        </div>
        <div className="flex flex-col items-center px-5 py-2.5 border border-header-line rounded-card bg-card min-w-[100px]">
          <span className="text-xl font-bold text-t-primary leading-tight">
            {String(records.length).padStart(2, '0')}
          </span>
          <span className="text-2xs text-t-lighter mt-0.5 whitespace-nowrap">Total Styles</span>
        </div>
      </div>
      <div className="border-b border-header-line mb-0" />

      <StyleSummaryList
        data={records}
        loading={loading}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        page={page}
        perPage={perPage}
        totalPages={pagination?.total_pages ?? 1}
        totalCount={pagination?.total ?? 0}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onView={(uuid) => setViewId(uuid)}
        selected={selected}
        onSelectionChange={setSelected}
        isAdmin={isAdmin}
        branches={branches}
        branchFilter={branchFilter}
        onBranchFilterChange={(v) => { setBranchFilter(v); setPage(1) }}
        effectiveBranchId={effectiveBranchId}
        onExport={handleExport}
        exporting={exporting}
      />

      <StyleSummaryViewModal
        uuid={viewId}
        onClose={() => setViewId(null)}
      />
    </AppLayout>
  )
}