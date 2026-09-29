'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { apiCall, apiUpload } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import Toast, { type ToastData } from '@/components/ui/Toast'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { type Employee, type BranchOption, type RoleOption, type DeptOption } from './_components/types'
import EmployeeList from './_components/EmployeeList'
import EmployeeForm from './_components/EmployeeForm'
import EmployeeView from './_components/EmployeeView'
import { useExport } from '@/hooks/useExport'

import EmployeeImportView from './_components/EmployeeImportView'

import { useRouter } from 'next/navigation'

export default function EmployeeMasterPage() {
  const router = useRouter()
  const [branchFilter, setBranchFilter] = useState('')
  const { branchId, isAdmin } = useBranchAccess()

  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : branchFilter

  const { branches, roles, departments: allDepts } = useDropdownData({
    branches: true,
    roles: true,
    departments: true,
    branchId: effectiveBranchId || null,
  })

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDepartmentId, setFilterDepartmentId] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [deleting, setDeleting] = useState(false)
  const [importing, setImporting] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editEmp, setEditEmp] = useState<Employee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [viewData, setViewData] = useState<Record<string, unknown> | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  // Map selected row-keys (string IDs) → actual UUIDs
  const selectedUuids = employees
    .filter(emp => selected.includes(String(emp.id)))
    .map(emp => emp.uuid)

  const { handleExport, exporting } = useExport<Employee>({
    apiPath: '/employee/list',
    payload: {
      search,
      branch_id: effectiveBranchId,
      role: filterRole,
      name: '',
      ...(filterDepartmentId ? { department_id: filterDepartmentId } : {}),
      ...(filterStatus ? { status: filterStatus } : {}),
      ...(selectedUuids.length > 0 ? { check_uuid: selectedUuids } : {}),
    },
    dataKey: 'employees',
    columns: [
      { key: 'emp_code', header: 'Employee Code', value: r => r.code || '' },
      { key: 'name', header: 'First Name', value: r => r.name || '' },
      { key: 'name', header: 'Last Name', value: r => r.last_name || '' },
      { key: 'mobile', header: 'Mobile', value: r => r.mobile || '' },
      { key: 'email', header: 'Email', value: r => r.email || '' },
      { key: 'role', header: 'Role', value: r => r.roleInfo?.name || r.role || '' },
      { key: 'department', header: 'Department', value: r => r.department?.name || '' },
      { key: 'team', header: 'Team', value: r => r.team?.team_name || r.team_name || '' },
      { key: 'branch', header: 'Branch', value: r => r.branch?.branch_name || '' },
      { key: 'designation', header: 'Designation', value: r => r.designation?.name || '' },
      { key: 'join_date', header: 'Join Date', value: r => r.join_date || '' },
      { key: 'status', header: 'Status', value: r => r.is_active === 1 ? 'Active' : 'Inactive' },
    ],
    filename: 'Employees',
  })

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const payload: any = { page: String(page), per_page: String(perPage), search, branch_id: effectiveBranchId, role: filterRole, name: '' }
      if (filterDepartmentId) payload.department_id = filterDepartmentId
      if (filterStatus) payload.status = filterStatus

      const res = await apiCall<{
        data?: { employees?: Employee[]; pagination?: { total: number; total_pages: number } }
      }>('/employee/list', {
        method: 'GET', encrypt: false,
        payload,
      })
      const data = res.data
      setEmployees(data?.employees ?? [])
      setTotalCount(data?.pagination?.total ?? 0)
      setTotalPages(data?.pagination?.total_pages ?? 1)
    } catch { setEmployees([]) }
    finally { setLoading(false) }
  }, [search, filterDepartmentId, filterRole, filterStatus, effectiveBranchId, page, perPage])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const payload: Record<string, unknown> = { uuid: deleteTarget.uuid }
      if (!isAdmin && branchId) payload.branch_id = String(branchId)
      const res = await apiCall<{ success?: boolean; message?: string }>('/employee/delete', { payload })
      if (res.success === false) { setToast({ message: res.message || 'Delete failed', type: 'error' }); return }
      setToast({ message: res.message || 'Employee deleted successfully', type: 'success' })
      setDeleteTarget(null)
      fetchEmployees()
    } catch { setToast({ message: 'Failed to delete employee', type: 'error' }) }
    finally { setDeleting(false) }
  }

  const handleSaved = (msg: string) => { setToast({ message: msg, type: 'success' }); fetchEmployees() }

  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiUpload<{ success?: boolean; message?: string }>('/excel/employee/import', fd)
      if (res.success === false) {
        setToast({ message: res.message || 'Import failed', type: 'error' })
        return
      }
      setToast({ message: res.message || 'Employees imported successfully', type: 'success' })
      fetchEmployees()
    } catch {
      setToast({ message: 'Failed to import employees', type: 'error' })
    } finally {
      setImporting(false)
    }
  }

  const handleView = async (uuid: string) => {
    setViewLoading(true); setViewData({})
    try {
      const payload: Record<string, unknown> = { uuid }
      if (!isAdmin && branchId) payload.branch_id = String(branchId)
      const res = await apiCall<{ data?: Record<string, unknown> }>('/employee/show', { method: 'GET', encrypt: false, payload })
      setViewData(res.data ?? res)
    } catch { setViewData(null) }
    finally { setViewLoading(false) }
  }

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <EmployeeView
        viewData={viewData}
        viewLoading={viewLoading}
        onClose={() => setViewData(null)}
      />

      {showModal && (
        <EmployeeForm
          emp={editEmp}
          branches={branches}
          roles={roles}
          allDepts={allDepts}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Employee"
          message={<>Are you sure you want to delete <strong>{deleteTarget.name} {deleteTarget.last_name}</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
          variant="danger"
        />
      )}

      <PageHeader title="Employee Master" description="Manage employees, roles, departments and branch assignments." />

      <EmployeeList
        employees={employees}
        loading={loading}
        search={search}
        filterDepartmentId={filterDepartmentId}
        filterRole={filterRole}
        filterStatus={filterStatus}
        branchFilter={branchFilter}
        branches={branches}
        allDepts={allDepts}
        roles={roles}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onFilterDepartmentChange={val => { setFilterDepartmentId(val); setPage(1) }}
        onFilterRoleChange={val => { setFilterRole(val); setPage(1) }}
        onFilterStatusChange={val => { setFilterStatus(val); setPage(1) }}
        onBranchChange={val => {
          setBranchFilter(val)
          setFilterDepartmentId('')
          setFilterRole('')
          setPage(1)
        }}
        onAdd={() => { setEditEmp(null); setShowModal(true) }}
        onEdit={emp => { setEditEmp(emp); setShowModal(true) }}
        onDelete={emp => setDeleteTarget(emp)}
        onView={handleView}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        onExport={handleExport}
        exporting={exporting}
        onImport={handleImport}
        onOpenImport={() => router.push('/masters/employee-master/import')}
        importing={importing}
        selected={selected}
        onSelectionChange={setSelected}
      />
    </AppLayout>
  )
}
