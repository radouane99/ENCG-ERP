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
  BrainCircuit, Map as MapIcon, Landmark, ShieldCheck, Globe, PlaneTakeoff, Microscope, Lock, Sparkles
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
      { label: 'Statistiques Globales', labelAr: 'إحصائيات', href: '/admin/analytics', icon: BarChart3, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    group: 'Scolarité & Étudiants',
    groupAr: 'الشؤون الأكاديمية',
    items: [
      { label: 'Année & Affectations', labelAr: 'السنوات والتعيينات', href: '/admin/academic', icon: Sparkles, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Filières & Modules', labelAr: 'الشعب والوحدات', href: '/academic/filieres', icon: BookOpen, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Groupes & Sections', labelAr: 'المجموعات', href: '/academic/groups', icon: Network, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Inscriptions', labelAr: 'التسجيل', href: '/academic/enrollments', icon: UserPlus, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Étudiants', labelAr: 'الطلاب', href: '/admin/students', icon: Users, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Gestion des Absences', labelAr: 'إدارة الغياب', href: '/admin/absences', icon: AlertTriangle, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Étudiants à Risque', labelAr: 'الطلاب في خطر', href: '/admin/students-risk', icon: ShieldAlert, roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { label: 'Demandes Admin', labelAr: 'الطلبات الإدارية', href: '/admin/requests', icon: FileText, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    group: 'Examens & Notes',
    groupAr: 'الامتحانات والنقاط',
    items: [
      { label: 'Gestion des Examens', labelAr: 'إدارة الامتحانات', href: '/admin/exams', icon: FileSignature, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Convocations', labelAr: 'الاستدعاءات', href: '/admin/convocations', icon: Mail, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Rattrapages', labelAr: 'الاستدراكية', href: '/admin/retake', icon: RefreshCcw, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Gestion des Notes', labelAr: 'إدارة النقط', href: '/admin/grades', icon: Edit3, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'vacataire'] },
      { label: 'Verrouillage des Notes', labelAr: 'قفل النقط', href: '/admin/exam-locking', icon: Lock, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    group: 'Ressources Humaines',
    groupAr: 'الموارد البشرية',
    items: [
      { label: 'Staff & Personnel', labelAr: 'الموظفون', href: '/admin/users', icon: Users2, roles: ['super-admin', 'institution-admin'] },
      { label: 'Professeurs', labelAr: 'الأساتذة', href: '/professors', icon: ProfIcon, roles: ['super-admin', 'institution-admin', 'hr-officer'] },
      { label: 'Vacataires', labelAr: 'المتعاقدون', href: '/vacataires', icon: Briefcase, roles: ['super-admin', 'institution-admin', 'hr-officer'] },
      { label: 'Disponibilités', labelAr: 'توفر الأساتذة', href: '/admin/professor-availability', icon: Clock, roles: ['super-admin', 'institution-admin', 'director', 'hr-officer'] },
      { label: 'Modifs Emploi du Temps', labelAr: 'تعديلات الجدول', href: '/admin/schedule-change-requests', icon: CalendarDays, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    group: 'Plannings & Espaces',
    groupAr: 'الجداول والفضاءات',
    items: [
      { label: 'Emploi du temps', labelAr: 'جدول الحصص', href: '/admin/schedules', icon: Calendar, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Salles & Infrastructures', labelAr: 'القاعات', href: '/infrastructure/classrooms', icon: MapPin, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Réservations', labelAr: 'الحجوزات', href: '/admin/reservations', icon: Ticket, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Jours Fériés', labelAr: 'العطل', href: '/academic/holidays', icon: Calendar, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    group: 'Vie Étudiante & Parascolaire',
    groupAr: 'الحياة الطلابية',
    items: [
      { label: 'Stages & PFE', labelAr: 'التداريب والمشاريع', href: '/academic/internships', icon: Trophy, roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { label: 'Gestion des Clubs', labelAr: 'إدارة الأندية', href: '/admin/clubs', icon: Building2, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Demandes Salles Clubs', labelAr: 'طلبات قاعات الأندية', href: '/admin/clubs-room-requests', icon: MapPin, roles: ['super-admin', 'institution-admin', 'director'] },
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
    group: 'Communication & Outils',
    groupAr: 'التواصل والأدوات',
    items: [
      { label: 'Classroom', labelAr: 'الأقسام الافتراضية', href: '/classroom', icon: MonitorPlay, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'student'] },
      { label: 'Messagerie', labelAr: 'الرسائل', href: '/admin/messages', icon: MessageSquare, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Cahiers de Textes Admin', labelAr: 'دفاتر النصوص', href: '/admin/textbooks', icon: Book, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'FAQ', labelAr: 'أسئلة شائعة', href: '/faq', icon: HelpCircle, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'student'] },
    ]
  },
  {
    group: 'Administration Système',
    groupAr: 'إدارة النظام',
    items: [
      { label: 'Documents & Attestations', labelAr: 'الوثائق', href: '/documents/attestations', icon: FileText, roles: ['super-admin', 'institution-admin'] },
      { label: 'Journal d\'Activité', labelAr: 'سجل النشاط', href: '/admin/activity-logs', icon: Activity, roles: ['super-admin', 'institution-admin'] },
      { label: 'Réseau Alumni', labelAr: 'الخريجين', href: '/admin/alumni', icon: Globe, roles: ['super-admin', 'institution-admin'] },
      { label: 'Paramètres', labelAr: 'الإعدادات', href: '/admin/settings', icon: Settings, roles: ['super-admin', 'institution-admin'] },
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
