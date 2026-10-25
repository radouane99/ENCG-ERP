import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@stores/authStore';
import api from '@shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import {
Calendar,
Clock,
MapPin,
Users,
Download,
QrCode,
CheckCircle2,
RefreshCcw,CalendarDays,Shield,
Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { QRScannerModal } from '../components/QRScannerModal';
import { cn } from '@shared/lib/utils';
import { Link } from 'react-router-dom';

const DAYS = [
  { key: 1, name: 'Lundi', short: 'LUN' },
  { key: 2, name: 'Mardi', short: 'MAR' },
  { key: 3, name: 'Mercredi', short: 'MER' },
  { key: 4, name: 'Jeudi', short: 'JEU' },
  { key: 5, name: 'Vendredi', short: 'VEN' },
  { key: 6, name: 'Samedi', short: 'SAM' },
];

const TIME_SLOTS = [
  { label: '08:30 - 10:30', period: 'Matinée 1' },
  { label: '10:45 - 12:45', period: 'Matinée 2' },
  { label: '14:30 - 16:30', period: 'Après-midi 1' },
  { label: '16:45 - 18:45', period: 'Après-midi 2' },
];

export default function ProfessorSchedulePage() {
  const { user } = useAuthStore();
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'matrix' | 'list' | 'official'>('matrix');
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const profFullName = user?.name || 'Enseignant';
  const [refusalNotes, setRefusalNotes] = useState<Record<number, string>>({});
  const { data: scheduleData, refetch: refetchSchedule, isError: scheduleError } = useQuery({
    queryKey: ['professor-personal-schedule'],
    queryFn: () => api.get('/professor-portal/schedule').then(res => res.data),
  });
  const professorId = scheduleData?.professor_id;
  const allSessions = Array.isArray(scheduleData?.data) ? scheduleData.data : [];
  const activeSessions = allSessions.filter((item: any) => item.lifecycle === 'PUBLISHED').map((item: any) => ({
    ...item, session_id: item.id, title: item.module_name, location: item.room,
    group: item.group_code, time_formatted: `${item.start_time} - ${item.end_time}`,
  }));
  const proposals = allSessions.filter((item: any) => item.lifecycle === 'PROPOSED');
  const { data: matrixData, refetch: refetchMatrix, isFetching: isMatrixFetching } = useQuery({
    queryKey: ['official-timetable-matrix-prof', professorId], enabled: !!professorId,
    queryFn: () => api.get(`/timetable/export/professor/${professorId}/matrix`).then(res => res.data.data || res.data),
    staleTime: 30000,
  });
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['professor-stats'], queryFn: () => api.get('/dashboard/professor/stats').then(res => res.data.data), staleTime: 30000,
  });
  const surveillances = Array.isArray(statsData?.surveillances) ? statsData.surveillances : [];
  const profMatrixSections = Array.isArray(matrixData?.sections) ? matrixData.sections : [];
  const confirmation = useMutation({
    mutationFn: ({ id, decision }: { id: number; decision: 'confirmed' | 'refused' }) => api.post(`/professor-portal/schedules/${id}/confirm`, { decision, note: refusalNotes[id] || null }),
    onSuccess: () => { toast.success('Réponse enregistrée.'); refetchSchedule() },
    onError: (err: any) => toast.error(err.response?.data?.data?.message || err.response?.data?.message || 'Confirmation impossible.'),
  });
  const startCall = useMutation({
    mutationFn: async (session: any) => {
      const response = await api.post('/professor/attendance/start', { module_id: session.module_id, group_id: session.group_id, session_type: session.session_type, room_name: session.room });
      return { ...session, attendance_session_id: response.data.session.id, attendance_date: response.data.session.session_date };
    },
    onSuccess: session => setActiveSession(session),
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ouverture de l’appel impossible.'),
  });
  const handleRefetchAll = () => {
    refetchSchedule();
    refetchMatrix();
    refetchStats();
  };

  // Export ICS
  const handleExportIcs = async () => {
    if (!professorId) return;
    try {
      const response = await api.get(`/timetable/export/professor/${professorId}/ics`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url; link.download = 'emploi-du-temps.ics'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { toast.error('Export agenda indisponible.'); }
  };
  const handleDownloadPdf = () => {
    if (professorId) openAuthenticatedUrl(`/api/timetable/export/professor/${professorId}/pdf`);
  };
  // Get classes for matrix cell
  const getClassesForSlot = (dayKey: number, slotIndex: number) => {
    return activeSessions.filter((cls: any) => {
      const clsDay = Number(cls.day_of_week) || (cls.day_name ? DAYS.find((d) => d.name.toLowerCase() === cls.day_name.toLowerCase())?.key : 0);
      if (clsDay !== dayKey) return false;

      const rawTime = (cls.time || cls.start_time || '').toLowerCase();
      // Extract start hour (handles 14h30, 10h45, 10h30, 08:30)
      const match = rawTime.match(/(\d{1,2})[h:](\d{2})?/);
      if (!match) return slotIndex === 0;

      const startH = parseInt(match[1], 10);
      const startM = match[2] ? parseInt(match[2], 10) : 0;
      const hourDecimal = startH + startM / 60;

      if (slotIndex === 0) return hourDecimal >= 8.0 && hourDecimal < 10.4;
      if (slotIndex === 1) return hourDecimal >= 10.4 && hourDecimal < 13.5;
      if (slotIndex === 2) return hourDecimal >= 13.8 && hourDecimal < 16.5;
      if (slotIndex === 3) return hourDecimal >= 16.5 && hourDecimal < 19.5;

      return false;
    });
  };

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 pb-16">
      
      {/* ── Executive Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#001A4B] text-white flex items-center justify-center font-bold shadow-md">
              <CalendarDays className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#001A4B] dark:text-white">
                Mon Emploi du Temps Officiel
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Planning synchronisé en direct avec la matrice officielle de l'Administration · ENCG Fès
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefetchAll}
            disabled={isMatrixFetching}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <RefreshCcw className={cn("w-3.5 h-3.5 text-blue-600", isMatrixFetching && "animate-spin")} />
            Actualiser
          </button>

          <button
            onClick={handleExportIcs}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-blue-600" /> Exporter (.ics)
          </button>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#001A4B] hover:bg-[#082663] text-white text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-300" /> Télécharger PDF A4
          </button>
        </div>
      </div>

      {/* ── Summary Key Indicator Strip ── */}
      {scheduleError && <div role="alert" className="rounded-xl border border-red-200 p-4 text-red-700">Votre emploi du temps est indisponible. <button onClick={() => refetchSchedule()} className="underline">Réessayer</button></div>}
      {proposals.length > 0 && <section className="rounded-2xl border border-indigo-200 bg-white p-5 space-y-3 dark:bg-slate-900 dark:border-indigo-800" aria-labelledby="schedule-proposals">
        <h2 id="schedule-proposals" className="text-lg font-bold">Planning proposé : votre avis est attendu</h2>
        <p className="text-sm text-slate-500">Ces séances restent provisoires jusqu’à leur publication par la scolarité.</p>
        {proposals.map((session: any) => <div key={session.id} className="rounded-xl border p-3 space-y-2">
          <p className="font-semibold">{session.module_name} · {session.group_code}</p><p className="text-sm text-slate-500">{session.day_name} · {session.time} · {session.room}</p>
          <p className="text-sm">Réponse : {session.confirmation_status === 'confirmed' ? 'Confirmée' : session.confirmation_status === 'refused' ? 'Indisponibilité signalée' : 'En attente'}</p>
          <input aria-label={`Motif pour ${session.module_name}`} value={refusalNotes[session.id] || ''} onChange={event => setRefusalNotes(notes => ({ ...notes, [session.id]: event.target.value }))} placeholder="Précision ou motif d’indisponibilité" maxLength={500} className="w-full rounded-lg border p-2 text-sm dark:bg-slate-800" />
          <div className="flex flex-wrap gap-2"><button disabled={confirmation.isPending || session.confirmation_status === 'confirmed'} onClick={() => confirmation.mutate({ id: session.id, decision: 'confirmed' })} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm text-white disabled:opacity-50">Confirmer ce créneau</button><button disabled={confirmation.isPending} onClick={() => confirmation.mutate({ id: session.id, decision: 'refused' })} className="rounded-lg border px-3 py-2 text-sm">Signaler une indisponibilité</button></div>
        </div>)}
      </section>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Enseignant</span>
          <div className="text-base font-black text-[#001A4B] dark:text-white truncate">{profFullName}</div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">Corps Enseignant-Chercheur</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Séances Programmées</span>
          <div className="text-2xl font-black text-[#001A4B] dark:text-white">{activeSessions.length} séances / sem</div>
          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Synchronisé en direct
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Volume Hebdomadaire</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{Math.round(activeSessions.reduce((sum: number, item: any) => { const minutes = (time: string) => { const parts = time.split(":" ).map(Number); return parts[0] * 60 + parts[1] }; return sum + (minutes(item.end_time) - minutes(item.start_time)) / 60 }, 0) * 100) / 100} heures</div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">Créneaux d'enseignement</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Semestre & Année</span>
          <div className="text-base font-black text-[#001A4B] dark:text-white">Semestre Courant</div>
          <div className="text-[10px] font-bold text-indigo-600 mt-1">Année Universitaire 2026/2027</div>
        </div>
      </div>

      {/* ── Exam Surveillance Alert (If assigned) ── */}
      {surveillances.length > 0 && (
        <div className="bg-gradient-to-r from-[#001A4B] via-[#092868] to-[#001A4B] rounded-3xl p-6 text-white shadow-xl border border-blue-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-400/20 text-amber-300 rounded-2xl flex items-center justify-center font-black shrink-0 border border-amber-400/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-400 text-[#001A4B] rounded-full text-[10px] font-black uppercase tracking-wider">
                  Missions de Surveillance
                </span>
                <span className="text-xs text-blue-200 font-bold">{surveillances.length} séance(s)</span>
              </div>
              <h3 className="text-base font-black text-white mt-1">
                {surveillances[0]?.session_name || "Session d'Examens"}
              </h3>
              <p className="text-xs text-blue-100/80 mt-0.5">
                Prochaine surveillance : <strong className="text-white">{surveillances[0]?.module_name}</strong> le <strong>{surveillances[0]?.date}</strong> ({surveillances[0]?.time}) en <strong>{surveillances[0]?.room}</strong>
              </p>
            </div>
          </div>

          <Link
            to="/professor/proctoring"
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#001A4B] rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all shrink-0 flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" /> Voir mes Convocations
          </Link>
        </div>
      )}

      {/* ── View Mode Switcher ── */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setViewMode('matrix')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
              viewMode === 'matrix'
                ? "bg-[#001A4B] text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            )}
          >
            Vue Grille Hebdomadaire
          </button>
          <button
            onClick={() => setViewMode('official')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
              viewMode === 'official'
                ? "bg-[#001A4B] text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            )}
          >
            Vue Matrice Officielle (ENCG)
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
              viewMode === 'list'
                ? "bg-[#001A4B] text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            )}
          >
            Vue Liste Détaillée
          </button>
        </div>

        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {activeSessions.length} séance(s) hebdomadaire(s)
        </span>
      </div>

      {/* ── 1. WEEKLY MATRIX VIEW (GRID) ── */}
      {viewMode === 'matrix' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="p-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest w-36">
                  Créneau Horaire
                </th>
                {DAYS.map((day) => (
                  <th key={day.key} className="p-3 text-center text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    {day.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {TIME_SLOTS.map((slot, slotIdx) => (
                <tr key={slotIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 align-top">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-black text-blue-900 dark:text-blue-300">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {slot.label}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {slot.period}
                      </span>
                    </div>
                  </td>

                  {DAYS.map((day) => {
                    const matchedClasses = getClassesForSlot(day.key, slotIdx);
                    return (
                      <td key={day.key} className="p-2.5 align-top w-1/6">
                        {matchedClasses.length > 0 ? (
                          <div className="space-y-2">
                            {matchedClasses.map((session: any, sIdx: number) => (
                              <div
                                key={sIdx}
                                className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-800/60 border border-blue-200 dark:border-slate-700 shadow-2xs hover:shadow-md transition-all space-y-2 group"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[9px] font-black uppercase bg-[#001A4B] text-white px-2 py-0.5 rounded">
                                    {session.code || 'CM'}
                                  </span>
                                  <span className="text-[10px] font-black text-blue-900 dark:text-blue-300 font-mono">
                                    {session.time}
                                  </span>
                                </div>

                                <h4 className="font-black text-xs text-slate-900 dark:text-white leading-tight">
                                  {session.title}
                                </h4>

                                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                                  <div className="flex items-center gap-1 font-bold text-indigo-700 dark:text-indigo-300">
                                    <Users className="w-3 h-3" /> {session.group}
                                  </div>
                                  <div className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                                    <MapPin className="w-3 h-3" /> {session.location || session.room}
                                  </div>
                                </div>

                                <button
                                  onClick={() => startCall.mutate(session)} disabled={startCall.isPending}
                                  className="w-full mt-2 py-1.5 bg-[#001A4B] hover:bg-[#082663] text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-colors"
                                >
                                  <QrCode className="w-3 h-3 text-amber-300" /> Faire l'Appel (QR / Liste)
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-28 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80 flex items-center justify-center text-[11px] text-slate-300 dark:text-slate-700 font-medium">
                            Libre
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 2. OFFICIAL ENCG MATRIX VIEW (Identical to Admin Matrix) ── */}
      {viewMode === 'official' && (
        <div className="space-y-6">
          {profMatrixSections.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              Aucune affectation trouvée dans la matrice officielle.
            </div>
          ) : (
            profMatrixSections.map((section: any, idx: number) => (
              <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#001A4B] text-white text-[10px] font-black uppercase">
                        {section.filiere_code || 'FILIÈRE'}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">{section.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{section.filiere_name} · {section.semester_label}</p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
                  <table className="w-full min-w-[850px] border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                        <th className="border border-slate-200 dark:border-slate-800 p-2.5 font-black text-left">Module & Élément</th>
                        <th className="border border-slate-200 dark:border-slate-800 p-2.5 font-black text-left">Intervenant</th>
                        <th className="border border-slate-200 dark:border-slate-800 p-2.5 font-black text-center">Lundi</th>
                        <th className="border border-slate-200 dark:border-slate-800 p-2.5 font-black text-center">Mardi</th>
                        <th className="border border-slate-200 dark:border-slate-800 p-2.5 font-black text-center">Mercredi</th>
                        <th className="border border-slate-200 dark:border-slate-800 p-2.5 font-black text-center">Jeudi</th>
                        <th className="border border-slate-200 dark:border-slate-800 p-2.5 font-black text-center">Vendredi</th>
                        <th className="border border-slate-200 dark:border-slate-800 p-2.5 font-black text-center">Salles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="border border-slate-200 dark:border-slate-800 p-3 font-bold text-slate-900 dark:text-white">
                            {row.element_name || row.module_name}
                          </td>
                          <td className="border border-slate-200 dark:border-slate-800 p-3 font-black text-[#001A4B] dark:text-amber-300">
                            {row.professor_name}
                          </td>
                          {[1, 2, 3, 4, 5].map((day) => (
                            <td key={day} className="border border-slate-200 dark:border-slate-800 p-2 text-center align-middle">
                              {(row.days?.[day] || []).map((slot: string, sIdx: number) => (
                                <span key={sIdx} className="inline-block font-black text-[11px] text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800">
                                  {slot}
                                </span>
                              ))}
                            </td>
                          ))}
                          <td className="border border-slate-200 dark:border-slate-800 p-3 text-center font-bold text-rose-600 dark:text-rose-400">
                            {row.room_label}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── 3. DAY-BY-DAY LIST VIEW ── */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {DAYS.map((day) => (
              <button
                key={day.key}
                onClick={() => setSelectedDay(day.key)}
                className={cn(
                  "px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                  selectedDay === day.key
                    ? "bg-[#001A4B] text-white shadow-md"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                )}
              >
                {day.name}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-black text-[#001A4B] dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Séances du {DAYS.find((d) => d.key === selectedDay)?.name}
            </h3>

            {(() => {
              const dayClasses = activeSessions.filter((cls: any) => {
                const dayKey = selectedDay;
                return Number(cls.day_of_week) === dayKey ||
                  (cls.day_name && DAYS.find((d) => d.name.toLowerCase() === cls.day_name.toLowerCase())?.key === dayKey);
              });

              if (dayClasses.length === 0) {
                return (
                  <div className="py-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
                    <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">Aucun cours programmé pour ce jour.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Journée réservée aux travaux de recherche ou consultations.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {dayClasses.map((cls: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#001A4B] text-white flex flex-col items-center justify-center font-black shrink-0 shadow-sm">
                          <span className="text-xs text-amber-300">{cls.time?.split(' - ')[0] || cls.time}</span>
                          <span className="text-[8px] uppercase tracking-wider text-slate-300 mt-0.5">HORAIRE</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black rounded uppercase">
                              {cls.code || 'CM'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">Horaire : {cls.time}</span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">{cls.title}</h4>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
                              <Users className="w-3.5 h-3.5" /> {cls.group}
                            </span>
                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                              <MapPin className="w-3.5 h-3.5" /> {cls.location || cls.room}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => startCall.mutate(cls)} disabled={startCall.isPending}
                          className="px-5 py-2.5 bg-[#001A4B] hover:bg-[#082663] text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <QrCode className="w-4 h-4 text-amber-300" /> Faire l'Appel (QR / Liste)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Dual-Mode Attendance Modal (QR & Student Checklist) */}
      <QRScannerModal
        isOpen={!!activeSession}
        onClose={() => setActiveSession(null)}
        sessionId={activeSession?.id ?? ''}
        attendanceSessionId={activeSession?.attendance_session_id}
        attendanceDate={activeSession?.attendance_date}
        sessionData={activeSession}
      />
    </div>
  );
}
