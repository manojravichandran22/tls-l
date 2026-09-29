'use client'

import { useState, useEffect, useMemo } from 'react'
import { getAuthUser } from '@/lib/cookies'

interface PermissionItem {
  id: number
  name: string
  display_name: string
  guard_name: string
}

interface PermissionGroup {
  group_id: number
  group_name: string
  permissions: PermissionItem[]
}

export function normalizeGroupName(name: string): string {
  return (name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function normalizeActionName(name: string): string {
  return (name ?? '').toLowerCase().replace(/[^a-z0-9.]/g, '')
}

export function usePermissions(groupName: string) {
  const [user, setUser] = useState<Record<string, unknown> | null>(() => {
    if (typeof window !== 'undefined') {
      return getAuthUser()
    }
    return null
  })

  useEffect(() => {
    const syncUser = () => setUser(getAuthUser())
    syncUser()
    window.addEventListener('storage', syncUser)
    window.addEventListener('auth_user_updated', syncUser)
    return () => {
      window.removeEventListener('storage', syncUser)
      window.removeEventListener('auth_user_updated', syncUser)
    }
  }, [])

  return useMemo(() => {
    // Administrator (role_code 100) gets all permissions — no restrictions
    const roleCode = user?.role_code
    const isSuperAdmin = Number(roleCode) === 100 || roleCode === 100

    if (isSuperAdmin) {
      return { can: (_: string) => true, permSet: new Set<string>() }
    }

    // All other users — check their assigned permissions only (normalized & case-insensitive)
    const groups: PermissionGroup[] = (user?.permissions as PermissionGroup[]) ?? []
    const targetKey = normalizeGroupName(groupName)
    const group = groups.find(g => normalizeGroupName(g.group_name) === targetKey)
    
    const rawNames = group?.permissions.map(p => p.name) ?? []
    const permSet = new Set<string>()
    rawNames.forEach(n => {
      permSet.add(n)
      permSet.add(normalizeActionName(n))
    })

    return {
      can: (action: string) => permSet.has(action) || permSet.has(normalizeActionName(action)),
      permSet,
    }
  }, [groupName, user])
}
