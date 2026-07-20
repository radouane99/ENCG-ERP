import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, FlaskConical, Download, AlertCircle } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';

export default function StudentGrades() {
  const { t, i18n } = useTranslation(['students', 'common']);
  const isRtl = i18n.language === 'ar';
  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-grades'],
    queryFn: () => api.get('/student-portal/grades').then(res => res.data)
  });

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (isError || !data) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold">Impossible de charger les notes</h3>
        <p className="text-sm text-slate-500">Une erreur est survenue lors de la récupération de vos notes.</p>
      </div>
    );
  }

  // Assuming data structure based on the typical response
  const grades = data.data || data;
  const overallAvg = data.overall_average || 0; // or calculate if needed

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-[#0f766e] rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-lg border border-teal-600/50">
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white mb-2">Performance Académique</h1>
          <p className="text-teal-100">Suivez vos notes validées et vos résultats finaux par semestre.</p>
          <div className="flex gap-3 mt-6">
            <button className="bg-white text-teal-800 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 hover:bg-teal-50 transition-colors">
              <FlaskConical className="w-4 h-4" /> ACTIVER LE SIMULATEUR
            </button>
            <button 
              onClick={() => {
                import('@shared/lib/api').then(({ default: api }) => {
                  import('sonner').then(({ toast }) => {
                    const tid = toast.loading('Génération du relevé en cours...')
                    api.get('/student-portal/transcript/pdf', { responseType: 'blob' })
                      .then(res => {
                        const url = window.URL.createObjectURL(new Blob([res.data]))
                        const link = document.createElement('a')
                        link.href = url
                        link.setAttribute('download', 'Releve_Notes.pdf')
                        document.body.appendChild(link)
                        link.click()
                        link.remove()
                        toast.success('Relevé téléchargé avec succès !', { id: tid })
                      })
                      .catch(() => toast.error('Erreur lors du téléchargement.', { id: tid }))
                  })
                })
              }}
              className="bg-teal-800 text-teal-50 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 hover:bg-teal-900 border border-teal-700 transition-colors"
            >
              <Download className="w-4 h-4" /> RELEVÉ OFFICIEL (PDF)
            </button>
          </div>
        </div>

        <div className="relative z-10 text-right">
          <div className="text-xs font-bold text-teal-200 uppercase tracking-widest mb-1">MOYENNE ANNUELLE</div>
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-6xl font-black text-white">{Number(overallAvg).toFixed(2)}</span>
            <span className="text-2xl font-bold text-teal-200">/ 20</span>
          </div>
          {overallAvg >= 10 && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-teal-800/40 border border-teal-500/50 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
              ANNÉE VALIDÉE <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <h2 className="text-2xl font-black text-[#001A4B]">Mes Notes</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-slate-100">
                <th className="pb-4 pl-4 w-1/3">MODULE</th>
                <th className="pb-4 text-center">NOTE FINALE</th>
                <th className="pb-4 text-right pr-4">STATUT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {grades.map((grade: any, idx: number) => {
                const total = grade.moyenne_finale || grade.moyenne_normale || 0;
                const decision = grade.decision_finale || grade.decision_normale || 'N/A';
                const isValidated = decision === 'V' || decision === 'VAR';
                
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-5 pl-4">
                      <div className="font-bold text-[#001A4B]">{grade.module_name || grade.module?.name}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">{grade.module_code || grade.module?.code}</div>
                    </td>
                    <td className="py-5 text-center font-black text-[#001A4B] text-lg">{Number(total).toFixed(2)}</td>
                    <td className="py-5 text-right pr-4">
                      <div className="flex justify-end mt-1">
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1",
                          isValidated ? "bg-emerald-50 text-emerald-600" : (decision === 'R' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600")
                        )}>
                          {isValidated ? 'VALIDÉ' : (decision === 'R' ? 'RATTRAPAGE' : 'NON VALIDÉ')} {isValidated && <CheckCircle2 className="w-3 h-3" />}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {grades.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500 font-medium">Aucune note n'est disponible pour le moment.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

