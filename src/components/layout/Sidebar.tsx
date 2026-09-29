'use client'

import { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  ChevronDown, ChevronRight, LayoutDashboard, X, Database, ClipboardList, Settings, Zap,
  Activity, FileText, Building2, Lock, Users, Router, Wrench, BowArrow, TriangleRight, Gift,
  Monitor, PieChart, QrCode, Search, Lightbulb
} from 'lucide-react'
import { getAuthUser } from '@/lib/cookies'
import { normalizeGroupName, normalizeActionName } from '@/hooks/usePermissions'
import { useTheme } from '@/hooks/useTheme'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

// ─── Hook: resolve which permission groups the current user has access to ────
// Returns isSuperAdmin=true (sees all) or Sets of group_name & permission name strings
function useUserPermissionGroups() {
  const [user, setUser] = useState<Record<string, unknown> | null>(() => {
    if (typeof window !== 'undefined') {
      return getAuthUser()
    }
    return null
  })

  useEffect(() => {
    const syncUser = () => setUser(getAuthUser())
    syncUser()
    window.addEventListener('storage', syncUser)
    window.addEventListener('auth_user_updated', syncUser)
    return () => {
      window.removeEventListener('storage', syncUser)
      window.removeEventListener('auth_user_updated', syncUser)
    }
  }, [])

  return useMemo(() => {
    if (!user) return { isSuperAdmin: false, allowedGroups: new Set<string>(), allowedPermissions: new Set<string>() }

    const roleCode = user?.role_code
    const isSuperAdmin = Number(roleCode) === 100 || roleCode === 100

    if (isSuperAdmin) {
      return { isSuperAdmin: true, allowedGroups: new Set<string>(), allowedPermissions: new Set<string>() }
    }

    // Collect every group_name and permission action name the user has access to
    const groups = (user?.permissions as Array<{ group_name: string; permissions: Array<{ name: string }> }>) ?? []
    const allowedGroups = new Set<string>()
    const allowedPermissions = new Set<string>()

    groups.forEach(g => {
      if (g.permissions && g.permissions.length > 0) {
        allowedGroups.add(normalizeGroupName(g.group_name))
        g.permissions.forEach(p => {
          if (p.name) {
            allowedPermissions.add(p.name)
            allowedPermissions.add(normalizeActionName(p.name))
          }
        })
      }
    })

    return { isSuperAdmin: false, allowedGroups, allowedPermissions }
  }, [user])
}

