'use client'

import React, { useState, useCallback } from 'react'

export interface HeadingOption {
  key: string
  label: string
}

export function useExportHeadings(options: HeadingOption[]) {
  const [selectedHeadings, setSelectedHeadings] = useState<string[]>(
    options.map((h) => h.key)
  )

  const toggleHeading = useCallback((key: string) => {
    setSelectedHeadings((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }, [])

  const allSelected = selectedHeadings.length === options.length

  const toggleAll = useCallback(() => {
    setSelectedHeadings(allSelected ? [] : options.map((h) => h.key))
  }, [allSelected, options])

  const renderHeader = useCallback(
    (key: string, label: string) => (
      <div
        className="inline-flex items-center gap-1.5 cursor-pointer select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={selectedHeadings.includes(key)}
          onChange={() => toggleHeading(key)}
          className="w-3.5 h-3.5 rounded accent-accent cursor-pointer"
          title={`Include ${label} in export`}
        />
        <span>{label}</span>
      </div>
    ),
    [selectedHeadings, toggleHeading]
  )

  const renderSelectAllHeader = useCallback(
    (label: React.ReactNode = '#') => (
      <div
        className="inline-flex items-center gap-1.5 cursor-pointer select-none"
        title="Select all column headings for PDF export"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="w-3.5 h-3.5 rounded accent-accent cursor-pointer"
        />
        <span>{label}</span>
      </div>
    ),
    [allSelected, toggleAll]
  )

  return {
    selectedHeadings,
    setSelectedHeadings,
    toggleHeading,
    toggleAll,
    allSelected,
    renderHeader,
    renderSelectAllHeader,
  }
}
