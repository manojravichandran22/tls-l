import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Download } from 'lucide-react'
import { downloadQrCode } from './types'

interface DeviceViewProps {
  viewData: Record<string, unknown> | null
  viewLoading: boolean
  onClose: () => void
}

export default function DeviceView({ viewData, viewLoading, onClose }: DeviceViewProps) {
  if (!viewData) return null

  const qrCodeStr = viewData.qr_code as string | undefined
  const imgSrc = qrCodeStr
    ? qrCodeStr.startsWith('data:image/')
      ? qrCodeStr
      : `data:image/png;base64,${qrCodeStr}`
    : null
  const fileName = `TLS_${viewData.tls_id || viewData.code || 'QR'}_qrcode.png`

  return (
    <ViewModal
      title="Device Details"
      loading={viewLoading}
      onClose={onClose}
      size="md"
      fields={[
        { label: 'Device Code', value: (viewData.code as string) || '—' },
        { label: 'Qone ID', value: String(viewData.tls_id ?? '—') },
        { label: 'MAC Address', value: <span className="font-mono text-xs">{(viewData.mac_id as string) || '—'}</span> },
        {
          label: 'QR Code',
          value: imgSrc ? (
            <div className="flex flex-col items-start gap-2 pt-1">
              <img
                src={imgSrc}
                alt="QR Code"
                className="w-24 h-24 border border-input-line rounded-lg bg-white p-1 object-contain cursor-pointer hover:scale-105 transition-transform"
                onClick={() => downloadQrCode(imgSrc, fileName)}
                title="Click to download QR code"
              />
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => downloadQrCode(imgSrc, fileName)}
              >
                <Download size={13} className="mr-1.5" />
                Download QR Code
              </Button>
            </div>
          ) : '—',
        },
        {
          label: 'Status',
          value: (
            <Badge variant={viewData.is_active === 1 ? 'success' : 'default'}>
              {viewData.is_active === 1 ? 'Active' : 'Inactive'}
            </Badge>
          ),
        },
        {
          label: 'Created At',
          value: viewData.created_at ? new Date(viewData.created_at as string).toLocaleString() : '—',
        },
        {
          label: 'Updated At',
          value: viewData.updated_at ? new Date(viewData.updated_at as string).toLocaleString() : '—',
        },
      ]}
    />
  )
}
