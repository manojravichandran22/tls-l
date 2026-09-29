'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast, { type ToastData } from '@/components/ui/Toast'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import StyleList from './_components/StyleList'
import StyleForm from './_components/StyleForm'
import StyleView from './_components/StyleView'
import type { Style } from './_components/types'
import { useExport } from '@/hooks/useExport'

export default function StyleMasterPage() {
  const [styles, setStyles] = useState<Style[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [search, setSearch] = useState('')
  const [buyerFilter, setBuyerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [showForm, setShowForm] = useState(false)
  const [editStyle, setEditStyle] = useState<Style | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Style | null>(null)
  const [viewStyle, setViewStyle] = useState<Style | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  const { handleExport, exporting } = useExport<Style>({
    apiPath: '/styles/list',
    payload: { search, status: statusFilter === 'all' ? '' : statusFilter },
    dataKey: 'styles',
    columns: [
      { header: 'Buyer', value: r => r.buyer ?? '' },
      { header: 'Style No.', value: r => r.style_no ?? '' },
      { header: 'Style Name', value: r => r.style_name ?? '' },
      { header: 'Status', value: r => r.status === 1 ? 'Active' : r.status === 2 ? 'Awaiting for Review' : 'Inactive' },
    ],
    filename: 'styles',
  })

  const fetchStyles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{ data?: { styles?: Style[]; pagination?: { total: number; total_pages: number } } }>(
        '/styles/list',
        { method: 'GET', encrypt: false, payload: { page: String(page), per_page: String(perPage), search, status: statusFilter === 'all' ? '' : statusFilter } }
      )
      const nested = res.data
      const rows = nested?.styles ?? []
      const filtered = buyerFilter ? rows.filter(s => s.buyer === buyerFilter) : rows
      setStyles(filtered)
      setTotalCount(nested?.pagination?.total ?? rows.length)
      setTotalPages(nested?.pagination?.total_pages ?? 1)
    } catch {
      setStyles([])
    } finally {
      setLoading(false)
    }
  }, [page, perPage, search, statusFilter, buyerFilter])

  useEffect(() => { fetchStyles() }, [fetchStyles])

  const openAdd = () => { setEditStyle(null); setFormError(null); setShowForm(true) }
  const openEdit = (s: Style) => { setEditStyle(s); setFormError(null); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditStyle(null) }

  const handleSave = async (payload: Record<string, unknown>) => {
    setSaving(true)
    setFormError(null)
    try {
      const endpoint = editStyle ? '/styles/update' : '/styles/create'
      const res = await apiCall<{ success?: boolean; message?: string }>(endpoint, { payload })
      if (res.success === false) { setFormError(res.message || 'Save failed'); return }
      setToast({ message: res.message || (editStyle ? 'Style updated' : 'Style created'), type: 'success' })
      closeForm()
      fetchStyles()
    } catch (err: unknown) {
      const e = err as { message?: string }
      setFormError(e.message || 'Failed to save style')
    } finally {
      setSaving(false)
    }
  }

  const handleView = (uuid: string) => {
    const s = styles.find(x => x.uuid === uuid)
    if (s) setViewStyle(s)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/styles/delete', { payload: { uuid: deleteTarget.uuid } })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Style deleted', type: 'success' })
      setDeleteTarget(null)
      fetchStyles()
    } catch {
      setToast({ message: 'Failed to delete style', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-start justify-between mb-3">
        <div>
          <h1 className="text-lg font-bold text-t-primary">Style Master</h1>
          <p className="text-xs text-t-lighter mt-0.5">
            Manage styles linked to Operation Bulletins
          </p>
        </div>
      </div>
      <div className="border-b border-header-line mb-0" />

      <StyleList
        styles={styles}
        loading={loading}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        totalCount={totalCount}
        search={search}
        buyerFilter={buyerFilter}
        statusFilter={statusFilter}
        onSearchChange={v => { setSearch(v); setPage(1) }}
        onBuyerChange={v => { setBuyerFilter(v); setPage(1) }}
        onStatusChange={v => { setStatusFilter(v); setPage(1) }}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onView={handleView}
        onExport={handleExport}
        exporting={exporting}
        selected={selected}
        onSelectionChange={setSelected}
      />

      <StyleView
        viewData={viewStyle}
        viewLoading={false}
        onClose={() => setViewStyle(null)}
      />

      {showForm && (
        <StyleForm
          editStyle={editStyle}
          saving={saving}
          formError={formError}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Style"
          message={<span>Are you sure you want to delete <strong>{deleteTarget.style_name}</strong>?</span>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}
    </AppLayout>
  )
}
