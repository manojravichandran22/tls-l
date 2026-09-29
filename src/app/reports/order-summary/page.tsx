'use client'

import { useState, useRef } from 'react'
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import OrderSummaryList from './_components/OrderSummaryList'
import { usePermissions } from '@/hooks/usePermissions'

export default function OrderSummaryPage() {
  const { can } = usePermissions('Reports')
  const canView = can('report.ordersummary')

  const [showExportMenu, setShowExportMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const exportExcelRef = useRef<(() => void) | null>(null)
  const exportPdfRef = useRef<(() => void) | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const handleDataLoaded = (exportExcel: () => void, exportPdf: () => void, exporting: boolean) => {
    exportExcelRef.current = exportExcel
    exportPdfRef.current = exportPdf
    setIsExporting(exporting)
  }

  return (
    <AppLayout fixedHeight>
      <PageHeader
        title="Order Summary Report"
        description="Summary overview of orders and production details"
      >
        {/* Export button — top right */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowExportMenu(p => !p)}
            disabled={isExporting}
            className="h-8 px-3 flex items-center gap-1.5 bg-card border border-accent rounded-lg text-sm text-accent font-semibold hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
          >
            <Download size={13} />
            Export
            <ChevronDown size={11} />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-1 bg-card border border-table-line rounded-lg shadow-lg z-[9999] min-w-[130px]">
              <button
                onClick={() => {
                  setShowExportMenu(false)
                  exportExcelRef.current?.()
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-white flex items-center gap-2 transition-colors rounded-t-lg"
              >
                <FileSpreadsheet size={13} /> Excel
              </button>
              <button
                onClick={() => {
                  setShowExportMenu(false)
                  exportPdfRef.current?.()
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-white flex items-center gap-2 transition-colors rounded-b-lg"
              >
                <FileText size={13} /> PDF
              </button>
            </div>
          )}
        </div>
      </PageHeader>

      <OrderSummaryList onDataLoaded={handleDataLoaded} />
    </AppLayout>
  )
}
