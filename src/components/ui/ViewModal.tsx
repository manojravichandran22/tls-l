'use client'

import { useEffect, useState } from 'react'
import Modal from './Modal'

export interface ViewField {
  label: string
  value?: React.ReactNode
  fullWidth?: boolean
  section?: boolean  // renders as a section divider/heading
}

interface ViewModalProps {
  title: string
  fields: ViewField[]
  loading?: boolean
  onClose: () => void
  size?: 'sm' | 'md' | 'lg'
}

export default function ViewModal({ title, fields, loading = false, onClose, size = 'sm' }: ViewModalProps) {
  return (
    <Modal title={title} onClose={onClose} size={size}>
      {loading ? (
        <div className="py-8 text-center text-t-lighter text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {fields.map((field, i) =>
            field.section ? (
              <div key={`section-${i}`} className="col-span-2 pt-2 pb-0.5 border-b border-table-line">
                <p className="text-xs font-bold text-t-secondary">{field.label}</p>
              </div>
            ) : (
              <div key={i} className={field.fullWidth ? 'col-span-2' : ''}>
                <p className="m-0 mb-0.5 text-2xs text-t-light font-semibold uppercase tracking-wider">
                  {field.label}
                </p>
                <div className="text-sm text-t-secondary font-medium break-words">
                  {field.value ?? '—'}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </Modal>
  )
}
