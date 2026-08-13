import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Eye, 
  FileText, 
  RefreshCcw, 
  CheckCircle2, 
  ListOrdered,
  Edit,
  Download,
  Calendar,
  Clock,
  MapPin,
  Users
} from 'lucide-react';

export default function ProfessorProctoring() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const isRtl = i18n.language === 'ar';
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 font-sans animate-in fade-in duration-500 pb-24">
      
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-8 md:p-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 space-y-2">
          <span className="bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 inline-block">
            Espace Enseignant — Examens & Convocations
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Planning de Surveillance d'Examens</h1>
          <p className="text-sm text-slate-300 font-medium max-w-2xl">
            Vos affectations de surveillance d'épreuves d'examens officielles. Consultez les détails, la répartition des groupes, et confirmez votre présence.
          </p>
        </div>
        
        <div className="relative z-10 flex gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 text-center min-w-[100px]">
            <div className="text-2xl font-black">2</div>
            <div className="text-[9px] font-extrabold text-indigo-200 uppercase tracking-widest mt-0.5">Affectations</div>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 rounded-2xl px-5 py-3 text-center min-w-[100px]">
            <div className="text-2xl font-black text-emerald-300">2</div>
            <div className="text-[9px] font-extrabold text-emerald-200 uppercase tracking-widest mt-0.5">Confirmées</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="bg-indigo-900 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm">
            <ListOrdered className="w-4 h-4 text-indigo-300" /> Surveillances Planifiées <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px]">2</span>
          </div>
          <span className="text-xs font-bold text-slate-500">Année Académique 2025-2026</span>
        </div>

        <div className="space-y-4">
          {/* Item 1 */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-indigo-50/20 hover:border-indigo-200 transition-all gap-6 group">
            
            <div className="flex items-start md:items-center gap-5 flex-1 w-full">
              <div className="bg-indigo-950 text-white w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-md shadow-indigo-950/20 shrink-0">
                <span className="text-[10px] font-extrabold uppercase text-indigo-300">Juil.</span>
                <span className="text-2xl font-black">04</span>
              </div>
              
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-base font-black text-slate-900">Comptabilité Générale & Analytique</h3>
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md text-xs font-extrabold border border-indigo-100">CC1</span>
                  <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-extrabold uppercase"><StarIcon /> Surveillant Principal</span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Confirmée</span>
                </div>
                
                <div className="flex items-center gap-4 text-xs font-bold text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-indigo-600" /> 09:00 - 10:30 (90 min)</span>
                  <span className="flex items-center gap-1.5 text-rose-600"><MapPin className="w-3.5 h-3.5" /> Amphi Ibn Khaldoun</span>
                  <span className="flex items-center gap-1.5 text-slate-500"><Users className="w-3.5 h-3.5 text-slate-400" /> Tronc Commun ENCG — Groupe 1</span>
                </div>
                
                <div className="text-[11px] font-semibold text-slate-400">
                  RÉFÉRENCE CONVOCATION: <span className="font-mono text-slate-600 font-bold">SURV-2026-000007</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/60">
              <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm">
                <FileText className="w-3.5 h-3.5 text-indigo-300" /> Convocation PDF
              </button>
              <button className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors">
                <ListOrdered className="w-3.5 h-3.5" /> Liste Émargement
              </button>
            </div>
          </div>

          {/* Item 2 */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-indigo-50/20 hover:border-indigo-200 transition-all gap-6 group">
            
            <div className="flex items-start md:items-center gap-5 flex-1 w-full">
              <div className="bg-amber-600 text-white w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-md shadow-amber-600/20 shrink-0">
                <span className="text-[10px] font-extrabold uppercase text-amber-200">Juil.</span>
                <span className="text-2xl font-black">01</span>
              </div>
              
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-base font-black text-slate-900">Management & Théorie des Organisations</h3>
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md text-xs font-extrabold border border-indigo-100">CC1</span>
                  <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-extrabold uppercase"><StarIcon /> Co-Surveillant</span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Confirmée</span>
                </div>
                
                <div className="flex items-center gap-4 text-xs font-bold text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-indigo-600" /> 14:00 - 15:30 (90 min)</span>
                  <span className="flex items-center gap-1.5 text-rose-600"><MapPin className="w-3.5 h-3.5" /> Salle de Cours 12</span>
                  <span className="flex items-center gap-1.5 text-slate-500"><Users className="w-3.5 h-3.5 text-slate-400" /> Tronc Commun ENCG — Groupe 2</span>
                </div>
                
                <div className="text-[11px] font-semibold text-slate-400">
                  RÉFÉRENCE CONVOCATION: <span className="font-mono text-slate-600 font-bold">SURV-2026-000001</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/60">
              <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm">
                <FileText className="w-3.5 h-3.5 text-indigo-300" /> Convocation PDF
              </button>
              <button className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors">
                <ListOrdered className="w-3.5 h-3.5" /> Liste Émargement
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
  )
}
