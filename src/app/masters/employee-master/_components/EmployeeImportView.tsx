'use client'

import { useState, useRef } from 'react'
import {
  ArrowLeft,
  UploadCloud,
  FileSpreadsheet,
  Trash2,
  Clock,
  Download,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { apiUpload } from '@/services/apiClient'

interface EmployeeImportViewProps {
  onBack?: () => void
}

type StepView = 'upload' | 'validate' | 'result' | 'history'

interface HistoryRecord {
  id: string
  fileName: string
  importedOn: string
  totalRows: number
  imported: number
  failed: number
  status: 'Completed' | 'Failed'
}

const TEMPLATE_HEADERS = [
  'S.No',
  'Name',
  'Last Name',
  'Emp code',
  'Mobile',
  'Access',
  'Email',
  'Branch',
  'Department',
  'Designation',
  'Workcategory',
  'Team Name',
  'Role',
  'Join Date',
  'RFID',
]

const MOCK_HISTORY: HistoryRecord[] = [
  { id: '1', fileName: 'Employee_Import_19-08-2026.xlsx', importedOn: '19-08-2026 10:30 AM', totalRows: 26, imported: 22, failed: 4, status: 'Completed' },
  { id: '2', fileName: 'Employee_Import_18-08-2026.xlsx', importedOn: '18-08-2026 04:15 PM', totalRows: 42, imported: 40, failed: 2, status: 'Completed' },
  { id: '3', fileName: 'Employee_Import_18-08-2026_01.xlsx', importedOn: '18-08-2026 11:05 AM', totalRows: 15, imported: 10, failed: 5, status: 'Failed' },
  { id: '4', fileName: 'Employee_Import_17-08-2026.xlsx', importedOn: '17-08-2026 03:20 PM', totalRows: 30, imported: 30, failed: 0, status: 'Completed' },
  { id: '5', fileName: 'Employee_Import_16-08-2026.xlsx', importedOn: '16-08-2026 09:25 AM', totalRows: 18, imported: 16, failed: 2, status: 'Completed' },
]

export default function EmployeeImportView({ onBack }: EmployeeImportViewProps) {
  const [currentView, setCurrentView] = useState<StepView>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Local detection state
  const [detectedRowCount, setDetectedRowCount] = useState<number>(0)

  // API import state
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{
    total_processed: number
    inserted: number
    failed: number
    error_file_url?: string
    message?: string
  }>({
    total_processed: 0,
    inserted: 0,
    failed: 0,
  })

  // Error file download state
  const [downloadingError, setDownloadingError] = useState(false)

  // History search state
  const [historySearch, setHistorySearch] = useState('')

  // Detect rows from selected Excel file
  const countRowsFromFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const firstSheet = wb.SheetNames[0]
      const ws = wb.Sheets[firstSheet]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
      setDetectedRowCount(rows.length)
    } catch {
      setDetectedRowCount(0)
    }
  }

  // File Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportError(null)
      countRowsFromFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportError(null)
      countRowsFromFile(file)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setDetectedRowCount(0)
    setImportError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Template Download Handler (.xlsx) - Styled Header and Wide Columns
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS])

    // Set custom column widths (wch) so headings never hide or truncate while typing
    ws['!cols'] = [
      { wch: 8 },  // S.No
      { wch: 20 }, // Name
      { wch: 20 }, // Last Name
      { wch: 16 }, // Emp code
      { wch: 16 }, // Mobile
      { wch: 14 }, // Access
      { wch: 26 }, // Email
      { wch: 22 }, // Branch
      { wch: 22 }, // Department
      { wch: 22 }, // Designation
      { wch: 22 }, // Workcategory
      { wch: 20 }, // Team Name
      { wch: 18 }, // Role
      { wch: 16 }, // Join Date
      { wch: 18 }, // RFID
    ]

    // Apply header cell styles (Teal background, White Bold text)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:N1')
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          fill: {
            patternType: 'solid',
            fgColor: { rgb: '007B83' },
          },
          font: {
            name: 'Calibri',
            sz: 11,
            bold: true,
            color: { rgb: 'FFFFFF' },
          },
          alignment: {
            horizontal: 'center',
            vertical: 'center',
          },
        }
      }
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, 'Employee_Import_Template.xlsx')
  }

  // Submit Import to Backend API (POST /excel/employee/import)
  const handleImportSubmit = async () => {
    if (!selectedFile) return
    setImporting(true)
    setImportError(null)

    try {
      const fd = new FormData()
      fd.append('file', selectedFile)

      const res = await apiUpload<{
        success?: boolean
        message?: string
        data?: {
          total_processed?: number
          inserted?: number
          failed?: number
          error_file_url?: string
        }
      }>('/excel/employee/import', fd)

      if (res && res.success !== false) {
        const data = res.data || {}
        setImportResult({
          total_processed: data.total_processed ?? detectedRowCount,
          inserted: data.inserted ?? 0,
          failed: data.failed ?? 0,
          error_file_url: data.error_file_url,
          message: res.message || 'Import complete.',
        })
        setCurrentView('result')
      } else {
        setImportError(res.message || 'Import failed. Please check your Excel file and try again.')
      }
    } catch (err: any) {
      console.error('Import error:', err)
      setImportError(err.message || 'Failed to connect to import API. Please retry.')
    } finally {
      setImporting(false)
    }
  }

  // Download Error File returned from backend
  const handleDownloadErrorFile = async () => {
    if (!importResult.error_file_url) return

    setDownloadingError(true)
    try {
      const rawUrl = importResult.error_file_url
      // Always convert to HTTPS if current page is on HTTPS to prevent browser "Mixed Content" block
      const fileUrl = typeof window !== 'undefined' && window.location.protocol === 'https:'
        ? rawUrl.replace(/^http:\/\//i, 'https://')
        : rawUrl

      // 1. Try fetching via Next.js proxy route to bypass CORS
      let res: Response | null = null
      try {
        const proxyRes = await fetch(`/api/download?url=${encodeURIComponent(fileUrl)}`)
        if (proxyRes.ok) {
          res = proxyRes
        }
      } catch {
        res = null
      }

      // 2. If proxy route is not available (404), fetch directly via HTTPS
      if (!res) {
        res = await fetch(fileUrl)
      }

      if (!res.ok) {
        throw new Error(`Failed to download error file (${res.status})`)
      }

      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      // Derive file name
      const urlFileName = fileUrl.split('/').pop()?.split('?')[0]
      const fileName = urlFileName || `employee_import_errors_${Date.now()}.xlsx`

      const link = document.createElement('a')
      link.href = blobUrl
      link.setAttribute('download', fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`)
      document.body.appendChild(link)
      link.click()

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
        document.body.removeChild(link)
      }, 1000)
    } catch (err) {
      console.warn('Blob download failed, falling back to direct navigation:', err)
      const secureUrl = importResult.error_file_url.replace(/^http:\/\//i, 'https://')
      window.open(secureUrl, '_blank')
    } finally {
      setDownloadingError(false)
    }
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 flex flex-col h-full overflow-y-auto space-y-4">

        {/* Page Header */}
        <PageHeader
          title={currentView === 'history' ? 'Upload History' : 'Import Employees'}
          description="Upload Excel template, validate data and review employee import progress"
        >
          <div className="flex items-center gap-2.5 ml-auto">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="h-8.5 px-3.5 text-xs font-semibold text-t-secondary bg-card border border-input-line hover:bg-card-alt rounded-input shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Employees
              </button>
            ) : (
              <Link
                href="/masters/employee-master"
                className="h-8.5 px-3.5 text-xs font-semibold text-t-secondary bg-card border border-input-line hover:bg-card-alt rounded-input shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft size={14} /> Back to Employees
              </Link>
            )}
          </div>
        </PageHeader>

        {/* ── Main View Container ── */}
        {currentView === 'history' ? (
          /* ── Screen 4: Upload History Full Page View ── */
          <div className="bg-card border border-table-line rounded-card shadow-xs p-5 sm:p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-table-line">
              <button
                type="button"
                onClick={() => setCurrentView('upload')}
                className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Import
              </button>

              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t-lighter" />
                  <input
                    type="text"
                    placeholder="Search by file name"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 text-xs bg-input border border-input-line rounded-input outline-none focus:border-accent text-t-secondary"
                  />
                </div>
                <button
                  type="button"
                  className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium text-t-secondary bg-card border border-input-line rounded-input hover:bg-card-alt transition-colors"
                >
                  <Filter size={13} /> Filters
                </button>
              </div>
            </div>

            {/* History Table */}
            <div className="border border-table-line rounded-xl overflow-hidden bg-card shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-table-head border-b border-table-line text-t-secondary font-semibold">
                    <th className="py-2.5 px-4">File Name</th>
                    <th className="py-2.5 px-4">Imported On</th>
                    <th className="py-2.5 px-4 text-center">Total Rows</th>
                    <th className="py-2.5 px-4 text-center">Imported</th>
                    <th className="py-2.5 px-4 text-center">Failed</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                {/* <tbody className="divide-y divide-table-line">
                  {MOCK_HISTORY.filter(h => h.fileName.toLowerCase().includes(historySearch.toLowerCase())).map((row) => (
                    <tr key={row.id} className="hover:bg-card-alt transition-colors">
                      <td className="py-3 px-4 font-medium text-t-primary">{row.fileName}</td>
                      <td className="py-3 px-4 text-t-muted">{row.importedOn}</td>
                      <td className="py-3 px-4 text-center font-medium">{row.totalRows}</td>
                      <td className="py-3 px-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">{row.imported}</td>
                      <td className="py-3 px-4 text-center font-semibold text-rose-600 dark:text-rose-400">{row.failed}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={row.status === 'Completed' ? 'success' : 'error'}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={handleDownloadErrorFile}
                          className="p-1.5 text-t-lighter hover:text-accent rounded transition-colors cursor-pointer"
                          title="Download report"
                        >
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody> */}
              </table>
            </div>

            {/* History Pagination */}
            <div className="flex items-center justify-between pt-2 text-2xs text-t-muted">
              <span>Showing 1 to 5 of 12 entries</span>
              <div className="flex items-center gap-1">
                <button className="p-1 border border-input-line rounded hover:bg-card-alt"><ChevronsLeft size={12} /></button>
                <button className="p-1 border border-input-line rounded hover:bg-card-alt"><ChevronLeft size={12} /></button>
                <button className="px-2 py-0.5 border border-accent bg-accent text-white font-bold rounded">1</button>
                <button className="px-2 py-0.5 border border-input-line rounded hover:bg-card-alt">2</button>
                <button className="px-2 py-0.5 border border-input-line rounded hover:bg-card-alt">3</button>
                <button className="p-1 border border-input-line rounded hover:bg-card-alt"><ChevronRight size={12} /></button>
                <button className="p-1 border border-input-line rounded hover:bg-card-alt"><ChevronsRight size={12} /></button>
                <span className="ml-2 font-medium">5 / page</span>
              </div>
            </div>
          </div>
        ) : (
          /* ── Full Page Multi-Step Layout (Upload / Validate / Result) ── */
          <div className="bg-card border border-table-line rounded-card shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[540px]">

            {/* Left Stepper Sidebar */}
            <div className="w-full md:w-72 bg-card-alt border-b md:border-b-0 md:border-r border-table-line p-6 flex flex-col justify-between shrink-0">
              <div className="space-y-6">
                {/* Step 1 Item */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${currentView === 'upload'
                      ? 'bg-accent text-white shadow-xs'
                      : currentView === 'validate' || currentView === 'result'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-input border border-input-line text-t-muted'
                      }`}
                  >
                    {currentView === 'validate' || currentView === 'result' ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      '1'
                    )}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${currentView === 'upload' ? 'text-t-primary' : 'text-t-muted'}`}>
                      Upload File
                    </h4>
                    <p className="text-2xs text-t-lighter mt-0.5">Select Excel template</p>
                  </div>
                </div>

                {/* Step 2 Item */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${currentView === 'validate'
                      ? 'bg-accent text-white shadow-xs'
                      : currentView === 'result'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-input border border-input-line text-t-muted'
                      }`}
                  >
                    {currentView === 'result' ? <CheckCircle2 size={18} /> : '2'}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${currentView === 'validate' ? 'text-t-primary' : 'text-t-muted'}`}>
                      Validate & Import
                    </h4>
                    <p className="text-2xs text-t-lighter mt-0.5">Review data summary</p>
                  </div>
                </div>

                {/* Step 3 Item */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${currentView === 'result'
                      ? 'bg-accent text-white shadow-xs'
                      : 'bg-input border border-input-line text-t-muted'
                      }`}
                  >
                    3
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${currentView === 'result' ? 'text-t-primary' : 'text-t-muted'}`}>
                      Import Result
                    </h4>
                    <p className="text-2xs text-t-lighter mt-0.5">Completion status</p>
                  </div>
                </div>
              </div>

              {/* Bottom Upload History Button */}
              {currentView === 'upload' && (
                <button
                  type="button"
                  onClick={() => setCurrentView('history')}
                  className="mt-8 w-full py-2.5 px-3.5 flex items-center justify-center gap-2 text-xs font-semibold text-t-secondary bg-card border border-input-line hover:bg-card-alt rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  <Clock size={14} className="text-accent" />
                  Upload History
                </button>
              )}
            </div>

            {/* Right Main Body Content */}
            <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 bg-card overflow-y-auto">

              {/* ── STEP 1: UPLOAD FILE ── */}
              {currentView === 'upload' && (
                <div className="flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-t-primary">Upload Excel File</h3>
                      <p className="text-xs text-t-muted mt-1">
                        Download the template and fill the data into Excel file. Then upload the file to import employees.
                      </p>
                    </div>

                    {/* Drag & Drop Zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all ${dragOver ? 'border-accent bg-accent/5' : 'border-table-line bg-card-alt/40 hover:bg-card-alt'
                        }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                      />
                      <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-3.5">
                        <UploadCloud size={28} />
                      </div>
                      <p className="text-xs font-bold text-t-primary">
                        Drag and drop your Excel file here
                      </p>
                      <p className="text-2xs text-t-lighter my-1.5">or</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1 px-5 py-2.5 text-xs font-bold text-white bg-accent hover:bg-brand-hover rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        Choose File
                      </button>
                    </div>

                    {/* Selected File Card - Only visible when a file is picked */}
                    {selectedFile && (
                      <div className="p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            <FileSpreadsheet size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-t-primary truncate max-w-[280px] sm:max-w-[380px]">
                              {selectedFile.name}
                            </p>
                            <p className="text-2xs text-t-muted">{(selectedFile.size / 1024).toFixed(1)} KB ({detectedRowCount} rows detected)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-semibold text-accent hover:underline cursor-pointer"
                          >
                            Change File
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-1.5 text-t-lighter hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 1 Footer Controls */}
                  <div className="pt-5 border-t border-table-line flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="px-4 py-2.5 text-xs font-semibold text-accent border border-accent rounded-xl hover:bg-accent hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} /> Download Template
                    </button>
                    <div className="flex items-center gap-2.5">
                      {onBack ? (
                        <button
                          type="button"
                          onClick={onBack}
                          className="px-4 py-2.5 text-xs font-semibold text-t-secondary bg-card border border-input-line hover:bg-card-alt rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      ) : (
                        <Link
                          href="/masters/employee-master"
                          className="px-4 py-2.5 text-xs font-semibold text-t-secondary bg-card border border-input-line hover:bg-card-alt rounded-xl transition-colors"
                        >
                          Cancel
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentView('validate')}
                        disabled={!selectedFile}
                        className="px-6 py-2.5 text-xs font-bold text-white bg-accent hover:bg-brand-hover rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: VALIDATE & IMPORT ── */}
              {currentView === 'validate' && (
                <div className="flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-t-primary">Validate & Import Data</h3>
                      <p className="text-xs text-t-muted mt-1">
                        Ready to import <span className="font-semibold text-t-primary">{selectedFile?.name}</span> ({detectedRowCount} rows detected).
                      </p>
                    </div>

                    {/* Summary Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl border border-table-line bg-card-alt/40 flex flex-col justify-between shadow-2xs">
                        <span className="text-2xs font-bold text-t-muted uppercase tracking-wider">File Selected</span>
                        <div className="flex items-center gap-2.5 mt-2">
                          <FileSpreadsheet size={20} className="text-accent" />
                          <span className="text-sm font-bold text-t-primary truncate">{selectedFile?.name}</span>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl border border-accent/30 bg-accent/5 flex flex-col justify-between shadow-2xs">
                        <span className="text-2xs font-bold text-accent uppercase tracking-wider">Total Rows Detected</span>
                        <span className="text-3xl font-bold text-t-primary mt-2">{detectedRowCount}</span>
                      </div>
                    </div>

                    {/* Error Banner if any */}
                    {importError && (
                      <div className="p-4 border border-rose-500/30 bg-rose-500/10 rounded-xl flex items-start gap-3 text-xs text-rose-600 dark:text-rose-400">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Import Failed</p>
                          <p className="text-2xs mt-0.5">{importError}</p>
                        </div>
                      </div>
                    )}

                    <div className="p-4 rounded-xl border border-table-line bg-card-alt/30 text-xs text-t-secondary space-y-1.5">
                      <p className="font-semibold text-t-primary">Import Process Note:</p>
                      <p className="text-2xs text-t-muted leading-relaxed">
                        Clicking <span className="font-bold text-accent">Import</span> will upload the Excel file directly to the backend. The backend will validate mandatory fields, look up departments, branches, roles, designations, and create users.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 Footer Controls */}
                  <div className="pt-5 border-t border-table-line flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentView('upload')}
                      disabled={importing}
                      className="px-4 py-2.5 text-xs font-semibold text-t-secondary bg-card border border-input-line hover:bg-card-alt rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Back
                    </button>
                    <div className="flex items-center gap-2.5">
                      {onBack ? (
                        <button
                          type="button"
                          onClick={onBack}
                          disabled={importing}
                          className="px-4 py-2.5 text-xs font-semibold text-t-secondary bg-card border border-input-line hover:bg-card-alt rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      ) : (
                        <Link
                          href="/masters/employee-master"
                          className="px-4 py-2.5 text-xs font-semibold text-t-secondary bg-card border border-input-line hover:bg-card-alt rounded-xl transition-colors"
                        >
                          Cancel
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleImportSubmit}
                        disabled={importing}
                        className="px-6 py-2.5 text-xs font-bold text-white bg-accent hover:bg-brand-hover rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {importing ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Importing...
                          </>
                        ) : (
                          <>
                            <UploadCloud size={14} /> Import
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: IMPORT RESULT ── */}
              {currentView === 'result' && (
                <div className="flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-6">
                    {/* Completion Banner */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={36} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-t-primary">
                          {importResult.failed === 0 ? 'Import Completed Successfully!' : 'Import Completed with Errors'}
                        </h3>
                        <p className="text-xs text-t-muted mt-0.5">{importResult.message}</p>
                      </div>
                    </div>

                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-5 rounded-2xl border border-table-line bg-card-alt/40 shadow-2xs">
                        <span className="text-2xs font-bold text-t-muted uppercase tracking-wider">Total Rows</span>
                        <p className="text-3xl font-bold text-t-primary mt-2">{importResult.total_processed}</p>
                      </div>
                      <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 shadow-2xs">
                        <span className="text-2xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Imported Successfully</span>
                        <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{importResult.inserted}</p>
                      </div>
                      <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 shadow-2xs">
                        <span className="text-2xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Failed Rows</span>
                        <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">{importResult.failed}</p>
                      </div>
                    </div>

                    {/* What's Next Box */}
                    <div className="p-5 border border-table-line bg-card-alt/30 rounded-2xl space-y-3">
                      <h4 className="text-xs font-bold text-t-primary">Summary Details</h4>
                      <ul className="space-y-2 text-xs text-t-secondary">
                        <li className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 size={15} /> {importResult.inserted} employees have been imported successfully.
                        </li>
                        {importResult.failed > 0 && (
                          <li className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-medium">
                            <XCircle size={15} /> {importResult.failed} rows failed. Download the error file below to view failure reasons.
                          </li>
                        )}
                        <li className="flex items-center gap-2.5 text-t-muted">
                          <CheckCircle2 size={15} /> You can view newly imported employees in the Employee Master list.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Step 3 Footer Controls */}
                  <div className="pt-5 border-t border-table-line flex items-center justify-between gap-3">
                    {importResult.error_file_url || importResult.failed > 0 ? (
                      <button
                        type="button"
                        onClick={handleDownloadErrorFile}
                        disabled={downloadingError}
                        className="px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloadingError ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Downloading...
                          </>
                        ) : (
                          <>
                            <Download size={14} /> Download Error File
                          </>
                        )}
                      </button>
                    ) : (
                      <div />
                    )}

                    {onBack ? (
                      <button
                        type="button"
                        onClick={onBack}
                        className="px-7 py-2.5 text-xs font-bold text-white bg-accent hover:bg-brand-hover rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        Done
                      </button>
                    ) : (
                      <Link
                        href="/masters/employee-master"
                        className="px-7 py-2.5 text-xs font-bold text-white bg-accent hover:bg-brand-hover rounded-xl transition-colors shadow-xs"
                      >
                        Done
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
