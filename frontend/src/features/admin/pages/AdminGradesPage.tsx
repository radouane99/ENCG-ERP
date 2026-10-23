import { useState,useEffect,useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
Target,
FileText,
BookOpen,
Users,
Building2,
Sparkles,
CheckCircle2,
ShieldCheck,
Layers,
ArrowRight,
Zap,
Edit3,
CalendarDays,
ChevronDown,
Check,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { Spinner } from '@shared/components/ui/Spinner'
import { useAuthStore } from '@stores/authStore'

// Custom Modern Popover Select Component
interface CustomSelectOption {
  value: string
  label: string
  code?: string
  badge?: string
}

interface CustomSelectProps {
  value: string
  onChange: (val: string) => void
  options: CustomSelectOption[]
  placeholder: string
  icon?: React.ElementType
  disabled?: boolean
}

function CustomSelect({ value, onChange, options, placeholder, icon: Icon, disabled = false }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => String(o.value) === String(value))

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn("relative w-full", isOpen && "z-50")} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between shadow-xs text-left",
          disabled 
            ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200" 
            : isOpen 
              ? "border-[#0f2863] ring-4 ring-[#0f2863]/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
              : value 
                ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 text-[#0f2863] dark:text-indigo-300"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
        )}
      >
        <div className="flex items-center gap-3 line-clamp-1 pr-2">
          {Icon && <Icon className={cn("w-4 h-4 shrink-0", value ? "text-[#0f2863] dark:text-indigo-400" : "text-slate-400")} />}
          <span className={cn("line-clamp-1", !value && "text-slate-400 font-medium")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200", isOpen && "rotate-180 text-[#0f2863]")} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 space-y-1 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {options.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400 font-bold italic">
              Aucune option disponible
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between text-left cursor-pointer",
                    isSelected 
                      ? "bg-[#0f2863] text-white shadow-md" 
                      : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <div className="flex items-center gap-2 line-clamp-1">
                    {opt.code && (
                      <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black uppercase font-mono", isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300")}>
                        {opt.code}
                      </span>
                    )}
                    <span className="line-clamp-1">{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminGradesPage() {
  const navigate = useNavigate()
  const { i18n } = useTranslation(['admin', 'common'])
  const isRtl = i18n.language === 'ar'
  
  const { user, hasAnyRole } = useAuthStore()
  const isProfessorRole = hasAnyRole(['professor', 'vacataire']) || (user as any)?.role === 'professor' || (user as any)?.role === 'vacataire'
  const isAdminRole = hasAnyRole(['admin', 'super-admin']) || (user as any)?.role === 'admin' || (user as any)?.role === 'super-admin'
  const isTeacherOnly = isProfessorRole && !isAdminRole

  const [filiere, setFiliere] = useState('')
  const [semestre, setSemestre] = useState('')
  const [groupe, setGroupe] = useState('')
  const [module, setModule] = useState('')
  const [selectedSession, setSelectedSession] = useState<'normale' | 'rattrapage'>('normale')
  const [filieres, setFilieres] = useState<any[]>([])
  const [groupes, setGroupes] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [myModules, setMyModules] = useState<any[]>([])
  const [loadingMyModules, setLoadingMyModules] = useState(true)
  const [showAdminCohortSelector, setShowAdminCohortSelector] = useState(!isTeacherOnly)

  useEffect(() => {
    setLoadingMyModules(true)
    api.get('/grades/my-modules')
      .then(r => {
        const mods = r.data.modules || r.data.data?.modules || []
        setMyModules(mods)
        if (mods.length === 0 && !isTeacherOnly) {
          setShowAdminCohortSelector(true)
        }
      })
      .catch(console.error)
      .finally(() => setLoadingMyModules(false))
  }, [isTeacherOnly])

  useEffect(() => {
    api.get('/filieres').then(r => {
      const data = r.data.data || r.data
      setFilieres(data)
      if (Array.isArray(data) && data.length === 1) {
        setFiliere(String(data[0].id))
      }
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (filiere) {
      setGroupe('')
      setModule('')
      setGroupes([])
      setModules([])
      api.get('/groups', { params: { filiere_id: filiere, semester: semestre || undefined } })
        .then(r => setGroupes(r.data.data || r.data)).catch(console.error)
    }
  }, [filiere, semestre])

  useEffect(() => {
    if (filiere && semestre) {
      setModule('')
      setModules([])
      api.get('/modules', { params: { filiere_id: filiere, semester: semestre } })
        .then(r => setModules(r.data.data || r.data)).catch(console.error)
    } else {
      setModules([])
    }
  }, [filiere, semestre])

  const [progressSummary, setProgressSummary] = useState<any>(null)
  const [sendingReminderId, setSendingReminderId] = useState<number | null>(null)

  const fetchProgressSummary = () => {
    api.get('/admin/grades/progress-summary', { suppressToast: true } as any)
      .then(r => setProgressSummary(r.data))
      .catch(() => {})
  }

  useEffect(() => {
    fetchProgressSummary()
  }, [])

  const handleSendReminder = async (modId: number) => {
    setSendingReminderId(modId)
    try {
      const res = await api.post('/admin/grades/send-prof-reminder', { module_id: modId })
      toast.success(res.data.message || 'Rappel envoyé avec succès !')
    } catch {
      toast.error('Erreur lors de l\'envoi du rappel.')
    } finally {
      setSendingReminderId(null)
    }
  }

  const isFormComplete = filiere !== '' && semestre !== '' && module !== ''

  const handleOpenRegistry = () => {
    if (isFormComplete) {
      navigate(`/admin/grades/edit?filiere_id=${filiere}&semester=${semestre}&module_id=${module}${groupe ? `&group_id=${groupe}` : ''}`)
    }
  }

  const selectedFiliereObj = filieres.find(f => String(f.id) === String(filiere))
  const selectedModuleObj = modules.find(m => String(m.id) === String(module))

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-32 font-sans">
      
      {/* Hero Premium Glassmorphism Header */}
      <div className="bg-gradient-to-r from-[#001035] via-[#0f2863] to-[#1e40af] rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-blue-900/40">
        <div className="absolute inset-0 opacity-15 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <Zap className="w-10 h-10 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-400/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {isTeacherOnly ? 'Espace Enseignant Certifié • ENCG Fès' : 'Système APOGÉE ENCG Maroc'}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {isTeacherOnly 
                  ? (isRtl ? 'المركز الرسمي لإدخال النقاط • وحداتي' : 'Saisie des Notes • Mes Modules')
                  : (isRtl ? 'المركز الإداري لتدقيق وإدخال النقاط' : 'Console de Gestion & Saisie des Notes')
                }
              </h1>
              <p className="text-blue-100/90 text-sm max-w-2xl font-medium mt-1">
                {isTeacherOnly
                  ? `Bienvenue Pr. ${user?.name || 'Enseignant'}. Cliquez directement sur l'un de vos modules ci-dessous pour ouvrir la grille de saisie sans recherche manuelle.`
                  : (isRtl ? 'حدد الشعبة، الدورة والوحدة للوصول المباشر لسجل النقاط الرسمي ومحاضر المداولات.' : 'Sélectionnez la filière, le semestre puis le module pour ouvrir le registre officiel des notes et générer les PVs.')
                }
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Session Type Switcher */}
            <div className="flex items-center gap-1.5 p-1.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <button
                type="button"
                onClick={() => setSelectedSession('normale')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider",
                  selectedSession === 'normale'
                    ? "bg-white text-[#0f2863] shadow-md"
                    : "text-blue-200 hover:text-white"
                )}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Ordinaire
              </button>
              <button
                type="button"
                onClick={() => setSelectedSession('rattrapage')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider",
                  selectedSession === 'rattrapage'
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                    : "text-blue-200 hover:text-white"
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                Rattrapage
              </button>
            </div>

            <button 
              onClick={() => navigate('/admin/grades/pv')}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-wider backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <FileText className="w-4 h-4 text-amber-300" /> Consulter les PVs
            </button>
          </div>
        </div>
      </div>

      {/* Analytics KPI Row (Admin Only) */}
      {!isTeacherOnly && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FILIÈRES ACTIVES</span>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{filieres.length}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Spécialités ENCG</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-black text-xl shadow-inner">
            <Building2 className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SEMESTRES EN COURS</span>
            <h3 className="text-3xl font-black text-indigo-600 mt-1">S1 — S10</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Cycle Normal & Master</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-black text-xl shadow-inner">
            <Layers className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MODULES CHARGÉS</span>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{modules.length > 0 ? modules.length : '–'}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Disponibles dans la sélection</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-black text-xl shadow-inner">
            <BookOpen className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">STATUT FORMULAIRE</span>
            <h3 className="text-sm font-black text-slate-900 dark:text-white mt-2">
              {isFormComplete ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> Prêt pour saisie
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-500">
                  <Target className="w-4 h-4" /> En attente de choix
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Sélectionnez 4 étapes</p>
          </div>
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner transition-colors", isFormComplete ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-500")}>
            <Sparkles className="w-7 h-7" />
          </div>
        </div>
      </div>
      )}

      {/* Professor Grade Progress & Reminder Widget (Admin Only) */}
      {!isTeacherOnly && progressSummary && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl border border-blue-800/40 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-400/30">
                <Zap className="w-3.5 h-3.5" /> Avancement Global de Saisie des Enseignants
              </div>
              <h3 className="text-2xl font-black">
                {progressSummary.overall_progress}% des épreuves saisies ({progressSummary.completed_modules}/{progressSummary.total_modules} Modules Complétés)
              </h3>
              <p className="text-xs text-blue-200 font-medium">
                Suivi en temps réel de la complétude des registres de notes par les professeurs permanents et vacataires.
              </p>
            </div>

            <div className="w-full md:w-64 bg-white/10 p-2 rounded-2xl border border-white/10 shrink-0">
              <div className="w-full bg-slate-800 rounded-xl h-4 overflow-hidden p-0.5 border border-white/20">
                <div 
                  className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-lg transition-all duration-1000 shadow-sm"
                  style={{ width: `${progressSummary.overall_progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {progressSummary.pending_modules && progressSummary.pending_modules.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-6 space-y-3">
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-widest flex items-center gap-2">
                <CalendarDays className="w-4 h-4" /> Modules en Attente de Finalisation ({progressSummary.pending_modules.length})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {progressSummary.pending_modules.slice(0, 6).map((pm: any) => (
                  <div key={pm.module_id} className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-blue-300">{pm.code}</span>
                      <h5 className="text-xs font-bold text-white truncate">{pm.name}</h5>
                      <p className="text-[10px] text-white/70 truncate">Prof: {pm.professors}</p>
                    </div>

                    <button
                      type="button"
                      disabled={sendingReminderId === pm.module_id}
                      onClick={() => handleSendReminder(pm.module_id)}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-wider shadow-sm transition-all shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {sendingReminderId === pm.module_id ? 'Envoi...' : '⏰ Relancer'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VOS MODULES AFFECTÉS — SAISIE DIRECTE 1-CLIC */}
      <div className="bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-2 border-indigo-200/90 dark:border-indigo-900/60 rounded-[2.5rem] p-6 md:p-10 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100 dark:border-indigo-900/40 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 rounded-full text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {isTeacherOnly ? `Affectations Officielles • Pr. ${user?.name || 'Enseignant'}` : 'Accès Direct Enseignant'}
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              Mes Modules Affectés (Saisie Directe)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Cliquez directement sur n'importe quel module ci-dessous pour ouvrir la grille de saisie sans aucune recherche.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span>Session active :</span>
            <span className={cn(
              "font-black uppercase tracking-wider px-2 py-0.5 rounded-lg text-[11px]",
              selectedSession === 'rattrapage' ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300" : "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
            )}>
              {selectedSession === 'rattrapage' ? '🔥 Rattrapage' : '⚡ Ordinaire'}
            </span>
          </div>
        </div>

        {/* Modules Cards Grid */}
        {loadingMyModules ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <span className="text-xs font-bold text-slate-400">Chargement de vos modules affectés...</span>
          </div>
        ) : myModules.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">Aucun module directement affecté à votre profil</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Si vous êtes enseignant sur un module et qu'il n'apparaît pas ici, vous pouvez utiliser le sélecteur ci-dessous ou contacter le service des emplois du temps.
            </p>
            <button
              type="button"
              onClick={() => setShowAdminCohortSelector(true)}
              className="mt-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
            >
              🔍 Ouvrir le sélecteur d'établissement
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myModules.map((m: any) => {
              const editUrl = `/admin/grades/edit?filiere_id=${m.filiere_id}&semester=${m.semester}&module_id=${m.id}&session=${selectedSession}`
              const pvUrl = `/admin/grades/pv?session=${selectedSession}&filiere_id=${m.filiere_id}&semester=${m.semester}&module_id=${m.id}`

              return (
                <div
                  key={m.id}
                  onClick={() => navigate(editUrl)}
                  className="group relative bg-white dark:bg-slate-800/90 border-2 border-slate-200/90 hover:border-indigo-600 dark:border-slate-700 dark:hover:border-indigo-400 rounded-3xl p-6 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1.5 cursor-pointer ring-0 hover:ring-4 hover:ring-indigo-500/10"
                >
                  <div className="space-y-3">
                    {/* Top Row: Filiere + Types */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {m.filiere_code} • S{m.semester}
                      </span>
                      <div className="flex items-center gap-1">
                        {m.types?.map((t: string) => (
                          <span key={t} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-mono text-[9px] font-black rounded-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Module Title */}
                    <div>
                      <span className="font-mono text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        {m.code}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mt-0.5">
                        {m.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                        {m.filiere_name}
                      </p>
                    </div>

                    {/* Schedule & Groups Details */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Groupes :</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[170px]">
                          {m.groups?.join(', ') || 'Section Amphi'}
                        </span>
                      </div>
                      {m.schedules_summary && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Séances :</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[170px]" title={m.schedules_summary}>
                            {m.schedules_summary}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Étudiants :</span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {m.students_count} inscrits
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Signature */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                        <span className="text-slate-400">Complétude des notes</span>
                        <span className={cn(
                          m.completion_rate === 100 ? "text-emerald-600" : m.completion_rate > 0 ? "text-amber-500" : "text-slate-400"
                        )}>
                          {m.completion_rate}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            m.completion_rate === 100 
                              ? "bg-emerald-500" 
                              : m.completion_rate > 0 
                                ? "bg-amber-500" 
                                : "bg-slate-300 dark:bg-slate-600"
                          )}
                          style={{ width: `${m.completion_rate}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] pt-1">
                        <span className="text-slate-400">Statut PV :</span>
                        <span className={cn(
                          "font-bold",
                          m.is_signed ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                        )}>
                          {m.is_signed ? `🛡️ Signé (${m.signed_by || 'Validé'})` : '⏳ En attente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(editUrl)
                      }}
                      className={cn(
                        "flex-1 py-3 px-4 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95",
                        selectedSession === 'rattrapage'
                          ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                          : "bg-gradient-to-r from-[#0f2863] to-[#1e40af] hover:from-[#15347d] hover:to-[#254cb6]"
                      )}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                      {selectedSession === 'rattrapage' ? 'Saisir Rattrapage' : 'Saisir les Notes'}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(pvUrl)
                      }}
                      className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-2xl transition-all cursor-pointer shadow-xs shrink-0"
                      title="Consulter le PV de ce module"
                    >
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Professor Collapsible Accordion Drawer for Global Cohort Selector */}
      {isTeacherOnly ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Mode Recherche Libre & Autres Filières (Optionnel)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Accédez au sélecteur global si vous souhaitez parcourir les modules d'une autre filière de l'établissement.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdminCohortSelector(prev => !prev)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
          >
            <span>{showAdminCohortSelector ? "Masquer le Sélecteur 4 Étapes" : "🔍 Ouvrir le Sélecteur Global (4 Étapes)"}</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", showAdminCohortSelector && "rotate-180")} />
          </button>
        </div>
      ) : (
        /* Quick Filière Chips Selection Bar (Admin Only) */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Raccourcis Rapides Filières ENCG
            </h4>
            <button
              type="button"
              onClick={() => setShowAdminCohortSelector(prev => !prev)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showAdminCohortSelector ? "Masquer le Sélecteur 4 Étapes" : "Afficher le Sélecteur 4 Étapes"}</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", showAdminCohortSelector && "rotate-180")} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {filieres.map(f => (
              <button
                key={f.id}
                onClick={() => {
                  setFiliere(String(f.id))
                  setShowAdminCohortSelector(true)
                }}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-2 shadow-xs",
                  String(filiere) === String(f.id)
                    ? "bg-[#0f2863] text-white border-[#0f2863] shadow-md scale-105"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                )}
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                {f.code || f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main 4-Step Selector Panel (Collapsible) */}
      {showAdminCohortSelector && (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-xl space-y-8 relative animate-in fade-in duration-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6 gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Target className="w-6 h-6 text-indigo-600" />
              Sélecteur de Cohorte & Matrice des Notes
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Choisissez d'abord la session (Ordinaire ou Rattrapage), puis suivez les 4 étapes.
            </p>
          </div>

          {/* Session Type Toggle */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setSelectedSession('normale')}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider",
                selectedSession === 'normale'
                  ? "bg-[#0f2863] text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              <Zap className="w-3.5 h-3.5 text-blue-300" />
              Session Ordinaire
            </button>
            <button
              type="button"
              onClick={() => setSelectedSession('rattrapage')}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider",
                selectedSession === 'rattrapage'
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Session Rattrapage
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Step 1: Filière */}
          <div className={cn(
            "p-6 rounded-3xl border transition-all space-y-3 relative z-20",
            filiere ? "bg-indigo-50/40 border-indigo-200 dark:bg-indigo-950/20" : "bg-slate-50 border-slate-200 dark:bg-slate-800/40"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-md transition-colors",
                  filiere ? "bg-[#0f2863] text-white" : "bg-slate-300 text-slate-700"
                )}>
                  1
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  {isRtl ? 'اختر الشعبة' : '1. Choisir la Filière'}
                </h3>
              </div>
              {filiere && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            </div>

            <CustomSelect
              value={filiere}
              onChange={setFiliere}
              options={filieres.map((f: any) => ({
                value: String(f.id),
                label: `${f.name} (${f.code || 'ENCG'})`,
                code: f.code || 'ENCG'
              }))}
              placeholder="-- Sélectionnez une filière ENCG --"
              icon={Building2}
            />
          </div>

          {/* Step 2: Semestre */}
          <div className={cn(
            "p-6 rounded-3xl border transition-all space-y-3 relative z-20",
            semestre ? "bg-indigo-50/40 border-indigo-200 dark:bg-indigo-950/20" : "bg-slate-50 border-slate-200 dark:bg-slate-800/40"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-md transition-colors",
                  semestre ? "bg-[#0f2863] text-white" : "bg-slate-300 text-slate-700"
                )}>
                  2
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  {isRtl ? 'اختر الدورة' : '2. Choisir le Semestre'}
                </h3>
              </div>
              {semestre && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            </div>

            <CustomSelect
              value={semestre}
              onChange={setSemestre}
              options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => ({
                value: String(s),
                label: `Semestre ${s}`,
                code: `S${s}`
              }))}
              placeholder="-- Tous les semestres (S1 - S10) --"
              icon={Layers}
            />
          </div>

          {/* Step 3: Groupe */}
          <div className={cn(
            "p-6 rounded-3xl border transition-all space-y-3 relative z-10",
            (!filiere || !semestre) && "opacity-40 pointer-events-none",
            groupe ? "bg-indigo-50/40 border-indigo-200 dark:bg-indigo-950/20" : "bg-slate-50 border-slate-200 dark:bg-slate-800/40"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-md transition-colors",
                  groupe ? "bg-[#0f2863] text-white" : "bg-slate-300 text-slate-700"
                )}>
                  3
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  {isRtl ? 'اختر الفوج (اختياري)' : '3. Choisir le Groupe (Optionnel)'}
                </h3>
              </div>
              {groupe && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            </div>

            <CustomSelect
              value={groupe}
              onChange={setGroupe}
              disabled={!filiere || !semestre}
              options={[
                { value: '', label: 'Tous les groupes (Facultatif)', code: 'ALL' },
                ...groupes.map((g: any) => ({
                  value: String(g.id),
                  label: g.name,
                  code: g.name
                }))
              ]}
              placeholder="Tous les groupes (Facultatif)"
              icon={Users}
            />
          </div>

          {/* Step 4: Module */}
          <div className={cn(
            "p-6 rounded-3xl border transition-all space-y-3 relative z-10",
            (!filiere || !semestre) && "opacity-40 pointer-events-none",
            module ? "bg-indigo-50/40 border-indigo-200 dark:bg-indigo-950/20" : "bg-slate-50 border-slate-200 dark:bg-slate-800/40"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-md transition-colors",
                  module ? "bg-[#0f2863] text-white" : "bg-slate-300 text-slate-700"
                )}>
                  4
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  {isRtl ? 'اختر الوحدة' : '4. Choisir le Module'}
                </h3>
              </div>
              {module && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            </div>

            <CustomSelect
              value={module}
              onChange={setModule}
              disabled={!filiere || !semestre}
              options={modules.map((m: any) => ({
                value: String(m.id),
                label: `${m.name} (${m.code || 'MOD'})`,
                code: m.code || 'MOD'
              }))}
              placeholder="-- Sélectionnez un module --"
              icon={BookOpen}
            />
          </div>

        </div>

        {/* Selection Confirmation Card (When Selection Complete) */}
        {isFormComplete && (
          <div className={cn(
            "p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300 border shadow-md",
            selectedSession === 'rattrapage'
              ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-300 dark:border-amber-800"
              : "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800"
          )}>
            <div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border inline-block mb-1",
                selectedSession === 'rattrapage'
                  ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200"
                  : "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200"
              )}>
                SÉLECTION CONFIRMÉE — SESSION {selectedSession === 'normale' ? 'ORDINAIRE (NORMALE)' : 'DE RATTRAPAGE'}
              </span>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                {selectedFiliereObj?.code || 'FILIÈRE'} — Semestre {semestre} — {selectedModuleObj?.name || 'Module'}
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/admin/grades/pv?session=${selectedSession}&filiere_id=${filiere}&semester=${semestre}&module_id=${module}`)}
                className="px-5 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-indigo-600" /> Consulter le PV ({selectedSession === 'normale' ? 'Ordinaire' : 'Rattrapage'})
              </button>

              {selectedSession === 'rattrapage' ? (
                <button
                  type="button"
                  onClick={() => navigate(`/admin/grades/pv?session=rattrapage&filiere_id=${filiere}&semester=${semestre}&module_id=${module}`)}
                  className="px-6 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" /> Accéder à la Saisie du Rattrapage <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenRegistry}
                  className="px-6 py-3.5 bg-gradient-to-r from-[#0f2863] to-[#1e40af] hover:from-[#15347d] hover:to-[#254cb6] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4 text-amber-300" /> Open Registre des Notes <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
      )}
    </div>
  )
}
