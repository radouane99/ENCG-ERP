import React from 'react';
import { Award, Share2, Briefcase, GraduationCap, Star, Zap, CheckCircle2, TrendingUp, Cpu, Users, Download } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useAuthStore } from '@/stores/authStore';

export default function StudentPortfolio() {
  const { user } = useAuthStore();

  const skills = [
    { name: 'Marketing Digital', level: 95 },
    { name: 'Comptabilité', level: 85 },
    { name: 'Gestion de Projet', level: 90 },
    { name: 'Finance de Marché', level: 75 },
    { name: 'Communication', level: 88 },
  ];

  const badges = [
    { icon: <TrendingUp className="w-5 h-5 text-amber-500" />, name: 'As du Marketing', desc: 'Major de promo S1', color: 'bg-amber-50 border-amber-200' },
    { icon: <Cpu className="w-5 h-5 text-blue-500" />, name: 'Digital Native', desc: 'Projet E-commerce validé', color: 'bg-blue-50 border-blue-200' },
    { icon: <Users className="w-5 h-5 text-emerald-500" />, name: 'Leader Associatif', desc: 'Président Club ENCG', color: 'bg-emerald-50 border-emerald-200' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#001A4B] to-[#003a8c] rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#e6007e]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-full border-4 border-white/20 bg-gradient-to-tr from-blue-400 to-emerald-400 flex items-center justify-center shadow-xl shrink-0">
            <span className="text-4xl font-black text-white">{user?.name?.charAt(0) || 'A'}</span>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              <Award className="w-3.5 h-3.5 text-yellow-400" /> Profil Vérifié ENCG
            </div>
            <h1 className="text-4xl font-black text-white mb-2">{user?.name || 'Aniss el alaoui'}</h1>
            <p className="text-blue-200 text-lg mb-6">Étudiant(e) en Commerce et Gestion â€¢ 3ème Année</p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <button className="bg-[#e6007e] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#c4006c] transition-all shadow-lg hover:shadow-[#e6007e]/25">
                <Share2 className="w-4 h-4" /> Partager mon Profil
              </button>
              <button className="bg-white/10 backdrop-blur-sm text-white border border-white/20 px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/20 transition-all">
                <Download className="w-4 h-4" /> Télécharger CV (PDF)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Skills & Badges */}
        <div className="md:col-span-1 space-y-8">
          {/* Skills Chart (Simulated with progress bars) */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-5 h-5 text-[#003a8c]" />
              <h3 className="text-[12px] font-black text-[#001A4B] uppercase tracking-widest">Hard & Soft Skills</h3>
            </div>
            <div className="space-y-5">
              {skills.map((skill, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs font-bold text-white/80 mb-2">
                    <span>{skill.name}</span>
                    <span>{skill.level}%</span>
                  </div>
                  <div className="w-full bg-white/[0.05] rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#003a8c] to-blue-400 rounded-full"
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-5 h-5 text-yellow-500" />
              <h3 className="text-[12px] font-black text-[#001A4B] uppercase tracking-widest">Badges d'Excellence</h3>
            </div>
            <div className="space-y-4">
              {badges.map((badge, idx) => (
                <div key={idx} className={cn("p-4 rounded-xl border flex items-center gap-4", badge.color)}>
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    {badge.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{badge.name}</h4>
                    <p className="text-xs text-white/70 font-medium">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Experiences */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white/5 h-full">
            <div className="flex items-center gap-3 mb-8">
              <Briefcase className="w-5 h-5 text-[#e6007e]" />
              <h3 className="text-[12px] font-black text-[#001A4B] uppercase tracking-widest">Parcours & Expériences</h3>
            </div>

            <div className="relative border-l-2 border-white/5 ml-4 space-y-10 pb-8">
              
              {/* Timeline Item 1 */}
              <div className="relative pl-8">
                <div className="absolute w-8 h-8 bg-white border-2 border-[#e6007e] rounded-full -left-[17px] flex items-center justify-center top-0 shadow-sm">
                  <Briefcase className="w-3 h-3 text-[#e6007e]" />
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">JUIL. 2026 - AUJOURD'HUI</div>
                <h4 className="text-lg font-black text-white">Stage d'Observation - Banque Populaire</h4>
                <div className="text-sm font-bold text-blue-600 mb-3">Département Marketing</div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Participation Ã  la conception de la nouvelle campagne digitale "Jeunes Actifs". Analyse des KPIs des réseaux sociaux et reporting hebdomadaire.
                </p>
              </div>

              {/* Timeline Item 2 */}
              <div className="relative pl-8">
                <div className="absolute w-8 h-8 bg-white border-2 border-[#003a8c] rounded-full -left-[17px] flex items-center justify-center top-0 shadow-sm">
                  <Users className="w-3 h-3 text-[#003a8c]" />
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">SEPT. 2025 - JUIN 2026</div>
                <h4 className="text-lg font-black text-white">Vice-Président Club Marketing ENCG</h4>
                <div className="text-sm font-bold text-blue-600 mb-3">Vie Associative</div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Organisation du "Marketing Day 2026" réunissant plus de 500 participants et 10 entreprises partenaires. Gestion d'un budget de 20 000 MAD.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="bg-white/[0.05] text-white/70 px-3 py-1 rounded-full text-xs font-bold">Leadership</span>
                  <span className="bg-white/[0.05] text-white/70 px-3 py-1 rounded-full text-xs font-bold">Event Management</span>
                </div>
              </div>

              {/* Timeline Item 3 */}
              <div className="relative pl-8">
                <div className="absolute w-8 h-8 bg-white border-2 border-emerald-500 rounded-full -left-[17px] flex items-center justify-center top-0 shadow-sm">
                  <GraduationCap className="w-3 h-3 text-emerald-500" />
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">SEPT. 2024</div>
                <h4 className="text-lg font-black text-white">Intégration ENCG</h4>
                <div className="text-sm font-bold text-blue-600 mb-3">École Nationale de Commerce et de Gestion</div>
                <p className="text-white/70 text-sm leading-relaxed flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Validation S1 & S2 avec mention Bien.
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
