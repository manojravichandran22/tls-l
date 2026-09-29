'use client'

import { useState, useMemo } from 'react'
import Toolbar from '@/components/ui/Toolbar'
import Badge from '@/components/ui/Badge'
import Tabs from '@/components/ui/Tabs'
import AdvancedTable, { type AdvancedColumn } from '@/components/ui/AdvancedTable'
import { useExportPdf } from '@/hooks/useExportPdf'
import { useExport } from '@/hooks/useExport'
import { useDropdownData } from '@/hooks/useDropdownData'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import type { WorkEntry } from './types'
import { lineChip } from './types'
import DateRangePicker from '@/components/ui/DateRangePicker'

const SELECT_CLASS =
  'h-8 px-2.5 text-sm2 cursor-pointer text-t-secondary bg-input border border-input-line rounded-input outline-none transition-colors focus:border-accent'

interface Props {
  entries: WorkEntry[]
  loading?: boolean
  search: string
  onSearchChange: (val: string) => void
  activeTab: 'Today' | 'This Week'
  onTabChange: (tab: 'Today' | 'This Week') => void
  startDate: string
  endDate: string
  onDateRangeChange: (start: string, end: string) => void
  branchId: string
  onBranchChange: (val: string) => void
  shiftId: string
  onShiftChange: (val: string) => void
  teamId: string
  onTeamChange: (val: string) => void
  roleId: string
  onRoleChange: (val: string) => void
}

