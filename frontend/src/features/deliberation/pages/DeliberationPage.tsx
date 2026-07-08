import { useState } from 'react'
import { Search, Calculator, CheckCircle2, AlertTriangle, Users } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { useTranslation } from 'react-i18next'

export default function DeliberationPage() {
  const { t } = useTranslation('deliberation')
  const [sessions] = useState([
    { id: 1, name: 'Délibération S3 - Automne 2025', date: '2026-02-15', status: 'completed', students: 120, success_rate: 85 },
    { id: 2, name: 'Délibération S4 - Printemps 2026', date: '2026-06-30', status: 'pending', students: 118, success_rate: null },
  ])

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('subtitle')}</p>
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
            {sessions.map(s => (
              <tr key={s.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 font-bold">{s.name}</td>
                <td className="px-6 py-4 text-muted-foreground">{s.date}</td>
                <td className="px-6 py-4 text-center font-medium"><div className="flex items-center justify-center gap-1"><Users className="w-4 h-4 text-muted-foreground"/>{s.students}</div></td>
                <td className="px-6 py-4 text-center font-bold">
                  {s.success_rate ? <span className="text-green-600">{s.success_rate}%</span> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-6 py-4 text-center">
                   <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", s.status === 'completed' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200')}>
                      {t(`status.${s.status}`)}
                   </span>
                </td>
                <td className="px-6 py-4 text-end">
                  <button className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-medium border border-primary/20 transition-colors flex items-center gap-2 ms-auto">
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
