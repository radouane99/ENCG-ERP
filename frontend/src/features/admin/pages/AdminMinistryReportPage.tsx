import React, { useState } from 'react'
import {
  BarChart3, Download, Loader2, RefreshCw, Sparkles, FileText, Users, GraduationCap,
  TrendingUp, BookOpen, PlaneTakeoff, CheckCircle2, AlertTriangle, Building2, Globe
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { toast } from 'sonner'

export default function AdminMinistryReportPage() {
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ministry-report'],
    queryFn: async () => {
      const res = await api.get('/admin/ministry-report')
      return res.data
    }
  })

  const handleExportPDF = async () => {
    setIsExporting(true)
    await new Promise(r => setTimeout(r, 800))
    // Trigger browser print for PDF export
    window.print()
    setIsExporting(false)
    toast.success('Rapport MESRSFC prêt à l\'impression / export PDF !')
  }

  const handleExportCSV = () => {
    if (!data) return
    const rows = [
      ['Indicateur', 'Valeur'],
      ['Année Académique', data.academic_year],
      ['Total Étudiants', data.effectifs?.total_inscrits],
      ['Femmes', data.effectifs?.femmes],
      ['Hommes', data.effectifs?.hommes],
      ['Taux Féminisation (%)', data.effectifs?.taux_feminisation],
      ['Taux de Réussite (%)', data.pedagogie?.taux_reussite],
      ['Total Modules', data.pedagogie?.total_modules],
      ['Total Professeurs', data.pedagogie?.total_professeurs],
      ['Vacataires', data.pedagogie?.vacataires],
      ['Ratio Étudiants/Prof', data.pedagogie?.ratio_etudiants_prof],
      ['PFE Soumis', data.stages_pfe?.total_soumis],
      ['PFE Validés', data.stages_pfe?.total_valides],
      ['Taux Validation PFE (%)', data.stages_pfe?.taux_validation],
      ['Mobilité Internationale', data.mobilite_internationale?.etudiants_sortants],
      ['Demandes Documents', data.vie_administrative?.demandes_documents_total],
      ['Docs Délivrés', data.vie_administrative?.demandes_delivrees],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Rapport_MESRSFC_${new Date().getFullYear()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    toast.success('Export CSV MESRSFC téléchargé !')
  }

  const StatCard = ({ icon: Icon, label, value, sub, color = 'indigo' }: any) => (
    <div className={cn(
      'bg-white dark:bg-slate-900 rounded-[2rem] p-6 border shadow-sm',
      color === 'emerald' ? 'border-emerald-200 dark:border-emerald-900/50' :
        color === 'rose' ? 'border-rose-200 dark:border-rose-900/50' :
          color === 'amber' ? 'border-amber-200 dark:border-amber-900/50' :
            'border-slate-200 dark:border-slate-800'
    )}>
      <div className={cn(
        'w-12 h-12 rounded-2xl flex items-center justify-center mb-4',
        color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-950/40' :
          color === 'rose' ? 'bg-rose-50 dark:bg-rose-950/40' :
            color === 'amber' ? 'bg-amber-50 dark:bg-amber-950/40' :
              'bg-indigo-50 dark:bg-indigo-950/40'
      )}>
        <Icon className={cn('w-6 h-6',
          color === 'emerald' ? 'text-emerald-600' :
            color === 'rose' ? 'text-rose-500' :
              color === 'amber' ? 'text-amber-600' :
                'text-indigo-600'
        )} />
      </div>
      <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{value ?? '—'}</div>
      <div className="font-black text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">{label}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{sub}</div>}
    </div>
  )

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in pb-24 print:p-4">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 print:rounded-xl print:shadow-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl shrink-0">
              <FileText className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-emerald-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> 100% Données Réelles Base de Données
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Rapport Ministère MESRSFC
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1">
                Statistiques annuelles officielles de l'ENCG Fès — Ministère de l'Enseignement Supérieur
              </p>
              {data && (
                <p className="text-blue-300 text-[10px] font-bold mt-1">
                  Année académique : {data.academic_year} | Généré le {new Date(data.generated_at).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0 print:hidden">
            <button
              onClick={() => { refetch(); toast.success('Données actualisées !') }}
              disabled={isFetching}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} /> Actualiser
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-500/30 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <Download className="w-4 h-4" /> {isExporting ? 'Export...' : 'Export PDF'}
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : !data?.success ? (
        <div className="p-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
          <p className="font-bold">Impossible de charger les données du rapport.</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Effectifs */}
          <section>
            <h2 className="flex items-center gap-3 font-black text-lg text-slate-900 dark:text-white mb-4">
              <Users className="w-5 h-5 text-indigo-600" /> 1. Effectifs Étudiants
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Inscrits" value={data.effectifs?.total_inscrits} color="indigo" />
              <StatCard icon={Users} label="Femmes" value={data.effectifs?.femmes} sub={`${data.effectifs?.taux_feminisation}% de féminisation`} color="rose" />
              <StatCard icon={Users} label="Hommes" value={data.effectifs?.hommes} color="indigo" />
              <StatCard icon={TrendingUp} label="Taux Féminisation" value={`${data.effectifs?.taux_feminisation}%`} color="emerald" />
            </div>

            {data.effectifs?.par_filiere?.length > 0 && (
              <div className="mt-4 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">Répartition par Filière</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.effectifs.par_filiere.map((f: any, i: number) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3">
                      <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{f.filiere}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${Math.min(100, (f.count / (data.effectifs?.total_inscrits || 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="font-black text-sm text-indigo-600 w-10 text-right">{f.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Pédagogie */}
          <section>
            <h2 className="flex items-center gap-3 font-black text-lg text-slate-900 dark:text-white mb-4">
              <GraduationCap className="w-5 h-5 text-emerald-600" /> 2. Indicateurs Pédagogiques
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard icon={TrendingUp} label="Taux de Réussite" value={`${data.pedagogie?.taux_reussite}%`} color="emerald" />
              <StatCard icon={BookOpen} label="Total Modules" value={data.pedagogie?.total_modules} color="indigo" />
              <StatCard icon={Users} label="Professeurs Permanents" value={data.pedagogie?.total_professeurs} color="indigo" />
              <StatCard icon={Users} label="Vacataires" value={data.pedagogie?.vacataires} color="amber" />
              <StatCard icon={BarChart3} label="Ratio Étud./Prof." value={data.pedagogie?.ratio_etudiants_prof} color="indigo" />
            </div>
          </section>

          {/* Stages & PFE */}
          <section>
            <h2 className="flex items-center gap-3 font-black text-lg text-slate-900 dark:text-white mb-4">
              <CheckCircle2 className="w-5 h-5 text-purple-600" /> 3. Stages & PFE
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard icon={FileText} label="PFE Soumis" value={data.stages_pfe?.total_soumis} color="indigo" />
              <StatCard icon={CheckCircle2} label="PFE Validés" value={data.stages_pfe?.total_valides} color="emerald" />
              <StatCard icon={TrendingUp} label="Taux de Validation" value={`${data.stages_pfe?.taux_validation}%`} color="emerald" />
            </div>
          </section>

          {/* Mobilité & Vie Administrative */}
          <div className="grid md:grid-cols-2 gap-6">
            <section>
              <h2 className="flex items-center gap-3 font-black text-lg text-slate-900 dark:text-white mb-4">
                <Globe className="w-5 h-5 text-sky-600" /> 4. Mobilité Internationale
              </h2>
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-sky-200 dark:border-sky-900/40 p-6 text-center">
                <PlaneTakeoff className="w-10 h-10 text-sky-500 mx-auto mb-2" />
                <div className="text-4xl font-black text-sky-600 dark:text-sky-400 font-mono">{data.mobilite_internationale?.etudiants_sortants}</div>
                <div className="text-xs font-black uppercase tracking-wider text-slate-500 mt-1">Étudiants Sortants Approuvés</div>
              </div>
            </section>

            <section>
              <h2 className="flex items-center gap-3 font-black text-lg text-slate-900 dark:text-white mb-4">
                <Building2 className="w-5 h-5 text-amber-600" /> 5. Vie Administrative
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={FileText} label="Demandes Docs" value={data.vie_administrative?.demandes_documents_total} color="amber" />
                <StatCard icon={CheckCircle2} label="Docs Délivrés" value={`${data.vie_administrative?.taux_delivrance}%`} color="emerald" />
                <StatCard icon={AlertTriangle} label="Total Absences" value={data.vie_administrative?.absences_total} color="rose" />
                <StatCard icon={CheckCircle2} label="Absences Justifiées" value={`${data.vie_administrative?.taux_justification}%`} color="emerald" />
              </div>
            </section>
          </div>

          {/* Mention officielle */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] text-center text-xs text-slate-500 font-medium">
            📋 Rapport officiel ENCG Fès — {data.institution?.name} — {data.institution?.tutelle}
            <br />
            Généré automatiquement depuis la base de données ERP le {new Date(data?.generated_at).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      )}
    </div>
  )
}
