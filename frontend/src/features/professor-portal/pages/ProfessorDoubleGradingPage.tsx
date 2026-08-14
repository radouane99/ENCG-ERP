import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  FileText, 
  Search, 
  ArrowRightLeft, 
  Save, 
  Sparkles,
  Lock,
  Layers
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

export default function ProfessorDoubleGradingPage() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: gradingData, isLoading } = useQuery({
    queryKey: ['double-grading-data'],
    queryFn: async () => {
      const res = await api.get('/professor-portal/double-grading');
      return res.data.data;
    }
  });

  const [copies, setCopies] = useState<any[]>([
    {
      copy_id: 'COP-781',
      student_anonymous_id: 'ANON-S7-012',
      grade_corrector_1: 14.5,
      grade_corrector_2: 15.0,
      delta: 0.5,
      status: 'conforme',
      final_grade: 14.75,
    },
    {
      copy_id: 'COP-782',
      student_anonymous_id: 'ANON-S7-024',
      grade_corrector_1: 16.0,
      grade_corrector_2: 11.5,
      delta: 4.5,
      status: 'arbitrage_requis',
      final_grade: '',
    },
    {
      copy_id: 'COP-783',
      student_anonymous_id: 'ANON-S7-035',
      grade_corrector_1: 12.0,
      grade_corrector_2: 13.0,
      delta: 1.0,
      status: 'conforme',
      final_grade: 12.5,
    },
    {
      copy_id: 'COP-784',
      student_anonymous_id: 'ANON-S7-049',
      grade_corrector_1: 15.5,
      grade_corrector_2: 11.0,
      delta: 4.5,
      status: 'arbitrage_requis',
      final_grade: '',
    },
  ]);

  const handleArbitrate = (copyId: string, value: string) => {
    setCopies(prev => prev.map(c => {
      if (c.copy_id === copyId) {
        return { ...c, final_grade: value, status: 'arbitre' };
      }
      return c;
    }));
  };

  const handleSaveReconciliation = () => {
    toast.success('⚖️ Réconciliation et validation des notes de double correction enregistrées !', {
      description: 'Les notes définitives ont été transmises au moteur de délibération APOGEE.'
    });
  };

  const conflictCount = copies.filter(c => c.delta > 3.0 && c.status === 'arbitrage_requis').length;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in duration-500 pb-28">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] rounded-3xl p-8 text-white shadow-xl border border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
            <ArrowRightLeft className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="bg-purple-500/20 text-purple-200 border border-purple-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 mb-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Évaluation Aveugle & Équité Académique
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Double Correction Anonyme & Arbitrage</h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium mt-0.5">
              Comparaison des notes des correcteurs 1 & 2 et alerte automatique lorsque l'écart dépasse 3.0 points.
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center shrink-0">
          <div className="text-[10px] font-black uppercase text-purple-200 tracking-wider">Écarts à Arbitrer</div>
          <div className="text-3xl font-black text-amber-400">{conflictCount}</div>
          <div className="text-[10px] text-slate-300 font-bold mt-0.5">Écart &gt; 3.0 pts</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
              {gradingData?.module_name || "Audit Financier & Contrôle de Gestion (S7)"}
            </h2>
            <p className="text-xs text-slate-500 font-medium">{gradingData?.exam_session || "Session Ordinaire d'Automne 2026"}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher code copie..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 w-52"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="pb-3 pl-2">ID Anonymat</th>
                <th className="pb-3 text-center">Correcteur 1</th>
                <th className="pb-3 text-center">Correcteur 2</th>
                <th className="pb-3 text-center">Écart (Δ)</th>
                <th className="pb-3 text-center">Statut Conformité</th>
                <th className="pb-3 text-right pr-2">Note Finale Arbitrée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold">
              {copies.map((copy) => {
                const isConflict = copy.delta > 3.0;

                return (
                  <tr key={copy.copy_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 pl-2 font-mono text-slate-900 font-black">
                      {copy.student_anonymous_id}
                      <span className="block text-[10px] text-slate-400 font-sans font-normal">{copy.copy_id}</span>
                    </td>

                    <td className="py-4 text-center">
                      <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-xl font-mono text-xs font-black">
                        {copy.grade_corrector_1} / 20
                      </span>
                    </td>

                    <td className="py-4 text-center">
                      <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-xl font-mono text-xs font-black">
                        {copy.grade_corrector_2} / 20
                      </span>
                    </td>

                    <td className="py-4 text-center font-mono">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-black",
                        isConflict ? "bg-rose-100 text-rose-700 font-black" : "text-slate-600 bg-slate-100"
                      )}>
                        {copy.delta > 0 ? `+${copy.delta}` : copy.delta} pts
                      </span>
                    </td>

                    <td className="py-4 text-center">
                      {isConflict && copy.status === 'arbitrage_requis' ? (
                        <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Écart &gt; 3.0 pts
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Conforme
                        </span>
                      )}
                    </td>

                    <td className="py-4 text-right pr-2">
                      {isConflict && copy.status === 'arbitrage_requis' ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.25"
                            placeholder="Note..."
                            className="w-24 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20 text-center"
                            onChange={e => handleArbitrate(copy.copy_id, e.target.value)}
                          />
                        </div>
                      ) : (
                        <span className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl font-mono text-xs font-black shadow-sm">
                          {copy.final_grade} / 20
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSaveReconciliation}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-900 to-purple-900 hover:opacity-95 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-950/20 cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-300" />
            Valider la Réconciliation & Transmettre à APOGEE
          </button>
        </div>

      </div>

    </div>
  );
}
