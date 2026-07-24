import { useState } from 'react'
import { Search, Calculator, CheckCircle2, AlertTriangle, Users } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@shared/lib/api'
import { Spinner } from '@shared/components/ui/Spinner'

export default function DeliberationPage() {
  const { t } = useTranslation('deliberation')
  const navigate = useNavigate()
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['deliberations'],
    queryFn: async () => {
      const res = await api.get('/admin/academic/deliberations');
      return res.data.data;
    }
  });

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/academic/deliberations')}
            className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all hover:bg-indigo-100 flex items-center gap-2"
          >
            <Calculator className="w-4 h-4 text-indigo-600" />
            Moteur APOGEE & Verrouillage
          </button>

          <button
            onClick={() => navigate('/academic/deliberations')}
            className="px-5 py-2.5 bg-gradient-to-r from-[#0f2863] to-[#1e40af] hover:from-[#15347d] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-amber-300" />
            Lancer une Délibération
          </button>
        </div>
      </div>


      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-3 font-semibold">{t('columns.session')}</th>
              <th className="px-6 py-3 font-semibold">{t('columns.date')}</th>
              <th className="px-6 py-3 font-semibold text-center">{t('columns.students')}</th>
              <th className="px-6 py-3 font-semibold text-center">{t('columns.success_rate')}</th>
              <th className="px-6 py-3 font-semibold text-center">{t('columns.status')}</th>
              <th className="px-6 py-3 font-semibold text-end">{t('columns.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex justify-center"><Spinner className="w-6 h-6 text-primary" /></div>
                </td>
              </tr>
            ) : (!sessions || sessions.length === 0) ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <Calculator className="w-12 h-12 text-indigo-500 mx-auto" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Aucune session de délibération en cours</h3>
                    <p className="text-xs text-slate-500">
                      Lancez le moteur de délibération semestrielle pour calculer automatiquement les compensations, moyennes et procès-verbaux d'évaluation.
                    </p>
                    <button
                      onClick={() => navigate('/academic/deliberations')}
                      className="mt-2 px-5 py-2.5 bg-[#0f2863] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#15347d] transition-all inline-flex items-center gap-2"
                    >
                      <Calculator className="w-4 h-4 text-amber-300" />
                      Lancer la Délibération Semestrielle
                    </button>
                  </div>
                </td>
              </tr>
            ) : sessions.map((s: any) => (
              <tr key={s.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 font-bold">{s.name}</td>
                <td className="px-6 py-4 text-muted-foreground">{s.date}</td>
                <td className="px-6 py-4 text-center font-medium"><div className="flex items-center justify-center gap-1"><Users className="w-4 h-4 text-muted-foreground"/>{s.students}</div></td>
                <td className="px-6 py-4 text-center font-bold">
                  {s.success_rate ? <span className="text-green-600">{s.success_rate}%</span> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-6 py-4 text-center">
                   <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", s.status === 'completed' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200')}>
                      {t(`status.${s.status || 'pending'}`)}
                   </span>
                </td>
                <td className="px-6 py-4 text-end">
                  <button 
                    onClick={() => navigate(`/exams/deliberations/${s.id}/jury`)}
                    className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-medium border border-primary/20 transition-colors flex items-center gap-2 ms-auto"
                  >
                    <Calculator className="w-3.5 h-3.5"/> {t('open_jury')}
                  </button>
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>
    </div>
  )
}
