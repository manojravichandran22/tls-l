'use client'

import { X } from 'lucide-react'
import type { DefectOption } from './types'

interface OperationViewProps {
  viewData: Record<string, unknown> | null
  viewLoading: boolean
  onClose: () => void
}

export default function OperationView({ viewData, viewLoading, onClose }: OperationViewProps) {
  if (!viewData && !viewLoading) return null

  const defects = (viewData?.defect_details as DefectOption[] | undefined) ?? []
  const machine = (viewData?.machine as Record<string, unknown> | undefined)
  const machineType = (viewData?.machineType as Record<string, unknown> | undefined)

  return (
    <div className="fixed inset-0 z-[9997] flex justify-end">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-[1] bg-modal w-full max-w-[480px] h-full flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex-1 min-w-0">
            {viewLoading || !viewData ? (
              <div className="h-5 w-48 bg-table-head rounded animate-pulse" />
            ) : (
              <>
                <h2 className="text-base font-bold text-t-primary leading-snug">
                  {String(viewData.code ?? '')} | {String(viewData.operation_name ?? '')}
                </h2>
                <p className="text-xs text-t-lighter mt-1">
                  SAM: <span className="font-mono text-accent">{String(viewData.sam ?? '—')}</span>
                </p>
              </>
            )}
          </div>
          <button onClick={onClose} className="ml-3 mt-0.5 p-1 text-t-lighter hover:text-t-body transition-colors shrink-0 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Meta */}
        {!viewLoading && viewData && (
          <div className="flex flex-col gap-2 px-6 pb-4 shrink-0">
            {!!machineType?.type_name && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-t-lighter w-24 shrink-0">Machine Type</span>
                <span className="text-xs font-medium text-t-body">{String(machineType.type_name)}</span>
              </div>
            )}
            {/* {!!machine?.machine_no && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-t-lighter w-24 shrink-0">Machine</span>
                <span className="text-xs font-mono text-t-body">
                  {String(machine.machine_no)}{machine.brand ? ` – ${String(machine.brand)}` : ''}
                </span>
              </div>
            )} */}
            {!!viewData.notes && (
              <div className="flex items-start gap-2">
                <span className="text-xs text-t-lighter w-24 shrink-0">Notes</span>
                <span className="text-xs text-t-body leading-relaxed">{String(viewData.notes)}</span>
              </div>
            )}
          </div>
        )}

        <div className="h-px bg-table-line mx-6 shrink-0" />

        {/* Defects */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {viewLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map(n => <div key={n} className="h-10 bg-table-head rounded animate-pulse" />)}
            </div>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-t-primary mb-3">
                Linked Defects ({defects.length})
              </h3>
              {defects.length === 0 ? (
                <p className="text-xs text-t-lighter py-6 text-center">No defects linked to this operation.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {defects.map((d, i) => (
                    <div key={d.code} className="flex items-center gap-3 px-4 py-3 rounded-card border border-table-line bg-card">
                      <span className="text-xs font-mono font-semibold text-t-lighter shrink-0">{d.code}</span>
                      <span className="text-sm2 text-t-body truncate">{d.defect_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
