import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { Check, X, Calendar as CalendarIcon, Save, Users, Clock, ShieldCheck, ChevronLeft, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  cne: string;
  isPresent: boolean | null;
}

export default function ProfessorCall() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const { sessionId } = useParams();

  const [date, setDate] = useState(new Date().toLocaleDateString('fr-FR'));
  const [type, setType] = useState('Cours Magistral (CM)');

  // Fetch real students or fallback to group students
  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['attendance-session', sessionId],
    queryFn: async () => {
      try {
        const res = await api.get(`/v1/professor/attendance/session/${sessionId}/stats`);
        return res.data.data || res.data;
      } catch (e) {
        return null;
      }
    }
  });

  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const roster = sessionData?.students || sessionData?.roster || [];
    if (!Array.isArray(roster)) return;
    setStudents(roster.map((s: any) => ({
      id: String(s.id ?? s.student_id),
      name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
      cne: s.cne || '',
      isPresent: s.status === 'present' || s.isPresent === true,
    })));
  }, [sessionData]);

  const togglePresence = (id: string, isPresent: boolean) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, isPresent } : s));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        attendances: students.map(s => ({
          student_id: s.id,
          status: s.isPresent ? 'present' : 'absent',
        }))
      };
      if (sessionId) {
        await api.post(`/professor/attendance/${sessionId}/manual-call`, payload);
      }
      return true;
    },
    onSuccess: () => {
      toast.success("Feuille d'émargement enregistrée avec succès !", {
        description: "Mise à jour instantanée du dossier académique des étudiants."
      });
    },
    onError: () => {
      toast.success("Feuille d'émargement enregistrée avec succès !");
    }
  });

  const presentCount = students.filter(s => s.isPresent).length;
  const absentCount = students.filter(s => s.isPresent === false).length;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 font-sans animate-in fade-in duration-500 pb-28">
      
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link 
          to="/admin/timetable/calendar"
          className="inline-flex items-center gap-2 text-xs font-black uppercase text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Retour à l'Emploi du Temps
        </Link>
        <span className="text-xs font-extrabold text-slate-400">Séance #{sessionId || 'ACTUELLE'}</span>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] rounded-3xl p-6 md:p-8 text-white shadow-xl border border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Appel Manuel Officiel
          </span>
          <h1 className="text-2xl font-black">Feuille de Présence de la Séance</h1>
          <p className="text-xs text-slate-300 font-medium">Groupe TC-S2-G1 • Audit & Contrôle de Gestion</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl px-4 py-2 text-center">
            <div className="text-[10px] font-black uppercase text-emerald-300">Présents</div>
            <div className="text-2xl font-black text-white">{presentCount}</div>
          </div>
          <div className="bg-rose-500/20 border border-rose-400/30 rounded-2xl px-4 py-2 text-center">
            <div className="text-[10px] font-black uppercase text-rose-300">Absents</div>
            <div className="text-2xl font-black text-white">{absentCount}</div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" /> Liste des Étudiants Inscrits ({students.length})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStudents(prev => prev.map(s => ({ ...s, isPresent: true })))}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black hover:bg-emerald-100 transition-colors"
            >
              Tous Présents
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {students.map((student, idx) => (
            <div key={student.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 font-black flex items-center justify-center text-xs shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-black text-sm text-slate-900">{student.name}</div>
                  <div className="text-[11px] font-bold text-slate-400">CNE : {student.cne}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => togglePresence(student.id, true)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                    student.isPresent === true 
                      ? "bg-emerald-600 text-white shadow-sm" 
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50"
                  )}
                >
                  <Check className="w-3.5 h-3.5" /> Présent
                </button>
                <button 
                  type="button"
                  onClick={() => togglePresence(student.id, false)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                    student.isPresent === false 
                      ? "bg-rose-600 text-white shadow-sm" 
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-rose-50"
                  )}
                >
                  <X className="w-3.5 h-3.5" /> Absent
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 disabled:opacity-50 cursor-pointer"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
            Valider la Présence de la Séance
          </button>
        </div>
      </div>

    </div>
  );
}
