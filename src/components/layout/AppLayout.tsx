'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useWindowSize } from '@/hooks/useWindowSize'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const width = useWindowSize()
  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1024
  const isCompact = isMobile || isTablet
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="fixed inset-0 flex font-[Inter,system-ui,sans-serif] bg-page transition-colors duration-300">
      {/* Overlay backdrop for mobile/tablet */}
      {isCompact && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/45 z-40"
        />
      )}

      <Sidebar
        isOpen={!isCompact || sidebarOpen}
        isMobile={isCompact}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden bg-card">
        <Header
          isMobile={isCompact}
          onMenuToggle={() => setSidebarOpen(s => !s)}
        />
        <main className={`flex-1 overflow-y-auto ${isMobile ? 'p-3' : isTablet ? 'px-4 py-3' : 'px-5 py-4'}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
