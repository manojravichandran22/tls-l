import Badge from '@/components/ui/Badge'
import ViewModal from '@/components/ui/ViewModal'
import { formatDate } from '@/lib/formatDate'

interface EmployeeViewProps {
  viewData: Record<string, unknown> | null
  viewLoading: boolean
  onClose: () => void
}

export default function EmployeeView({ viewData, viewLoading, onClose }: EmployeeViewProps) {
  if (!viewData) return null

  return (
    <ViewModal
      title="Employee Details"
      loading={viewLoading}
      onClose={onClose}
      size="md"
      fields={[
        { label: 'Employee Code', value: viewData.code as string },
        { label: 'Name', value: `${viewData.name} ${viewData.last_name}` },
        { label: 'Mobile', value: viewData.mobile as string },
        { label: 'Email', value: (viewData.email as string) ?? '—' },
        {
          label: 'Role',
          value: (
            <Badge variant="info">
              {(viewData.roleInfo as Record<string, unknown>)?.name as string ?? viewData.role}
            </Badge>
          ),
        },
        {
          label: 'Department',
          value: (viewData.department as any)?.name || '—',
        },
        {
          label: 'Team',
          value: (viewData.team as any)?.team_name || (viewData.team_name as string) || '—',
        },
        {
          label: 'Branch',
          value: (viewData.branch as any)?.branch_name || '—',
        },
        {
          label: 'Designation',
          value: (viewData.designation as any)?.name || '—',
        },
        {
          label: 'Work Category',
          value: (viewData.workCategory as any)?.name || '—',
        },
        {
          label: 'Access',
          value: String(viewData.access_flag) === '0' ? 'None'
            : String(viewData.access_flag) === '1' ? 'Web'
            : String(viewData.access_flag) === '2' ? 'Mobile'
            : String(viewData.access_flag) === '3' ? 'Mobile and Web'
            : 'None',
        },
        { label: 'Join Date', value: formatDate(viewData.join_date as string) },
        { label: 'RFID No', value: ((viewData.rfid ?? viewData.rfid_no) as string) || '—' },
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