import React from 'react';
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
  MailCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import api from '@shared/lib/api';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import RoleQuickActions from '@shared/components/layout/RoleQuickActions';
import PageHeader from '@shared/components/layout/PageHeader';
import { documentStatusLabel } from '@shared/lib/lmd';
import { useCreateDocumentRequest, useDocumentTypes, useStudentRequests } from '@features/guichet/api/guichetApi';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const currentDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const { data: documentTypes } = useDocumentTypes();
  const { data: documentRequests } = useStudentRequests();
  const createRequest = useCreateDocumentRequest();

  // Fetch real stats
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['student-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/student/stats');
      return res.data.data;
    }
  });

  const emptyStats = {
    gpa: 0,
    classes_today: 0,
    absences: { total: 0, justified: 0, unjustified: 0 },
    upcoming_exams: 0,
    upcoming_classes: [] as unknown[],
    recent_documents: [] as unknown[],
  }
  const statsPayload = statsData && !Array.isArray(statsData) ? statsData : {}
  const stats = {
    ...emptyStats,
    ...statsPayload,
    absences: { ...emptyStats.absences, ...(statsPayload.absences ?? {}) },
    upcoming_classes: Array.isArray(statsPayload.upcoming_classes) ? statsPayload.upcoming_classes : [],
    recent_documents: Array.isArray(statsPayload.recent_documents) ? statsPayload.recent_documents : [],
  }

  const requestDocument = async (kind: 'attestation' | 'releve') => {
    const types = documentTypes || []
    const match = types.find((t) => {
      const hay = `${t.name} ${t.code}`.toLowerCase()
      return kind === 'releve'
        ? hay.includes('relev') || hay.includes('transcript')
        : hay.includes('attestation') || hay.includes('scolar')
    }) || types[0]
    if (!match) {
      toast.error('Aucun type de document n’est configuré. Ouvrez le guichet.')
      return
    }
    try {
      await createRequest.mutateAsync(match.id)
      toast.success(`Demande envoyée — ${match.name} (en attente)`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Impossible de créer la demande.')
    }
  }

  const getMention = (note: number) => {
    if (note >= 16) return 'TRES BIEN';
    if (note >= 14) return 'BIEN';
    if (note >= 12) return 'ASSEZ BIEN';
    if (note >= 10) return 'PASSABLE';
    return 'AJOURNÉ';
  };

  return (
    <div data-testid="student-dashboard" className="space-y-6 font-sans animate-in fade-in zoom-in duration-500 dark:text-slate-100">
      <PageHeader title="Mon Espace Académique" subtitle={currentDate} />
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
        <div className="flex justify-center items-center py-20 text-slate-400">Chargement des données...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-border relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><GraduationCap className="w-16 h-16" /></div>
                <div className="text-sm font-bold text-muted-foreground mb-4">Moyenne (GPA)</div>
                <div className="text-4xl font-black text-primary dark:text-white">{stats.gpa}</div>
                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-2">{getMention(stats.gpa)}</div>
              </div>

              <div className="bg-gradient-to-br from-primary to-blue-800 rounded-3xl p-6 shadow-lg shadow-blue-500/20 relative overflow-hidden group text-white">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                <div className="text-sm font-bold text-white/70 mb-4">Prochains Examens</div>
                <div className="text-4xl font-black text-white">{stats.upcoming_exams || 0}</div>
                <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mt-2">DANS LES 30 JOURS</div>
              </div>
            </div>

            {/* Mon Pass Examen Digital Widget */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                      Pass Examen Digital
                    </span>
                    <span className="text-xs text-indigo-300 font-semibold">• ENCG Fès</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white">
                    {user?.name || 'Étudiant ENCG'}
                  </h3>
                  <p className="text-xs text-slate-300 flex flex-wrap items-center gap-3">
                    <span className="font-mono bg-white/10 px-2 py-0.5 rounded font-bold">CNE: {user?.cne || 'N130000003'}</span>
                    {user?.cin && <span className="font-mono bg-white/10 px-2 py-0.5 rounded font-bold">CIN: {user?.cin}</span>}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-full md:w-auto">
                  <div className="w-16 h-16 bg-white rounded-xl p-1.5 shrink-0 flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=ENCG-${user?.cne || 'STD-2026'}`} 
                      alt="QR Pass" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">Prochain Examen</span>
                    <p className="text-xs font-bold text-white">Management Stratégique</p>
                    <p className="text-[11px] text-slate-300">📅 25 Juin • 09:00 (Amphi Ibn Khaldoun)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Secrétariat */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-primary dark:text-white">Secrétariat & Documents Officiels</h2>
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
                <div className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <Plus className="w-8 h-8 text-[#e6007e] mb-2" />
                  <h3 className="font-bold text-[#001A4B] mb-1">Attestation / relevé 1 clic</h3>
                  <p className="text-[10px] text-muted-foreground mb-4 px-4">Demande envoyée au guichet unique.</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      data-testid="cta-request-attestation"
                      disabled={createRequest.isPending}
                      onClick={() => requestDocument('attestation')}
                      className="bg-[#001A4B] text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                    >
                      Attestation
                    </button>
                    <button
                      type="button"
                      data-testid="cta-request-transcript"
                      disabled={createRequest.isPending}
                      onClick={() => requestDocument('releve')}
                      className="bg-white border border-[#001A4B] text-[#001A4B] px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                    >
                      Relevé
                    </button>
                  </div>
                  {(documentRequests || []).slice(0, 3).map((req) => (
                    <p key={req.id} className="text-[10px] mt-2 text-slate-500">
                      {req.document_type?.name || (typeof req.document_type === 'string' ? req.document_type : 'Document')} — {documentStatusLabel(req.status)}
                    </p>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Agenda */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black text-primary dark:text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" /> Agenda d'Aujourd'hui
                </h2>
                <a href="/student/schedule" className="text-xs font-bold text-[#e6007e] hover:underline">
                  Voir tout l'emploi du temps →
                </a>
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-border">
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
              <Link
                to="/student/absences"
                className="block w-full text-center bg-[#001A4B] text-white font-bold text-xs py-3.5 rounded-xl uppercase tracking-widest hover:bg-[#000d26] transition-colors"
              >
                DÉPOSER UN JUSTIFICATIF →
              </Link>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
