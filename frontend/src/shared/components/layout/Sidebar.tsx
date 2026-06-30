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
  BrainCircuit, Map as MapIcon, Landmark, ShieldCheck, Globe, PlaneTakeoff, Microscope
} from 'lucide-react'

interface NavItem {
  label: string
  labelAr: string
  href: string
  icon: React.ElementType
  roles?: string[]
}

interface NavGroup {
  group: string
  groupAr: string
  items: NavItem[]
}

const navigation: (NavItem | NavGroup)[] = [
  {
    label: 'Tableau de bord', labelAr: 'لوحة التحكم',
    href: '/dashboard', icon: LayoutDashboard
  },
  {
    group: 'Pilotage & Décision',
    groupAr: 'القيادة',
    items: [
      { label: 'Pilotage Académique', labelAr: 'القيادة الأكاديمية', href: '/admin/pilotage', icon: Target, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Analytique IA', labelAr: 'تحليل الذكاء الاصطناعي', href: '/admin/predictive-analytics', icon: BrainCircuit, roles: ['super-admin', 'institution-admin'] },
      { label: 'Finance & Tableau', labelAr: 'المالية', href: '/admin/finance-dashboard', icon: Landmark, roles: ['super-admin', 'institution-admin'] },
    ]
  },
  {
    group: 'Scolarité & Pédagogie',
    groupAr: 'الشؤون الأكاديمية',
    items: [
      { label: 'Filières & Modules', labelAr: 'الشعب والوحدات', href: '/academic/filieres', icon: BookOpen, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Groupes & Sections', labelAr: 'المجموعات', href: '/academic/groups', icon: Users, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Inscriptions', labelAr: 'التسجيل', href: '/academic/enrollments', icon: UserPlus, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Jours Fériés & Vacances', labelAr: 'العطل', href: '/academic/holidays', icon: Calendar, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Gestion des Notes', labelAr: 'إدارة النقط', href: '/exams/notes', icon: Edit3, roles: ['super-admin', 'institution-admin', 'professor', 'vacataire'] },
      { label: 'Stages & PFE', labelAr: 'التداريب والمشاريع', href: '/academic/internships', icon: Briefcase, roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { label: 'Examens & Surveillance', labelAr: 'الامتحانات', href: '/academic/exam-planning', icon: Target, roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
    ]
  },
  {
    group: 'Ressources Humaines',
    groupAr: 'الموارد البشرية',
    items: [
      { label: 'Étudiants', labelAr: 'الطلاب', href: '/students', icon: Users, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Professeurs', labelAr: 'الأساتذة', href: '/professors', icon: ProfIcon, roles: ['super-admin', 'institution-admin', 'hr-officer'] },
      { label: 'Vacataires', labelAr: 'المتعاقدون', href: '/vacataires', icon: Clock, roles: ['super-admin', 'institution-admin', 'hr-officer'] },
    ]
  },
  {
    group: 'Plannings & Infrastructures',
    groupAr: 'الجداول والبنية التحتية',
    items: [
      { label: 'Emplois du Temps', labelAr: 'جداول الحصص', href: '/timetable', icon: CalendarDays, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Salles & Infrastructures', labelAr: 'القاعات', href: '/infrastructure/classrooms', icon: MapPin, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Calendrier Annuel', labelAr: 'التقويم', href: '/calendar', icon: Calendar, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    group: 'Espace Étudiant',
    groupAr: 'فضاء الطالب',
    items: [
      { label: 'Mon Emploi du Temps', labelAr: 'جدول زمني', href: '/student/schedule', icon: CalendarDays, roles: ['student'] },
      { label: 'Mes Notes & Examens', labelAr: 'نقاطي وامتحاناتي', href: '/student/grades', icon: BarChart3, roles: ['student'] },
      { label: 'Demandes & Réclamations', labelAr: 'طلباتي', href: '/student/requests', icon: MessageSquare, roles: ['student'] },
      { label: 'Mon CV & Portfolio', labelAr: 'سيرتي الذاتية', href: '/student/portfolio', icon: Crown, roles: ['student'] },
      { label: 'Clubs & Bibliothèque', labelAr: 'الأندية', href: '/student/clubs', icon: Users, roles: ['student'] },
    ]
  },
  {
    group: 'Espace Enseignant',
    groupAr: 'فضاء الأستاذ',
    items: [
      { label: 'Cahier de Textes', labelAr: 'دفتر النصوص', href: '/professor/textbook', icon: BookOpen, roles: ['professor', 'vacataire'] },
      { label: 'Mes Absences & Présences', labelAr: 'الغياب والحضور', href: '/professor/absences', icon: Users2, roles: ['professor', 'vacataire'] },
      { label: 'Outils IA (QCM, Correction)', labelAr: 'أدوات الذكاء الاصطناعي', href: '/professor/qcm-generator', icon: Zap, roles: ['professor'] },
    ]
  },
  {
    group: 'Administration & Outils',
    groupAr: 'الإدارة والأدوات',
    items: [
      { label: 'Documents & Attestations', labelAr: 'الوثائق', href: '/documents/attestations', icon: FileText, roles: ['super-admin', 'institution-admin'] },
      { label: 'Réseau Alumni', labelAr: 'الخريجين', href: '/admin/alumni', icon: Globe, roles: ['super-admin', 'institution-admin'] },
      { label: 'Paramètres du Système', labelAr: 'الإعدادات', href: '/settings', icon: Settings, roles: ['super-admin', 'institution-admin'] },
    ]
  }
]

export default function Sidebar() {
  const { t, i18n } = useTranslation('common')
  const { user, hasAnyRole } = useAuthStore()
  const isRtl = i18n.language === 'ar'
  const navigate = useNavigate()

  return (
    <div
      className={cn(
        'flex flex-col w-64 shrink-0 h-full overflow-hidden',
        'bg-[hsl(var(--sidebar-background))]',
        'border-r border-[hsl(var(--sidebar-border))]'
      )}
    >
      {/* Logo */}
      <div className="flex justify-center px-5 py-5 border-b border-[hsl(var(--sidebar-border))] bg-white/5">
        <img src="/logo-encg.png" alt="ENCG Fès" className="h-12 object-contain" />
      </div>

      {/* Institution badge */}
      {user && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-[hsl(var(--sidebar-accent))]">
          <p className="text-xs text-[hsl(var(--sidebar-foreground))] truncate">{user.institution_name}</p>
          <p className="text-xs text-[hsl(var(--sidebar-primary))] font-medium capitalize">{user.roles[0]}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigation.map((navItem, idx) => {
          if ('group' in navItem) {
            const groupItems = navItem.items.filter(item => !item.roles || hasAnyRole(item.roles))
            if (groupItems.length === 0) return null

            return (
              <div key={navItem.group} className="mt-4 first:mt-0">
                <p className="px-3 text-[0.65rem] font-bold tracking-wider text-[hsl(var(--sidebar-foreground))] uppercase mb-1">
                  {isRtl ? navItem.groupAr : navItem.group}
                </p>
                <div className="space-y-0.5">
                  {groupItems.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        cn('sidebar-item', isActive && 'active')
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate text-sm">
                        {isRtl ? item.labelAr : item.label}
                      </span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          } else {
            if (navItem.roles && !hasAnyRole(navItem.roles)) return null

            return (
              <div key={navItem.href} className="mt-4 first:mt-0">
                <NavLink
                  to={navItem.href}
                  className={({ isActive }) =>
                    cn('sidebar-item', isActive && 'active')
                  }
                >
                  <navItem.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate text-sm">
                    {isRtl ? navItem.labelAr : navItem.label}
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
          className="flex items-center gap-3 px-4 py-4 border-t border-[hsl(var(--sidebar-border))] cursor-pointer hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
          onClick={() => navigate('/profile')}
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user.name}</p>
            <p className="text-[hsl(var(--sidebar-foreground))] text-xs truncate">{user.email}</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[hsl(var(--sidebar-foreground))]" />
        </div>
      )}
    </div>
  )
}
