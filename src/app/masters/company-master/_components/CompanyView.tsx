import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'
import { MapPin } from 'lucide-react'

interface Props {
  viewData: Record<string, unknown> | null
  viewLoading: boolean
  onClose: () => void
}

export default function CompanyView({ viewData, viewLoading, onClose }: Props) {
  if (!viewData) return null

  const location = viewData.location as { lat?: number | string; lng?: number | string } | undefined
  const lat = location?.lat != null ? String(location.lat) : null
  const lng = location?.lng != null ? String(location.lng) : null

  return (
    <ViewModal
      title="Company Details"
      loading={viewLoading}
      onClose={onClose}
      fields={[
        { label: 'Company Name', value: viewData.company_name as string },
        { label: 'Company Code', value: viewData.company_code as string },
        { label: 'Company Type', value: <Badge variant="info">{viewData.company_type as string}</Badge> },
        { label: 'Max Slot', value: String(viewData.max_slot ?? '—') },
        { label: 'Address', value: viewData.address as string, fullWidth: true },
        {
          label: 'Location',
          value: lat && lng ? (
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`Coordinates: ${lat}, ${lng} (Open in Google Maps)`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-accent bg-accent/10 hover:bg-accent hover:text-white transition-all border border-accent/20 cursor-pointer"
            >
              <MapPin size={13} className="shrink-0" />
              <span>View Map</span>
            </a>
          ) : '—',
        },
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