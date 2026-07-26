import { useState, useMemo, useRef, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@stores/authStore'
import { cn } from '@shared/lib/utils'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  ClipboardList, FileText, Award, Library, MessageSquare,
  HelpCircle, Users2, AlertTriangle, Settings,
  ChevronRight, ChevronDown, Building2, Briefcase,
  Trophy, BarChart3, Clock, Edit3, 
  ShieldAlert, UserPlus, Target,
  ScanLine, CheckSquare, CalendarDays, InboxIcon, MonitorPlay, Zap, Activity, FileSignature, Kanban,
  Network, MapPin, Ticket, Crown, Book,
  BrainCircuit, Landmark, ShieldCheck, Globe, PlaneTakeoff, Lock, Sparkles,
  X, Layers, IdCard, Eye, Calculator, TrendingUp, Search, BellRing,
  UserX, Gavel, CalendarCheck, AreaChart, MailCheck, RotateCcw, Repeat, FileEdit, UserCog, UserCheck,
  Clock3, CalendarSync, DoorOpen, Cpu, Palmtree, HeartHandshake, CreditCard, Stamp, Send,
  BookMarked, GitFork, FilterX, Archive
} from 'lucide-react'

interface NavItem {
  label: string
  labelAr?: string
  href: string
  icon: React.ElementType
  badge?: string
  roles?: string[]
}

interface NavGroup {
  groupTitle: string
  groupTitleAr?: string
  items: NavItem[]
}

