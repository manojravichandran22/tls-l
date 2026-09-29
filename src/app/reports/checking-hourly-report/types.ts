export interface CheckingHourlyRecord {
  checker_id?: number | string | null
  checker_code?: string | null
  checker_name?: string | null
  line_id?: number | string | null
  line_name?: string | null
  zone_id?: number | string | null
  zone_name?: string | null
  team_id?: number | string | null
  team_name?: string | null
  branch_id?: number | string | null
  branch_name?: string | null
  shift_id?: number | string | null
  shift_name?: string | null
  shift_start_time?: string | null
  shift_end_time?: string | null
  shift_hours?: number | null
  hours?: Record<string, number | null | undefined>
  ot?: number | null
  total?: number | null
}

export interface CheckingHourlySummary {
  total_checked?: number | string | null
  peak_hour?: string | null
  lowest_hour?: string | null
  no_of_checkers?: number | string | null
}

export interface CheckingHourlyReportData {
  summary?: CheckingHourlySummary
  hourly_totals?: Record<string, number | null | undefined>
  grand_total?: number | null
  total?: number | null
  page?: number | null
  limit?: number | null
  per_page?: number | null
  records?: CheckingHourlyRecord[]
}
