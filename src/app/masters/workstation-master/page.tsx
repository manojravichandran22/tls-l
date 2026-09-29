'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiCall } from '@/services/apiClient'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { PER_PAGE } from '@/lib/constants'
import Toast, { type ToastData } from '@/components/ui/Toast'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { type Workstation, type BranchOption, type LineOption } from './_components/types'
import WorkstationList from './_components/WorkstationList'
import WorkstationForm from './_components/WorkstationForm'
import WorkstationView from './_components/WorkstationView'
import { useExport } from '@/hooks/useExport'

export default function WorkstationMasterPage() {
  const [branchFilter, setBranchFilter] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const { branchId, isAdmin } = useBranchAccess()
  const { branches, lines: allLines } = useDropdownData({ branches: true, lines: true })

  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : branchFilter

  const [workstations, setWorkstations] = useState<Workstation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [deleting, setDeleting] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editWs, setEditWs] = useState<Workstation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Workstation | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const { handleExport, exporting } = useExport<Record<string, unknown>>({
    apiPath: '/workstation/list',
    payload: {
      search,
      line_id: '',
      status: filterStatus || 'all',
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
    },
    dataKey: 'workstations',
    columns: [
      { key: 'name', header: 'Workstation Name', value: r => (r as Record<string, unknown>).name as string || '' },
      { key: 'code', header: 'Code', value: r => (r as Record<string, unknown>).code as string || '' },
      { key: 'line', header: 'Line', value: r => ((r as Record<string, unknown>).line as any)?.line_name || '' },
      { key: 'branch', header: 'Branch', value: r => ((r as Record<string, unknown>).branch as any)?.branch_name || '' },
      { key: 'qr_code', header: 'QR Code', value: r => (r as Record<string, unknown>).qr_code as string || '' },
      { key: 'status', header: 'Status', value: r => (r as Record<string, unknown>).is_active === 1 ? 'Active' : 'Inactive' },
    ],
    filename: 'Workstations',
  })

  const fetchWorkstations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{
        data?: {
          workstations?: Workstation[]
          pagination?: { total: number; total_pages: number }
        }
      }>('/workstation/list', {
        method: 'GET', encrypt: false,
        payload: {
          page: String(page),
          per_page: String(perPage),
          search,
          line_id: '',
          status: filterStatus || 'all',
          ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
        },
      })
      const data = res.data
      setWorkstations(data?.workstations ?? [])
      setTotalCount(data?.pagination?.total ?? 0)
      setTotalPages(data?.pagination?.total_pages ?? 1)
    } catch {
      setWorkstations([])
    } finally {
      setLoading(false)
    }
  }, [search, page, perPage, filterStatus, effectiveBranchId])

  useEffect(() => {
    fetchWorkstations()
  }, [fetchWorkstations])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/workstation/delete', { payload: { uuid: deleteTarget.uuid } })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Workstation deleted successfully', type: 'success' })
      setDeleteTarget(null)
      fetchWorkstations()
    } catch {
      setToast({ message: 'Failed to delete workstation', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const handleSaved = (msg: string) => {
    setToast({ message: msg, type: 'success' })
    fetchWorkstations()
  }

  const handleView = async (uuid: string) => {
    setViewLoading(true)
    setViewData({})
    try {
      const res = await apiCall<{ data?: Record<string, unknown> }>('/workstation/show', { method: 'GET', encrypt: false, payload: { uuid } })
      setViewData(res.data ?? res)
    } catch {
      setViewData(null)
    } finally {
      setViewLoading(false)
    }
  }

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <WorkstationView
        viewData={viewData}
        viewLoading={viewLoading}
        onClose={() => setViewData(null)}
      />

      {showModal && (
        <WorkstationForm
          ws={editWs}
          branches={branches}
          allLines={allLines}
          onClose={() => setShowModal(false)}
          onSave={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Workstation"
          message={<>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader title="Workstation" description="Manage workstations, line assignments and QR codes." />

      <WorkstationList
        workstations={workstations}
        loading={loading}
        search={search}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        totalCount={totalCount}
        branches={branches}
        branchFilter={branchFilter}
        filterStatus={filterStatus}
        onBranchChange={val => { setBranchFilter(val); setPage(1) }}
        onFilterStatusChange={val => { setFilterStatus(val); setPage(1) }}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onAdd={() => { setEditWs(null); setShowModal(true) }}
        onView={handleView}
        onEdit={ws => { setEditWs(ws); setShowModal(true) }}
        onDelete={setDeleteTarget}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onExport={handleExport}
        exporting={exporting}
        selected={selected}
        onSelectionChange={setSelected}
      />
    </AppLayout>
  )
}
