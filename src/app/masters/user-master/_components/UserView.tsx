import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'
import { type User } from './types'

interface UserViewProps {
  viewData: User | null
  viewLoading: boolean
  roles: Record<number, string>
  onClose: () => void
}

export default function UserView({ viewData, viewLoading, roles, onClose }: UserViewProps) {
  if (!viewData) return null

  return (
    <ViewModal
      title="User Details"
      loading={viewLoading}
      onClose={onClose}
      size="md"
      fields={[
        { label: 'Name', value: viewData.name || '—' },
        { label: 'Employee Code', value: <span className="font-mono text-xs">{viewData.emp_code || '—'}</span> },
        {
          label: 'Role',
          value: <Badge variant="info">{roles[viewData.role] ?? `Role ${viewData.role}`}</Badge>,
        },
        // {
        //   label: 'UUID',
        //   value: <span className="font-mono text-xs text-t-lighter">{viewData.uuid || '—'}</span>,
        // },
      ]}
    />
  )
}
