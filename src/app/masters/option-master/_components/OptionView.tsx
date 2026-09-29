import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'

interface OptionViewProps {
  viewData: Record<string, unknown> | null
  viewLoading: boolean
  onClose: () => void
}

export default function OptionView({ viewData, viewLoading, onClose }: OptionViewProps) {
  if (!viewData) return null

  return (
    <ViewModal
      title="Option Details"
      loading={viewLoading}
      onClose={onClose}
      fields={[
        { label: 'Type', value: <Badge variant="default">{viewData.type as string}</Badge> },
        { label: 'Value', value: viewData.value as string },
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
