import React, { useState, useEffect, useRef } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface DatePickerProps {
  value: string // 'yyyy-MM-dd'
  onChange: (value: string) => void
  placeholder?: string
  min?: string
  max?: string
  className?: string
  inputClassName?: string
  disabled?: boolean
  id?: string
  name?: string
  ariaLabel?: string
}

/**
 * Convert ISO 'yyyy-MM-dd' to French 'dd/MM/yyyy'
 */
function isoToFrench(isoDate: string): string {
  if (!isoDate) return ''
  const parts = isoDate.split('-')
  if (parts.length !== 3) return isoDate
  const [y, m, d] = parts
  if (!y || !m || !d) return isoDate
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
}

/**
 * Convert French 'dd/MM/yyyy' to ISO 'yyyy-MM-dd'
 */
function frenchToIso(frenchDate: string): string | null {
  if (!frenchDate) return null
  const cleaned = frenchDate.trim()
  // Match dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
  const match = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
  if (!match) return null

  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const year = parseInt(match[3], 10)

  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  if (year < 1900 || year > 2100) return null

  // Validate days in month
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day > daysInMonth) return null

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'JJ/MM/AAAA',
  min,
  max,
  className,
  inputClassName,
  disabled = false,
  id,
  name,
  ariaLabel = 'Sélectionner une date'
}: DatePickerProps) {
  const [textValue, setTextValue] = useState<string>(() => isoToFrench(value))
  const nativeDateInputRef = useRef<HTMLInputElement>(null)

  // Sync internal text when external ISO value changes
  useEffect(() => {
    setTextValue(isoToFrench(value))
  }, [value])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value
    setTextValue(newVal)

    const parsedIso = frenchToIso(newVal)
    if (parsedIso) {
      onChange(parsedIso)
    }
  }

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIso = e.target.value
    if (newIso) {
      onChange(newIso)
      setTextValue(isoToFrench(newIso))
    }
  }

  const openCalendar = () => {
    if (disabled) return
    if (nativeDateInputRef.current) {
      try {
        nativeDateInputRef.current.showPicker()
      } catch {
        nativeDateInputRef.current.focus()
      }
    }
  }

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      {/* Visual Input explicitly formatted as JJ/MM/AAAA */}
      <div
        className={cn(
          'relative flex items-center w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-500 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20',
          disabled && 'opacity-60 pointer-events-none bg-slate-100 dark:bg-slate-900',
          inputClassName
        )}
      >
        <Calendar
          size={14}
          className="text-indigo-500 shrink-0 ml-3 mr-2 pointer-events-none"
        />

        <input
          id={id}
          name={name}
          type="text"
          value={textValue}
          onChange={handleTextChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
          aria-label={ariaLabel}
          className="w-24 min-w-0 bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden font-mono tracking-tight"
        />

        <button
          type="button"
          onClick={openCalendar}
          disabled={disabled}
          tabIndex={-1}
          className="h-full px-2.5 flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border-l border-slate-100 dark:border-slate-750 transition-colors cursor-pointer"
          title="Ouvrir le calendrier pour choisir une date"
        >
          <Calendar size={13} />
        </button>
      </div>

      {/* Hidden native date picker used for the calendar dialog */}
      <input
        ref={nativeDateInputRef}
        type="date"
        value={value || ''}
        min={min}
        max={max}
        onChange={handleNativeChange}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none -z-10"
      />
    </div>
  )
}

export default DatePicker
