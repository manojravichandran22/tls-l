'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast from '@/components/ui/Toast'
import { Download, Upload, Plus } from 'lucide-react'
import { apiCall } from '@/services/apiClient'
import type { ToastData } from '@/components/ui/Toast'
import type { MachineTypeGroup, MachineTypeItem, MachineSpec, SpecPagination, SpecCounts } from './_components/types'
import MachineHubList from './_components/MachineHubList'
import MachineHubTypeForm from './_components/MachineHubTypeForm'
import MachineHubSpecForm from './_components/MachineHubSpecForm'
import MachineHubView from './_components/MachineHubView'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'

export default function MachineHubPage() {
  const { branchId, isAdmin } = useBranchAccess()
  const { branches } = useDropdownData({ branches: true })
  const [branchFilter, setBranchFilter] = useState('')
  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : branchFilter

  useEffect(() => {
    if (!isAdmin && branchId) {
      setBranchFilter(String(branchId))
    }
  }, [isAdmin, branchId])
  const { can: canMachine } = usePermissions('Machine')
  const canMachineList = canMachine('machine.list')
  const canMachineCreate = canMachine('machine.create')
  const canMachineEdit = canMachine('machine.update')
  const canMachineDelete = canMachine('machine.delete')

  const { can: canSpec } = usePermissions('Machine-Specification')
  const canSpecList = canSpec('machine.speclist')
  const canSpecCreate = canSpec('machine_spec.create')
  const canSpecEdit = canSpec('machine_spec.update')
  const canSpecDelete = canSpec('machine_spec.delete')

  const [groups, setGroups] = useState<MachineTypeGroup[]>([])
  const [typesLoading, setTypesLoading] = useState(true)
  const [searchType, setSearchType] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [subTab, setSubTab] = useState<'Machine Specification' | 'Operation Master'>('Machine Specification')

  useEffect(() => {
    if (!canSpecList) {
      setSubTab('Operation Master')
    }
  }, [canSpecList])

  const [specs, setSpecs] = useState<MachineSpec[]>([])
  const [specsLoading, setSpecsLoading] = useState(false)

  const [showAddType, setShowAddType] = useState(false)
  const [editTypeItem, setEditTypeItem] = useState<MachineTypeItem | null>(null)
  const [showSpecModal, setShowSpecModal] = useState(false)
  const [editSpec, setEditSpec] = useState<MachineSpec | null>(null)
  const [deleteSpec, setDeleteSpec] = useState<MachineSpec | null>(null)
  const [deletingSpec, setDeletingSpec] = useState(false)

  const [deleteType, setDeleteType] = useState<MachineTypeItem | null>(null)
  const [deletingType, setDeletingType] = useState(false)

  const [toast, setToast] = useState<ToastData | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const [viewSpecUuid, setViewSpecUuid] = useState<string | null>(null)

  const [searchSpec, setSearchSpec] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [conditionFilter, setConditionFilter] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(30)
  const [pagination, setPagination] = useState<SpecPagination | null>(null)
  const [counts, setCounts] = useState<SpecCounts | null>(null)

  // ── Load grouped machine types ──
  const fetchTypes = useCallback(async () => {
    if (!canMachineList) return
    if (!effectiveBranchId) {
      setGroups([])
      setSelectedId(null)
      setTypesLoading(false)
      return
    }
    setTypesLoading(true)
    try {
      const res = await apiCall<{ success?: boolean | number; message?: string; data?: MachineTypeGroup[] }>(
        '/machine/machinelist',
        {
          method: 'GET',
          encrypt: false,
          payload: {
            search: searchType,
            status: 'ALL',
            branch_id: effectiveBranchId,
          },
        }
      )
      if (!res.success) {
        setGroups([])
        setSelectedId(null)
        return
      }
      const list = res.data ?? []
      setGroups(list)
      const allItems = list.flatMap(g => g.data ?? [])
      if (allItems.length > 0) {
        setSelectedId(prev => (prev && allItems.some(item => item.id === prev) ? prev : allItems[0].id))
      } else {
        setSelectedId(null)
      }
    } catch {
      setGroups([])
      setSelectedId(null)
    } finally {
      setTypesLoading(false)
    }
  }, [searchType, canMachineList, effectiveBranchId])

  useEffect(() => {
    if (canMachineList) {
      fetchTypes()
    }
  }, [fetchTypes, canMachineList])

  // ── Load specs for selected machine type ──
  const fetchSpecs = useCallback(async () => {
    if (!selectedId || !canSpecList) return
    setSpecsLoading(true)
    try {
      let apiStatus = ''
      if (statusFilter === 'active') apiStatus = 'active'
      else if (statusFilter === 'inactive') apiStatus = 'inactive'
      else if (statusFilter === 'maintenance') apiStatus = 'inmaintenance'

      const res = await apiCall<{
        success?: boolean | number
        message?: string
        data?: {
          rows?: MachineSpec[]
          pagination?: SpecPagination
          counts?: SpecCounts
        } | MachineSpec[]
        pagination?: SpecPagination
        counts?: SpecCounts
      }>(
        '/machine/machinespecificationlist',
        {
          method: 'GET',
          encrypt: false,
          payload: {
            machine_id: String(selectedId),
            search: searchSpec,
            status: apiStatus,
            machine_condition: conditionFilter,
            page: page,
            per_page: perPage,
            ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
          }
        }
      )
      if (!res.success) {
        setSpecs([])
        setPagination(null)
        setCounts(null)
        return
      }

      let rows: MachineSpec[] = []
      let pag: SpecPagination | null = null
      let cnt: SpecCounts | null = null

      if (res.data && !Array.isArray(res.data)) {
        rows = res.data.rows ?? []
        pag = res.data.pagination ?? res.pagination ?? null
        cnt = res.data.counts ?? res.counts ?? null
      } else if (Array.isArray(res.data)) {
        rows = res.data
        pag = res.pagination ?? null
        cnt = res.counts ?? null
      }

      setSpecs(rows)
      setPagination(pag)
      setCounts(cnt)
    } catch {
      setSpecs([])
      setPagination(null)
      setCounts(null)
    } finally {
      setSpecsLoading(false)
    }
  }, [selectedId, searchSpec, statusFilter, conditionFilter, page, perPage, canSpecList])

  useEffect(() => {
    if (subTab === 'Machine Specification' && canSpecList) fetchSpecs()
  }, [fetchSpecs, subTab, canSpecList])

  // ── Delete spec ──
  const handleDeleteSpec = async () => {
    if (!deleteSpec) return
    setDeletingSpec(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>(
        '/specification/delete',
        { payload: { uuid: deleteSpec.uuid } }
      )
      if (!res.success) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Specification deleted', type: 'success' })
      setDeleteSpec(null)
      fetchSpecs()
    } catch {
      setToast({ message: 'Failed to delete', type: 'error' })
    } finally {
      setDeletingSpec(false)
    }
  }

  // ── Delete type ──
  const handleDeleteType = async () => {
    if (!deleteType) return
    setDeletingType(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>(
        '/machine/delete',
        { payload: { uuid: deleteType.uuid } }
      )
      if (!res.success) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Machine type deleted', type: 'success' })
      setDeleteType(null)
      setSelectedId(null)
      fetchTypes()
    } catch {
      setToast({ message: 'Failed to delete', type: 'error' })
    } finally {
      setDeletingType(false)
    }
  }

  const openSpecMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow < 84 ? rect.top - 84 - 4 : rect.bottom + 4
    setMenuPos({ top, right: window.innerWidth - rect.right })
    setOpenMenuId(id)
  }

  const selected = groups.flatMap(g => g.data).find(t => t.id === selectedId) ?? null

  const handleSelectType = (id: number) => {
    setSelectedId(id)
    setSearchSpec('')
    setStatusFilter('all')
    setConditionFilter('')
    setPage(1)
  }

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {(showAddType || editTypeItem) && (
        <MachineHubTypeForm
          editType={editTypeItem}
          onClose={() => { setShowAddType(false); setEditTypeItem(null) }}
          onSaved={msg => { setToast({ message: msg, type: 'success' }); fetchTypes() }}
          onError={msg => setToast({ message: msg, type: 'error' })}
        />
      )}

      {showSpecModal && selectedId && (
        <MachineHubSpecForm
          spec={editSpec}
          machineTypeId={selectedId}
          maintenanceFlag={selected?.maintenance_flag ?? 1}
          selectedBranchId={(selected as any)?.branch?.id?.toString() ?? (selected as any)?.branch_id?.toString() ?? ''}
          selectedBranchName={(selected as any)?.branch?.branch_name ?? (selected as any)?.branch_name ?? ''}
          onClose={() => { setShowSpecModal(false); setEditSpec(null) }}
          onSaved={msg => { setToast({ message: msg, type: 'success' }); fetchSpecs() }}
          onError={msg => setToast({ message: msg, type: 'error' })}
        />
      )}

      {deleteSpec && (
        <ConfirmDialog
          title="Delete Specification"
          message={<>Delete specification <strong>{deleteSpec.machine_no}</strong>?</>}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDeleteSpec}
          onClose={() => setDeleteSpec(null)}
          loading={deletingSpec}
        />
      )}

      <MachineHubView
        uuid={viewSpecUuid}
        onClose={() => setViewSpecUuid(null)}
        onEdit={s => { setEditSpec(s); setShowSpecModal(true) }}
        onDelete={s => setDeleteSpec(s)}
        canEdit={canSpecEdit}
        canDelete={canSpecDelete}
      />

      {deleteType && (
        <ConfirmDialog
          title="Delete Machine Type"
          message={<>Delete machine type <strong>{deleteType.type_name}</strong>?</>}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDeleteType}
          onClose={() => setDeleteType(null)}
          loading={deletingType}
        />
      )}

      <PageHeader title="Machine Hub" description="Manage machine types and their specifications.">
        <div className="flex gap-2 items-center">
          <Button variant="outline"><Download size={13} /> Export</Button>
          <Button variant="outline"><Upload size={13} /> Import</Button>
          {canMachineCreate && (
            <Button variant="primary" onClick={() => setShowAddType(true)}>
              <Plus size={13} /> Add Machine Type
            </Button>
          )}
        </div>
      </PageHeader>

      <MachineHubList
        groups={groups}
        typesLoading={typesLoading}
        searchType={searchType}
        onSearchTypeChange={setSearchType}
        selectedId={selectedId}
        onSelectType={handleSelectType}
        branchFilter={branchFilter}
        onBranchFilterChange={setBranchFilter}
        branches={branches}
        isAdmin={isAdmin}
        effectiveBranchId={effectiveBranchId}
        selected={selected}
        onEditType={item => setEditTypeItem(item)}
        onDeleteType={item => setDeleteType(item)}
        subTab={subTab}
        onSubTabChange={setSubTab}
        specs={specs}
        specsLoading={specsLoading}
        onAddSpec={() => { setEditSpec(null); setShowSpecModal(true) }}
        onViewSpec={uuid => setViewSpecUuid(uuid)}
        onEditSpec={s => { setEditSpec(s); setShowSpecModal(true) }}
        onDeleteSpec={s => setDeleteSpec(s)}
        openMenuId={openMenuId}
        menuPos={menuPos}
        onOpenSpecMenu={openSpecMenu}
        onCloseMenu={() => setOpenMenuId(null)}
        searchSpec={searchSpec}
        onSearchSpecChange={setSearchSpec}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        conditionFilter={conditionFilter}
        onConditionFilterChange={setConditionFilter}
        page={page}
        onPageChange={setPage}
        perPage={perPage}
        onPerPageChange={setPerPage}
        pagination={pagination}
        counts={counts}
        canMachineList={canMachineList}
        canEditType={canMachineEdit}
        canDeleteType={canMachineDelete}
        canSpecList={canSpecList}
        canCreateSpec={canSpecCreate}
        canEditSpec={canSpecEdit}
        canDeleteSpec={canSpecDelete}
      />
    </AppLayout>
  )
}
