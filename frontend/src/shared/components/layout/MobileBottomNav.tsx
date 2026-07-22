import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Calendar, Mail, Search, User } from 'lucide-react'
import { cn } from '@shared/lib/utils'

interface MobileBottomNavProps {
  onOpenSearch?: () => void
}

export default function MobileBottomNav({ onOpenSearch }: MobileBottomNavProps) {
  const location = useLocation()

  const navItems = [
    { label: 'Accueil', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Examens', path: '/admin/exams', icon: Calendar },
    { label: 'Convocations', path: '/admin/convocations', icon: Mail },
    { label: 'Profil', path: '/profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around lg:hidden shadow-lg shadow-black/10 transition-colors">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-all touch-target select-none",
              isActive
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 scale-105"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Icon className={cn("w-5 h-5 mb-0.5 transition-transform", isActive && "scale-110")} />
            <span className="truncate max-w-[64px]">{item.label}</span>
          </NavLink>
        )
      })}

      {/* Quick Search Action Button */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 touch-target select-none"
        aria-label="Recherche rapide"
      >
        <Search className="w-5 h-5 mb-0.5 text-amber-500" />
        <span>Recherche</span>
      </button>
    </nav>
  )
}
