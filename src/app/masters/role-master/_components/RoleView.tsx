import Badge from '@/components/ui/Badge'
import ViewModal from '@/components/ui/ViewModal'

interface RoleViewProps {
  viewData: Record<string, unknown> | null
  viewLoading: boolean
  onClose: () => void
}

export default function RoleView({ viewData, viewLoading, onClose }: RoleViewProps) {
  if (!viewData) return null

  return (
    <ViewModal
      title="Role Details"
      loading={viewLoading}
      onClose={onClose}
      fields={[
        { label: 'Role Name', value: viewData.name as string },
        { label: 'Short Name', value: viewData.short_name as string },
        { label: 'Role Code', value: String(viewData.role ?? '—') },
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