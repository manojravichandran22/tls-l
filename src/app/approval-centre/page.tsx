'use client'

import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { AlertTriangle, QrCode, WifiOff, UserPlus } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'

type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected'

interface ApprovalItem {
  id: number
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  meta: string
  status: ApprovalStatus
}

const items: ApprovalItem[] = [
  { id: 1, icon: <AlertTriangle size={14} />, iconBg: 'bg-warning-bg', title: 'New Defect Category', subtitle: 'Category "Finishing Defects" submitted for approval', meta: 'Defect Master | 30 Sec', status: 'Pending' },
  { id: 2, icon: <QrCode size={14} />, iconBg: 'bg-info-bg', title: 'QR Save Request', subtitle: 'QR for Buyer: Kath | Style: Jogger Pants pending sign-of', meta: 'QR Save | 30 Sec', status: 'Pending' },
  { id: 3, icon: <QrCode size={14} />, iconBg: 'bg-info-bg', title: 'QR Save Request', subtitle: 'QR for Buyer: Kath | Style: Jogger Pants pending sign-of', meta: 'QR Save | 30 Sec', status: 'Pending' },
  { id: 4, icon: <WifiOff size={14} />, iconBg: 'bg-error-bg', title: 'TLS Device Offline', subtitle: 'TLS-007 on Line 3 has not synced in 45 minutes...', meta: 'TLS Alert | Pending', status: 'Pending' },
  { id: 5, icon: <UserPlus size={14} />, iconBg: 'bg-success-bg', title: 'New Employee', subtitle: 'EMP-042 — Shia Dev | Sewing Operator pending approval', meta: 'Employee | Pending', status: 'Pending' },
]

const stats = [
  { label: 'Pending', value: 5, color: 'text-stat-orange' },
  { label: 'Approved', value: 486, color: 'text-success-text' },
  { label: 'Rejected', value: 9, color: 'text-error-text' },
]

type TabType = 'All' | 'Pending' | 'Approved' | 'Rejected'

export default function ApprovalCentrePage() {
  const [activeTab, setActiveTab] = useState<TabType>('All')
  const filtered = activeTab === 'All' ? items : items.filter(i => i.status === activeTab)

  return (
    <AppLayout>
      <PageHeader title="Approval Centre" description="Review and approve or reject pending requests from all modules." />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5 max-w-[400px]">
        {stats.map(s => (
          <div key={s.label} className="bg-card rounded-lg px-4 py-3.5 shadow-sm text-center">
            <p className={`m-0 mb-1 text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="m-0 text-xs2 text-t-lighter">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-header-line mb-4">
        {(['All', 'Pending', 'Approved', 'Rejected'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-cell-py-sm border-none bg-transparent cursor-pointer text-sm font-inherit -mb-px
              ${activeTab === tab
                ? 'font-semibold text-accent border-b-2 border-b-accent'
                : 'font-normal text-t-light border-b-2 border-b-transparent'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-t-lighter text-sm">No items</div>
        ) : filtered.map((item, i) => (
          <div
            key={item.id}
            className={`flex items-start gap-3 px-btn-px py-3.5 ${i < filtered.length - 1 ? 'border-b border-table-line' : ''}`}
          >
            <div className={`w-[34px] h-input-h rounded-full ${item.iconBg} flex items-center justify-center shrink-0 text-t-body`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="m-0 mb-0.5 text-sm font-semibold text-t-secondary">{item.title}</p>
              <p className="m-0 mb-1 text-xs text-t-light">{item.subtitle}</p>
              <p className="m-0 text-xs2 text-t-lighter">{item.meta}</p>
            </div>
            <div className="flex gap-1.5 shrink-0 items-center">
              <Button variant="success" size="sm">Approve</Button>
              <Button variant="danger" size="sm">Decline</Button>
              <Button variant="outline" size="sm">View &rarr;</Button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
