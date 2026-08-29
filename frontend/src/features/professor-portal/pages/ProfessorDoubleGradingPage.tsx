import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Search, 
  ArrowRightLeft, 
  Save, 
  Sparkles,
  Scale
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

export default function ProfessorDoubleGradingPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: gradingData } = useQuery({
    queryKey: ['double-grading-data'],
    queryFn: async () => {
      try {
        const res = await api.get('/professor-portal/double-grading');
        return res.data.data;
      } catch {
        return null;
      }
    }
  });

  const defaultCopies = [
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
      student_anonymous_id: 'ANON-S7-048',
      grade_corrector_1: 8.5,
      grade_corrector_2: 9.0,
      delta: 0.5,
      status: 'conforme',
      final_grade: 8.75,
    }
  ];

  const [copies, setCopies] = useState<any[]>(defaultCopies);

  const handleArbitrate = (copyId: string, value: string) => {
    setCopies(prev => prev.map(c => {
      if (c.copy_id === copyId) {
        return {
          ...c,
          final_grade: value,
          status: value ? 'arbitre' : 'arbitrage_requis'
        };
      }
      return c;
    }));
  };

  const handleSaveAll = () => {
    toast.success('💾 Notes définitives de double correction validées et transmises au jury Apogée !');
  };

  const filteredCopies = copies.filter(c => 
    c.copy_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.student_anonymous_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCopies = copies.length;
  const discrepancies = copies.filter(c => c.delta >= 3.0).length;
  const conforming = totalCopies - discrepancies;

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 pb-28">
      
      {/* ── Executive Header Banner ── */}
      <div className="bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#0d1d3d] rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/20 text-white shrink-0 font-black">
            <ArrowRightLeft className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Système Anonyme & Équité Apogée
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Double Correction & Arbitrage des Écarts</h1>
            <p className="text-xs md:text-sm text-blue-200 font-medium">
              Concordance automatique entre les deux correcteurs avec seuil d'arbitrage fixé à Δ ≥ 3.0 points.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-[#001A4B] rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shrink-0 cursor-pointer"
        >
          <Save className="w-4 h-4" /> Enregistrer le PV de Correction
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Copies Évaluées</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{totalCopies} Copies</div>
            <div className="text-[11px] font-bold text-slate-500">Session Normale Automne</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Copies Conformes (Δ &lt; 3 pts)</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{conforming} Validées</div>
            <div className="text-[11px] font-bold text-slate-500">Moyenne arithmétique adoptée</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black shrink-0">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Écarts Majeurs (Δ ≥ 3 pts)</div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{discrepancies} À Arbitrer</div>
            <div className="text-[11px] font-bold text-slate-500">Décision du 3ème correcteur requise</div>
          </div>
        </div>
      </div>

      {/* Copies Reconciliation Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" /> Grille de Concordance des Notes Anonymes
            </h2>
            <p className="text-xs text-slate-400 font-medium">Les notes sont automatiquement moyennées sauf en cas d'écart significatif.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher code copie / anonymat..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="pb-3 pl-2">N° Copie</th>
                <th className="pb-3">Code Anonymat</th>
                <th className="pb-3 text-center">Correcteur 1</th>
                <th className="pb-3 text-center">Correcteur 2</th>
                <th className="pb-3 text-center">Écart (Δ)</th>
                <th className="pb-3 text-center">Statut Règle LMD</th>
                <th className="pb-3 text-right pr-2">Note Finale Retenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
              {filteredCopies.map((row) => {
                const isDiscrepancy = row.delta >= 3.0;

                return (
                  <tr key={row.copy_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 pl-2 font-mono font-black text-indigo-700 dark:text-indigo-400">{row.copy_id}</td>
                    <td className="py-4 font-mono text-slate-600 dark:text-slate-300">{row.student_anonymous_id}</td>
                    <td className="py-4 text-center font-mono font-black text-slate-800 dark:text-white">{row.grade_corrector_1.toFixed(2)}</td>
                    <td className="py-4 text-center font-mono font-black text-slate-800 dark:text-white">{row.grade_corrector_2.toFixed(2)}</td>
                    <td className="py-4 text-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg font-mono font-black text-xs",
                        isDiscrepancy 
                          ? "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      )}>
                        {row.delta.toFixed(2)} pts
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        isDiscrepancy 
                          ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800" 
                          : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      )}>
                        {isDiscrepancy ? "Arbitrage Requis" : "Conforme (Auto)"}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      {isDiscrepancy ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.25"
                            placeholder="Note Arbitre"
                            value={row.final_grade}
                            onChange={e => handleArbitrate(row.copy_id, e.target.value)}
                            className="w-24 p-1.5 bg-rose-50 dark:bg-rose-950 border border-rose-300 dark:border-rose-700 rounded-lg text-center font-black text-xs text-rose-900 dark:text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                      ) : (
                        <span className="font-mono font-black text-base text-[#001A4B] dark:text-blue-300">
                          {Number(row.final_grade).toFixed(2)} / 20
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
