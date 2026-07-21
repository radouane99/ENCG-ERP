import React, { useState } from 'react';
import {
  Calendar, MapPin, Users, Clock, Mail, Printer, LayoutList,
  ClipboardCheck, Activity, FileText, ChevronRight, Zap, AlertCircle, CheckCircle2, Trash2
} from 'lucide-react';
import api from '@/shared/lib/api';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { cn } from '@shared/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ExamPlanningManager() {
  const queryClient = useQueryClient();
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [selectedSession, setSelectedSession] = useState('');

  const { data: filieresData } = useQuery({
    queryKey: ['filieres'],
    queryFn: () => api.get('/filieres').then(r => r.data)
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['exam-sessions'],
    queryFn: () => api.get('/exam-sessions').then(r => r.data)
  });

  const filieres = filieresData?.data || [];
  const sessions = sessionsData?.data || [];

  const { data: examsData, isLoading: examsLoading } = useQuery({
    queryKey: ['exams', selectedFiliere, selectedSession],
    queryFn: () => api.get('/exam-planning', {
      params: { filiere_id: selectedFiliere, session_id: selectedSession }
    }).then(r => r.data),
    enabled: !!selectedFiliere && !!selectedSession
  });

  const exams = examsData?.data || [];

  const autoGenerateMutation = useMutation({
    mutationFn: () => api.post('/exam-planning/auto-generate-batch', {
      filiere_id: selectedFiliere,
      session_id: selectedSession
    }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Génération réussie');
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la génération');
    }
  });

  const resetMutation = useMutation({
    mutationFn: () => api.delete('/exam-planning/reset', {
      data: { filiere_id: selectedFiliere, session_id: selectedSession }
    }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Remise à zéro réussie');
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la remise à zéro');
    }
  });

  const handleAutoAssign = async () => {
    try {
      if (exams.length === 0) return toast.error("Aucun examen à affecter.");
      const res = await api.post(`/exam-planning/${exams[0].id}/auto-assign-proctors`);
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    } catch {
      toast.error("Erreur lors de l'affectation.");
    }
  };

  const handleGenerateConvocations = async (examId: number) => {
    try {
      const res = await api.post(`/exam-planning/${examId}/generate-convocations`);
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    } catch {
      toast.error('Erreur de génération.');
    }
  };

  const handleSendEmails = async (examId: number) => {
    try {
      const res = await api.post(`/exam-planning/${examId}/send-emails`);
      toast.success(res.data.message);
    } catch {
      toast.error("Erreur d'envoi.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 p-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestion des Examens & Convocations</h1>
            <p className="text-muted-foreground text-sm">Planification des sessions et génération des convocations.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select 
            value={selectedFiliere}
            onChange={(e) => setSelectedFiliere(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">-- Sélectionnez une filière --</option>
            {filieres.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select 
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">-- Session --</option>
            {sessions.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          
          <button 
            onClick={() => autoGenerateMutation.mutate()}
            disabled={!selectedFiliere || !selectedSession || autoGenerateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Zap className="w-4 h-4" /> {autoGenerateMutation.isPending ? 'Génération...' : 'Auto-Générer'}
          </button>
          
          <button 
            onClick={() => {
              if (confirm('Voulez-vous vraiment effacer tous les examens et convocations pour cette filière et session ?')) {
                resetMutation.mutate();
              }
            }}
            disabled={!selectedFiliere || !selectedSession || resetMutation.isPending || exams.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-50 border border-red-200"
          >
            <Trash2 className="w-4 h-4" /> Remise à zéro
          </button>
        </div>
      </div>

      {/* Auto Assign Bar */}
      <div className="flex justify-end">
        <button
          onClick={handleAutoAssign}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted hover:border-primary/30 transition-colors"
        >
          <Users className="w-4 h-4 text-primary" />
          Affectation Auto des Surveillants
        </button>
      </div>

      {/* Exam Cards */}
      <div className="space-y-4">
        {exams.map(exam => (
          <div key={exam.id} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row hover:border-primary/20 transition-colors">

            {/* Date Block */}
            <div className="bg-gradient-to-b from-primary to-secondary text-white p-6 flex flex-col items-center justify-center w-full md:w-28 shrink-0 gap-1">
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">{exam.monthLabel}</div>
              <div className="text-5xl font-black leading-none">{exam.dayLabel}</div>
              <div className="text-xs opacity-70">{exam.dayName}</div>
              <div className="mt-2 text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full">{exam.sessionLabel}</div>
            </div>

            {/* Info Block */}
            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-3">{exam.module}</h3>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5 text-primary font-medium">
                    <Users className="w-4 h-4 shrink-0" /> {exam.group}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 shrink-0" /> {exam.time} <span className="text-xs">({exam.duration})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 shrink-0" /> {exam.room}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm pt-3 border-t border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Surveillants :</span>
                {exam.proctors.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span className="font-medium text-foreground">{exam.proctors.join(', ')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-500 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Non assignés
                  </div>
                )}
              </div>
            </div>

            {/* Actions Block */}
            <div className="p-5 border-t md:border-t-0 md:border-l border-border md:w-64 flex flex-col items-stretch gap-2 shrink-0 bg-muted/20">
              {/* Convocations Count */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Convocations</span>
                <span className={cn(
                  'text-xl font-black',
                  exam.convocations_generated > 0 ? 'text-green-500' : 'text-muted-foreground'
                )}>
                  {exam.convocations_generated}
                </span>
              </div>

              <button
                onClick={() => handleGenerateConvocations(exam.id)}
                className="flex items-center justify-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                <FileText className="w-3.5 h-3.5" /> Générer Convocations
              </button>

              <button
                onClick={() => handleSendEmails(exam.id)}
                className="flex items-center justify-center gap-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                <Mail className="w-3.5 h-3.5" /> Envoyer Emails
              </button>

              <button className="flex items-center justify-center gap-1.5 bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 px-3 py-2 rounded-lg text-xs font-bold transition-colors">
                <Printer className="w-3.5 h-3.5" /> PDF Global
              </button>

              <div className="h-px bg-border my-1" />

              <Link
                to={`/academic/exam-planning/${exam.id}/affichage`}
                className="flex items-center justify-center gap-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                <LayoutList className="w-3.5 h-3.5" /> Affichage
              </Link>

              <Link
                to={`/academic/exam-planning/${exam.id}/emargement`}
                className="flex items-center justify-center gap-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                <ClipboardCheck className="w-3.5 h-3.5" /> Émargement
              </Link>

              <Link
                to={`/academic/exam-planning/${exam.id}/live`}
                className="flex items-center justify-center gap-1.5 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/20 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                <Activity className="w-3.5 h-3.5" /> Live Présences
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
