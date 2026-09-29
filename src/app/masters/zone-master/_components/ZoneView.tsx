import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'

interface Props {
  viewData: Record<string, unknown> | null
  viewLoading: boolean
  onClose: () => void
}

export default function ZoneView({ viewData, viewLoading, onClose }: Props) {
  if (!viewData) return null

  // const company = viewData.company as Record<string, unknown> | undefined
  // const branch = viewData.branch as Record<string, unknown> | undefined

  return (
    <ViewModal
      title="Zone Details"
      loading={viewLoading}
      onClose={onClose}
      fields={[
        { label: 'Zone Name', value: viewData.zone_name as string },
        { label: 'Zone Code', value: viewData.zone_code as string },
       { label: 'Company', value: (viewData.company_name as string) ?? '—' },
{ label: 'Branch', value: (viewData.branch_name as string) ?? '—' },
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