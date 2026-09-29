'use client'

import { useState, useRef, useCallback } from 'react'
import { getAuthToken } from '@/lib/cookies'

interface UseExportPdfOptions {
  apiPath: string
  payload: Record<string, any>
  filename: string
}

function getFormattedDate(): string {
  const d = new Date()
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

export function useExportPdf({
  apiPath,
  payload,
  filename,
}: UseExportPdfOptions) {
  const [exportingPdf, setExportingPdf] = useState(false)
  const payloadRef = useRef(payload)
  payloadRef.current = payload

  const handleExportPdf = useCallback(async (extraPayload?: Record<string, any>) => {
    setExportingPdf(true)
    try {
      const token = getAuthToken()
      const extraObj = (extraPayload && typeof extraPayload === 'object' && !Array.isArray(extraPayload)) ? extraPayload : {}
      const mergedPayload = {
        ...payloadRef.current,
        ...extraObj,
      }

      const hasExplicitType = 'type' in mergedPayload

      const exportPayload: Record<string, any> = {
        per_page: 'all',
        page: '1',
        pdf_excel_type: 'pdf',
        ...mergedPayload,
        type: (mergedPayload.type && String(mergedPayload.type).trim()) ? mergedPayload.type : 'pdf',
      }

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
        console.error(`Export PDF failed (${res.status}):`, errText)
        throw new Error(`Failed to export PDF (${res.status}): ${errText}`)
      }

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const json = await res.json().catch(() => ({}))
        console.error('Export PDF returned JSON instead of PDF binary:', json)
        throw new Error(json.message || 'Export failed: Received JSON response instead of PDF')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}_${getFormattedDate()}.pdf`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      // Revoke after a short delay so the browser has time to initiate the download
      setTimeout(() => {
        URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 1000)
    } catch (err) {
      console.error('PDF Export failed:', err)
    } finally {
      setExportingPdf(false)
    }
  }, [apiPath, filename])

  return { handleExportPdf, exportingPdf }
}