import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  BookOpen,
  Stamp,
  UserX,
  ClipboardCheck,
  Calendar,
  FileSpreadsheet,
  Mail,
} from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { useAuthStore } from '@stores/authStore'

interface MobileBottomNavProps {
  onOpenSearch?: () => void
}

export default function MobileBottomNav({ onOpenSearch }: MobileBottomNavProps) {
  const location = useLocation()
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole)

  const isStudent = hasAnyRole(['student'])
  const isProfessor = hasAnyRole(['professor', 'vacataire'])
  const isStaff = hasAnyRole(['admin', 'super-admin', 'scolarite', 'scolarité', 'director'])

  const navItems = isStudent
    ? [
        { label: 'Accueil', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Notes', path: '/student/grades', icon: BookOpen },
        { label: 'Guichet', path: '/student/documents', icon: Stamp },
        { label: 'Absences', path: '/student/absences', icon: UserX },
      ]
    : isProfessor
      ? [
          { label: 'Accueil', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Émarger', path: '/professor/absences', icon: ClipboardCheck },
          { label: 'Notes', path: '/admin/grades', icon: BookOpen },
          { label: 'EDT', path: '/professor/schedules', icon: Calendar },
        ]
      : isStaff
        ? [
            { label: 'Accueil', path: '/dashboard', icon: LayoutDashboard },
            { label: 'TAFEM', path: '/admin/tafem', icon: FileSpreadsheet },
            { label: 'Guichet', path: '/admin/guichet', icon: Stamp },
            { label: 'Convocations', path: '/admin/convocations', icon: Mail },
          ]
        : [
            { label: 'Accueil', path: '/dashboard', icon: LayoutDashboard },
          ]

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around lg:hidden shadow-lg shadow-black/10 transition-colors">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive =
          item.path === '/dashboard'
            ? location.pathname === '/dashboard'
            : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-all touch-target select-none min-h-11',
              isActive
                ? 'text-primary dark:text-blue-300 bg-primary/10 dark:bg-blue-950/50 scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Icon className={cn('w-5 h-5 mb-0.5 transition-transform', isActive && 'scale-110')} />
            <span className="truncate max-w-[64px]">{item.label}</span>
          </NavLink>
        )
      })}

      <button
        type="button"
        onClick={onOpenSearch}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 touch-target select-none min-h-11"
        aria-label="Recherche rapide"
      >
        <Search className="w-5 h-5 mb-0.5 text-primary" />
        <span>Recherche</span>
      </button>
    </nav>
  )
}
