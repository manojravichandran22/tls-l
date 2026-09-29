'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Toast from '@/components/ui/Toast'
import Tabs from '@/components/ui/Tabs'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import type { ToastData } from '@/components/ui/Toast'
import type { Order, LinkOrder } from './_components/types'
import OrderList from './_components/OrderList'
import OrderLinkList from './_components/OrderLinkList'
import OrderForm from './_components/OrderForm'
import OrderView from './_components/OrderView'
import LinkOrderModal from './_components/LinkOrderModal'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'

type Tab = 'in-process' | 'unlinked'

export default function OrderMasterPage() {
  const { can } = usePermissions('Order')
  const canLinkOrderList = can('order.linkorderlist')
  const canUnlinkedList  = can('order.unlinkedlistProductionOrders')

  const { branchId, isAdmin } = useBranchAccess()
  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : ''
  const { branches } = useDropdownData({ branches: true })
  const [branchFilter, setBranchFilter] = useState('')
  const activeBranchId = effectiveBranchId || branchFilter

  const [tab, setTab] = useState<Tab>('in-process')

  useEffect(() => {
    if (!canLinkOrderList && canUnlinkedList) {
      setTab('unlinked')
    }
  }, [canLinkOrderList, canUnlinkedList])

  // ── In-Process Orders ──────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderNoFilter, setOrderNoFilter] = useState('')
  const [orderColour, setOrderColour] = useState('all')
  const [orderStatus, setOrderStatus] = useState('active')
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersPerPage, setOrdersPerPage] = useState(PER_PAGE)
  const [ordersTotalPages, setOrdersTotalPages] = useState(1)
  const [ordersTotalCount, setOrdersTotalCount] = useState(0)

  // ── Linked / Unlinked Orders ───────────────────────────────────────────────────
  const [linkOrders, setLinkOrders] = useState<LinkOrder[]>([])
  const [linkLoading, setLinkLoading] = useState(true)
  const [linkSearch, setLinkSearch] = useState('')
  const [linkPage, setLinkPage] = useState(1)
  const [linkPerPage, setLinkPerPage] = useState(PER_PAGE)
  const [linkTotalPages, setLinkTotalPages] = useState(1)
  const [linkTotalCount, setLinkTotalCount] = useState(0)

  // ── Header stats ───────────────────────────────────────────────────────────────
  const [statTotal, setStatTotal] = useState(0)
  const [statUnlinked, setStatUnlinked] = useState(0)
  const [statInProcess, setStatInProcess] = useState(0)

  // ── Modals ─────────────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Order | LinkOrder | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [linkTarget, setLinkTarget] = useState<LinkOrder | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  const uniqueColours = [...new Set(orders.map(o => o.colour).filter(Boolean))]

  // ── Fetch stats ────────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (canLinkOrderList) {
      try {
        const linkRes = await apiCall<{ data?: { pagination?: { total: number; overall_total?: number } } }>(
          '/order/linkorderlist',
          { method: 'GET', encrypt: false, payload: { page: 1, per_page: 1, ...(activeBranchId ? { branch_id: activeBranchId } : {}) } }
        )
        setStatInProcess(linkRes.data?.pagination?.total ?? 0)
        setStatTotal(linkRes.data?.pagination?.overall_total ?? linkRes.data?.pagination?.total ?? 0)
      } catch { }
    }

    if (canUnlinkedList) {
      try {
        const unlinkRes = await apiCall<{ data?: { pagination?: { total: number } } }>(
          '/order/unlinkorderlist',
          { method: 'GET', encrypt: false, payload: { page: 1, per_page: 1, ...(activeBranchId ? { branch_id: activeBranchId } : {}) } }
        )
        setStatUnlinked(unlinkRes.data?.pagination?.total ?? 0)
        if (!canLinkOrderList) {
          setStatTotal(unlinkRes.data?.pagination?.total ?? 0)
        }
      } catch { }
    }
  }, [canLinkOrderList, canUnlinkedList, activeBranchId])

  // ── Fetch in-process orders (/order/linkorderlist = linked orders) ─────────────
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const res = await apiCall<{
        data?: { records?: Order[]; pagination?: { total: number; total_pages: number } }
      }>('/order/linkorderlist', {
        method: 'GET',
        encrypt: false,
        payload: {
          page: ordersPage,
          per_page: ordersPerPage,
          status: orderStatus,
          colour: orderColour,
          ...(orderSearch ? { search: orderSearch } : {}),
          ...(orderNoFilter ? { order_no: orderNoFilter } : {}),
          ...(activeBranchId ? { branch_id: activeBranchId } : {}),
        },
      })
      setOrders(res.data?.records ?? [])
      setOrdersTotalCount(res.data?.pagination?.total ?? 0)
      setOrdersTotalPages(res.data?.pagination?.total_pages ?? 1)
    } catch { setOrders([]) }
    finally { setOrdersLoading(false) }
  }, [ordersPage, ordersPerPage, orderStatus, orderColour, orderSearch, orderNoFilter, activeBranchId])

  // ── Fetch unlinked orders (/order/unlinkorderlist) ─────────────────────────────
  const fetchLinkOrders = useCallback(async () => {
    setLinkLoading(true)
    try {
      const res = await apiCall<{
        data?: { records?: LinkOrder[]; pagination?: { total: number; total_pages: number } }
      }>('/order/unlinkorderlist', {
        method: 'GET',
        encrypt: false,
        payload: {
          page: linkPage,
          per_page: linkPerPage,
          ...(linkSearch ? { search: linkSearch } : {}),
          ...(activeBranchId ? { branch_id: activeBranchId } : {}),
        },
      })
      setLinkOrders(res.data?.records ?? [])
      setLinkTotalCount(res.data?.pagination?.total ?? 0)
      setLinkTotalPages(res.data?.pagination?.total_pages ?? 1)
    } catch { setLinkOrders([]) }
    finally { setLinkLoading(false) }
  }, [linkPage, linkPerPage, linkSearch, activeBranchId])

  // ── Stats on mount ─────────────────────────────────────────────────────────────
  useEffect(() => { fetchStats() }, [fetchStats])

  useEffect(() => { if (canLinkOrderList) fetchOrders()     }, [fetchOrders, canLinkOrderList])
  useEffect(() => { if (canUnlinkedList) fetchLinkOrders()  }, [fetchLinkOrders, canUnlinkedList])

  // ── Delete ─────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const targetBranchId = (deleteTarget as any).branch_id || (deleteTarget as any).branch?.id || activeBranchId
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
      fetchOrders()
      fetchLinkOrders()
      fetchStats()
    } catch { setToast({ message: 'Failed to delete order', type: 'error' }) }
    finally { setDeleting(false) }
  }

  // ── Save ───────────────────────────────────────────────────────────────────────
  const handleSave = async (payload: Record<string, unknown>) => {
    const isEdit = !!editOrder
    const res = await apiCall<{ success?: boolean; message?: string }>(
      isEdit ? '/order/update' : '/order/create',
      { payload }
    )
    if (res.success !== false) {
      setToast({ message: res.message || (isEdit ? 'Order updated' : 'Order created'), type: 'success' })
      fetchOrders()
      fetchLinkOrders()
      fetchStats()
    }
    return res
  }

  // ── View ───────────────────────────────────────────────────────────────────────
  const handleView = async (uuid: string) => {
    setViewLoading(true)
    setViewData({})
    try {
      const payload: Record<string, unknown> = { uuid }
      if (activeBranchId) payload.branch_id = activeBranchId
      const res = await apiCall<{ data?: Record<string, unknown> }>('/order/show', {
        method: 'GET',
        encrypt: false,
        payload,
      })
      setViewData(res.data ?? res)
    } catch { setViewData(null) }
    finally { setViewLoading(false) }
  }

  // ── Edit ───────────────────────────────────────────────────────────────────────
  const handleEdit = async (row: Order) => {
    try {
      const payload: Record<string, unknown> = { uuid: row.uuid }
      const rowBranchId = row.branch_id || row.branch?.id || activeBranchId
      if (rowBranchId) payload.branch_id = String(rowBranchId)

      const res = await apiCall<{ success?: boolean; data?: Order }>('/order/show', {
        method: 'GET',
        encrypt: false,
        payload,
      })
      if (res.success !== false && res.data) {
        setEditOrder(res.data)
        setShowModal(true)
      } else {
        setToast({ message: 'Failed to load order details', type: 'error' })
      }
    } catch {
      setToast({ message: 'Failed to load order details', type: 'error' })
    }
  }

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showModal && (
        <OrderForm
          order={editOrder}
          branches={branches}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

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
            fetchOrders()
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
          <h1 className="text-lg font-bold text-t-primary">Order Hub</h1>
          <p className="text-xs text-t-lighter mt-0.5">
            Manage production orders, track progress and control OB links to unlock TLS Sewing
          </p>
        </div>
        <div className="flex gap-3">
          {([
            { label: 'In-Process', value: statInProcess },
            { label: 'Unlinked', value: statUnlinked },
            { label: 'Total Orders', value: statTotal },
          ] as { label: string; value: number }[]).map(s => (
            <div
              key={s.label}
              className="flex flex-col items-center px-5 py-2.5 border border-header-line rounded-card bg-card min-w-[100px]"
            >
              <span className="text-xl font-bold text-t-primary leading-tight">
                {String(s.value).padStart(2, '0')}
              </span>
              <span className="text-2xs text-t-lighter mt-0.5 whitespace-nowrap">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* ── Tabs ── */}
      <Tabs
        tabs={[
          ...(canLinkOrderList ? [{ value: 'in-process', label: 'In-Process Orders' }] : []),
          ...(canUnlinkedList ? [{ value: 'unlinked',   label: 'Unlinked Orders'   }] : []),
        ]}
        active={tab}
        onChange={t => setTab(t as Tab)}
      />

      {/* ── Tab content ── */}
      {tab === 'in-process' && canLinkOrderList ? (
        <OrderList
          data={orders}
          loading={ordersLoading}
          search={orderSearch}
          orderNoFilter={orderNoFilter}
          colour={orderColour}
          status={orderStatus}
          page={ordersPage}
          perPage={ordersPerPage}
          totalPages={ordersTotalPages}
          totalCount={ordersTotalCount}
          colours={uniqueColours}
          onSearchChange={v => { setOrderSearch(v); setOrdersPage(1) }}
          onOrderNoFilterChange={v => { setOrderNoFilter(v); setOrdersPage(1) }}
          onColourChange={v => { setOrderColour(v); setOrdersPage(1) }}
          onStatusChange={v => { setOrderStatus(v); setOrdersPage(1) }}
          onAdd={() => { setEditOrder(null); setShowModal(true) }}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onView={handleView}
          onPageChange={setOrdersPage}
          onPerPageChange={setOrdersPerPage}
          selected={selected}
          onSelectionChange={setSelected}
          isAdmin={isAdmin}
          branches={branches}
          branchFilter={branchFilter}
          onBranchFilterChange={v => { setBranchFilter(v); setOrdersPage(1) }}
          effectiveBranchId={effectiveBranchId}
        />
      ) : tab === 'unlinked' && canUnlinkedList ? (
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
          selected={selected}
          onSelectionChange={setSelected}
          isAdmin={isAdmin}
          branches={branches}
          branchFilter={branchFilter}
          onBranchFilterChange={v => { setBranchFilter(v); setLinkPage(1) }}
          effectiveBranchId={effectiveBranchId}
        />
      ) : null}
    </AppLayout>
  )
}
