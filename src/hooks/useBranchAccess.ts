import { useMemo } from 'react'
import { getAuthUser } from '@/lib/cookies'

export function useBranchAccess() {
  return useMemo(() => {
    const user = getAuthUser()

    //console.log('Auth User:', user)

    const rawBranchId = user?.['branch_id']
    const rawRoleCode = user?.['role_code']

    const branchId =
      rawBranchId == null ? null : Number(rawBranchId)

    const roleCode =
      rawRoleCode == null ? null : Number(rawRoleCode)

    const isAdmin = branchId == null

    //console.log({branchId,roleCode,isAdmin,})

    return {
      user,
      branchId,
      roleCode,
      isAdmin,
    }
  }, [])
}