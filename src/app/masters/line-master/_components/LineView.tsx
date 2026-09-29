import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'

interface LineViewProps {
  viewData: Record<string, unknown> | null
  viewLoading: boolean
  onClose: () => void
}

export default function LineView({ viewData, viewLoading, onClose }: LineViewProps) {
  if (!viewData) return null

  return (
    <ViewModal
      title="Line Details"
      loading={viewLoading}
      onClose={onClose}
      size="md"
      fields={[
        { label: 'Line Name', value: viewData.line_name as string },
        { label: 'Zone', value: (viewData.zone as Record<string, unknown>)?.zone_name as string ?? '—' },
        { label: 'Branch', value: (viewData.branch as Record<string, unknown>)?.branch_name as string ?? '—' },
        { label: 'Company', value: ((viewData.zone as Record<string, unknown>)?.company as Record<string, unknown>)?.company_name as string ?? '—' },
        {
          label: 'Status',
          value: (
            <Badge variant={viewData.status === 1 ? 'success' : 'default'}>
              {viewData.status === 1 ? 'Active' : 'Inactive'}
            </Badge>
          ),
        },
        {
          label: 'Slots',
          value: (viewData.slots as Array<Record<string, unknown>>)?.map((s, i) => (
            <div key={String(s.slot_name)} className="text-xs2 mb-1">
              <span className="font-medium">{s.slot_name as string}:</span>{' '}
              {(s.start as string)?.slice(0, 5)} - {(s.end as string)?.slice(0, 5)}
            </div>
          )) ?? '—',
          fullWidth: true,
        },
      ]}
    />
  )
}