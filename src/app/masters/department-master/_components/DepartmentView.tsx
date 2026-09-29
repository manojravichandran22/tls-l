import Badge from '@/components/ui/Badge'
import ViewModal from '@/components/ui/ViewModal'

interface DepartmentViewProps {
  viewData: Record<string, unknown> | null
  viewLoading: boolean
  onClose: () => void
}

export default function DepartmentView({ viewData, viewLoading, onClose }: DepartmentViewProps) {
  if (!viewData) return null

  const branch = viewData.branch as Record<string, unknown> | undefined

  return (
    <ViewModal
      title="Department Details"
      loading={viewLoading}
      onClose={onClose}
      fields={[
        { label: 'Department Name', value: viewData.name as string },
        { label: 'Dept Code', value: viewData.dept_code as string },
        { label: 'Branch', value: branch?.branch_name as string ?? '—' },
        { label: 'Branch Code', value: branch?.branch_code as string ?? '—' },
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