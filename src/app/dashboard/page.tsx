'use client'

import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { ChevronDown } from 'lucide-react'
import { useWindowSize } from '@/hooks/useWindowSize'
import Badge from '@/components/ui/Badge'

// ── Types ──────────────────────────────────────────────
type StatusType = 'Normal' | 'Problem' | 'Warning' | 'Audit Pending'

const STATUS_VARIANT: Record<StatusType, 'success' | 'error' | 'warning' | 'info'> = {
  Normal: 'success',
  Problem: 'error',
  Warning: 'warning',
  'Audit Pending': 'info',
}

const STATUS_DOT: Record<StatusType, string> = {
  Normal:          'bg-success-text',
  Problem:         'bg-error-text',
  Warning:         'bg-warning-text',
  'Audit Pending': 'bg-info-text',
}

// ── Mock data ─────────────────────────────────────────
const statsCards = [
  { label: 'Active Lines', value: '20', sub: 'Zone 1: 12, Zone 2: 8', borderColor: 'border-t-[#0D939D]', subClass: 'text-t-light' },
  { label: "Today's Output", value: '14,832', sub: '+12% vs target', borderColor: 'border-t-[#3182CE]', subClass: 'text-stat-green' },
  { label: 'Active Defects', value: '7', sub: '3 Critical, 4 Major', borderColor: 'border-t-[#E53E3E]', subClass: 'text-danger' },
  { label: 'TLS Online', value: '186 / 200', sub: '14 offline', borderColor: 'border-t-[#805AD5]', subClass: 'text-stat-orange' },
  { label: 'Rework %', value: '6.8%', sub: 'Target: < 5%', borderColor: 'border-t-[#DD6B20]', subClass: 'text-danger' },
]

const recentOrders = [
  { id: '#17294', name: 'Polo T-Shirt | Green', status: 'Approved', output: 4834, target: 68 },
  { id: '#17266', name: 'Legging | Red', status: 'Approved', output: 3196, target: 38 },
  { id: '#17353', name: 'Polo T-Shirt | Red', status: 'Approved', output: 5887, target: 92 },
  { id: '#17294', name: 'Legging | Pink', status: 'Awaiting for Review', output: 4834, target: 66 },
  { id: '#17294', name: 'Legging | Pink', status: 'Approved', output: 4834, target: 66 },
]

const liveStatusRows = [
  { ws: 'WS-1', tlsId: '100001', operation: 'ARM HOLE PIPING', status: 'Normal' as StatusType, defects: 0 },
  { ws: 'WS-2', tlsId: '100002', operation: 'ATTACH ELASTIC', status: 'Problem' as StatusType, defects: 4 },
  { ws: 'WS-3', tlsId: '100003', operation: 'BACK PANEL JOIN', status: 'Warning' as StatusType, defects: 2 },
  { ws: 'WS-4', tlsId: '100004', operation: 'BACK POCKET HEM', status: 'Audit Pending' as StatusType, defects: 0 },
  { ws: 'WS-5', tlsId: '100004', operation: 'BACK POCKET HEM', status: 'Audit Pending' as StatusType, defects: 0 },
  { ws: 'WS-6', tlsId: '100004', operation: 'BACK POCKET HEM', status: 'Audit Pending' as StatusType, defects: 0 },
  { ws: 'WS-7', tlsId: '100005', operation: 'ATTACH WAISTBAND', status: 'Normal' as StatusType, defects: 0 },
]

const setupItems = [
  { label: 'Work Assigned', count: 5 }, { label: 'Shift Master', count: 3 },
  { label: 'Machine Type', count: 7 }, { label: 'Operation Master', count: 12 },
  { label: 'Line Master', count: 20 }, { label: 'Order Master', count: 9 },
  { label: 'Style Master', count: 3 }, { label: 'Defect Master', count: 3 },
  { label: 'Employee Master', count: 3 },
]

const lineTabs = ['Line-1', 'Line-2', 'Line-3', 'Line-4', 'Line-5', 'Line-6', 'Line-7', 'Line-8', 'Line-9']
const mainTabs = ['Overview', 'Recent Orders', 'Analytics', 'Multi Factory']

