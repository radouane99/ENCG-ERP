import React from 'react';
import { Award, Share2, Briefcase, GraduationCap, Star, Zap, CheckCircle2, TrendingUp, Cpu, Users, Download, ShieldCheck } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export default function StudentPortfolio() {
  const { user } = useAuthStore();

  const skills = [
    { name: 'Marketing Digital & Stratégie', level: 95 },
    { name: 'Comptabilité & Normes IFRS', level: 85 },
    { name: 'Gestion de Projet Agile', level: 90 },
    { name: 'Finance de Marché & Analyse', level: 75 },
    { name: 'Communication & Négociation', level: 88 },
  ];

  const badges = [
    { icon: <TrendingUp className="w-5 h-5 text-amber-500" />, name: 'As du Management', desc: 'Major de promo S1', color: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300' },
    { icon: <Cpu className="w-5 h-5 text-blue-500" />, name: 'Digital Native', desc: 'Projet ERP & CRM certifié', color: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300' },
    { icon: <Users className="w-5 h-5 text-emerald-500" />, name: 'Leader Associatif', desc: 'Membre actif Club ENCG', color: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300' },
  ];

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    toast.success('🔗 Lien public du portfolio copié dans le presse-papiers !');
  };

  const handleDownloadCv = () => {
    toast.success('📄 Téléchargement du CV certifié ENCG Fès (PDF)...');
  };

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 pb-24">
      
      {/* ── Executive Hero Banner ── */}
      <div className="bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#0d1d3d] rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl border border-white/10 text-white flex flex-col md:flex-row items-center gap-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 p-1 shadow-2xl shrink-0">
          <div className="w-full h-full bg-[#001A4B] rounded-[22px] flex items-center justify-center font-black text-3xl text-amber-300">
            {user?.name?.charAt(0) || 'E'}
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" /> Profil Certifié ENCG Fès
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">{user?.name || 'Étudiant ENCG'}</h1>
          <p className="text-blue-200 text-sm font-medium">Grande École de Commerce et Gestion • Semestre 6 (GFC)</p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
            <button 
              onClick={handleShare}
              className="bg-amber-400 hover:bg-amber-300 text-[#001A4B] px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Share2 className="w-4 h-4" /> Partager mon Profil
            </button>
            <button 
              onClick={handleDownloadCv}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-300" /> Télécharger CV (PDF)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Skills & Badges */}
        <div className="md:col-span-1 space-y-8">
          
          {/* Skills Bars */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Compétences Clés</h3>
            </div>
            <div className="space-y-4">
              {skills.map((skill, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>{skill.name}</span>
                    <span className="font-mono">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-2.5">
              <Star className="w-5 h-5 text-amber-500" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Badges d'Excellence</h3>
            </div>
            <div className="space-y-3">
              {badges.map((badge, idx) => (
                <div key={idx} className={cn("p-4 rounded-2xl border flex items-center gap-3.5", badge.color)}>
                  <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-100 dark:border-slate-800">
                    {badge.icon}
                  </div>
                  <div>
                    <h4 className="font-black text-sm">{badge.name}</h4>
                    <p className="text-xs opacity-80 font-medium">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Experiences */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 h-full space-y-6">
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Parcours & Expériences Professionnelles</h3>
            </div>

            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8 pb-4">
              
              {/* Timeline Item 1 */}
              <div className="relative pl-8 space-y-1">
                <div className="absolute w-8 h-8 bg-blue-50 dark:bg-blue-950 border-2 border-blue-600 rounded-full -left-[17px] flex items-center justify-center top-0 shadow-sm text-blue-600">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">JUIL. 2026 - AOÛT 2026</span>
                <h4 className="text-base font-black text-slate-900 dark:text-white">Stage d'Immersion en Entreprise — PwC Maroc</h4>
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400">Pôle Audit Financier & Conseil</div>
                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed pt-1">
                  Participation aux missions de commissariat aux comptes, revue des états financiers IFRS et cartographie des risques opérationnels.
                </p>
              </div>

              {/* Timeline Item 2 */}
              <div className="relative pl-8 space-y-1">
                <div className="absolute w-8 h-8 bg-indigo-50 dark:bg-indigo-950 border-2 border-indigo-600 rounded-full -left-[17px] flex items-center justify-center top-0 shadow-sm text-indigo-600">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">SEPT. 2025 - JUIN 2026</span>
                <h4 className="text-base font-black text-slate-900 dark:text-white">Responsable Pôle Partenariats — Club Finance ENCG</h4>
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Vie Associative & Événementiel</div>
                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed pt-1">
                  Organisation du Forum International de la Finance réunissant plus de 600 étudiants et 15 institutions bancaires partenaires.
                </p>
              </div>

              {/* Timeline Item 3 */}
              <div className="relative pl-8 space-y-1">
                <div className="absolute w-8 h-8 bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-600 rounded-full -left-[17px] flex items-center justify-center top-0 shadow-sm text-emerald-600">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">SEPTEMBRE 2024</span>
                <h4 className="text-base font-black text-slate-900 dark:text-white">Admission Concours National TAFEM</h4>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">École Nationale de Commerce et de Gestion de Fès</div>
                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed flex items-center gap-2 pt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Validation des 4 premiers semestres avec Mention Bien.
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
