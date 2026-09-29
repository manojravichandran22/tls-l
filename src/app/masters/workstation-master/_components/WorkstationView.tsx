import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'

interface WorkstationViewProps {
  viewData: Record<string, unknown> | null
  viewLoading: boolean
  onClose: () => void
}

export default function WorkstationView({ viewData, viewLoading, onClose }: WorkstationViewProps) {
  if (!viewData) return null

  return (
    <ViewModal
      title="Workstation Details"
      loading={viewLoading}
      onClose={onClose}
      fields={[
        { label: 'Workstation Name', value: viewData.name as string },
        { label: 'Code', value: viewData.code as string },
        { label: 'Line', value: (viewData.line as Record<string, unknown>)?.line_name as string ?? '—' },
        { label: 'Branch', value: (viewData.branch as Record<string, unknown>)?.branch_name as string ?? '—' },
        { label: 'QR Code', value: viewData.qr_code as string },
        {
          label: 'Status',
          value: (
            <Badge variant={viewData.is_active === 1 ? 'success' : 'default'}>
              {viewData.is_active === 1 ? 'Active' : 'Inactive'}
            </Badge>
          ),
        },
      ]}
    />
  )
}