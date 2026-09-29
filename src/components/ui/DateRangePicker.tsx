'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

interface DateRangePickerProps {
  label?: string
  startDate: string
  endDate: string
  onChange: (start: string, end: string) => void
  required?: boolean
  error?: string
  touched?: boolean
}

export default function DateRangePicker({
  label,
  startDate,
  endDate,
  onChange,
  required,
  error,
  touched,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(() => {
    const d = startDate ? new Date(startDate) : new Date()
    return isNaN(d.getTime()) ? new Date() : d
  })

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()

  const days = []
  // Fill empty spaces for the first week
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null)
  }
  // Fill month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i))
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const formatDateString = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const handleDayClick = (date: Date) => {
    const dateStr = formatDateString(date)

    if (!startDate || (startDate && endDate)) {
      onChange(dateStr, '')
    } else {
      if (dateStr < startDate) {
        onChange(dateStr, startDate)
      } else {
        onChange(startDate, dateStr)
        setIsOpen(false) // Close when both are selected
      }
    }
  }

  const isSelected = (date: Date) => {
    if (!date) return false
    const dateStr = formatDateString(date)
    return dateStr === startDate || dateStr === endDate
  }

  const isInRange = (date: Date) => {
    if (!date || !startDate || !endDate) return false
    const dateStr = formatDateString(date)
    return dateStr > startDate && dateStr < endDate
  }

  const toDisplayFormat = (isoDate: string) => {
    if (!isoDate) return ''
    const [y, m, d] = isoDate.split('-')
    return `${d}-${m}-${y}`
  }

  const getDisplayValue = () => {
    if (startDate && endDate) {
      return `${toDisplayFormat(startDate)} to ${toDisplayFormat(endDate)}`
    }
    if (startDate) {
      return `${toDisplayFormat(startDate)} to —`
    }
    return ''
  }

  const showError = error && touched !== false

  return (
    <div className="flex flex-col gap-1 relative" ref={containerRef}>
      {label && (
        <label className="text-xs font-medium text-t-body">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-input-h px-2.5 text-left text-sm2 font-inherit
            text-t-secondary bg-input border border-input-line rounded-input
            outline-none transition-colors flex items-center justify-between
            focus:border-accent focus:ring-2 focus:ring-focus-ring/15
            ${showError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`}
        >
          <span>{getDisplayValue() || 'Select date range'}</span>
          <CalendarIcon size={16} className="text-t-lighter" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 z-[9999] w-72 p-4 bg-card border border-input-line rounded-lg shadow-2xl text-t-primary">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 text-t-secondary hover:text-accent hover:bg-accent/10 rounded-md transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-semibold text-xs text-t-primary">
                {monthNames[month]} {year}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 text-t-secondary hover:text-accent hover:bg-accent/10 rounded-md transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xxs text-t-secondary mb-2">
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} />

                const selected = isSelected(date)
                const inRange = isInRange(date)
                const dateStr = formatDateString(date)
                const isStart = dateStr === startDate
                const isEnd = dateStr === endDate

                return (
                  <button
                    key={date.getTime()}
                    type="button"
                    onClick={() => handleDayClick(date)}
                    className={`h-7 w-7 text-xs flex items-center justify-center font-medium transition-colors
                      ${selected ? 'bg-[#007b83] dark:bg-[#2dd4bf] text-white dark:text-gray-950 font-bold' : ''}
                      ${inRange ? 'bg-accent/20 text-accent font-semibold' : ''}
                      ${!selected && !inRange ? 'text-t-primary hover:bg-accent/15 hover:text-accent rounded-md' : ''}
                      ${isStart && endDate ? 'rounded-l-md rounded-r-none' : ''}
                      ${isEnd && startDate ? 'rounded-r-md rounded-l-none' : ''}
                      ${selected && (!startDate || !endDate) ? 'rounded-md' : ''}
                    `}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>

            {/* Footer: Clear + hint */}
            <div className="mt-3 pt-3 border-t border-table-line flex items-center justify-between">
              <span className="text-xxs text-t-secondary font-medium">
                {!startDate ? 'Click to select start' : !endDate ? 'Click to select end' : `${toDisplayFormat(startDate)} → ${toDisplayFormat(endDate)}`}
              </span>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => { onChange('', ''); setIsOpen(false) }}
                  className="text-xxs text-red-500 hover:text-red-600 font-semibold px-2 py-0.5 rounded hover:bg-red-500/10 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {showError && (
        <span className="text-xs text-red-500 mt-0.5">{error}</span>
      )}
    </div>
  )
}
