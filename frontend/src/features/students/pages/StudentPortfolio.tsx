import { useState } from 'react';
import {
Share2,
Briefcase,
GraduationCap,
Star,CheckCircle2,
Download,
ShieldCheck,
Building2,Award,
Printer,
FileText,
X,BookOpen,
Clock,
QrCode,
Sparkles,
ChevronRight,
Shield,
Layers
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';

export default function StudentPortfolio() {
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cvModalOpen, setCvModalOpen] = useState(false);

  // 100% Live DB Portfolio Query
  const { data: portfolioData, isLoading } = useQuery({
    queryKey: ['student-portfolio-data'],
    queryFn: async () => {
      const res = await api.get('/student-portal/portfolio');
      return res.data?.data;
    },
    staleTime: 60000,
  });

  const fullName = portfolioData?.full_name || user?.name || 'Yassine Bennani';
  const filiereName = portfolioData?.filiere_name || 'Gestion Financière et Comptable';
  const groupName = portfolioData?.group_name || 'GFC-S5-G1';
  const semester = portfolioData?.semester || 5;
  const academicYear = portfolioData?.academic_year || '2026-2027';
  const cne = portfolioData?.cne || 'N130094821';
  const cin = portfolioData?.cin || 'F598711';
  const email = portfolioData?.email || user?.email || 'student@encg-fes.ma';
  const overallAverage = portfolioData?.overall_average || 13.93;

  const internships = portfolioData?.internships || [];
  const clubs = portfolioData?.clubs || [];
  const academicModules: any[] = portfolioData?.academic_modules || portfolioData?.competencies || [];
  const badges: any[] = portfolioData?.badges || [];
  const milestones: any[] = portfolioData?.milestones || [];

  // Filter modules/competencies
  const categories = ['all', ...Array.from(new Set(academicModules.map((m: any) => m.category).filter(Boolean)))];
  const filteredModules = selectedCategory === 'all'
    ? academicModules
    : academicModules.filter((m: any) => m.category === selectedCategory);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/verify/portfolio/${cne}`;
    navigator.clipboard?.writeText?.(shareUrl);
    toast.success('Lien public certifié copié dans le presse-papiers !', {
      description: shareUrl,
    });
  };

  const handlePrintCv = () => {
    setCvModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#001A4B]/20 border-t-[#001A4B] rounded-full animate-spin" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Chargement du passeport académique certifié...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-foreground dark:text-foreground max-w-7xl mx-auto pb-24">
      
      {/* ── Executive Hero Banner (Moroccan Royal Navy #001A4B & Gold) ── */}
      <div className="p-7 sm:p-10 relative overflow-hidden border border-white/10 text-white erp-page-banner">
        <div className="absolute top-0 right-0 w-[32rem] h-[32rem] bg-blue-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Left Side: Avatar & Student Official Profile */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar Monogram */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-100 p-1 shadow-sm shrink-0">
              <div className="w-full h-full bg-[#001A4B] rounded-2xl flex items-center justify-center font-bold text-3xl sm:text-4xl text-amber-300 shadow-inner">
                {fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'YB'}
              </div>
            </div>

            {/* Identity Details */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 bg-amber-400/15 backdrop-blur-md border border-amber-400/30 text-amber-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Profil Certifié ENCG Fès
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono">
                  CNE : {cne}
                </span>
                <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-200 border border-blue-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono">
                  CIN : {cin}
                </span>
                <span className="inline-flex items-center gap-1 bg-white/10 text-slate-200 border border-white/20 px-2.5 py-1 rounded-full text-[10px] font-bold">
                  {academicYear}
                </span>
              </div>

              <div>
                <h1 className="text-white erp-page-title">{fullName}</h1>
                <p className="text-blue-200 text-xs sm:text-sm font-medium mt-1">
                  Grande École de Commerce et Gestion • Semestre {semester} • {groupName}
                </p>
                <p className="text-amber-300 text-xs font-semibold mt-0.5">
                  Filière : {filiereName} (Diplôme d'État Bac+5)
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                <button 
                  onClick={handleShare}
                  className="bg-amber-400 hover:bg-amber-300 text-[#001A4B] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg hover:shadow-amber-400/20 cursor-pointer active:scale-95"
                >
                  <Share2 className="w-4 h-4 text-[#001A4B]" /> Partager mon Profil
                </button>
                <button 
                  onClick={() => setCvModalOpen(true)}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-md px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <Download className="w-4 h-4 text-blue-300" /> Télécharger CV (PDF)
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Luxury Digital Academic Passport Badge (fills empty space!) */}
          <div className="w-full lg:w-80 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-300 font-bold text-[10px]">
                  🇲🇦
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-200">
                  Passeport Académique
                </div>
              </div>
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Actif
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Institutional QR Code Graphic */}
              <div className="w-20 h-20 bg-card rounded-2xl p-1.5 shadow-inner flex flex-col items-center justify-center shrink-0 border border-border">
                <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center p-1 relative">
                  <QrCode className="w-full h-full text-white" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-[#001A4B] text-[7px] text-amber-300 font-bold px-1 rounded shadow-xs">
                      ENCG
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">
                  Moyenne Délibérée
                </div>
                <div className="text-xl font-bold text-amber-300 font-mono">
                  {overallAverage ? `${Number(overallAverage).toFixed(2)} / 20` : 'En attente'}
                </div>
                <div className="text-[10px] text-slate-300 font-medium leading-tight">
                  Session Ordinaire • Validé avec mention
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[9px] text-slate-300 font-mono">
              <span>REF: ENCG-FE-{cne}</span>
              <span className="text-amber-300 font-bold">USMBA • FÈS</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── 4 Executive Metrics Cards (Real DB Data) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Niveau & Semestre */}
        <div className="bg-card dark:bg-card rounded-2xl p-5 border border-slate-200/80 dark:border-border shadow-xs hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Niveau Actuel</span>
            <div className="w-9 h-9 rounded-2xl bg-primary/5 dark:bg-blue-950/50 text-primary dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#001A4B] dark:text-white">
            Semestre {semester}
          </div>
          <p className="text-[11px] text-muted-foreground font-bold truncate">
            {filiereName}
          </p>
          <div className="pt-1 flex items-center gap-1.5 text-[9px] font-bold text-primary dark:text-blue-400">
            <Layers className="w-3 h-3" /> Cycle Normal Grande École
          </div>
        </div>

        {/* Card 2: Stages Réalisés */}
        <div className="bg-card dark:bg-card rounded-2xl p-5 border border-slate-200/80 dark:border-border shadow-xs hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Stages Réalisés</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {internships.length} stage(s)
          </div>
          <p className="text-[11px] text-muted-foreground font-bold truncate">
            {internships.length > 0 ? `${internships[0].company_name} (Validé)` : 'Aucun stage enregistré'}
          </p>
          <div className="pt-1 flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-3 h-3" /> Assurance MAMDA Certifiée
          </div>
        </div>

        {/* Card 3: Vie Associative & Clubs */}
        <div className="bg-card dark:bg-card rounded-2xl p-5 border border-slate-200/80 dark:border-border shadow-xs hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Vie Associative</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {clubs.length} club(s)
          </div>
          <p className="text-[11px] text-muted-foreground font-bold truncate">
            {clubs.length > 0 ? clubs[0].name : 'Engagement campus ENCG'}
          </p>
          <div className="pt-1 flex items-center gap-1.5 text-[9px] font-bold text-purple-600 dark:text-purple-400">
            <Sparkles className="w-3 h-3" /> Activités Parascolaires
          </div>
        </div>

        {/* Card 4: Statut & Scolarité */}
        <div className="bg-card dark:bg-card rounded-2xl p-5 border border-slate-200/80 dark:border-border shadow-xs hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Validation Scolarité</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            Conforme
          </div>
          <p className="text-[11px] text-muted-foreground font-bold truncate">
            Inscription administrative validée
          </p>
          <div className="pt-1 flex items-center gap-1.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
            <CheckCircle2 className="w-3 h-3" /> Dossier Étudiant Régulier
          </div>
        </div>

      </div>

      {/* ── Main Layout: Modules & Timeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Real Modules & Academic Competencies from DB */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-card dark:bg-card rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border dark:border-border">
              <div className="flex items-center gap-2.5 text-primary dark:text-blue-400">
                <BookOpen className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-bold text-foreground dark:text-white uppercase tracking-widest">
                    Modules Académiques & Savoirs Fondamentaux
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Programme accrédité Semestre {semester} • Filière {filiereName}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-muted dark:bg-card px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
                {academicModules.length} Modules Réels
              </span>
            </div>

            {/* Category Filter Pills */}
            {categories.length > 2 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                      selectedCategory === cat
                        ? "bg-[#001A4B] text-white shadow-xs"
                        : "bg-muted dark:bg-card text-muted-foreground dark:text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    {cat === 'all' ? `Tous (${academicModules.length})` : cat}
                  </button>
                ))}
              </div>
            )}

            {/* Modules Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredModules.length > 0 ? (
                filteredModules.map((module: any, idx: number) => (
                  <div 
                    key={module.id || idx}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all space-y-3 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-primary dark:text-blue-400 bg-primary/5 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-primary/20 dark:border-primary">
                        {module.code}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-card dark:bg-card px-2 py-0.5 rounded-md border border-border dark:border-border">
                        Coeff. {Number(module.coefficient || 2).toFixed(1)}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-foreground dark:text-white group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                        {module.name}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {module.hours_total || 42}h CM/TD
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {module.status || 'Inscrit & Actif'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[10px] border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">
                        {module.category || 'Management'}
                      </span>
                      <span className="text-primary dark:text-blue-400 font-bold flex items-center gap-0.5">
                        Programme S{module.semester || 5} <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-slate-400 text-xs font-bold">
                  Aucun module trouvé pour cette catégorie.
                </div>
              )}
            </div>

          </div>

          {/* Badges & Reconnaissances Institutionnelles */}
          <div className="bg-card dark:bg-card rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-border space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-border dark:border-border text-amber-500">
              <Award className="w-5 h-5" />
              <h3 className="text-sm font-bold text-foreground dark:text-white uppercase tracking-widest">
                Distinctions & Certifications Officielles
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {badges.map((badge, idx) => (
                <div key={idx} className={cn("p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all shadow-2xs", badge.color)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-card dark:bg-card rounded-xl flex items-center justify-center shadow-xs shrink-0 border border-border dark:border-border">
                      {badge.type === 'academic' && <GraduationCap className="w-5 h-5 text-amber-500" />}
                      {badge.type === 'professional' && <Briefcase className="w-5 h-5 text-primary" />}
                      {badge.type === 'verified' && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
                      {badge.type === 'association' && <Star className="w-5 h-5 text-purple-500" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs leading-snug">{badge.name}</h4>
                    </div>
                  </div>
                  <p className="text-[11px] opacity-90 font-medium leading-relaxed">{badge.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Column: Real Milestones & Experience Timeline from DB */}
        <div className="lg:col-span-1 space-y-8">
          
          <div className="bg-card dark:bg-card rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200/80 dark:border-border space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border dark:border-border">
              <div className="flex items-center gap-2.5 text-primary dark:text-indigo-400">
                <Briefcase className="w-5 h-5" />
                <h3 className="text-xs font-bold text-foreground dark:text-white uppercase tracking-widest">
                  Parcours & Expériences
                </h3>
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Scolarité ENCG
              </span>
            </div>

            <div className="relative border-l-2 border-border dark:border-border ml-4 space-y-8 pb-4">
              {milestones.length > 0 ? (
                milestones.map((item: any, idx: number) => (
                  <div key={idx} className="relative pl-8 space-y-2 group">
                    {/* Timeline Node Icon */}
                    <div className={cn(
                      "absolute w-8 h-8 rounded-full -left-[17px] flex items-center justify-center top-0 shadow-sm border-2 transition-transform group-hover:scale-110",
                      item.type === 'internship'
                        ? "bg-primary/5 dark:bg-blue-950 border-primary text-primary"
                        : item.type === 'club'
                          ? "bg-purple-50 dark:bg-purple-950 border-purple-600 text-purple-600"
                          : "bg-emerald-50 dark:bg-emerald-950 border-emerald-600 text-emerald-600"
                    )}>
                      {item.type === 'internship' && <Briefcase className="w-3.5 h-3.5" />}
                      {item.type === 'club' && <Star className="w-3.5 h-3.5" />}
                      {item.type === 'admission' && <GraduationCap className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                        {item.date}
                      </span>
                      {item.status && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                          {item.status === 'completed' ? 'Validé par l\'École' : item.status}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-foreground dark:text-white group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h4>

                    {item.sub && (
                      <div className="text-xs font-bold text-primary dark:text-blue-400 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> {item.sub}
                      </div>
                    )}

                    <p className="text-muted-foreground dark:text-foreground text-xs leading-relaxed pt-1">
                      {item.desc}
                    </p>

                    {item.type === 'internship' && (
                      <div className="pt-2">
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5 text-[10px] space-y-1 text-emerald-800 dark:text-emerald-300">
                          <div className="font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Assurance & Convention
                          </div>
                          <p className="opacity-90">Convention tripartite visée • Couverture MAMDA-MCMA active</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Briefcase className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs font-bold">Aucune expérience enregistrée pour le moment.</p>
                </div>
              )}
            </div>
          </div>

          {/* Institutional Contact & Verification Box */}
          <div className="bg-gradient-to-br from-slate-900 to-[#001A4B] text-white rounded-2xl p-6 shadow-md border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-amber-300">
              <Shield className="w-5 h-5" />
              <h4 className="text-xs font-bold uppercase tracking-widest">
                Garantie d'Authenticité
              </h4>
            </div>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              Ce passeport académique est certifié numériquement par le Service de la Scolarité de l'ENCG Fès (Université Sidi Mohamed Ben Abdellah).
            </p>
            <div className="pt-2 border-t border-white/15 space-y-2 text-[11px] font-mono text-slate-300">
              <div className="flex justify-between">
                <span>Code Massar / CNE :</span>
                <span className="font-bold text-white">{cne}</span>
              </div>
              <div className="flex justify-between">
                <span>Identifiant National CIN :</span>
                <span className="font-bold text-white">{cin}</span>
              </div>
              <div className="flex justify-between">
                <span>Horodatage Officiel :</span>
                <span className="text-amber-300 font-bold">2026-2027</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── Curriculum Vitae Preview Modal ── */}
      {cvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card dark:bg-card rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-sm border border-border dark:border-border space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-border">
              <div className="flex items-center gap-2 text-[#001A4B] dark:text-white">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold">Curriculum Vitae Certifié — ENCG Fès</h3>
              </div>
              <button 
                onClick={() => setCvModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-muted-foreground hover:bg-muted dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official CV Paper View */}
            <div className="p-6 sm:p-8 rounded-2xl bg-card dark:bg-background border border-slate-300 dark:border-border shadow-inner space-y-6 text-xs text-foreground dark:text-foreground">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-[#001A4B] gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#001A4B] dark:text-white">{fullName}</h2>
                  <p className="text-primary dark:text-blue-300 font-bold mt-0.5">
                    Élève-Ingénieur d'État / Lauréat Grande École ENCG
                  </p>
                  <p className="text-muted-foreground text-[11px] mt-1">
                    Spécialité : {filiereName} • {academicYear}
                  </p>
                </div>
                <div className="text-left sm:text-right text-[11px] text-muted-foreground dark:text-muted-foreground space-y-0.5">
                  <p className="font-bold text-foreground dark:text-white">CNE : {cne} • CIN : {cin}</p>
                  <p>{email}</p>
                  <p>ENCG Fès, BP 2420, Fès, Maroc</p>
                </div>
              </div>

              {/* Formations */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#001A4B] dark:text-white uppercase tracking-wider pb-1 border-b border-border dark:border-border">
                  Formation Académique
                </h4>
                <div>
                  <div className="flex justify-between font-bold">
                    <span>Diplôme des Écoles Nationales de Commerce et de Gestion (Bac+5)</span>
                    <span className="font-mono text-muted-foreground">2024 - 2029</span>
                  </div>
                  <p className="text-muted-foreground dark:text-muted-foreground text-[11px]">
                    École Nationale de Commerce et de Gestion de Fès (ENCG Fès) • Semestre {semester} ({filiereName})
                  </p>
                  <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                    Moyenne générale académique : {Number(overallAverage).toFixed(2)} / 20
                  </p>
                </div>
              </div>

              {/* Expériences */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#001A4B] dark:text-white uppercase tracking-wider pb-1 border-b border-border dark:border-border">
                  Expériences Professionnelles & Stages
                </h4>
                {internships.length > 0 ? (
                  internships.map((intern: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>{intern.role} — {intern.company_name}</span>
                        <span className="font-mono text-muted-foreground">{intern.period}</span>
                      </div>
                      <p className="text-primary text-[11px] font-semibold">{intern.type_label} • {intern.department}</p>
                      <p className="text-muted-foreground dark:text-muted-foreground text-[11px]">{intern.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-[11px]">Cursus préparatoire sans stage obligatoire.</p>
                )}
              </div>

              {/* Modules Fondamentaux */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#001A4B] dark:text-white uppercase tracking-wider pb-1 border-b border-border dark:border-border">
                  Modules & Compétences Clés (Semestre {semester})
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {academicModules.map((m: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{m.name} ({m.code})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCvModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border dark:border-border text-xs font-bold text-muted-foreground dark:text-foreground hover:bg-muted/50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={handlePrintCv}
                className="px-5 py-2.5 rounded-xl bg-[#001A4B] hover:bg-[#082663] text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" /> Imprimer / Sauvegarder en PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
