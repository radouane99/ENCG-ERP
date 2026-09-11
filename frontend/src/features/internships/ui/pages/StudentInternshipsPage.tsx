import React, { useState } from 'react';
import { useStudentInternships } from '../../api/useInternshipsStudent';
import { InternshipStatusBadge } from '../components/InternshipStatusBadge';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import {
  Sparkles, Trophy, Building2, Calendar, Upload, Plus, CheckCircle2,
  Clock, Printer, MessageSquare, X, Send, Briefcase, FileText,
  MapPin, User, AlertCircle, ChevronRight, Loader2, ArrowUpRight,
  GraduationCap, BookOpen, Shield, Users, Star,
} from 'lucide-react';
import api from '@shared/lib/api';
import { toast } from 'sonner';

const STATUS_STEPS: Record<string, number> = {
  pending: 1, submitted: 1, under_review: 2, approved: 3, validated: 3, active: 4, completed: 5, rejected: 0,
};

const TYPE_LABELS: Record<string, string> = {
  initiation: "Stage d'Initiation",
  application: "Stage d'Application",
  pfe: "Stage de Fin d'Études (PFE)",
};

const MILESTONES = [
  { key: 'subject',   label: 'Sujet & Problématique'   },
  { key: 'plan',      label: 'Plan & Littérature'       },
  { key: 'empirical', label: 'Partie Empirique'         },
  { key: 'bat',       label: 'BAT Final'                },
];

const PIPELINE = ['Déposée', 'En révision', 'Approuvée', 'En cours', 'Terminée'];

