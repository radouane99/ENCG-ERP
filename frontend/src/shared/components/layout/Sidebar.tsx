import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@stores/authStore'
import { cn } from '@shared/lib/utils'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  ClipboardList, FileText, Award, Library, MessageSquare,
  HelpCircle, Users2, AlertTriangle, Bot, Settings,
  ChevronRight, Building2, UserCheck, Briefcase, ScrollText,
  Trophy, BarChart3, Clock, Megaphone, Folder, Inbox, Edit3, 
  RefreshCcw, ShieldAlert, GraduationCap as ProfIcon, UserPlus, Target,
  Scan, CheckSquare, CalendarDays, InboxIcon, MonitorPlay, Zap, Activity, FileSignature, Kanban,
  LineChart, Network, Link2, Download, Lightbulb, MapPin, Ticket, Crown, Rocket, Gamepad2, Book,
  BrainCircuit, Map as MapIcon, Landmark, ShieldCheck, Globe, PlaneTakeoff, Microscope, Lock, Sparkles, Mail,
  X, Layers, IdCard, Eye
} from 'lucide-react'

interface NavItem {
  labelKey: string
  href: string
  icon: React.ElementType
  roles?: string[]
}

interface NavGroup {
  groupKey: string
  items: NavItem[]
}

// Keep existing navigation array exactly as it was
const navigation: (NavItem | NavGroup)[] = [
  {
    labelKey: 'nav.item_0',
    href: '/dashboard', icon: LayoutDashboard
  },
  {
    groupKey: 'nav.group_0',
    items: [
      { labelKey: 'nav.item_1', href: '/admin/pilotage', icon: Target, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_2', href: '/admin/predictive-analytics', icon: BrainCircuit, roles: ['super-admin', 'institution-admin'] },
      { labelKey: 'nav.item_3', href: '/admin/finance-dashboard', icon: Landmark, roles: ['super-admin', 'institution-admin'] },
      { labelKey: 'nav.item_4', href: '/admin/analytics', icon: BarChart3, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupKey: 'nav.group_1',
    items: [
      { labelKey: 'nav.item_5', href: '/admin/academic', icon: Sparkles, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_6', href: '/academic/departments', icon: Building2, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_7', href: '/academic/filieres', icon: BookOpen, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_8', href: '/academic/modules', icon: Layers, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_9', href: '/academic/groups', icon: Network, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_10', href: '/academic/enrollments', icon: UserPlus, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_11', href: '/admin/students', icon: Users, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_student_cards', href: '/admin/student-cards', icon: IdCard, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_tafem', href: '/admin/tafem', icon: Trophy, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_mobility', href: '/admin/mobility', icon: PlaneTakeoff, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_12', href: '/admin/absences', icon: AlertTriangle, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_13', href: '/admin/students-risk', icon: ShieldAlert, roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { labelKey: 'nav.item_14', href: '/admin/requests', icon: FileText, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupKey: 'nav.group_2',
    items: [
      { labelKey: 'nav.item_15', href: '/admin/exams', icon: FileSignature, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_16', href: '/admin/convocations', icon: Mail, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_17', href: '/admin/retake', icon: RefreshCcw, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_18', href: '/admin/grades', icon: Edit3, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'vacataire'] },
      { labelKey: 'nav.item_19', href: '/admin/exam-locking', icon: Lock, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupKey: 'nav.group_3',
    items: [
      { labelKey: 'nav.item_20', href: '/admin/users', icon: Users2, roles: ['super-admin', 'institution-admin'] },
      { labelKey: 'nav.item_21', href: '/professors', icon: ProfIcon, roles: ['super-admin', 'institution-admin', 'hr-officer'] },
      { labelKey: 'nav.item_22', href: '/vacataires', icon: Briefcase, roles: ['super-admin', 'institution-admin', 'hr-officer'] },
      { labelKey: 'nav.item_23', href: '/admin/professor-availability', icon: Clock, roles: ['super-admin', 'institution-admin', 'director', 'hr-officer'] },
      { labelKey: 'nav.item_24', href: '/admin/schedule-change-requests', icon: CalendarDays, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupKey: 'nav.group_4',
    items: [
      { labelKey: 'nav.item_25', href: '/admin/schedules', icon: Calendar, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_26', href: '/infrastructure/classrooms', icon: MapPin, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_smart_campus', href: '/admin/smart-campus', icon: Landmark, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_27', href: '/admin/reservations', icon: Ticket, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_28', href: '/academic/holidays', icon: Calendar, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupKey: 'nav.group_5',
    items: [
      { labelKey: 'nav.item_29', href: '/academic/internships', icon: Trophy, roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { labelKey: 'nav.item_jury_pfe', href: '/admin/jury-pfe', icon: ProfIcon, roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { labelKey: 'nav.item_30', href: '/admin/clubs', icon: Building2, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_31', href: '/admin/clubs-room-requests', icon: MapPin, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupKey: 'nav.group_6',
    items: [
      { labelKey: 'nav.item_32', href: '/student/schedule', icon: CalendarDays, roles: ['student'] },
      { labelKey: 'nav.item_33', href: '/student/grades', icon: BarChart3, roles: ['student'] },
      { labelKey: 'nav.item_student_card', href: '/student/card', icon: IdCard, roles: ['student'] },
      { labelKey: 'nav.item_student_convocations', href: '/student/convocations', icon: Mail, roles: ['student'] },
      { labelKey: 'Guichet Électronique', href: '/student/documents', icon: FileSignature, roles: ['student'] },
      { labelKey: 'nav.item_34', href: '/student/requests', icon: MessageSquare, roles: ['student'] },
      { labelKey: 'nav.item_35', href: '/student/portfolio', icon: Crown, roles: ['student'] },
      { labelKey: 'nav.item_36', href: '/student/clubs', icon: Users, roles: ['student'] },
      { labelKey: 'nav.item_student_mobility', href: '/student/mobility', icon: PlaneTakeoff, roles: ['student'] },
      { labelKey: 'nav.item_student_library', href: '/student/library', icon: BookOpen, roles: ['student'] },
    ]
  },
  {
    groupKey: 'nav.group_7',
    items: [
      { labelKey: 'nav.item_37', href: '/professor/textbook', icon: BookOpen, roles: ['professor', 'vacataire'] },
      { labelKey: 'nav.item_38', href: '/professor/absences', icon: Users2, roles: ['professor', 'vacataire'] },
      { labelKey: 'nav.item_39', href: '/professor/qcm-generator', icon: Zap, roles: ['professor'] },
      { labelKey: 'nav.item_prof_analytics', href: '/professor/analytics', icon: BarChart3, roles: ['professor'] },
      { labelKey: 'nav.item_prof_proctoring', href: '/professor/proctoring', icon: Eye, roles: ['professor'] },
      { labelKey: 'nav.item_prof_grading', href: '/professor/smart-grading', icon: FileSignature, roles: ['professor'] },
      { labelKey: 'nav.item_prof_scanner', href: '/professor/scanner', icon: Scan, roles: ['professor', 'vacataire'] },
    ]
  },
  {
    groupKey: 'nav.group_8',
    items: [
      { labelKey: 'nav.item_40', href: '/classroom', icon: MonitorPlay, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'student'] },
      { labelKey: 'nav.item_41', href: '/admin/messages', icon: MessageSquare, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_42', href: '/admin/textbooks', icon: Book, roles: ['super-admin', 'institution-admin', 'director'] },
      { labelKey: 'nav.item_43', href: '/faq', icon: HelpCircle, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'student'] },
    ]
  },
  {
    groupKey: 'nav.group_9',
    items: [
      { labelKey: 'nav.item_44', href: '/documents/attestations', icon: FileText, roles: ['super-admin', 'institution-admin'] },
      { labelKey: 'Guichet Électronique', href: '/admin/guichet', icon: FileSignature, roles: ['super-admin', 'institution-admin'] },
      { labelKey: 'nav.item_blockchain', href: '/admin/blockchain-diplomas', icon: ShieldCheck, roles: ['super-admin', 'institution-admin'] },
      { labelKey: 'nav.item_activity_logs', href: '/admin/activity-logs', icon: Activity, roles: ['super-admin', 'institution-admin'] },
      { labelKey: 'nav.item_45', href: '/admin/alumni', icon: Globe, roles: ['super-admin', 'institution-admin'] },
      { labelKey: 'nav.item_46', href: '/admin/settings', icon: Settings, roles: ['super-admin', 'institution-admin'] },
    ]
  }
]

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { i18n } = useTranslation('common')
  const { t } = useTranslation('sidebar')
  const { user, hasAnyRole } = useAuthStore()
  const isRtl = i18n.language === 'ar'
  const navigate = useNavigate()

  return (
    <div
      className={cn(
        'flex flex-col w-[280px] shrink-0 h-full overflow-hidden',
        'bg-sidebar-background',
        'border-e border-sidebar-border',
        'shadow-xl lg:shadow-none transition-shadow'
      )}
    >
      {/* Mobile Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 lg:hidden z-50 transition-colors"
          aria-label="Fermer le menu"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Logo */}
      <div className="flex items-center justify-center px-6 py-6 border-b border-sidebar-border bg-gradient-to-b from-white/[0.02] to-transparent">
        <img src="/logo-encg.png" alt="ENCG Fès" className="h-10 object-contain drop-shadow-sm" />
      </div>

      {/* Institution badge */}
      {user && (
        <div className="mx-4 mt-5 px-4 py-3 rounded-xl bg-gradient-to-br from-sidebar-accent to-sidebar-background border border-sidebar-border shadow-sm">
          <p className="text-sm font-semibold text-sidebar-foreground truncate">{user.institution_name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sidebar-primary shadow-[0_0_8px_var(--sidebar-primary)] animate-pulse" />
            <p className="text-xs text-sidebar-primary font-medium uppercase tracking-wider">{user.roles[0]}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 custom-scrollbar">
        {navigation.map((navItem) => {
          if ('groupKey' in navItem) {
            const groupItems = navItem.items.filter(item => !item.roles || hasAnyRole(item.roles))
            if (groupItems.length === 0) return null

            return (
              <div key={navItem.groupKey} className="mt-6 first:mt-0">
                <p className="px-3 text-[11px] font-bold tracking-[0.1em] text-sidebar-foreground/60 uppercase mb-2">
                  {t(navItem.groupKey)}
                </p>
                <div className="space-y-0.5">
                  {groupItems.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'sidebar-item group relative',
                          isActive && 'active'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Active Indicator Line (RTL safe) */}
                          {isActive && (
                            <div className="absolute start-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-sidebar-primary rounded-e-full shadow-[0_0_8px_var(--sidebar-primary)]" />
                          )}
                          <item.icon className={cn(
                            "w-4 h-4 shrink-0 transition-transform duration-200",
                            isActive ? "text-white scale-110" : "text-sidebar-foreground/70 group-hover:text-white group-hover:scale-110"
                          )} />
                          <span className={cn(
                            "flex-1 truncate transition-colors duration-200",
                            isActive ? "font-semibold text-white" : "font-medium text-sidebar-foreground/80 group-hover:text-white"
                          )}>
                            {t(item.labelKey)}
                          </span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          } else {
            if (navItem.roles && !hasAnyRole(navItem.roles)) return null

            return (
              <div key={navItem.href} className="mt-6 first:mt-0">
                <NavLink
                  to={navItem.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn('sidebar-item group', isActive && 'active')
                  }
                >
                  <navItem.icon className="w-4 h-4 shrink-0 text-sidebar-foreground/70 group-hover:text-white" />
                  <span className="flex-1 truncate font-medium text-sidebar-foreground/80 group-hover:text-white">
                    {t(navItem.labelKey)}
                  </span>
                </NavLink>
              </div>
            )
          }
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div
          className="flex items-center gap-3 px-5 py-5 bg-sidebar-background border-t border-sidebar-border cursor-pointer hover:bg-sidebar-accent transition-colors group"
          onClick={() => {
            navigate('/profile');
            onClose && onClose();
          }}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate group-hover:text-white transition-colors">{user.name}</p>
            <p className="text-sidebar-foreground/70 text-xs truncate">{user.email}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-sidebar-foreground/50 group-hover:text-sidebar-foreground transition-colors transform rtl:rotate-180" />
        </div>
      )}
    </div>
  )
}
