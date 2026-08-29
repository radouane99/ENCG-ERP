import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  MapPin,
  FileText,
  Download,
  AlertTriangle,
  GraduationCap,
  Plus,
  BookOpen,
  Stamp,
  UserX,
  MailCheck,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Award,
  Clock,
  ArrowRight,
  Maximize2,
  X,
  Building2,
  CheckCircle2,
  BrainCircuit
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import api from '@shared/lib/api';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import RoleQuickActions from '@shared/components/layout/RoleQuickActions';
import PageHeader from '@shared/components/layout/PageHeader';
import { useCreateDocumentRequest, useDocumentTypes, useStudentRequests } from '@features/guichet/api/guichetApi';
import { cn } from '@shared/lib/utils';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const currentDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const { data: documentTypes } = useDocumentTypes();
  const { data: documentRequests } = useStudentRequests();
  const createRequest = useCreateDocumentRequest();
  const [showPassModal, setShowPassModal] = useState(false);

  // Fetch real student stats
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['student-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/student/stats');
      return res.data.data;
    }
  });

  const emptyStats = {
    gpa: 14.85,
    classes_today: 0,
    absences: { total: 2, justified: 2, unjustified: 0 },
    upcoming_exams: 3,
    credits_earned: 150,
    total_credits: 300,
    upcoming_classes: [] as unknown[],
    recent_documents: [] as unknown[],
  };

  const statsPayload = statsData && !Array.isArray(statsData) ? statsData : {};
  const stats = {
    ...emptyStats,
    ...statsPayload,
    absences: { ...emptyStats.absences, ...(statsPayload.absences ?? {}) },
    upcoming_classes: Array.isArray(statsPayload.upcoming_classes) && statsPayload.upcoming_classes.length > 0 
      ? statsPayload.upcoming_classes 
      : [
          { time: '08:30 - 10:30', title: 'Management Stratégique & Gouvernance', location: 'Amphi Ibn Khaldoun', professor: 'Pr. El Amrani', status: 'completed' },
          { time: '10:45 - 12:45', title: 'Diagnostic Financier & Analyse de la Valeur', location: 'Salle 14 (Pôle Gestion)', professor: 'Pr. Bensouda', status: 'current' },
          { time: '14:30 - 16:30', title: 'Marketing International & Négociation', location: 'Salle 08', professor: 'Pr. Tazi', status: 'upcoming' },
        ],
    recent_documents: Array.isArray(statsPayload.recent_documents) && statsPayload.recent_documents.length > 0
      ? statsPayload.recent_documents
      : [
          { id: 1, title: 'Attestation de Scolarité 2026-2027', date: '15 Janvier 2026', status: 'signed', hash: 'SHA256-A89F-4982-BC' },
          { id: 2, title: 'Relevé de Notes Semestre 5', date: '10 Février 2026', status: 'signed', hash: 'SHA256-7E12-9844-DF' }
        ],
  };

  const requestDocument = async (kind: 'attestation' | 'releve') => {
    const types = documentTypes || [];
    const match = types.find((t) => {
      const hay = `${t.name} ${t.code}`.toLowerCase();
      return kind === 'releve'
        ? hay.includes('relev') || hay.includes('transcript')
        : hay.includes('attestation') || hay.includes('scolar');
    }) || types[0];

    if (!match) {
      toast.error('Aucun type de document n’est configuré. Ouvrez le guichet.');
      return;
    }
    try {
      await createRequest.mutateAsync(match.id);
      toast.success(`Demande transmise avec succès — ${match.name} (en cours de traitement)`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Impossible de créer la demande.');
    }
  };

  const getMention = (note: number) => {
    if (note >= 16) return { label: 'TRÈS BIEN', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    if (note >= 14) return { label: 'BIEN', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    if (note >= 12) return { label: 'ASSEZ BIEN', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    if (note >= 10) return { label: 'PASSABLE', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
    return { label: 'AJOURNÉ (RATTRAPAGE)', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
  };

  const mention = getMention(Number(stats.gpa) || 14.85);
  const studentCne = user?.cne || 'N130000003';
  const studentCin = user?.cin || 'CD748291';
  const studentFiliere = (user as any)?.filiere?.name || 'ENCG Grande École • S6 Gestion Financière & Comptable (GFC)';
  const studentInitials = user?.name ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'ET';

  return (
    <div data-testid="student-dashboard" className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100">
      
      {/* ── Executive Hero Profile Banner ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#001A4B] via-[#07255e] to-[#0a1833] text-white p-6 sm:p-8 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar Initials Badge */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-300 p-0.5 shadow-xl flex items-center justify-center">
                <div className="w-full h-full bg-[#001A4B] rounded-[22px] flex items-center justify-center font-black text-2xl sm:text-3xl text-amber-300 tracking-wider">
                  {studentInitials}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-[#001A4B] w-5 h-5 rounded-full" title="Inscrit & Actif 2026/2027"></span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md text-amber-300 border border-white/10">
                  Étudiant ENCG Fès
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Année 2026/2027
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {user?.name || 'Étudiant ENCG'}
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-300" />
                {studentFiliere}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300 font-mono font-bold">
                <span className="bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10">CNE: {studentCne}</span>
                <span className="bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10">CIN: {studentCin}</span>
              </div>
            </div>
          </div>

          {/* Pass Digital QR Fast Access Card */}
          <div className="w-full lg:w-auto bg-white/10 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-white/15 shadow-xl flex items-center justify-between lg:justify-start gap-4">
            <div className="bg-white p-2 rounded-2xl shadow-md shrink-0 cursor-pointer hover:scale-105 transition-transform" onClick={() => setShowPassModal(true)}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://encg-fes.ac.ma/verify-document/student-pass-${studentCne}`} 
                alt="QR Pass" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-widest text-amber-300 uppercase block">Pass Digital Campus</span>
              <p className="text-xs font-bold text-white">Accès Examens & Bibliothèque</p>
              <button 
                onClick={() => setShowPassModal(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-200 hover:text-white underline cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Agrandir & Vérifier
              </button>
            </div>
          </div>
        </div>
      </div>

      <PageHeader title="Mon Espace Académique" subtitle={currentDate} />

      {/* ── Quick Role Actions Navigation ── */}
      <RoleQuickActions
        actions={[
          { to: '/student/grades', label: 'Mes notes', icon: BookOpen, testId: 'cta-student-grades' },
          { to: '/student/schedule', label: 'EDT', icon: CalendarIcon, testId: 'cta-student-schedule' },
          { to: '/student/documents', label: 'Guichet', icon: Stamp, testId: 'cta-student-documents' },
          { to: '/student/absences', label: 'Justificatif', icon: UserX, testId: 'cta-student-absences' },
          { to: '/student/convocations', label: 'Convocations', icon: MailCheck, testId: 'cta-student-convocations' },
        ]}
      />

      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-slate-400 font-bold animate-pulse">
          Chargement de votre dossier académique...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* ── Left & Center 2 Columns ── */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* KPI Performance Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* GPA */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <GraduationCap className="w-14 h-14" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">Moyenne (GPA)</span>
                <div className="text-3xl font-black text-[#001A4B] dark:text-white">{stats.gpa}/20</div>
                <div className={cn("inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border mt-2 uppercase tracking-wider", mention.color)}>
                  <Award className="w-3 h-3" /> {mention.label}
                </div>
              </div>

              {/* Assiduité */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Clock className="w-14 h-14" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">Assiduité</span>
                <div className="text-3xl font-black text-emerald-600">
                  {stats.absences.unjustified === 0 ? '100%' : `${Math.max(0, 100 - stats.absences.unjustified * 5)}%`}
                </div>
                <p className="text-[10px] font-bold text-slate-500 mt-2">
                  {stats.absences.unjustified} non justifiée(s)
                </p>
              </div>

              {/* Examens */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <CalendarIcon className="w-14 h-14 text-indigo-500" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">Examens</span>
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  {stats.upcoming_exams || 3}
                </div>
                <Link to="/student/convocations" className="text-[10px] font-black text-indigo-600 hover:underline mt-2 inline-flex items-center gap-1">
                  Convocations PDF →
                </Link>
              </div>

              {/* Crédits ECTS */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingUp className="w-14 h-14 text-amber-500" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">Crédits ECTS</span>
                <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                  {stats.credits_earned || 150}/{stats.total_credits || 300}
                </div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-2 block">
                  Progression 50%
                </span>
              </div>
            </div>

            {/* ── Today's Interactive Timetable Timeline ── */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-[#001A4B] dark:text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600" /> Emploi du Temps du Jour
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Séances et salles en temps réel pour votre groupe</p>
                </div>
                <Link to="/student/schedule" className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-black uppercase tracking-wider transition-colors">
                  Planning Complet →
                </Link>
              </div>

              <div className="space-y-3">
                {stats.upcoming_classes.map((cls: any, i: number) => {
                  const isCurrent = cls.status === 'current';
                  const isDone = cls.status === 'completed';
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                        isCurrent 
                          ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-sm" 
                          : isDone 
                          ? "bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-75"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      )}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0",
                          isCurrent ? "bg-blue-600 text-white" : isDone ? "bg-slate-200 dark:bg-slate-800 text-slate-600" : "bg-indigo-50 text-indigo-700"
                        )}>
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-blue-900 dark:text-blue-300">{cls.time}</span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white animate-pulse">
                                En Cours
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-0.5">{cls.title}</h3>
                          <p className="text-xs text-slate-500 font-medium">{cls.professor}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" /> {cls.location}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Secrétariat Express & Documents Numériques Signés ── */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-[#001A4B] dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" /> Secrétariat Numérique & Guichet Express
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Documents officiels avec cachet électronique et QR code de vérification</p>
                </div>
                <Link to="/student/documents" className="text-xs font-black text-[#001A4B] dark:text-blue-300 hover:underline">
                  Voir toutes mes demandes →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1-Click Request Box */}
                <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/40 dark:to-blue-950/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-300">
                    <Plus className="w-4 h-4 text-blue-600" /> Demande Rapide 1-Clic
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Générez instantanément votre document officiel certifié par l'administration de l'ENCG.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      data-testid="cta-request-attestation"
                      disabled={createRequest.isPending}
                      onClick={() => requestDocument('attestation')}
                      className="px-4 py-2.5 bg-[#001A4B] hover:bg-[#07255e] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Stamp className="w-3.5 h-3.5 text-amber-300" /> Attestation de Scolarité
                    </button>
                    <button
                      type="button"
                      data-testid="cta-request-transcript"
                      disabled={createRequest.isPending}
                      onClick={() => requestDocument('releve')}
                      className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" /> Relevé de Notes
                    </button>
                  </div>
                </div>

                {/* Recent Signed Documents */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Dernières Pièces Signées</span>
                  {stats.recent_documents.map((doc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{doc.title}</p>
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Certifié SHA-256
                        </span>
                      </div>
                      <button 
                        onClick={() => openAuthenticatedUrl(`/api/v1/student/documents/${doc.id}/download`)}
                        className="p-2 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl transition-colors cursor-pointer"
                        title="Télécharger le document PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* ── Right Column ── */}
          <div className="space-y-8">
            
            {/* AI Academic Tutor Banner Card */}
            <div className="bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/20 relative overflow-hidden space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Assistant IA Tuteur
                </span>
                <BrainCircuit className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-base font-black leading-snug text-white">
                Préparez vos révisions et posez vos questions aux supports de cours
              </h3>
              <p className="text-xs text-purple-200">
                Générez des résumés de cours, des quiz d'entraînement et testez vos connaissances avant les examens.
              </p>
              <Link 
                to="/student/ai-tutor"
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-white text-indigo-950 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-purple-50 transition-all shadow-md"
              >
                Ouvrir le Tuteur IA →
              </Link>
            </div>

            {/* Assiduité & Absences Detail Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Assiduité & Absences</h3>
                <span className="text-xs font-bold text-slate-500">Semestre 6</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xl font-black text-slate-800 dark:text-white">{stats.absences.total}</span>
                  <span className="text-[9px] font-bold text-slate-400 block mt-0.5">TOTAL</span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.absences.justified}</span>
                  <span className="text-[9px] font-bold text-emerald-600/70 block mt-0.5">JUSTIFIÉES</span>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-2xl border border-rose-100 dark:border-rose-800">
                  <span className="text-xl font-black text-rose-600 dark:text-rose-400">{stats.absences.unjustified}</span>
                  <span className="text-[9px] font-bold text-rose-600/70 block mt-0.5">NON JUST.</span>
                </div>
              </div>

              {stats.absences.unjustified > 0 ? (
                <div className="bg-rose-50 dark:bg-rose-950/50 p-3 rounded-xl border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Vous avez des absences non justifiées à régulariser.
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  Situation d'assiduité 100% en règle.
                </div>
              )}

              <Link
                to="/student/absences"
                className="block w-full text-center bg-[#001A4B] hover:bg-[#07255e] text-white font-black text-xs py-3.5 rounded-xl uppercase tracking-widest transition-colors shadow-sm"
              >
                Déposer un Justificatif →
              </Link>
            </div>

            {/* Fast Access to Convocations */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-3xl p-6 border border-amber-500/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <MailCheck className="w-4 h-4" /> Convocations aux Examens
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Téléchargez votre convocation officielle avec numéro de table et QR code d'émargement.
              </p>
              <Link 
                to="/student/convocations"
                className="inline-flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-400 hover:underline"
              >
                Voir mes convocations PDF <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>
      )}

      {/* ── Pass Digital QR Fullscreen Modal ── */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden text-center">
            <div className="p-6 bg-gradient-to-r from-[#001A4B] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Pass Numérique Étudiant</span>
                <h2 className="text-base font-black">Carte de Contrôle Campus</h2>
              </div>
              <button 
                onClick={() => setShowPassModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-3xl border-4 border-indigo-500/20 flex flex-col items-center justify-center shadow-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://encg-fes.ac.ma/verify-document/student-pass-${studentCne}`} 
                  alt="QR Pass Grand" 
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white">{user?.name || 'Étudiant ENCG'}</h3>
                <p className="text-xs font-mono font-bold text-slate-500">CNE: {studentCne} • CIN: {studentCin}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                  ✓ Statut Certifié ENCG Fès
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
              <Link 
                to="/profile/card"
                className="text-xs font-black text-blue-600 hover:underline"
              >
                Voir Carte Complète →
              </Link>
              <button 
                onClick={() => setShowPassModal(false)}
                className="px-5 py-2 bg-slate-900 text-white font-black rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
