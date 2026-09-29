'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import Toast from '@/components/ui/Toast'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import type { ToastData } from '@/components/ui/Toast'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import type { Defect, Cap } from './_components/types'
import DefectList from './_components/DefectList'
import DefectForm from './_components/DefectForm'
import DefectView from './_components/DefectView'
import { useExport } from '@/hooks/useExport'
import { useExportPdf } from '@/hooks/useExportPdf'

export default function DefectMasterPage() {
  const router = useRouter()
  const [branchFilter, setBranchFilter] = useState('')
  const { branchId, isAdmin } = useBranchAccess()
  const { branches } = useDropdownData({ branches: true })

  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : branchFilter

  const [defects, setDefects] = useState<Defect[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterWorkCategory, setFilterWorkCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')
  const [filterDefectName, setFilterDefectName] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [showModal, setShowModal] = useState(false)
  const [editDefect, setEditDefect] = useState<Defect | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Defect | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewDefect, setViewDefect] = useState<Defect & { severityOption?: { id: number; value: string } } | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const [workCategories, setWorkCategories] = useState<{ id: number; name: string }[]>([]);
  // Fetch work category options (workCategoryList)
  useEffect(() => {
    apiCall<any>(
      '/dropdown/workCategoryList',
      {
        method: 'GET',
        encrypt: false,
        payload: effectiveBranchId ? { branch_id: effectiveBranchId } : {},
      }
    )
      .then(res => {
        const data = res?.data ?? res
        const records = data?.records ?? data
        let list: any[] = []
        if (Array.isArray(records)) {
          list = records
        } else if (records && typeof records === 'object') {
          list = records.workCategory ?? records.work_category ?? records.workCategories ?? records.workCategoryList ?? []
        }
        const filtered = Array.isArray(list)
          ? list
              .filter((item: any) => item && typeof item === 'object' && item.type !== 'branch')
              .map((item: any) => ({
                id: Number(item.id),
                name: String(item.name ?? item.workcategory_name ?? item.work_category_name ?? item.work_category ?? ''),
              }))
              .filter(item => Boolean(item.id && item.name))
          : []
        setWorkCategories(filtered)
      })
      .catch(() => { });
  }, [effectiveBranchId]);

  // New: fetch category options via options-dropdown type=category
  const [categoryOptions, setCategoryOptions] = useState<{ id: number; value: string }[]>([]);
  // Fetch category options via options-dropdown API
  useEffect(() => {
    apiCall<any>('/dropdown/options-dropdown', {
      method: 'GET',
      encrypt: false,
      payload: {
        type: 'category',
        ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      },
    })
      .then(res => {
        const records = res?.data?.records?.category ?? [];
        setCategoryOptions(Array.isArray(records) ? records : []);
      })
      .catch(() => { console.error('Failed to fetch category options'); });
  }, [effectiveBranchId]);

  const [severityOptions, setSeverityOptions] = useState<{ id: number; value: string }[]>([])

  // Fetch severity options – API returns { success, message, data: { records: { severity: [...] } } }
  useEffect(() => {
    apiCall<any>('/dropdown/options-dropdown', {
      method: 'GET',
      encrypt: false,
      payload: {
        type: 'severity',
        ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      },
    })
      .then(res => {
        const records = res?.data?.records?.severity ?? [];
        setSeverityOptions(Array.isArray(records) ? records : []);
      })
      .catch(() => {
        console.error('Failed to fetch severity options');
      });
  }, [effectiveBranchId]);


  const { handleExport, exporting } = useExport<Defect>({
    apiPath: '/defect/list',
    payload: {
      search,
      status: filterStatus || 'all',
      category_id: filterCategory || 'all',
      severity_id: filterSeverity || 'all',
      workcategory_id: filterWorkCategory || '',
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
    },
    dataKey: 'defects',
    columns: [
      { key: 'defect_code', header: 'Defect Code', value: r => r.code || '' },
      { key: 'category_name', header: 'Category', value: r => r.category_name || r.category || '' },
      { key: 'defect_name', header: 'Defect Name', value: r => r.defect_name || '' },
      { key: 'cap', header: 'CAP', value: r => String(r.caps_count ?? r.caps?.length ?? 0) },
      { key: 'severity_name', header: 'Severity', value: r => r.severity_name || r.severity || '' },
      { key: 'workcategory_name', header: 'Work Category', value: r => r.workcategory_name || '' },
      { key: 'branch', header: 'Branch', value: r => r.branch_name || '' },
      { key: 'status', header: 'Status', value: r => (r.is_active === 1 ? 'Active' : 'Inactive') },
    ],
    filename: 'Defects',
  })
  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/defect/list',
    payload: {
      search,
      status: filterStatus || 'all',
      category_id: filterCategory || 'all',
      severity_id: filterSeverity || 'all',
      workcategory_id: filterWorkCategory || '',
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
    },
    filename: 'Defects',
  })

  // Filter states moved to top

  const fetchDefects = useCallback(async () => {
    setLoading(true)
    try {
      const payload: any = {
        page: String(page),
        per_page: String(perPage),
        search,
        status: filterStatus || 'all',
        category_id: filterCategory || 'all',
        severity_id: filterSeverity || 'all',
        workcategory_id: filterWorkCategory || '',
        ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      }
      if (filterDefectName) payload.defect_name = filterDefectName

      const res = await apiCall<{
        data?: { defects?: Defect[]; pagination?: { total: number; total_pages: number } }
      }>('/defect/list', {
        method: 'GET',
        encrypt: false,
        payload,
      })
      setDefects((res.data?.defects ?? []).map((d: any) => ({
        ...d,
        workcategory_id: d.workCategory?.id,
        workcategory_name: d.workCategory?.name,
        branch_id: d.branch?.id ?? d.branch_id ?? null,
        branch_name: d.branch?.branch_name ?? d.branch_name ?? null,
      })))
      setTotalCount(res.data?.pagination?.total ?? 0)
      setTotalPages(res.data?.pagination?.total_pages ?? 1)
    } catch {
      setDefects([])
    } finally {
      setLoading(false)
    }
  }, [page, perPage, search, filterCategory, filterSeverity, filterWorkCategory, filterStatus, filterDefectName, effectiveBranchId])

  useEffect(() => { fetchDefects() }, [fetchDefects])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/defect/delete', {
        payload: { uuid: deleteTarget.uuid },
      })
      if (res.success === false) {
        setToast({ message: res.message || 'Delete failed', type: 'error' })
        return
      }
      setToast({ message: res.message || 'Defect deleted', type: 'success' })
      setDeleteTarget(null)
      fetchDefects()
    } catch {
      setToast({ message: 'Failed to delete defect', type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = async (payload: Record<string, unknown>) => {
    const isEdit = !!editDefect
    const res = await apiCall<{ success?: boolean; message?: string }>(
      isEdit ? '/defect/update' : '/defect/create',
      { payload }
    )
    if (res.success !== false) {
      setToast({ message: res.message || (isEdit ? 'Defect updated' : 'Defect created'), type: 'success' })
      fetchDefects()
    }
    return res
  }

  const handleView = async (uuid: string) => {
    setViewLoading(true);
    try {
      // Expect the API to return a Defect object possibly with severityOption
      const res = await apiCall<Defect & { severityOption?: { id: number; value: string } }>('/defect/show', {
        method: 'GET',
        encrypt: false,
        payload: { uuid },
      });
      // API may wrap defect under data.defects, data.defect, or just data
      const raw = (res as any).data ?? res;
      const payload = raw?.defects ?? raw?.defect ?? raw;
      setViewDefect(payload as Defect & { severityOption?: { id: number; value: string } });
    } catch {
      // Keep viewDefect on error if available
    } finally {
      setViewLoading(false);
    }
  };


  const handleAddCap = async (
    defectId: number,
    cap: { cap_name: string; short_name: string; notes: string }
  ) => {
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/defect/capmap', {
        payload: {
          defect_id: String(defectId),
          cap_name: cap.cap_name,
          short_name: cap.short_name || cap.cap_name.slice(0, 10),
          notes: cap.notes,
        },
      })
      if (res.success !== false) {
        if (viewDefect?.uuid) {
          await handleView(viewDefect.uuid);
        } else {
          setViewDefect(v => (v ? { ...v, caps: [...((v.caps as Cap[]) ?? []), cap] } : v))
        }
        fetchDefects();
      }
      setToast({ message: res.message || 'CAP added', type: 'success' })
    } catch {
      setToast({ message: 'Failed to add CAP', type: 'error' })
    }
  }

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showModal && (
        <DefectForm
          defect={editDefect}
          workCategories={workCategories}
          categoryOptions={categoryOptions}
          severityOptions={severityOptions}
          branches={branches}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      <DefectView
        viewData={viewDefect !== null ? (viewLoading ? null : viewDefect) : null}
        viewLoading={viewLoading}
        onClose={() => setViewDefect(null)}
        onAddCap={handleAddCap}
        onRefresh={async () => {
          if (viewDefect?.uuid) {
            await handleView(viewDefect.uuid);
          }
          fetchDefects();
        }}
      />

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Defect"
          message={<>Are you sure you want to delete <strong>{deleteTarget.defect_name}</strong>?</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader
        title="Defect Master"
        description="Master list of defect types with severity classification and department ownership."
      />

      <DefectList
        data={defects}
        loading={loading}
        search={search}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        totalCount={totalCount}
        filterCategory={filterCategory}
        filterSeverity={filterSeverity}
        filterWorkCategory={filterWorkCategory}
        filterStatus={filterStatus}
        categoryOptions={categoryOptions}
        severityOptions={severityOptions}
        workCategories={workCategories}
        branches={branches}
        branchFilter={branchFilter}
        onBranchChange={val => { setBranchFilter(val); setPage(1) }}
        onFilterCategoryChange={setFilterCategory}
        onFilterSeverityChange={setFilterSeverity}
        onFilterWorkCategoryChange={setFilterWorkCategory}
        onFilterStatusChange={setFilterStatus}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onAdd={() => { setEditDefect(null); setShowModal(true) }}
        onEdit={row => { setEditDefect(row); setShowModal(true) }}
        onDelete={setDeleteTarget}
        onView={handleView}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onExport={handleExport}
        exporting={exporting}
        onExportPdf={handleExportPdf}
        exportingPdf={exportingPdf}
        onOpenImport={() => router.push('/masters/defect-master/import')}
        selected={selected}
        onSelectionChange={setSelected}
      />
    </AppLayout>
  )
}
