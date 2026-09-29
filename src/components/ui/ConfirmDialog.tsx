'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ConfirmDialogProps {
  title: string
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
  variant?: 'danger' | 'primary'
}

export default function ConfirmDialog({
  title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onClose, loading = false, variant = 'danger',
}: ConfirmDialogProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const btnClass = variant === 'danger'
    ? 'bg-danger hover:bg-danger-hover text-white'
    : 'bg-accent hover:bg-accent-hover text-white'

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      {/* Dialog */}
      <div className="relative z-[1] bg-[var(--color-modal-bg)] rounded-card
        w-[calc(100vw-16px)] sm:w-[calc(100vw-32px)] max-w-[380px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-4 sm:p-6"
      >
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="m-0 text-md font-bold text-[var(--color-text-primary)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="shrink-0 flex items-center justify-center w-6 h-6 rounded-input text-t-lighter hover:text-t-body hover:bg-table-head transition-colors disabled:opacity-50 cursor-pointer border-none bg-transparent"
          >
            <X size={14} />
          </button>
        </div>
        <div className="mb-5 text-sm text-[var(--color-text-light)] break-words">{message}</div>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-input-h px-btn-px bg-[var(--color-card-bg)] border border-[var(--color-input-border)]
              rounded-input text-sm text-[var(--color-text-body)] cursor-pointer font-inherit
              disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`h-input-h px-btn-px border-none rounded-input text-sm font-semibold
              cursor-pointer font-inherit disabled:opacity-70 transition-colors ${btnClass}`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
