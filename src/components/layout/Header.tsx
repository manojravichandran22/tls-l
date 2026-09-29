'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sun, Moon, Lock, Settings, Bell, ChevronDown, Menu, LogOut } from 'lucide-react'
import { clearAuthCookies, getAuthUser } from '@/lib/cookies'
import { useTheme } from '@/hooks/useTheme'
import { fetchRoles } from '@/services/dropdownService'

interface HeaderProps {
  isMobile: boolean
  onMenuToggle: () => void
}

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  // Masters
  '/masters/company-master': 'Company',
  '/masters/branch-master': 'Branch',
  '/masters/zone-master': 'Zone',
  '/masters/line-master': 'Line',
  '/masters/workstation-master': 'Work Station',
  '/masters/role-master': 'Role',
  '/masters/department-master': 'Department',
  '/masters/designation-master': 'Designation',
  '/masters/employee-master': 'Employee',
  '/masters/shift-master': 'Shift Master',
  '/masters/shift-modify': 'Shift Allocation',
  '/masters/work-list-master': 'Work List',
  '/masters/machine-hub': 'Machine Hub',
  '/masters/operation-master': 'Operation',
  '/masters/order-master': 'Order',
  '/masters/style-master': 'Style',
  '/masters/defect-master': 'Defect',
  '/masters/option-master': 'Option Master',
  '/masters/device-master': 'Device Master',
  '/masters/work-category-master': 'Work Category',
  '/masters/user-master': 'User Master',
  '/masters/preventive-maintenance': 'Preventive Maintenance',

  // Configuration
  '/configuration/tls-id-registration': 'TLS ID Registration',
  '/configuration/tls-line-mapping': 'TLS & Line Mapping',
  '/notifications': 'Notifications',
  '/approval-centre': 'Approval Centre',

  // Production Planning
  '/production-planning/operation-bulletin': 'Operation Bulletin (OB)',
  '/production-planning/style-summary': 'Style Summary',
  '/production-planning/order-management': 'Order Management',
  '/production-planning/style-order-mapping': 'Style & Order Mapping',
  '/production-planning/order-line-allocation': 'Order to Line Allocation',

  // Live Tracking
  '/live-tracking/tls-control-center': 'TLS Control Center',
  '/live-tracking/rework-control-center': 'Rework Control Center',
  '/live-tracking/rejection-control-center': 'Rejection Control Center',

  // QR Generation
  '/qr-generation/rejection': 'Rejection QR',
  '/qr-generation/rework': 'Rework QR',

  // TV Display
  '/tv-display/line-tv-display': 'Line TV Display',
  '/tv-display/quality-tv': 'Quality TV',
  '/tv-display/target-manpower-planning': 'Target Manpower Planning',

  // Reports
  '/reports/category-wise-defect': 'Category Wise Defect',
  '/reports/checking-report': 'Checking Report',
  '/reports/checking-hourly-report': 'Checking Hourly Report',
  '/reports/daily-aql-audit-line-summary': 'Daily AQL Audit Line Summary',
  '/reports/daily-aql-audit-wise-report': 'Daily AQL Audit Wise Report',
  '/reports/daily-machine-downtime': 'Daily Machine Downtime',
  '/reports/efficiency-report': 'Efficiency Report',
  '/reports/input-report': 'Input Report',
  '/reports/linewise-rework-rejection-report': 'Linewise Rework & Rejection Report',
  '/reports/machine-maintenance-summary': 'Machine Maintenance Summary',
  '/reports/order-line-summary': 'Order Line Summary',
  '/reports/order-summary': 'Order Summary',
  '/reports/rejection-cost-analysis': 'Rejection Cost Analysis',
  '/reports/rejection-summary': 'Rejection Summary',
  '/reports/rework-cost-analysis': 'Rework Cost Analysis',
  '/reports/rework-summary': 'Rework Summary',
  '/reports/tls-audit': 'TLS Audit',
}

