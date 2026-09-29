import ViewModal from '@/components/ui/ViewModal'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/formatDate'

interface ShiftModifyViewProps {
  viewData: Record<string, unknown> | null
  viewLoading: boolean
  onClose: () => void
}

// function t(val: unknown) {
//   return (val as string)?.slice(0, 5) || '—'
// }

function t(val: unknown) {
  if (!val) return '—'

  const time = String(val).trim()

  if (time === '00:00:00' || time === '00:00' || time === '12:00 AM' || time === '12:00:00 AM') {
    return '—'
  }

  // Already in AM/PM format
  if (time.includes('AM') || time.includes('PM')) {
    return time
  }

  const [hour, minute] = time.split(':')

  const h = Number(hour)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayHour = h % 12 || 12

  return `${String(displayHour).padStart(2, '0')}:${minute} ${period}`
}

export default function ShiftModifyView({ viewData, viewLoading, onClose }: ShiftModifyViewProps) {
  if (!viewData) return null

  const breakMins = viewData.breakMins ?? viewData.break ?? viewData.break_mins

  return (
    <ViewModal
      title="Shift Allocation Details"
      loading={viewLoading}
      onClose={onClose}
      size="md"
      fields={[
        { label: 'Basic Info', section: true },
        { label: 'Shift Name', value: viewData.shift_name as string },
        { label: 'Type', value: <Badge variant="info">{viewData.type as string}</Badge> },
        { label: 'Branch', value: (viewData.branch as Record<string, unknown>)?.branch_name as string ?? '—' },
       // { label: 'Zone', value: (viewData.zone as Record<string, unknown>)?.zone_name as string ?? '—' },
        { label: 'From Date', value: formatDate((viewData.from_date ?? viewData.date) as string) },
        { label: 'To Date', value: formatDate((viewData.to_date ?? viewData.date) as string) },
        { label: 'Status', value: <Badge variant={viewData.is_active === 1 ? 'success' : 'default'}>{viewData.is_active === 1 ? 'Active' : 'Inactive'}</Badge> },

        { label: 'Shift Window', section: true },
        { label: 'Start Time', value: t(viewData.start_time ?? viewData.start) },
        { label: 'End Time', value: t(viewData.end_time ?? viewData.end) },
        { label: 'Hours', value: viewData.hrs != null ? `${viewData.hrs}h` : '—' },
        { label: 'Break (mins)', value: breakMins != null ? `${breakMins}m` : '—' },
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
