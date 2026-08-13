import React, { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@stores/authStore'
import { GraduationCap, Building2, Layers, ShieldCheck, ChevronDown, Check, Sparkles } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function RoleContextSwitcher() {
  const { user, activeRole, setActiveRole } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user || !user.roles || user.roles.length <= 1) {
    return null
  }

  const roleConfigs: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    'professor': {
      label: 'Mode Enseignant',
      icon: GraduationCap,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800'
    },
    'vacataire': {
      label: 'Mode Vacataire',
      icon: GraduationCap,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800'
    },
    'department-head': {
      label: 'Chef de Département',
      icon: Building2,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800'
    },
    'filiere-head': {
      label: 'Chef de Filière',
      icon: Layers,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
    },
    'super-admin': {
      label: 'Mode Administration',
      icon: ShieldCheck,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
    },
    'institution-admin': {
      label: 'Mode Administration',
      icon: ShieldCheck,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
    },
    'director': {
      label: 'Mode Direction',
      icon: ShieldCheck,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800'
    }
  }

  const currentRoleKey = activeRole || user.roles[0] || 'professor'
  const currentConfig = roleConfigs[currentRoleKey] || {
    label: currentRoleKey,
    icon: Sparkles,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-200'
  }

  const IconComp = currentConfig.icon

  return (
    <div ref={dropdownRef} className="relative z-30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer shadow-xs hover:scale-[1.02] active:scale-95",
          currentConfig.bg
        )}
        title="Changer de casquette / mode d'affichage actif"
      >
        <IconComp className={cn("w-4 h-4 shrink-0", currentConfig.color)} />
        <span className={cn("hidden xl:inline-block font-extrabold uppercase tracking-wider text-[11px]", currentConfig.color)}>
          {currentConfig.label}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isOpen && "rotate-180", currentConfig.color)} />
      </button>

      {isOpen && (
        <div className="absolute start-0 md:start-auto end-0 top-[calc(100%+0.5rem)] w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 origin-top-right overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              BASCULER DE CASQUETTE ACADÉMIQUE
            </span>
          </div>

          <div className="p-1 space-y-1">
            {user.roles.map((r) => {
              const cfg = roleConfigs[r] || {
                label: r,
                icon: Sparkles,
                color: 'text-slate-600',
                bg: 'bg-slate-50'
              }
              const ItemIcon = cfg.icon
              const isSelected = (activeRole ? activeRole === r : user.roles[0] === r)

              return (
                <button
                  key={r}
                  onClick={() => {
                    setActiveRole(r)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-start cursor-pointer",
                    isSelected 
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <ItemIcon className={cn("w-4 h-4 shrink-0", isSelected ? "text-white" : cfg.color)} />
                    <span className="font-extrabold">{cfg.label}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
