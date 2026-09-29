'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'
import PageHeader from '@/components/ui/PageHeader'
import { useSortableData } from '@/hooks/useSortableData'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'
import { type User } from './_components/types'
import UserList from './_components/UserList'
import UserView from './_components/UserView'

export default function UserMasterPage() {
  const router = useRouter()
  const { branchId, isAdmin } = useBranchAccess()
  const { branches } = useDropdownData({ branches: true })
  const [branchFilter, setBranchFilter] = useState('')

  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : branchFilter

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(PER_PAGE)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [roles, setRoles] = useState<Record<number, string>>({})
  const [viewData, setViewData] = useState<User | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  // Debounce search input to avoid API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch roles for mapping role codes to role names
  useEffect(() => {
    apiCall<{ data?: { roles?: { role: number; name: string }[] } }>('/role/list', {
      method: 'GET',
      encrypt: false,
      payload: {
        page: '1',
        per_page: '100',
        search: '',
        status: 'all',
        ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      },
    })
      .then((res) => {
        const map: Record<number, string> = {}
        res.data?.roles?.forEach((r) => { map[r.role] = r.name })
        setRoles(map)
      })
      .catch((err) => console.error('Failed to fetch roles:', err))
  }, [effectiveBranchId])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiCall<{
        success?: boolean
        message?: string
        data?: User[] | { data?: User[]; pagination?: { total: number; total_pages: number } }
        pagination?: { total: number; total_pages: number }
      }>('/user/userlist', {
        method: 'POST',
        encrypt: false,
        payload: {
          page: String(page),
          per_page: String(perPage),
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
        },
      })

      const raw = res.data
      const userList = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.records)
          ? (raw as any).records
          : Array.isArray((raw as any)?.data)
            ? (raw as any).data
            : []

      const pagination = (raw as any)?.pagination ?? (res as any)?.pagination

      setUsers(userList)
      setTotalCount(pagination?.total ?? userList.length)
      setTotalPages(pagination?.total_pages ?? (pagination?.total ? Math.ceil(pagination.total / perPage) : 1))
    } catch (err) {
      console.error('Failed to fetch users:', err)
      setUsers([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, perPage, debouncedSearch, effectiveBranchId])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const safeUsers = Array.isArray(users) ? users : []
  const { sortedData } = useSortableData(safeUsers, {
    name: (row) => (row as User).name,
    emp_code: (row) => (row as User).emp_code,
    role: (row) => roles[(row as User).role] ?? String((row as User).role),
  })

  const handleView = (user: User) => {
    setViewLoading(true)
    setViewData(user)
    setTimeout(() => setViewLoading(false), 200)
  }

  return (
    <AppLayout fixedHeight>
      <UserView
        viewData={viewData}
        viewLoading={viewLoading}
        roles={roles}
        onClose={() => setViewData(null)}
      />

      <PageHeader
        title="Users Master"
        description="View system users, employee roles, and access configuration."
      />

      <UserList
        users={Array.isArray(sortedData) ? sortedData : []}
        loading={loading}
        search={search}
        roles={roles}
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onSearchChange={val => { setSearch(val); setPage(1) }}
        onView={handleView}
        onPermissions={uuid => router.push(`/masters/user-master/permissions/${uuid}`)}
        onPageChange={setPage}
        onPerPageChange={p => { setPerPage(p); setPage(1) }}
        selected={selected}
        onSelectionChange={setSelected}
        isAdmin={isAdmin}
        branches={branches}
        branchFilter={branchFilter}
        onBranchFilterChange={b => { setBranchFilter(b); setPage(1) }}
        effectiveBranchId={effectiveBranchId}
      />
    </AppLayout>
  )
}
