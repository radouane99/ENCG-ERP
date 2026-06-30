import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { Bell, Search, Sun, Moon, Globe, LogOut, User } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@shared/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NotificationBell } from './NotificationBell'
import { InstallPWAPrompt } from './InstallPWAPrompt'

interface HeaderProps {
  onOpenCommand?: () => void;
}

export default function Header({ onOpenCommand }: HeaderProps) {
  const { t, i18n } = useTranslation('common')
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-6 gap-4 shrink-0 sticky top-0 z-40">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <button
            onClick={onOpenCommand}
            className={cn(
              'w-full flex items-center justify-between pl-9 pr-4 py-1.5 text-sm rounded-lg',
              'bg-muted border border-border text-muted-foreground',
              'hover:bg-muted/80 transition-all duration-200 text-left'
            )}
          >
            {i18n.language === 'ar' ? 'بحث (Cmd+K)...' : 'Rechercher (Cmd+K)...'}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-semibold bg-background rounded-md border text-foreground/70">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <InstallPWAPrompt />
        
        {/* Academic Year Selector (Hidden on mobile) */}
        <LanguageSwitcher />

        {/* Dark mode toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationBell />

        {/* User menu */}
        <div className="relative ms-2">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden gradient-primary flex items-center justify-center text-white text-xs font-bold">
            {user?.avatar_path ? (
              <img src={`${import.meta.env.VITE_API_URL}/storage/${user.avatar_path}`} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
            </div>
            <span className="text-sm font-medium text-foreground max-w-28 truncate hidden md:block">
              {user?.name}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute end-0 top-10 w-48 bg-card border border-border rounded-xl shadow-xl z-50 py-1 animate-in">
              <button
                onClick={() => { navigate('/profile'); setShowUserMenu(false) }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <User className="w-4 h-4" />
                {i18n.language === 'ar' ? 'الملف الشخصي' : 'Mon profil'}
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {i18n.language === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
