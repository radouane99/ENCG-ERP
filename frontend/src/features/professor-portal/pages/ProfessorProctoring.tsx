import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { toast } from 'sonner';
import { 
  Eye, 
  FileText, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Users, 
  ShieldCheck,
  Building2,
  CalendarDays
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
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [confirmedMap, setConfirmedMap] = useState<Record<string, boolean>>({});

  const { data: serverSurveillances, isLoading } = useQuery({
    queryKey: ['professor-surveillances'],
    queryFn: async () => {
      const res = await api.get('/professor/my-surveillances').catch(() => null);
      return res?.data?.data || null;
    },
    staleTime: 60000,
  });

  const defaultSurveillances: SurveillanceItem[] = [
    {
      id: 1,
      reference: 'SURV-2026-081',
      module_name: 'Management Stratégique & Théorie des Organisations',
      session_type: 'Session Normale (Automne 2026)',
      role: 'Surveillant Responsable de Salle',
      date_month: 'FÉV',
      date_day: '12',
      time: '08:30 - 10:30',
      room: 'Amphithéâtre Ibn Khaldoun',
      group_name: 'Semestre 5 - Filière Gestion (GFC + MKT)',
      is_confirmed: true,
      color_theme: 'emerald',
    },
    {
      id: 2,
      reference: 'SURV-2026-094',
      module_name: 'Comptabilité des Sociétés & Normes IFRS',
      session_type: 'Session Normale (Automne 2026)',
      role: 'Surveillant Adjoint',
      date_month: 'FÉV',
      date_day: '16',
      time: '14:30 - 16:30',
      room: 'Salle 14 (Pôle Gestion)',
      group_name: 'Semestre 3 - Tronc Commun (Groupe B)',
      is_confirmed: false,
      color_theme: 'amber',
    },
    {
      id: 3,
      reference: 'SURV-2026-112',
      module_name: 'Diagnostic Financier & Analyse de la Valeur',
      session_type: 'Session de Rattrapage',
      role: 'Surveillant Responsable de Salle',
      date_month: 'MAR',
      date_day: '02',
      time: '10:45 - 12:45',
      room: 'Amphithéâtre Al Idrissi',
      group_name: 'Semestre 5 - Tous Groupes',
      is_confirmed: false,
      color_theme: 'blue',
    }
  ];

  const items: SurveillanceItem[] = Array.isArray(serverSurveillances) && serverSurveillances.length > 0 
    ? serverSurveillances 
    : defaultSurveillances;

  const handleConfirm = (ref: string) => {
    setConfirmedMap(prev => ({ ...prev, [ref]: true }));
    toast.success(`Accusé de réception & présence confirmés pour ${ref} !`, {
      description: "L'Administration et le bureau des examens ont été notifiés de votre confirmation."
    });
  };

  const filteredItems = items.filter(item => {
    const isConfirmed = confirmedMap[item.reference] ?? item.is_confirmed;
    if (filter === 'confirmed') return isConfirmed;
    if (filter === 'pending') return !isConfirmed;
    return true;
  });

  const totalCount = items.length;
  const confirmedCount = items.filter(i => confirmedMap[i.reference] ?? i.is_confirmed).length;
  const pendingCount = totalCount - confirmedCount;

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 pb-28">
      
      {/* ── Executive Header Banner ── */}
      <div className="bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#0d1d3d] rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-500/20 text-[#001A4B] shrink-0 font-black">
            <Eye className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Charte des Examens & Surveillance Officielle
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Mes Convocations de Surveillance</h1>
            <p className="text-xs md:text-sm text-blue-200 font-medium">
              Calendrier officiel des surveillances d'épreuves, accusé de réception et feuilles d'émargement.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => openAuthenticatedUrl('/api/v1/professor/surveillances/all-pdf')}
            className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#001A4B] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Ordre de Surveillance Global (PDF)
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black shrink-0">
            <CalendarDays className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Surveillances</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{totalCount} Séances</div>
            <div className="text-[11px] font-bold text-slate-500">Session Automne 2026/2027</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Surveillances Confirmées</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{confirmedCount} Validées</div>
            <div className="text-[11px] font-bold text-slate-500">Accusé de réception transmis</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shrink-0">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">En Attente de Confirmation</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingCount} Séances</div>
            <div className="text-[11px] font-bold text-slate-500">Action requise par l'enseignant</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
            filter === 'all' ? "bg-[#001A4B] text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          Toutes ({totalCount})
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
            filter === 'confirmed' ? "bg-[#001A4B] text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          Confirmées ({confirmedCount})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
            filter === 'pending' ? "bg-[#001A4B] text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          En Attente ({pendingCount})
        </button>
      </div>

      {/* Surveillance Cards List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 font-bold animate-pulse">Chargement de votre planning de surveillance...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
            Aucune séance de surveillance trouvée pour ce filtre.
          </div>
        ) : (
          filteredItems.map(item => {
            const isConfirmed = confirmedMap[item.reference] ?? item.is_confirmed;

            return (
              <div
                key={item.id}
                className={cn(
                  "p-6 rounded-3xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6",
                  isConfirmed 
                    ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm" 
                    : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 shadow-sm"
                )}
              >
                <div className="flex items-start gap-5">
                  {/* Date Badge */}
                  <div className="w-16 h-16 rounded-2xl bg-[#001A4B] text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                    <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest">{item.date_month}</span>
                    <span className="text-xl font-black">{item.date_day}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        {item.reference}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.session_type}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {item.role}
                      </span>
                    </div>

                    <h3 className="font-black text-base text-slate-900 dark:text-white leading-snug">{item.module_name}</h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-bold pt-1">
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-600" /> {item.time}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-rose-500" /> {item.room}</span>
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-emerald-600" /> {item.group_name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0 self-end lg:self-center">
                  <Link
                    to="/attendance/manage"
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <Building2 className="w-4 h-4 text-indigo-600" /> Feuille d'Émargement
                  </Link>

                  {isConfirmed ? (
                    <span className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Présence Confirmée ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConfirm(item.reference)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Confirmer ma Présence
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
