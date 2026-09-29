'use client'

import { useState } from 'react'
import { Pencil, Trash2, Eye, Download, X } from 'lucide-react'
import Toolbar from '@/components/ui/Toolbar'
import AdvancedTable, { type AdvancedColumn, type ActionItem } from '@/components/ui/AdvancedTable'
import Badge from '@/components/ui/Badge'
import { type Device, type BranchOption, downloadQrCode } from './types'
import { useExportPdf } from '@/hooks/useExportPdf'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'

const HEADING_OPTIONS: { key: string; label: string }[] = [
  { key: 'code', label: 'Device Code' },
  { key: 'tls_id', label: 'Qone ID' },
  { key: 'qr_code', label: 'QR Code' },
  { key: 'mac_id', label: 'MAC Address / IP' },
  { key: 'branch', label: 'Branch' },
  { key: 'status', label: 'Status' },
]

function formatExportHeadings(headings: string[]): string[] {
  const set = new Set<string>()
  headings.forEach((h) => {
    set.add(h)
    if (h === 'branch') set.add('branch_name')
  })
  return Array.from(set)
}

interface DeviceListProps {
  devices: Device[]
  branches: BranchOption[]
  loading: boolean
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  search: string
  filterStatus: string
  branchFilter: string
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  onSearchChange: (val: string) => void
  onFilterStatusChange: (val: string) => void
  onBranchChange: (val: string) => void
  onAdd: () => void
  onView: (uuid: string) => void
  onEdit: (device: Device) => void
  onDelete: (device: Device) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onExport?: (extraPayload?: Record<string, any>) => void
  exporting?: boolean
}

