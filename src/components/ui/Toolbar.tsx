'use client'

import { Download, Plus, Loader2, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import SearchInput from './SearchInput'

interface ToolbarProps {
  title?: string
  search?: string
  onSearchChange?: (val: string) => void
  searchPlaceholder?: string
  onAdd?: () => void
  addLabel?: string
  showExport?: boolean
  onExport?: () => void
  onExportPdf?: () => void
  exporting?: boolean
  onImport?: (file: File) => void
  onImportClick?: () => void
  importing?: boolean
  children?: React.ReactNode
}

export default function Toolbar({
  title, search, onSearchChange, searchPlaceholder = 'Search',
  onAdd, addLabel = 'Add New', showExport = true,
  onExport, onExportPdf, exporting = false,
  onImport, onImportClick, importing = false, children,
}: ToolbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onImport) {
      onImport(file)
    }
    e.target.value = ''
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-table-line gap-2 flex-wrap">
      {title && (
        <span className="text-sm font-semibold text-t-secondary hidden sm:inline">{title}</span>
      )}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto justify-end ml-auto">
        {children}
        {onSearchChange && (
          <SearchInput
            value={search ?? ''}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="w-full sm:w-auto"
          />
        )}
        {(onImport || onImportClick) && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <button
              onClick={() => {
                if (onImportClick) {
                  onImportClick()
                } else if (onImport) {
                  if (onImport.length === 0) {
                    ;(onImport as any)()
                  } else {
                    fileInputRef.current?.click()
                  }
                }
              }}
              disabled={importing}
              type="button"
              className="h-8 px-2.5 sm:px-3 flex items-center gap-1.5 bg-card
                border border-accent rounded-input cursor-pointer select-none
                text-sm2 text-accent font-semibold font-inherit hover:bg-accent hover:text-white
                transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {importing ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={13} />
              )}
              <span className="hidden sm:inline">{importing ? 'Importing...' : 'Import'}</span>
            </button>
          </>
        )}
        {showExport && (onExport || onExportPdf) && (
          <div className="relative" ref={menuRef}>
            {onExport && onExportPdf ? (
              <>
                <button
                  onClick={() => setShowExportMenu(prev => !prev)}
                  disabled={exporting}
                  suppressHydrationWarning
                  className="h-8 px-2.5 sm:px-3 flex items-center gap-1.5 bg-card
                    border border-accent rounded-input cursor-pointer select-none
                    text-sm2 text-accent font-semibold font-inherit hover:bg-accent hover:text-white
                    transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {exporting
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Download size={13} />}
                  <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export'}</span>
                  <ChevronDown size={11} />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-1 bg-card border border-table-line
                    rounded-input shadow-lg z-[9999] min-w-[130px]">
                    <button
                      onClick={() => { onExport?.(); setShowExportMenu(false) }}
                      className="w-full px-3 py-2 text-left text-sm2 hover:bg-accent
                        hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet size={13} /> Excel
                    </button>
                    <button
                      onClick={() => { onExportPdf?.(); setShowExportMenu(false) }}
                      className="w-full px-3 py-2 text-left text-sm2 hover:bg-accent
                        hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FileText size={13} /> PDF
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => (onExportPdf ? onExportPdf() : onExport?.())}
                disabled={exporting}
                suppressHydrationWarning
                className="h-8 px-2.5 sm:px-3 flex items-center gap-1.5 bg-card
                  border border-accent rounded-input cursor-pointer select-none
                  text-sm2 text-accent font-semibold font-inherit hover:bg-accent hover:text-white
                  transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {exporting
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Download size={13} />}
                <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export'}</span>
              </button>
            )}
          </div>
        )}
        {onAdd && (
          <button
            onClick={onAdd}
            suppressHydrationWarning
            className="h-8 px-2.5 sm:px-3.5 flex items-center gap-1.5 bg-accent hover:bg-accent-hover
              border-none rounded-input cursor-pointer select-none text-sm2 text-white
              font-semibold font-inherit transition-colors"
          >
            <Plus size={13} /> <span className="hidden sm:inline">{addLabel}</span>
          </button>
        )}
      </div>
    </div>
  )
}