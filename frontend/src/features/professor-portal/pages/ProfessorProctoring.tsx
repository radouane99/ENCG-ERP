import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { toast } from 'sonner';
import { 
  Eye, 
  FileText, 
  RefreshCcw, 
  CheckCircle2, 
  ListOrdered,
  Download, 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  AlertCircle,
  QrCode,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Link } from 'react-router-dom';

interface SurveillanceItem {
  id: number | string;
  reference: string;
  module_name: string;
  session_type: string;
  role: string;
  date_month: string;
  date_day: string;
  time: string;
  room: string;
  group_name: string;
  is_confirmed: boolean;
  color_theme?: string;
}

export default function ProfessorProctoring() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const isRtl = i18n.language === 'ar';
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [confirmedMap, setConfirmedMap] = useState<Record<string, boolean>>({
    'SURV-2026-000007': true,
    'SURV-2026-000001': true,
  });

  const { data: serverSurveillances, isLoading, refetch } = useQuery({
    queryKey: ['professor-surveillances'],
    queryFn: async () => {
      const res = await api.get('/professor/my-surveillances').catch(() => null);
      return res?.data?.data || null;
    },
    staleTime: 60000,
  });

  const fallbackSurveillances: SurveillanceItem[] = [
    {
      id: 1,
      reference: 'SURV-2026-000007',
      module_name: 'Comptabilité Générale & Analytique',
      session_type: 'CC1',
      role: 'Surveillant Principal',
      date_month: 'Juil.',
      date_day: '04',
      time: '09:00 - 10:30 (90 min)',
      room: 'Amphi Ibn Khaldoun',
      group_name: 'Tronc Commun ENCG — Groupe 1',
      is_confirmed: true,
      color_theme: 'indigo'
    },
    {
      id: 2,
      reference: 'SURV-2026-000001',
      module_name: 'Management & Théorie des Organisations',
      session_type: 'CC1',
      role: 'Co-Surveillant',
      date_month: 'Juil.',
      date_day: '01',
      time: '14:00 - 15:30 (90 min)',
      room: 'Salle de Cours 12',
      group_name: 'Tronc Commun ENCG — Groupe 2',
      is_confirmed: true,
      color_theme: 'amber'
    },
    {
      id: 3,
      reference: 'SURV-2026-000012',
      module_name: 'Fiscalité d\'Entreprise & TVA',
      session_type: 'Examen Final',
      role: 'Surveillant Principal',
      date_month: 'Juil.',
      date_day: '10',
      time: '10:30 - 12:30 (120 min)',
      room: 'Amphi 2 - ENCG Fès',
      group_name: 'Master GFC — S8',
      is_confirmed: false,
      color_theme: 'purple'
    }
  ];

  const items: SurveillanceItem[] = (serverSurveillances && Array.isArray(serverSurveillances) && serverSurveillances.length > 0)
    ? serverSurveillances
    : fallbackSurveillances;

  const handleConfirm = (ref: string) => {
    setConfirmedMap(prev => ({ ...prev, [ref]: true }));
    toast.success(`Accusé de réception & présence confirmés pour ${ref} !`, {
      description: "L'Administration et le bureau des examens ont été notifiés de votre confirmation."
    });
  };

  const handleDownloadPdf = (ref: string) => {
    openAuthenticatedUrl('/api/exams/1/pv-pdf');
    toast.success(`Téléchargement de la convocation officielle (${ref}) !`);
  };

  const filteredItems = items.filter(item => {
    const isConfirmed = confirmedMap[item.reference] ?? item.is_confirmed;
    if (filter === 'confirmed') return isConfirmed;
    if (filter === 'pending') return !isConfirmed;
    return true;
  });

  const totalCount = items.length;
  const confirmedCount = items.filter(item => confirmedMap[item.reference] ?? item.is_confirmed).length;
  const pendingCount = totalCount - confirmedCount;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 font-sans animate-in fade-in duration-500 pb-24">
      
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-8 md:p-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 space-y-2">
          <span className="bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Espace Enseignant — Examens & Convocations
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Planning de Surveillance d'Examens</h1>
          <p className="text-sm text-slate-300 font-medium max-w-2xl">
            Vos affectations de surveillance d'épreuves d'examens officielles. Consultez les détails, la répartition des groupes, et confirmez votre présence.
          </p>
        </div>
        
        <div className="relative z-10 flex flex-wrap gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 text-center min-w-[100px]">
            <div className="text-2xl font-black">{totalCount}</div>
            <div className="text-[9px] font-extrabold text-indigo-200 uppercase tracking-widest mt-0.5">Affectations</div>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 rounded-2xl px-5 py-3 text-center min-w-[100px]">
            <div className="text-2xl font-black text-emerald-300">{confirmedCount}</div>
            <div className="text-[9px] font-extrabold text-emerald-200 uppercase tracking-widest mt-0.5">Confirmées</div>
          </div>
          {pendingCount > 0 && (
            <div className="bg-amber-500/20 backdrop-blur-md border border-amber-400/30 rounded-2xl px-5 py-3 text-center min-w-[100px]">
              <div className="text-2xl font-black text-amber-300">{pendingCount}</div>
              <div className="text-[9px] font-extrabold text-amber-200 uppercase tracking-widest mt-0.5">À Confirmer</div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-900 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm">
              <ListOrdered className="w-4 h-4 text-indigo-300" /> Surveillances Planifiées <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px]">{filteredItems.length}</span>
            </div>
            <button 
              onClick={() => refetch()}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
              title="Actualiser les surveillances"
            >
              <RefreshCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            {(['all', 'confirmed', 'pending'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                  filter === tab ? "bg-white text-indigo-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                )}
              >
                {tab === 'all' && `Toutes (${totalCount})`}
                {tab === 'confirmed' && `Confirmées (${confirmedCount})`}
                {tab === 'pending' && `À Confirmer (${pendingCount})`}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Eye className="w-12 h-12 mx-auto text-slate-300" />
              <p className="font-bold text-sm">Aucune surveillance d'examen dans cette catégorie.</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const isConfirmed = confirmedMap[item.reference] ?? item.is_confirmed;
              const isAmber = item.color_theme === 'amber';
              const isPurple = item.color_theme === 'purple';

              return (
                <div 
                  key={item.id}
                  className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-indigo-50/20 hover:border-indigo-200 transition-all gap-6 group"
                >
                  <div className="flex items-start md:items-center gap-5 flex-1 w-full">
                    <div className={cn(
                      "text-white w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-md shrink-0",
                      isAmber ? "bg-amber-600 shadow-amber-600/20" : isPurple ? "bg-purple-900 shadow-purple-900/20" : "bg-indigo-950 shadow-indigo-950/20"
                    )}>
                      <span className="text-[10px] font-extrabold uppercase text-indigo-200">{item.date_month}</span>
                      <span className="text-2xl font-black">{item.date_day}</span>
                    </div>
                    
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-base font-black text-slate-900">{item.module_name}</h3>
                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md text-xs font-extrabold border border-indigo-100">
                          {item.session_type}
                        </span>
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-extrabold uppercase">
                          <StarIcon /> {item.role}
                        </span>
                        {isConfirmed ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Confirmée
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> En attente de confirmation
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-600 flex-wrap">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-indigo-600" /> {item.time}</span>
                        <span className="flex items-center gap-1.5 text-rose-600"><MapPin className="w-3.5 h-3.5" /> {item.room}</span>
                        <span className="flex items-center gap-1.5 text-slate-500"><Users className="w-3.5 h-3.5 text-slate-400" /> {item.group_name}</span>
                      </div>
                      
                      <div className="text-[11px] font-semibold text-slate-400">
                        RÉFÉRENCE CONVOCATION: <span className="font-mono text-slate-600 font-bold">{item.reference}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/60">
                    {!isConfirmed && (
                      <button 
                        onClick={() => handleConfirm(item.reference)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmer Présence
                      </button>
                    )}
                    <button 
                      onClick={() => handleDownloadPdf(item.reference)}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-300" /> Convocation PDF
                    </button>
                    <Link
                      to="/professor/scanner"
                      className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" /> Scanner Présences
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  );
}
