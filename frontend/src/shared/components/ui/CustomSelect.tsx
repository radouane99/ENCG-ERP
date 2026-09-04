import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Check, Search, X } from 'lucide-react'
import { cn, cleanUtf8Text } from '@shared/lib/utils'

export interface SelectOption {
  value: string | number
  label: string
  icon?: React.ReactNode
  badge?: string | null
  color?: string
}

export interface CustomSelectProps {
  value: string | number
  onChange: (value: any) => void
  options: SelectOption[]
  placeholder?: string
  label?: string
  icon?: any
  variant?: 'hero' | 'default' | 'subtle'
  className?: string
  disabled?: boolean
  searchable?: boolean
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  label: _label,
  icon,
  variant = 'default',
  className,
  disabled = false,
  searchable,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find((opt) => String(opt.value) === String(value))

  // Enable search automatically if options >= 6 or if explicitly requested
  const isSearchable = searchable ?? options.length >= 6

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options
    const q = searchQuery.toLowerCase()
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(q) ||
      (opt.badge && opt.badge.toLowerCase().includes(q))
    )
  }, [options, searchQuery])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && isSearchable) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    } else {
      setSearchQuery('')
    }
  }, [isOpen, isSearchable])

  const handleSelect = (val: string | number) => {
    onChange(val)
    setIsOpen(false)
  }

  const isHero = variant === 'hero'

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", !className?.includes('min-w-') && "min-w-[180px]", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between gap-2.5 outline-none select-none",
          isHero
            ? "bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/30 text-white shadow-lg backdrop-blur-xl"
            : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600",
          isOpen && (isHero ? "ring-2 ring-amber-400/60 border-amber-400/80 bg-white/25" : "ring-2 ring-indigo-500/25 border-indigo-500 shadow-xs"),
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {(selectedOption?.icon || icon) && (
            <span className={cn("shrink-0", isHero ? "text-amber-300" : "text-indigo-600 dark:text-indigo-400")}>
              {selectedOption?.icon || icon}
            </span>
          )}
          <span className="truncate">
            {selectedOption ? cleanUtf8Text(selectedOption.label) : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedOption?.badge && (
            <span className={cn(
              "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
              isHero
                ? "bg-white/20 text-amber-300"
                : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
            )}>
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 shrink-0 transition-transform duration-200",
              isHero ? "text-amber-300" : "text-slate-400",
              isOpen && "rotate-180 text-indigo-600 dark:text-indigo-400"
            )}
          />
        </div>
      </button>

      {/* Floating Popover Options Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute left-0 top-full mt-1.5 w-max min-w-full max-w-[420px] max-h-80 overflow-hidden rounded-2xl z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.16)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-150 border flex flex-col",
            isHero
              ? "bg-[#081533]/98 backdrop-blur-2xl border-white/25 text-white ring-1 ring-white/10"
              : "bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 shadow-2xl"
          )}
        >
          {/* Optional Search Filter Header */}
          {isSearchable && (
            <div className="p-2 border-b border-border/80 sticky top-0 bg-popover/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une option..."
                  className="w-full pl-8 pr-7 py-1.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="p-1.5 overflow-y-auto scrollbar-thin max-h-64">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs font-medium text-muted-foreground text-center">
                Aucune option correspondante
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value)
                return (
                  <div
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 flex items-center justify-between gap-3 my-0.5 select-none",
                      isHero
                        ? isSelected
                          ? "bg-blue-600 text-white font-extrabold shadow-md border border-blue-400/40"
                          : "text-blue-100 hover:bg-white/15 hover:text-white"
                        : isSelected
                          ? "bg-indigo-600 text-white font-extrabold shadow-xs"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{cleanUtf8Text(opt.label)}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {opt.badge && (
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
                          isHero
                            ? "bg-white/20 text-amber-300"
                            : isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        )}>
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className={cn("w-4 h-4 shrink-0", isHero ? "text-amber-300" : "text-white")} />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
export default CustomSelect
