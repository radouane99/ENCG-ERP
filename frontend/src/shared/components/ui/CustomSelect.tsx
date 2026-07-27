import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export interface SelectOption {
  value: string | number
  label: string
  icon?: React.ReactNode
  badge?: string
}

export interface CustomSelectProps {
  value: string | number
  onChange: (value: any) => void
  options: SelectOption[]
  placeholder?: string
  icon?: React.ReactNode
  variant?: 'hero' | 'default'
  className?: string
  disabled?: boolean
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  icon,
  variant = 'default',
  className,
  disabled = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => String(opt.value) === String(value))

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (val: string | number) => {
    onChange(val)
    setIsOpen(false)
  }

  const isHero = variant === 'hero'

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left min-w-[200px]", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between gap-2.5 outline-none select-none",
          isHero
            ? "bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/30 text-white shadow-lg backdrop-blur-xl"
            : "bg-background hover:bg-muted/60 border border-border text-foreground shadow-2xs dark:bg-slate-900 dark:border-slate-800",
          isOpen && (isHero ? "ring-2 ring-amber-400/60 border-amber-400/80 bg-white/25" : "ring-2 ring-primary/20 border-primary"),
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className={cn("shrink-0", isHero ? "text-amber-300" : "text-primary")}>{icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 shrink-0 transition-transform duration-200",
            isHero ? "text-amber-300" : "text-muted-foreground",
            isOpen && "rotate-180 text-amber-400"
          )}
        />
      </button>

      {/* Floating Popover Options Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute left-0 top-full mt-2 w-max min-w-full max-w-[380px] max-h-72 overflow-y-auto rounded-2xl p-1.5 z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-150 border scrollbar-thin",
            isHero
              ? "bg-[#081533]/98 backdrop-blur-2xl border-white/25 text-white ring-1 ring-white/10"
              : "bg-popover/98 backdrop-blur-xl border-border text-popover-foreground shadow-2xl dark:bg-slate-900 dark:border-slate-800"
          )}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground text-center">
              Aucune option disponible
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value)
              return (
                <div
                  key={String(opt.value)}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 flex items-center justify-between gap-3 my-0.5",
                    isHero
                      ? isSelected
                        ? "bg-blue-600 text-white font-extrabold shadow-md border border-blue-400/40"
                        : "text-blue-100 hover:bg-white/15 hover:text-white"
                      : isSelected
                        ? "bg-primary text-primary-foreground font-extrabold"
                        : "hover:bg-muted text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {opt.badge && (
                      <span className={cn(
                        "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
                        isHero ? "bg-white/20 text-amber-300" : "bg-muted text-muted-foreground"
                      )}>
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && <Check className={cn("w-4 h-4 shrink-0", isHero ? "text-amber-300" : "text-primary-foreground")} />}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
