import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export interface PvFilterSelectOption {
  value: string | number
  label: string
  badge?: string
}

interface PvFilterSelectProps {
  label: string
  icon: ComponentType<{ className?: string }>
  value: string | number
  onChange: (val: string | number | '') => void
  options: PvFilterSelectOption[]
  placeholder: string
  disabled?: boolean
}

export function PvFilterSelect({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: PvFilterSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selectedOption = options.find((o) => String(o.value) === String(value))

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={cn('relative space-y-1.5 w-full', open ? 'z-[100]' : 'z-10')}>
      <label className="flex items-center gap-1.5 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
        <Icon className="w-3.5 h-3.5 text-indigo-500" />
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full px-4 py-3 bg-white dark:bg-slate-800/90 border rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-xs text-left',
          open
            ? 'border-indigo-500 ring-4 ring-indigo-500/15 text-indigo-900 dark:text-indigo-200'
            : 'border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-800 dark:text-slate-100',
          disabled && 'opacity-40 cursor-not-allowed',
        )}
      >
        <span className={cn('truncate font-semibold', !selectedOption && 'text-slate-400 font-normal')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2', open && 'rotate-180 text-indigo-600')} />
      </button>
      {open && !disabled && (
        <div className="absolute z-[9999] top-full left-0 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
          <div
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            {placeholder}
          </div>
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value)
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={cn(
                  'px-4 py-2.5 text-xs font-bold cursor-pointer flex items-center justify-between transition-colors',
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-800 hover:text-indigo-600',
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">{opt.label}</span>
                  {opt.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600">
                      {opt.badge}
                    </span>
                  )}
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
