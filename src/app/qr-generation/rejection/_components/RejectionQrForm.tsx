'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import FormSelect from '@/components/ui/FormSelect'
import FormInput from '@/components/ui/FormInput'
import Button from '@/components/ui/Button'
import { QrCode } from 'lucide-react'
import { apiCall } from '@/services/apiClient'

interface BranchOption {
  id: number | string
  branch_name: string
}

interface RejectionQrFormProps {
  branches: BranchOption[]
  userBranchId?: number | string | null
  isAdmin: boolean
  onClose: () => void
  onSuccess: (msg: string) => void
}

export default function RejectionQrForm({
  branches,
  userBranchId,
  isAdmin,
  onClose,
  onSuccess,
}: RejectionQrFormProps) {
  const [branchId, setBranchId] = useState(() => {
    if (!isAdmin && userBranchId) return String(userBranchId)
    return ''
  })
  const [qrCount, setQrCount] = useState('')
  const [errors, setErrors] = useState<{ branch_id?: string; qr?: string }>({})
  const [touched, setTouched] = useState<{ branch_id?: boolean; qr?: boolean }>({})
  const [creating, setCreating] = useState(false)
  const [serverError, setServerError] = useState('')

  const validate = () => {
    const errs: { branch_id?: string; qr?: string } = {}
    if (!branchId) {
      errs.branch_id = 'Please select a Branch'
    }
    const countNum = Number(qrCount)
    if (!qrCount) {
      errs.qr = 'QR code count is required'
    } else if (isNaN(countNum) || countNum < 1) {
      errs.qr = 'Please enter a valid QR count (minimum 1)'
    }
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ branch_id: true, qr: true })
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setCreating(true)
    setServerError('')
    try {
      const res = await apiCall<any>('/rejectionQr/rejectionqrcreate', {
        method: 'POST',
        encrypt: false,
        payload: {
          branch_id: Number(branchId),
          qr: Number(qrCount),
        },
      })

      if (res?.success === false) {
        setServerError(res?.message || res?.error || 'Failed to create rejection QR')
        return
      }

      onSuccess(res?.message || 'Rejection QR code generated successfully!')
    } catch (err: any) {
      console.error('Error creating rejection QR:', err)
      setServerError(err?.message || 'Failed to generate rejection QR. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal
      onClose={() => { if (!creating) onClose() }}
      title="Rejection QR Code Generation"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {serverError && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-medium">
            {serverError}
          </div>
        )}

        <FormSelect
          label="Branch"
          value={branchId}
          onChange={(e) => {
            setBranchId(e.target.value)
            if (touched.branch_id) {
              setErrors(prev => ({ ...prev, branch_id: e.target.value ? undefined : 'Please select a Branch' }))
            }
          }}
          onBlur={() => {
            setTouched(prev => ({ ...prev, branch_id: true }))
            setErrors(prev => ({ ...prev, branch_id: branchId ? undefined : 'Please select a Branch' }))
          }}
          options={branches.map(b => ({ value: String(b.id), label: b.branch_name }))}
          placeholder="Select Branch"
          disabled={!isAdmin && Boolean(userBranchId)}
          error={errors.branch_id}
          touched={touched.branch_id}
          required
        />

        <FormInput
          label="QR Code Count (qr)"
          type="number"
          min={1}
          value={qrCount}
          onChange={(e) => {
            setQrCount(e.target.value)
            if (touched.qr) {
              const num = Number(e.target.value)
              const msg = !e.target.value ? 'QR code count is required' : (isNaN(num) || num < 1 ? 'Please enter a valid QR count (minimum 1)' : undefined)
              setErrors(prev => ({ ...prev, qr: msg }))
            }
          }}
          onBlur={() => {
            setTouched(prev => ({ ...prev, qr: true }))
            const num = Number(qrCount)
            const msg = !qrCount ? 'QR code count is required' : (isNaN(num) || num < 1 ? 'Please enter a valid QR count (minimum 1)' : undefined)
            setErrors(prev => ({ ...prev, qr: msg }))
          }}
          placeholder="Enter QR count (e.g. 3)"
          error={errors.qr}
          touched={touched.qr}
          required
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-table-line">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={creating}
            leftIcon={<QrCode size={15} />}
          >
            Generate QR
          </Button>
        </div>
      </form>
    </Modal>
  )
}
