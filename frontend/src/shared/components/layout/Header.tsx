import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { 
  Search, LogOut, User, Menu, ChevronDown, 
  Sparkles, Settings, Command
} from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NotificationBell } from './NotificationBell'
import { InstallPWAPrompt } from './InstallPWAPrompt'

interface HeaderProps {
  onOpenCommand?: () => void;
  onOpenSidebar?: () => void;
}

export default function Header({ onOpenCommand, onOpenSidebar }: HeaderProps) {
  const { i18n } = useTranslation('common')
  const { t } = useTranslation('common')
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const isRtl = i18n.language === 'ar'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Detect current route category / breadcrumb title
  const getPageTitle = (pathname: string) => {
    if (pathname === '/dashboard') return isRtl ? 'لوحة التحكم' : 'Tableau de Bord'
    if (pathname.includes('/admin/pilotage')) return isRtl ? 'القيادة الأكاديمية' : 'Pilotage Académique'
    if (pathname.includes('/admin/alerts')) return isRtl ? 'جدول التنبيهات' : 'Tableau des Alertes'
    if (pathname.includes('/admin/grades/pv')) return isRtl ? 'المداولات والمحاضر' : 'Délibérations & PVs'
    if (pathname.includes('/admin/exams')) return isRtl ? 'إدارة الامتحانات' : 'Examens Planifiés'
    if (pathname.includes('/admin/students')) return isRtl ? 'إدارة الطلبة' : 'Gestion des Étudiants'
    if (pathname.includes('/admin/requests')) return isRtl ? 'الطلبات الإدارية' : 'Demandes Administratives'
    if (pathname.includes('/student/grades')) return isRtl ? 'نقاطي ونتائجي' : 'Mes Notes & Résultats'
    if (pathname.includes('/student/card')) return isRtl ? 'بطاقتي الرقمية' : 'Carte Numérique'
    if (pathname.includes('/professor/textbook')) return isRtl ? 'دفتر النصوص' : 'Cahier de Texte'
    if (pathname.includes('/profile')) return isRtl ? 'الملف الشخصي' : 'Mon Profil'
    return ''
  }

  const pageTitle = getPageTitle(location.pathname)

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex items-center px-4 md:px-6 justify-between gap-3 md:gap-4 shrink-0 sticky top-0 z-40 transition-colors duration-300 shadow-xs">
      
      {/* Left side: Hamburger + Breadcrumb/Page Title + Search */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
        {/* Mobile Hamburger Menu Toggle */}
        <button 
          onClick={onOpenSidebar}
          className="lg:hidden p-2 -ms-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current Active Page Title (Visible on medium/large screens) */}
        {pageTitle && (
          <div className="hidden xl:flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
            <span>{pageTitle}</span>
          </div>
        )}

        {/* Command Search Bar Trigger */}
        <div className="flex-1 max-w-md">
          <div className="relative group">
            <button
              onClick={onOpenCommand}
              className={cn(
                'w-full flex items-center justify-between ps-9 pe-3 py-2 text-xs sm:text-sm rounded-xl',
                'bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-500 dark:text-slate-400',
                'hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-500/50 hover:shadow-md dark:hover:shadow-indigo-500/10',
                'transition-all duration-200 text-start cursor-pointer group'
              )}
            >
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              <span className="truncate">
                {isRtl ? 'ابحث عن صفحة، طالب، نقطة أو محضر...' : 'Rechercher une action, étudiant, PV, module...'}
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-extrabold uppercase bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 shadow-xs ms-2 shrink-0">
                <Command className="w-3 h-3" />
                <span>K</span>
              </kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Right side: AI Assistant Shortcut + Utilities + Notifications + User Menu */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        
        {/* Quick AI Assistant Trigger */}
        <button
          onClick={onOpenCommand}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 hover:from-indigo-500/20 hover:via-purple-500/20 hover:to-pink-500/20 border border-indigo-500/20 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all shadow-xs hover:scale-[1.02] active:scale-95 cursor-pointer"
          title="Ouvrir la recherche globale et IA"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          <span>Assistant IA</span>
        </button>

        {/* PWA Prompt */}
        <div className="hidden lg:block">
          <InstallPWAPrompt />
        </div>
        
        {/* Utilities */}
        <LanguageSwitcher />
        <ThemeToggle />
        <NotificationBell />

        {/* User Profile Dropdown Menu */}
        <div className="relative ms-1 md:ms-2">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 pe-2 md:px-2.5 md:py-1.5 rounded-full md:rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-black shadow-inner shrink-0">
              {user?.avatar_path ? (
                <img 
                  src={`${(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')}/storage/${user.avatar_path}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            
            <div className="hidden md:flex flex-col text-start min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[110px] truncate leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {user?.name}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider truncate">
                {user?.roles?.[0] || 'Utilisateur'}
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 hidden md:block" />
          </button>

          {/* User Menu Overlay Dropdown */}
          {showUserMenu && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              
              <div className="absolute end-0 top-[calc(100%+0.5rem)] w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-2 motion-safe:animate-scale-in origin-top-right overflow-hidden">
                {/* User Header Info */}
                <div className="px-4 py-3 bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-800/50 dark:to-transparent border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  {user?.institution_name && (
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1 truncate">
                      {user.institution_name}
                    </p>
                  )}
                </div>

                {/* Dropdown Items */}
                <div className="py-1.5 px-1 space-y-0.5">
                  <button
                    onClick={() => { navigate('/profile'); setShowUserMenu(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors text-start cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    {t('profile') || 'Mon Profil'}
                  </button>

                  <button
                    onClick={() => { navigate('/admin/settings'); setShowUserMenu(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors text-start cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    {isRtl ? 'إعدادات الحساب' : 'Paramètres du compte'}
                  </button>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 my-1 mx-2" />

                <div className="px-1 pb-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-start cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('logout') || 'Déconnexion'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