const navSections = [
  // {
  //   key: 'DASHBOARD',
  //   title: 'DASHBOARD',
  //   icon: LayoutDashboard,
  //   route: '/dashboard',
  //   items: [],
  // },
  {
    key: 'ORGANISATION',
    title: 'ORGANISATION',
    icon: Building2,
    defaultOpen: true,
    items: [
      { label: 'Company', route: '/masters/company-master', permissionGroup: 'Company' },
      { label: 'Branch', route: '/masters/branch-master', permissionGroup: 'Branch' },
      { label: 'Team', route: '/masters/team-master', permissionGroup: 'Team' },
      { label: 'Shift', route: '/masters/shift-master', permissionGroup: 'Shift' },
      { label: 'Shift Allocation', route: '/masters/shift-modify', permissionGroup: 'Shift-Modify' },
      { label: 'Zone', route: '/masters/zone-master', permissionGroup: 'Zone' },
      { label: 'Line', route: '/masters/line-master', permissionGroup: 'Line' },
    ],
  },
  {
    key: 'ACCESS CONTROL',
    title: 'ACCESS CONTROL',
    icon: Lock,
    defaultOpen: true,
    items: [
      { label: 'Role', route: '/masters/role-master', permissionGroup: 'Role' },
      { label: 'Users', route: '/masters/user-master', permissionGroup: 'User' },
    ],
  },
  {
    key: 'EMPLOYEE MGMT',
    title: 'EMPLOYEE MGMT',
    icon: Users,
    defaultOpen: true,
    items: [
      { label: 'Department', route: '/masters/department-master', permissionGroup: 'Department' },
      { label: 'Designation', route: '/masters/designation-master', permissionGroup: 'Designation' },
      { label: 'Work Category', route: '/masters/work-category-master', permissionGroup: 'workCategory' },
      { label: 'Employee', route: '/masters/employee-master', permissionGroup: 'Employee' },
    ],
  },
  {
    key: 'DEVICE MGMT',
    title: 'DEVICE MGMT',
    icon: Router,
    defaultOpen: true,
    items: [
      { label: 'Device Registration', route: '/masters/device-master', permissionGroup: 'devices' },
    ],
  },
  {
    key: 'MACHINE MGMT',
    title: 'MACHINE MGMT',
    icon: Wrench,
    defaultOpen: true,
    items: [
      { label: 'Machine Hub', route: '/masters/machine-hub', permissionGroup: 'Machine' },
      { label: 'Preventive Maintenance', route: '/masters/preventive-maintenance', permissionGroup: 'Machine-History' },
    ],
  },
  {
    key: 'QUALITY MGMT',
    title: 'QUALITY MGMT',
    icon: BowArrow,
    defaultOpen: true,
    items: [
      { label: 'Defect Master', route: '/masters/defect-master', permissionGroup: 'Defect' },
       { label: 'Rework QR Code Generation', route: '/qr-generation/rework', permissionGroup: 'Qrgeneration', permissionName: 'reworkqr.list' },
      { label: 'Rejection QR Code Generation', route: '/qr-generation/rejection', permissionGroup: 'Qrgeneration', permissionName: 'rejectionqr.list' },
    ],
  },
  {
    key: 'INDUSTRIAL ENGG',
    title: 'INDUSTRIAL ENGG',
    icon: TriangleRight,
    defaultOpen: true,
    items: [
      //{ label: 'Workstation', route: '/masters/workstation-master', permissionGroup: 'WorkStation' },
      { label: 'Operation Master', route: '/masters/operation-master', permissionGroup: 'Operation' },
      { label: 'Operation Bulletin', route: '/production-planning/operation-bulletin', permissionGroup: 'Operation-Bulletin' },
      { label: 'Style Summary', route: '/production-planning/style-summary', permissionGroup: 'Operation-Bulletin' },
      { label: 'Style & Order Mapping', route: '/production-planning/style-order-mapping', permissionGroup: 'Order' },
      //{ label: 'Style Continuity Mapping', route: '#' },
      { label: 'Line Mapping', route: '/execution/line-mapping', permissionGroup: 'MobilelinemappingList' },
      
    ],
  },
  {
    key: 'ORDER MGMT',
    title: 'ORDER MGMT',
    icon: Gift,
    defaultOpen: true,
    items: [
      { label: 'Order', route: '/masters/order-master', permissionGroup: 'Order' },
      //{ label: 'Line Input', route: '#' },
    ],
  },
  {
    key: 'TV DISPLAY',
    title: 'TV DISPLAY',
    icon: Monitor,
    defaultOpen: true,
    items: [
      { label: 'Target & Manpower Planning', route: '/tv-display/target-manpower-planning', permissionGroup: 'Manpowerplanning' },
      // { label: 'Production Dashboard', route: '#' },
      // { label: 'Quality Dashboard', route: '/tv-display/quality-dashboard' },
      { label: 'Quality TV', route: '/tv-display/quality-tv' },
      // { label: 'Line TV Display', route: '/tv-display/line-tv-display' },
    ],
  },
  {
    key: 'LIVE TRACKING',
    title: 'LIVE TRACKING',
    icon: Router,
    defaultOpen: true,
    items: [
      //{ label: 'Line Login Control Center', route: '#' },
      { label: 'TLS Control Center', route: '/live-tracking/tls-control-center' },
      { label: 'Rework Control Center', route: '/live-tracking/rework-control-center' },
      { label: 'Rejection Control Center', route: '/live-tracking/rejection-control-center' },
      //{ label: 'Production Control Center', route: '#' },
      { label: 'Line Login Control Center', route: '/masters/work-list-master', permissionGroup: 'MobileCheckinList', permissionName: 'mobilecheckin.list' },
      { label: 'Operator Login Control Center', route: '/execution/operator-checkin-list', permissionGroup: 'Attendance', permissionName: 'operatorcheckinlist' },
      { label: 'Checker Login Control Center', route: '/execution/checkin-list', permissionGroup: 'Attendance', permissionName: 'checkinlist' },
    ],
  },
  // {
  //   key: 'CATEGORY WISE DEFECT',
  //   title: 'CATEGORY WISE DEFECT',
  //   icon: PieChart,
  //   defaultOpen: true,
  //   items: [
  //     { label: 'Category Wise Defect', route: '/reports/category-wise-defect', permissionGroup: 'Reports' },
  //   ],
  // },
  {
    key: 'REPORTS',
    title: 'REPORTS',
    icon: FileText,
    defaultOpen: false,
    items: [
      
      { label: 'Efficiency Report', route: '/reports/efficiency-report', permissionGroup: 'Reports', permissionName: 'report.efficiencyreport' },
      
      {
        label: 'Orders Analysis',
        route: '',
        subItems: [
          { label: 'Order Summary', route: '/reports/order-summary', permissionGroup: 'Reports', permissionName: 'report.ordersummary' },
          { label: 'Order Line Summary', route: '/reports/order-line-summary', permissionGroup: 'Reports', permissionName: 'report.lineordersummary' },
        ],
      },
      // {
      //   label: 'Performance',
      //   route: '',
      //   subItems: [
      //     { label: 'Line Efficiency', route: '#' },
      //     { label: 'Employee Quality Performance', route: '#' },
      //     { label: 'QC Performance', route: '#' },
      //     { label: 'Operator Quality Performance', route: '#' },
      //     { label: 'Operator Quality Performance Matrix', route: '#' },
      //   ],
      // },
      {
        label: 'Quality Analysis',
        route: '',
        subItems: [
          // { label: 'Stain Analysis', route: '#' },
          // { label: 'Knife & Trim Cut Analysis', route: '#' },
          //{ label: 'Line Rework & Rejection Summary', route: '/reports/linewise-rework-rejection-report', permissionGroup: 'Reports', permissionName: 'report.linewisereworkrejectionreport' },
      { label: 'TLS Audit', route: '/reports/tls-audit', permissionGroup: 'Reports', permissionName: 'report.tlsauditreport' },
      { label: 'Category Wise Defect', route: '/reports/category-wise-defect', permissionGroup: 'Reports', permissionName: 'report.categorywisedefectreport' },
      { label: 'Daily AQL Audit Line Summary', route: '/reports/daily-aql-audit-line-summary', permissionGroup: 'Reports', permissionName: 'report.aqlauditlinesummaryreport' },
      { label: 'Linewise Rework & Rejection', route: '/reports/linewise-rework-rejection-report', permissionGroup: 'Reports', permissionName: 'report.linewisereworkrejectionreport' },

        ],
      },
      {
        label: 'Cost Analysis',
        route: '',
        subItems: [
          { label: 'Rework Cost Analysis', route: '/reports/rework-cost-analysis', permissionGroup: 'Reports', permissionName: 'report.defectwisereworkreport' },
          { label: 'Rejection Cost Analysis', route: '/reports/rejection-cost-analysis', permissionGroup: 'Reports', permissionName: 'report.defectwiserejectionreport' },
        ],
      },
      // {
      //   label: 'Audit',
      //   route: '',
      //   subItems: [
      //     { label: 'Line TLS Audit Summary', route: '#' },
      //     { label: 'AQL Audit', route: '#' },
      //     { label: 'Line AQL Audit Summary', route: '#' },
      //   ],
      // },
        {
        label: 'Transaction',
        route: '',
        subItems: [
        { label: 'Input Summary', route: '/reports/input-report', permissionGroup: 'Reports', permissionName: 'webinput.list' },
        { label: 'Rework Summary', route: '/reports/rework-summary', permissionGroup: 'Reports', permissionName: 'report.reworkreport' },
      { label: 'Rejection Summary', route: '/reports/rejection-summary', permissionGroup: 'Reports', permissionName: 'report.rejectionreport' },
      { label: 'Checking Summary', route: '/reports/checking-report', permissionGroup: 'Reports', permissionName: 'report.checkingreport' },
      { label: 'AQL Audit Summary', route: '/reports/daily-aql-audit-wise-report', permissionGroup: 'Reports', permissionName: 'report.aqlauditreport' },
        ],
      },

      {
        label: 'Maintenance & Downtime',
        route: '',
        subItems: [
          //{ label: 'Daily Machine Downtime', route: '/reports/daily-machine-downtime', permissionGroup: 'Reports', permissionName: 'report.dailymachinedowntime' },
          { label: 'Daily Machine Downtime', route: '/reports/daily-machine-downtime', permissionGroup: 'Reports', permissionName: 'report.dailymachinedowntimereport' },
          // { label: 'Quality Machine Downtime', route: '#' },
           { label: 'Machine Downtime Matrix', route: '/reports/machine-downtime-matrix', permissionGroup: 'Reports', permissionName: 'report.machinedowntimematrixreport' },
          { label: 'Machine Maintenance Summary', route: '/reports/machine-maintenance-summary', permissionGroup: 'Reports', permissionName: 'report.maintenancehistory' },
        ],
      },
      {
        label: 'Checking Hourly Report',
        route: '/reports/checking-hourly-report',
        permissionGroup: 'Reports',
      },
      {
        label: 'Daily Operator Wise Quality Performance',
        route: '/reports/daily-operator-wise-quality-performance',
        permissionGroup: 'Reports',
        permissionName: 'report.getdailyoperatorwisequalityperformancereport',
      },
    ],
  },
  {
    key: 'SYSTEM',
    title: 'SYSTEM',
    icon: Settings,
    defaultOpen: true,
    items: [
      { label: 'Master Options', route: '/masters/option-master', permissionGroup: 'Master-Option' },
      // { label: 'Notifications', route: '/notifications' },
      { label: 'Approval Centre', route: '/approval-centre', permissionGroup: 'Approval', permissionName: 'approval.list' },
      { label: 'Light Configuration', route: '/light-configuration', permissionGroup: 'LightConfiguration' },
      { label: 'KPI Configuration Master', route: '/kpi-configuration', permissionGroup: 'Kpimaster', permissionName: 'kpiMaster.list' },
    ],
  },
  // {
  //   key: 'QR GENERATION',
  //   title: 'QR GENERATION',
  //   icon: QrCode,
  //   defaultOpen: true,
  //   items: [
  //     { label: 'Rework QR Code Generation', route: '/qr-generation/rework', permissionGroup: 'Qrgeneration', permissionName: 'reworkqr.list' },
  //     { label: 'Rejection QR Code Generation', route: '/qr-generation/rejection', permissionGroup: 'Qrgeneration', permissionName: 'rejectionqr.list' },
  //   ],
  // },
]

