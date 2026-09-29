'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiCall } from '@/services/apiClient'
import { useDropdownData } from '@/hooks/useDropdownData'
import { PER_PAGE } from '@/lib/constants'
import Toast, { type ToastData } from '@/components/ui/Toast'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { type Shift, type BranchOption, type ZoneOption } from './_components/types'
import ShiftMasterList from './_components/ShiftMasterList'
import ShiftMasterForm from './_components/ShiftMasterForm'
import ShiftMasterView from './_components/ShiftMasterView'
import { useBranchAccess } from '@/hooks/useBranchAccess'

export default function ShiftMasterPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const { branches, zones: allZones } = useDropdownData({ branches: true, zones: true })
  const [loading, setLoading] = useState(true)
  const { branchId, isAdmin } = useBranchAccess()
  const [search, setSearch] = useState('')
  const [filterBranchId, setFilterBranchId] = useState('')
  const [filterZoneId, setFilterZoneId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterShiftType, setFilterShiftType] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [deleting, setDeleting] = useState(false)

  const [activeTab, setActiveTab] = useState<'Shift(s)' | 'Calendar'>('Shift(s)')
  const [selected, setSelected] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editShift, setEditShift] = useState<Shift | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  const fetchShifts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{ data?: { shifts?: Shift[]; pagination?: { total: number; total_pages: number } } }>('/shift/list', {
        method: 'GET', encrypt: false,
        payload: {
          page: String(page), per_page: String(perPage),
          search,
          branch_id: !isAdmin && branchId
    ? String(branchId)
    : filterBranchId,
          zone_id: filterZoneId,
          status: filterStatus,
          shift_type: filterShiftType,
        },
      })
      const data = res.data
      setShifts(data?.shifts ?? [])
      const total = data?.pagination?.total ?? 0
      setTotalCount(total)
      setTotalPages(data?.pagination?.total_pages ?? (total ? Math.ceil(total / perPage) : 1))
    } catch { setShifts([]) }
    finally { setLoading(false) }
  }, [search, filterBranchId, filterZoneId, filterStatus, filterShiftType, page, perPage])

  useEffect(() => { fetchShifts() }, [fetchShifts])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/shift/delete', { payload: { uuid: deleteTarget.uuid, branch_id: !isAdmin && branchId ? String(branchId) : undefined } })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Shift deleted successfully', type: 'success' })
      setDeleteTarget(null)
      fetchShifts()
    } catch { setToast({ message: 'Failed to delete shift', type: 'error' }) }
    finally { setDeleting(false) }
  }

  const handleSaved = (msg: string) => { setToast({ message: msg, type: 'success' }); fetchShifts() }

  const handleView = async (uuid: string) => {
    setViewLoading(true); setViewData({})
    try {
      const res = await apiCall<{ data?: Record<string, unknown> }>('/shift/show', { method: 'GET', encrypt: false, payload: { uuid, branch_id: !isAdmin && branchId ? String(branchId) : undefined }
 })
      setViewData(res.data ?? res)
    } catch { setViewData(null) }
    finally { setViewLoading(false) }
  }

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ShiftMasterView
        viewData={viewData}
        viewLoading={viewLoading}
        onClose={() => setViewData(null)}
        branches={branches}
        allZones={allZones}
      />

      {showModal && (
        <ShiftMasterForm
          shift={editShift}
          branches={branches}
          onClose={() => setShowModal(false)}
          onSave={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Shift"
          message={<>Are you sure you want to delete <strong>{deleteTarget.shift_name}</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader title="Shift Master" description="Define factory shifts with working hours and break times." />

      <ShiftMasterList
        shifts={shifts}
        loading={loading}
        search={search}
        filterBranchId={filterBranchId}
        filterZoneId={filterZoneId}
        filterStatus={filterStatus}
        filterShiftType={filterShiftType}
        allBranches={branches}
        allZones={allZones}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onFilterBranchChange={val => { setFilterBranchId(val); setFilterZoneId(''); setPage(1) }}
        onFilterZoneChange={val => { setFilterZoneId(val); setPage(1) }}
        onFilterStatusChange={val => { setFilterStatus(val); setPage(1) }}
        onFilterShiftTypeChange={val => { setFilterShiftType(val); setPage(1) }}
        onAdd={() => { setEditShift(null); setShowModal(true) }}
        onEdit={shift => { setEditShift(shift); setShowModal(true) }}
        onDelete={setDeleteTarget}
        onView={handleView}
        selected={selected}
        onSelectionChange={setSelected}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
        onPerPageChange={val => { setPerPage(val); setPage(1) }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </AppLayout>
  )
}
