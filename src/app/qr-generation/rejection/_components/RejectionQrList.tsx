'use client'

import { useState } from 'react'
import { Download, X } from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import AdvancedTable, { type AdvancedColumn } from '@/components/ui/AdvancedTable'
import { type RejectionQrRecord } from './types'

interface BranchOption {
  id: number | string
  branch_name: string
}

interface RejectionQrListProps {
  records: RejectionQrRecord[]
  loading: boolean
  search: string
  branchFilter: string
  branches: BranchOption[]
  isAdmin: boolean
  userBranchId?: number | string | null
  canCreate?: boolean
  page: number
  perPage: number
  totalCount: number
  totalPages: number
  onSearchChange: (search: string) => void
  onBranchChange: (branchId: string) => void
  onAdd: () => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
}

function getQrCodeText(row: RejectionQrRecord): string {
  if (row.qr_code && typeof row.qr_code === 'string' && !row.qr_code.startsWith('data:image/')) {
    return String(row.qr_code)
  }
  if (row.code && typeof row.code === 'string' && !row.code.startsWith('data:image/')) {
    return String(row.code)
  }
  if (row.qr && typeof row.qr === 'string' && !row.qr.startsWith('data:image/')) {
    return String(row.qr)
  }
  if (row.id) return `REJ-${row.id}`
  return '—'
}

function getQrImageUrl(row: RejectionQrRecord, codeText: string): string {
  if (row.qr && typeof row.qr === 'string') {
    if (row.qr.startsWith('data:image/')) return row.qr
    if (row.qr.startsWith('http://') || row.qr.startsWith('https://')) return row.qr
    if (row.qr.length > 100) return `data:image/png;base64,${row.qr}`
  }

  if (row.qr_code && typeof row.qr_code === 'string' && row.qr_code.startsWith('data:image/')) {
    return row.qr_code
  }

  if (codeText && codeText !== '—') {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(codeText)}`
  }

  return ''
}

function downloadQrCode(imgSrc: string, fileName: string) {
  if (!imgSrc) return
  const link = document.createElement('a')
  link.href = imgSrc
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function RejectionQrList({
  records,
  loading,
  search,
  branchFilter,
  branches,
  isAdmin,
  userBranchId,
  canCreate,
  page,
  perPage,
  totalCount,
  totalPages,
  onSearchChange,
  onBranchChange,
  onAdd,
  onPageChange,
  onPerPageChange,
}: RejectionQrListProps) {
  const [previewQr, setPreviewQr] = useState<{ imgSrc: string; code: string; fileName: string } | null>(null)

  const columns: AdvancedColumn<RejectionQrRecord>[] = [
    {
      key: 'sn',
      header: 'Serial No',
      sortable: false,
      render: (_, index) => <span className="text-t-body font-medium">{(page - 1) * perPage + index + 1}</span>,
    },
    {
      key: 'branch',
      header: 'Branch',
      sortable: true,
      sortValue: (row) => row.branch_name || row.branch?.branch_name || branches.find(b => String(b.id) === String(row.branch_id))?.branch_name || '',
      render: (row) => {
        const name = row.branch_name || row.branch?.branch_name || branches.find(b => String(b.id) === String(row.branch_id))?.branch_name || '—'
        return <span className="text-t-secondary font-medium text-xs">{name}</span>
      },
    },
    {
      key: 'qr_code',
      header: 'QR Code',
      sortable: true,
      sortValue: (row) => getQrCodeText(row),
      render: (row) => (
        <span className="text-t-primary font-mono font-semibold">{getQrCodeText(row)}</span>
      ),
    },
    {
      key: 'qr_image',
      header: 'QR Image',
      sortable: false,
      render: (row) => {
        const codeText = getQrCodeText(row)
        const imgSrc = getQrImageUrl(row, codeText)
        const fileName = `Rejection_QR_${codeText}.png`
        if (!imgSrc) return <span className="text-t-lighter">—</span>

        return (
          <div className="flex items-center gap-2">
          <img
            src={imgSrc}
            alt="Rejection QR"
            className="w-9 h-9 rounded border border-input-line object-contain cursor-pointer bg-white hover:scale-110 transition-transform p-0.5"
            onClick={() => setPreviewQr({ imgSrc, code: codeText, fileName })}
            title="Click to preview QR code"
          />
            <button
              type="button"
              onClick={() => downloadQrCode(imgSrc, fileName)}
              className="p-1.5 text-t-lighter hover:text-accent rounded-md hover:bg-accent/10 transition-colors cursor-pointer"
              title="Download QR Code"
            >
              <Download size={15} />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <AdvancedTable<RejectionQrRecord>
        header={
          <Toolbar
            title="Rejection QR Code Generation"
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by QR Code"
            onAdd={canCreate ? onAdd : undefined}
            addLabel="Rejection QR Code Generation"
          >
            <select
              value={branchFilter}
              onChange={e => onBranchChange(e.target.value)}
              disabled={!isAdmin && Boolean(userBranchId)}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent disabled:opacity-85 disabled:cursor-not-allowed disabled:bg-card-alt font-medium"
            >
              {isAdmin && <option value="">All Branches</option>}
              {branches.map(b => (
                <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
              ))}
            </select>
          </Toolbar>
        }
        columns={columns}
        data={records}
        loading={loading}
        emptyMessage="No rejection QR codes found"
        rowKey={(row) => String(row.id || row.uuid || row.qr_code || Math.random())}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        countLabel="record"
        countLabelPlural="records"
      />

      {/* ── QR Code Preview Modal ── */}
      {previewQr && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-table-line rounded-card shadow-2xl max-w-sm w-full p-5 flex flex-col items-center gap-4 relative">
            <button
              type="button"
              onClick={() => setPreviewQr(null)}
              className="absolute top-3 right-3 text-t-muted hover:text-t-primary p-1 rounded-md transition-colors cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>

            <div className="text-center w-full border-b border-table-line pb-3">
              <h3 className="text-sm font-bold text-t-primary">Rejection QR Code Preview</h3>
              <p className="text-xs text-t-muted mt-0.5 font-mono">{previewQr.code}</p>
            </div>

            <div className="bg-white p-4 border border-table-line rounded-xl shadow-inner flex items-center justify-center">
              <img
                src={previewQr.imgSrc}
                alt="QR Code Preview"
                className="w-56 h-56 object-contain"
              />
            </div>

            <div className="flex justify-center w-full pt-1">
              <button
                type="button"
                onClick={() => setPreviewQr(null)}
                className="px-6 py-1.5 text-xs font-semibold text-t-secondary bg-card border border-input-line hover:bg-card-alt rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
