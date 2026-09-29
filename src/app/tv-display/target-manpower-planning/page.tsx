'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Toast, { type ToastData } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PageHeader from '@/components/ui/PageHeader'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'
import { usePermissions } from '@/hooks/usePermissions'
import type { ManpowerPlanningItem } from './_components/types'
import TargetManpowerList from './_components/TargetManpowerList'
import TargetManpowerForm from './_components/TargetManpowerForm'
import TargetManpowerView from './_components/TargetManpowerView'
import { useExport } from '@/hooks/useExport'
import { useExportPdf } from '@/hooks/useExportPdf'

const getTodayStr = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function TargetManpowerPlanningPage() {
  const { can } = usePermissions('Manpowerplanning')
  const canList = can('manpowerplanning.list') || can('list')

  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const effectiveBranchId = !isAdmin && userBranchId ? String(userBranchId) : ''

  const [dateFilter, setDateFilter] = useState(getTodayStr())
  const [branchFilter, setBranchFilter] = useState(effectiveBranchId)

  // Filters & Pagination
  const [shiftFilter, setShiftFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [search, setSearch] = useState('')

  const activeBranchId = effectiveBranchId || branchFilter

  const { branches, shifts, teams } = useDropdownData({
    branches: true,
    shifts: true,
    teams: true,
    branchId: activeBranchId,
    shiftId: shiftFilter,
    teamId: teamFilter,
    isReport: true,
  })

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Data & Loading
  const [items, setItems] = useState<ManpowerPlanningItem[]>([])
  const [loading, setLoading] = useState(true)

  // View Screen States
  const [viewMode, setViewMode] = useState<'list' | 'form' | 'view'>('list')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedShiftId, setSelectedShiftId] = useState('')
  const [selectedItem, setSelectedItem] = useState<ManpowerPlanningItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ManpowerPlanningItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)

  const { handleExport, exporting } = useExport<ManpowerPlanningItem>({
    apiPath: '/manPowerPlanning/list',
    payload: {
      branch_id: activeBranchId || '',
      shift_id: shiftFilter || '',
      team_id: teamFilter || '',
      planning_date: dateFilter || '',
      ...(search.trim() ? { search } : {}),
    },
    filename: 'Target_Manpower_Planning',
  })

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/manPowerPlanning/list',
    payload: {
      branch_id: activeBranchId || '',
      shift_id: shiftFilter || '',
      team_id: teamFilter || '',
      planning_date: dateFilter || '',
      ...(search.trim() ? { search } : {}),
    },
    filename: 'Target_Manpower_Planning',
  })

  // Fetch List API
  const fetchList = useCallback(async () => {
    if (!canList) {
      setLoading(false)
      setItems([])
      return
    }
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        branch_id: activeBranchId || '',
        shift_id: shiftFilter || '',
        team_id: teamFilter || '',
        planning_date: dateFilter || '',
        page: page,
        per_page: perPage,
      }

      const res = await apiCall<any>('/manPowerPlanning/list', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.records)
              ? res.data.records
              : Array.isArray(res?.records)
                ? res.records
                : []

      // Filter locally by search if provided
      let filtered = rawList
      if (search.trim()) {
        const q = search.toLowerCase()
        filtered = rawList.filter((item: any) => {
          const bName = (item.branch_name || '').toLowerCase()
          const sName = (item.shift_name || '').toLowerCase()
          const tName = (item.team_name || '').toLowerCase()
          const date = (item.planning_date || '').toLowerCase()
          return bName.includes(q) || sName.includes(q) || tName.includes(q) || date.includes(q)
        })
      }

      const total =
        res?.data?.total ??
        res?.data?.pagination?.total ??
        res?.pagination?.total ??
        res?.total ??
        filtered.length

      const lastPage =
        (res?.data?.last_page ??
          res?.data?.pagination?.last_page ??
          res?.pagination?.last_page ??
          res?.last_page) ||
        Math.ceil(filtered.length / perPage) ||
        1

      setItems(filtered)
      setTotalCount(total)
      setTotalPages(lastPage)
    } catch (err: any) {
      console.error('Failed to fetch manpower planning list:', err)
      setToast({ type: 'error', message: err?.message || 'Failed to fetch list' })
    } finally {
      setLoading(false)
    }
  }, [activeBranchId, shiftFilter, teamFilter, dateFilter, page, perPage, search, canList])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleBranchShiftSelected = (bId: string, sId: string) => {
    setSelectedBranchId(bId)
    setSelectedShiftId(sId)
    setSelectedItem(null)
    setViewMode('form')
  }

  const handleSaved = () => {
    setViewMode('list')
    setSelectedItem(null)
    setSelectedBranchId('')
    setSelectedShiftId('')
    setToast({ type: 'success', message: 'Target & Manpower Planning saved successfully!' })
    fetchList()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const branchId =
        deleteTarget.branch_id ||
        (deleteTarget as any).branchId ||
        (effectiveBranchId ? Number(effectiveBranchId) : undefined) ||
        (userBranchId ? Number(userBranchId) : undefined) ||
        (branchFilter ? Number(branchFilter) : undefined)

      const payload: Record<string, unknown> = {
        id: deleteTarget.id,
        uuid: deleteTarget.uuid,
        ...(branchId ? { branch_id: Number(branchId) } : {}),
      }

      const res = await apiCall<{ success?: boolean; message?: string }>('/manPowerPlanning/manpower-planning/delete', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      if (res?.success || res?.message?.toLowerCase().includes('success')) {
        setToast({ type: 'success', message: res?.message || 'Record deleted successfully' })
        fetchList()
      } else {
        setToast({ type: 'error', message: res?.message || 'Failed to delete record' })
      }
    } catch (err: any) {
      console.error('Delete error:', err)
      setToast({ type: 'error', message: err?.message || 'Failed to delete record' })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const [loadingView, setLoadingView] = useState(false)

  const handleViewDetails = async (item: ManpowerPlanningItem) => {
    setSelectedItem(item)
    setViewMode('view')

    if (item.uuid || item.id) {
      setLoadingView(true)
      try {
        const res = await apiCall<any>('/manPowerPlanning/show', {
          method: 'GET',
          encrypt: false,
          payload: {
            uuid: item.uuid || '',
            branch_id: item.branch_id || userBranchId || '',
          },
        })

        const detailedItem = res?.data ?? res
        if (detailedItem && typeof detailedItem === 'object') {
          // Show API returns line_details as flat array
          const flatLines = Array.isArray(detailedItem.line_details)
            ? detailedItem.line_details.map((l: any) => ({
              zone_id: l.zone_id,
              zone_name: l.zone_name ?? `Zone ${l.zone_id}`,
              line_id: l.line_id,
              line_name: l.line_name ?? `Line ${l.line_id}`,
              sam: l.sam,
              working_hours: l.working_hours,
              working_minutes: l.working_minutes,
              direct_manpower: l.direct_manpower,
              target_efficiency: l.target_efficiency,
              target_pcs: l.target_pcs,
            }))
            : []

          setSelectedItem((prev) => ({
            ...prev,
            ...detailedItem,
            lines: flatLines,
          }))
        }
      } catch (err) {
        console.error('Failed to fetch detailed manpower planning breakdown:', err)
      } finally {
        setLoadingView(false)
      }
    }
  }

  // Branch-style: just pass list row directly, form fetches its own line details
  const handleEdit = (item: ManpowerPlanningItem) => {
    setSelectedItem(item)
    setSelectedBranchId(String(item.branch_id || ''))
    setSelectedShiftId(String(item.shift_id || ''))
    setViewMode('form')
  }


  if (!canList && !loading) {
    return (
      <AppLayout>
        <PageHeader
          title="Target & Manpower Planning Master"
          description="Manage and schedule target efficiency, direct manpower, and line performance planning."
        />
        <div className="flex-1 flex items-center justify-center text-t-secondary font-medium p-8">
          You do not have permission to view Target & Manpower Planning.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Manpower Planning Record"
          message={`Are you sure you want to delete the record for ${deleteTarget.planning_date || 'selected shift'}? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* Render Separate Screen Views */}
      {viewMode === 'form' ? (
        <TargetManpowerForm
          initialData={selectedItem}
          initialBranchId={selectedBranchId}
          initialShiftId={selectedShiftId}
          branches={branches}
          shifts={shifts}
          onClose={() => {
            setViewMode('list')
            setSelectedItem(null)
            setSelectedBranchId('')
            setSelectedShiftId('')
          }}
          onSaved={handleSaved}
        />
      ) : viewMode === 'view' && selectedItem ? (
        <TargetManpowerView
          item={selectedItem}
          branches={branches}
          shifts={shifts}
          teams={teams}
          loading={loadingView}
          onClose={() => {
            setViewMode('list')
            setSelectedItem(null)
          }}
        />
      ) : (
        <>
          {/* Page Header */}
          <PageHeader
            title="Target & Manpower Planning Master"
            description="Manage and schedule target efficiency, direct manpower, and line performance planning."
          />

          {/* Main Table List */}
          <TargetManpowerList
            items={items}
            loading={loading}
            search={search}
            dateFilter={dateFilter}
            branchFilter={branchFilter}
            shiftFilter={shiftFilter}
            teamFilter={teamFilter}
            branchesList={branches}
            shiftsList={shifts}
            teamsList={teams}
            onSearchChange={(val) => { setSearch(val); setPage(1) }}
            onDateFilterChange={(val) => { setDateFilter(val); setPage(1) }}
            onBranchFilterChange={(val) => { setBranchFilter(val); setShiftFilter(''); setTeamFilter(''); setPage(1) }}
            onShiftFilterChange={(val) => { setShiftFilter(val); setPage(1) }}
            onTeamFilterChange={(val) => { setTeamFilter(val); setPage(1) }}
            onAdd={() => { }}
            onAddWithSelection={handleBranchShiftSelected}
            onDelete={(item) => setDeleteTarget(item)}
            onEdit={handleEdit}
            onView={handleViewDetails}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            onExport={handleExport}
            onExportPdf={handleExportPdf}
            exporting={exporting || exportingPdf}
          />
        </>
      )}
    </AppLayout>
  )
}

