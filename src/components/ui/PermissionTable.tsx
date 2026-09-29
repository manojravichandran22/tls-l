'use client'

import React, { useState, useMemo } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import DataTable from './DataTable'

export interface Permission {
  id: number
  name: string
  display_name: string
  guard_name: string
}

export interface PermissionGroup {
  id: number
  name: string
  guard_name?: string
  Permissions: Permission[]
}

export interface Role {
  id: number
  uuid: string
  name: string
  short_name: string
  is_active: number
  permissions?: Permission[]
}

interface PermissionTableProps {
  groups: PermissionGroup[]
  selectedIds: number[]
  onTogglePermission: (id: number) => void
  onToggleGroup: (group: PermissionGroup, checked: boolean) => void
  loading?: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  className?: string
}

export default function PermissionTable({
  groups,
  selectedIds,
  onTogglePermission,
  onToggleGroup,
  loading,
  searchTerm,
  onSearchChange,
  className
}: PermissionTableProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'web' | 'mobile'>('all')

  const isSelected = (id: any) => {
    return selectedIds.some(sId => Number(sId) === Number(id))
  }

  const isGroupSelected = (group: PermissionGroup) => {
    return group.Permissions.length > 0 && group.Permissions.every(p => isSelected(p.id))
  }

  const isGroupPartiallySelected = (group: PermissionGroup) => {
    const selectedCount = group.Permissions.filter(p => isSelected(p.id)).length
    return selectedCount > 0 && selectedCount < group.Permissions.length
  }

  const getGroupType = (group: PermissionGroup): string => {
    const guards = Array.from(
      new Set(
        [group.guard_name, ...group.Permissions.map((p) => p.guard_name || (p as any).guardName)].filter(Boolean)
      )
    )
    return guards.length > 0 ? guards[0].toLowerCase() : (group.guard_name?.toLowerCase() || 'web')
  }

  const webCount = useMemo(() => groups.filter((g) => getGroupType(g) === 'web').length, [groups])
  const mobileCount = useMemo(() => groups.filter((g) => getGroupType(g) === 'mobile').length, [groups])

  const sortedGroups = useMemo(() => {
    let list = groups
    if (typeFilter !== 'all') {
      list = list.filter((g) => getGroupType(g) === typeFilter)
    }
    return [...list].sort((a, b) => {
      const typeA = getGroupType(a)
      const typeB = getGroupType(b)

      // 'web' comes first, then 'mobile', then others
      const priority = (type: string) => {
        if (type === 'web') return 1
        if (type === 'mobile') return 2
        return 3
      }

      const pA = priority(typeA)
      const pB = priority(typeB)

      if (pA !== pB) return pA - pB
      if (typeA !== typeB) return typeA.localeCompare(typeB)
      return a.name.localeCompare(b.name)
    })
  }, [groups, typeFilter])

  const columns = [
    {
      key: 'name',
      header: 'Group',
      className: 'border-r border-table-line align-middle w-1/5',
      render: (group: PermissionGroup) => (
        <span className="text-accent font-bold text-sm px-2.5">{group.name}</span>
      )
    },
    {
      key: 'type',
      header: 'Type',
      className: 'border-r border-table-line align-middle w-32',
      render: (group: PermissionGroup) => {
        const type = getGroupType(group)
        return (
          <span className="text-sm font-semibold text-t-primary px-2.5">
            {type}
          </span>
        )
      }
    },
    {
      key: 'select_all',
      header: 'Select All',
      className: 'border-r border-table-line align-middle w-44',
      render: (group: PermissionGroup) => {
        const groupSelected = isGroupSelected(group)
        const groupPartial = isGroupPartiallySelected(group)
        return (
          <div className="px-2.5">
            <label className="relative inline-flex items-center cursor-pointer group">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={groupSelected}
                ref={el => {
                  if (el) el.indeterminate = groupPartial
                }}
                onChange={(e) => onToggleGroup(group, e.target.checked)}
              />
              <div className="w-4.5 h-4.5 bg-bg-dark border border-header-line rounded peer-checked:bg-accent peer-checked:border-accent transition-all peer-focus:ring-2 peer-focus:ring-accent/20 flex items-center justify-center">
                {groupSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                {groupPartial && <div className="w-2 h-0.5 bg-white rounded-full"></div>}
              </div>
              <span className="ml-2.5 text-sm text-t-body font-bold group-hover:text-accent transition-colors uppercase tracking-tight">Select All</span>
            </label>
          </div>
        )
      }
    },
    {
      key: 'permissions',
      header: 'Permission',
      className: 'align-middle',
      render: (group: PermissionGroup) => (
        <div className="flex flex-col gap-3 px-2.5">
          {group.Permissions.map((permission) => {
            const checked = isSelected(permission.id)
            return (
              <label key={permission.id} className="relative inline-flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={checked}
                  onChange={() => onTogglePermission(permission.id)}
                />
                <div className="w-4.5 h-4.5 bg-bg-dark border border-header-line rounded peer-checked:bg-accent/80 peer-checked:border-accent/80 transition-all peer-focus:ring-2 peer-focus:ring-accent/10 flex items-center justify-center">
                  {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <span className="ml-3 text-sm text-t-body font-semibold group-hover:text-t-light transition-colors">
                  {permission.display_name || permission.name.split('.').pop() || permission.name}
                </span>
              </label>
            )
          })}
        </div>
      )
    }
  ]

  return (
    <div className={className}>
      {/* Type Filter Tabs */}
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => setTypeFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            typeFilter === 'all'
              ? 'bg-accent text-white shadow-sm'
              : 'bg-card text-t-secondary border border-header-line hover:bg-card-alt'
          }`}
        >
          All ({groups.length})
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter('web')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            typeFilter === 'web'
              ? 'bg-accent text-white shadow-sm'
              : 'bg-card text-t-secondary border border-header-line hover:bg-card-alt'
          }`}
        >
          Web ({webCount})
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter('mobile')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            typeFilter === 'mobile'
              ? 'bg-accent text-white shadow-sm'
              : 'bg-card text-t-secondary border border-header-line hover:bg-card-alt'
          }`}
        >
          Mobile ({mobileCount})
        </button>
      </div>

      <DataTable
        columns={columns}
        data={sortedGroups}
        loading={loading}
        emptyMessage="No permission groups found"
        totalCount={sortedGroups.length}
        countLabel="group"
      />
    </div>
  )
}
