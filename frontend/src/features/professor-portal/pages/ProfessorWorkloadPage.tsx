import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  Download, 
  FileText, 
  CreditCard, 
  Building2, 
  Layers, 
  ShieldCheck,
  Calendar,
  Sparkles
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { toast } from 'sonner';

export default function ProfessorWorkloadPage() {
  const { t, i18n } = useTranslation(['professors', 'common']);

  const { data: workloadData, isLoading } = useQuery({
    queryKey: ['professor-workload'],
    queryFn: async () => {
      const res = await api.get('/professor-portal/workload');
      return res.data.data;
    }
  });

  const handleDownloadTimesheetPdf = () => {
    openAuthenticatedUrl('/api/v1/admin/vacataires/payments');
    toast.success('📄 Téléchargement du Bordereau d\'Heures Certifié (PDF Officiel) !');
  };

  const w = workloadData || {
    is_vacataire: false,
    statutory_hours: 0,
    hours_done: 0,
    hours_cm: 0,
    hours_td: 0,
    hours_tp: 0,
    overtime_hours: 0,
    hourly_rate: 0,
    estimated_payment: 0,
    completion_percent: 0,
    virement_status: '',
    monthly_breakdown: []
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in duration-500 pb-28">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] rounded-3xl p-8 text-white shadow-xl border border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
            <Clock className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Gestion RH & Décompte des Heures
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Charge Statutaire & Rémunération des Heures</h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium mt-0.5">
              Suivi transparent de vos volumes horaires réalisés (CM, TD, TP) et bordereaux de paie.
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadTimesheetPdf}
          className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/20 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Bordereau Certifié (PDF)
        </button>
      </div>

      {/* Jauge & Volume Overview */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
              {w.is_vacataire ? "Décompte des Heures de Vacation Réalisées" : "Progression de la Charge Annuelle Statutaire"}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Année Académique 2026/2027 • ENCG Fès</p>
          </div>

          <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black">
            {w.is_vacataire ? 'Enseignant Vacataire' : 'Professeur Permanent'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-baseline text-sm font-black">
            <span className="text-slate-800">
              Heures Enseignées : <strong className="text-indigo-600 text-lg">{w.hours_done}h</strong>
            </span>
            <span className="text-slate-400 font-mono text-xs">
              {w.statutory_hours > 0 ? `Objectif Statutaire : ${w.statutory_hours}h` : 'Paiement à l\'heure'}
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-4 p-0.5 border border-slate-200 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, w.completion_percent)}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-xs font-bold text-slate-500 pt-1">
            <span>CM : <strong>{w.hours_cm}h</strong></span>
            <span>TD : <strong>{w.hours_td}h</strong></span>
            <span>TP : <strong>{w.hours_tp}h</strong></span>
            <span className="text-emerald-600 font-black">{w.completion_percent}% complété</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shrink-0">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Heures Complémentaires</div>
            <div className="text-2xl font-black text-slate-900">{w.overtime_hours} Heures</div>
            <div className="text-[11px] font-bold text-indigo-600">Au-delà du quota</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black shrink-0">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Montant Prévisionnel</div>
            <div className="text-2xl font-black text-emerald-600">{w.estimated_payment.toLocaleString()} MAD</div>
            <div className="text-[11px] font-bold text-slate-500">Taux : {w.hourly_rate} MAD / h</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">État du Virement</div>
            <div className="text-xs font-black text-slate-900 leading-snug">{w.virement_status}</div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
            Bordereau Récapitulatif Mensuel des Séances
          </h2>
          <span className="text-xs font-bold text-slate-400">Validé par le Service du Personnel</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="pb-3 pl-2">Mois</th>
                <th className="pb-3 text-center">Cours Magistral (CM)</th>
                <th className="pb-3 text-center">Travaux Dirigés (TD)</th>
                <th className="pb-3 text-center">Travaux Pratiques (TP)</th>
                <th className="pb-3 text-center">Total Heures</th>
                <th className="pb-3 text-right pr-2">Statut Certification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold">
              {w.monthly_breakdown.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 pl-2 font-black text-slate-900">{row.month} 2026</td>
                  <td className="py-4 text-center text-slate-700">{row.cm}h</td>
                  <td className="py-4 text-center text-slate-700">{row.td}h</td>
                  <td className="py-4 text-center text-slate-700">{row.tp}h</td>
                  <td className="py-4 text-center">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl font-black font-mono">
                      {row.total}h
                    </span>
                  </td>
                  <td className="py-4 text-right pr-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      row.status === 'Certifié' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
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
