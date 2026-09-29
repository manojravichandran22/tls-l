import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'

interface WorkCategoryViewProps {
  viewData: Record<string, unknown> | null
  viewLoading: boolean
  onClose: () => void
}

export default function WorkCategoryView({ viewData, viewLoading, onClose }: WorkCategoryViewProps) {
  if (!viewData) return null

  return (
    <ViewModal
      title="Work Category Details"
      loading={viewLoading}
      onClose={onClose}
      fields={[
        { label: 'Work Category Name', value: viewData.name as string },
        { label: 'Code', value: viewData.code as string },
        {
          label: 'Department',
          value: (viewData.department as Record<string, unknown>)?.name as string ?? '—',
        },
        // {
        //   label: 'Designation',
        //   value: (viewData.designation as Record<string, unknown>)?.designation_name as string ?? '—',
        // },
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
