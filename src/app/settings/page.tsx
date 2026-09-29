'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, Loader2 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import Toast, { type ToastData } from '@/components/ui/Toast'
import { apiCall } from '@/services/apiClient'
import { usePermissions } from '@/hooks/usePermissions'
import { useBranchAccess } from '@/hooks/useBranchAccess'
import { useDropdownData } from '@/hooks/useDropdownData'

// Type mappings:
// type: 1 = Checking, 2 = AQL audit, 3 = Both
// output: 1 = Checking, 2 = AQL audit

const TYPE_OPTIONS = [
  { label: 'Checking', value: 1 },
  { label: 'AQL Audit', value: 2 },
  { label: 'Both', value: 3 },
] as const

const OUTPUT_OPTIONS = [
  { label: 'Checking', value: 1 },
  { label: 'AQL Audit', value: 2 },
] as const

export default function SettingsPage() {
  const { can } = usePermissions('Settings')
  const canList = can('settings.list')
  const canUpdate = can('settings.update')

  const { branchId: userBranchId, isAdmin } = useBranchAccess()
  const [selectedBranch, setSelectedBranch] = useState<string>(() => (!isAdmin && userBranchId ? String(userBranchId) : ''))
  const effectiveBranchId = !isAdmin && userBranchId ? String(userBranchId) : selectedBranch

  const { branches } = useDropdownData({ branches: true })

  // Auto-initialize branch filter if user is restricted to a specific branch
  useEffect(() => {
    if (!isAdmin && userBranchId && !selectedBranch) {
      setSelectedBranch(String(userBranchId))
    }
  }, [isAdmin, userBranchId, selectedBranch])

  const [uuid, setUuid] = useState<string>('')
  const [type, setType] = useState<number>(1)
  const [output, setOutput] = useState<number | null>(1)
  const [checkingRange, setCheckingRange] = useState<string>('10')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)

  const fetchSettings = useCallback(async () => {
    if (!canList) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {}
      if (effectiveBranchId) {
        payload.branch_id = effectiveBranchId
      }

      const res = await apiCall<{
        success?: boolean
        message?: string
        data?: Array<{
          id?: string
          uuid: string
          type: number
          checking_range: number
          output: number
          branch_id?: number | string
        }> | {
          id?: string
          uuid: string
          type: number
          checking_range: number
          output: number
          branch_id?: number | string
        }
      }>('/setting/list', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      const listData = Array.isArray(res.data) ? res.data[0] : res.data
      if (listData) {
        setUuid(listData.uuid || '')
        const fetchedType = Number(listData.type) || 1
        setType(fetchedType)
        if (fetchedType === 1) {
          setOutput(1)
        } else if (fetchedType === 2) {
          setOutput(2)
        } else {
          setOutput(listData.output ? Number(listData.output) : 1)
        }
        setCheckingRange(
          listData.checking_range !== undefined && listData.checking_range !== null
            ? String(listData.checking_range)
            : '10'
        )
      } else {
        setUuid('')
        setType(1)
        setOutput(1)
        setCheckingRange('10')
      }
    } catch (err: any) {
      console.error('Failed to fetch settings:', err)
      setToast({
        type: 'error',
        message: err.message || 'Failed to load system settings',
      })
    } finally {
      setLoading(false)
    }
  }, [canList, effectiveBranchId])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleTypeChange = (newType: number) => {
    if (!canUpdate) return
    setType(newType)
    if (newType === 1) {
      setOutput(1)
    } else if (newType === 2) {
      setOutput(2)
    } else if (newType === 3) {
      setOutput((prev) => (prev === 1 || prev === 2 ? prev : 1))
    }
  }

  const handleOutputTypeChange = (newOutput: number) => {
    if (!canUpdate) return
    if (type === 3) {
      setOutput(newOutput)
    }
  }

  const handleRangeChange = (value: string) => {
    if (!canUpdate) return
    if (value === '') {
      setCheckingRange('')
      return
    }
    const num = Number(value)
    if (isNaN(num)) return
    if (num > 10) {
      setCheckingRange('10')
    } else if (num < 1) {
      setCheckingRange('1')
    } else {
      setCheckingRange(String(num))
    }
  }

  const handleSave = async () => {
    if (!canUpdate) {
      setToast({
        type: 'error',
        message: 'You do not have permission to update settings.',
      })
      return
    }

    if (!uuid) {
      setToast({
        type: 'error',
        message: 'Setting record UUID is missing.',
      })
      return
    }

    const selectedOutput = type === 1 ? 1 : type === 2 ? 2 : (output ?? 1)

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        uuid: uuid,
        type: type,
        checking_range: checkingRange ? Number(checkingRange) : 10,
        output: selectedOutput,
      }
      if (effectiveBranchId) {
        payload.branch_id = Number(effectiveBranchId) || effectiveBranchId
      }

      const res = await apiCall<{
        success?: boolean
        message?: string
        data?: {
          uuid?: string
          id?: string
          type?: number
          checking_range?: number
          output?: number
          branch_id?: number | string
        }
      }>('/setting/update', {
        method: 'POST',
        encrypt: false,
        payload,
      })

      if (res.data?.uuid) {
        setUuid(res.data.uuid)
      }

      setToast({
        type: 'success',
        message: res.message || 'Setting updated successfully',
      })
    } catch (err: any) {
      console.error('Failed to update settings:', err)
      setToast({
        type: 'error',
        message: err.message || 'Failed to save settings',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!canList && !loading) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 flex flex-col h-full overflow-y-auto">
          <PageHeader
            title="Setting"
            description="Configure system preferences and output module parameters"
          />
          <div className="flex-1 flex items-center justify-center text-t-secondary font-medium p-8">
            You do not have permission to view Settings.
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 flex flex-col h-full overflow-y-auto">
        <PageHeader
          title="Setting"
          description="Configure system preferences and output module parameters"
        >
          <div className="flex items-center gap-3 ml-auto flex-wrap">
            {/* Branch Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-t-secondary whitespace-nowrap">
                Branch:
              </span>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={!isAdmin && Boolean(userBranchId)}
                className="h-8.5 px-3 text-xs font-medium text-t-primary bg-card border border-input-line rounded-input outline-none focus:border-brand transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-w-[170px]"
              >
                {isAdmin && <option value="">All Branches</option>}
                {branches.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Save Button */}
            {canUpdate && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="h-8.5 px-3.5 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-input shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </PageHeader>

        {toast && (
          <div className="mb-4">
            <Toast
              type={toast.type}
              message={toast.message}
              onClose={() => setToast(null)}
            />
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12 text-t-secondary">
            <Loader2 className="w-6 h-6 animate-spin mr-2 text-brand" />
            <span className="text-xs font-medium">Loading settings...</span>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {/* Card 1: Output Module */}
            <div className="bg-card border border-table-line rounded-card p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col md:flex-row items-start gap-6 divide-y md:divide-y-0 md:divide-x divide-table-line">
                {/* Left Column: Module Name */}
                <div className="md:w-1/4 pr-4 pt-1">
                  <h3 className="text-sm font-bold text-t-primary">Output Module</h3>
                  <p className="text-2xs text-t-muted mt-0.5">Configure checking behavior and output options.</p>
                </div>

                {/* Right Columns Grid - Always 3 Columns */}
                <div className="md:w-3/4 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 md:pt-0 md:pl-6">
                  {/* Column 1: Type * */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-t-primary">
                      Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="space-y-2.5">
                      {TYPE_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2 select-none ${!canUpdate ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer group'
                            }`}
                        >
                          <input
                            type="radio"
                            name="setting_type"
                            value={opt.value}
                            checked={type === opt.value}
                            disabled={!canUpdate}
                            onChange={() => handleTypeChange(opt.value)}
                            className="w-4 h-4 text-brand border-input-line focus:ring-brand accent-brand cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="text-xs font-medium text-t-secondary group-hover:text-t-primary transition-colors">
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Output type * (Always Visible) */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-t-primary">
                      Output type <span className="text-rose-500">*</span>
                    </label>
                    <div className="space-y-2.5">
                      {OUTPUT_OPTIONS.map((opt) => {
                        // When type is Checking (1), disable AQL Audit (2)
                        // When type is AQL Audit (2), disable Checking (1)
                        // When type is Both (3), both are enabled
                        const isDisabled =
                          !canUpdate ||
                          (type === 1 && opt.value === 2) ||
                          (type === 2 && opt.value === 1)

                        return (
                          <label
                            key={opt.value}
                            className={`flex items-center gap-2 select-none ${isDisabled
                                ? 'opacity-40 cursor-not-allowed'
                                : 'cursor-pointer group'
                              }`}
                          >
                            <input
                              type="radio"
                              name="setting_output_type"
                              value={opt.value}
                              checked={output === opt.value}
                              disabled={isDisabled}
                              onChange={() => handleOutputTypeChange(opt.value)}
                              className="w-4 h-4 text-brand border-input-line focus:ring-brand accent-brand disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <span
                              className={`text-xs font-medium transition-colors ${isDisabled
                                  ? 'text-t-muted cursor-not-allowed'
                                  : 'text-t-secondary group-hover:text-t-primary'
                                }`}
                            >
                              {opt.label}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Column 3: Checking range * */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-t-primary">
                      Checking range <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-col">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        placeholder="1 - 10"
                        value={checkingRange}
                        disabled={!canUpdate}
                        onChange={(e) => handleRangeChange(e.target.value)}
                        className="h-9 px-3 border border-input-line rounded-input text-xs font-medium text-t-primary bg-card placeholder:text-t-lighter focus:border-brand focus:outline-none transition-all w-full disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <span className="text-2xs text-t-muted mt-1.5">Input value (Range: 1 to 10)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
