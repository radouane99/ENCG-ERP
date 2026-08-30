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
  BrainCircuit, Landmark, ShieldCheck, Globe, PlaneTakeoff, Lock, Sparkles, Compass,
  X, Layers, IdCard, Eye, Calculator, TrendingUp, Search, BellRing,
  UserX, Gavel, CalendarCheck, AreaChart, MailCheck, RotateCcw, Repeat, FileEdit, UserCog, UserCheck,
  Clock3, CalendarSync, DoorOpen, Cpu, Palmtree, HeartHandshake, CreditCard, Stamp, Send,
  BookMarked, GitFork, FilterX, Archive, Key, Mic, ArrowRightLeft
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

// Professional, structured, and modular navigation architecture for ENCG ERP
const navigation: (NavItem | NavGroup)[] = [
  // ── TABLEAU DE BORD GLOBAL ──
  {
    label: 'Tableau de Bord',
    labelAr: 'لوحة التحكم الرئيسية',
    href: '/dashboard',
    icon: LayoutDashboard
  },

  // ── 1. PILOTAGE, STRATÉGIE & DÉCISION ──
  {
    groupTitle: 'PILOTAGE & STRATÉGIE',
    groupTitleAr: 'القيادة والاستراتيجية',
    items: [
      { label: 'Pilotage Académique', labelAr: 'القيادة الأكاديمية', href: '/admin/pilotage', icon: Target, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Tableau des Alertes', labelAr: 'مركز التنبيهات المركزي', href: '/admin/alerts', icon: BellRing, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Rapport Ministère MESRSFC', labelAr: 'تقرير الوزارة الرسمي', href: '/admin/ministry-report', icon: Landmark, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Analytique & Prédictions IA', labelAr: 'التحليلات الذكية والتنبؤ', href: '/admin/predictive-analytics', icon: BrainCircuit, badge: 'IA', roles: ['super-admin', 'institution-admin'] },
      { label: 'Indicateurs Financiers', labelAr: 'المؤشرات المالية', href: '/admin/finance-dashboard', icon: Calculator, roles: ['super-admin', 'institution-admin'] },
    ]
  },

  // ── 2. GUICHET, SCOLARITÉ & ÉTUDIANTS ──
  {
    groupTitle: 'SCOLARITÉ & ÉTUDIANTS',
    groupTitleAr: 'الشؤون الطلابية والمسالك',
    items: [
      { label: 'Guichet Unique & Demandes', labelAr: 'الشباك والطلبات الإدارية', href: '/admin/guichet', icon: ClipboardList, badge: 'SLA', roles: ['super-admin', 'institution-admin', 'director', 'scolarite'] },
      { label: 'Gestion des Étudiants', labelAr: 'إدارة الطلبة', href: '/admin/students', icon: Users, roles: ['super-admin', 'institution-admin', 'director', 'scolarite'] },
      { label: 'Inscriptions & Réinscriptions', labelAr: 'التسجيل وإعادة التسجيل', href: '/academic/enrollments', icon: UserPlus, roles: ['super-admin', 'institution-admin', 'director', 'scolarite'] },
      { label: 'Structure & Départements', labelAr: 'الهيكلة والأقسام', href: '/academic/departments', icon: Building2, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Filières & Maquettes LMD', labelAr: 'المسالك والتخصصات', href: '/academic/filieres', icon: GraduationCap, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Groupes & Sections', labelAr: 'المجموعات والأفواج', href: '/academic/groups', icon: Network, roles: ['super-admin', 'institution-admin', 'director', 'scolarite'] },
      { label: 'Cartes Étudiants & Pass', labelAr: 'بطاقات الطلبة الرقمية', href: '/admin/student-cards', icon: IdCard, badge: 'Pass', roles: ['super-admin', 'institution-admin', 'director', 'scolarite'] },
      { label: 'Admissions & Concours TAFEM', labelAr: 'الترشيحات ومباراة طافيم', href: '/admin/tafem', icon: Trophy, roles: ['super-admin', 'institution-admin', 'director', 'scolarite'] },
      { label: 'Suivi des Absences', labelAr: 'تتبع الغيابات', href: '/admin/absences', icon: UserX, roles: ['super-admin', 'institution-admin', 'director', 'scolarite'] },
      { label: 'Conseil de Discipline', labelAr: 'مجلس التأديب', href: '/discipline', icon: Gavel, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },

  // ── 3. EXAMENS, NOTES & DÉLIBÉRATIONS ──
  {
    groupTitle: 'EXAMENS & DÉLIBÉRATIONS',
    groupTitleAr: 'الامتحانات والمداولات',
    items: [
      { label: 'Planification des Examens', labelAr: 'برمجة الامتحانات', href: '/admin/exams', icon: CalendarCheck, roles: ['super-admin', 'institution-admin', 'director', 'scolarite'] },
      { label: 'Gestion des Convocations', labelAr: 'إدارة الاستدعاءات', href: '/admin/convocations', icon: MailCheck, roles: ['super-admin', 'institution-admin', 'director', 'scolarite'] },
      { label: 'Scanner QR des Présences', labelAr: 'ماسح الحضور بالباركود', href: '/admin/exams/scan', icon: ScanLine, badge: 'QR', roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { label: 'Saisie des Notes & Rattrapages', labelAr: 'إدخال النقاط والتدارك', href: '/admin/grades', icon: FileEdit, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'vacataire', 'department-head', 'filiere-head', 'scolarite'] },
      { label: 'Délibérations & PVs Apogée', labelAr: 'المداولات ومحاضر أبوجي', href: '/admin/grades/pv', icon: Calculator, badge: 'LMD', roles: ['super-admin', 'institution-admin', 'director', 'department-head', 'filiere-head', 'scolarite'] },
      { label: 'Archives PVs & Émargements', labelAr: 'أرشيف المحاضر والتوقيعات', href: '/admin/exams/pv-archive', icon: Archive, badge: 'PV', roles: ['super-admin', 'institution-admin', 'director', 'scolarite'] },
      { label: 'Verrouillage des Épreuves', labelAr: 'قفل الاختبارات والنتائج', href: '/admin/exam-locking', icon: Lock, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },

  // ── 4. CORPS ENSEIGNANT & EMPLOIS DU TEMPS ──
  {
    groupTitle: 'ENSEIGNANTS & PLANNINGS',
    groupTitleAr: 'الأساتذة واستعمالات الزمن',
    items: [
      { label: 'Professeurs & Vacataires', labelAr: 'هيئة التدريس والأساتذة', href: '/professors', icon: UserCheck, roles: ['super-admin', 'institution-admin', 'hr-officer'] },
      { label: 'Parapheur Électronique', labelAr: 'المحفظة الإلكترونية وأوامر المهمة', href: '/admin/parapheur', icon: Stamp, badge: 'RH', roles: ['super-admin', 'institution-admin', 'director', 'department-head', 'hr-officer'] },
      { label: 'Affectations Pédagogiques', labelAr: 'التوزيع البيداغوجي للمواد', href: '/admin/professor-assignments', icon: Sparkles, roles: ['super-admin', 'institution-admin', 'department-head', 'director'] },
      { label: 'Générateur Intelligent (IA & CSP)', labelAr: 'المولد الذكي واستوديو الجداول', href: '/admin/ai-timetable-scheduler', icon: Cpu, badge: 'AI', roles: ['super-admin', 'institution-admin', 'director', 'department-head'] },
      { label: 'Emplois du Temps (EDT)', labelAr: 'استعمالات الزمن', href: '/admin/timetable/calendar', icon: Calendar, roles: ['super-admin', 'institution-admin', 'director', 'professor', 'vacataire', 'department-head', 'filiere-head', 'scolarite'] },
      { label: 'Occupation & Salles Libres (Rattrapages)', labelAr: 'شغل القاعات وحصص الاستدراك', href: '/admin/rooms/availability', icon: MapPin, badge: 'LIVE', roles: ['super-admin', 'institution-admin', 'director', 'department-head', 'filiere-head', 'scolarite'] },
      { label: 'Disponibilités & Conflits', labelAr: 'أوقات التوفر وطلبات التعديل', href: '/admin/professor-availability', icon: Clock3, roles: ['super-admin', 'institution-admin', 'director', 'hr-officer'] },
      { label: 'Cahiers de Textes', labelAr: 'دفاتر النصوص الجامعية', href: '/admin/textbooks', icon: Book, roles: ['super-admin', 'institution-admin', 'director', 'department-head'] },
    ]
  },

  // ── 5. CAMPUS, STAGES & VIE ÉTUDIANTE ──
  {
    groupTitle: 'CAMPUS, STAGES & PFE',
    groupTitleAr: 'الحرم الجامعي ومشاريع التخرج',
    items: [
      { label: 'Workflow Stages & PFE', labelAr: 'مسار التداريب ومشاريع التخرج', href: '/admin/pfe-workflow', icon: Kanban, badge: 'PFE', roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { label: 'Jurys de Soutenance PFE', labelAr: 'لجان مناقشة التخرج', href: '/admin/jury-pfe', icon: Award, roles: ['super-admin', 'institution-admin', 'director', 'professor'] },
      { label: 'Salles & Amphithéâtres', labelAr: 'القاعات والمدرجات', href: '/infrastructure/classrooms', icon: DoorOpen, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Réservations de Salles', labelAr: 'حجز القاعات والمدرجات', href: '/admin/reservations', icon: Ticket, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Clubs & Vie Étudiante', labelAr: 'الأندية والأنشطة الطلابية', href: '/admin/clubs', icon: HeartHandshake, roles: ['super-admin', 'institution-admin', 'director'] },
      { label: 'Mobilité Internationale', labelAr: 'برامج التبادل والحركية', href: '/admin/mobility', icon: PlaneTakeoff, roles: ['super-admin', 'institution-admin', 'director'] },
    ]
  },

  // ── 6. SÉCURITÉ, RBAC & ADMINISTRATION ──
  {
    groupTitle: 'SÉCURITÉ & SYSTÈME',
    groupTitleAr: 'الأمان وإعدادات النظام',
    items: [
      { label: 'Comptes Utilisateurs', labelAr: 'إدارة حسابات المستخدمين', href: '/admin/users', icon: UserCog, roles: ['super-admin', 'institution-admin'] },
      { label: 'Droits & Privilèges (RBAC)', labelAr: 'مصفوفة الأدوار والصلاحيات', href: '/admin/roles-permissions', icon: Key, badge: 'RBAC', roles: ['super-admin', 'institution-admin'] },
      { label: 'Diplômes Blockchain', labelAr: 'شهادات البلوكشين المؤمنة', href: '/admin/blockchain-diplomas', icon: ShieldCheck, badge: 'BC', roles: ['super-admin', 'institution-admin'] },
      { label: 'Journal d\'Audit (Logs)', labelAr: 'سجل العمليات والمراجعة', href: '/admin/activity-logs', icon: Activity, roles: ['super-admin', 'institution-admin'] },
      { label: 'Archivage & Bascule d\'Année', labelAr: 'الأرشفة وترحيل السنة', href: '/admin/archiving', icon: Archive, badge: 'LMD', roles: ['super-admin', 'institution-admin'] },
      { label: 'Notifications PWA Push', labelAr: 'بث الإشعارات الفورية', href: '/admin/pwa-notifications', icon: BellRing, badge: 'PWA', roles: ['super-admin', 'institution-admin'] },
      { label: 'Paramètres Système', labelAr: 'إعدادات النظام العامة', href: '/admin/settings', icon: Settings, roles: ['super-admin', 'institution-admin'] },
    ]
  },

  // ── ESPACE ÉTUDIANT (Strictement réservé pour role: student) ──
  {
    groupTitle: 'ESPACE ÉTUDIANT',
    groupTitleAr: 'فضاء الطالب',
    items: [
      { label: 'Mon Emploi du Temps', labelAr: 'جداول أوقاتي', href: '/student/schedule', icon: CalendarDays, roles: ['student'] },
      { label: 'Orientation Master & LMD (IA)', labelAr: 'التوجيه الذكي وحساب التعويض', href: '/student/orientation', icon: Compass, badge: 'IA', roles: ['student'] },
      { label: 'Mes Stages & PFE', labelAr: 'تداريبي ومشاريع التخرج', href: '/student/internships', icon: Briefcase, roles: ['student'] },
      { label: 'Mes Notes & Résultats', labelAr: 'نقاطي ونتائجي', href: '/student/grades', icon: TrendingUp, roles: ['student'] },
      { label: 'Mes Absences & Justificatifs', labelAr: 'غياباتي والمبررات', href: '/student/absences', icon: UserX, roles: ['student'] },
      { label: 'Carte Numérique (Pass)', labelAr: 'بطاقتي الرقمية', href: '/student/card', icon: CreditCard, roles: ['student'] },
      { label: 'Mes Convocations PDF', labelAr: 'استدعاءاتي', href: '/student/convocations', icon: MailCheck, roles: ['student'] },
      { label: 'Guichet Électronique', labelAr: 'الشباك الإلكتروني', href: '/student/documents', icon: Stamp, roles: ['student'] },
      { label: 'Portfolio & Compétences', labelAr: 'ملفي المفهومي والمهارات', href: '/student/portfolio', icon: Crown, roles: ['student'] },
      { label: 'Clubs Étudiants', labelAr: 'أنديتي الطلابية', href: '/student/clubs', icon: HeartHandshake, roles: ['student'] },
      { label: 'Mobilité & Échanges', labelAr: 'برامج الحركية', href: '/student/mobility', icon: Globe, roles: ['student'] },
      { label: 'Bibliothèque Numérique', labelAr: 'المكتبة الرقمية', href: '/student/library', icon: BookOpen, roles: ['student'] },
    ]
  },

  // ── ESPACE ENSEIGNANT-CHERCHEUR (Strictement réservé pour role: professor, vacataire) ──
  {
    groupTitle: 'ESPACE ENSEIGNANT',
    groupTitleAr: 'فضاء الأستاذ',
    items: [
      { label: 'Mon Emploi du Temps', labelAr: 'جدول أوقاتي', href: '/professor/schedules', icon: CalendarDays, roles: ['professor', 'vacataire'] },
      { label: 'Salles libres (extra / rattrapage)', labelAr: 'القاعات المتاحة للاستدراك', href: '/professor/rooms/availability', icon: MapPin, badge: 'DISPO', roles: ['professor', 'vacataire'] },
      { label: 'Saisie des Notes (Apogée)', labelAr: 'إدخال النقاط (أبوجي)', href: '/admin/grades', icon: FileEdit, roles: ['professor', 'vacataire'] },
      { label: 'Double Correction Apogée', labelAr: 'التصحيح المزدوج للمواد', href: '/professor/double-grading', icon: ArrowRightLeft, badge: 'LMD', roles: ['professor'] },
      { label: 'Cahier de Texte Vocal (IA)', labelAr: 'دفتر النصوص الصوتي الذكي', href: '/professor/voice-textbook', icon: Mic, badge: 'IA', roles: ['professor', 'vacataire'] },
      { label: 'Saisie des Absences & Appel', labelAr: 'تسجيل الغيابات والمناداة', href: '/professor/absences', icon: UserX, roles: ['professor', 'vacataire'] },
      { label: 'Surveillances Planifiées', labelAr: 'جدول الحراسات المبرمجة', href: '/professor/proctoring', icon: Eye, roles: ['professor'] },
      { label: 'Grille Soutenance PFE', labelAr: 'شبكة تقييم مناقشات PFE', href: '/professor/pfe-evaluation', icon: Award, badge: 'PFE', roles: ['professor', 'vacataire'] },
      { label: 'Charge Statutaire & Vacations', labelAr: 'الحصص ومستحقات الساعات', href: '/professor/workload', icon: Clock, badge: 'RH', roles: ['professor', 'vacataire'] },
      { label: 'Guichet RH & Ordres de Mission', labelAr: 'شباك الوثائق الإدارية والمهمات', href: '/professor/documents', icon: Stamp, badge: 'RH', roles: ['professor', 'vacataire'] },
    ]
  },
]

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { i18n } = useTranslation('common')
  const { user, hasAnyRole, activeRole } = useAuthStore()
  const loc = i18n.language.slice(0, 2)
  const isRtl = loc === 'ar'
  const navLabel = (item: { label: string; labelAr?: string; labelEn?: string }) =>
    loc === 'ar' ? (item.labelAr || item.label) : loc === 'en' ? (item.labelEn || item.label) : item.label
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
        const roleFiltered = navItem.items.filter(item => {
          if (!item.roles) return true
          if (activeRole) {
            const normalizedActive = activeRole.replace('_', '-').toLowerCase()
            return item.roles.some(r => r.toLowerCase().replace('_', '-') === normalizedActive)
          }
          return hasAnyRole(item.roles)
        })
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

      {/* Header Logo */}
      <div className="flex items-center justify-center px-5 py-4 border-b border-sidebar-border bg-gradient-to-b from-white/[0.03] to-transparent shrink-0">
        <img src="/logo-encg.png" alt="ENCG Fès" className="h-10 object-contain drop-shadow-md" />
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
                          className={({ isActive }: { isActive: boolean }) =>
                            cn(
                              'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer select-none group relative',
                              isActive 
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-bold translate-x-1' 
                                : 'text-sidebar-foreground/80 hover:text-white hover:bg-white/10 hover:translate-x-0.5'
                            )
                          }
                        >
                          {({ isActive }: { isActive: boolean }) => (
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
                                {navLabel(item)}
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
                    className={({ isActive }: { isActive: boolean }) =>
                      cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer select-none group relative',
                        isActive 
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-bold translate-x-1' 
                          : 'text-sidebar-foreground/80 hover:text-white hover:bg-white/10 hover:translate-x-0.5'
                      )
                    }
                  >
                    {({ isActive }: { isActive: boolean }) => (
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
                          {navLabel(navItem)}
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
