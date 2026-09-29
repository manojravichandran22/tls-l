import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'

interface Props {
  viewData: Record<string, unknown> | null
  viewLoading: boolean
  onClose: () => void
}

export default function BranchView({ viewData, viewLoading, onClose }: Props) {
  if (!viewData) return null

  const company = viewData.company as Record<string, unknown> | undefined

  return (
    <ViewModal
      title="Branch Details"
      loading={viewLoading}
      onClose={onClose}
      fields={[
        { label: 'Branch Name', value: viewData.branch_name as string },
        { label: 'Branch Code', value: viewData.branch_code as string },
        { label: 'Company', value: company?.company_name as string ?? '—' },
        { label: 'Company Code', value: company?.company_code as string ?? '—' },
        { label: 'Address', value: viewData.address as string, fullWidth: true },
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