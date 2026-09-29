'use client'

import { useEffect, useState, useCallback } from 'react'
import ViewModal, { type ViewField } from '@/components/ui/ViewModal'
import { apiCall } from '@/services/apiClient'
import Toast, { type ToastData } from '@/components/ui/Toast'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'

interface StyleSummaryViewModalProps {
  uuid: string | null
  onClose: () => void
}

export default function StyleSummaryViewModal({ uuid, onClose }: StyleSummaryViewModalProps) {
  const { can } = usePermissions('Operation-Bulletin')
  const canView = can('operationbuiltin.stylesummaryview')

  const { branchId, isAdmin } = useBranchAccess()
  const effectiveBranchId = !isAdmin && branchId ? String(branchId) : ''

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [toast, setToast] = useState<ToastData | null>(null)

  const fetchData = useCallback(async () => {
    if (!uuid || !canView) return
    setLoading(true)
    try {
      const res = await apiCall<any>('/operationbullatin/viewstylesummary', {
        method: 'GET',
        encrypt: false,
        payload: {
          uuid,
          ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
        }
      })
      if (res?.data) {
        setData(res.data)
      } else {
        setData(res)
      }
    } catch {
      setToast({ message: 'Failed to fetch style summary details', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [uuid, canView])

  useEffect(() => {
    if (canView) {
      fetchData()
    }
  }, [fetchData, canView])

  if (!uuid || !canView) return null

  const fields: ViewField[] = [
    { label: 'Basic Details', section: true },
    { label: 'Buyer', value: data?.buyer },
    { label: 'Style No.', value: data?.style_no },
    { label: 'Style Name', value: data?.style_name },
    { label: 'Total SAM', value: data?.total_sam },
    { label: 'Manning', section: true },
    { label: 'Req Manning', value: data?.req_manning },
    { label: 'Allocated Manning', value: data?.allocated_manning },
    { label: 'Targets (100%)', section: true },
    { label: 'Req 100%/Hr', value: data?.req_target_hun_hr },
    { label: 'Req 100%/Day', value: data?.req_target_hun_day },
    { label: 'Alloc 100%/Hr', value: data?.all_target_hun_hr },
    { label: 'Alloc 100%/Day', value: data?.all_target_hun_day },
    { label: 'Targets (60%)', section: true },
    { label: 'Req 60%/Hr', value: data?.req_target_six_hr },
    { label: 'Req 60%/Day', value: data?.req_target_six_day },
    { label: 'Alloc 60%/Hr', value: data?.all_target_six_hr },
    { label: 'Alloc 60%/Day', value: data?.all_target_six_day },
  ]

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ViewModal
        title="Style Summary Details"
        fields={fields}
        loading={loading}
        onClose={onClose}
        size="md"
      />
    </>
  )
}
