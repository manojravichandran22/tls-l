'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

type ModalSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[500px]',
  lg: 'max-w-[640px]',
}

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  size?: ModalSize
}

export default function Modal({ title, onClose, children, footer, size = 'sm' }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      {/* Modal */}
      <div className={`relative z-[1] bg-[var(--color-modal-bg)] rounded-card
        w-[calc(100vw-16px)] sm:w-[calc(100vw-32px)] ${sizeClasses[size]} max-h-[calc(100vh-32px)] sm:max-h-[calc(100vh-48px)]
        flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.25)]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-table-border)] shrink-0">
          <h2 className="m-0 text-sm font-bold text-[var(--color-text-primary)]">{title}</h2>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1 flex items-center text-[var(--color-text-lighter)] hover:text-[var(--color-text-light)]">
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--color-table-border)] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
