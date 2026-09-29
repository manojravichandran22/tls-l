'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'
import { apiCall } from '@/services/apiClient'
import { PER_PAGE } from '@/lib/constants'

import { type ReworkQrRecord } from './_components/types'
import ReworkQrList from './_components/ReworkQrList'
import ReworkQrForm from './_components/ReworkQrForm'

import { usePermissions } from '@/hooks/usePermissions'
import { Lock } from 'lucide-react'

export default function ReworkQrGeneratePage() {
  const { can } = usePermissions('Qrgeneration')
  const canList = can('reworkqr.list')
  const canCreate = can('reworkqr.create')

  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const { branches } = useDropdownData({ branches: true })

  const [records, setRecords] = useState<ReworkQrRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [toast, setToast] = useState<ToastData | null>(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(PER_PAGE)

  // Create Modal State
  const [showModal, setShowModal] = useState(false)

  // Auto initialize branch filter
  useEffect(() => {
    if (userBranchId && !branchFilter) {
      setBranchFilter(String(userBranchId))
    }
  }, [userBranchId, branchFilter])

  // Fetch List API: POST /reworkQr/reworkqrlist
  const fetchReworkQrList = useCallback(async () => {
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {}
      const selectedBranch = !isAdmin && userBranchId ? String(userBranchId) : branchFilter
      if (selectedBranch) {
        payload.branch_id = selectedBranch
      }

      const res = await apiCall<any>('/reworkQr/reworkqrlist', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      const data = res?.data ?? res
      const list = data?.records ?? (Array.isArray(data) ? data : [])
      setRecords(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to fetch rework QR list:', err)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [branchFilter, isAdmin, userBranchId])

  useEffect(() => {
    if (canList) {
      fetchReworkQrList()
    }
  }, [fetchReworkQrList, canList])

  const handleSuccess = (msg: string) => {
    setToast({ message: msg, type: 'success' })
    setShowModal(false)
    fetchReworkQrList()
  }

  // Access check guard
  if (!canList) {
    return (
      <AppLayout fixedHeight>
        <PageHeader
          title="Rework QR Code Generation"
          description="Generate and manage Rework QR code tags."
        />
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 bg-card rounded-card border border-table-line">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-3">
            <Lock size={24} />
          </div>
          <h3 className="text-base font-bold text-t-primary mb-1">Access Restricted</h3>
          <p className="text-xs text-t-lighter max-w-md">
            You do not have permission to view Rework QR Code Generation. Please contact your administrator if you need access.
          </p>
        </div>
      </AppLayout>
    )
  }

  // Filtered records by search term
  const filteredRecords = records.filter(r => {
    if (!search.trim()) return true
    const code = (r.qr_code || r.code || (r.qr !== undefined ? String(r.qr) : '')).toLowerCase()
    const branchName = (r.branch_name || r.branch?.branch_name || '').toLowerCase()
    const term = search.toLowerCase()
    return code.includes(term) || branchName.includes(term)
  })

  const totalCount = filteredRecords.length
  const totalPages = Math.ceil(totalCount / perPage) || 1
  const paginatedData = filteredRecords.slice((page - 1) * perPage, page * perPage)

  return (
    <AppLayout fixedHeight>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Rework QR Code Generation"
        description="Generate and manage Rework QR code tags."
      />

      {showModal && (
        <ReworkQrForm
          branches={branches}
          userBranchId={userBranchId}
          isAdmin={isAdmin}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      <ReworkQrList
        records={paginatedData}
        loading={loading}
        search={search}
        branchFilter={branchFilter}
        branches={branches}
        isAdmin={isAdmin}
        userBranchId={userBranchId}
        canCreate={canCreate}
        page={page}
        perPage={perPage}
        totalCount={totalCount}
        totalPages={totalPages}
        onSearchChange={val => { setSearch(val); setPage(1); }}
        onBranchChange={val => { setBranchFilter(val); setPage(1); }}
        onAdd={() => setShowModal(true)}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />
    </AppLayout>
  )
}
