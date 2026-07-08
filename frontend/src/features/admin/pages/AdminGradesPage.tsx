import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Target, BarChart2, Folder, FileText, ArrowRight, BookOpen, Users, Building, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { Button } from '@shared/components/ui/Button'
import { Spinner } from '@shared/components/ui/Spinner'

export default function AdminGradesPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation(['admin', 'common'])
  const isRtl = i18n.language === 'ar'
  
  const [filiere, setFiliere] = useState('')
  const [groupe, setGroupe] = useState('')
  const [module, setModule] = useState('')
  const [filieres, setFilieres] = useState<any[]>([])
  const [groupes, setGroupes] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get('/academic/filieres').then(r => {
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
      api.get('/academic/groups', { params: { filiere_id: filiere } })
        .then(r => setGroupes(r.data.data || r.data)).catch(console.error)
    }
  }, [filiere])

  useEffect(() => {
    if (groupe) {
      setModule('')
      setModules([])
      api.get('/academic/modules', { params: { group_id: groupe } })
        .then(r => setModules(r.data.data || r.data)).catch(console.error)
    }
  }, [groupe])

  const isFormComplete = filiere !== '' && groupe !== '' && module !== ''

  const handleOpenRegistry = () => {
    if (isFormComplete) {
      navigate(`/admin/grades/edit?group_id=${groupe}&module_id=${module}`)
    }
  }

  const selectClasses = "w-full rounded-2xl border bg-[hsl(var(--background))] px-12 py-4 text-sm font-bold transition-all outline-none appearance-none bg-no-repeat cursor-pointer focus:ring-2"
  const getSelectStyle = (hasValue: boolean) => cn(
    selectClasses,
    hasValue 
      ? "border-[hsl(var(--color-primary))/30] bg-[hsl(var(--color-primary))/5] text-[hsl(var(--foreground))] focus:border-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))/20]" 
      : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border-hover))] focus:border-[hsl(var(--ring))] focus:ring-[hsl(var(--ring))/20]"
  )

  const bgImageSVG = "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\")"

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-8 animate-in p-4 md:p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">{t('admin:grades.title')}</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">{t('admin:grades.subtitle')}</p>
        </div>
      </div>

      {/* Console Banner */}
      <div className="bg-gradient-to-r from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] p-8 text-white rounded-3xl shadow-xl shadow-[hsl(var(--color-primary))/10] relative overflow-hidden">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl mix-blend-overlay"></div>
        <h2 className="text-2xl font-bold mb-3 flex items-center gap-3 relative z-10">
          <Target className="w-7 h-7 text-white/90" />
          {t('admin:grades.selector_title')}
        </h2>
        <p className="text-white/80 text-sm font-medium leading-relaxed max-w-2xl relative z-10">
          {t('admin:grades.selector_desc')}
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl shadow-sm p-6 md:p-10 space-y-10">
        
        {/* Step 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--color-primary))] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">1</div>
            <h3 className="text-xs font-bold text-[hsl(var(--color-primary))] uppercase tracking-wider">{t('admin:grades.steps.filiere')}</h3>
          </div>
          <div className="relative ps-11">
            <Building className={cn("w-5 h-5 absolute start-14 top-1/2 -translate-y-1/2 transition-colors", filiere ? "text-[hsl(var(--color-primary))]" : "text-[hsl(var(--muted-foreground))]")} />
            <select 
              value={filiere}
              onChange={(e) => setFiliere(e.target.value)}
              className={getSelectStyle(filiere !== '')}
              style={{ backgroundImage: bgImageSVG, backgroundSize: '0.65em auto', backgroundPosition: isRtl ? 'left 1.5rem center' : 'right 1.5rem center' }}
            >
              <option value="">{t('admin:grades.steps.filiere_empty')}</option>
              {filieres.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[hsl(var(--border))]">
          {/* Step 2 */}
          <div className={cn("space-y-4 transition-all duration-300", !filiere && "opacity-40 grayscale pointer-events-none")}>
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm transition-colors", filiere ? "bg-[hsl(var(--color-primary))]" : "bg-[hsl(var(--muted-foreground))]")}>2</div>
              <h3 className={cn("text-xs font-bold uppercase tracking-wider transition-colors", filiere ? "text-[hsl(var(--color-primary))]" : "text-[hsl(var(--muted-foreground))]")}>{t('admin:grades.steps.groupe')}</h3>
            </div>
            <div className="relative ps-11">
              <Users className={cn("w-5 h-5 absolute start-14 top-1/2 -translate-y-1/2 transition-colors", groupe ? "text-[hsl(var(--color-primary))]" : "text-[hsl(var(--muted-foreground))]")} />
              <select 
                value={groupe}
                onChange={(e) => setGroupe(e.target.value)}
                disabled={!filiere}
                className={getSelectStyle(groupe !== '')}
                style={{ backgroundImage: bgImageSVG, backgroundSize: '0.65em auto', backgroundPosition: isRtl ? 'left 1.5rem center' : 'right 1.5rem center' }}
              >
                <option value="">{t('admin:grades.steps.groupe_empty')}</option>
                {groupes.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 3 */}
          <div className={cn("space-y-4 transition-all duration-300", !groupe && "opacity-40 grayscale pointer-events-none")}>
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm transition-colors", groupe ? "bg-[hsl(var(--color-primary))]" : "bg-[hsl(var(--muted-foreground))]")}>3</div>
              <h3 className={cn("text-xs font-bold uppercase tracking-wider transition-colors", groupe ? "text-[hsl(var(--color-primary))]" : "text-[hsl(var(--muted-foreground))]")}>{t('admin:grades.steps.module')}</h3>
            </div>
            <div className="relative ps-11">
              <BookOpen className={cn("w-5 h-5 absolute start-14 top-1/2 -translate-y-1/2 transition-colors", module ? "text-[hsl(var(--color-primary))]" : "text-[hsl(var(--muted-foreground))]")} />
              <select 
                value={module}
                onChange={(e) => setModule(e.target.value)}
                disabled={!groupe}
                className={getSelectStyle(module !== '')}
                style={{ backgroundImage: bgImageSVG, backgroundSize: '0.65em auto', backgroundPosition: isRtl ? 'left 1.5rem center' : 'right 1.5rem center' }}
              >
                <option value="">{t('admin:grades.steps.groupe_empty')}</option>
                {modules.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-8 border-t border-[hsl(var(--border))] flex justify-end">
          <Button
            size="lg"
            variant={isFormComplete ? 'primary' : 'outline'}
            disabled={!isFormComplete}
            onClick={handleOpenRegistry}
            className={cn("px-8 py-6 text-base font-bold shadow-lg transition-all", isFormComplete ? "hover:scale-105" : "")}
            icon={isRtl ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
          >
            {t('admin:grades.open_registry')}
          </Button>
        </div>

      </div>
    </div>
  )
}
