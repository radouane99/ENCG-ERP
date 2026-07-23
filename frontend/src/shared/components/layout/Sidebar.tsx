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
  label: string
  labelAr?: string
  href: string
  icon: React.ElementType
  roles?: string[]
}

interface NavGroup {
  groupTitle: string
  groupTitleAr?: string
  items: NavItem[]
}

// Complete, professionally organized navigation structure
const navigation: (NavItem | NavGroup)[] = [
  {
    label: 'Tableau de Bord',
    labelAr: 'لوحة التحكم',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    groupTitle: 'PILOTAGE & DÉCISION',
    groupTitleAr: 'القيادة والقرار',
    items: [
      { label: 'Pilotage Académique', labelAr: 'القيادة الأكاديمية', href: '/admin/pilotage', icon: Target, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Analytique IA', labelAr: 'التحليلات الذكية', href: '/admin/predictive-analytics', icon: BrainCircuit, roles: ['super-admin', 'institution-admin'] },
      { label: 'Finance & Tableau', labelAr: 'المالية والمؤشرات', href: '/admin/finance-dashboard', icon: Landmark, roles: ['super-admin', 'institution-admin'] },
      { label: 'Statistiques Globales', labelAr: 'الإحصائيات العامة', href: '/admin/analytics', icon: BarChart3, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupTitle: 'SCOLARITÉ & ÉTUDIANTS',
    groupTitleAr: 'الشؤون الطلابية',
    items: [
      { label: 'Année & Affectations', labelAr: 'السنة والتوزيع', href: '/admin/academic', icon: Sparkles, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Départements', labelAr: 'الأقسام', href: '/academic/departments', icon: Building2, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Filières & Spécialités', labelAr: 'الشعب والتخصصات', href: '/academic/filieres', icon: BookOpen, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Modules & Éléments', labelAr: 'الوحدات والمواد', href: '/academic/modules', icon: Layers, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Groupes & Sections', labelAr: 'المجموعات والأفواج', href: '/academic/groups', icon: Network, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Inscriptions', labelAr: 'التسجيل وإعادة التسجيل', href: '/academic/enrollments', icon: UserPlus, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Candidatures & Admission', labelAr: 'الترشيحات والقبول', href: '/admissions/candidatures', icon: InboxIcon, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Gestion des Étudiants', labelAr: 'إدارة الطلبة', href: '/admin/students', icon: Users, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Cartes Étudiants', labelAr: 'بطاقات الطلبة', href: '/admin/student-cards', icon: IdCard, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Crédits & Dérogations', labelAr: 'الأرصدة والاستثناءات', href: '/admin/students-credits', icon: Award, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Concours TAFEM', labelAr: 'مباراة طافيم', href: '/admin/tafem', icon: Trophy, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Mobilité Internationale', labelAr: 'الحركية الدولية', href: '/admin/mobility', icon: PlaneTakeoff, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Suivi des Absences', labelAr: 'تتبع الغيابات', href: '/admin/absences', icon: AlertTriangle, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Étudiants à Risque', labelAr: 'الطلبة تحت الملاحظة', href: '/admin/students-risk', icon: ShieldAlert, roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { label: 'Conseil de Discipline', labelAr: 'مجلس التأديب', href: '/discipline', icon: ShieldAlert, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Demandes Administratives', labelAr: 'الطلبات الإدارية', href: '/admin/requests', icon: FileText, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupTitle: 'EXAMENS & CONVOCATIONS',
    groupTitleAr: 'الامتحانات والاستدعاءات',
    items: [
      { label: 'Examens Planifiés', labelAr: 'الامتحانات المبرمجة', href: '/admin/exams', icon: FileSignature, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Gestion Convocations', labelAr: 'إدارة الاستدعاءات', href: '/admin/convocations', icon: Mail, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Scanner QR en Direct', labelAr: 'ماسح الاستدعاءات المباشر', href: '/admin/exams/scan', icon: Scan, roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { label: 'Délibérations & Jurys', labelAr: 'المداولات ولجان التحكيم', href: '/exams/deliberations', icon: Trophy, roles: ['super-admin', 'institution-admin', 'director'] },
      {label: 'PV Globaux & Notes', labelAr: 'المحاضر العامة والنقاط', href: '/admin/grades/pv', icon: ScrollText, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Réservistes & Dérogations', labelAr: 'الطلبة الرواسب والديون', href: '/admin/reservistes', icon: RefreshCcw, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Session Rattrapage', labelAr: 'دورة الدعم والتدارك', href: '/admin/retake', icon: RefreshCcw, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Saisie des Notes', labelAr: 'إدخال النقاط', href: '/admin/grades', icon: Edit3, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'vacataire'] },
      { label: 'Verrouillage Épreuves', labelAr: 'قفل الاختبارات', href: '/admin/exam-locking', icon: Lock, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupTitle: 'CORPS PROFESSORAL & RH',
    groupTitleAr: 'الأساتذة والموارد البشرية',
    items: [
      { label: 'Gestion des Comptes', labelAr: 'إدارة الحسابات', href: '/admin/users', icon: Users2, roles: ['super-admin', 'institution-admin'] },
      { label: 'Professeurs Permanents', labelAr: 'الأساتذة الدائمون', href: '/professors', icon: ProfIcon, roles: ['super-admin', 'institution-admin', 'hr-officer'] },
      { label: 'Enseignants Vacataires', labelAr: 'الأساتذة العرضيون', href: '/vacataires', icon: Briefcase, roles: ['super-admin', 'institution-admin', 'hr-officer'] },
      { label: 'Disponibilités Profs', labelAr: 'أوقات توفر الأساتذة', href: '/admin/professor-availability', icon: Clock, roles: ['super-admin', 'institution-admin', 'director', 'hr-officer'] },
      { label: 'Changements Emploi du Temps', labelAr: 'طلبات تغيير استعمال الزمن', href: '/admin/schedule-change-requests', icon: CalendarDays, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupTitle: 'EMPLOIS DU TEMPS & CAMPUS',
    groupTitleAr: 'استعمالات الزمن والحرم',
    items: [
      { label: 'Emplois du Temps', labelAr: 'استعمالات الزمن', href: '/admin/schedules', icon: Calendar, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Salles & Amphithéâtres', labelAr: 'القاعات والمدرجات', href: '/infrastructure/classrooms', icon: MapPin, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Smart Campus & IoT', labelAr: 'الحرم الذكي', href: '/admin/smart-campus', icon: Landmark, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Réservations de Salles', labelAr: 'حجز القاعات', href: '/admin/reservations', icon: Ticket, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Calendrier & Vacances', labelAr: 'التقويم والعطل', href: '/academic/holidays', icon: CalendarDays, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupTitle: 'STAGES, PFE & VIE ÉTUDIANTE',
    groupTitleAr: 'التداريب والأنشطة',
    items: [
      { label: 'Gestion des Stages & PFE', labelAr: 'إدارة التداريب ومشاريع التخرج', href: '/academic/internships', icon: Trophy, roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { label: 'Juries PFE & Soutenances', labelAr: 'لجان مناقشة التخرج', href: '/admin/jury-pfe', icon: ProfIcon, roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { label: 'Clubs & Associations', labelAr: 'الأندية والجمعيات', href: '/admin/clubs', icon: Building2, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Réservations Salles Clubs', labelAr: 'حجز قاعات الأندية', href: '/admin/clubs-room-requests', icon: MapPin, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupTitle: 'ESPACE ÉTUDIANT',
    groupTitleAr: 'فضاء الطالب',
    items: [
      { label: 'Mon Emploi du Temps', labelAr: 'جداول أوقاتي', href: '/student/schedule', icon: CalendarDays, roles: ['student'] },
      { label: 'Mes Notes & Résultats', labelAr: 'نقاطي ونتائجي', href: '/student/grades', icon: BarChart3, roles: ['student'] },
      { label: 'Carte Numérique (Pass)', labelAr: 'بطاقتي الرقمية', href: '/student/card', icon: IdCard, roles: ['student'] },
      { label: 'Mes Convocations PDF', labelAr: 'استدعاءاتي', href: '/student/convocations', icon: Mail, roles: ['student'] },
      { label: 'Guichet Électronique', labelAr: 'الشباك الإلكتروني', href: '/student/documents', icon: FileSignature, roles: ['student'] },
      { label: 'Demandes de Documents', labelAr: 'طلبات الوثائق', href: '/student/requests', icon: MessageSquare, roles: ['student'] },
      { label: 'Portfolio & Compétences', labelAr: 'ملفي المفهومي والمهارات', href: '/student/portfolio', icon: Crown, roles: ['student'] },
      { label: 'Clubs Étudiants', labelAr: 'أنديتي الطلابية', href: '/student/clubs', icon: Users, roles: ['student'] },
      { label: 'Mobilité & Échanges', labelAr: 'برامج الحركية', href: '/student/mobility', icon: PlaneTakeoff, roles: ['student'] },
      { label: 'Bibliothèque Numérique', labelAr: 'المكتبة الرقمية', href: '/student/library', icon: BookOpen, roles: ['student'] },
    ]
  },
  {
    groupTitle: 'ESPACE ENSEIGNANT',
    groupTitleAr: 'فضاء الأستاذ',
    items: [
      { label: 'Cahier de Texte', labelAr: 'دفتر النصوص', href: '/professor/textbook', icon: BookOpen, roles: ['professor', 'vacataire'] },
      { label: 'Saisie des Absences', labelAr: 'تسجيل الغيابات', href: '/professor/absences', icon: Users2, roles: ['professor', 'vacataire'] },
      { label: 'Générateur QCM (IA)', labelAr: 'مولد الاختبارات الذكي', href: '/professor/qcm-generator', icon: Zap, roles: ['professor'] },
      { label: 'Analytique Classe', labelAr: 'تحليلات الفصل', href: '/professor/analytics', icon: BarChart3, roles: ['professor'] },
      { label: 'Mes Surveillances', labelAr: 'جدول حراساتي', href: '/professor/proctoring', icon: Eye, roles: ['professor'] },
      { label: 'Correction Intelligente', labelAr: 'التصحيح الذكي', href: '/professor/smart-grading', icon: FileSignature, roles: ['professor'] },
      { label: 'Scanner Présences', labelAr: 'ماسح الحضور', href: '/professor/scanner', icon: Scan, roles: ['professor', 'vacataire'] },
    ]
  },
  {
    groupTitle: 'OUTILS COLLABORATIFS',
    groupTitleAr: 'أدوات التعاون',
    items: [
      { label: 'Classe Virtuelle', labelAr: 'الفصل الافتراضي', href: '/classroom', icon: MonitorPlay, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'student'] },
      { label: 'Cours & E-Learning (LMS)', labelAr: 'الدروس والتعلم الإلكتروني', href: '/lms/courses', icon: BookOpen, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'student'] },
      { label: 'Bibliothèque & Emprunts', labelAr: 'المكتبة والإعارات', href: '/library', icon: Library, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'student'] },
      { label: 'Messagerie Interne', labelAr: 'الراسائل الداخلية', href: '/admin/messages', icon: MessageSquare, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Cahiers de Textes Global', labelAr: 'دفاتر النصوص العامة', href: '/admin/textbooks', icon: Book, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Centre d\'Aide & FAQ', labelAr: 'مركز المساعدة والأسئلة', href: '/faq', icon: HelpCircle, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'student'] },
    ]
  },
  {
    groupTitle: 'ADMINISTRATION SYSTÈME',
    groupTitleAr: 'إدارة النظام',
    items: [
      { label: 'Attestations & Relevés', labelAr: 'الشهادات وكشوف النقاط', href: '/documents/attestations', icon: FileText, roles: ['super-admin', 'institution-admin'] },
      { label: 'Guichet Électronique Admin', labelAr: 'الشباك الإلكتروني للإدارة', href: '/admin/guichet', icon: FileSignature, roles: ['super-admin', 'institution-admin'] },
      { label: 'Diplômes Blockchain', labelAr: 'دبلومات البلوكشين', href: '/admin/blockchain-diplomas', icon: ShieldCheck, roles: ['super-admin', 'institution-admin'] },
      { label: 'Évaluations & Enquêtes', labelAr: 'التقييمات والاستطلاعات', href: '/admin/evaluations', icon: CheckSquare, roles: ['super-admin', 'institution-admin'] },
      { label: 'Workflow Builder', labelAr: 'منشئ مسارات العمل', href: '/admin/workflow-builder', icon: Kanban, roles: ['super-admin', 'institution-admin'] },
      { label: 'Journal d\'Activités (Audit)', labelAr: 'سجل الأنشطة والمراجعة', href: '/admin/activity-logs', icon: Activity, roles: ['super-admin', 'institution-admin'] },
      { label: 'Réseau Alumni', labelAr: 'شبكة الخريجين', href: '/admin/alumni', icon: Globe, roles: ['super-admin', 'institution-admin'] },
      { label: 'Paramètres Système', labelAr: 'إعدادات النظام', href: '/admin/settings', icon: Settings, roles: ['super-admin', 'institution-admin'] },
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

      {/* Logo & Quick Language Switcher */}
      <div className="flex flex-col items-center justify-center px-6 py-5 border-b border-sidebar-border bg-gradient-to-b from-white/[0.02] to-transparent gap-3">
        <img src="/logo-encg.png" alt="ENCG Fès" className="h-10 object-contain drop-shadow-sm" />

        {/* Quick Language Selector */}
        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/10 w-full justify-between text-[11px] font-bold">
          <button
            onClick={() => {
              i18n.changeLanguage('fr');
              document.documentElement.dir = 'ltr';
              document.documentElement.lang = 'fr';
              localStorage.setItem('i18nextLng', 'fr');
            }}
            className={cn(
              "flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1",
              i18n.language === 'fr' || !i18n.language ? "bg-indigo-600 text-white shadow-sm font-black" : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <span>🇫🇷</span> FR
          </button>
          <button
            onClick={() => {
              i18n.changeLanguage('ar');
              document.documentElement.dir = 'rtl';
              document.documentElement.lang = 'ar';
              localStorage.setItem('i18nextLng', 'ar');
            }}
            className={cn(
              "flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1",
              i18n.language === 'ar' ? "bg-indigo-600 text-white shadow-sm font-black" : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <span>🇲🇦</span> العربية
          </button>
          <button
            onClick={() => {
              i18n.changeLanguage('en');
              document.documentElement.dir = 'ltr';
              document.documentElement.lang = 'en';
              localStorage.setItem('i18nextLng', 'en');
            }}
            className={cn(
              "flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1",
              i18n.language === 'en' ? "bg-indigo-600 text-white shadow-sm font-black" : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <span>🇬🇧</span> EN
          </button>
        </div>
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
        {navigation.map((navItem, idx) => {
          if ('groupTitle' in navItem) {
            const groupItems = navItem.items.filter(item => !item.roles || hasAnyRole(item.roles))
            if (groupItems.length === 0) return null

            return (
              <div key={navItem.groupTitle || idx} className="mt-6 first:mt-0">
                <p className="px-3 text-[11px] font-bold tracking-[0.1em] text-sidebar-foreground/60 uppercase mb-2">
                  {isRtl ? (navItem.groupTitleAr || navItem.groupTitle) : navItem.groupTitle}
                </p>
                <div className="space-y-1">
                  {groupItems.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer select-none group relative',
                          isActive 
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25 font-bold translate-x-1' 
                            : 'text-sidebar-foreground/80 hover:text-white hover:bg-white/10 hover:translate-x-0.5'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Active Indicator Line */}
                          {isActive && (
                            <div className="absolute start-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-amber-400 rounded-e-full shadow-[0_0_10px_#f59e0b]" />
                          )}
                          <item.icon className={cn(
                            "w-4 h-4 shrink-0 transition-transform duration-200",
                            isActive ? "text-amber-300 scale-110" : "text-sidebar-foreground/70 group-hover:text-white group-hover:scale-110"
                          )} />
                          <span className={cn(
                            "flex-1 truncate transition-colors duration-200",
                            isActive ? "font-bold text-white" : "font-medium"
                          )}>
                            {isRtl ? (item.labelAr || item.label) : item.label}
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
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer select-none group relative',
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25 font-bold translate-x-1' 
                        : 'text-sidebar-foreground/80 hover:text-white hover:bg-white/10 hover:translate-x-0.5'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute start-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-amber-400 rounded-e-full shadow-[0_0_10px_#f59e0b]" />
                      )}
                      <navItem.icon className={cn(
                        "w-4 h-4 shrink-0 transition-transform duration-200",
                        isActive ? "text-amber-300 scale-110" : "text-sidebar-foreground/70 group-hover:text-white group-hover:scale-110"
                      )} />
                      <span className={cn(
                        "flex-1 truncate transition-colors duration-200",
                        isActive ? "font-bold text-white" : "font-medium"
                      )}>
                        {isRtl ? (navItem.labelAr || navItem.label) : navItem.label}
                      </span>
                    </>
                  )}
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
