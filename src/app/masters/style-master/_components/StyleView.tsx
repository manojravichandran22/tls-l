import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'
import { type Style } from './types'

interface StyleViewProps {
  viewData: Style | null
  viewLoading: boolean
  onClose: () => void
}

export default function StyleView({ viewData, viewLoading, onClose }: StyleViewProps) {
  if (!viewData) return null

  return (
    <ViewModal
      title="Style Details"
      loading={viewLoading}
      onClose={onClose}
      size="md"
      fields={[
        { label: 'Style Name', value: viewData.style_name || '—' },
        { label: 'Style No.', value: viewData.style_no || '—' },
        { label: 'Buyer', value: viewData.buyer || '—' },
        {
          label: 'Status',
          value: (
            <Badge variant={viewData.status === 1 ? 'success' : 'default'}>
              {viewData.status === 1 ? 'Active' : viewData.status === 2 ? 'Awaiting for Review' : 'Inactive'}
            </Badge>
          ),
        },
        // { label: 'SAM', value: viewData.sam !== undefined && viewData.sam !== null ? viewData.sam : '—' },
        // { label: 'Target 100%', value: viewData.target_hun_hr !== undefined && viewData.target_hun_hr !== null ? viewData.target_hun_hr : '—' },
        // { label: 'Target 60%', value: viewData.target_six_hr !== undefined && viewData.target_six_hr !== null ? viewData.target_six_hr : '—' },
        // { label: 'Required Manning', value: viewData.req_manning !== undefined && viewData.req_manning !== null ? viewData.req_manning : '—' },
        // { label: 'Allocated Manning', value: viewData.all_manning !== undefined && viewData.all_manning !== null ? viewData.all_manning : '—' },
      ]}
    />
  )
}
