'use client'

import { useState, useEffect } from 'react'
import IconButton from '@/components/ui/IconButton'
import Button from '@/components/ui/Button'
import { X, Pencil, Trash2, Download } from 'lucide-react'
import { apiCall } from '@/services/apiClient'
import { conditionLabel, downloadQrCode } from './types'
import type { MachineSpec } from './types'
import { formatDate } from '@/lib/formatDate'

interface Props {
  uuid: string | null
  onClose: () => void
  onEdit: (spec: MachineSpec) => void
  onDelete: (spec: MachineSpec) => void
  canEdit?: boolean
  canDelete?: boolean
}

export default function MachineHubView({ uuid, onClose, onEdit, onDelete, canEdit = false, canDelete = false }: Props) {
  const [spec, setSpec] = useState<MachineSpec | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!uuid) return
    setLoading(true)
    setSpec(null)
    apiCall<{ success?: boolean; data?: MachineSpec }>(
      '/specification/show',
      { method: 'GET', encrypt: false, payload: { uuid } }
    )
      .then(res => setSpec(res.data ?? null))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [uuid])

  if (!uuid) return null

  const warrantyExpiry = (() => {
    if (!spec?.purchase_date || !spec.warranty) return '—'
    const d = new Date(spec.purchase_date)
    d.setFullYear(d.getFullYear() + spec.warranty)
    return formatDate(d.toISOString().slice(0, 10))
  })()

  return (
    <div className="fixed inset-0 z-[9997] flex justify-end">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-[1] bg-modal w-full max-w-[680px] h-full flex flex-col shadow-2xl overflow-hidden">

        {/* Title bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-table-line shrink-0">
          <h2 className="text-base font-bold text-t-primary">
            Machine Specification{spec ? ` - ${spec.machine_no}` : ''}({spec ? `${spec.code}` : ''})
          </h2>
          <IconButton variant="default" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-t-lighter text-sm">Loading...</div>
        ) : !spec ? (
          <div className="flex-1 flex items-center justify-center text-t-lighter text-sm">Failed to load</div>
        ) : (
          <div className="flex-1 overflow-y-auto">

            {/* Sub-header */}
            <div className="px-6 py-4 flex items-start justify-between gap-4 border-b border-table-line">
              <div className="flex items-start gap-4 min-w-0">
                <span className="shrink-0 text-xs font-bold text-t-secondary bg-table-head border border-table-line px-3 py-2 rounded-lg mt-0.5">
                  {spec.machine_no}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-t-primary">{spec.stockType?.type_name ?? '—'}</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      {spec.is_active === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="m-0 text-xs text-t-lighter mt-1">
                    {[
                      spec.brand,
                      spec.model_no,
                      spec.branch?.branch_name,
                      spec.serial_no ? `Serial: ${spec.serial_no}` : null,
                    ]
                      .filter(Boolean)
                      .join(' | ')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => { onEdit(spec); onClose() }}>
                    <Pencil size={12} /> Edit
                  </Button>
                )}
                {canDelete && (
                  <Button variant="danger" size="sm" onClick={() => { onDelete(spec); onClose() }}>
                    <Trash2 size={12} /> Delete
                  </Button>
                )}
              </div>
            </div>

            <div className="px-6 py-5 flex flex-col gap-6">

              {/* Service date cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 px-5 py-4 rounded-xl border border-table-line bg-card-alt">
                  <p className="m-0 text-xs text-t-lighter">Last Service</p>
                  <p className="m-0 text-lg font-semibold text-t-primary">{formatDate(spec.last_oil_change)}</p>
                </div>
                <div className="flex flex-col gap-1.5 px-5 py-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/40">
                  <p className="m-0 text-xs text-red-500 dark:text-red-400">Next Service</p>
                  <p className="m-0 text-lg font-semibold text-red-700 dark:text-red-300">
                    {formatDate(spec.next_maintenance)}
                  </p>
                </div>
              </div>

              {/* Detail grid — 4 cols × 3 rows */}
              <div className="rounded-lg border border-table-line overflow-hidden">
                {[
                  [
                    { label: 'Machine ID', value: spec.machine_no },
                    { label: 'Machine Type', value: spec.stockType?.type_name ?? '—' },
                    { label: 'Brand', value: spec.brand || '—' },
                    { label: 'Model', value: spec.model_no || '—' },
                  ],
                  [
                    { label: 'Serial No', value: spec.serial_no || '—' },
                    { label: 'Branch', value: spec.branch?.branch_name ?? '—' },
                    { label: 'Condition', value: spec.conditionInfo?.value ?? conditionLabel(String(spec.condition)) },
                    {
                      label: 'QR Code',
                      value: spec.qr_code ? (
                        <div className="flex items-center gap-2">
                          {spec.qr_code.startsWith('data:image/') || spec.qr_code.length > 30 ? (
                            <img
                              src={spec.qr_code.startsWith('data:image/') ? spec.qr_code : `data:image/png;base64,${spec.qr_code}`}
                              alt="QR Code"
                              className="w-8 h-8 rounded border border-input-line bg-white object-contain p-0.5 cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => downloadQrCode(spec.qr_code, `Machine_${spec.machine_no}_qrcode.png`)}
                              title="Click to download QR code"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-t-primary">{spec.qr_code}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => downloadQrCode(spec.qr_code, `Machine_${spec.machine_no}_qrcode.png`)}
                            className="p-1 text-t-lighter hover:text-accent rounded transition-colors"
                            title="Download QR Code"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      ) : '—',
                    },
                  ],
                  [
                    { label: 'Status', value: spec.is_active === 1 ? 'Active' : 'Inactive' },
                    { label: 'Purchase Date', value: formatDate(spec.purchase_date) },
                    { label: 'Warranty Period', value: spec.warranty ? `${spec.warranty} Yrs` : '—' },
                    { label: 'Warranty Expiry', value: warrantyExpiry },
                  ],
                ].map((row, ri) => (
                  <div
                    key={ri}
                    className={`grid grid-cols-4 ${ri < 2 ? 'border-b border-table-line' : ''} ${ri % 2 === 1 ? 'bg-card-alt' : ''}`}
                  >
                    {row.map((cell, ci) => (
                      <div
                        key={cell.label}
                        className={`px-4 py-3.5 flex flex-col gap-1 ${ci < 3 ? 'border-r border-table-line' : ''}`}
                      >
                        <p className="m-0 text-xs text-t-lighter">{cell.label}</p>
                        <p className="m-0 text-sm font-semibold text-t-primary">{cell.value}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div>
                <p className="m-0 text-sm font-semibold text-t-body mb-2">Notes</p>
                <p className="m-0 text-sm text-t-lighter">—</p>
              </div>

              {/* Image */}
              {spec.file && (
                <div>
                  <p className="m-0 text-sm font-semibold text-t-body mb-2">Image</p>
                  <img src={spec.file} alt="Machine" className="max-w-xs rounded-lg border border-table-line" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
