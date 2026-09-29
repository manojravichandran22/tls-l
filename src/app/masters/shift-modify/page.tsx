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
import ShiftModifyList from './_components/ShiftModifyList'
import ShiftModifyForm from './_components/ShiftModifyForm'
import ShiftModifyView from './_components/ShiftModifyView'
import { useBranchAccess } from '@/hooks/useBranchAccess'

export default function ShiftModifyPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const { branchId, isAdmin } = useBranchAccess()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [deleting, setDeleting] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterShiftId, setFilterShiftId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBranchId, setFilterBranchId] = useState('')

  const [activeTab, setActiveTab] = useState<'Shift(s)' | 'Calendar'>('Shift(s)')
  const [selected, setSelected] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editShiftMod, setEditShiftMod] = useState<Shift | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)

  const activeBranchId = !isAdmin && branchId ? String(branchId) : filterBranchId

  const { branches, zones: allZones, shifts: shiftsList } = useDropdownData({
    branches: true,
    zones: true,
    shifts: true,
    branchId: activeBranchId,
    isReport: true,
  })


  const fetchShiftMods = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{ data?: { shifts?: Shift[]; pagination?: { total: number; total_pages: number } } }>('/shiftmodify/list', {
        method: 'GET', encrypt: false,
        payload: {
          page: String(page),
          per_page: String(perPage),
          search,
          shift_type: filterType,
          shift_id: filterShiftId,
          status: filterStatus || 'all',
          //branch_id: filterBranchId,
          branch_id: !isAdmin && branchId
            ? String(branchId)
            : filterBranchId,
        },
      })
      const data = res.data
      setShifts(data?.shifts ?? [])
      setTotalCount(data?.pagination?.total ?? 0)
      setTotalPages(data?.pagination?.total_pages ?? 1)
    } catch { setShifts([]) }
    finally { setLoading(false) }
  }, [search, page, perPage, filterType, filterShiftId, filterStatus, filterBranchId, isAdmin, branchId])

  useEffect(() => { fetchShiftMods() }, [fetchShiftMods])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/shiftmodify/delete', { payload: { uuid: deleteTarget.uuid, branch_id: !isAdmin && branchId ? String(branchId) : undefined } })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Shift deleted successfully', type: 'success' })
      setDeleteTarget(null)
      fetchShiftMods()
    } catch { setToast({ message: 'Failed to delete shift', type: 'error' }) }
    finally { setDeleting(false) }
  }

  const handleSaved = (msg: string) => { setToast({ message: msg, type: 'success' }); fetchShiftMods() }

  const handleView = async (uuid: string) => {
    setViewLoading(true); setViewData({})
    try {
      const res = await apiCall<{ data?: Record<string, unknown> }>('/shiftmodify/show', { method: 'GET', encrypt: false, payload: { uuid, branch_id: !isAdmin && branchId ? String(branchId) : undefined } })
      setViewData(res.data ?? res)
    } catch { setViewData(null) }
    finally { setViewLoading(false) }
  }

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ShiftModifyView
        viewData={viewData}
        viewLoading={viewLoading}
        onClose={() => setViewData(null)}
      />

      {showModal && (
        <ShiftModifyForm
          shift={editShiftMod}
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

      <PageHeader title="Shift Allocation" description="Modify shifts with custom dates and timing adjustments." />

      <ShiftModifyList
        shifts={shifts}
        loading={loading}
        search={search}
        filterType={filterType}
        filterShiftId={filterShiftId}
        filterStatus={filterStatus}
        filterBranchId={filterBranchId}
        shiftsList={shiftsList}
        branchesList={branches}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onFilterTypeChange={val => { setFilterType(val); setPage(1) }}
        onFilterShiftChange={val => { setFilterShiftId(val); setPage(1) }}
        onFilterStatusChange={val => { setFilterStatus(val); setPage(1) }}
        onFilterBranchChange={val => { setFilterBranchId(val); setPage(1) }}
        onAdd={() => { setEditShiftMod(null); setShowModal(true) }}
        onEdit={shift => { setEditShiftMod(shift); setShowModal(true) }}
        onDelete={setDeleteTarget}
        onView={handleView}
        selected={selected}
        onSelectionChange={setSelected}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </AppLayout>
  )
}
