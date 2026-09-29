import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'

interface DesignationViewProps {
  viewData: Record<string, unknown> | null
  viewLoading: boolean
  onClose: () => void
}

export default function DesignationView({ viewData, viewLoading, onClose }: DesignationViewProps) {
  if (!viewData) return null

  return (
    <ViewModal
      title="Designation Details"
      loading={viewLoading}
      onClose={onClose}
      fields={[
        {
          label: 'Designation Name',
          value: viewData.name as string,
        },
        {
          label: 'Department',
          value: ((viewData.department as Record<string, unknown>)?.name as string) ?? '—',
        },
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