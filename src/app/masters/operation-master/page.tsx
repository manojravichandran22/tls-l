'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast from '@/components/ui/Toast'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import type { ToastData } from '@/components/ui/Toast'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import type { Operation, MachineTypeOption, DefectOption } from './_components/types'
import OperationList from './_components/OperationList'
import OperationForm from './_components/OperationForm'
import OperationView from './_components/OperationView'
import { useExport } from '@/hooks/useExport'
import { useExportPdf } from '@/hooks/useExportPdf'

export default function OperationMasterPage() {
  const router = useRouter()
  const [branchFilter, setBranchFilter] = useState('')
  const { branchId, isAdmin } = useBranchAccess()
  const { branches } = useDropdownData({ branches: true })

  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : branchFilter

  // ── List state ───────────────────────────────────────────────────────────────
  const [operations, setOperations] = useState<Operation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMachineTypeId, setFilterMachineTypeId] = useState('')
  const [filterSamMin, setFilterSamMin] = useState('')
  const [filterSamMax, setFilterSamMax] = useState('')
  const [filterDefectMin, setFilterDefectMin] = useState('')
  const [filterDefectMax, setFilterDefectMax] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false)
  const [editOperation, setEditOperation] = useState<Operation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Operation | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewOperation, setViewOperation] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })

  // ── Reference data ───────────────────────────────────────────────────────────
  const [machineTypes, setMachineTypes] = useState<MachineTypeOption[]>([])
  const [defectOptions, setDefectOptions] = useState<DefectOption[]>([])
  const [selected, setSelected] = useState<string[]>([])

  // ── Bootstrap reference data ─────────────────────────────────────────────────
  useEffect(() => {
    apiCall<{ success?: boolean; data?: MachineTypeOption[] }>(
      '/dropdown/machineTypeList',
      {
        method: 'GET',
        encrypt: false,
        payload: effectiveBranchId ? { branch_id: effectiveBranchId } : {},
      }
    ).then(res => setMachineTypes(Array.isArray(res.data) ? res.data : [])).catch(() => { })

    apiCall<{ success?: boolean; data?: DefectOption[] }>(
      '/dropdown/defectList',
      {
        method: 'GET',
        encrypt: false,
        payload: effectiveBranchId ? { branch_id: effectiveBranchId } : {},
      }
    ).then(res => setDefectOptions(Array.isArray(res.data) ? res.data : [])).catch(() => { })
  }, [effectiveBranchId])

  // ── Fetch operations list ────────────────────────────────────────────────────
  const fetchOperations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{
        data?: { operations?: Operation[]; pagination?: { total: number; total_pages: number } }
      }>(
        '/operation/list',
        {
          method: 'GET',
          encrypt: false,
          payload: {
            page: String(page),
            per_page: String(perPage),
            search,
            ...(filterMachineTypeId ? { machine_type: filterMachineTypeId } : {}),
            ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
          },
        }
      )
      setOperations((res.data?.operations ?? []).map((op: any) => ({
        ...op,
        branch_id: op.branch?.id ?? op.branch_id ?? null,
        branch_name: op.branch?.branch_name ?? op.branch_name ?? null,
      })))
      setTotalCount(res.data?.pagination?.total ?? 0)
      setTotalPages(res.data?.pagination?.total_pages ?? 1)
    } catch { setOperations([]) }
    finally { setLoading(false) }
  }, [page, perPage, search, filterMachineTypeId, effectiveBranchId])

  useEffect(() => { fetchOperations() }, [fetchOperations])

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const payload: Record<string, unknown> = { uuid: deleteTarget.uuid }
      if (effectiveBranchId) payload.branch_id = effectiveBranchId
      const res = await apiCall<{ success?: boolean; message?: string }>(
        '/operation/delete',
        { payload }
      )
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Operation deleted', type: 'success' })
      setDeleteTarget(null)
      fetchOperations()
    } catch { setToast({ message: 'Failed to delete operation', type: 'error' }) }
    finally { setDeleting(false) }
  }

  // ── View ─────────────────────────────────────────────────────────────────────
  const handleView = async (uuid: string) => {
    setViewLoading(true)
    setViewOperation(null)
    try {
      const res = await apiCall<{ data?: Record<string, unknown> }>(
        '/operation/show',
        {
          method: 'GET',
          encrypt: false,
          payload: {
            uuid,
            ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
          },
        }
      )
      const raw = (res as any).data ?? res
      const payload = raw?.operations ?? raw?.operation ?? raw
      setViewOperation(payload as Record<string, unknown>)
    } catch { setViewOperation(null) }
    finally { setViewLoading(false) }
  }

  // ── Context menu ─────────────────────────────────────────────────────────────
  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow < 84 ? rect.top - 84 - 4 : rect.bottom + 4
    setMenuPos({ top, right: window.innerWidth - rect.right })
    setOpenMenuId(id)
  }

  const { handleExport, exporting } = useExport<Operation>({
    apiPath: '/operation/list',
    payload: {
      search,
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
    },
    dataKey: 'operations',
    columns: [
      { key: 'code', header: 'Code', value: r => r.code || '' },
      { key: 'operation_name', header: 'Operation Name', value: r => r.operation_name || '' },
      { key: 'machine_type', header: 'Machine Type', value: r => r.machineType?.type_name || '' },
      { key: 'branch', header: 'Branch', value: r => r.branch_name || '' },
      { key: 'sam', header: 'SAM', value: r => r.sam ?? '' },
      { key: 'defects', header: 'Defects', value: r => String(r.defect_details?.length ?? r.defects?.length ?? 0) },
      { key: 'status', header: 'Status', value: r => r.is_active === 1 ? 'Active' : 'Inactive' },
    ],
    filename: 'Operations',
  })
  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/operation/list',
    payload: {
      search,
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
    },
    filename: 'Operations',
  })


  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showModal && (
        <OperationForm
          editOperation={editOperation}
          machineTypes={machineTypes}
          defectOptions={defectOptions}
          branches={branches}
          onClose={() => setShowModal(false)}
          onSave={msg => { setToast({ message: msg, type: 'success' }); fetchOperations() }}
        />
      )}

      {viewOperation !== null && (
        <OperationView
          viewData={viewLoading ? null : viewOperation}
          viewLoading={viewLoading}
          onClose={() => setViewOperation(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Operation"
          message={<>Are you sure you want to delete <strong>{deleteTarget.operation_name}</strong>?</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader
        title="Operation Master"
        description="Manage operations with machine assignments, SAM times, and linked defects."
      />

      <OperationList
        operations={operations}
        loading={loading}
        search={search}
        filterMachineTypeId={filterMachineTypeId}
        filterSamMin={filterSamMin}
        filterSamMax={filterSamMax}
        filterDefectMin={filterDefectMin}
        filterDefectMax={filterDefectMax}
        allTypes={machineTypes}
        branches={branches}
        branchFilter={branchFilter}
        onBranchChange={val => { setBranchFilter(val); setPage(1) }}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        totalCount={totalCount}
        openMenuId={openMenuId}
        menuPos={menuPos}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onFilterMachineTypeChange={val => { setFilterMachineTypeId(val); setPage(1) }}
        onFilterSamMinChange={setFilterSamMin}
        onFilterSamMaxChange={setFilterSamMax}
        onFilterDefectMinChange={setFilterDefectMin}
        onFilterDefectMaxChange={setFilterDefectMax}
        filterStatus={filterStatus}
        onFilterStatusChange={val => { setFilterStatus(val); setPage(1) }}
        onAdd={() => { setEditOperation(null); setShowModal(true) }}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onView={handleView}
        onMenuOpen={openMenu}
        onMenuClose={() => setOpenMenuId(null)}
        onEdit={op => { setEditOperation(op); setShowModal(true) }}
        onDeleteTarget={setDeleteTarget}
        onExport={handleExport}
        exporting={exporting || exportingPdf}
        onExportPdf={handleExportPdf}
        selected={selected}
        onSelectionChange={setSelected}
        onOpenImport={() => router.push('/masters/operation-master/import')}
      />
    </AppLayout>
  )
}
