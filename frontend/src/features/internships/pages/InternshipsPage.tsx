import { useState } from 'react'
import { Search, Briefcase, MapPin, Calendar, Plus, AlertCircle } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { Spinner } from '@shared/components/ui/Spinner'

export default function InternshipsPage() { 
  const { t } = useTranslation('modules');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['internships-list'],
    queryFn: () => api.get('/admin/internships').then(res => res.data)
  });

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (isError || !data) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold">Erreur de chargement</h3>
        <p className="text-sm text-slate-500">Impossible de charger les stages.</p>
      </div>
    );
  }

  const internships = Array.isArray(data) ? data : (data.data || data.internships || []);

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('internships.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('internships.subtitle')}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 text-sm">
          <Plus className="w-4 h-4" /> {t('internships.new_btn')}
        </button>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-3 font-semibold">{t('internships.table.student')}</th>
              <th className="px-6 py-3 font-semibold">{t('internships.table.company')}</th>
              <th className="px-6 py-3 font-semibold">{t('internships.table.type')}</th>
              <th className="px-6 py-3 font-semibold text-center">{t('internships.table.status')}</th>
              <th className="px-6 py-3 font-semibold text-right">{t('internships.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {internships.map((i: any) => (
              <tr key={i.id} className="hover:bg-muted/50 group">
                <td className="px-6 py-4 font-bold">{i.student?.user?.first_name} {i.student?.user?.last_name}</td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2 font-medium"><Briefcase className="w-4 h-4 text-muted-foreground"/> {i.company_name}</div>
                   <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1"><MapPin className="w-3.5 h-3.5"/> {i.company_city}</div>
                </td>
                <td className="px-6 py-4 text-muted-foreground font-medium">{i.type || 'Stage'}</td>
                <td className="px-6 py-4 text-center">
                   <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", 
                     i.status === 'approved' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                     i.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' : 
                     'bg-amber-50 text-amber-600 border-amber-200')}>
                      {i.status === 'approved' ? t('internships.status.approved') : i.status === 'active' ? t('internships.status.active') : t('internships.status.pending')}
                   </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-medium border border-primary/20 transition-colors">
                    {t('internships.table.details')}
                  </button>
                </td>
              </tr>
            ))}
            {internships.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">Aucun stage trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
