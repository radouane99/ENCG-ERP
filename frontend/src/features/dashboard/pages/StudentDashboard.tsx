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

export default function StudentDashboard() {
  const { user } = useAuthStore();

  // Date formatting
  const currentDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Simulator State
  const [simCC1, setSimCC1] = useState(12);
  const [simCC2, setSimCC2] = useState(12);
  const [simExam, setSimExam] = useState(12);

  const simModuleAvg = (simCC1 * 0.2) + (simCC2 * 0.2) + (simExam * 0.6);
  // Mock global average calculation based on this module
  const simGlobalAvg = 11.5 + (simModuleAvg - 10) * 0.15;

  const getMention = (note: number) => {
    if (note >= 16) return 'TRES BIEN';
    if (note >= 14) return 'BIEN';
    if (note >= 12) return 'ASSEZ BIEN';
    if (note >= 10) return 'PASSABLE';
    return 'AJOURNï¿½';
  };

  const radarData = [
    { subject: 'Introduction - Gï¿½nie Informatique', A: 16.10, fullMark: 20 },
    { subject: 'Avancï¿½ - Gï¿½nie Informatique', A: 7.00, fullMark: 20 },
    { subject: 'Dï¿½veloppement mobile', A: 14.66, fullMark: 20 },
    { subject: 'Dï¿½veloppement mobile LARAVEL', A: 8.62, fullMark: 20 },
    { subject: 'Intelligent Artificiel', A: 11.74, fullMark: 20 },
    { subject: 'SQL SERVER BASE DE DONNEE', A: 13.14, fullMark: 20 },
    { subject: 'GAMING', A: 15.00, fullMark: 20 },
  ];

  const lineData = [
    { semester: 'S1', avg: 11.61 },
    { semester: 'S2', avg: null },
    { semester: 'S3', avg: null },
    { semester: 'S4', avg: null },
    { semester: 'S5', avg: null },
    { semester: 'S6', avg: null },
  ];

  const grades = [
    { name: 'Introduction - Gï¿½nie Informatique', cc1: 19.00, cc2: 18.00, exam: 14.50, total: 16.10, status: 'VALIDï¿½', color: 'emerald' },
    { name: 'Avancï¿½ - Gï¿½nie Informatique', cc1: 5.50, cc2: 8.50, exam: 7.00, total: 7.00, status: 'RATTRAPAGE', color: 'rose' },
    { name: 'Dï¿½veloppement mobile', cc1: 11.80, cc2: 11.70, exam: 16.60, total: 14.66, status: 'VALIDï¿½', color: 'emerald' },
    { name: 'Dï¿½veloppement mobile LARAVEL', cc1: 12.90, cc2: 12.20, exam: 6.00, total: 8.62, status: 'RATTRAPAGE', color: 'rose' },
    { name: 'Intelligent Artificiel', cc1: 17.20, cc2: 16.30, exam: 8.40, total: 11.74, status: 'VALIDï¿½', color: 'emerald' },
    { name: 'SQL SERVER BASE DE DONNEE', cc1: 14.20, cc2: 17.60, exam: 11.30, total: 13.14, status: 'VALIDï¿½', color: 'emerald' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6 font-sans animate-in fade-in zoom-in duration-500 pb-24">

      {/* Top Navigation / Quick Links */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#001A4B] italic">Mon Espace Acadï¿½mique</h1>
          <p className="text-sm text-muted-foreground capitalize">{currentDate}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-white/[0.02] transition-colors shadow-sm">
            <Smartphone className="w-4 h-4 text-indigo-500" /> Carte Numï¿½rique
          </button>
          <button className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-white/[0.02] transition-colors shadow-sm">
            <Library className="w-4 h-4 text-rose-500" /> Clubs & ï¿½vï¿½nements
          </button>
          <button className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-white/[0.02] transition-colors shadow-sm">
            <MapPin className="w-4 h-4 text-emerald-500" /> Smart Campus
          </button>
          <button className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-white/[0.02] transition-colors shadow-sm">
            <Briefcase className="w-4 h-4 text-amber-600" /> Career & Alumni
          </button>
          <button className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 rounded-xl text-sm font-bold text-foreground shadow-md shadow-purple-500/20 hover:scale-105 transition-transform">
            <Zap className="w-4 h-4" /> PLANIFICATEUR IA
          </button>
        </div>
      </div>

      {/* Alert */}
      <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 flex items-center gap-3 text-rose-700 font-bold text-sm shadow-sm">
        <AlertTriangle className="w-5 h-5 text-rose-500" />
        4 ABSENCE(S) NON JUSTIFIï¿½E(S)
      </div>

      {/* Hero Banner */}
      <div className="relative bg-[#0b1021] rounded-[2rem] p-8 md:p-12 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-border">
        {/* Abstract Background pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#e6007e] to-[#8b5cf6] flex items-center justify-center text-4xl font-black text-foreground shadow-lg shadow-pink-500/30 border-2 border-border">
            Ae
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-muted text-foreground/90 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-border">
                ðŸŽ“ PORTAIL ï¿½TUDIANT
              </span>
            </div>
            <h2 className="text-4xl font-black text-foreground mb-4">Aniss el alaoui</h2>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
                ðŸ“š Gï¿½nie Informatique - Groupe 1
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
                ðŸ›ï¸ Gï¿½nie Informatique
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
                ðŸ—“ï¸ A.U. 2025-2026
              </span>
            </div>
          </div>
        </div>

        {/* Circular Progress */}
        <div className="relative z-10">
          <div className="w-40 h-40 relative flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" className="text-border" strokeWidth="12" />
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="#f59e0b" strokeWidth="12" strokeDasharray="440" strokeDashoffset={440 - (440 * 11.61) / 20} className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(245,158,11,0.2)] pointer-events-none"></div>
            <div className="text-center">
              <div className="text-3xl font-black text-foreground">11.61</div>
              <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">GPA / 20</div>
              <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Admis
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Banners */}
      <div className="space-y-4">
        {/* Re-enrollment */}
        <div className="bg-gradient-to-r from-pink-50 to-white rounded-2xl p-6 border border-pink-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-pink-100 text-2xl shrink-0">
              ðŸ“
            </div>
            <div>
              <div className="text-[10px] font-bold text-pink-600 uppercase tracking-widest mb-1">CAMPAGNE ACADï¿½MIQUE</div>
              <h3 className="text-lg font-black text-foreground">Procï¿½dez Ã  votre rï¿½inscription en 1-Clic</h3>
              <p className="text-sm text-muted-foreground">Consultez vos crï¿½dits modules de dette et validez votre passage Ã  l'annï¿½e d'ï¿½tudes suivante.</p>
            </div>
          </div>
          <button className="bg-[#e6007e] text-foreground px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-[#cc006f] transition-colors whitespace-nowrap">
            SE Rï¿½INSCRIRE â†’
          </button>
        </div>

        {/* Next Class */}
        <div className="bg-gradient-to-r from-emerald-50 to-white rounded-2xl p-6 border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100 shrink-0">
              <Clock className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> PROCHAIN COURS
              </div>
              <h3 className="text-lg font-black text-foreground">Dï¿½veloppement mobile</h3>
              <div className="flex items-center gap-2 text-sm font-bold text-[#003a8c] mt-1">
                10:30 â€” <MapPin className="w-4 h-4 text-gray-400" /> <span className="text-muted-foreground">Amphi Al Khwarizmi</span>
              </div>
            </div>
          </div>
          <button className="bg-[#001A4B] text-foreground px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-[#000d26] transition-colors whitespace-nowrap">
            VOIR LE PLANNING COMPLET â†’
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Rï¿½sultats Rï¿½cents */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black text-[#001A4B] flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-[#003a8c] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#003a8c]"></div>
                </div>
                Rï¿½sultats Acadï¿½miques Rï¿½cents
              </h2>
              <button className="text-xs font-bold text-[#003a8c] hover:underline uppercase tracking-widest">
                BULLETIN COMPLET â†’
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {grades.map((grade, idx) => (
                <div key={idx} className={cn(
                  "p-5 rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md",
                  grade.color === 'emerald' ? "border-emerald-100/50" : "border-rose-100/50"
                )}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-foreground text-sm leading-snug w-2/3">{grade.name}</h3>
                    <div className="text-right">
                      <div className={cn("text-2xl font-black", grade.color === 'emerald' ? "text-[#001A4B]" : "text-rose-600")}>
                        {grade.total.toFixed(2)}
                      </div>
                      <div className="text-[9px] font-bold text-gray-400 mt-[-2px]">/ 20</div>
                    </div>
                  </div>

                  <div className="flex gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                    <span>CC1: {grade.cc1.toFixed(2)}</span>
                    <span>CC2: {grade.cc2.toFixed(2)}</span>
                    <span>EXAM: {grade.exam.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                      grade.color === 'emerald' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {grade.status}
                    </span>
                    <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", grade.color === 'emerald' ? "bg-emerald-500" : "bg-rose-500")}
                        style={{ width: `${(grade.total / 20) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Profil de Compï¿½tences */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-[#001A4B] italic">Profil de Compï¿½tences</h2>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">RADAR PAR MODULE</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold justify-center mb-2">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#003a8c]"></div> Ma Note</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-200 border border-rose-300 border-dashed"></div> Seuil de Validation (10/20)</div>
              </div>
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#f3f4f6" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 8 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 20]} tick={false} axisLine={false} />
                    <Radar name="Seuil" dataKey={() => 10} stroke="#fda4af" strokeDasharray="3 3" fill="transparent" />
                    <Radar name="Note" dataKey="A" stroke="#003a8c" fill="#003a8c" fillOpacity={0.1} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ï¿½volution Acadï¿½mique */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-sm font-black text-[#001A4B] italic">ï¿½volution Acadï¿½mique</h2>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">MOYENNE GLOBALE</span>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="semester" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} />
                    <YAxis domain={[0, 20]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="avg" stroke="#e6007e" strokeWidth={3} dot={{ r: 4, fill: '#e6007e' }} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Simulateur de Notes */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black text-[#001A4B] italic flex items-center gap-2">
                Simulateur de Notes & Mention ðŸŽ¯
              </h2>
              <span className="text-[10px] font-bold text-[#e6007e] bg-pink-50 px-3 py-1 rounded-full uppercase tracking-widest border border-pink-100">
                INTERACTIF
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-8">Estimez vos moyennes prï¿½visionnelles pour vos modules en cours.</p>

            <div className="bg-white/[0.02]/50 rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row gap-8 mb-8">
              <div className="flex-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">MOYENNE ESTIMï¿½E DU MODULE</div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-foreground">{simModuleAvg.toFixed(2)}</span>
                  <span className="text-lg font-bold text-gray-400 mb-1">/ 20</span>
                </div>
              </div>
              <div className="w-px bg-gray-200 hidden md:block"></div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">NOUVELLE MOYENNE ACADï¿½MIQUE</div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-black text-[#003a8c]">{simGlobalAvg.toFixed(2)}</span>
                  <span className="text-lg font-bold text-gray-400 mb-1">/ 20</span>
                </div>
                <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  MENTION : {getMention(simGlobalAvg)}
                </span>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-6">
              {[
                { label: 'Contrï¿½le Continu 1 (20%)', val: simCC1, setter: setSimCC1 },
                { label: 'Contrï¿½le Continu 2 (20%)', val: simCC2, setter: setSimCC2 },
                { label: 'Examen Final (60%)', val: simExam, setter: setSimExam },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-6">
                  <div className="w-48 text-sm font-bold text-muted-foreground">{item.label}</div>
                  <div className="flex-1 relative flex items-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full h-1 bg-white/[0.05] rounded-full"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center">
                      <div className="h-1 bg-[#003a8c] rounded-full" style={{ width: `${(item.val / 20) * 100}%` }}></div>
                    </div>
                    <input
                      type="range"
                      min="0" max="20" step="0.5"
                      value={item.val}
                      onChange={(e) => item.setter(parseFloat(e.target.value))}
                      className="w-full h-6 relative z-10 opacity-0 cursor-pointer"
                    />
                    {/* Custom thumb visual */}
                    <div className="absolute w-4 h-4 rounded-full bg-[#003a8c] shadow-md pointer-events-none transform -translate-x-1/2" style={{ left: `${(item.val / 20) * 100}%` }}></div>
                  </div>
                  <div className="w-12 text-right font-black text-foreground">{item.val}</div>
                </div>
              ))}
            </div>

          </div>

          {/* Secrï¿½tariat */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#001A4B] italic">Secrï¿½tariat & Documents Officiels</h2>
                <p className="text-xs text-muted-foreground">Accï¿½dez aux piï¿½ces signï¿½es ï¿½lectroniquement par la direction</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-white/5 rounded-2xl p-6 bg-white/[0.02]/50 hover:bg-white transition-colors hover:shadow-md group">
                <FileText className="w-8 h-8 text-[#003a8c] mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                <h3 className="font-bold text-foreground mb-1">Reï¿½u d'Inscription</h3>
                <p className="text-[10px] text-muted-foreground mb-4">Attestation de scolaritï¿½ validï¿½e au titre de l'annï¿½e en cours.</p>
                <div className="flex gap-2">
                  <button className="flex-1 bg-white border border-border rounded-xl py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest shadow-sm hover:bg-white/[0.02]">
                    ðŸ‘ï¸ APERï¿½U
                  </button>
                  <button className="w-10 flex items-center justify-center bg-[#003a8c] text-foreground rounded-xl shadow-sm hover:bg-[#002a66]">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/[0.02] hover:border-gray-300 transition-colors">
                <Plus className="w-8 h-8 text-[#e6007e] mb-2" />
                <h3 className="font-bold text-foreground mb-1">Autre Document ?</h3>
                <p className="text-[10px] text-muted-foreground mb-4 px-4">Faites une demande auprï¿½s du guichet unique de l'administration.</p>
                <button className="bg-[#001A4B] text-foreground px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">
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
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">MERCREDI</span>
            </div>
            <div className="relative pl-4 border-l-2 border-white/5">
              <div className="absolute w-3 h-3 bg-[#003a8c] rounded-full -left-[7px] top-2 border-2 border-white shadow-sm"></div>
              <div className="mb-1 text-xs font-bold text-[#003a8c]">10:30 - 12:15</div>
              <h3 className="text-sm font-bold text-foreground mb-1">Introduction - Gï¿½nie Informatique</h3>
              <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <MapPin className="w-3 h-3 text-rose-500" /> Amphi Ibn Khaldoun
              </div>
            </div>
          </div>

          {/* Absences */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">ASSIDUITï¿½ & ABSENCES</h2>
            <div className="grid grid-cols-3 gap-2 mb-6 text-center">
              <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                <div className="text-2xl font-black text-foreground">4</div>
                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">TOTAL</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="text-2xl font-black text-emerald-600">0</div>
                <div className="text-[8px] font-bold text-emerald-600/60 uppercase tracking-widest mt-1">JUSTIFIï¿½ES</div>
              </div>
              <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                <div className="text-2xl font-black text-rose-600">4</div>
                <div className="text-[8px] font-bold text-rose-600/60 uppercase tracking-widest mt-1">NON-JUST.</div>
              </div>
            </div>
            <div className="bg-rose-50 text-rose-700 text-xs font-bold p-3 rounded-xl border border-rose-100 flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0" /> Action requise : Justifiez vos absences
            </div>
            <button className="w-full bg-[#001A4B] text-foreground font-bold text-xs py-3.5 rounded-xl uppercase tracking-widest hover:bg-[#000d26] transition-colors">
              Dï¿½POSER UN JUSTIFICATIF â†’
            </button>
          </div>

          {/* Demandes */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">DEMANDES Rï¿½CEMMENT VALIDï¿½ES</h2>
            <div className="space-y-3">
              {[
                { title: 'Relevï¿½ de Notes', date: '07/06/2026' },
                { title: 'Attestation de Scolaritï¿½', date: '02/06/2026' },
                { title: 'Relevï¿½ de Notes', date: '02/06/2026' },
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl group hover:bg-emerald-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-600/50" />
                    <div>
                      <div className="text-xs font-bold text-foreground">{doc.title}</div>
                      <div className="text-[9px] font-bold text-gray-400 mt-0.5">{doc.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    </div>
                    <button className="w-6 h-6 bg-blue-500 text-foreground rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