export default function WorkListList({
  entries,
  loading,
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  startDate,
  endDate,
  onDateRangeChange,
  branchId,
  onBranchChange,
  shiftId,
  onShiftChange,
  teamId,
  onTeamChange,
  roleId,
  onRoleChange,
}: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const { isAdmin } = useBranchAccess()
  const { branches, shifts, teams, roles } = useDropdownData({
    branches: true,
    shifts: true,
    teams: true,
    roles: true,
    branchId,
    shiftId,
    isReport: true,
  })

  const filtered = useMemo(() => {
    const selectedBranchObj = branches.find(b => String(b.id) === String(branchId))
    const selectedBranchName = selectedBranchObj?.branch_name?.toLowerCase()

    return entries.filter(w => {
      const matchesSearch = search === '' ||
        w.shiftName.toLowerCase().includes(search.toLowerCase()) ||
        (w.teamName && w.teamName.toLowerCase().includes(search.toLowerCase())) ||
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.role.toLowerCase().includes(search.toLowerCase()) ||
        w.empId.toLowerCase().includes(search.toLowerCase()) ||
        (w.branchName && w.branchName.toLowerCase().includes(search.toLowerCase()))

      const matchesBranch = !branchId ||
        (w.branchId && String(w.branchId) === String(branchId)) ||
        (selectedBranchName && w.branchName && w.branchName.toLowerCase() === selectedBranchName)

      const matchesShift = !shiftId || (w.shiftId && String(w.shiftId) === String(shiftId))
      const matchesTeam = !teamId || (w.teamId && String(w.teamId) === String(teamId))
      const matchesRole = !roleId || (w.roleId && String(w.roleId) === String(roleId))

      return matchesSearch && matchesBranch && matchesShift && matchesTeam && matchesRole
    })
  }, [entries, search, branchId, shiftId, teamId, roleId, branches])

  const { handleExportPdf, exportingPdf } = useExportPdf({
    apiPath: '/mobilecheckin/list',
    payload: {
      search,
      from_date: startDate,
      to_date: endDate,
      shift_id: shiftId,
      team_id: teamId,
      role_id: roleId,
      company_id: '',
      branch_id: branchId,
      status: '',
    },
    filename: 'worklist',
  })

  const { handleExport, exporting } = useExport<any>({
    apiPath: '/mobilecheckin/list',
    payload: {
      search,
      from_date: startDate,
      to_date: endDate,
      shift_id: shiftId,
      team_id: teamId,
      role_id: roleId,
      company_id: '',
      branch_id: branchId,
      status: '',
    },
    method: 'POST',
    dataKey: 'checkins',
    columns: [
      { header: 'Branch', value: (row) => row.branch_name ?? '' },
      { header: 'Shift Name', value: (row) => row.shift_name ?? '' },
      { header: 'Team', value: (row) => row.team_name ?? '' },
      { header: 'Role', value: (row) => row.role_name ?? '' },
      { header: 'Employee ID', value: (row) => row.employee_id ?? '' },
      { header: 'Title', value: (row) => row.employee_id ?? '' },
      { header: 'Name', value: (row) => row.user_name ?? '' },
      { header: 'Lines', value: (row) => row.line_name ?? '' },
      { header: 'Status', value: (row) => row.status === 1 ? 'Active' : 'Inactive' },
    ],
    filename: 'worklist',
  })

  const columns: AdvancedColumn<WorkEntry>[] = [
    { key: 'id', header: 'Sn.', render: (_row, index) => <span className="text-t-lighter text-xs">{index + 1}</span> },
    {
      key: 'branchName', header: 'Branch', sortable: true,
      sortValue: (row) => row.branchName?.toLowerCase() ?? '',
      render: (row) => <span className="text-t-primary font-medium">{row.branchName || '—'}</span>,
    },
    {
      key: 'shiftName', header: 'Shift Name', sortable: true,
      sortValue: (row) => row.shiftName?.toLowerCase() ?? '',
      render: (row) => <span className="text-accent font-semibold">{row.shiftName || '—'}</span>,
    },
    {
      key: 'teamName', header: 'Team', sortable: true,
      sortValue: (row) => row.teamName?.toLowerCase() ?? '',
      render: (row) => <span className="text-t-body">{row.teamName || '—'}</span>,
    },
    {
      key: 'role', header: 'Role', sortable: true,
      sortValue: (row) => row.role?.toLowerCase() ?? '',
      render: (row) => <span className="text-t-body">{row.role}</span>,
    },
    {
      key: 'empId', header: 'Emp ID', sortable: true,
      sortValue: (row) => row.empId ?? '',
      render: (row) => <span className="text-xs text-t-body">{row.empId}</span>,
    },
    // {
    //   key: 'title', header: 'Title', sortable: true,
    //   sortValue: (row) => row.title?.toLowerCase() ?? '',
    //   render: (row) => <span className="text-xs text-t-body">{row.title}</span>,
    // },
    {
      key: 'name', header: 'Name', sortable: true,
      sortValue: (row) => row.name?.toLowerCase() ?? '',
      render: (row) => <span className="text-t-primary font-medium">{row.name}</span>,
    },
    {
      key: 'lines', header: 'Lines',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.lines.map(line => {
            const c = lineChip(line)
            return (
              <span key={line} className={`inline-block px-2 py-0.5 rounded-card text-xs2 font-medium whitespace-nowrap ${c.bg} ${c.text}`}>
                {line}
              </span>
            )
          })}
        </div>
      ),
    },
    {
      key: 'status', header: 'Status', sortable: true,
      sortValue: (row) => row.status ?? '',
      render: (row) => <Badge variant={row.status === 'Active' ? 'success' : 'default'}>{row.status}</Badge>,
    },
  ]

  return (
    <AdvancedTable<WorkEntry>
      loading={loading}
      header={
        <div className="flex items-center justify-between px-4 gap-2.5 flex-wrap">
          <Tabs tabs={['Today', 'This Week']} active={activeTab} onChange={tab => onTabChange(tab as 'Today' | 'This Week')} />
          <Toolbar
            search={search}
            onSearchChange={onSearchChange}
            showExport={true}
            onExport={handleExport}
            onExportPdf={handleExportPdf}
            exporting={exporting || exportingPdf}
          >
            {/* Branch filter */}
            <select
              value={branchId}
              onChange={e => onBranchChange(e.target.value)}
              disabled={!isAdmin}
              className={`${SELECT_CLASS} disabled:opacity-75 disabled:cursor-not-allowed`}
            >
              {isAdmin && <option value="">All Branches</option>}
              {branches.map(b => (
                <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
              ))}
            </select>

            {/* Shift filter */}
            <select
              value={shiftId}
              onChange={e => onShiftChange(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">All Shifts</option>
              {shifts.map(s => (
                <option key={s.id} value={String(s.id)}>{s.shift_name}</option>
              ))}
            </select>

            {/* Team filter */}
            <select
              value={teamId}
              onChange={e => onTeamChange(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">All Teams</option>
              {teams.map(t => (
                <option key={t.id} value={String(t.id)}>{t.team_name || t.name}</option>
              ))}
            </select>

            {/* Role filter */}
            <select
              value={roleId}
              onChange={e => onRoleChange(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">All Roles</option>
              {roles.map(r => (
                <option key={r.id} value={String(r.id)}>{r.name}</option>
              ))}
            </select>

            {/* Date range */}
            <div className="relative z-[100]">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={onDateRangeChange}
              />
            </div>
          </Toolbar>
        </div>
      }
      columns={columns}
      data={filtered}
      rowKey={(row) => String(row.id)}
      selectable
      selected={selected}
      onSelectionChange={setSelected}
      totalCount={filtered.length}
      emptyMessage="No records found"
      countLabel="record"
    />
  )
}