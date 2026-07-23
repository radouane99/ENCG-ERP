import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Target, 
  BarChart2, 
  FileText, 
  BookOpen, 
  Users, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  RefreshCw, 
  Zap, 
  Edit3, 
  CalendarDays,
  Award,
  ChevronDown,
  Check,
  Search
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { Spinner } from '@shared/components/ui/Spinner'

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
    <div className="relative w-full" ref={dropdownRef}>
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
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 space-y-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
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
  const { t, i18n } = useTranslation(['admin', 'common'])
  const isRtl = i18n.language === 'ar'
  
  const [filiere, setFiliere] = useState('')
  const [semestre, setSemestre] = useState('')
  const [groupe, setGroupe] = useState('')
  const [module, setModule] = useState('')
  const [filieres, setFilieres] = useState<any[]>([])
  const [groupes, setGroupes] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get('/filieres').then(r => {
      setFilieres(r.data.data || r.data)
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
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Système APOGÉE ENCG Maroc
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {isRtl ? 'المركز الإداري لتدقيق وإدخال النقاط' : 'Console de Gestion & Saisie des Notes'}
              </h1>
              <p className="text-blue-100/90 text-sm max-w-2xl font-medium mt-1">
                {isRtl ? 'حدد الشعبة، الدورة والوحدة للوصول المباشر لسجل النقاط الرسمي ومحاضر المداولات.' : 'Sélectionnez la filière, le semestre puis le module pour ouvrir le registre officiel des notes et générer les PVs.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => navigate('/admin/grades/pv')}
              className="flex items-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-wider backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <FileText className="w-4 h-4 text-amber-300" /> Consulter les PVs
            </button>
          </div>
        </div>
      </div>

      {/* Analytics KPI Row */}
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

      {/* Quick Filière Chips Selection Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md space-y-3">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" /> Raccourcis Rapides Filières ENCG
        </h4>
        <div className="flex flex-wrap items-center gap-2.5">
          {filieres.map(f => (
            <button
              key={f.id}
              onClick={() => setFiliere(String(f.id))}
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

      {/* Main 4-Step Selector Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-xl space-y-8 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Target className="w-6 h-6 text-indigo-600" />
              Sélecteur de Cohorte & Matrice des Notes
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Suivez les 4 étapes numérotées ci-dessous pour accéder au registre de saisie officiel.
            </p>
          </div>

          {isFormComplete && (
            <span className="px-4 py-1.5 bg-emerald-100 text-emerald-900 rounded-full text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Matrice Prête
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Step 1: Filière */}
          <div className={cn(
            "p-6 rounded-3xl border transition-all space-y-3 relative",
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
            "p-6 rounded-3xl border transition-all space-y-3 relative",
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
            "p-6 rounded-3xl border transition-all space-y-3 relative",
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
            "p-6 rounded-3xl border transition-all space-y-3 relative",
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
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-widest">SÉLECTION CONFIRMÉE</span>
              <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                {selectedFiliereObj?.code || 'FILIÈRE'} — Semestre {semestre} — {selectedModuleObj?.name || 'Module'}
              </h4>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/admin/grades/pv?filiere_id=${filiere}&semester=${semestre}&module_id=${module}${groupe ? `&group_id=${groupe}` : ''}`)}
                className="px-5 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-indigo-600" /> Consulter le PV
              </button>

              <button
                type="button"
                onClick={handleOpenRegistry}
                className="px-6 py-3.5 bg-gradient-to-r from-[#0f2863] to-[#1e40af] hover:from-[#15347d] hover:to-[#254cb6] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4 text-amber-300" /> Open Registre des Notes <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
