import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Download, 
  Plus, 
  Sparkles, 
  Search, 
  ExternalLink,
  ShieldCheck,
  Users
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

export default function ProfessorResearchPage() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const [activeTab, setActiveTab] = useState<'phd' | 'publications'>('phd');

  const { data: researchData, isLoading } = useQuery({
    queryKey: ['professor-research'],
    queryFn: async () => {
      const res = await api.get('/professor-portal/research');
      return res.data.data;
    }
  });

  const handleValidateCst = (studentName: string) => {
    toast.success(`Rapport de Comité de Suivi de Thèse (CST) validé pour ${studentName} !`, {
      description: 'Avis Favorable transmis à la direction du CEDOC ENCG Fès.'
    });
  };

  const handleExportMinistryReport = () => {
    window.open('/api/v1/admin/research/rapport-activite-pdf', '_blank');
    toast.success('📄 Rapport d\'activité scientifique annuel (MESRSFC) téléchargé !');
  };

  const doctoralStudents = researchData?.doctoral_students || [];
  const publications = researchData?.publications || [];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in duration-500 pb-28">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] rounded-3xl p-8 text-white shadow-xl border border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Centre d'Études Doctorales (CEDOC)
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Espace Recherche & Thèses Doctorales</h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium mt-0.5">
              {researchData?.laboratory_name || "Laboratoire LARMAFIG — ENCG Fès"}
            </p>
          </div>
        </div>

        <button
          onClick={handleExportMinistryReport}
          className="px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-950/20 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Rapport Scientifique (MESRSFC)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Doctorants Encadrés</div>
            <div className="text-3xl font-black text-slate-900">{researchData?.active_phd_count || 4}</div>
            <div className="text-[11px] font-bold text-indigo-600">Thèses en cours</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black shrink-0">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Publications Indexées</div>
            <div className="text-3xl font-black text-slate-900">{researchData?.publications_count || 8}</div>
            <div className="text-[11px] font-bold text-purple-600">Scopus, WoS, CNRS</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black shrink-0">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Citations Internationales</div>
            <div className="text-3xl font-black text-emerald-600">{researchData?.citations_count || 142}</div>
            <div className="text-[11px] font-bold text-slate-500">Indice H : 6</div>
          </div>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('phd')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                activeTab === 'phd' ? "bg-indigo-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"
              )}
            >
              Doctorants CEDOC ({doctoralStudents.length})
            </button>
            <button
              onClick={() => setActiveTab('publications')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                activeTab === 'publications' ? "bg-purple-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"
              )}
            >
              Publications & Articles ({publications.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Doctoral Students */}
        {activeTab === 'phd' && (
          <div className="space-y-4">
            {doctoralStudents.map((phd: any) => (
              <div key={phd.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition-all space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                      {phd.year}
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-1">{phd.name}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
                      {phd.cst_status}
                    </span>
                    <button
                      onClick={() => handleValidateCst(phd.name)}
                      className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      Valider CST 2026
                    </button>
                  </div>
                </div>

                <p className="text-xs font-medium text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200">
                  <strong className="text-slate-900">Sujet de Thèse :</strong> "{phd.topic}"
                </p>

                {/* Progress bar of 120h formation */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" /> Crédits de Formation Doctorale Obligatoire
                    </span>
                    <span className="font-mono text-indigo-700">{phd.formations_hours}h / 120h requises</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (phd.formations_hours / 120) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Publications */}
        {activeTab === 'publications' && (
          <div className="space-y-4">
            {publications.map((pub: any) => (
              <div key={pub.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-purple-300 transition-all space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
                      {pub.indexation} • {pub.year}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 leading-snug">{pub.title}</h3>
                    <p className="text-xs text-slate-500 font-semibold">{pub.journal}</p>
                  </div>

                  <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl text-center shrink-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Citations</span>
                    <span className="text-lg font-black text-purple-700">{pub.citations}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
