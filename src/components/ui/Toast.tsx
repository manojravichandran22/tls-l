'use client'

import { useEffect } from 'react'
import { X, CheckCircle, AlertTriangle } from 'lucide-react'

export interface ToastData {
  message: string
  type: 'success' | 'error'
}

interface ToastProps extends ToastData {
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const isSuccess = type === 'success'

  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-lg
      text-sm font-medium min-w-[280px] max-w-[420px] shadow-lg animate-[toastSlideIn_0.3s_ease]
      ${isSuccess
        ? 'bg-success-bg border border-success-bg text-success-text'
        : 'bg-error-bg border border-error-border text-error-text'}`}
    >
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      {isSuccess ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="bg-transparent border-none cursor-pointer p-0.5 flex opacity-60 hover:opacity-100 text-current"
      >
        <X size={14} />
      </button>
    </div>
  )
}
