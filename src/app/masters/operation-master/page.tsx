'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import AppLayout from '@/components/layout/AppLayout'
import { ArrowRight } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Toolbar from '@/components/ui/Toolbar'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'

interface Operation {
  id: number
  code: string
  machineType: string
  name: string
  sam: number
  defects: number
}

const initialOps: Operation[] = [
  { id: 1, code: 'OP-001', machineType: '2T Flatlock', name: 'ARM HOLE PIPING', sam: 0.35, defects: 2 },
  { id: 2, code: 'OP-002', machineType: '1N SNLS', name: 'BACK POCKET ATTACH', sam: 0.50, defects: 3 },
  { id: 3, code: 'OP-003', machineType: '3T Overlock', name: 'ATTACH POCKET BINDING', sam: 0.50, defects: 2 },
  { id: 4, code: 'OP-004', machineType: '2T Flatseam', name: 'ARM HOLE PIPING', sam: 0.50, defects: 0 },
]

const MACHINE_TYPES = ['2T Flatlock','3T Flatlock','5T Flatlock','1N SNLS','3T Overlock','5T Overlock','2T Flatseam','2N DNLS']

function AddOperationModal({ onClose, onSave }: { onClose: () => void; onSave: (op: Omit<Operation, 'id'>) => void }) {
  const [form, setForm] = useState({ machineType: '', name: '', code: '', sam: '', defects: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal
      title="Add Operation"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => {
              onSave({ code: form.code || 'OP-NEW', machineType: form.machineType || MACHINE_TYPES[0], name: form.name || 'NEW OP', sam: parseFloat(form.sam) || 0, defects: 0 })
              onClose()
            }}>
            Add Operation
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <FormSelect
          label="Machine Type"
          value={form.machineType}
          onChange={e => set('machineType', e.target.value)}
          options={MACHINE_TYPES.map(t => ({ value: t, label: t }))}
          placeholder="Select type"
        />
        <FormInput label="Operation Name" placeholder="e.g. ARM HOLE PIPING" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
        <div className="grid grid-cols-2 gap-2.5">
          <FormInput label="Op Code" placeholder="OP-010" value={form.code} onChange={e => set('code', e.target.value)} />
          <FormInput label="SAM (minutes)" placeholder="0.5" type="number" step="0.01" value={form.sam} onChange={e => set('sam', e.target.value)} />
        </div>
        <FormInput label="Possible Defects" placeholder="+ Add defects" value={form.defects} onChange={e => set('defects', e.target.value)} />
      </div>
    </Modal>
  )
}

export default function OperationMasterPage() {
  const [ops, setOps] = useState<Operation[]>(initialOps)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filtered = ops.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.machineType.toLowerCase().includes(search.toLowerCase()) ||
    o.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = (op: Omit<Operation, 'id'>) => {
    setOps(prev => [...prev, { ...op, id: prev.length + 1 }])
  }

  const columns = [
    { key: 'code', header: 'Code \u2191', render: (row: Operation) => <span className="font-mono text-xs text-t-body">{row.code}</span> },
    { key: 'machineType', header: 'Machine Type', render: (row: Operation) => <span className="text-t-body">{row.machineType}</span> },
    { key: 'name', header: 'Operation Name', render: (row: Operation) => <span className="text-t-secondary font-medium">{row.name}</span> },
    { key: 'sam', header: 'SAM', render: (row: Operation) => <span className="text-t-body">{row.sam}</span> },
    { key: 'defects', header: 'Defects', render: (row: Operation) => row.defects > 0 ? <span className="text-t-body">{row.defects}</span> : <span className="text-t-lighter">&mdash;</span> },
    { key: 'actions', header: '', render: () => (
      <button className="bg-transparent border-none cursor-pointer p-1 text-accent flex hover:text-accent-hover"><ArrowRight size={13} /></button>
    )},
  ]

  return (
    <AppLayout>
      {showModal && <AddOperationModal onClose={() => setShowModal(false)} onSave={handleSave} />}

      <PageHeader title="Operation Master" description="Define sewing operations, machine types, insertion rates and possible defects." />

      <Toolbar
        title="All Operations"
        search={search}
        onSearchChange={setSearch}
        onAdd={() => setShowModal(true)}
        addLabel="Add Operation"
      />

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No operations found"
        totalCount={filtered.length}
        countLabel="operation"
      />
    </AppLayout>
  )
}