interface SidebarProps {
  isOpen: boolean
  isMobile: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, isMobile, onClose }: SidebarProps) {
  const { theme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)

  // Resolve user permissions once
  const { isSuperAdmin, allowedGroups, allowedPermissions } = useUserPermissionGroups()

  // Helper: should this item be visible?
  const canSeeItem = (item: Record<string, any>): boolean => {
    if (isSuperAdmin) return true

    if (item.subItems && item.subItems.length > 0) {
      return item.subItems.some((sub: any) => canSeeItem(sub))
    }

    if (item.permissionName) {
      return allowedPermissions.has(item.permissionName) || allowedPermissions.has(normalizeActionName(item.permissionName))
    }

    if (item.permissionGroup) {
      if ((item.permissionGroup === 'Kpimaster' || item.permissionGroup === 'KpiConfiguration') && !allowedGroups.has(normalizeGroupName(item.permissionGroup))) {
        return true
      }
      return allowedGroups.has(normalizeGroupName(item.permissionGroup))
    }

    return true
  }

  // Build filtered nav sections (only items the user can see; skip empty sections)
  const visibleSections = useMemo(() =>
    navSections
      .map(section => ({
        ...section,
        items: section.items
          .map((item: any) => {
            if (item.subItems) {
              const visibleSubItems = item.subItems.filter((sub: any) => canSeeItem(sub))
              return { ...item, subItems: visibleSubItems }
            }
            return item
          })
          .filter((item: any) => canSeeItem(item)),
      }))
      .filter(section => section.items.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSuperAdmin, allowedGroups, allowedPermissions])

  const [searchQuery, setSearchQuery] = useState('')
  const isSearching = Boolean(searchQuery.trim())
  const searchLower = searchQuery.trim().toLowerCase()

  const displaySections = useMemo(() => {
    if (!searchLower) return visibleSections

    return visibleSections
      .map(section => {
        const sectionMatches = section.title.toLowerCase().includes(searchLower)

        const matchingItems = section.items
          .map((item: any) => {
            if (item.subItems && item.subItems.length > 0) {
              const itemMatches = item.label.toLowerCase().includes(searchLower)
              const matchingSub = item.subItems.filter((sub: any) =>
                sub.label.toLowerCase().includes(searchLower) || itemMatches || sectionMatches
              )
              if (matchingSub.length > 0) {
                return { ...item, subItems: matchingSub }
              }
              if (itemMatches || sectionMatches) {
                return item
              }
              return null
            }

            if (item.label.toLowerCase().includes(searchLower) || sectionMatches) {
              return item
            }
            return null
          })
          .filter(Boolean)

        if (matchingItems.length > 0) {
          return { ...section, items: matchingItems }
        }
        return null
      })
      .filter(Boolean) as typeof visibleSections
  }, [visibleSections, searchLower])

  const showDashboard = !isSearching || 'dashboard'.includes(searchLower)
  const canSeeSettings = isSuperAdmin || allowedPermissions.has('settings.list') || allowedGroups.has('settings') || allowedGroups.has('setting')
  const showSettings = (!isSearching || 'settings'.includes(searchLower)) && canSeeSettings

  // Save scroll position on scroll
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    sessionStorage.setItem('sidebar-scroll-position', scrollTop.toString())
  }

  // Restore scroll position on mount
  useIsomorphicLayoutEffect(() => {
    const savedScroll = sessionStorage.getItem('sidebar-scroll-position')
    if (savedScroll && navRef.current) {
      navRef.current.scrollTop = parseInt(savedScroll, 10)
    }
  }, [])

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(visibleSections.map(s => [
      s.key,
      s.items.some(item =>
        item.route === pathname ||
        ('subItems' in item && item.subItems && item.subItems.some((sub: any) => sub.route === pathname))
      ),
    ]))
  )

  const [subOpen, setSubOpen] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    visibleSections.forEach(s => {
      s.items.forEach(item => {
        if ('subItems' in item && item.subItems) {
          initial[item.label] = item.subItems.some((sub: any) => sub.route === pathname)
        }
      })
    })
    return initial
  })

  useEffect(() => {
    const activeSection = visibleSections.find(s =>
      s.items.some(item =>
        item.route === pathname ||
        ('subItems' in item && item.subItems && item.subItems.some((sub: any) => sub.route === pathname))
      )
    )
    if (activeSection) {
      setOpen(prev => ({ ...prev, [activeSection.key]: true }))
      activeSection.items.forEach(item => {
        if ('subItems' in item && item.subItems && item.subItems.some((sub: any) => sub.route === pathname)) {
          setSubOpen(prev => ({ ...prev, [item.label]: true }))
        }
      })
    }
  }, [pathname, visibleSections])

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
      <div className="px-3 h-14 flex items-center justify-center shrink-0 border-b border-sidebar-line relative">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="flex items-center justify-center bg-transparent border-none cursor-pointer p-0"
        >
          <Image
            src={theme === 'dark' ? '/logooo.png' : '/logoo.png'}
            alt="Logo"
            width={120}
            height={120}
            className="object-contain"
          />
        </button>
        {isMobile && (
          <button onClick={onClose} className="absolute right-3 bg-transparent border-none cursor-pointer p-1 flex items-center text-t-lighter">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-2.5 text-t-lighter pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchQuery('')
            }}
            placeholder="Search module or report..."
            className="w-full h-8 pl-8 pr-7 text-xs bg-card-alt/80 dark:bg-card-alt/40 border border-sidebar-line hover:border-accent/40 focus:border-accent rounded-lg text-t-primary placeholder:text-t-lighter outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-t-lighter hover:text-t-primary p-0.5 rounded bg-transparent border-none cursor-pointer flex items-center justify-center transition-colors"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav
        ref={navRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pt-3 pb-4 bg-sidebar transition-colors duration-300"
      >

        {/* Dashboard */}
        {showDashboard && (
          <button
            onClick={() => handleNav('/dashboard')}
            className={`w-[calc(100%-32px)] mx-4 mb-3 px-3 py-2 rounded-lg flex items-center gap-3
              cursor-pointer transition-colors border-none font-inherit select-none
              ${pathname === '/dashboard'
                ? 'bg-accent'
                : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}
          >
            <LayoutDashboard size={18} className={pathname === '/dashboard' ? 'text-white' : 'text-t-secondary'} />
            <span className={`text-sm font-normal ${pathname === '/dashboard' ? 'text-white' : 'text-t-secondary'}`}>Dashboard</span>
          </button>
        )}

        {/* Empty Search State */}
        {isSearching && displaySections.length === 0 && !showDashboard && !showSettings && (
          <div className="px-4 py-8 text-center text-t-lighter flex flex-col items-center gap-2">
            <Search size={22} className="opacity-40" />
            <p className="text-xs text-t-muted m-0">No matching modules or reports</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-accent hover:underline bg-transparent border-none cursor-pointer mt-1 font-medium"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Sections — only sections with ≥1 visible item are rendered */}
        {displaySections.map(section => {
          const sectionOpen = isSearching ? true : open[section.key]
          const SectionIcon = 'icon' in section ? section.icon : null

          return (
            <div key={section.key} className="mb-3">
              {/* Section header */}
              <button
                onClick={() => {
                  if (!isSearching) {
                    setOpen(p => ({ ...p, [section.key]: !p[section.key] }))
                  }
                }}
                className={`w-[calc(100%-32px)] mx-4 px-3 py-2 border-none cursor-pointer select-none
                  flex items-center justify-between font-inherit transition-colors rounded-lg
                  ${sectionOpen
                    ? 'bg-accent'
                    : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {SectionIcon && (
                    <SectionIcon size={15} className={`shrink-0 ${sectionOpen ? 'text-white' : 'text-t-light'}`} />
                  )}
                  <span className={`font-semibold whitespace-nowrap
                    ${section.title.length > 15 ? 'text-[11px] tracking-normal' : 'text-xs tracking-wide'}
                    ${sectionOpen ? 'text-white' : 'text-t-light'}`}>
                    {section.title}
                  </span>
                </div>
                {sectionOpen
                  ? <ChevronDown size={14} className="text-white shrink-0 ml-1" />
                  : <ChevronRight size={14} className="text-t-lighter shrink-0 ml-1" />}
              </button>

              {/* Section items */}
              {sectionOpen && (
                <div className="mt-1.5 flex flex-col gap-0.5">
                  {section.items.map(item => {
                    if ('subItems' in item && item.subItems) {
                      const isSubOpen = isSearching ? true : subOpen[item.label]
                      const hasActiveSub = item.subItems.some((sub: any) => isActive(sub.route))
                      return (
                        <div key={item.label} className="w-full">
                          <button
                            onClick={() => {
                              if (!isSearching) {
                                setSubOpen(p => ({ ...p, [item.label]: !p[item.label] }))
                              }
                            }}
                            className={`w-[calc(100%-32px)] mx-4 py-2 pr-3 pl-[34px] cursor-pointer
                              flex items-center justify-between text-left font-inherit transition-colors
                              border-0 border-l-2 select-none rounded-r-lg
                              ${hasActiveSub
                                ? 'bg-accent/5 border-l-accent'
                                : 'bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/5 border-l-transparent'}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-sm2 leading-none ${hasActiveSub ? 'text-accent' : 'text-t-lighter'}`}>&#8226;</span>
                              <span className={`text-sm truncate ${hasActiveSub ? 'text-accent font-medium' : 'text-t-secondary font-normal'}`}>
                                {item.label}
                              </span>
                            </div>
                            {isSubOpen
                              ? <ChevronDown size={13} className={hasActiveSub ? 'text-accent' : 'text-t-lighter'} />
                              : <ChevronRight size={13} className="text-t-lighter" />}
                          </button>
                          {isSubOpen && (
                            <div className="mt-0.5 mb-1 flex flex-col gap-0.5">
                              {item.subItems.map((sub: any) => {
                                const active = isActive(sub.route)
                                return (
                                  <button
                                    key={sub.label}
                                    onClick={() => handleNav(sub.route)}
                                    className={`w-[calc(100%-48px)] mx-6 py-1.5 pr-3 pl-[28px] cursor-pointer
                                      flex items-center gap-2 text-left font-inherit transition-colors
                                      border-0 border-l select-none rounded-r-lg
                                      ${active
                                        ? 'bg-accent/10 border-l-accent'
                                        : 'bg-transparent hover:bg-black/[0.02] dark:hover:bg-white/5 border-l-transparent'}`}
                                  >
                                    <span className={`text-[10px] leading-none ${active ? 'text-accent' : 'text-t-lighter'}`}>-</span>
                                    <span className={`text-xs ${active ? 'text-accent font-medium' : 'text-t-secondary font-normal'}`}>
                                      {sub.label}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    }

                    const active = isActive(item.route)
                    return (
                      <button
                        key={item.label}
                        onClick={() => handleNav(item.route)}
                        className={`w-[calc(100%-32px)] mx-4 py-2 pr-4 pl-[34px] cursor-pointer
                          flex items-center gap-2.5 text-left font-inherit transition-colors
                          border-0 border-l-2
                          ${active
                            ? 'bg-accent/10 border-l-accent'
                            : 'bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/5 border-l-transparent'}`}
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

        {/* Top-level Settings menu item after SYSTEM */}
        {showSettings && (
          <button
            onClick={() => handleNav('/settings')}
            className={`w-[calc(100%-32px)] mx-4 py-2.5 px-3 cursor-pointer
              flex items-center gap-2.5 text-left font-inherit transition-colors rounded-lg mt-1 mb-3
              ${pathname === '/settings'
                ? 'bg-accent font-semibold text-white'
                : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}
          >
            <Settings size={18} className={pathname === '/settings' ? 'text-white' : 'text-t-secondary'} />
            <span className={`text-sm ${pathname === '/settings' ? 'text-white font-semibold' : 'text-t-secondary font-normal'}`}>Settings</span>
          </button>
        )}
      </nav>
    </div>
  )
}
