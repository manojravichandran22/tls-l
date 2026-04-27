'use client'

import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { SlidersHorizontal, ArrowUp } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Toolbar from '@/components/ui/Toolbar'
import Badge from '@/components/ui/Badge'

type WorkStatus = 'Active' | 'Inactive'

interface WorkEntry {
  id: number
  shiftName: string
  role: string
  empId: string
  title: string
  name: string
  lines: string[]
  status: WorkStatus
}

const workEntries: WorkEntry[] = [
  { id: 1, shiftName: 'Shift A', role: 'Supervisor', empId: 'SS0426', title: 'SS0426', name: 'Sarit Pak', lines: ['Line-1','Line-2','Line-3'], status: 'Active' },
  { id: 2, shiftName: 'Shift B', role: 'QC', empId: 'SS0478', title: 'SS0478', name: 'Sabin Vai', lines: ['Line-1','Line-2','Line-3','Line-4'], status: 'Active' },
  { id: 3, shiftName: 'Shift C', role: 'Mechanic', empId: 'SS0427', title: 'SS0427', name: 'Sasi Kumar', lines: ['Line-1','Line-2'], status: 'Active' },
  { id: 4, shiftName: 'Shift D', role: 'Mechanic', empId: 'SS0761', title: 'SS0761', name: 'Monitor Lui', lines: ['Line-1','Line-2','Line-3'], status: 'Active' },
  { id: 5, shiftName: 'Shift E', role: 'QC', empId: 'SS0427', title: 'SS0427', name: 'Sasi Kumar', lines: ['Line-1','Line-2','Line-3'], status: 'Inactive' },
  { id: 6, shiftName: 'Shift F', role: 'Mechanic', empId: 'SS0427', title: 'SS0427', name: 'Sasi Kumar', lines: ['Line-1','Line-2','Line-3'], status: 'Active' },
  { id: 7, shiftName: 'Shift G', role: 'Technician', empId: 'SS0427', title: 'SS0427', name: 'Sasi Kumar', lines: ['Line-1','Line-2'], status: 'Active' },
  { id: 8, shiftName: 'Shift H', role: 'Technician', empId: 'SS0427', title: 'SS0427', name: 'Sasi Kumar', lines: ['Line-1','Line-2'], status: 'Active' },
]

const LINE_COLORS: Record<string, { bg: string; text: string }> = {
  'Line-1': { bg: 'bg-info-bg', text: 'text-chip-blue-text' },
  'Line-2': { bg: 'bg-chip-green-bg', text: 'text-success-text' },
  'Line-3': { bg: 'bg-chip-red-bg', text: 'text-error-text' },
  'Line-4': { bg: 'bg-chip-yellow-bg', text: 'text-chip-yellow-text' },
}

const lineChip = (line: string) => LINE_COLORS[line] ?? { bg: 'bg-card-alt', text: 'text-t-body' }

