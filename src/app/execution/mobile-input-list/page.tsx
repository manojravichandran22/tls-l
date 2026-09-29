'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import PageHeader from '@/components/ui/PageHeader'
import DataTable from '@/components/ui/DataTable'
import Toolbar from '@/components/ui/Toolbar'
import { Filter, MoreVertical } from 'lucide-react'
import { useSortableData } from '@/hooks/useSortableData'

interface MobileInputRecord {
  id: number
  uuid: string
  line_id: number
  line_name: string
  order_id: number
  order_no: number
  order_code: string
  style_id: number
  style_name: string
  color: string
  input_qty: number
}

export default function MobileInputListPage() {
  const [records, setRecords] = useState<MobileInputRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)

  const { sortedData, sortState, setSortState } = useSortableData(records)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{
        data?: {
          data?: MobileInputRecord[]
          pagination?: { total: number; total_pages: number }
        }
      }>('/mobileinputmodule/list', {
        method: 'GET',
        encrypt: false,
        payload: {
          search,
          line_id: "",
          order_id: "",
          color: "",
          page: String(page),
          per_page: String(perPage),
        },
      })

      const responseData = res.data
      setRecords(responseData?.data ?? [])
      setTotalCount(responseData?.pagination?.total ?? (responseData?.data?.length ?? 0))
      setTotalPages(responseData?.pagination?.total_pages ?? 1)
    } catch (error) {
      console.error('Failed to fetch mobile input list:', error)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [search, page, perPage])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const columns = [
    {
      key: 'line_name',
      header: 'Line',
      sortable: true,
      render: (row: MobileInputRecord) => (
        <span className="text-sm font-medium text-t-primary">{row.line_name}</span>
      ),
    },
    {
      key: 'order_no',
      header: 'Order No',
      sortable: true,
      render: (row: MobileInputRecord) => (
        <span className="text-sm text-t-secondary">{row.order_no}</span>
      ),
    },
    {
      key: 'order_code',
      header: 'Order Code',
      sortable: true,
      render: (row: MobileInputRecord) => (
        <span className="text-sm text-t-secondary">{row.order_code}</span>
      ),
    },
    {
      key: 'style_name',
      header: 'Style',
      sortable: true,
      render: (row: MobileInputRecord) => (
        <span className="text-sm text-t-secondary">{row.style_name}</span>
      ),
    },
    {
      key: 'color',
      header: 'Color',
      sortable: true,
      render: (row: MobileInputRecord) => (
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full border border-gray-200" 
            style={{ backgroundColor: row.color.toLowerCase() }}
          />
          <span className="text-sm text-t-secondary capitalize">{row.color}</span>
        </div>
      ),
    },
    {
      key: 'input_qty',
      header: 'Input Qty',
      sortable: true,
      render: (row: MobileInputRecord) => (
        <span className="text-sm font-semibold text-accent">{row.input_qty}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: () => (
        <button className="p-1 hover:bg-gray-100 rounded-full transition-colors text-t-lighter">
          <MoreVertical size={16} />
        </button>
      )
    }
  ]

  return (
    <AppLayout fixedHeight>
      <div className="flex flex-col h-full bg-table-bg">
        <PageHeader
          title="Mobile Input List"
          description="View and track mobile input module records"
        />

        <div className="flex-1 flex flex-col min-h-0">
          <Toolbar
            title="All Inputs"
            search={search}
            onSearchChange={(val) => { setSearch(val); setPage(1) }}
            showExport={true}
          >
            
          </Toolbar>

          <div className="flex-1 overflow-hidden">
            <DataTable
              columns={columns}
              data={sortedData}
              sortState={sortState}
              onSortChange={setSortState}
              loading={loading}
              emptyMessage="No mobile input records found"
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              countLabel="record"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