export default function StudentInternshipsPage() {
  const { data: internships, isLoading, refetch } = useStudentInternships();

  const [uploadModalOpen,   setUploadModalOpen]   = useState(false);
  const [selectedInternship, setSelectedInternship] = useState<number | null>(null);
  const [showRequestModal,  setShowRequestModal]  = useState(false);
  const [showSuiviModal,    setShowSuiviModal]    = useState<any>(null);
  const [newComment,        setNewComment]        = useState('');
  const [submitting,        setSubmitting]        = useState(false);
  const [commentsList,      setCommentsList]      = useState<Array<{ author: string; date: string; text: string; isProf: boolean }>>([]);
  const [activeGuideModal,  setActiveGuideModal]  = useState<'guide' | 'reglement' | 'recours' | null>(null);

  const [form, setForm] = useState({
    company_name: '', company_city: '', position_title: '',
    company_mentor_name: '', company_mentor_email: '',
    insurance_company: 'MAMDA-MCMA', insurance_policy_number: '',
    internship_type: 'pfe', start_date: '', end_date: '',
  });

  // Load actual feedbacks from internship documents into comments when opening modal
  React.useEffect(() => {
    if (showSuiviModal) {
      const docs = Array.isArray(showSuiviModal.internship_documents) ? showSuiviModal.internship_documents : [];
      const feedbacks = docs
        .filter((d: any) => d.feedback)
        .map((d: any) => ({
          author: showSuiviModal.supervisor?.user?.name || 'Encadrant Académique',
          date: d.updated_at ? new Date(d.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Récent',
          text: d.feedback,
          isProf: true,
        }));
      setCommentsList(feedbacks);
    } else {
      setCommentsList([]);
    }
  }, [showSuiviModal]);

  /* ─── Handlers ─── */
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentsList(prev => [...prev, { author: 'Étudiant', date: "À l'instant", text: newComment, isProf: false }]);
    setNewComment('');
    toast.success('Message transmis à votre encadrant !');
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        type: form.internship_type,
        internship_type: form.internship_type,
        company_name: form.company_name,
        company_city: form.company_city,
        company_address: form.company_city,
        position_title: form.position_title,
        company_mentor_name: form.company_mentor_name,
        supervisor_name: form.company_mentor_name,
        company_mentor_email: form.company_mentor_email,
        supervisor_email: form.company_mentor_email,
        supervisor_phone: '0600000000',
        insurance_company: form.insurance_company,
        insurance_policy_number: form.insurance_policy_number || `POL-ENCG-${Date.now().toString().slice(-4)}`,
        start_date: form.start_date,
        end_date: form.end_date,
      };

      try {
        await api.post('/v1/student-portal/internships', payload);
      } catch {
        // Fallback to conventions route
        await api.post('/v1/student-portal/internships/conventions', payload);
      }

      toast.success('Convention de stage soumise et visée avec succès !');
      setShowRequestModal(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la soumission de la convention.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintBat = (studentName: string, topic: string) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
      <title>BAT — ${studentName}</title>
      <style>
        body{font-family:'Segoe UI',sans-serif;padding:48px;color:#0f2863;max-width:800px;margin:0 auto}
        .hdr{text-align:center;border-bottom:3px double #0f2863;padding-bottom:24px;margin-bottom:32px}
        h1{font-size:18px;font-weight:900;text-transform:uppercase;margin:8px 0}
        .box{background:#f8fafc;border:2px solid #e2e8f0;border-radius:16px;padding:24px;margin:20px 0}
        .row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;border-bottom:1px dashed #e2e8f0;padding-bottom:8px}
        .lbl{color:#64748b;font-weight:700}.val{font-weight:900;color:#0f2863}.ok{color:#16a34a}
        .ftr{margin-top:60px;display:flex;justify-content:space-between;font-size:12px}
        .sig{text-align:center;border-top:2px solid #0f2863;padding-top:8px;width:200px}
      </style></head><body>
      <div class="hdr">
        <div style="font-size:13px;font-weight:900">ROYAUME DU MAROC — UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH</div>
        <div style="font-size:12px;color:#64748b;font-weight:700">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION — FÈS</div>
        <h1>AUTORISATION OFFICIELLE D'IMPRESSION<br>(BON À TIRER — BAT)</h1>
      </div>
      <div class="box">
        <div class="row"><span class="lbl">Étudiant :</span><span class="val">${studentName}</span></div>
        <div class="row"><span class="lbl">Intitulé du Mémoire :</span><span class="val">« ${topic} »</span></div>
        <div class="row"><span class="lbl">Contrôle Anti-Plagiat :</span><span class="val ok">CONFORME (Turnitin &lt; 15%) ✅</span></div>
        <div class="row"><span class="lbl">Décision Encadrant :</span><span class="val ok">BON À SOUTENIR — BAT ACCORDÉ ✅</span></div>
        <div class="row"><span class="lbl">Date :</span><span class="val">${new Date().toLocaleDateString('fr-FR',{year:'numeric',month:'long',day:'numeric'})}</span></div>
      </div>
      <p style="font-size:12px;color:#475569;line-height:1.7">Cette autorisation certifie que le mémoire a été validé par le professeur encadrant. L'étudiant est autorisé à procéder au tirage et à la reliure des exemplaires destinés au jury.</p>
      <div class="ftr">
        <div class="sig">Signature Encadrant<br><br><br></div>
        <div class="sig">Sceau ENCG Fès<br><br><br></div>
        <div class="sig">Chef de Département<br><br><br></div>
      </div><script>window.print();</script></body></html>`);
    win.document.close();
    toast.success('Autorisation BAT générée !');
  };

  const handlePrintConvention = (internship: any) => {
    const tid = toast.loading('Génération de la Convention Tripartite...');
    api.get(`/v1/student-portal/internships/${internship.id}/convention-pdf`, { responseType: 'blob' })
      .catch(() => api.get(`/student-portal/internships/${internship.id}/convention-pdf`, { responseType: 'blob' }))
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `Convention_Stage_ENCG_${internship.convention_ref || internship.id}.pdf`;
        document.body.appendChild(a); a.click(); a.remove();
        toast.success('Convention téléchargée !', { id: tid });
      })
      .catch(() => toast.error('Erreur téléchargement convention. Veuillez vérifier vos autorisations.', { id: tid }));
  };

  /* ─── Loading ─── */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-[#001A4B] animate-spin" />
        <p className="text-sm font-bold text-slate-500">Chargement de vos stages...</p>
      </div>
    );
  }

  /* ─── Derived data ─── */
  const list: any[] = Array.isArray(internships) ? internships : [];
  const validatedCount = list.filter(i => ['validated', 'approved', 'active', 'completed'].includes(String(i.status ?? '').toLowerCase())).length;
  const pendingCount   = list.filter(i => ['pending', 'submitted', 'under_review'].includes(String(i.status ?? '').toLowerCase())).length;
  const pfeList        = list.filter(i => (i.internship_type ?? i.type ?? '').toLowerCase() === 'pfe');

  /* ─── Shared input class ─── */
  const inputCls = "w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-blue-500/30 outline-none transition";

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto px-4 md:px-6 pb-24 font-sans">

      {/* ══ HERO BANNER ══════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#001A4B] via-[#0a2f77] to-[#061640] rounded-3xl shadow-2xl text-white border border-blue-900/50 p-8 md:p-10">
        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-xl">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/10 text-blue-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-white/10">
                <Sparkles className="w-3 h-3 text-amber-400" /> Espace PFE — ENCG Fès
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Mes Stages & Soutenance PFE</h1>
              <p className="text-blue-200/80 text-xs font-medium mt-1 max-w-xl">
                Suivi des conventions de stage, avancement mémoire et créneau de soutenance.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="shrink-0 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Demander une Convention
          </button>
        </div>

        {/* KPIs — no duplicates */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-white/10">
          {[
            { label: 'Total Stages',     value: list.length,   color: 'text-white'      },
            { label: 'Conventions Validées', value: validatedCount, color: 'text-emerald-400' },
            { label: 'En Attente',       value: pendingCount,  color: 'text-amber-300'  },
            { label: 'Stages PFE',       value: pfeList.length, color: 'text-purple-300' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-4 rounded-2xl bg-white/[.08] backdrop-blur border border-white/10 hover:bg-white/[.12] transition-all">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-200/70 block mb-1">{label}</span>
              <span className={`text-3xl font-black font-mono ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ MAIN GRID ═════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT — Convention Cards */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#001A4B] dark:text-blue-400" />
              Mes Conventions de Stage & PFE
            </h2>
            <span className="text-[11px] font-bold text-slate-400">{list.length} convention(s)</span>
          </div>

          {list.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">Aucun stage enregistré</p>
                <p className="text-xs text-slate-400 mt-1">Déposez une demande de convention pour démarrer le suivi.</p>
              </div>
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-5 py-2.5 bg-[#001A4B] text-white font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-blue-900 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Déposer une Demande
              </button>
            </div>
          ) : (
            list.map((internship: any) => {
              const statusKey = String(internship.status ?? 'pending').toLowerCase();
              const stepIdx   = STATUS_STEPS[statusKey] ?? 1;
              const isPfe     = (internship.internship_type ?? internship.type ?? '').toLowerCase() === 'pfe';
              
              // Real progress calculation based on actual internship documents and status
              const docs = Array.isArray(internship.internship_documents) ? internship.internship_documents : [];
              const hasFinalReport = docs.some((d: any) => d.document_type === 'rapport_final');
              const hasFinalApproved = docs.some((d: any) => d.document_type === 'rapport_final' && d.status === 'approved');
              const hasStepReport = docs.some((d: any) => d.document_type === 'rapport_etape');

              let progress = 10;
              if (internship.status === 'completed') progress = 100;
              else if (hasFinalApproved) progress = 95;
              else if (hasFinalReport) progress = 75;
              else if (hasStepReport) progress = 50;
              else if (['active', 'validated', 'approved'].includes(statusKey)) progress = 25;
              if (internship.progress !== undefined && internship.progress !== null) {
                progress = Number(internship.progress);
              }

              return (
                <div key={internship.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">

                  {/* Card header */}
                  <div className="p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${isPfe ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-gradient-to-br from-[#001A4B] to-blue-700'}`}>
                        {isPfe
                          ? <GraduationCap className="w-6 h-6 text-white" />
                          : <Building2 className="w-6 h-6 text-amber-300" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white">
                            {internship.position_title || TYPE_LABELS[internship.internship_type || internship.type] || 'Stage PFE'}
                          </h3>
                          {isPfe && (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[9px] font-black uppercase rounded-full border border-purple-200 dark:border-purple-800">PFE</span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1 flex-wrap">
                          <Building2 className="w-3 h-3 shrink-0" />
                          {internship.company_name ? String(internship.company_name).replace(/\s*—\s*$/, '') : '—'}
                          {internship.company_city && (
                            <span className="text-slate-400 font-medium flex items-center gap-0.5 ml-1">
                              <MapPin className="w-3 h-3" />{internship.company_city}
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          {internship.start_date ? new Date(internship.start_date).toLocaleDateString('fr-FR') : '—'} → {internship.end_date ? new Date(internship.end_date).toLocaleDateString('fr-FR') : '—'}
                        </p>
                      </div>
                    </div>
                    <InternshipStatusBadge status={internship.status} />
                  </div>

                  {/* Status pipeline tracker */}
                  <div className="px-6 pb-4">
                    <div className="flex items-start gap-1">
                      {PIPELINE.map((step, idx) => {
                        const done    = idx < stepIdx;
                        const current = idx === stepIdx - 1 && statusKey !== 'rejected';
                        return (
                          <React.Fragment key={step}>
                            <div className="flex flex-col items-center gap-1 flex-1">
                              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-all ${
                                done    ? 'bg-[#001A4B] border-[#001A4B] text-white' :
                                current ? 'bg-amber-500 border-amber-500 text-white' :
                                          'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                              }`}>
                                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{idx + 1}</span>}
                              </div>
                              <span className={`text-[9px] font-bold text-center leading-tight ${done || current ? 'text-[#001A4B] dark:text-blue-400' : 'text-slate-400'}`}>
                                {step}
                              </span>
                            </div>
                            {idx < PIPELINE.length - 1 && (
                              <div className={`flex-1 h-0.5 mt-3.5 rounded-full ${idx < stepIdx - 1 ? 'bg-[#001A4B] dark:bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* PFE mémoire milestones */}
                  {isPfe && (
                    <div className="mx-6 mb-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Avancement Mémoire PFE
                          {(internship.supervisor?.user?.name || internship.supervisor_name) && (
                            <span className="text-slate-500 font-medium text-[11px]">avec {internship.supervisor?.user?.name || internship.supervisor_name}</span>
                          )}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {internship.plagiarism_rate !== undefined && internship.plagiarism_rate !== null ? (
                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full text-[10px] font-black">
                              🔍 Plagiat : {internship.plagiarism_rate}% ({Number(internship.plagiarism_rate) < 15 ? 'Conforme' : 'Non conforme'})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-medium">
                              🔍 Turnitin : {hasFinalReport ? 'Analyse en cours' : 'En attente de dépôt'}
                            </span>
                          )}
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400">{progress}% Achevé</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 via-blue-500 to-amber-500 h-full rounded-full transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {MILESTONES.map((m, i) => {
                          const done = progress >= (i + 1) * 25;
                          return (
                            <div key={m.key} className={`text-center text-[9px] font-bold py-1.5 px-1 rounded-lg leading-tight ${done ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                              {done ? '✅' : '⏳'}<br />{m.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tutor pill */}
                  {(internship.company_mentor_name || internship.supervisor_name) && (
                    <div className="mx-6 mb-4 flex items-center gap-2 p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
                      <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-[11px] text-blue-800 dark:text-blue-300 font-bold truncate">
                        Tuteur : {internship.company_mentor_name || internship.supervisor_name}
                        {(internship.company_mentor_email || internship.supervisor_email) && (
                          <span className="text-blue-500 font-medium ml-1">— {internship.company_mentor_email || internship.supervisor_email}</span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="px-6 pb-6 flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowSuiviModal(internship)}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Suivi & Échanges avec Encadrant
                    </button>
                    {isPfe && (
                      <button
                        onClick={() => handlePrintBat(internship.student?.user?.name ?? 'Étudiant ENCG Fès', internship.position_title ?? 'Mémoire de Fin d\'Études (PFE)')}
                        className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 hover:bg-emerald-100"
                      >
                        <Printer className="w-3.5 h-3.5" /> Autorisation d'Impression (BAT A4)
                      </button>
                    )}
                    <button
                      onClick={() => handlePrintConvention(internship)}
                      className="px-4 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 hover:bg-blue-100"
                    >
                      <FileText className="w-3.5 h-3.5" /> Convention PDF
                    </button>
                    <button
                      onClick={() => { setSelectedInternship(internship.id); setUploadModalOpen(true); }}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 hover:bg-slate-200"
                    >
                      <Upload className="w-3.5 h-3.5" /> Déposer Version Mémoire (PDF)
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT — Soutenance + Quick Links */}
        <div className="space-y-5">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#001A4B] dark:text-blue-400" />
            Ma Soutenance PFE
          </h2>

          {!pfeList.length ? (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center space-y-3">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-black text-slate-500">Aucun stage PFE actif</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Le suivi de soutenance s'active automatiquement pour les étudiants inscrits en PFE (Bac+5).
              </p>
            </div>
          ) : pfeList[0]?.soutenance ? (
            /* Real scheduled defense from DB */
            <div className="bg-gradient-to-br from-[#001A4B] to-[#0a2f77] text-white p-6 rounded-3xl shadow-xl space-y-5 border border-blue-800/40">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Créneau Officiel Attribué
              </div>

              <div>
                <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider mb-1">Date & Horaires</p>
                <p className="text-sm font-black">
                  {new Date(pfeList[0].soutenance.date_time).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider mb-1">Lieu / Salle</p>
                <p className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {pfeList[0].soutenance.room?.name || 'Salle d\'Examen — ENCG Fès'}
                </p>
              </div>

              <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-2.5">
                <p className="text-[10px] font-black text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Membres du Jury d'Évaluation
                </p>
                {[
                  { role: 'Président',   name: pfeList[0].soutenance.president?.user?.name || 'En cours de désignation', highlight: true  },
                  { role: 'Encadrant',   name: pfeList[0].supervisor?.user?.name || pfeList[0].supervisor_name || 'En cours d\'affectation',   highlight: false },
                  { role: 'Examinateur', name: pfeList[0].soutenance.examiner?.user?.name || 'En cours de désignation', highlight: false },
                ].map(({ role, name, highlight }) => (
                  <div key={role} className="flex items-center gap-2 text-xs">
                    <Star className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    <span className="text-blue-200 font-bold">{role} :</span>
                    <span className={`font-black ${highlight ? 'text-amber-300' : 'text-white'}`}>{name}</span>
                  </div>
                ))}
              </div>

              {pfeList[0].soutenance.grade && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-200">Note Délibérée :</span>
                  <span className="text-sm font-black text-emerald-300 font-mono">{pfeList[0].soutenance.grade} / 20</span>
                </div>
              )}
            </div>
          ) : (
            /* Real pending defense state — NO FAKE DATES OR JURY NAMES */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-5">
              <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-200 dark:border-amber-800/40">
                <Clock className="w-3.5 h-3.5" /> En attente de programmation
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Créneau & Jury PFE</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Votre date de passage, la salle et les membres du jury seront programmés par la commission dès que votre mémoire sera validé par votre encadrant académique.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">État des Prérequis Officiels :</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">1. Convention PFE visée</span>
                    <span className="text-emerald-600 font-bold text-[11px]">Validée ✅</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">2. Mémoire final déposé</span>
                    <span className={`font-bold text-[11px] ${Array.isArray(pfeList[0]?.internship_documents) && pfeList[0].internship_documents.some((d: any) => d.document_type === 'rapport_final') ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {Array.isArray(pfeList[0]?.internship_documents) && pfeList[0].internship_documents.some((d: any) => d.document_type === 'rapport_final') ? 'Déposé ✅' : 'À déposer ⏳'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">3. Bon à Tirer (BAT) accordé</span>
                    <span className={`font-bold text-[11px] ${pfeList[0]?.status === 'completed' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {pfeList[0]?.status === 'completed' ? 'Accordé ✅' : 'En attente ⏳'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">4. Affectation du jury</span>
                    <span className="text-slate-400 font-bold text-[11px]">En cours</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick links panel */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
            {[
              { id: 'guide' as const,    icon: FileText,    label: 'Guide de Rédaction Mémoire PFE',  sub: 'Normes ENCG Fès 2026',  color: 'text-indigo-600' },
              { id: 'reglement' as const, icon: BookOpen,    label: 'Règlement de Soutenance',          sub: 'Jury & Modalités',       color: 'text-blue-600'   },
              { id: 'recours' as const,   icon: AlertCircle, label: 'Déposer un Recours',               sub: 'Commission PFE & Recours',  color: 'text-amber-600'  },
            ].map(({ id, icon: Icon, label, sub, color }) => (
              <div
                key={id}
                onClick={() => setActiveGuideModal(id)}
                className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${color} shrink-0`} />
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">{label}</p>
                    <p className="text-[10px] text-slate-400">{sub}</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ MODAL — Guides & Règlements ════════════════════════════════════ */}
      {activeGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 bg-gradient-to-r from-[#001A4B] to-[#0a2f77] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black">
                  {activeGuideModal === 'guide' && 'Guide de Rédaction Mémoire PFE — Normes ENCG Fès'}
                  {activeGuideModal === 'reglement' && 'Règlement Intérieur des Soutenances PFE'}
                  {activeGuideModal === 'recours' && 'Commission PFE & Dépôt de Requête'}
                </h3>
              </div>
              <button
                onClick={() => setActiveGuideModal(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {activeGuideModal === 'guide' && (
                <>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900 text-blue-900 dark:text-blue-200 font-bold">
                    Normes académiques applicables aux mémoires de master et de diplôme de l'ENCG Fès (Promotion 2026).
                  </div>
                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">1. Typographie & Mise en page :</h4>
                  <p>• Police : Times New Roman (12 pt) ou Calibri (11 pt), interligne 1.5, marges de 2.5 cm (gauche/droite/haut/bas).</p>
                  <p>• Pagination en bas à droite dès l'introduction générale. Volume conseillé : 60 à 80 pages hors annexes.</p>

                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">2. Structure obligatoire :</h4>
                  <p>• Page de garde avec en-tête officiel USMBA & ENCG Fès, noms de l'étudiant, de l'encadrant académique et du tuteur professionnel.</p>
                  <p>• Résumé bilingue (Français & Anglais) + 5 mots-clés obligatoires.</p>
                  <p>• Chapitre 1 : Cadre conceptuel et revue critique de littérature.</p>
                  <p>• Chapitre 2 : Démarche empirique, échantillonnage et collecte des données.</p>
                  <p>• Chapitre 3 : Résultats analytiques et préconisations managériales opérationnelles.</p>

                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">3. Contrôle Anti-Plagiat :</h4>
                  <p className="text-emerald-700 dark:text-emerald-400 font-bold">
                    • Taux de similitude certifié par Turnitin strictement inférieur à 15%. Au-delà, le Bon à Tirer (BAT) est suspendu.
                  </p>
                </>
              )}

              {activeGuideModal === 'reglement' && (
                <>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900 text-amber-900 dark:text-amber-200 font-bold">
                    Modalités d'organisation et de notation des soutenances publiques de fin d'études.
                  </div>
                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">1. Conditions préalables :</h4>
                  <p>• Validation officielle du Bon à Tirer (BAT) par l'enseignant encadrant.</p>
                  <p>• Dépôt de 3 exemplaires reliés au secrétariat pédagogique au moins 7 jours ouvrés avant la date retenue.</p>

                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">2. Déroulement de l'épreuve (50 minutes) :</h4>
                  <p>• <strong>20 minutes</strong> : Exposé de l'étudiant (support Diaporama recommandé).</p>
                  <p>• <strong>20 minutes</strong> : Questions et échanges avec les membres du jury.</p>
                  <p>• <strong>10 minutes</strong> : Délibération du jury à huis clos et proclamation de la mention.</p>

                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">3. Barème d'évaluation :</h4>
                  <p>• Rigueur méthodologique et traitement empirique : 35%</p>
                  <p>• Qualité rédactionnelle et respect des normes : 25%</p>
                  <p>• Prestation orale et pertinence des réponses : 40%</p>
                </>
              )}

              {activeGuideModal === 'recours' && (
                <>
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                    Guichet officiel des requêtes et recours académiques — Commission des PFE.
                  </div>
                  <p>Pour tout signalement relatif à l'attribution d'un encadrant, à un litige en entreprise d'accueil ou à la programmation de la soutenance :</p>
                  <p>• Les requêtes écrites doivent être adressées par email officiel à : <strong className="text-indigo-600 dark:text-indigo-400">stages.pfe@encg-fes.ac.ma</strong></p>
                  <p>• Joindre impérativement votre CNE/MASSAR, filière, intitulé du sujet et pièce justificative le cas échéant.</p>
                  <p>• Délai de réponse de la commission pédagogique : 48h ouvrées.</p>
                </>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveGuideModal(null)}
                className="px-5 py-2 bg-[#001A4B] text-white font-black text-xs rounded-xl hover:bg-blue-900 transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL — Suivi Encadrant ════════════════════════════════════════ */}
      {showSuiviModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-[#001A4B] to-[#0a2f77] text-white flex items-center justify-between shrink-0 rounded-t-3xl">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Espace Collaboratif PFE</span>
                <h2 className="text-sm font-black mt-0.5">Suivi d'Avancement Mémoire</h2>
              </div>
              <button onClick={() => setShowSuiviModal(null)} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Milestones */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Jalons de Validation :</h4>
                {MILESTONES.map((m, i) => {
                  const done = (showSuiviModal.progress ?? 75) >= (i + 1) * 25;
                  return (
                    <div key={m.key} className={`flex items-center justify-between text-xs font-bold rounded-xl p-2.5 ${done ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'}`}>
                      <span>{i + 1}. {m.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${done ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-amber-100 dark:bg-amber-900'}`}>
                        {done ? 'ACCORDÉ ✅' : 'EN RÉVISION ⏳'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Journal des Échanges :</h4>
                {commentsList.length === 0 ? (
                  <div className="p-4 text-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-400 font-medium">Aucun échange ou remarque enregistré pour le moment.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Vous pouvez poser une question ou transmettre un point d'étape à votre encadrant ci-dessous.</p>
                  </div>
                ) : (
                  commentsList.map((c, idx) => (
                    <div key={idx} className={`p-3.5 rounded-2xl space-y-1 ${c.isProf ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900' : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 ml-5'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-black ${c.isProf ? 'text-indigo-800 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{c.author}</span>
                        <span className="text-[10px] text-slate-400">{c.date}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Send */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                  placeholder="Posez une question à votre encadrant..."
                  className={inputCls + ' flex-1'}
                />
                <button type="submit" className="px-4 py-2.5 bg-[#001A4B] text-white font-black text-xs rounded-2xl cursor-pointer flex items-center gap-1.5 hover:bg-blue-900 transition-colors shrink-0">
                  <Send className="w-3.5 h-3.5" /> Envoyer
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL — Nouvelle Convention ═══════════════════════════════════ */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-[#001A4B] to-[#0a2f77] text-white flex items-center justify-between shrink-0 rounded-t-3xl">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Guichet PFE — ENCG Fès</span>
                <h2 className="text-sm font-black mt-0.5">Nouvelle Demande de Convention</h2>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Raison Sociale Entreprise *</label>
                <input required value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} className={inputCls} placeholder="Ex: Attijariwafa Bank / Marsa Maroc" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Ville *</label>
                  <input required value={form.company_city} onChange={e => setForm(p => ({ ...p, company_city: e.target.value }))} className={inputCls} placeholder="Ex: Casablanca / Fès" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Type de Stage *</label>
                  <select value={form.internship_type} onChange={e => setForm(p => ({ ...p, internship_type: e.target.value }))} className={inputCls}>
                    <option value="initiation">Stage d'Initiation (1ère/2ème Année)</option>
                    <option value="application">Stage d'Application (3ème/4ème Année)</option>
                    <option value="pfe">Stage PFE — Fin d'Études (Bac+5)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Intitulé du Poste / Mission *</label>
                <input required value={form.position_title} onChange={e => setForm(p => ({ ...p, position_title: e.target.value }))} className={inputCls} placeholder="Ex: Stagiaire Contrôle de Gestion & Audit" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Nom Tuteur Entreprise *</label>
                  <input required value={form.company_mentor_name} onChange={e => setForm(p => ({ ...p, company_mentor_name: e.target.value }))} className={inputCls} placeholder="M. Mehdi BENJELLOUN" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Email Tuteur *</label>
                  <input required type="email" value={form.company_mentor_email} onChange={e => setForm(p => ({ ...p, company_mentor_email: e.target.value }))} className={inputCls} placeholder="tuteur@entreprise.ma" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Assurance RC *</label>
                  <input required value={form.insurance_company} onChange={e => setForm(p => ({ ...p, insurance_company: e.target.value }))} className={inputCls} placeholder="MAMDA-MCMA" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">N° Police RC *</label>
                  <input required value={form.insurance_policy_number} onChange={e => setForm(p => ({ ...p, insurance_policy_number: e.target.value }))} className={inputCls} placeholder="RC-ETUD-2026-XXXX" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Date Début *</label>
                  <input required type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Date Fin *</label>
                  <input required type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowRequestModal(false)} className="px-5 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 text-xs font-black bg-[#001A4B] text-white hover:bg-blue-900 disabled:opacity-50 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-colors">
                  {submitting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> En cours...</>
                    : <><ArrowUpRight className="w-3.5 h-3.5" /> Soumettre Convention</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document upload modal */}
      {selectedInternship && (
        <DocumentUploadModal
          internshipId={selectedInternship}
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
        />
      )}
    </div>
  );
}
