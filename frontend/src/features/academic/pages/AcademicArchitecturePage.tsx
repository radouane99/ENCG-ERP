import { useState, useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Building2,GraduationCap,Users,Sparkles,BookOpen } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import DepartmentList from '../components/DepartmentList'
import FiliereList from '../components/FiliereList'
import GroupsPage from './GroupsPage'

export default function AcademicArchitecturePage() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const getInitialTab = (): 'departments' | 'filieres' | 'groups' => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'filieres' || tabParam === 'departments' || tabParam === 'groups') {
      return tabParam
    }
    if (location.pathname.includes('/academic/filieres')) return 'filieres'
    if (location.pathname.includes('/academic/groups')) return 'groups'
    if (location.pathname.includes('/academic/departments')) return 'departments'
    return 'departments'
  }

  const [activeTab, setActiveTab] = useState<'departments' | 'filieres' | 'groups'>(getInitialTab)

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'filieres' || tabParam === 'departments' || tabParam === 'groups') {
      setActiveTab(tabParam)
    } else if (location.pathname.includes('/academic/filieres')) {
      setActiveTab('filieres')
    } else if (location.pathname.includes('/academic/groups')) {
      setActiveTab('groups')
    } else if (location.pathname.includes('/academic/departments')) {
      setActiveTab('departments')
    }
  }, [location.pathname, searchParams])

  const handleTabChange = (tab: 'departments' | 'filieres' | 'groups') => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  return (
    <div className="max-w-[1700px] mx-auto space-y-8 font-sans animate-in fade-in pb-24">
      {/* ── Hero Powerhouse Banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden p-8 md:p-10 text-white border border-indigo-900/40 erp-page-banner">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-sm shrink-0">
              <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-200 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 border border-indigo-400/30">
                <Sparkles className="w-4 h-4 text-amber-300" /> Architecture Pédagogique LMD — ENCG Fès
              </div>
              <h1 className="text-white leading-tight erp-page-title">
                Structure Académique & Maquettes LMD 360°
              </h1>
              <p className="text-indigo-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Supervision centralisée de l'offre de formation : Départements académiques, Filières d'excellence et gestion des Groupes & Sections.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mode Switcher Tabs ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border border-border shadow-sm overflow-x-auto">
        <button
          onClick={() => handleTabChange('departments')}
          className={cn(
            "flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'departments'
              ? "bg-[#0f2863] text-white shadow-md"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Building2 className="w-4 h-4 text-amber-400" />
          <span>1. Départements Académiques</span>
        </button>

        <button
          onClick={() => handleTabChange('filieres')}
          className={cn(
            "flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'filieres'
              ? "bg-[#0f2863] text-white shadow-md"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <GraduationCap className="w-4 h-4 text-teal-400" />
          <span>2. Filières & Maquettes LMD</span>
        </button>

        <button
          onClick={() => handleTabChange('groups')}
          className={cn(
            "flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'groups'
              ? "bg-[#0f2863] text-white shadow-md"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Users className="w-4 h-4 text-indigo-400" />
          <span>3. Groupes & Sections</span>
        </button>

        <Link
          to="/academic/modules"
          className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ml-auto bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/40"
        >
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span>4. Catalogue des Modules & ECM →</span>
        </Link>
      </div>

      {/* ── Tab Contents ──────────────────────────────────────────────────────── */}
      <div className="animate-in fade-in">
        {activeTab === 'departments' && <DepartmentList />}
        {activeTab === 'filieres' && <FiliereList />}
        {activeTab === 'groups' && <GroupsPage />}
      </div>
    </div>
  )
}
