'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import Toast, { type ToastData } from '@/components/ui/Toast'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { type Device } from './_components/types'
import DeviceList from './_components/DeviceList'
import DeviceForm from './_components/DeviceForm'
import DeviceView from './_components/DeviceView'
import { useExport } from '@/hooks/useExport'

export default function DeviceMasterPage() {
  const [branchFilter, setBranchFilter] = useState('')
  const { branchId, isAdmin } = useBranchAccess()
  const { branches } = useDropdownData({ branches: true })

  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : branchFilter

  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [deleting, setDeleting] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editDevice, setEditDevice] = useState<Device | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const { handleExport, exporting } = useExport<Record<string, unknown>>({
    apiPath: '/devices/list',
    payload: {
      search,
      status: filterStatus || 'all',
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
    },
    dataKey: 'tlsMaster',
    columns: [
      { header: 'Device Code', value: r => (r as Record<string, unknown>).code as string || '' },
      { header: 'TLS ID', value: r => String((r as Record<string, unknown>).tls_id) },
      { header: 'MAC Address', value: r => (r as Record<string, unknown>).mac_id as string || '' },
      { header: 'Branch', value: r => (r as Record<string, unknown>).branch_name as string || branches.find(b => b.id === Number((r as Record<string, unknown>).branch_id))?.branch_name || '' },
      { header: 'Status', value: r => (r as Record<string, unknown>).is_active === 1 ? 'Active' : 'Inactive' },
    ],
    filename: 'Devices',
  })

  const fetchDevices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{
        data?: {
          tlsMaster?: Device[]
          pagination?: { total: number; total_pages: number }
        }
      }>('/devices/list', {
        method: 'GET',
        encrypt: false,
        payload: {
          search,
          page: String(page),
          per_page: String(perPage),
          status: filterStatus || 'all',
          ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
        },
      })
      const data = res.data
      setDevices(data?.tlsMaster ?? [])
      setTotalCount(data?.pagination?.total ?? 0)
      setTotalPages(data?.pagination?.total_pages ?? 1)
    } catch {
      setDevices([])
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, effectiveBranchId, page, perPage])

  useEffect(() => { fetchDevices() }, [fetchDevices])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const payload: Record<string, unknown> = { uuid: deleteTarget.uuid }
      if (!isAdmin && branchId) payload.branch_id = String(branchId)
      const res = await apiCall<{ success?: boolean; message?: string }>('/devices/delete', { payload })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Device deleted successfully', type: 'success' })
      setDeleteTarget(null)
      fetchDevices()
    } catch {
      setToast({ message: 'Failed to delete device', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const handleSaved = (msg: string) => {
    setToast({ message: msg, type: 'success' })
    fetchDevices()
  }

  const handleView = async (uuid: string) => {
    setViewLoading(true)
    setViewData({})
    try {
      const payload: Record<string, unknown> = { uuid }
      if (!isAdmin && branchId) payload.branch_id = String(branchId)
      const res = await apiCall<{ data?: Record<string, unknown> }>('/devices/show', { method: 'GET', encrypt: false, payload })
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

      <DeviceView
        viewData={viewData}
        viewLoading={viewLoading}
        onClose={() => setViewData(null)}
      />

      {showModal && (
        <DeviceForm
          device={editDevice}
          branches={branches}
          onClose={() => setShowModal(false)}
          onSave={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Device"
          message={<>Are you sure you want to delete device <strong>{deleteTarget.code || deleteTarget.qr_code}</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader
        title="Devices Master"
        description="Manage TLS audit devices and their assignments to machines."
      />

      <DeviceList
        devices={devices}
        branches={branches}
        loading={loading}
        search={search}
        filterStatus={filterStatus}
        branchFilter={branchFilter}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onFilterStatusChange={val => { setFilterStatus(val); setPage(1) }}
        onBranchChange={val => { setBranchFilter(val); setPage(1) }}
        onAdd={() => { setEditDevice(null); setShowModal(true) }}
        onView={handleView}
        onEdit={device => { setEditDevice(device); setShowModal(true) }}
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