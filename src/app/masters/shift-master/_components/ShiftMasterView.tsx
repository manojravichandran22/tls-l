import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'
import { type BranchOption, type ZoneOption } from './types'

interface ShiftMasterViewProps {
  viewData: Record<string, unknown> | null
  viewLoading: boolean
  onClose: () => void
  branches: BranchOption[]
  allZones: ZoneOption[]
}

// function t(val: unknown) {
//   return (val as string)?.slice(0, 5) || '—'
// }

function t(val: unknown) {
  return (val as string) || '—'
}

export default function ShiftMasterView({ viewData, viewLoading, onClose, branches, allZones }: ShiftMasterViewProps) {
  if (!viewData) return null

  const branchName = branches.find(b => b.id === viewData.branch_id)?.branch_name
    ?? ((viewData.branch as Record<string, unknown>)?.branch_name as string)
    ?? '—'
  // const zoneName = allZones.find(z => z.id === viewData.zone_id)?.zone_name
  //   ?? ((viewData.zone as Record<string, unknown>)?.zone_name as string)
  //   ?? '—'
  const zoneIds = Array.isArray(viewData.zone_id)
    ? (viewData.zone_id as number[])
    : [viewData.zone_id as number]

  const zoneName =
    zoneIds
      .map(id => allZones.find(z => z.id === id)?.zone_name)
      .filter(Boolean)
      .join(', ') || '—'
  return (
    <ViewModal
      title="Shift Details"
      loading={viewLoading}
      onClose={onClose}
      size="md"
      fields={[
        { label: 'Basic Info', section: true },
        { label: 'Shift Name', value: viewData.shift_name as string },
        { label: 'Type', value: <Badge variant="info">{viewData.type as string}</Badge> },
        { label: 'Branch', value: branchName },
        // { label: 'Zone', value: zoneName },
        { label: 'Status', value: <Badge variant={viewData.is_active === 1 ? 'success' : 'default'}>{viewData.is_active === 1 ? 'Active' : 'Inactive'}</Badge> },

        { label: 'Shift Window', section: true },
        { label: 'Start Time', value: t(viewData.start_time ?? viewData.start) },
        { label: 'End Time', value: t(viewData.end_time ?? viewData.end) },
        { label: 'Hours', value: viewData.hrs != null ? `${viewData.hrs}h` : '—' },
        { label: 'Break (mins)', value: (() => { const b = viewData.breakMins ?? viewData.break ?? viewData.break_mins; return b != null ? `${b}m` : '—' })() },
        { label: 'Buffer Login', value: t(viewData.start_buffer_time) },
        { label: 'Buffer Logout', value: t(viewData.end_buffer_time) },

        { label: 'Meal Break', section: true },
        { label: 'Meal Start', value: t(viewData.lunch_start) },
        { label: 'Meal End', value: t(viewData.lunch_end) },

        { label: 'Short Break -1', section: true },
        { label: 'Break Start', value: t(viewData.mrg_break_start) },
        { label: 'Break End', value: t(viewData.mrg_break_end) },

        { label: 'Short Break -2', section: true },
        { label: 'Break Start', value: t(viewData.evg_break_start) },
        { label: 'Break End', value: t(viewData.evg_break_end) },
      ]}
    />
  )
}
