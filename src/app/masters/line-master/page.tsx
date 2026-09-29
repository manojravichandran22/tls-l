'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDropdownData } from '@/hooks/useDropdownData'
import AppLayout from '@/components/layout/AppLayout'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import Toast, { type ToastData } from '@/components/ui/Toast'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { type Line, type CompanyOption, type BranchOption, type ZoneOption } from './_components/types'
import LineList from './_components/LineList'
import LineForm from './_components/LineForm'
import LineView from './_components/LineView'
import { useExport } from '@/hooks/useExport'
import { useBranchAccess } from '@/hooks/useBranchAccess'

export default function LineMasterPage() {
  const { branchId, isAdmin } = useBranchAccess()
  const [lines, setLines] = useState<Line[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterZoneId, setFilterZoneId] = useState('')
  const [filterLineId, setFilterLineId] = useState('')
  const [filterSlot, setFilterSlot] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')
  const [filterBranchId, setFilterBranchId] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [deleting, setDeleting] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : filterBranchId

  // Global dropdown data for form modals
  const { companies, branches: allBranches, zones: allZones } = useDropdownData({
    companies: true,
    branches: true,
    zones: true,
    global: true,
  })

  // Filtered dropdown data for LineList toolbar
  const { zones: toolbarZones, lines: toolbarLines } = useDropdownData({
    zones: true,
    lines: true,
    branchId: effectiveBranchId,
    zoneId: filterZoneId,
  })

  const [showModal, setShowModal] = useState(false)
  const [editLine, setEditLine] = useState<Line | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Line | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  const { handleExport, exporting } = useExport<Line>({
    apiPath: '/line/list',
    payload: { search, line_name: filterLineId, zone_id: filterZoneId, branch_id: !isAdmin && branchId ? String(branchId) : filterBranchId, ...(filterSlot ? { slot: filterSlot } : {}), ...(filterStatus ? { status: filterStatus } : {}) },
    dataKey: 'lines',
    columns: [
      { key: 'branch_name', header: 'Branch', value: r => r.branch?.branch_name || r.zone?.branch?.branch_name || '' },
      { key: 'zone_name', header: 'Zone', value: r => r.zone?.zone_name || '' },
      { key: 'line_name', header: 'Line Name', value: r => r.line_name || '' },
      { key: 'status', header: 'Status', value: r => r.status === 1 ? 'Active' : 'Inactive' },
    ],
    filename: 'Lines',
  })

  const fetchLines = useCallback(async () => {
    setLoading(true)
    try {
      const payload: any = { search, page: String(page), per_page: String(perPage), line_name: filterLineId, zone_id: filterZoneId, branch_id: !isAdmin && branchId ? String(branchId) : filterBranchId, ...(filterSlot ? { slot: filterSlot } : {}), ...(filterStatus ? { status: filterStatus } : {}) }
      if (filterSlot) payload.slot_name = filterSlot
      if (filterStatus) payload.status = filterStatus

      const res = await apiCall<{
        data?: {
          lines?: Line[]
          pagination?: { total: number; total_pages: number }
        }
      }>('/line/list', {
        method: 'GET', encrypt: false,
        payload,
      })
      const data = res.data
      setLines(data?.lines ?? [])
      setTotalCount(data?.pagination?.total ?? 0)
      setTotalPages(data?.pagination?.total_pages ?? 1)
    } catch {
      setLines([])
    } finally {
      setLoading(false)
    }
  }, [search, filterZoneId, filterLineId, filterSlot, filterStatus, page, perPage, isAdmin,
    branchId, filterBranchId])

  useEffect(() => {
    fetchLines()
  }, [fetchLines])

  const handleView = async (uuid: string) => {
    setViewLoading(true)
    setViewData({})
    try {
      const res = await apiCall<{ data?: Record<string, unknown> }>('/line/show', {
        method: 'GET', encrypt: false, payload: {
          uuid, branch_id: !isAdmin && branchId
            ? String(branchId)
            : undefined,
        }
      })
      setViewData(res.data ?? res)
    } catch {
      setViewData(null)
    } finally {
      setViewLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/line/delete', { payload: { uuid: deleteTarget.uuid, branch_id: !isAdmin && branchId ? String(branchId) : undefined } })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Line deleted successfully', type: 'success' })
      setDeleteTarget(null)
      fetchLines()
    } catch {
      setToast({ message: 'Failed to delete line', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const handleSaved = (msg: string) => {
    setToast({ message: msg, type: 'success' })
    fetchLines()
  }

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <LineView
        viewData={viewData}
        viewLoading={viewLoading}
        onClose={() => setViewData(null)}
      />

      {showModal && (
        <LineForm
          line={editLine}
          companies={companies}
          allBranches={allBranches}
          allZones={allZones}
          onClose={() => setShowModal(false)}
          onSave={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Line"
          message={<>Are you sure you want to delete <strong>{deleteTarget.line_name}</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader title="Line & Audit Setup" description="Production line definitions with capacity and supervisor assignment." />

      <LineList
        lines={lines}
        loading={loading}
        search={search}
        filterZoneId={filterZoneId}
        filterLineId={filterLineId}
        filterSlot={filterSlot}
        filterStatus={filterStatus}
        allZones={toolbarZones}
        allLines={toolbarLines}
        filterBranchId={filterBranchId}
        allBranches={allBranches}
        onFilterBranchChange={val => {
          setFilterBranchId(val)
          setFilterZoneId('')
          setFilterLineId('')
          setPage(1)
        }}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        totalCount={totalCount}
        selected={selected}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onFilterZoneChange={val => {
          setFilterZoneId(val)
          setFilterLineId('')
          setPage(1)
        }}
        onFilterLineChange={val => { setFilterLineId(val); setPage(1) }}
        onFilterSlotChange={val => { setFilterSlot(val); setPage(1) }}
        onFilterStatusChange={val => { setFilterStatus(val); setPage(1) }}
        onAdd={() => { setEditLine(null); setShowModal(true) }}
        onView={handleView}
        onEdit={line => { setEditLine(line); setShowModal(true) }}
        onDelete={setDeleteTarget}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onSelectionChange={setSelected}
        onExport={handleExport}
        exporting={exporting}
      />
    </AppLayout>
  )
}
