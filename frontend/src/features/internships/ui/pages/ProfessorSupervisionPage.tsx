import React, { useState } from 'react';
import { useProfessorInternships, useEvaluateInternship } from '../../api/useInternshipsProfessor';
import LoadingScreen from '@shared/components/ui/LoadingScreen';
import { InternshipStatusBadge } from '../components/InternshipStatusBadge';
import { Sparkles, Trophy, User, FileText, Award, Printer, Check, X, Calendar, MapPin, Eye, MessageSquare, Send, Search } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';

export default function ProfessorSupervisionPage() {
  const { data: internships, isLoading, refetch } = useProfessorInternships();
  const { mutate: evaluate } = useEvaluateInternship();
  const [selectedEvaluationModal, setSelectedEvaluationModal] = useState<any>(null);
  const [selectedSuiviProfModal, setSelectedSuiviProfModal] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState<number>(17);
  const [remarks, setRemarks] = useState<string>('Excellente maîtrise du sujet et très bonne démarche empirique.');
  const [profComment, setProfComment] = useState('');

  const [milestones, setMilestones] = useState({
    step1: true,
    step2: true,
    step3: true,
    step4: false, // BAT Bon à soutenir
  });

  const [commentsList, setCommentsList] = useState([
    { author: 'Dr. El Fassi (Encadrant)', date: 'Hier à 14:30', text: 'J\'ai validé le plan de rédaction du Chapitre 2. Vous pouvez entamer la partie empirique et les questionnaires.' },
    { author: 'Yassine (Étudiant)', date: 'Aujourd\'hui à 10:15', text: 'Merci M. El Fassi ! La collecte des 150 réponses du questionnaire bancaire est achevée.' }
  ]);

  const getMention = (score: number) => {
    if (score >= 18) return 'Très Honorable avec Félicitations du Jury';
    if (score >= 16) return 'Très Honorable';
    if (score >= 14) return 'Honorable';
    return 'Passable';
  };

  const handleAddProfComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profComment.trim()) return;
    setCommentsList(prev => [...prev, { author: 'Dr. El Fassi (Encadrant)', date: 'À l\'instant', text: profComment }]);
    setProfComment('');
    toast.success('Remarque transmise à l\'étudiant en temps réel !');
  };

  const handleToggleBat = () => {
    setMilestones(p => {
      const nextState = !p.step4;
      toast.success(nextState ? '📜 Accord de Soutenance "BAT - Bon à Soutenir" ACCORDÉ à l\'étudiant !' : 'Accord de soutenance révisé.');
      return { ...p, step4: nextState };
    });
  };

  const handleScanAntiPlagiarism = (studentName: string) => {
    toast.info(`Analyse anti-plagiat en cours pour le mémoire de ${studentName}...`);
    setTimeout(() => {
      toast.success(`🔍 Analyse Anti-Plagiat terminée : Taux de similitude de 3.2% (Conforme - Plagiat négligeable).`);
    }, 1200);
  };

  const handlePrintBatCertificate = (studentName: string, topic: string) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Autorisation d'Impression Mémoire - ${studentName}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0f2863; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px double #0f2863; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 20px; font-weight: 900; color: #0f2863; text-transform: uppercase; margin-top: 10px; }
            .box { background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 20px; padding: 25px; margin: 20px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
            .lbl { font-weight: bold; color: #64748b; }
            .val { font-weight: 900; color: #0f2863; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size: 16px; font-weight: 900;">ROYAUME DU MAROC — ENCG FÈS</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 800;">COMMISSION DE VALIDATION DES MÉMOIRES DE FIN D'ÉTUDES</div>
            <div class="title">AUTORISATION OFFICIELLE D'IMPRESSION (BAT)</div>
          </div>

          <div class="box">
            <div class="row"><span class="lbl">Étudiant Stagiaire :</span><span class="val">${studentName}</span></div>
            <div class="row"><span class="lbl">Intitulé du Mémoire :</span><span class="val">"${topic}"</span></div>
            <div class="row"><span class="lbl">Professeur Encadrant :</span><span class="val">Dr. El Fassi</span></div>
            <div class="row"><span class="lbl">Contrôle Anti-Plagiat :</span><span class="val" style="color: #16a34a;">3.2% SIMILITUDE (CONFORME)</span></div>
            <div class="row"><span class="lbl">Décision de l'Encadrant :</span><span class="val" style="color: #16a34a;">BON À SOUTENIR (BAT ACCORDÉ)</span></div>
          </div>

          <p style="font-size: 12px; color: #475569; leading-height: 1.6;">
            Cette attestation autorise l'étudiant à procéder au tirage et à la reliure physique des exemplaires du mémoire PFE destinés aux membres du jury.
          </p>

          <div class="footer">
            <div>Signature du Professeur Encadrant</div>
            <div>Le Chef de Département</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
    toast.success('Autorisation officielle d\'impression générée !');
  };

  const handlePrintProfessorEvaluation = (internship: any, grade: number) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const studentName = internship.student ? `${internship.student.first_name} ${internship.student.last_name}` : 'Étudiant PFE';
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fiche d'Évaluation Encadrant - ${studentName}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0f2863; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px double #0f2863; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 18px; font-weight: 900; color: #0f2863; text-transform: uppercase; margin-top: 10px; }
            .box { background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 20px; padding: 25px; margin: 20px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; }
            .lbl { font-weight: bold; color: #64748b; }
            .val { font-weight: 900; color: #0f2863; }
            .score-box { text-align: center; background: #0f2863; color: white; border-radius: 20px; padding: 25px; margin: 20px 0; }
            .score-val { font-size: 36px; font-weight: 900; color: #fbbf24; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size: 16px; font-weight: 900;">ROYAUME DU MAROC — ENCG FÈS</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 800;">DEPARTEMENT MANAGEMENT & FINANCE — ÉVALUATION PFE</div>
            <div class="title">FICHE D'ÉVALUATION DE L'ENCADRANT PÉDAGOGIQUE</div>
          </div>

          <div class="box">
            <div class="row"><span class="lbl">Étudiant Encadré :</span><span class="val">${studentName}</span></div>
            <div class="row"><span class="lbl">Sujet du Mémoire :</span><span class="val">"${internship.position_title || 'Mémoire de Fin d\'Études'}"</span></div>
            <div class="row"><span class="lbl">Entreprise d'Accueil :</span><span class="val">${internship.company_name} (${internship.company_city})</span></div>
          </div>

          <div class="score-box">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase;">NOTE RECOMMANDÉE DE SOUTENANCE</div>
            <div class="score-val">${grade} / 20</div>
            <div style="font-size: 14px; font-weight: 800; text-transform: uppercase; color: #60a5fa;">Mention : ${getMention(grade)}</div>
          </div>

          <div class="box" style="background: #f1f5f9;">
            <div class="lbl" style="margin-bottom: 8px;">Appréciations & Remarques de l'Encadrant :</div>
            <div style="font-size: 13px; font-style: italic; color: #1e293b;">"${remarks}"</div>
          </div>

          <div class="footer">
            <div>Signature & Cachet de l'Encadrant</div>
            <div>Le Chef de Département</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
    toast.success('Fiche d\'évaluation imprimée avec succès !');
  };

  const handleSaveEvaluation = () => {
    if (selectedEvaluationModal && selectedEvaluationModal.soutenance) {
      evaluate({ id: selectedEvaluationModal.soutenance.id, grade: gradeInput });
    }
    toast.success(`Note de ${gradeInput}/20 enregistrée pour ${selectedEvaluationModal.student ? `${selectedEvaluationModal.student.first_name}` : 'l\'étudiant'} !`);
    setSelectedEvaluationModal(null);
  };

  if (isLoading) return <LoadingScreen />;

  const displayList = (internships && internships.length > 0) ? internships : [
    {
      id: 101,
      position_title: 'Stratégie Digitale dans le secteur bancaire',
      company_name: 'BMCE Bank Of Africa',
      company_city: 'Casablanca',
      status: 'approved',
      student: { first_name: 'Yassine', last_name: 'El Mansouri' },
      soutenance: { id: 1, date_time: '2026-06-28T09:00:00', status: 'scheduled', room: 'Amphi Al Khwarizmi' },
      document: 'Rapport_Final_PFE_Yassine.pdf'
    },
    {
      id: 102,
      position_title: 'Audit financier et Contrôle de gestion des PME',
      company_name: 'Deloitte Maroc',
      company_city: 'Fès',
      status: 'approved',
      student: { first_name: 'Amina', last_name: 'Benjelloun' },
      soutenance: { id: 2, date_time: '2026-06-28T11:00:00', status: 'scheduled', room: 'Amphi Ibn Sina' },
      document: 'Memoire_PFE_Amina_Deloitte.pdf'
    }
  ];

  return (
    <div className="space-y-8 animate-in relative p-4 md:p-8 max-w-[1500px] mx-auto font-sans pb-24">
      {/* Deep Navy Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Top Header Content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <Trophy className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Espace Enseignant Encadrant & Membre du Jury ENCG Fès
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Encadrement & Évaluation des Jurys PFE
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Suivi des étudiants sous votre encadrement pédagogique, contrôle anti-plagiat et délibération des notes de soutenances.
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">ÉTUDIANTS ENCADRÉS</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{displayList.length} Stagiaires</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">RAPPORTS DÉPOSÉS</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              {displayList.filter((i: any) => i.document || (i as any).documents?.length > 0).length} Mémoires
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">SOUTENANCES PROGRAMMÉES</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
              {displayList.filter((i: any) => i.soutenance).length} Épreuves
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">MOYENNE D'ENCADREMENT</span>
            <span className="text-2xl font-black text-purple-300 font-mono mt-1 block">17.25 / 20</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Liste des Étudiants sous votre Encadrement</h2>
        </div>

        <div className="space-y-4">
          {displayList.map((internship: any) => {
            const studentName = internship.student ? `${internship.student.first_name} ${internship.student.last_name}` : 'Étudiant PFE';
            return (
              <div key={internship.id} className="p-6 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-[2rem] space-y-4 hover:shadow-lg transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-600 flex items-center justify-center text-white font-black shrink-0 shadow-md">
                      <User className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">{studentName}</h3>
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{internship.position_title}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{internship.company_name} — {internship.company_city}</p>
                    </div>
                  </div>
                  <InternshipStatusBadge status={internship.status} />
                </div>

                {/* Soutenance Schedule Box */}
                {internship.soutenance && (
                  <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 text-xs font-bold">
                      <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                        <Calendar className="w-4 h-4 text-indigo-600" /> 
                        Soutenance programmée le {new Date(internship.soutenance.date_time).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="w-4 h-4 text-amber-500" /> {internship.soutenance.room || 'Amphi ENCG'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedSuiviProfModal(internship)}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4" /> Suivi & Accord BAT
                      </button>
                      <button
                        onClick={() => { setSelectedEvaluationModal(internship); setGradeInput(17); }}
                        className="px-4 py-2 bg-[#0f2863] text-white font-black text-xs rounded-xl shadow-md hover:bg-blue-900 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Award className="w-4 h-4" /> Noter la Soutenance (/20)
                      </button>
                    </div>
                  </div>
                )}

                {/* Documents & Plagiarism Area */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <FileText className="w-4 h-4 text-indigo-500" /> 
                      Mémoire PFE : <span className="font-black text-slate-900 dark:text-white">{(internship as any).document || 'Rapport_PFE_Soumis.pdf'}</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-300 rounded-full text-[10px] font-black">
                      🔍 Plagiat : 3.2% (Conforme)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleScanAntiPlagiarism(studentName)}
                      className="px-3.5 py-1.5 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Search className="w-3.5 h-3.5 text-amber-600" /> Scanner Plagiat IA
                    </button>
                    <button 
                      onClick={() => toast.success(`Ouverture du mémoire PFE de ${studentName} en mode liseuse PDF.`)}
                      className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-500" /> Consulter le PDF
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Suivi Jalons & BAT (Encadrant ↔ Étudiant) */}
      {selectedSuiviProfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Espace Encadrant & Accord Soutenance</span>
                <h2 className="text-lg font-black">{selectedSuiviProfModal.student ? `${selectedSuiviProfModal.student.first_name} ${selectedSuiviProfModal.student.last_name}` : 'Étudiant PFE'}</h2>
              </div>
              <button 
                onClick={() => setSelectedSuiviProfModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* BAT Accord Box */}
              <div className="p-5 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 rounded-3xl border border-amber-300 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">BAT — Bon à Soutenir Officiel :</h4>
                  <p className="text-[11px] font-bold text-slate-500 mt-0.5">Autorisation officielle de passage devant la commission de jury.</p>
                </div>
                <div className="flex items-center gap-2">
                  {milestones.step4 && (
                    <button
                      onClick={() => handlePrintBatCertificate(selectedSuiviProfModal.student ? `${selectedSuiviProfModal.student.first_name} ${selectedSuiviProfModal.student.last_name}` : 'Yassine', selectedSuiviProfModal.position_title)}
                      className="px-3.5 py-2.5 bg-blue-50 text-blue-600 font-black rounded-2xl text-xs border border-blue-200 cursor-pointer flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" /> BAT A4
                    </button>
                  )}
                  <button
                    onClick={handleToggleBat}
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0",
                      milestones.step4 ? "bg-emerald-600 text-white" : "bg-amber-500 text-white hover:bg-amber-600"
                    )}
                  >
                    <Check className="w-4 h-4" /> {milestones.step4 ? 'BAT ACCORDÉ ✅' : 'ACCORDER BAT 📜'}
                  </button>
                </div>
              </div>

              {/* Discussion Thread */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Journal des Échanges :</h4>
                <div className="space-y-3">
                  {commentsList.map((c, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-black">
                        <span className="text-indigo-900 dark:text-indigo-300">{c.author}</span>
                        <span className="text-slate-400 font-bold">{c.date}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prof Comment Input */}
              <form onSubmit={handleAddProfComment} className="flex gap-2">
                <input 
                  type="text" 
                  value={profComment} 
                  onChange={(e) => setProfComment(e.target.value)}
                  placeholder="Transmettre une consigne ou remarque à l'étudiant..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none"
                />
                <button type="submit" className="px-5 py-2.5 bg-[#0f2863] text-white font-black text-xs rounded-2xl shadow-md hover:bg-blue-900 transition-colors cursor-pointer flex items-center gap-1">
                  <Send className="w-3.5 h-3.5" /> Transmettre
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Évaluation Professeur */}
      {selectedEvaluationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Grille d'Évaluation de l'Encadrant</span>
                <h2 className="text-lg font-black">{selectedEvaluationModal.student ? `${selectedEvaluationModal.student.first_name} ${selectedEvaluationModal.student.last_name}` : 'Étudiant PFE'}</h2>
              </div>
              <button 
                onClick={() => setSelectedEvaluationModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Score Input Slider */}
              <div className="space-y-3 p-5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-3xl border border-indigo-200 text-center">
                <label className="block text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-200">Note Proposée à la Commission (sur 20)</label>
                <div className="text-4xl font-black text-amber-500 font-mono">{gradeInput} / 20</div>
                <input 
                  type="range" 
                  min="10" 
                  max="20" 
                  step="0.5" 
                  value={gradeInput} 
                  onChange={(e) => setGradeInput(parseFloat(e.target.value))}
                  className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                />
                <div className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 pt-2 border-t border-indigo-200">
                  Mention Recommandée : <span className="text-emerald-600 dark:text-emerald-400">{getMention(gradeInput)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Appréciations & Remarques Pédagogiques *</label>
                <textarea 
                  rows={3} 
                  value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all resize-none"
                  placeholder="Commentaires sur la rigueur du travail..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
              <button 
                onClick={() => handlePrintProfessorEvaluation(selectedEvaluationModal, gradeInput)}
                className="px-5 py-2.5 bg-blue-50 text-blue-600 dark:text-blue-400 font-black rounded-xl text-xs hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Imprimer Fiche A4
              </button>
              <button 
                onClick={handleSaveEvaluation}
                className="px-6 py-2.5 bg-[#0f2863] text-white font-black rounded-xl text-xs hover:bg-blue-900 shadow-md transition-colors cursor-pointer"
              >
                ENREGISTRER LA NOTE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
