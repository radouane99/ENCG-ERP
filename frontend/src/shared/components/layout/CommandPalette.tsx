import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        isOpen ? onClose() : onClose() // Toggle logic handled higher up typically, so just open here if we pass open state
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', shortcut: 'G D', icon: '📊' },
    { name: 'Admissions', path: '/admissions', shortcut: 'G A', icon: '🎓' },
    { name: 'Student Records', path: '/students', shortcut: 'G S', icon: '🧑‍🎓' },
    { name: 'Vacataires & HR', path: '/hr', shortcut: 'G H', icon: '💼' },
    { name: 'Deliberations', path: '/exams/deliberations', shortcut: 'G E', icon: '⚖️' },
    { name: 'Library', path: '/library', shortcut: 'G L', icon: '📚' },
  ]

  const filteredItems = query === '' 
    ? navigationItems 
    : navigationItems.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
      )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 sm:pt-40">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Palette */}
      <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-card border shadow-2xl transition-all">
        <div className="relative flex items-center px-4 border-b">
          <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="w-full bg-transparent border-0 px-4 py-5 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-lg outline-none"
            placeholder="Search modules, settings, or students..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted rounded-md border">
            ESC
          </kbd>
        </div>

        {filteredItems.length > 0 && (
          <ul className="max-h-96 overflow-y-auto p-2" role="listbox">
            {filteredItems.map((item, index) => (
              <li
                key={item.path}
                className={`group flex cursor-pointer select-none items-center rounded-md px-3 py-3 hover:bg-primary hover:text-primary-foreground ${index === 0 ? 'bg-primary/10 text-primary' : 'text-foreground'}`}
                onClick={() => {
                  navigate(item.path)
                  onClose()
                }}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-hover:bg-primary-foreground/20 text-lg">
                  {item.icon}
                </span>
                <span className="ml-4 flex-auto font-medium">{item.name}</span>
                <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-muted-foreground group-hover:text-primary-foreground/70">
                  {item.shortcut}
                </kbd>
              </li>
            ))}
          </ul>
        )}

        {query !== '' && filteredItems.length === 0 && (
          <div className="px-6 py-14 text-center text-sm sm:px-14">
            <p className="text-foreground">No results found for "{query}".</p>
            <p className="mt-1 text-muted-foreground">Try searching for modules like 'Admissions' or 'HR'.</p>
          </div>
        )}
      </div>
    </div>
  )
}
