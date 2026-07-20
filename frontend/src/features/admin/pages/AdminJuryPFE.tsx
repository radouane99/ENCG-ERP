import React from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap, CalendarDays, Users, CheckCircle2, Clock, MapPin, Search, Calendar, FileText } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function AdminJuryPFE() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const isRtl = i18n.language === 'ar';

  const soutenances = [
    { student: isRtl ? 'آية ر.' : 'Aya R.', topic: isRtl ? 'الإستراتيجية الرقمية في القطاع البنكي' : 'Stratégie Digitale dans le secteur bancaire', date: '28 Juin 2026', time: '09:00 - 10:30', room: 'Salle B12', president: 'Dr. El Fassi', encadrant: 'Dr. Benali', rapporteur: 'Dr. Tazi', status: 'SCHEDULED' },
    { student: isRtl ? 'عثمان ب.' : 'Othmane B.', topic: isRtl ? 'تحسين سلسلة التوريد عبر البلوكشين' : 'Optimisation de la Supply Chain via Blockchain', date: '28 Juin 2026', time: '11:00 - 12:30', room: 'Amphi Ibn Sina', president: 'Dr. Idrissi', encadrant: 'Dr. El Fassi', rapporteur: 'Dr. Mansour', status: 'SCHEDULED' },
    { student: isRtl ? 'كريم ل.' : 'Karim L.', topic: isRtl ? 'التدقيق المالي للمقاولات الصغرى والمتوسطة' : 'Audit financier des PME', date: '29 Juin 2026', time: '14:00 - 15:30', room: 'Salle B10', president: 'Dr. Benali', encadrant: 'Dr. Tazi', rapporteur: 'Dr. Idrissi', status: 'CONFLICT' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-[#001A4B] rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-blue-900">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-amber-500/30">
              <GraduationCap className="w-3.5 h-3.5" /> Session S10
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Jurys & Soutenances PFE</h1>
            <p className="text-blue-200 text-lg max-w-2xl">
              Planificateur algorithmique croisant les disponibilités des professeurs, les sujets des étudiants et l'occupation des salles.
            </p>
          </div>
          <div className="shrink-0 flex gap-3">
            <button className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5" /> Auto-Planifier (IA)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/5">
          <div className="text-sm font-bold text-white/50 mb-1">PFE Ã  Soutenir</div>
          <div className="text-3xl font-black text-white mb-2">385</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/5">
          <div className="text-sm font-bold text-white/50 mb-1">Professeurs Sollicités</div>
          <div className="text-3xl font-black text-[#003a8c] mb-2">42</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/5">
          <div className="text-sm font-bold text-white/50 mb-1">Conflits d'Agenda</div>
          <div className="text-3xl font-black text-rose-500 mb-2">1</div>
          <div className="text-xs font-bold text-rose-600 bg-rose-50 w-max px-2 py-0.5 rounded">À résoudre</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-white/5 flex flex-col justify-center items-center text-center">
          <button className="flex flex-col items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold">Imprimer Plannings PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white/5">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-white">Calendrier des Jurys</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Rechercher étudiant ou prof..." 
              className="bg-white/[0.02] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
        </div>

        <div className="space-y-4">
          {soutenances.map((s, i) => (
            <div key={i} className={cn(
              "p-5 rounded-2xl border transition-all hover:shadow-md",
              s.status === 'CONFLICT' ? "bg-rose-50/50 border-rose-200" : "bg-white border-white/5"
            )}>
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Time & Location */}
                <div className="shrink-0 w-48 border-r border-white/5 pr-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                    <Calendar className="w-4 h-4 text-blue-500" /> {s.date}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white/70 mb-2">
                    <Clock className="w-4 h-4 text-gray-400" /> {s.time}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white/70">
                    <MapPin className="w-4 h-4 text-gray-400" /> {s.room}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-black text-lg text-white mb-1">{s.student}</h3>
                      <p className="text-sm font-medium text-white/70 italic">"{s.topic}"</p>
                    </div>
                    {s.status === 'CONFLICT' ? (
                      <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-200">
                        Conflit Salle
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Planifié
                      </span>
                    )}
                  </div>

                  {/* Jury Members */}
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white/[0.02] border border-white/10 rounded-lg p-2.5 flex-1 min-w-[200px]">
                      <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Président du Jury</div>
                      <div className="text-sm font-bold text-[#003a8c]">{s.president}</div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/10 rounded-lg p-2.5 flex-1 min-w-[200px]">
                      <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Encadrant Pédagogique</div>
                      <div className="text-sm font-bold text-white">{s.encadrant}</div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/10 rounded-lg p-2.5 flex-1 min-w-[200px]">
                      <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Rapporteur</div>
                      <div className="text-sm font-bold text-white">{s.rapporteur}</div>
                    </div>
                  </div>

                  {s.status === 'CONFLICT' && (
                    <div className="mt-4 pt-4 border-t border-rose-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-600">Le Prof. Benali soutient déjÃ  un PFE dans la Salle B12 Ã  cette même heure.</span>
                      <button className="bg-white border border-rose-200 text-rose-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-50 transition-colors">
                        Modifier Planning
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