function formatSegmentTitle(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getBreadcrumbs(pathname: string) {
  const label = ROUTE_LABELS[pathname]

  if (pathname === '/' || pathname === '/dashboard') {
    return [{ text: 'Dashboard', active: true }]
  }

  if (pathname.startsWith('/masters/')) {
    const fallback = formatSegmentTitle(pathname.replace('/masters/', '').split('/')[0])
    return [
      { text: 'Master', active: false },
      { text: label || fallback, active: true },
    ]
  }
  if (pathname.startsWith('/configuration/')) {
    const fallback = formatSegmentTitle(pathname.replace('/configuration/', '').split('/')[0])
    return [
      { text: 'Configuration', active: false },
      { text: label || fallback, active: true },
    ]
  }
  if (pathname.startsWith('/production-planning/')) {
    const fallback = formatSegmentTitle(pathname.replace('/production-planning/', '').split('/')[0])
    return [
      { text: 'Production Planning', active: false },
      { text: label || fallback, active: true },
    ]
  }
  if (pathname.startsWith('/reports/')) {
    const fallback = formatSegmentTitle(pathname.replace('/reports/', '').split('/')[0])
    return [
      { text: 'Reports', active: false },
      { text: label || fallback, active: true },
    ]
  }
  if (pathname.startsWith('/live-tracking/')) {
    const fallback = formatSegmentTitle(pathname.replace('/live-tracking/', '').split('/')[0])
    return [
      { text: 'Live Tracking', active: false },
      { text: label || fallback, active: true },
    ]
  }
  if (pathname.startsWith('/qr-generation/')) {
    const fallback = formatSegmentTitle(pathname.replace('/qr-generation/', '').split('/')[0])
    return [
      { text: 'QR Generation', active: false },
      { text: label || fallback, active: true },
    ]
  }
  if (pathname.startsWith('/tv-display/')) {
    const fallback = formatSegmentTitle(pathname.replace('/tv-display/', '').split('/')[0])
    return [
      { text: 'TV Display', active: false },
      { text: label || fallback, active: true },
    ]
  }

  if (label) return [{ text: label, active: true }]
  return [{ text: 'Dashboard', active: true }]
}

export default function Header({ isMobile, onMenuToggle }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    setMounted(true)
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const dateStr = mounted ? now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
  const timeStr = mounted ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''
  const shift = useMemo(() => {
    if (!mounted) return ''
    const h = now.getHours()
    if (h >= 6 && h < 14) return 'Morning'
    if (h >= 14 && h < 22) return 'Evening'
    return 'Night'
  }, [now, mounted])

  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const [user, setUser] = useState<Record<string, unknown> | null>(() => (typeof window !== 'undefined' ? getAuthUser() : null))
  const [roleName, setRoleName] = useState<string>('')

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

  useEffect(() => {
    if (!user) return
    const directRole = (user.role_name as string) || (user.roleInfo as { name?: string })?.name || (user.role as { name?: string })?.name || (typeof user.role === 'string' && isNaN(Number(user.role)) ? user.role : '') || (user.designation_name as string)
    if (directRole) {
      setRoleName(directRole)
      return
    }
    const roleKey = user.role_id ?? user.role ?? user.role_code
    if (Number(roleKey) === 100) {
      setRoleName('Super Admin')
      return
    }
    if (roleKey != null) {
      fetchRoles(user.branch_id ? String(user.branch_id) : undefined)
        .then((roles) => {
          const match = roles.find((r) => String(r.id) === String(roleKey) || String(r.role) === String(roleKey))
          if (match?.name) setRoleName(match.name)
        })
        .catch(() => {})
    }
  }, [user])

  const rawUserName = (user?.name as string) || (user?.username as string) || 'Admin User'
  const userName = rawUserName ? rawUserName.charAt(0).toUpperCase() + rawUserName.slice(1) : ''
  const userRole = roleName || (user?.role_name as string) || 'Super Admin'

  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    clearAuthCookies()
    router.push('/login')
  }

  return (
    <div className={`h-14 shrink-0 bg-header border-b border-header-line flex items-center justify-between gap-3 ${isMobile ? 'px-3' : 'px-5'}`}>
      {/* Left */}
      <div className="flex items-center gap-2.5">
        {isMobile && (
          <button onClick={onMenuToggle} className="bg-transparent border-none cursor-pointer p-1 text-t-body flex items-center shrink-0">
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-1.5">
          {getBreadcrumbs(pathname).map((crumb, i) => (
            <span key={crumb.text} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-xs text-t-lighter">&rsaquo;</span>}
              <span className={`${isMobile ? 'text-sm' : 'text-md'} ${crumb.active ? 'font-bold text-t-primary' : 'font-normal text-t-lighter'}`}>
                {crumb.text}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
        {!isMobile && (
          <span className="text-xs text-t-light whitespace-nowrap">
            {dateStr} &nbsp;|&nbsp; {timeStr} &nbsp;|&nbsp; Shift: {shift}
          </span>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`bg-transparent border-none cursor-pointer p-1 flex items-center transition-colors ${isDark ? 'text-orange-300' : 'text-t-body hover:text-t-primary'}`}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Icon buttons */}
        {(isMobile ? [Bell] : [Bell]).map((Icon) => (
          <button key={Icon.displayName} className="bg-transparent border-none cursor-pointer p-1 text-t-body hover:text-t-primary flex items-center transition-colors">
            <Icon size={17} />
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-6 bg-header-line" />

        {/* User dropdown */}
        <div ref={dropdownRef} className="relative">
          <div
            onClick={() => setDropdownOpen(v => !v)}
            className={`flex items-center cursor-pointer select-none ${isMobile ? 'gap-1.5' : 'gap-2'}`}
          >
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
            {!isMobile && (
              <div>
                <p className="m-0 text-xs font-semibold text-t-secondary leading-tight capitalize">{userName}</p>
                <p className="m-0 text-2xs text-t-lighter">{userRole}</p>
              </div>
            )}
            <ChevronDown
              size={14}
              className={`text-t-lighter transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </div>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute top-[calc(100%+8px)] right-0 bg-dropdown rounded-lg shadow-lg border border-t-border min-w-[180px] z-[200] overflow-hidden select-none">
              <div className="px-3.5 py-3 border-b border-table-line">
                <p className="m-0 text-sm font-semibold text-t-secondary">{userName}</p>
                <p className="m-0 mt-0.5 text-xs2 text-t-lighter">{userRole}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-3.5 py-2.5 bg-transparent border-none cursor-pointer flex items-center gap-2 text-sm text-red-500 font-medium font-inherit hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
