import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { Search, LogOut, User, Menu } from 'lucide-react'
import { useState } from 'react'
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
  const { t } = useTranslation('common')
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-16 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))/80] backdrop-blur-xl flex items-center px-4 md:px-6 gap-3 md:gap-4 shrink-0 sticky top-0 z-40 transition-colors duration-300">
      
      {/* Mobile Hamburger Menu */}
      <button 
        onClick={onOpenSidebar}
        className="lg:hidden p-2 -ms-2 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--color-primary))] transition-colors" />
          <button
            onClick={onOpenCommand}
            className={cn(
              'w-full flex items-center justify-between ps-9 pe-4 py-2 text-sm rounded-xl',
              'bg-[hsl(var(--input))] border border-transparent text-[hsl(var(--muted-foreground))]',
              'hover:bg-[hsl(var(--background))] hover:border-[hsl(var(--border))] hover:shadow-sm',
              'transition-all duration-200 text-start'
            )}
          >
            {t('search')}
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-[hsl(var(--background))] rounded border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] shadow-sm">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <div className="hidden sm:block">
          <InstallPWAPrompt />
        </div>
        
        <LanguageSwitcher />
        <ThemeToggle />
        <NotificationBell />

        {/* User menu */}
        <div className="relative ms-1 md:ms-2">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 pe-2 md:px-2 md:py-1.5 rounded-full md:rounded-xl hover:bg-[hsl(var(--muted))] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] flex items-center justify-center text-white text-xs font-bold shadow-inner">
            {user?.avatar_path ? (
              <img src={`${import.meta.env.VITE_API_URL}/storage/${user.avatar_path}`} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
            </div>
            <span className="text-sm font-semibold text-[hsl(var(--foreground))] max-w-[100px] truncate hidden md:block">
              {user?.name}
            </span>
          </button>

          {showUserMenu && (
            <>
              {/* Invisible backdrop to close menu */}
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              
              <div className="absolute end-0 top-[calc(100%+0.5rem)] w-56 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-xl shadow-black/5 z-50 py-1.5 motion-safe:animate-scale-in origin-top-right">
                <div className="px-4 py-2 mb-1 border-b border-[hsl(var(--border))] md:hidden">
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">{user?.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => { navigate('/profile'); setShowUserMenu(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors text-start"
                >
                  <User className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  {t('profile')}
                </button>
                <div className="border-t border-[hsl(var(--border))] my-1.5 mx-2" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[hsl(var(--color-destructive))] hover:bg-[hsl(var(--color-destructive)/0.1)] transition-colors text-start"
                >
                  <LogOut className="w-4 h-4" />
                  {t('logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
