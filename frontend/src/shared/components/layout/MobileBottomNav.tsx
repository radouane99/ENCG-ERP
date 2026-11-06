import { NavLink,useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('common')
  const location = useLocation()
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole)

  const isStudent = hasAnyRole(['student'])
  const isProfessor = hasAnyRole(['professor', 'vacataire'])
  const isStaff = hasAnyRole(['admin', 'super-admin', 'institution-admin', 'scolarite', 'scolarité', 'director'])

  const navItems = isStudent
    ? [
        { label: 'home', path: '/dashboard', icon: LayoutDashboard },
        { label: 'grades', path: '/student/grades', icon: BookOpen },
        { label: 'desk', path: '/student/documents', icon: Stamp },
        { label: 'absences', path: '/student/absences', icon: UserX },
      ]
    : isProfessor
      ? [
          { label: 'home', path: '/dashboard', icon: LayoutDashboard },
          { label: 'attendance', path: '/attendance/manage', icon: ClipboardCheck },
          { label: 'grades', path: '/professor/grades', icon: BookOpen },
          { label: 'schedule', path: '/professor/schedules', icon: Calendar },
        ]
      : isStaff
        ? [
            { label: 'home', path: '/dashboard', icon: LayoutDashboard },
            { label: 'admissions', path: '/admin/tafem', icon: FileSpreadsheet },
            { label: 'desk', path: '/admin/guichet', icon: Stamp },
            { label: 'convocations', path: '/admin/convocations', icon: Mail },
          ]
        : [
            { label: 'home', path: '/dashboard', icon: LayoutDashboard },
          ]

  return (
    <nav aria-label={t('navigation.mobile')} className="fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-border dark:border-border px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] flex items-center justify-around lg:hidden shadow-lg shadow-black/10 transition-colors">
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
              'flex flex-col items-center justify-center min-w-0 flex-1 py-1 px-1 sm:px-3 rounded-xl text-[10px] font-semibold transition-all touch-target select-none min-h-11',
              isActive
                ? 'text-primary dark:text-blue-300 bg-primary/10 dark:bg-blue-950/50 scale-105'
                : "text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-slate-200"
            )}
          >
            <Icon className={cn('w-5 h-5 mb-0.5 transition-transform', isActive && 'scale-110')} />
            <span className="truncate max-w-full">{t(`navigation.${item.label}`)}</span>
          </NavLink>
        )
      })}

      <button
        type="button"
        onClick={onOpenSearch}
        className="flex flex-col items-center justify-center min-w-0 flex-1 py-1 px-1 sm:px-3 rounded-xl text-[10px] font-semibold text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-slate-200 touch-target select-none min-h-11"
        aria-label={t('navigation.quick_search')}
      >
        <Search className="w-5 h-5 mb-0.5 text-primary" />
        <span>{t('navigation.search')}</span>
      </button>
    </nav>
  )
}
