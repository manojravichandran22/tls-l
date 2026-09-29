'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Toast from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import type { ToastData } from '@/components/ui/Toast'
import type { LinkOrder } from '@/app/masters/order-master/_components/types'
import OrderLinkList from '@/app/masters/order-master/_components/OrderLinkList'
import OrderView from '@/app/masters/order-master/_components/OrderView'
import LinkOrderModal from '@/app/masters/order-master/_components/LinkOrderModal'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'

export default function StyleOrderMappingPage() {
  const { can } = usePermissions('Order')
  const canUnlinkedList = can('order.unlinkedlistProductionOrders')

  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const effectiveBranchId = !isAdmin && userBranchId ? String(userBranchId) : (userBranchId ? String(userBranchId) : '')

  // ── Linked / Unlinked Orders ───────────────────────────────────────────────────
  const [linkOrders, setLinkOrders] = useState<LinkOrder[]>([])
  const [linkLoading, setLinkLoading] = useState(true)
  const [linkSearch, setLinkSearch] = useState('')
  const [linkPage, setLinkPage] = useState(1)
  const [linkPerPage, setLinkPerPage] = useState(PER_PAGE)
  const [linkTotalPages, setLinkTotalPages] = useState(1)
  const [linkTotalCount, setLinkTotalCount] = useState(0)

  // ── Header stats ───────────────────────────────────────────────────────────────
  const [statUnlinked, setStatUnlinked] = useState(0)

  // ── Modals ─────────────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<LinkOrder | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [linkTarget, setLinkTarget] = useState<LinkOrder | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)

  // ── Fetch stats ────────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const payload: Record<string, unknown> = { page: 1, per_page: 1 }
      if (effectiveBranchId) payload.branch_id = effectiveBranchId
      const unlinkRes = await apiCall<{ data?: { pagination?: { total: number } } }>(
        '/order/unlinkorderlist',
        { method: 'GET', encrypt: false, payload }
      )
      setStatUnlinked(unlinkRes.data?.pagination?.total ?? 0)
    } catch { }
  }, [effectiveBranchId])

  // ── Fetch unlinked orders (/order/unlinkorderlist) ─────────────────────────────
  const fetchLinkOrders = useCallback(async () => {
    setLinkLoading(true)
    try {
      const payload: Record<string, unknown> = {
        page: linkPage,
        per_page: linkPerPage,
        ...(linkSearch ? { search: linkSearch } : {}),
      }
      if (effectiveBranchId) payload.branch_id = effectiveBranchId

      const res = await apiCall<{
        data?: { records?: LinkOrder[]; pagination?: { total: number; total_pages: number } }
      }>('/order/unlinkorderlist', {
        method: 'GET',
        encrypt: false,
        payload,
      })
      setLinkOrders(res.data?.records ?? [])
      setLinkTotalCount(res.data?.pagination?.total ?? 0)
      setLinkTotalPages(res.data?.pagination?.total_pages ?? 1)
    } catch {
      setLinkOrders([])
    } finally {
      setLinkLoading(false)
    }
  }, [linkPage, linkPerPage, linkSearch, effectiveBranchId])

  // ── Stats and Data on mount ────────────────────────────────────────────────────
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    if (canUnlinkedList) {
      fetchLinkOrders()
    }
  }, [fetchLinkOrders, canUnlinkedList])

  // ── Delete ─────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const targetBranchId = (deleteTarget as any).branch_id || (deleteTarget as any).branch?.id || effectiveBranchId
      const payload: Record<string, unknown> = { uuid: deleteTarget.uuid }
      if (targetBranchId) payload.branch_id = String(targetBranchId)

      const res = await apiCall<{ success?: boolean; message?: string }>('/order/delete', {
        payload,
      })
      if (res.success === false) {
        setToast({ message: res.message || 'Delete failed', type: 'error' })
        return
      }
      setToast({ message: res.message || 'Order deleted', type: 'success' })
      setDeleteTarget(null)
      fetchLinkOrders()
      fetchStats()
    } catch {
      setToast({ message: 'Failed to delete order', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  // ── View ───────────────────────────────────────────────────────────────────────
  const handleView = async (uuid: string) => {
    setViewLoading(true)
    setViewData({})
    try {
      const payload: Record<string, unknown> = { uuid }
      if (effectiveBranchId) payload.branch_id = effectiveBranchId
      const res = await apiCall<{ data?: Record<string, unknown> }>('/order/show', {
        method: 'GET',
        encrypt: false,
        payload,
      })
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

      <OrderView
        viewData={viewData !== null ? (viewLoading ? null : viewData) : null}
        viewLoading={viewLoading}
        onClose={() => setViewData(null)}
      />

      {linkTarget && (
        <LinkOrderModal
          row={linkTarget}
          onClose={() => setLinkTarget(null)}
          onSuccess={() => {
            setToast({ message: 'Order linked successfully', type: 'success' })
            fetchLinkOrders()
            fetchStats()
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Order"
          message={<>Are you sure you want to delete Order <strong>#{deleteTarget.order_no}</strong>?</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h1 className="text-lg font-bold text-t-primary">Style &amp; Order Mapping</h1>
          <p className="text-xs text-t-lighter mt-0.5">
            Link production orders to OB styles to map styles to specific orders
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col items-center px-5 py-2.5 border border-header-line rounded-card bg-card min-w-[100px]">
            <span className="text-xl font-bold text-t-primary leading-tight">
              {String(statUnlinked).padStart(2, '0')}
            </span>
            <span className="text-2xs text-t-lighter mt-0.5 whitespace-nowrap">Unlinked Orders</span>
          </div>
        </div>
      </div>

      <div className="border-b border-header-line mb-4" />

      {/* ── List ── */}
      <OrderLinkList
        data={linkOrders}
        loading={linkLoading}
        search={linkSearch}
        page={linkPage}
        perPage={linkPerPage}
        totalPages={linkTotalPages}
        totalCount={linkTotalCount}
        onSearchChange={v => { setLinkSearch(v); setLinkPage(1) }}
        onLink={setLinkTarget}
        onView={handleView}
        onDelete={setDeleteTarget}
        onPageChange={setLinkPage}
        onPerPageChange={setLinkPerPage}
        selectable={false}
      />
    </AppLayout>
  )
}
