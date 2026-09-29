'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast, { type ToastData } from '@/components/ui/Toast'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import TeamList from './_components/TeamList'
import TeamForm from './_components/TeamForm'
import TeamView from './_components/TeamView'
import type { Team } from './_components/types'
import { useExport } from '@/hooks/useExport'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'



export default function TeamMasterPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [selected, setSelected] = useState<string[]>([])

  const [showForm, setShowForm] = useState(false)
  const [editTeam, setEditTeam] = useState<Team | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const selectedUuids = selected
  const { branchId, isAdmin } = useBranchAccess()
  const { branches } = useDropdownData({ branches: true })
  const [branchFilter, setBranchFilter] = useState('')


  const { handleExport, exporting } = useExport<Team>({
    apiPath: '/team/list',
    payload: {
      search,
      status: statusFilter === 'all' ? '' : statusFilter,
      team_id: '',
      shift_id: '',
      ...(!isAdmin && branchId
        ? { branch_id: String(branchId) }
        : branchFilter
          ? { branch_id: branchFilter }
          : {}),
      ...(selectedUuids.length > 0
        ? { check_uuid: selectedUuids }
        : {}),
    },
    dataKey: 'rows',
    columns: [
      { key: 'team_name', header: 'Team Name', value: r => r.team_name },
      { key: 'code', header: 'Team Code', value: r => r.code || '' },
      { key: 'branch', header: 'Branch', value: r => r.branch?.branch_name || '' },
      { key: 'status', header: 'Status', value: r => r.status === 1 ? 'Active' : 'Inactive' },
    ],
    filename: 'Teams',
  })

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    try {
      const payload: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
        search,
        team_id: '',
        shift_id: '',
      }
      if (!isAdmin && branchId) {
        payload.branch_id = String(branchId)
      } else if (branchFilter) {
        payload.branch_id = branchFilter
      }
      if (statusFilter && statusFilter !== 'all') payload.status = statusFilter

      const res = await apiCall<{
        data?: {
          rows?: Team[]
          pagination?: { total: number; total_pages: number }
        }
      }>('/team/list', { method: 'GET', encrypt: false, payload })

      console.log('[TeamMaster] API Response:', res)

      const nested = res.data
      const rows = nested?.rows ?? []
      const sortedRows = [...rows].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
      setTeams(sortedRows)
      setTotalCount(nested?.pagination?.total ?? sortedRows.length)
      setTotalPages(nested?.pagination?.total_pages ?? 1)
    } catch {
      setTeams([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, branchFilter, page, perPage])

  useEffect(() => { fetchTeams() }, [fetchTeams])

  // ── View ───────────────────────────────────────────
  const handleView = async (uuid: string) => {
    setViewLoading(true)
    setViewData({})
    try {
      const res = await apiCall<{ data?: Record<string, unknown> }>('/team/show', {
        method: 'GET', encrypt: false, payload: { uuid, branch_id: !isAdmin && branchId ? String(branchId) : undefined },
      })
      setViewData(res.data ?? res)
    } catch { setViewData(null) }
    finally { setViewLoading(false) }
  }

  // ── Create / Edit ──────────────────────────────────
  const openAdd = () => { setEditTeam(null); setFormError(null); setShowForm(true) }
  const openEdit = (team: Team) => { setEditTeam(team); setFormError(null); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditTeam(null) }

  const handleSave = async (payload: Record<string, unknown>) => {
    setSaving(true)
    setFormError(null)
    try {
      if (editTeam) {
        const res = await apiCall<{ success?: boolean; message?: string }>('/team/update', { payload })
        if (res.success === false) { setFormError(res.message || 'Update failed'); return }
        setToast({ message: res.message || 'Team updated successfully', type: 'success' })
      } else {
        const res = await apiCall<{ success?: boolean; message?: string }>('/team/create', { payload })
        if (res.success === false) { setFormError(res.message || 'Creation failed'); return }
        setToast({ message: res.message || 'Team created successfully', type: 'success' })
        setPage(1)
      }
      closeForm()
      fetchTeams()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setFormError(e.response?.data?.message || e.message || 'Failed to save team')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/team/delete', {
        method: 'GET',
        encrypt: false,
        payload: { uuid: deleteTarget.uuid, branch_id: !isAdmin && branchId ? String(branchId) : undefined },
      })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Team deleted successfully', type: 'success' })
      setDeleteTarget(null)
      fetchTeams()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setToast({ message: e.response?.data?.message || e.message || 'Failed to delete team', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader title="Team Master" description="Manage team profiles and their shift assignments." />

      <TeamList
        teams={teams}
        loading={loading}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        totalCount={totalCount}
        search={search}
        statusFilter={statusFilter}
        branchFilter={branchFilter}
        branches={branches}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onStatusChange={val => { setStatusFilter(val); setPage(1) }}
        onBranchChange={val => { setBranchFilter(val); setPage(1) }}
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

      <TeamView viewData={viewData} viewLoading={viewLoading} onClose={() => setViewData(null)} />

      {showForm && (
        <TeamForm
          editTeam={editTeam}
          saving={saving}
          formError={formError}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Team"
          message={<span>Are you sure you want to delete <strong>{deleteTarget.team_name}</strong>? This action cannot be undone.</span>}
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
