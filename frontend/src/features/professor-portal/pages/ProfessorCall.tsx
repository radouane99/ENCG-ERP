import { useState,useEffect } from 'react';
import { useParams,Link } from 'react-router-dom';
import { Check,X,Save,Users,ShieldCheck,ChevronLeft,Loader2 } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery,useMutation } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  cne: string;
  isPresent: boolean | null; version: number; originalStatus: string; changed?: boolean;
}

export default function ProfessorCall() {
  const { sessionId } = useParams();

  // Fetch real students or fallback to group students
  const { data: sessionData, isError, isPending, refetch } = useQuery({
    queryKey: ['attendance-session', sessionId],
    queryFn: async () => {
      const res = await api.get('/professor/attendance/students', { params: { attendance_session_id: sessionId } });
      return { students: res.data.data };
    }
  });

  const [dirty, setDirty] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (dirty) return;
    const roster = sessionData?.students || [];
    if (!Array.isArray(roster)) return;
    setStudents(roster.map((s: any) => ({
      id: String(s.id ?? s.student_id), version: Number(s.version ?? 0),
      name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
      cne: s.cne || '',
      originalStatus: s.status || 'absent', isPresent: ['late', 'excused'].includes(s.status) ? null : s.status === 'present' || s.isPresent === true,
    })));
  }, [sessionData, dirty]);

  const togglePresence = (id: string, isPresent: boolean) => {
    setDirty(true); setStudents(prev => prev.map(s => s.id === id ? { ...s, isPresent, changed: true } : s));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        session_id: Number(sessionId), close_session: false, records: students.map(s => ({
          student_id: Number(s.id), version: s.version,
          status: s.changed ? (s.isPresent ? 'present' : 'absent') : s.originalStatus,
        }))
      };
      if (sessionId) {
        await api.post('/professor/attendance/save', payload);
      }
      return true;
    },
    onSuccess: async () => { await refetch(); setDirty(false);
      toast.success("Feuille d'émargement enregistrée avec succès !", {
        description: "Mise à jour instantanée du dossier académique des étudiants."
      });
    },
    onError: (error: any) => { toast.error(error.response?.data?.message || 'Enregistrement impossible. Vos choix restent visibles.');
    }
  });

  const presentCount = students.filter(s => s.isPresent).length;
  const absentCount = students.filter(s => s.isPresent === false).length;

  if (isError) return <p role='alert' className='p-5'>Impossible de charger la liste officielle de cette séance.</p>;
  if (isPending) return <p role='status' className='p-5'>Chargement de la liste…</p>;
  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans animate-in fade-in duration-500 pb-28">
      
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link 
          to="/admin/timetable/calendar"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase text-primary hover:text-primary bg-primary/5 px-4 py-2 rounded-xl border border-primary/20 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Retour à l'Emploi du Temps
        </Link>
        <span className="text-xs font-bold text-slate-400">Séance #{sessionId || 'ACTUELLE'}</span>
      </div>

      {/* Hero Card */}
      <div className="p-6 md:p-8 text-white border border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-6 erp-page-banner">
        <div className="space-y-1">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Appel Manuel Officiel
          </span>
          <h1 className="erp-page-title">Feuille de Présence de la Séance</h1>
          <p className="text-xs text-slate-300 font-medium">Étudiants rattachés à cette séance officielle</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl px-4 py-2 text-center">
            <div className="text-[10px] font-bold uppercase text-emerald-300">Présents</div>
            <div className="text-2xl font-bold text-white">{presentCount}</div>
          </div>
          <div className="bg-rose-500/20 border border-rose-400/30 rounded-2xl px-4 py-2 text-center">
            <div className="text-[10px] font-bold uppercase text-rose-300">Absents</div>
            <div className="text-2xl font-bold text-white">{absentCount}</div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-base font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Liste des Étudiants Inscrits ({students.length})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setDirty(true); setStudents(prev => prev.map(s => ({ ...s, isPresent: true, changed: true }))) }}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
            >
              Tous Présents
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {students.map((student, idx) => (
            <div key={student.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-muted/50 border border-slate-200/80 hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">{student.name}</div>
                  <div className="text-[11px] font-bold text-slate-400">CNE : {student.cne}</div>
                  {!student.changed && ['late', 'excused'].includes(student.originalStatus) && <span className="text-xs text-amber-800">{student.originalStatus === 'late' ? 'Retard enregistré' : 'Dispense enregistrée'}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => togglePresence(student.id, true)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                    student.isPresent === true 
                      ? "bg-emerald-600 text-white shadow-sm" 
                      : "bg-card text-muted-foreground border border-border hover:bg-emerald-50"
                  )}
                >
                  <Check className="w-3.5 h-3.5" /> Présent
                </button>
                <button 
                  type="button"
                  onClick={() => togglePresence(student.id, false)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                    student.isPresent === false 
                      ? "bg-rose-600 text-white shadow-sm" 
                      : "bg-card text-muted-foreground border border-border hover:bg-rose-50"
                  )}
                >
                  <X className="w-3.5 h-3.5" /> Absent
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-border flex justify-end">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !students.length}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 disabled:opacity-50 cursor-pointer"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
            Valider la Présence de la Séance
          </button>
        </div>
      </div>

    </div>
  );
}
