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
    <div className="max-w-6xl mx-auto p-6 space-y-8 font-sans animate-in fade-in zoom-in duration-500">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10">
          <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 inline-block">
            Espace Professeur
          </span>
          <h1 className="text-3xl font-black mb-2">Surveillance d'Examens</h1>
          <p className="text-sm text-blue-100">Vos affectations de surveillance officielles. Téléchargez le PDF et confirmez réception.</p>
        </div>
        
        <div className="relative z-10 flex gap-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 text-center min-w-[100px]">
            <div className="text-3xl font-black">5</div>
            <div className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mt-1">Total</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 text-center min-w-[100px]">
            <div className="text-3xl font-black">5</div>
            <div className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mt-1">À venir</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 text-center min-w-[100px]">
            <div className="text-3xl font-black">5</div>
            <div className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mt-1">Confirmées</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5">
        <div className="flex items-center gap-2 mb-8 border-b border-white/5 pb-4">
          <div className="bg-[#001A4B] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
            <ListOrdered className="w-4 h-4" /> Surveillances Ã  venir <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs">5</span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Item 1 */}
          <div className="flex flex-col lg:flex-row items-center justify-between p-6 rounded-2xl border border-white/5 hover:border-blue-100 hover:shadow-md transition-all gap-6 group">
            
            <div className="flex items-center gap-6 flex-1 w-full">
              <div className="bg-[#001A4B] text-white w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-lg shrink-0">
                <span className="text-[10px] font-bold uppercase text-blue-200">Juil.</span>
                <span className="text-xl font-black">04</span>
              </div>
              
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-black text-white">GAMING</h3>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold border border-blue-100">CC1</span>
                  <span className="text-amber-500 flex items-center gap-1 text-[10px] font-bold uppercase"><StarIcon /> Principal</span>
                  <span className="text-emerald-500 text-[10px] font-bold uppercase">Confirmée</span>
                </div>
                
                <div className="flex items-center gap-4 text-xs font-bold text-white/50 flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 09:00 - 10:30</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-300" /> 90 min</span>
                  <span className="flex items-center gap-1 text-rose-600"><MapPin className="w-3 h-3" /> Amphi Ibn Khaldoun</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs font-bold text-white/70">
                  <Users className="w-3 h-3" /> Génie Informatique - Groupe 1
                  <span className="text-gray-400 font-medium ml-2 border-l border-white/10 pl-2">REF: SURV-2026-000007</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border-l border-white/5 pl-6 pr-6 shrink-0 hidden md:flex">
              <span className="text-xl font-black text-white">10</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Jours</span>
            </div>

            <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
              <button className="w-full md:w-auto bg-[#001A4B] text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors">
                <FileText className="w-3 h-3" /> PDF
              </button>
              <button className="w-full md:w-auto bg-amber-50 text-amber-600 border border-amber-200 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors">
                <RefreshCcw className="w-3 h-3" /> Changement
              </button>
              <button className="w-full md:w-auto bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-default">
                <CheckCircle2 className="w-3 h-3" /> Confirmée
              </button>
              <button className="w-full md:w-auto bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
                <ListOrdered className="w-3 h-3" /> Liste Présences
              </button>
              <button className="w-full md:w-auto bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors">
                <Edit className="w-3 h-3" /> Modifier PV
              </button>
              <button className="w-full md:w-auto bg-purple-50 text-purple-600 border border-purple-200 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-purple-100 transition-colors">
                <Download className="w-3 h-3" /> Télécharger PV
              </button>
            </div>
            
          </div>

          {/* Item 2 */}
          <div className="flex flex-col lg:flex-row items-center justify-between p-6 rounded-2xl border border-white/5 hover:border-blue-100 hover:shadow-md transition-all gap-6 group">
            
            <div className="flex items-center gap-6 flex-1 w-full">
              <div className="bg-amber-500 text-white w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <span className="text-[10px] font-bold uppercase text-amber-200">Juil.</span>
                <span className="text-xl font-black">01</span>
              </div>
              
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-black text-white">Introduction - Génie Civil</h3>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold border border-blue-100">CC1</span>
                  <span className="text-amber-500 flex items-center gap-1 text-[10px] font-bold uppercase"><StarIcon /> Principal</span>
                  <span className="text-emerald-500 text-[10px] font-bold uppercase">Confirmée</span>
                </div>
                
                <div className="flex items-center gap-4 text-xs font-bold text-white/50 flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 09:00 - 10:30</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-300" /> 90 min</span>
                  <span className="flex items-center gap-1 text-rose-600"><MapPin className="w-3 h-3" /> Labo Info 1</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs font-bold text-white/70">
                  <Users className="w-3 h-3" /> Génie Civil - Groupe 2
                  <span className="text-gray-400 font-medium ml-2 border-l border-white/10 pl-2">REF: SURV-2026-000001</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border-l border-white/5 pl-6 pr-6 shrink-0 hidden md:flex">
              <span className="text-xl font-black text-white">7</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Jours</span>
            </div>

            <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
              <button className="w-full md:w-auto bg-[#001A4B] text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors">
                <FileText className="w-3 h-3" /> PDF
              </button>
              <button className="w-full md:w-auto bg-amber-50 text-amber-600 border border-amber-200 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors">
                <RefreshCcw className="w-3 h-3" /> Changement
              </button>
              <button className="w-full md:w-auto bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-default">
                <CheckCircle2 className="w-3 h-3" /> Confirmée
              </button>
              <button className="w-full md:w-auto bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
                <ListOrdered className="w-3 h-3" /> Liste Présences
              </button>
              <button className="w-full md:w-auto bg-purple-50 text-purple-600 border border-purple-200 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-purple-100 transition-colors">
                <Edit className="w-3 h-3" /> Rédiger PV
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