// Complete, professionally organized navigation structure with unique professional icons
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
      { label: 'Tableau des Alertes', labelAr: 'جدول التنبيهات Centralisé', href: '/admin/alerts', icon: BellRing, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Rapport Ministère MESRSFC', labelAr: 'تقرير الوزارة الرسمية', href: '/admin/ministry-report', icon: Landmark, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Analytique IA', labelAr: 'التحليلات الذكية', href: '/admin/predictive-analytics', icon: BrainCircuit, badge: 'IA', roles: ['super-admin', 'institution-admin'] },
      { label: 'Finance & Tableau', labelAr: 'المالية والمؤشرات', href: '/admin/finance-dashboard', icon: Calculator, roles: ['super-admin', 'institution-admin'] },
      { label: 'Statistiques Globales', labelAr: 'الإحصائيات العامة', href: '/admin/analytics', icon: BarChart3, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupTitle: 'SCOLARITÉ & ÉTUDIANTS',
    groupTitleAr: 'الشؤون الطلابية',
    items: [
      { label: 'Année & Affectations', labelAr: 'السنة والتوزيع', href: '/admin/academic', icon: Sparkles, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Départements', labelAr: 'الأقسام', href: '/academic/departments', icon: Building2, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Filières & Spécialités', labelAr: 'الشعب والتخصصات', href: '/academic/filieres', icon: GraduationCap, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Modules & Éléments', labelAr: 'الوحدات والمواد', href: '/academic/modules', icon: Layers, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Groupes & Sections', labelAr: 'المجموعات والأفواج', href: '/academic/groups', icon: Network, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Inscriptions', labelAr: 'التسجيل وإعادة التسجيل', href: '/academic/enrollments', icon: UserPlus, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Candidatures & Admission', labelAr: 'الترشيحات والقبول', href: '/admissions/candidatures', icon: InboxIcon, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Gestion des Étudiants', labelAr: 'إدارة الطلبة', href: '/admin/students', icon: Users, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Cartes Étudiants', labelAr: 'بطاقات الطلبة', href: '/admin/student-cards', icon: IdCard, badge: 'Pass', roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Crédits & Dérogations', labelAr: 'الأرصدة والاستثناءات', href: '/admin/students-credits', icon: Award, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Concours TAFEM', labelAr: 'مباراة طافيم', href: '/admin/tafem', icon: Trophy, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Mobilité Internationale', labelAr: 'الحركية الدولية', href: '/admin/mobility', icon: PlaneTakeoff, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Suivi des Absences', labelAr: 'تتبع الغيابات', href: '/admin/absences', icon: UserX, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Étudiants à Risque', labelAr: 'الطلبة تحت الملاحظة', href: '/admin/students-risk', icon: ShieldAlert, roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { label: 'Conseil de Discipline', labelAr: 'مجلس التأديب', href: '/discipline', icon: Gavel, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Demandes Administratives', labelAr: 'الطلبات الإدارية', href: '/admin/requests', icon: ClipboardList, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupTitle: 'EXAMENS & CONVOCATIONS',
    groupTitleAr: 'الامتحانات والاستدعاءات',
    items: [
      { label: 'Examens Planifiés', labelAr: 'الامتحانات المبرمجة', href: '/admin/exams', icon: CalendarCheck, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Surveillance & Émargement Admin', labelAr: 'الحراسة ومحاضر الغش', href: '/admin/exams/1/surveillance', icon: Eye, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Analytics & Cartographie', labelAr: 'تحليلات الامتحانات', href: '/admin/exams/analytics', icon: AreaChart, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Gestion Convocations', labelAr: 'إدارة الاستدعاءات', href: '/admin/convocations', icon: MailCheck, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Scanner QR en Direct', labelAr: 'ماسح الاستدعاءات المباشر', href: '/admin/exams/scan', icon: ScanLine, badge: 'QR', roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { label: 'Délibérations & PVs Officiels', labelAr: 'المداولات والمحاضر الرسمية', href: '/admin/grades/pv', icon: Calculator, roles: ['super-admin', 'institution-admin', 'director', 'department-head'] },
      { label: 'Réservistes & Dérogations', labelAr: 'الطلبة الرواسب والديون', href: '/admin/reservistes', icon: RotateCcw, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Session Rattrapage', labelAr: 'دورة الدعم والتدارك', href: '/admin/retake', icon: Repeat, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Saisie des Notes', labelAr: 'إدخال النقاط', href: '/admin/grades', icon: FileEdit, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'vacataire'] },
      { label: 'Verrouillage Épreuves', labelAr: 'قفل الاختبارات', href: '/admin/exam-locking', icon: Lock, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupTitle: 'CORPS PROFESSORAL & RH',
    groupTitleAr: 'الأساتذة والموارد البشرية',
    items: [
      { label: 'Gestion des Comptes', labelAr: 'إدارة الحسابات', href: '/admin/users', icon: UserCog, roles: ['super-admin', 'institution-admin'] },
      { label: 'Professeurs Permanents', labelAr: 'الأساتذة الدائمون', href: '/professors', icon: UserCheck, roles: ['super-admin', 'institution-admin', 'hr-officer'] },
      { label: 'Enseignants Vacataires', labelAr: 'الأساتذة العرضيون', href: '/vacataires', icon: Briefcase, roles: ['super-admin', 'institution-admin', 'hr-officer'] },
      { label: 'Disponibilités Profs', labelAr: 'أوقات توفر الأساتذة', href: '/admin/professor-availability', icon: Clock3, roles: ['super-admin', 'institution-admin', 'director', 'hr-officer'] },
      { label: 'Changements Emploi du Temps', labelAr: 'طلبات تغيير استعمال الزمن', href: '/admin/schedule-change-requests', icon: CalendarSync, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupTitle: 'EMPLOIS DU TEMPS & CAMPUS',
    groupTitleAr: 'استعمالات الزمن والحرم',
    items: [
      { label: 'Emplois du Temps', labelAr: 'استعمالات الزمن', href: '/admin/schedules', icon: Calendar, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Calendrier Académique', labelAr: 'التقويم الأكاديمي', href: '/admin/academic-calendar', icon: CalendarDays, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'student'] },
      { label: 'Salles & Amphithéâtres', labelAr: 'القاعات والمدرجات', href: '/infrastructure/classrooms', icon: DoorOpen, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Smart Campus & IoT', labelAr: 'الحرم الذكي', href: '/admin/smart-campus', icon: Cpu, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Réservations de Salles', labelAr: 'حجز القاعات', href: '/admin/reservations', icon: Ticket, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Calendrier & Vacances', labelAr: 'التقويم والعطل', href: '/academic/holidays', icon: Palmtree, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupTitle: 'STAGES, PFE & VIE ÉTUDIANTE',
    groupTitleAr: 'التداريب والأنشطة',
    items: [
      { label: 'Cahier de Charges PFE Digital', labelAr: 'دفتر التحملات PFE الرقمي', href: '/admin/pfe-workflow', icon: Kanban, roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { label: 'Gestion des Stages & PFE', labelAr: 'إدارة التداريب ومشاريع التخرج', href: '/academic/internships', icon: Briefcase, roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { label: 'Juries PFE & Soutenances', labelAr: 'لجان مناقشة التخرج', href: '/admin/jury-pfe', icon: Award, roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { label: 'Clubs & Associations', labelAr: 'الأندية والجمعيات', href: '/admin/clubs', icon: HeartHandshake, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Réservations Salles Clubs', labelAr: 'حجز قاعات الأندية', href: '/admin/clubs-room-requests', icon: MapPin, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },
  {
    groupTitle: 'ESPACE ÉTUDIANT',
    groupTitleAr: 'فضاء الطالب',
    items: [
      { label: 'Mon Emploi du Temps', labelAr: 'جداول أوقاتي', href: '/student/schedule', icon: CalendarDays, roles: ['student'] },
      { label: 'Mes Stages & PFE', labelAr: 'تداريبي ومشاريع التخرج', href: '/student/internships', icon: Briefcase, roles: ['student'] },
      { label: 'Mes Notes & Résultats', labelAr: 'نقاطي ونتائجي', href: '/student/grades', icon: TrendingUp, roles: ['student'] },
      { label: 'Carte Numérique (Pass)', labelAr: 'بطاقتي الرقمية', href: '/student/card', icon: CreditCard, roles: ['student'] },
      { label: 'Mes Convocations PDF', labelAr: 'استدعاءاتي', href: '/student/convocations', icon: MailCheck, roles: ['student'] },
      { label: 'Guichet Électronique', labelAr: 'الشباك الإلكتروني', href: '/student/documents', icon: Stamp, roles: ['student'] },
      { label: 'Demandes de Documents', labelAr: 'طلبات الوثائق', href: '/student/requests', icon: Send, roles: ['student'] },
      { label: 'Portfolio & Compétences', labelAr: 'ملفي المفهومي والمهارات', href: '/student/portfolio', icon: Crown, roles: ['student'] },
      { label: 'Clubs Étudiants', labelAr: 'أنديتي الطلابية', href: '/student/clubs', icon: HeartHandshake, roles: ['student'] },
      { label: 'Mobilité & Échanges', labelAr: 'برامج الحركية', href: '/student/mobility', icon: Globe, roles: ['student'] },
      { label: 'Analyse & Carte Mentale (IA)', labelAr: 'تحليل وتلخيص الدروس', href: '/student/course-analysis', icon: BrainCircuit, badge: 'IA', roles: ['student', 'super-admin', 'institution-admin'] },
      { label: 'Lettre de Recommandation', labelAr: 'طلب رسالة التوصية', href: '/student/recommendations', icon: FileText, roles: ['student', 'super-admin', 'institution-admin'] },
      { label: 'Bibliothèque Numérique', labelAr: 'المكتبة الرقمية', href: '/student/library', icon: BookOpen, roles: ['student'] },
    ]
  },
  {
    groupTitle: 'ESPACE ENSEIGNANT',
    groupTitleAr: 'فضاء الأستاذ',
    items: [
      { label: 'Cahier de Texte', labelAr: 'دفتر النصوص', href: '/professor/textbook', icon: BookOpen, roles: ['professor', 'vacataire'] },
      { label: 'Demandes de Recommandation (IA)', labelAr: 'رسائل التوصية الذكية', href: '/professor/recommendations', icon: Sparkles, badge: 'IA', roles: ['professor', 'super-admin', 'institution-admin'] },
      { label: 'Encadrement & Jurys PFE', labelAr: 'تأطير التداريب ومناقشات التخرج', href: '/professor/internships', icon: Award, roles: ['professor', 'vacataire'] },
      { label: 'Saisie des Absences', labelAr: 'تسجيل الغيابات', href: '/professor/absences', icon: UserX, roles: ['professor', 'vacataire'] },
      { label: 'Générateur QCM (IA)', labelAr: 'مولد الاختبارات الذكي', href: '/professor/qcm-generator', icon: Zap, badge: 'IA', roles: ['professor'] },
      { label: 'Analytique Classe', labelAr: 'تحليلات الفصل', href: '/professor/analytics', icon: BarChart3, roles: ['professor'] },
      { label: 'Mes Surveillances', labelAr: 'جدول حراساتي', href: '/professor/proctoring', icon: Eye, roles: ['professor'] },
      { label: 'Correction Intelligente', labelAr: 'التصحيح الذكي', href: '/professor/smart-grading', icon: FileSignature, roles: ['professor'] },
      { label: 'Scanner Présences', labelAr: 'ماسح الحضور', href: '/professor/scanner', icon: ScanLine, roles: ['professor', 'vacataire'] },
    ]
  },
  {
    groupTitle: 'OUTILS COLLABORATIFS',
    groupTitleAr: 'أدوات التعاون',
    items: [
      { label: 'Classe Virtuelle', labelAr: 'الفصل الافتراضي', href: '/classroom', icon: MonitorPlay, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'student'] },
      { label: 'Cours & E-Learning (LMS)', labelAr: 'الدروس والتعلم الإلكتروني', href: '/lms/courses', icon: BookMarked, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'student'] },
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
      { label: 'Guichet Électronique & Attestations', labelAr: 'الشباك الإلكتروني والوثائق', href: '/admin/guichet', icon: Stamp, roles: ['super-admin', 'institution-admin'] },
      { label: 'Diplômes Blockchain', labelAr: 'دبلومات البلوكشين', href: '/admin/blockchain-diplomas', icon: ShieldCheck, badge: 'BC', roles: ['super-admin', 'institution-admin'] },
      { label: 'Évaluations & Enquêtes', labelAr: 'التقييمات والاستطلاعات', href: '/admin/evaluations', icon: CheckSquare, roles: ['super-admin', 'institution-admin'] },
      { label: 'Workflow Builder', labelAr: 'منشئ مسارات العمل', href: '/admin/workflow-builder', icon: GitFork, roles: ['super-admin', 'institution-admin'] },
      { label: 'Journal d\'Activités (Audit)', labelAr: 'سجل الأنشطة والمراجعة', href: '/admin/activity-logs', icon: Activity, roles: ['super-admin', 'institution-admin'] },
      { label: 'Archivage & Bascule d\'Année', labelAr: 'الأرشيف والبسكولة', href: '/admin/archiving', icon: Archive, badge: 'LMD', roles: ['super-admin', 'institution-admin'] },
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
  const { user, hasAnyRole } = useAuthStore()
  const isRtl = i18n.language === 'ar'
  const navigate = useNavigate()
  const location = useLocation()

  // Search and collapsing states
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Toggle group open/collapsed state
  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  // Focus search box when pressing '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        const tag = (document.activeElement?.tagName || '').toLowerCase()
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto-expand group containing current route on location change
  useEffect(() => {
    navigation.forEach(navItem => {
      if ('groupTitle' in navItem) {
        const hasActive = navItem.items.some(item => location.pathname.startsWith(item.href))
        if (hasActive) {
          setCollapsedGroups(prev => ({ ...prev, [navItem.groupTitle]: false }))
        }
      }
    })
  }, [location.pathname])

  // Filter navigation items by role and search query
  const filteredNavigation = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return navigation.map(navItem => {
      if ('groupTitle' in navItem) {
        // Role check first
        const roleFiltered = navItem.items.filter(item => !item.roles || hasAnyRole(item.roles))
        if (roleFiltered.length === 0) return null

        if (!query) {
          return { ...navItem, items: roleFiltered }
        }

        // Search query matching: check title, Arabic title, label, Arabic label, or href
        const matchesGroupTitle = (navItem.groupTitle || '').toLowerCase().includes(query) ||
                                  (navItem.groupTitleAr || '').toLowerCase().includes(query)

        const matchingItems = roleFiltered.filter(item =>
          matchesGroupTitle ||
          item.label.toLowerCase().includes(query) ||
          (item.labelAr && item.labelAr.toLowerCase().includes(query)) ||
          item.href.toLowerCase().includes(query)
        )

        if (matchingItems.length === 0) return null
        return { ...navItem, items: matchingItems }
      } else {
        if (navItem.roles && !hasAnyRole(navItem.roles)) return null
        if (!query) return navItem

        const matches = navItem.label.toLowerCase().includes(query) ||
                        (navItem.labelAr && navItem.labelAr.toLowerCase().includes(query)) ||
                        navItem.href.toLowerCase().includes(query)

        return matches ? navItem : null
      }
    }).filter(Boolean) as (NavItem | (NavGroup & { items: NavItem[] }))[]
  }, [searchQuery, hasAnyRole])

  // Total matching routes count
  const totalMatchesCount = useMemo(() => {
    let count = 0
    filteredNavigation.forEach(item => {
      if ('groupTitle' in item) {
        count += item.items.length
      } else if (item) {
        count += 1
      }
    })
    return count
  }, [filteredNavigation])

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

      {/* Header Logo & Language Switcher */}
      <div className="flex flex-col items-center justify-center px-5 py-4 border-b border-sidebar-border bg-gradient-to-b from-white/[0.03] to-transparent gap-3 shrink-0">
        <img src="/logo-encg.png" alt="ENCG Fès" className="h-10 object-contain drop-shadow-md" />

        {/* Quick Language Selector */}
        <div className="flex items-center gap-1 bg-black/25 p-1 rounded-xl border border-white/10 w-full justify-between text-[11px] font-bold">
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

      {/* Dynamic Route Search Bar */}
      <div className="px-4 py-3 border-b border-sidebar-border/80 bg-black/15 shrink-0">
        <div className="relative flex items-center">
          <Search className="absolute start-3 w-3.5 h-3.5 text-sidebar-foreground/50 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "ابحث عن أي مسار أو صفحة..." : "Rechercher une page (ex: notes)..."}
            className="w-full bg-white/5 border border-white/10 rounded-xl ps-9 pe-8 py-2 text-xs text-white placeholder:text-sidebar-foreground/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 transition-all shadow-inner"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute end-2.5 p-1 rounded-full text-white/50 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              aria-label="Réinitialiser la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute end-2.5 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold text-white/40 bg-white/10 border border-white/10 rounded pointer-events-none">
              /
            </kbd>
          )}
        </div>
        {searchQuery && (
          <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-indigo-300 font-medium">
            <span>{isRtl ? `${totalMatchesCount} مسارات مطابقة` : `${totalMatchesCount} page(s) trouvée(s)`}</span>
            <button
              onClick={() => setSearchQuery('')}
              className="hover:underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              {isRtl ? 'إلغاء' : 'Effacer'}
            </button>
          </div>
        )}
      </div>

      {/* Institution & User Role Badge */}
      {user && !searchQuery && (
        <div className="mx-4 mt-4 px-3.5 py-2.5 rounded-xl bg-gradient-to-br from-sidebar-accent to-sidebar-background border border-sidebar-border shadow-xs shrink-0">
          <p className="text-xs font-semibold text-sidebar-foreground truncate">{user.institution_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8] animate-pulse" />
            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">{user.roles[0]}</p>
          </div>
        </div>
      )}

      {/* Main Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1.5 custom-scrollbar">
        {filteredNavigation.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
              <FilterX className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white">
              {isRtl ? 'لا توجد نتائج مطابقة' : 'Aucun résultat trouvé'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 mt-1.5 max-w-[200px] leading-relaxed">
              {isRtl 
                ? `لم نجد أي مسار يطابق "${searchQuery}"` 
                : `Aucune page ne correspond à "${searchQuery}"`
              }
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 rounded-lg transition-colors cursor-pointer"
            >
              {isRtl ? 'مسح البحث' : 'Effacer la recherche'}
            </button>
          </div>
        ) : (
          filteredNavigation.map((navItem, idx) => {
            if ('groupTitle' in navItem) {
              const isCollapsed = Boolean(!searchQuery && collapsedGroups[navItem.groupTitle])
              const groupItems = navItem.items

              return (
                <div key={navItem.groupTitle || idx} className="mt-4 first:mt-0">
                  {/* Collapsible Group Header */}
                  <button
                    onClick={() => toggleGroup(navItem.groupTitle)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold tracking-[0.08em] text-sidebar-foreground/60 hover:text-white uppercase group transition-colors rounded-lg hover:bg-white/5 cursor-pointer"
                  >
                    <span className="truncate">
                      {isRtl ? (navItem.groupTitleAr || navItem.groupTitle) : navItem.groupTitle}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0 text-sidebar-foreground/40 group-hover:text-white/80">
                      <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded-full border border-white/5 font-mono text-white/70">
                        {groupItems.length}
                      </span>
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 transition-transform rtl:rotate-180" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 transition-transform" />
                      )}
                    </div>
                  </button>

                  {/* Group Nav Items */}
                  {!isCollapsed && (
                    <div className="space-y-1 mt-1">
                      {groupItems.map((item) => (
                        <NavLink
                          key={item.href}
                          to={item.href}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer select-none group relative',
                              isActive 
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-bold translate-x-1' 
                                : 'text-sidebar-foreground/80 hover:text-white hover:bg-white/10 hover:translate-x-0.5'
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {/* Active indicator edge bar */}
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
                              {item.badge && (
                                <span className="ms-auto px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            } else {
              return (
                <div key={navItem.href} className="mt-4 first:mt-0">
                  <NavLink
                    to={navItem.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer select-none group relative',
                        isActive 
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-bold translate-x-1' 
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
          })
        )}
      </nav>

      {/* User Footer Profile Card */}
      {user && (
        <div
          className="flex items-center gap-3 px-4 py-4 bg-sidebar-background border-t border-sidebar-border cursor-pointer hover:bg-sidebar-accent transition-colors group shrink-0"
          onClick={() => {
            navigate('/profile');
            onClose && onClose();
          }}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-md shrink-0">
            {user.avatar_path ? (
              <img src={`${(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')}/storage/${user.avatar_path}`} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate group-hover:text-indigo-200 transition-colors">{user.name}</p>
            <p className="text-sidebar-foreground/60 text-[11px] truncate">{user.email}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-sidebar-foreground/50 group-hover:text-white transition-colors transform rtl:rotate-180 shrink-0" />
        </div>
      )}
    </div>
  )
}
