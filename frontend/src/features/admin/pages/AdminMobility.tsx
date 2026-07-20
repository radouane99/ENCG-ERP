import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlaneTakeoff, Settings2, Users, Download, Medal, CheckCircle2, FileText, ChevronRight } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function AdminMobility() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const isRtl = i18n.language === 'ar';

  const ranking = [
    { rank: 1, name: isRtl ? 'آية ر.' : 'Aya R.', gpa: '16.42', voeux: ['KEDGE Business School', 'NEOMA Business School'], assigned: 'KEDGE Business School', status: 'VALIDATED' },
    { rank: 2, name: isRtl ? 'عثمان ب.' : 'Othmane B.', gpa: '15.80', voeux: ['Université Laval', 'KEDGE Business School'], assigned: 'Université Laval', status: 'VALIDATED' },
    { rank: 3, name: isRtl ? 'صوفيا م.' : 'Sofia M.', gpa: '14.95', voeux: ['KEDGE Business School', 'Kyung Hee University'], assigned: 'Kyung Hee University', status: 'VALIDATED' },
    { rank: 4, name: isRtl ? 'كريم ل.' : 'Karim L.', gpa: '14.10', voeux: ['KEDGE Business School', 'NEOMA Business School'], assigned: 'NEOMA Business School', status: 'PENDING_VISA' },
    { rank: 5, name: isRtl ? 'يوسف ب.' : 'Youssef B.', gpa: '13.50', voeux: ['Université Laval', 'Kyung Hee University'], assigned: null, status: 'WAITLIST' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-[#001A4B] rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-blue-900">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 translate-x-1/4"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-purple-500/30">
              <PlaneTakeoff className="w-3.5 h-3.5" /> Relations Internationales
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Affectation Mobilité</h1>
            <p className="text-blue-200 text-lg max-w-2xl">
              Gérez les quotas des partenaires étrangers et exécutez l'algorithme d'affectation au mérite.
            </p>
          </div>
          <div className="shrink-0 flex gap-3">
            <button className="bg-white/10 text-white border border-white/20 px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors shadow-lg flex items-center gap-2">
              <Settings2 className="w-5 h-5" /> Configurer Quotas
            </button>
            <button className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg flex items-center gap-2">
              <Medal className="w-5 h-5" /> Lancer Algorithme
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/5">
          <div className="text-sm font-bold text-white/50 mb-1">Dossiers Reçus</div>
          <div className="text-3xl font-black text-white mb-2">142</div>
          <div className="text-xs font-bold text-blue-600 bg-blue-50 w-max px-2 py-0.5 rounded">Promo S7</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/5">
          <div className="text-sm font-bold text-white/50 mb-1">Places Disponibles</div>
          <div className="text-3xl font-black text-[#003a8c] mb-2">45</div>
          <div className="text-xs font-bold text-emerald-600 bg-emerald-50 w-max px-2 py-0.5 rounded">12 Partenaires</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/5">
          <div className="text-sm font-bold text-white/50 mb-1">Taux de Satisfaction</div>
          <div className="text-3xl font-black text-emerald-600 mb-2">92%</div>
          <div className="text-xs font-bold text-white/50 uppercase tracking-widest">VÅ“u 1 ou 2</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/5">
          <div className="text-sm font-bold text-white/50 mb-1">Sur Liste d'Attente</div>
          <div className="text-3xl font-black text-rose-500 mb-2">18</div>
          <div className="text-xs font-bold text-rose-600 bg-rose-50 w-max px-2 py-0.5 rounded">Dossiers conformes</div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-black text-white">Classement & Affectations</h2>
            <p className="text-sm text-white/50">Généré le 16 Avril 2026</p>
          </div>
          <button className="text-sm font-bold text-white/70 bg-white/[0.05] px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Exporter Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]/50">
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest rounded-tl-xl">Rang</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Étudiant</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Moyenne (S1-S6)</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">VÅ“ux</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Affectation</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest rounded-tr-xl">Statut</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((student, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-black flex items-center justify-center">
                      {student.rank}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-white">{student.name}</td>
                  <td className="p-4 font-black text-[#003a8c]">{student.gpa}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {student.voeux.map((v, idx) => (
                        <div key={idx} className="text-xs text-white/70 truncate max-w-[200px]">
                          <span className="text-gray-400 mr-1">{idx + 1}.</span>{v}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    {student.assigned ? (
                      <div className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 text-sm flex items-center gap-2 w-max">
                        <CheckCircle2 className="w-4 h-4" /> {student.assigned}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm italic">Aucune place dispo.</div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                      student.status === 'VALIDATED' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      student.status === 'PENDING_VISA' ? "bg-amber-50 text-amber-600 border-amber-200" :
                      "bg-rose-50 text-rose-600 border-rose-200"
                    )}>
                      {student.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