export default function DeviceList({
  devices, branches, loading, search, filterStatus, branchFilter, page, perPage, totalPages, totalCount,
  onSearchChange, onFilterStatusChange, onBranchChange, onAdd, onView, onEdit, onDelete,
  onPageChange, onPerPageChange, onExport, exporting = false,
  selected, onSelectionChange
}: DeviceListProps) {
  const { can } = usePermissions('Devices')
  const { branchId, isAdmin } = useBranchAccess()

  const canView = can('devices.show')
  const canCreate = can('devices.create')
  const canEdit = can('devices.update')
  const canDelete = can('devices.delete')

  const [previewQr, setPreviewQr] = useState<{ imgSrc: string; code: string; fileName: string } | null>(null)

  // Selected column headings state for export
  const [selectedHeadings, setSelectedHeadings] = useState<string[]>(
    HEADING_OPTIONS.map((h) => h.key)
  )

  const toggleHeading = (key: string) => {
    setSelectedHeadings((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const allHeadingsSelected = selectedHeadings.length === HEADING_OPTIONS.length
  const toggleAllHeadings = () => {
    setSelectedHeadings(allHeadingsSelected ? [] : HEADING_OPTIONS.map((h) => h.key))
  }

  const renderHeader = (key: string, label: string) => (
    <div
      className="inline-flex items-center gap-1.5 cursor-pointer"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={selectedHeadings.includes(key)}
        onChange={() => toggleHeading(key)}
        className="w-3.5 h-3.5 rounded accent-accent cursor-pointer"
        title={`Include ${label} in export`}
      />
      <span>{label}</span>
    </div>
  )

  const isFiltered = Boolean(search || (filterStatus && filterStatus !== 'all') || branchFilter)
  const exportUuids = selected.length > 0 ? selected : (isFiltered ? devices.map(r => r.uuid).filter(Boolean) : [])

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/devices/list',
    payload: {
      search: search ?? '',
      status: filterStatus || 'all',
      branch_id: !isAdmin && branchId ? String(branchId) : (branchFilter || ''),
      ...(exportUuids.length > 0 ? { check_uuid: exportUuids } : {}),
      check_box_heading: formatExportHeadings(selectedHeadings),
    },
    filename: 'devices',
  })

  const columns: AdvancedColumn<Device>[] = [
    {
      key: '#',
      header: (
        <div
          className="inline-flex items-center gap-1.5 cursor-pointer"
          title="Select all column headings for export"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={allHeadingsSelected}
            onChange={toggleAllHeadings}
            className="w-3.5 h-3.5 rounded accent-accent cursor-pointer"
          />
          <span>#</span>
        </div>
      ),
      render: (_: Device, i: number) => (
        <span className="text-t-lighter text-xs">{(page - 1) * perPage + i + 1}</span>
      ),
    },
    {
      key: 'code',
      header: renderHeader('code', 'Device Code'),
      sortable: true,
      sortValue: (row: Device) => row.code ?? '',
      render: (row: Device) => <span className="text-t-body font-mono font-medium">{row.code || '—'}</span>,
    },
    {
      key: 'tls_id',
      header: renderHeader('tls_id', 'Qone ID'),
      sortable: true,
      sortValue: (row: Device) => row.tls_id ?? '',
      render: (row: Device) => <span className="text-t-body">{row.tls_id}</span>,
    },
    
    {
      key: 'mac_id',
      header: renderHeader('mac_id', 'MAC Address / IP'),
      sortable: true,
      sortValue: (row: Device) => row.mac_id ?? '',
      render: (row: Device) => <span className="text-t-body font-mono text-xs">{row.mac_id}</span>,
    },
    {
      key: 'branch',
      header: renderHeader('branch', 'Branch'),
      sortable: true,
      sortValue: (row: Device) =>
        row.branch?.branch_name ??
        row.branch_name ??
        (row.branch as { name?: string })?.name ??
        branches.find(b => b.id === Number(row.branch_id))?.branch_name ??
        '',
      render: (row: Device) => {
        const branchName =
          row.branch?.branch_name ??
          row.branch_name ??
          (row.branch as { name?: string })?.name ??
          branches.find(b => b.id === Number(row.branch_id))?.branch_name ??
          '—'
        return <span className="text-t-body text-xs">{branchName}</span>
      },
    },
    {
      key: 'status',
      header: renderHeader('status', 'Status'),
      sortable: true,
      sortValue: (row: Device) => row.is_active ?? 0,
      render: (row: Device) => (
        <Badge variant={row.is_active === 1 ? 'success' : 'default'}>
          {row.is_active === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'qr_code',
      header: renderHeader('qr_code', 'QR Code'),
      sortable: false,
      render: (row: Device) => {
        if (!row.qr_code) return <span className="text-t-lighter text-xs">—</span>
        const imgSrc = row.qr_code.startsWith('data:image/')
          ? row.qr_code
          : `data:image/png;base64,${row.qr_code}`
        const fileName = `Qone${row.tls_id || row.code || 'QR'}_qrcode.png`
        return (
          <div className="flex items-center gap-2">
            <img
              src={imgSrc}
              alt="QR Code"
              className="w-8 h-8 rounded border border-input-line object-cover cursor-pointer bg-white hover:scale-110 transition-transform p-0.5"
              onClick={() => setPreviewQr({ imgSrc, code: String(row.code || row.tls_id || 'Device'), fileName })}
              title="Click to view QR code"
            />
            <button
              type="button"
              onClick={() => downloadQrCode(imgSrc, fileName)}
              className="p-1 text-t-lighter hover:text-accent rounded transition-colors"
              title="Download QR Code"
            >
              <Download size={14} />
            </button>
          </div>
        )
      },
    },
  ]

  const getActions = (row: Device): ActionItem[] => {
    const actions: ActionItem[] = []

    if (canView) {
      actions.push({
        label: 'View',
        icon: <Eye size={13} />,
        onClick: () => onView(row.uuid),
      })
    }

    if (canEdit) {
      actions.push({
        label: 'Edit',
        icon: <Pencil size={13} />,
        onClick: () => onEdit(row),
      })
    }

    if (canDelete) {
      actions.push({
        label: 'Delete',
        icon: <Trash2 size={13} />,
        onClick: () => onDelete(row),
        variant: 'danger',
      })
    }

    return actions
  }

  return (
    <>
      <AdvancedTable<Device>
        header={
          <Toolbar
            title="All Devices"
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by Machine No or MAC Address"
            onAdd={canCreate ? onAdd : undefined}
            addLabel="Add Device"
            onExport={onExport ? () => onExport({
              search: search ?? '',
              status: filterStatus || 'all',
              branch_id: !isAdmin && branchId ? String(branchId) : (branchFilter || ''),
              ...(exportUuids.length > 0 ? { check_uuid: exportUuids } : {}),
              check_box_heading: formatExportHeadings(selectedHeadings),
            }) : undefined}
            onExportPdf={handleExportPdf}
            exporting={exporting || exportingPdf}
          >
            {isAdmin && (
              <select
                value={branchFilter}
                onChange={e => { onBranchChange(e.target.value); onPageChange(1); }}
                className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
                ))}
              </select>
            )}
            <select
              value={filterStatus}
              onChange={e => onFilterStatusChange(e.target.value)}
              className="h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Toolbar>
        }
        columns={columns}
        data={devices}
        loading={loading}
        emptyMessage="No devices found"
        rowKey={(row) => row.uuid}
        actions={getActions}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={perPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        countLabel="device"
        countLabelPlural="devices"
        selectable
        selected={selected}
        onSelectionChange={onSelectionChange}
      />

      {/* ── QR Code Preview Modal ── */}
      {previewQr && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-table-line rounded-card shadow-2xl max-w-sm w-full p-5 flex flex-col items-center gap-4 relative">
            <button
              type="button"
              onClick={() => setPreviewQr(null)}
              className="absolute top-3 right-3 text-t-muted hover:text-t-primary p-1 rounded-md transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>

            <div className="text-center w-full border-b border-table-line pb-3">
              <h3 className="text-sm font-bold text-t-primary">QR Code Preview</h3>
              <p className="text-xs text-t-muted mt-0.5">{previewQr.code}</p>
            </div>

            <div className="bg-white p-4 border border-table-line rounded-xl shadow-inner flex items-center justify-center">
              <img
                src={previewQr.imgSrc}
                alt="QR Code Preview"
                className="w-56 h-56 object-contain"
              />
            </div>

            <div className="flex items-center justify-center w-full pt-1">
              <button
                type="button"
                onClick={() => setPreviewQr(null)}
                className="px-5 py-1.5 text-xs font-semibold text-t-secondary bg-card border border-input-line hover:bg-card-alt rounded-lg transition-colors cursor-pointer"
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
