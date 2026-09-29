'use client'

import AppLayout from '@/components/layout/AppLayout'
import { ShoppingBag, AlertTriangle, QrCode, WifiOff, UserPlus, CheckCircle } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface Notification {
  id: number
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  tag?: { label: string; variant: 'success' | 'error' | 'warning' | 'info' }
  time: string
  read: boolean
}

const notifications: Notification[] = [
  { id: 1, icon: <ShoppingBag size={14} />, iconBg: 'bg-info-bg', title: 'New Order Request [Kin]', subtitle: 'Order #17295 — Blue: 13,000 pcs pending approval', tag: { label: 'Approved', variant: 'success' }, time: '10m ago', read: false },
  { id: 2, icon: <AlertTriangle size={14} />, iconBg: 'bg-warning-bg', title: 'New Defect Category', subtitle: 'Category "Finishing Defector" submitted for approval', time: '20m ago', read: false },
  { id: 3, icon: <QrCode size={14} />, iconBg: 'bg-info-bg', title: 'QR Scan Request', subtitle: 'QR for Buyer: Kath | Style: Jogger Pants pending sign-of', time: '20m ago', read: false },
  { id: 4, icon: <WifiOff size={14} />, iconBg: 'bg-error-bg', title: 'TLS Device Offline', subtitle: 'QR for Buyer: Kath | Style: Jogger Pants pending sign-of', time: '30m ago', read: true },
  { id: 5, icon: <UserPlus size={14} />, iconBg: 'bg-success-bg', title: 'New Employee Registration', subtitle: 'EMP-042 — Shia Dev | Sewing Operator pending approval', time: '40m ago', read: true },
  { id: 6, icon: <QrCode size={14} />, iconBg: 'bg-info-bg', title: 'QR scan', subtitle: 'QR #1333 | Legging | appended approval', time: '50m ago', read: true },
  { id: 7, icon: <CheckCircle size={14} />, iconBg: 'bg-success-bg', title: 'New Account created', subtitle: 'Last Administrator: A/c 11:1', time: '90m ago', read: true },
]

export default function NotificationsPage() {
  return (
    <AppLayout>

      <PageHeader title="Notifications">
        <Button variant="link" size="sm">Mark all as read &#10003;</Button>
      </PageHeader>

      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        {notifications.map((n, i) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 px-btn-px py-3.5
              ${i < notifications.length - 1 ? 'border-b border-table-line' : ''}
              ${n.read ? 'bg-card' : 'bg-accent/[0.03]'}`}
          >
            <div className={`w-[34px] h-input-h rounded-full ${n.iconBg} flex items-center justify-center shrink-0 text-t-body`}>
              {n.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <p className={`m-0 text-sm text-t-secondary ${n.read ? 'font-medium' : 'font-semibold'}`}>{n.title}</p>
                {n.tag && <Badge variant={n.tag.variant}>{n.tag.label}</Badge>}
              </div>
              <p className="m-0 text-xs text-t-lighter">{n.subtitle}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="text-xs2 text-t-lighter whitespace-nowrap">{n.time}</span>
              {!n.read && <div className="w-[7px] h-[7px] rounded-full bg-accent" />}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
