import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import Sidebar from './Sidebar'
import Header from './Header'
import { GlobalSearchModal } from './GlobalSearchModal'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@stores/authStore'
import CommandPalette from './CommandPalette'
import StudentChatbot from '../chat/StudentChatbot'

export default function AppShell() {
  const fetchUser = useAuthStore((s) => s.fetchUser)
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onOpenCommand={() => setSearchOpen(true)} />
        
        {/* Search Modal */}
        <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          style: { fontFamily: 'var(--font-sans)' },
        }}
      />
      
      {/* Global AI Assistant Widget */}
      <StudentChatbot />
    </div>
  )
}
