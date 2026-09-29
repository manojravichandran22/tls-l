'use client'

import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { HistoryRecord } from './types'

interface Props {
  record: HistoryRecord
  onClose: () => void
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <span className="text-t-lighter block text-xs mb-0.5">{label}</span>
      <span className="text-t-body text-sm">{value ?? '-'}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: number }) {
  if (status === 1)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Active</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Inactive</span>
}

function formatDate(val: string | null | undefined): string {
  if (!val || val === '—' || val === '-') return '-'
  const str = String(val).trim().slice(0, 10)
  const parts = str.split(/[-/]/)
  if (parts.length === 3) {
    let [y, m, d] = parts
    if (y.length === 4) {
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
    } else if (d.length === 4) {
      return `${y.padStart(2, '0')}/${m.padStart(2, '0')}/${d}`
    }
  }
  return str
}

export default function PreventiveMaintenanceHistoryDetail({ record, onClose }: Props) {
  return (
    <Modal
      title="History Detail"
      onClose={onClose}
      size="lg"
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      {/* Machine Info */}
      <div className="mb-5 p-4 rounded-input border border-input-line bg-table-head/40">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-t-light mb-3">
          Machine Info
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Machine Type" value={record.machineType?.type_name} />
          <Field label="Brand" value={record.machine?.brand} />
          <Field label="Branch" value={record.branch?.branch_name ?? record.branch_name ?? (record.branch as any)?.name} />
          <div>
            <span className="text-t-lighter block text-xs mb-0.5">Status</span>
            <StatusBadge status={record.status} />
          </div>
        </div>
      </div>

      {/* Service Dates */}
      <div className="mb-5 p-4 rounded-input border border-input-line bg-table-head/40">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-t-light mb-3">
          Service Dates
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Last Service Date" value={formatDate(record.last_service_date)} />
          <Field label="Next Service Date" value={formatDate(record.next_service_date)} />
        </div>
      </div>

      {/* Notes */}
      {record.notes && (
        <div className="mb-5 p-4 rounded-input border border-input-line bg-table-head/40">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-t-light mb-2">Notes</h4>
          <p className="text-sm text-t-body whitespace-pre-wrap">{record.notes}</p>
        </div>
      )}

      {/* Meta */}
      <div className="p-4 rounded-input border border-input-line bg-table-head/40">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-t-light mb-3">Meta</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Created By" value={record.created_by_name ?? record.createdByUser?.name} />
          <Field label="Created At" value={formatDate(record.created_at)} />
          <Field label="Updated At" value={formatDate(record.updated_at)} />
        </div>
      </div>
    </Modal>
  )
}