// ── Component ─────────────────────────────────────────
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [activeLine, setActiveLine] = useState('Line-1')
  const width = useWindowSize()

  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1024
  const contentStacked = width < 1100

  return (
    <AppLayout>
      {/* Stats Cards */}
      <div className={`grid gap-2.5 mb-3.5 ${isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-3' : 'grid-cols-5'}`}>
        {statsCards.map(card => (
          <div
            key={card.label}
            className={`bg-card rounded-lg shadow-sm border-t-[3px] ${card.borderColor} ${isMobile ? 'px-3 py-2.5' : 'px-3.5 py-3'}`}
          >
            <p className="m-0 mb-1 text-xs2 text-t-light font-medium">{card.label}</p>
            <p className={`m-0 mb-0.5 font-bold text-t-primary ${isMobile ? 'text-lg' : 'text-xl'}`}>{card.value}</p>
            <p className={`m-0 text-xs2 ${card.subClass}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Tabs */}
      <div className="flex gap-0 border-b border-header-line mb-3.5 overflow-x-auto">
        {mainTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${isMobile ? 'px-2.5 py-2 text-xs' : 'px-4 py-2 text-sm'}
              border-none bg-transparent cursor-pointer font-inherit whitespace-nowrap -mb-px
              ${activeTab === tab
                ? 'font-semibold text-accent border-b-2 border-b-[#0D939D]'
                : 'font-normal text-t-light border-b-2 border-b-transparent'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Row */}
      <div className={`flex gap-3.5 ${contentStacked ? 'flex-col' : 'flex-row'}`}>

        {/* Left column */}
        <div className="flex-1 min-w-0 flex flex-col gap-3.5">

          {/* Recent Orders */}
          <div className="bg-card rounded-lg px-4 py-3.5 shadow-sm">
            <h3 className="m-0 mb-3 text-sm font-semibold text-t-secondary">Recent Orders</h3>
            <div className={`flex gap-2.5 ${isMobile ? 'overflow-x-auto pb-1' : ''}`}>
              {recentOrders.map((o, i) => {
                const isApproved = o.status === 'Approved'
                return (
                  <div key={i} className={`border border-header-line rounded-md p-2.5 ${isMobile ? 'flex-shrink-0 w-40' : 'flex-1'} min-w-0`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs2 font-semibold text-t-secondary">{o.id}</span>
                      <Badge variant={isApproved ? 'success' : 'warning'}>{o.status}</Badge>
                    </div>
                    <p className="m-0 mb-1.5 text-xs2 text-t-body">{o.name}</p>
                    <div className="h-1 rounded-sm bg-table-line overflow-hidden mb-1">
                      <div className={`h-full bg-accent rounded-sm w-[${o.target}%]`} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-2xs text-t-light">Output: {o.output.toLocaleString()}</span>
                      <span className="text-2xs text-t-light">{o.target}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Line Live Status */}
          <div className="bg-card rounded-lg px-4 py-3.5 shadow-sm">
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="m-0 text-sm font-semibold text-t-secondary">Line Live Status</h3>
              <div className="flex items-center gap-1 px-2.5 py-1 border border-input-line rounded-input cursor-pointer">
                <span className="text-xs text-t-secondary">Zone-1</span>
                <ChevronDown size={13} className="text-t-light" />
              </div>
            </div>

            {/* Line tabs */}
            <div className="flex gap-0 border-b border-header-line mb-3 overflow-x-auto">
              {lineTabs.map(lt => (
                <button
                  key={lt}
                  onClick={() => setActiveLine(lt)}
                  className={`px-2.5 py-1.5 border-none bg-transparent cursor-pointer text-xs font-inherit whitespace-nowrap -mb-px
                    ${activeLine === lt
                      ? 'font-semibold text-accent border-b-2 border-b-[#0D939D]'
                      : 'font-normal text-t-light border-b-2 border-b-transparent'}`}
                >
                  {lt}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className={`w-full border-collapse text-xs ${isMobile ? 'min-w-[480px]' : ''}`}>
                <thead>
                  <tr className="bg-table-head">
                    {['Workstation', 'TLS ID', 'Operation', 'Status', 'Defects'].map(h => (
                      <th key={h} className="px-2.5 py-cell-py-sm text-left text-t-light font-semibold text-xs2 border-b border-header-line whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {liveStatusRows.map((row, i) => (
                    <tr key={i} className="border-b border-table-line">
                      <td className="px-2.5 py-2 text-t-secondary font-medium">{row.ws}</td>
                      <td className="px-2.5 py-2 text-t-body">{row.tlsId}</td>
                      <td className="px-2.5 py-2 text-t-body">{row.operation}</td>
                      <td className="px-2.5 py-2">
                        <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
                      </td>
                      <td className="px-2.5 py-2">
                        {row.defects > 0
                          ? <Badge variant="error">{row.defects}</Badge>
                          : <span className="text-t-lighter text-xs2">&mdash;</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Colour legend */}
            <div className="flex gap-3 mt-3 pt-2.5 border-t border-table-line flex-wrap">
              <span className="text-2xs text-t-light font-semibold">TLS Colour Reference</span>
              {(Object.entries(STATUS_DOT) as [StatusType, string][]).map(([label, dotClass]) => (
                <div key={label} className="flex items-center gap-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
                  <span className="text-2xs text-t-light">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Quick Setup */}
        <div className={contentStacked ? 'w-full' : 'w-[220px] shrink-0'}>
          <div className="bg-card rounded-lg px-4 py-3.5 shadow-sm">
            <h3 className="m-0 mb-0.5 text-sm font-semibold text-t-secondary">
              Quick Setup Progress
            </h3>
            <p className="m-0 mb-3 text-xs2 text-t-lighter">Machine configuration checklist</p>
            <div
              className={contentStacked
                ? `grid gap-0 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`
                : 'flex flex-col'}
            >
              {setupItems.map((item, i) => (
                <div key={i} className={`flex justify-between items-center py-cell-py-sm ${i < setupItems.length - 1 ? 'border-b border-table-line' : ''}`}>
                  <span className="text-xs text-t-body">{item.label}</span>
                  <span className="text-xs font-semibold text-t-secondary bg-table-line rounded px-[7px] py-px min-w-[24px] text-center">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
