'use client'

import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { MoreVertical } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Toolbar from '@/components/ui/Toolbar'
import DataTable from '@/components/ui/DataTable'
import Badge from '@/components/ui/Badge'

interface MappingRow {
  id: number
  machineId: string
  mcType: string
  brandModel: string
  seq: number
  machineType: string
  operation: string
  tlsId: string
  status: 'Active' | 'Offline'
}

const rows: MappingRow[] = [
  { id: 1, machineId: 'MC-001', mcType: '2T Flatlock', brandModel: 'Brother 15005', seq: 10, machineType: '2T Flatlock', operation: 'ARM HOLE PIPING', tlsId: '3010311', status: 'Active' },
  { id: 2, machineId: 'MC-001', mcType: '2T Flatlock', brandModel: 'Brother 15005', seq: 11, machineType: '2T Flatlock', operation: 'ARM HOLE PIPING', tlsId: '3010311', status: 'Offline' },
]

export default function TLSLineMappingPage() {
  const [search, setSearch] = useState('')

  const filtered = rows.filter(r =>
    r.machineId.toLowerCase().includes(search.toLowerCase()) ||
    r.operation.toLowerCase().includes(search.toLowerCase()) ||
    r.tlsId.includes(search)
  )

  const columns = [
    { key: 'machineId', header: 'Machine ID', render: (row: MappingRow) => <span className="text-accent font-semibold">{row.machineId}</span> },
    { key: 'mcType', header: 'MC Type', render: (row: MappingRow) => <span className="text-t-body">{row.mcType}</span> },
    { key: 'brandModel', header: 'Brand / Model', render: (row: MappingRow) => <span className="text-t-body">{row.brandModel}</span> },
    { key: 'seq', header: 'Seq', render: (row: MappingRow) => <span className="text-t-body">{row.seq}</span> },
    { key: 'machineType', header: 'Machine Type', render: (row: MappingRow) => <span className="text-t-body">{row.machineType}</span> },
    { key: 'operation', header: 'Operation', render: (row: MappingRow) => <span className="text-t-secondary font-medium">{row.operation}</span> },
    { key: 'tlsId', header: 'TLS ID', render: (row: MappingRow) => <span className="font-mono text-xs text-t-body">{row.tlsId}</span> },
    { key: 'status', header: 'Status', render: (row: MappingRow) => <Badge variant={row.status === 'Active' ? 'success' : 'error'}>{row.status}</Badge> },
    { key: 'actions', header: '', render: () => (
      <button className="bg-transparent border-none cursor-pointer p-1 text-t-lighter flex hover:text-t-light"><MoreVertical size={14} /></button>
    )},
  ]

  return (
    <AppLayout>
      <PageHeader title="TLS & Line Mapping" description="Trace every mapping. TLS ID Device to Line Operation — tracking line visibility." />

      <Toolbar
        title="All Mappings"
        search={search}
        onSearchChange={setSearch}
        showExport={false}
      />

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No mappings found"
        totalCount={filtered.length}
        countLabel="mapping"
      />
    </AppLayout>
  )
}
