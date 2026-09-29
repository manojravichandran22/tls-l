'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface SummaryItem {
  label: string
  value: React.ReactNode
  className?: string
  labelClassName?: string
  valueClassName?: string
}

interface SummaryCardProps {
  items: SummaryItem[]
  actions?: React.ReactNode
  className?: string
}

export default function SummaryCard({ items, actions, className }: SummaryCardProps) {
  return (
    <div className={cn(
      "bg-card border border-header-line rounded-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-wrap items-center justify-between gap-4",
      className
    )}>
      <div className="flex flex-wrap gap-x-12 gap-y-6">
        {items.map((item, idx) => (
          <div key={idx} className={item.className}>
            <div className={cn("text-t-lighter text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5", item.labelClassName)}>
              {item.label}
            </div>
            <div className={cn("text-t-light font-bold text-sm", item.valueClassName)}>
              {item.value || '—'}
            </div>
          </div>
        ))}
      </div>

      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  )
}
