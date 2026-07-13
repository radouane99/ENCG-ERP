import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  MapPin,
  FileText,
  Download,
  AlertTriangle,
  Clock,
  Zap,
  Smartphone,
  Library,
  Briefcase,
  GraduationCap,
  MessageSquare,
  ArrowRight,
  Plus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@shared/lib/utils';
import api from '@shared/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const currentDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Fetch real stats
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['student-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/student/stats');
      return res.data.data;
    }
  });

  const stats = statsData || {
    gpa: 14.5,
    attendance: 100,
    absences: { total: 0, justified: 0, unjustified: 0 },
    upcoming_classes: [],
    recent_documents: []
  };

  const getMention = (note: number) => {
    if (note >= 16) return 'TRES BIEN';
    if (note >= 14) return 'BIEN';
    if (note >= 12) return 'ASSEZ BIEN';
    if (note >= 10) return 'PASSABLE';
    return 'AJOURNÉ';
  };

  const lineData = [
    { semester: 'S1', avg: 11.61 },
    { semester: 'S2', avg: 12.00 },
    { semester: 'S3', avg: 13.5 },
    { semester: 'S4', avg: stats.gpa },
  ];

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      {/* Top Navigation / Quick Links */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#001A4B] italic">Mon Espace Académique</h1>
          <p className="text-sm text-muted-foreground capitalize">{currentDate}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-white/[0.02] transition-colors shadow-sm">
            <Smartphone className="w-4 h-4 text-indigo-500" /> Carte Numérique
          </button>
          <button className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-white/[0.02] transition-colors shadow-sm">
            <Library className="w-4 h-4 text-rose-500" /> Clubs & Événements
          </button>
          <button className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md shadow-purple-500/20 hover:scale-105 transition-transform">
            <Zap className="w-4 h-4" /> PLANIFICATEUR IA
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">Chargement des données...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><GraduationCap className="w-16 h-16" /></div>
                <div className="text-sm font-bold text-muted-foreground mb-4">Moyenne (GPA)</div>
                <div className="text-4xl font-black text-[#001A4B]">{stats.gpa}</div>
                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-2">{getMention(stats.gpa)}</div>
              </div>

              <div className="bg-gradient-to-br from-[#001A4B] to-[#003a8c] rounded-3xl p-6 shadow-lg shadow-[#003a8c]/20 relative overflow-hidden group text-white">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                <div className="text-sm font-bold text-white/70 mb-4">Prochains Examens</div>
                <div className="text-4xl font-black text-white">{stats.upcoming_exams || 0}</div>
                <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mt-2">DANS LES 30 JOURS</div>
              </div>
            </div>

            {/* Secrétariat */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#001A4B] italic">Secrétariat & Documents Officiels</h2>
                  <p className="text-xs text-muted-foreground">Accédez aux pièces signées électroniquement par la direction</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-white/5 rounded-2xl p-6 bg-slate-50 hover:bg-slate-100 transition-colors hover:shadow-md group">
                  <FileText className="w-8 h-8 text-[#003a8c] mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <h3 className="font-bold text-[#001A4B] mb-1">Documents Récents</h3>
                  <div className="space-y-2 mt-4">
                    {stats.recent_documents.map((doc: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm text-xs">
                        <span className="font-semibold text-slate-700">{doc.title}</span>
                        <button className="text-[#003a8c] hover:bg-blue-50 p-1 rounded-md"><Download className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/[0.02] hover:border-gray-300 transition-colors">
                  <Plus className="w-8 h-8 text-[#e6007e] mb-2" />
                  <h3 className="font-bold text-[#001A4B] mb-1">Autre Document ?</h3>
                  <p className="text-[10px] text-muted-foreground mb-4 px-4">Faites une demande auprès du guichet unique.</p>
                  <button className="bg-[#001A4B] text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                    NOUVELLE DEMANDE
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Agenda */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black text-[#001A4B] flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" /> Agenda d'Aujourd'hui
                </h2>
              </div>
              {stats.upcoming_classes.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">Aucun cours prévu aujourd'hui.</div>
              ) : (
                <div className="space-y-4">
                  {stats.upcoming_classes.map((cls: any, i: number) => (
                    <div key={i} className="relative pl-4 border-l-2 border-slate-100">
                      <div className="absolute w-3 h-3 bg-[#003a8c] rounded-full -left-[7px] top-2 border-2 border-white shadow-sm"></div>
                      <div className="mb-1 text-xs font-bold text-[#003a8c]">{cls.time}</div>
                      <h3 className="text-sm font-bold text-[#001A4B] mb-1">{cls.title}</h3>
                      <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <MapPin className="w-3 h-3 text-rose-500" /> {cls.location}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Absences */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">ASSIDUITÉ & ABSENCES</h2>
              <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-2xl font-black text-[#001A4B]">{stats.absences.total}</div>
                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">TOTAL</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <div className="text-2xl font-black text-emerald-600">{stats.absences.justified}</div>
                  <div className="text-[8px] font-bold text-emerald-600/60 uppercase tracking-widest mt-1">JUSTIFIÉES</div>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                  <div className="text-2xl font-black text-rose-600">{stats.absences.unjustified}</div>
                  <div className="text-[8px] font-bold text-rose-600/60 uppercase tracking-widest mt-1">NON-JUST.</div>
                </div>
              </div>
              {stats.absences.unjustified > 2 && (
                <div className="bg-rose-50 text-rose-700 text-xs font-bold p-3 rounded-xl border border-rose-100 flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> Action requise : Justifiez vos absences
                </div>
              )}
              <button className="w-full bg-[#001A4B] text-white font-bold text-xs py-3.5 rounded-xl uppercase tracking-widest hover:bg-[#000d26] transition-colors">
                DÉPOSER UN JUSTIFICATIF →
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
