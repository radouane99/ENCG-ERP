import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import Sidebar from './Sidebar'
import Header from './Header'
import { GlobalSearchModal } from './GlobalSearchModal'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@stores/authStore'
import CommandPalette from './CommandPalette'
import StudentChatbot from '../chat/StudentChatbot'
import { ErrorBoundary } from '@shared/components/ui/ErrorBoundary'

export default function AppShell() {
  const fetchUser = useAuthStore((s) => s.fetchUser)
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen(open => !open)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div className={`fixed inset-y-0 start-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main content area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header 
          onOpenCommand={() => setSearchOpen(true)} 
          onOpenSidebar={() => setSidebarOpen(true)} 
        />
        
        {/* Search Modal */}
        <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      {/* Premium Toast Notifications */}
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          className: 'shadow-xl rounded-xl border border-[hsl(var(--border))]',
          style: { fontFamily: 'var(--font-sans)' },
        }}
      />
      
      {/* Global AI Assistant Widget */}
      <StudentChatbot />
    </div>
  )
}