export default function WorkListMasterPage() {
  const [activeTab, setActiveTab] = useState<'Today' | 'This Week'>('Today')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [sortLinesAsc, setSortLinesAsc] = useState(true)

  const filtered = workEntries.filter(w =>
    w.shiftName.toLowerCase().includes(search.toLowerCase()) ||
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.role.toLowerCase().includes(search.toLowerCase()) ||
    w.empId.toLowerCase().includes(search.toLowerCase())
  )

  const allSelected = filtered.length > 0 && filtered.every(w => selected.includes(w.id))
  const toggleAll = () => allSelected ? setSelected([]) : setSelected(filtered.map(w => w.id))
  const toggleRow = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <AppLayout>
      <PageHeader title="Work List Master" description="Define work types and department assignments for employees." />

      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-table-line gap-2.5 flex-wrap">
          <div className="flex gap-0.5">
            {(['Today', 'This Week'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 border-none rounded-input cursor-pointer text-sm2 font-inherit
                  ${activeTab === tab ? 'bg-accent/10 font-semibold text-accent' : 'bg-transparent font-normal text-t-light'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Toolbar
              search={search}
              onSearchChange={setSearch}
              showExport={true}
            />
            <button className="h-8 px-3 flex items-center gap-1.5 bg-card border border-input-line rounded-input cursor-pointer text-sm2 text-t-body font-inherit hover:bg-table-head">
              <SlidersHorizontal size={13} /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm2">
            <thead>
              <tr className="bg-table-head">
                <th className="px-3.5 py-2.5 border-b border-header-line w-10">
                  <div
                    onClick={toggleAll}
                    className={`w-3.5 h-3.5 rounded-sm border-[1.5px] cursor-pointer shrink-0 flex items-center justify-center
                      ${allSelected ? 'border-accent bg-accent' : 'border-input-line bg-white'}`}
                  >
                    {allSelected && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    )}
                  </div>
                </th>
                {['Sn.', 'Shift Name', 'Role', 'Emp ID', 'Title', 'Name'].map(h => (
                  <th key={h} className="px-3.5 py-2.5 text-left font-semibold text-xs text-t-light border-b border-header-line whitespace-nowrap">{h}</th>
                ))}
                <th
                  onClick={() => setSortLinesAsc(v => !v)}
                  className="px-3.5 py-2.5 text-left font-semibold text-xs text-t-light border-b border-header-line whitespace-nowrap cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1">
                    Lines
                    <ArrowUp size={12} className={`transition-transform duration-200 ${sortLinesAsc ? '' : 'rotate-180'}`} />
                  </div>
                </th>
                <th className="px-3.5 py-2.5 text-left font-semibold text-xs text-t-light border-b border-header-line whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-t-lighter text-sm">No records found</td></tr>
              ) : filtered.map((entry, i) => {
                const isChecked = selected.includes(entry.id)
                return (
                  <tr key={entry.id} className={`border-b border-table-line ${isChecked ? 'bg-accent/[0.04]' : i % 2 === 0 ? 'bg-card' : 'bg-card-alt'}`}>
                    <td className="px-3.5 py-cell-py">
                      <div
                        onClick={() => toggleRow(entry.id)}
                        className={`w-3.5 h-3.5 rounded-sm border-[1.5px] cursor-pointer shrink-0 flex items-center justify-center
                          ${isChecked ? 'border-accent bg-accent' : 'border-input-line bg-white'}`}
                      >
                        {isChecked && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        )}
                      </div>
                    </td>
                    <td className="px-3.5 py-cell-py text-t-lighter text-xs">{entry.id}</td>
                    <td className="px-3.5 py-cell-py text-accent font-semibold">{entry.shiftName}</td>
                    <td className="px-3.5 py-cell-py text-t-body">{entry.role}</td>
                    <td className="px-3.5 py-cell-py font-mono text-xs text-t-body">{entry.empId}</td>
                    <td className="px-3.5 py-cell-py font-mono text-xs text-t-body">{entry.title}</td>
                    <td className="px-3.5 py-cell-py text-t-secondary font-medium">{entry.name}</td>
                    <td className="px-3.5 py-cell-py">
                      <div className="flex flex-wrap gap-1">
                        {entry.lines.map(line => {
                          const c = lineChip(line)
                          return (
                            <span key={line} className={`inline-block px-2 py-0.5 rounded-card text-xs2 font-medium whitespace-nowrap ${c.bg} ${c.text}`}>
                              {line}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-3.5 py-cell-py">
                      <Badge variant={entry.status === 'Active' ? 'success' : 'default'}>{entry.status}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-table-line flex items-center justify-between">
          <span className="text-xs text-t-lighter">
            {selected.length > 0
              ? `${selected.length} of ${filtered.length} selected`
              : `${filtered.length} record${filtered.length !== 1 ? 's' : ''} found`}
          </span>
        </div>
      </div>
    </AppLayout>
  )
}
