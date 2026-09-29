'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormSelect from '@/components/ui/FormSelect'
import type { BranchOption, ShiftOption } from '@/services/dropdownService'
import { apiCall } from '@/services/apiClient'

interface BranchShiftSelectModalProps {
  branches: BranchOption[]
  shifts: ShiftOption[]
  onClose: () => void
  onSelect: (branchId: string, shiftId: string) => void
}

export default function BranchShiftSelectModal({
  branches = [],
  shifts = [],
  onClose,
  onSelect,
}: BranchShiftSelectModalProps) {
  const [date, setDate] = useState<string>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [branchId, setBranchId] = useState<string>('')
  const [shiftId, setShiftId] = useState<string>('')
  const [branchShifts, setBranchShifts] = useState<{ shift_id: number; shift_name: string }[]>([])
  const [loadingShifts, setLoadingShifts] = useState(false)

  useEffect(() => {
    if (!branchId || !date) {
      setBranchShifts([])
      return
    }

    setLoadingShifts(true)
    apiCall<any>('/dropdown/shifts-by-branch', {
      method: 'GET',
      encrypt: false,
      payload: {
        planning_date: date,
        branch_id: branchId,
      },
    })
      .then((res) => {
        const rawData = res?.data
        let list: { shift_id: number; shift_name: string }[] = []
        if (rawData && Array.isArray(rawData.shifts)) {
          list = rawData.shifts
        } else if (Array.isArray(rawData)) {
          list = rawData
        } else if (Array.isArray(res)) {
          list = res
        }
        setBranchShifts(list)
      })
      .catch(() => setBranchShifts([]))
      .finally(() => setLoadingShifts(false))
  }, [branchId, date])

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault()
    if (branchId && shiftId) {
      onSelect(branchId, shiftId)
    }
  }

  const shiftOptions =
    branchShifts.length > 0
      ? branchShifts.map((s) => ({ label: s.shift_name, value: String(s.shift_id) }))
      : shifts.map((s) => ({
          label: s.shift_name ? `${s.shift_name} (${s.type || 'Shift'})` : `Shift ${s.id}`,
          value: String(s.id),
        }))

  return (
    <Modal title="Add Target & Manpower Planning" onClose={onClose} size="md">
      <form onSubmit={handleProceed} className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-t-body">Planning Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setShiftId('')
              }}
              className="h-9 px-3 text-sm text-t-secondary bg-input border border-input-line rounded-input outline-none focus:border-accent"
              required
            />
          </div>

          <FormSelect
            label="Branch"
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value)
              setShiftId('')
            }}
            options={branches.map((b) => ({ label: b.branch_name, value: String(b.id) }))}
            placeholder="Select Branch"
            required
          />

          <FormSelect
            label="Shift"
            value={shiftId}
            onChange={(e) => setShiftId(e.target.value)}
            options={shiftOptions}
            placeholder={
              !branchId
                ? 'Select Branch First'
                : loadingShifts
                ? 'Loading shifts...'
                : 'Select Shift'
            }
            required
            disabled={!branchId || loadingShifts}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!branchId || !shiftId}
          >
            Proceed to Planning
          </Button>
        </div>
      </form>
    </Modal>
  )
}


