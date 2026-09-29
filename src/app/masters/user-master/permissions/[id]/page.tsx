'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'
import { apiCall } from '@/services/apiClient'
import { Save } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import SummaryCard from '@/components/ui/SummaryCard'
import PermissionTable, { type PermissionGroup } from '@/components/ui/PermissionTable'
import { useBranchAccess } from '@/hooks/useBranchAccess'

interface User {
  uuid: string
  name: string
  role: number
  emp_code: string
  id?: number
}

export default function UserPermissionsPage() {
  const { id: uuid } = useParams()
  const router = useRouter()
  const { branchId, user: loggedInUser } = useBranchAccess()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [numericUserId, setNumericUserId] = useState<number | null>(null)
  const [groups, setGroups] = useState<PermissionGroup[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [initialPermissions, setInitialPermissions] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch User details by matching uuid in userlist
      const userListRes = await apiCall<any>('/user/userlist', {
        method: 'POST',
        encrypt: false,
        payload: { page: '1', per_page: '1000' },
      })

      const rawUserList = userListRes?.data || userListRes
      const userList: User[] = Array.isArray(rawUserList)
        ? rawUserList
        : Array.isArray(rawUserList?.records)
          ? rawUserList.records
          : Array.isArray(rawUserList?.data)
            ? rawUserList.data
            : []

      let matchedUser: User | null = null
      if (Array.isArray(userList)) {
        matchedUser = userList.find((u) => u.uuid === uuid || String(u.id) === String(uuid)) || null
      }

      let userId: number | null = null

      if (matchedUser) {
        setUser(matchedUser)
        if (matchedUser.id) {
          userId = Number(matchedUser.id)
        }
      }
      setNumericUserId(userId)

      const effectiveBranchId =
        (matchedUser as any)?.branch_id ??
        (matchedUser as any)?.branch?.id ??
        branchId ??
        (loggedInUser as any)?.branch_id ??
        1

      // 2. Fetch All Permission Groups
      const groupsRes = await apiCall<any>('/permission/permission-groups', {
        method: 'GET',
        encrypt: false,
        payload: { page: '1', per_page: '100', branch_id: String(effectiveBranchId) },
      })

      if (groupsRes.success) {
        let groupsData = groupsRes.data || groupsRes
        if (!Array.isArray(groupsData) && groupsData.data) groupsData = groupsData.data

        const normalizedGroups = (Array.isArray(groupsData) ? groupsData : []).map((g: any) => ({
          ...g,
          Permissions: (g.Permissions || g.permissions || []).map((p: any) => ({
            ...p,
            id: Number(p.id),
          })),
        }))
        setGroups(normalizedGroups)
      }

      // 3. Fetch Assigned Permissions for this user using GET /userpermission/list
      if (userId) {
        const assignedRes = await apiCall<any>('/userpermission/list', {
          method: 'GET',
          encrypt: false,
          payload: {
            user_id: userId,
            branch_id: String(effectiveBranchId),
          },
        })

        if (assignedRes.success) {
          const data = assignedRes.data || assignedRes
          const perms = Array.isArray(data)
            ? data
            : data.permissions || data.Permissions || data.data || []

          const existingIds = perms
            .map((p: any) => {
              const pId = typeof p === 'object' ? p.permission_id || p.id : p
              return Number(pId)
            })
            .filter((id: number) => !isNaN(id))

          setSelectedPermissions(existingIds)
          setInitialPermissions(existingIds)
        }
      }
    } catch (error) {
      console.error('Failed to load user permission data:', error)
      setToast({ message: 'Failed to load user permission data', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [uuid])

  const handleTogglePermission = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleToggleGroup = (group: PermissionGroup, checked: boolean) => {
    const groupPermissionIds = group.Permissions.map((p) => p.id)
    if (checked) {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...groupPermissionIds])))
    } else {
      setSelectedPermissions((prev) => prev.filter((id) => !groupPermissionIds.includes(id)))
    }
  }

  const handleSave = async () => {
    if (!user || !numericUserId) {
      setToast({ message: 'User numeric ID not found. Cannot save permissions.', type: 'error' })
      return
    }
    setSaving(true)
    try {
      const currentSelected = selectedPermissions.map((id) => Number(id))
      const initial = initialPermissions.map((id) => Number(id))

      const added = currentSelected.filter((id) => !initial.includes(id))
      const removed = initial.filter((id) => !currentSelected.includes(id))

      if (added.length === 0 && removed.length === 0) {
        setToast({ message: 'No changes detected', type: 'success' })
        setTimeout(() => router.push('/masters/user-master'), 1000)
        return
      }

      const effectiveBranchId =
        (user as any)?.branch_id ??
        (user as any)?.branch?.id ??
        branchId ??
        (loggedInUser as any)?.branch_id ??
        1

      let res
      if (initial.length === 0) {
        // FIRST TIME: Use Create with all selected permissions
        res = await apiCall<{ success: boolean; message: string }>('/userpermission/create', {
          payload: {
            user_id: Number(numericUserId),
            permission_id: currentSelected,
            branch_id: Number(effectiveBranchId),
          },
        })
      } else {
        // EDITING: Update with the FULL list of permissions
        res = await apiCall<{ success: boolean; message: string }>('/userpermission/update', {
          payload: {
            user_id: Number(numericUserId),
            permission_id: currentSelected,
            branch_id: Number(effectiveBranchId),
          },
        })
      }

      if (res.success) {
        setToast({ message: res.message || 'Permissions updated successfully', type: 'success' })
        setTimeout(() => {
          router.push('/masters/user-master')
        }, 1500)
      } else {
        setToast({ message: res.message || 'Failed to update permissions', type: 'error' })
      }
    } catch (error) {
      console.error('Failed to save user permissions:', error)
      setToast({ message: 'Failed to save permissions', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groups
    const q = searchTerm.toLowerCase()
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.guard_name && g.guard_name.toLowerCase().includes(q)) ||
        g.Permissions.some(
          (p) =>
            p.display_name.toLowerCase().includes(q) ||
            (p.guard_name && p.guard_name.toLowerCase().includes(q))
        )
    )
  }, [groups, searchTerm])

  return (
    <AppLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="User Permissions"
        description={`Manage custom permissions for user: ${user?.name || '...'} | Selected: ${selectedPermissions.length}`}
      />

      <div className="grid grid-cols-1 gap-6">
        <SummaryCard
          items={[
            { label: 'User Name', value: user?.name },
            { label: 'Employee Code', value: <span className="font-mono">{user?.emp_code}</span> },
          ]}
          actions={
            <>
              <Button variant="outline" onClick={() => router.back()} disabled={saving}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={saving}
                leftIcon={<Save size={16} />}
                disabled={!numericUserId}
              >
                Save Changes
              </Button>
            </>
          }
        />

        <PermissionTable
          groups={filteredGroups}
          selectedIds={selectedPermissions}
          onTogglePermission={handleTogglePermission}
          onToggleGroup={handleToggleGroup}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>
    </AppLayout>
  )
}
