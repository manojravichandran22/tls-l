'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { ChevronDown, ChevronRight, LayoutDashboard, X, Database } from 'lucide-react'

const navSections = [
  {
    key: 'MASTERS',
    title: 'MASTERS',
    icon: Database,
    defaultOpen: true,
    items: [
      { label: 'Company',    route: '/masters/company-master' },
      { label: 'Branch',     route: '/masters/branch-master' },
      { label: 'Zone',       route: '/masters/zone-master' },
      { label: 'Line',       route: '/masters/line-master' },
      { label: 'Work Station', route: '/masters/workstation-master' },
      { label: 'Role',       route: '/masters/role-master' },
      { label: 'Department', route: '/masters/department-master' },
      { label: 'Designation', route: '/masters/designation-master' },
      { label: 'Employee',   route: '/masters/employee-master' },
      { label: 'Shift',      route: '/masters/shift-master' },
      { label: 'Shift Modify',      route: '/masters/shift-modify' },
      { label: 'Work List',  route: '/masters/work-list-master' },
      { label: 'Machine Hub',       route: '/masters/machine-hub' },
      { label: 'Operation',  route: '/masters/operation-master' },
      { label: 'Order',      route: '/masters/order-master' },
      { label: 'Style',      route: '/masters/style-master' },
      { label: 'Defect',     route: '/masters/defect-master' },
    ],
  },
  {
    key: 'CONFIGURATION',
    title: 'CONFIGURATION',
    defaultOpen: false,
    items: [
      { label: 'TLS ID Registration', route: '/configuration/tls-id-registration' },
      { label: 'TLS & Line Mapping',  route: '/configuration/tls-line-mapping' },
    ],
  },
  {
    key: 'EXECUTION',
    title: 'EXECUTION',
    defaultOpen: false,
    items: [
      { label: 'Notifications',    route: '/notifications' },
      { label: 'Approval Centre',  route: '/approval-centre' },
    ],
  },
  {
    key: 'TRACKERS',
    title: 'TRACKERS',
    defaultOpen: false,
    items: [],
  },
  {
    key: 'REPORTS',
    title: 'REPORTS',
    defaultOpen: false,
    items: [],
  },
]

interface SidebarProps {
  isOpen: boolean
  isMobile: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, isMobile, onClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [open, setOpen] = useState<Record<string, boolean>>(
    Object.fromEntries(navSections.map(s => [s.key, s.defaultOpen ?? false]))
  )

  const isActive = (route: string) => pathname === route

  const handleNav = (route: string) => {
    router.push(route)
    if (isMobile) onClose()
  }

  const mobileClass = isMobile
    ? `fixed top-0 left-0 h-full w-sidebar z-50 transition-transform duration-300 ease-in-out
       ${isOpen ? 'translate-x-0 shadow-[4px_0_20px_rgba(0,0,0,0.15)]' : '-translate-x-full'}`
    : 'w-sidebar min-w-sidebar max-w-sidebar h-full shrink-0'

  return (
    <div
      id="iq-sidebar"
      className={`flex flex-col overflow-hidden bg-sidebar border-r border-sidebar-line transition-colors duration-300 ${mobileClass}`}
    >
      {/* Logo */}
      <div className="px-5 h-14 flex items-center gap-2.5 shrink-0 justify-between border-b border-sidebar-line">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={30} height={30} />
          <span className="text-brand font-bold text-md tracking-wide">iQ2 TLS</span>
        </div>
        {isMobile && (
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1 flex items-center text-t-lighter">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto pt-5 pb-4 bg-sidebar transition-colors duration-300">

        {/* Dashboard */}
        <button
          onClick={() => handleNav('/dashboard')}
          className={`w-[calc(100%-32px)] mx-4 mb-5 px-3 py-2 rounded-lg flex items-center gap-3
            cursor-pointer transition-colors border-none font-inherit select-none
            ${pathname === '/dashboard'
              ? 'bg-accent'
              : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}
        >
          <LayoutDashboard size={18} className={pathname === '/dashboard' ? 'text-white' : 'text-t-secondary'} />
          <span className={`text-sm font-normal ${pathname === '/dashboard' ? 'text-white' : 'text-t-secondary'}`}>Dashboard</span>
        </button>

        {/* Sections */}
        {navSections.map(section => {
          const sectionOpen = open[section.key]
          const SectionIcon = 'icon' in section ? section.icon : null

          return (
            <div key={section.key} className="mb-3">
              {/* Section header */}
              <button
                onClick={() => setOpen(p => ({ ...p, [section.key]: !p[section.key] }))}
                className={`w-[calc(100%-32px)] mx-4 px-3 py-2 border-none cursor-pointer select-none
                  flex items-center justify-between font-inherit transition-colors rounded-lg
                  ${sectionOpen
                    ? 'bg-accent'
                    : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-2.5">
                  {SectionIcon && sectionOpen && (
                    <SectionIcon size={15} className="text-white" />
                  )}
                  <span className={`text-xs font-semibold tracking-widest
                    ${sectionOpen ? 'text-white' : 'text-t-light'}`}>
                    {section.title}
                  </span>
                </div>
                {sectionOpen
                  ? <ChevronDown size={14} className="text-white" />
                  : <ChevronRight size={14} className="text-t-lighter" />}
              </button>

              {/* Section items */}
              {sectionOpen && (
                <div className="mt-1.5">
                  {section.items.map(item => {
                    const active = isActive(item.route)
                    return (
                      <button
                        key={item.label}
                        onClick={() => handleNav(item.route)}
                        className={`w-full py-2 pr-4 pl-[52px] border-none cursor-pointer
                          flex items-center gap-2.5 text-left font-inherit transition-colors
                          ${active ? 'bg-accent/10' : 'bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/5'}`}
                      >
                        <span className={`text-sm2 leading-none ${active ? 'text-accent' : 'text-t-lighter'}`}>&#8226;</span>
                        <span className={`text-sm ${active ? 'text-accent font-medium' : 'text-t-secondary font-normal'}`}>
                          {item.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}
