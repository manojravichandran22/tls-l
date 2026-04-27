'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sun, Moon, Lock, Settings, Bell, ChevronDown, Menu, LogOut } from 'lucide-react'
import { clearAuthCookies, getAuthUser } from '@/lib/cookies'
import { useTheme } from '@/hooks/useTheme'

interface HeaderProps {
  isMobile: boolean
  onMenuToggle: () => void
}

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
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
  '/masters/shift-modify': 'Shift Modify',
  '/masters/work-list-master': 'Work List',
  '/masters/machine-hub': 'Machine Hub',
  '/masters/operation-master': 'Operation',
  '/masters/order-master': 'Order',
  '/masters/style-master': 'Style',
  '/masters/defect-master': 'Defect',
  '/configuration/tls-id-registration': 'TLS ID Registration',
  '/configuration/tls-line-mapping': 'TLS & Line Mapping',
  '/notifications': 'Notifications',
  '/approval-centre': 'Approval Centre',
}

function getBreadcrumbs(pathname: string) {
  const label = ROUTE_LABELS[pathname]
  if (!label) return [{ text: 'Dashboard', active: true }]

  if (pathname.startsWith('/masters/')) {
    return [
      { text: 'Master', active: false },
      { text: label, active: true },
    ]
  }
  if (pathname.startsWith('/configuration/')) {
    return [
      { text: 'Configuration', active: false },
      { text: label, active: true },
    ]
  }
  return [{ text: label, active: true }]
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

  const user = mounted ? getAuthUser() : null
  const userName = (user?.name as string) || (user?.username as string) || 'Admin User'
  const userRole = (user?.role as string) || 'Super Admin'
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
            <span key={i} className="flex items-center gap-1.5">
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
        {(isMobile ? [Bell] : [Lock, Settings, Bell]).map((Icon, i) => (
          <button key={i} className="bg-transparent border-none cursor-pointer p-1 text-t-body hover:text-t-primary flex items-center transition-colors">
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
                <p className="m-0 text-xs font-semibold text-t-secondary leading-tight">{userName}</p>
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
