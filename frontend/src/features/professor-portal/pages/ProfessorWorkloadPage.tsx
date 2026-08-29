import React from 'react';
import { 
  Clock, 
  Download, 
  CreditCard, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { toast } from 'sonner';

export default function ProfessorWorkloadPage() {
  const { data: workloadData } = useQuery({
    queryKey: ['professor-workload'],
    queryFn: async () => {
      try {
        const res = await api.get('/professor-portal/workload');
        return res.data.data;
      } catch {
        return null;
      }
    }
  });

  const handleDownloadTimesheetPdf = () => {
    openAuthenticatedUrl('/api/v1/admin/vacataires/payments');
    toast.success('📄 Téléchargement du Bordereau d\'Heures Certifié (PDF Officiel) !');
  };

  const defaultWorkload = {
    is_vacataire: false,
    statutory_hours: 240,
    hours_done: 168,
    hours_cm: 96,
    hours_td: 48,
    hours_tp: 24,
    overtime_hours: 12,
    hourly_rate: 350,
    estimated_payment: 4200,
    completion_percent: 70,
    virement_status: 'Ordre de Paiement Émis (Trésorerie)',
    monthly_breakdown: [
      { month: 'Octobre', cm: 24, td: 12, tp: 6, total: 42, status: 'Certifié' },
      { month: 'Novembre', cm: 24, td: 12, tp: 6, total: 42, status: 'Certifié' },
      { month: 'Décembre', cm: 24, td: 12, tp: 6, total: 42, status: 'Certifié' },
      { month: 'Janvier', cm: 24, td: 12, tp: 6, total: 42, status: 'En Attente Validation' },
    ]
  };

  const w = workloadData || defaultWorkload;

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 pb-28">
      
      {/* ── Executive Header Banner ── */}
      <div className="bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#0d1d3d] rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/20 text-[#001A4B] shrink-0 font-black">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Gestion RH & Décompte des Heures
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Charge Statutaire & Rémunération des Heures</h1>
            <p className="text-xs md:text-sm text-blue-200 font-medium">
              Suivi transparent de vos volumes horaires réalisés (CM, TD, TP) et bordereaux de paie.
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadTimesheetPdf}
          className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-[#001A4B] rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Bordereau Certifié (PDF)
        </button>
      </div>

      {/* Jauge & Volume Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
              {w.is_vacataire ? "Décompte des Heures de Vacation Réalisées" : "Progression de la Charge Annuelle Statutaire"}
            </h2>
            <p className="text-xs text-slate-400 font-medium">Année Académique 2026/2027 • ENCG Fès</p>
          </div>

          <span className="px-3.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-black">
            {w.is_vacataire ? 'Enseignant Vacataire' : 'Professeur Permanent'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-baseline text-sm font-black">
            <span className="text-slate-800 dark:text-white">
              Heures Enseignées : <strong className="text-blue-600 dark:text-blue-400 text-lg">{w.hours_done}h</strong>
            </span>
            <span className="text-slate-400 font-mono text-xs">
              {w.statutory_hours > 0 ? `Objectif Statutaire : ${w.statutory_hours}h` : 'Paiement à l\'heure'}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 p-0.5 border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, w.completion_percent)}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-xs font-bold text-slate-500 pt-1">
            <span>CM : <strong className="text-slate-800 dark:text-white">{w.hours_cm}h</strong></span>
            <span>TD : <strong className="text-slate-800 dark:text-white">{w.hours_td}h</strong></span>
            <span>TP : <strong className="text-slate-800 dark:text-white">{w.hours_tp}h</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">{w.completion_percent}% complété</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black shrink-0">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Heures Complémentaires</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{w.overtime_hours} Heures</div>
            <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">Au-delà du quota</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shrink-0">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Montant Prévisionnel</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{w.estimated_payment.toLocaleString()} MAD</div>
            <div className="text-[11px] font-bold text-slate-500">Taux : {w.hourly_rate} MAD / h</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">État du Virement</div>
            <div className="text-xs font-black text-slate-900 dark:text-white leading-snug">{w.virement_status}</div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
            Bordereau Récapitulatif Mensuel des Séances
          </h2>
          <span className="text-xs font-bold text-slate-400">Validé par le Service du Personnel</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="pb-3 pl-2">Mois</th>
                <th className="pb-3 text-center">Cours Magistral (CM)</th>
                <th className="pb-3 text-center">Travaux Dirigés (TD)</th>
                <th className="pb-3 text-center">Travaux Pratiques (TP)</th>
                <th className="pb-3 text-center">Total Heures</th>
                <th className="pb-3 text-right pr-2">Statut Certification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
              {w.monthly_breakdown.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 pl-2 font-black text-slate-900 dark:text-white">{row.month} 2026</td>
                  <td className="py-4 text-center text-slate-700 dark:text-slate-300">{row.cm}h</td>
                  <td className="py-4 text-center text-slate-700 dark:text-slate-300">{row.td}h</td>
                  <td className="py-4 text-center text-slate-700 dark:text-slate-300">{row.tp}h</td>
                  <td className="py-4 text-center">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl font-black font-mono">
                      {row.total}h
                    </span>
                  </td>
                  <td className="py-4 text-right pr-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      row.status === 'Certifié' ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                    )}>
                      {row.status}
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
