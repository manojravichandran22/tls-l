'use client'

import { useState, useRef, useCallback } from 'react'
import { getAuthToken } from '@/lib/cookies'

export interface ExportColumn<T = any> {
  key?: string
  header: string
  value: (row: T) => string | number | null | undefined
}

interface UseExportOptions<T = any> {
  apiPath: string
  payload: Record<string, any> // reactive — updated each render via ref
  dataKey?: string
  columns?: ExportColumn<T>[]
  filename: string
  method?: 'GET' | 'POST'
}

function getFormattedDate(): string {
  const d = new Date()
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

export function useExport<T = any>({
  apiPath,
  payload,
  filename,
}: UseExportOptions<T>) {
  const [exporting, setExporting] = useState(false)
  const payloadRef = useRef(payload)
  payloadRef.current = payload // always latest without needing it as a dep

  const handleExport = useCallback(async (extraPayload?: Record<string, any>) => {
    setExporting(true)
    try {
      const extraObj = (extraPayload && typeof extraPayload === 'object' && !Array.isArray(extraPayload)) ? extraPayload : {}
      const mergedPayload = {
        ...payloadRef.current,
        ...extraObj,
      }

      const exportPayload: Record<string, any> = {
        per_page: 'all',
        page: '1',
        pdf_excel_type: 'excel',
        ...mergedPayload,
        type: (mergedPayload.type && String(mergedPayload.type).trim()) ? mergedPayload.type : 'excel',
      }

      // Fetch the styled Excel report directly from the backend export API
      const token = getAuthToken()
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          endpoint: apiPath,
          payload: exportPayload,
        }),
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        console.error(`Export Excel failed (${res.status}):`, errText)
        throw new Error(`Failed to export Excel (${res.status}): ${errText}`)
      }

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const json = await res.json().catch(() => ({}))
        console.error('Export Excel returned JSON instead of Excel binary:', json)
        throw new Error(json.message || 'Export failed: Received JSON response instead of Excel')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}_${getFormattedDate()}.xlsx`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 1000)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }, [apiPath, filename])

  return { handleExport, exporting }
}
