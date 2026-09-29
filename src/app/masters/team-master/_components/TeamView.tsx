import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'

interface Props {
  viewData: Record<string, unknown> | null
  viewLoading: boolean
  onClose: () => void
}

export default function TeamView({ viewData, viewLoading, onClose }: Props) {
  if (!viewData) return null

  return (
    <ViewModal
      title="Team Details"
      loading={viewLoading}
      onClose={onClose}
      fields={[
        { label: 'Team Name', value: viewData.team_name as string },
        { label: 'Team Code', value: viewData.code as string },
        {
          label: 'Status',
          value: (
            <Badge variant={viewData.status === 1 ? 'success' : 'default'}>
              {viewData.status === 1 ? 'Active' : 'Inactive'}
            </Badge>
          ),
        },
      ]}
    />
  )
}
