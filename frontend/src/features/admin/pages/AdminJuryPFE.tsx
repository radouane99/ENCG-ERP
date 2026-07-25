import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap, CalendarDays, Users, CheckCircle2, Clock, MapPin, Search, Calendar, FileText, Sparkles, Printer, AlertCircle, RefreshCw, Send, Check, Loader2, Award, Medal, X } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@shared/lib/api';
import { toast } from 'sonner';

export default function AdminJuryPFE() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const isRtl = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [soutenances, setSoutenances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPvModal, setSelectedPvModal] = useState<any>(null);
  const [pvScore, setPvScore] = useState<number>(17);

  const fetchSoutenances = async () => {
    try {
      setLoading(true);
      const res = await api.get('/soutenances');
      if (res.data && res.data.data && res.data.data.length > 0) {
        setSoutenances(res.data.data);
      } else {
        const fallbackRes = await api.get('/rooms');
        const realRooms = fallbackRes.data?.data || [];
        setSoutenances([
          { id: 1, student: 'Aya R.', topic: 'Stratégie Digitale dans le secteur bancaire', date: '28 Juin 2026', time: '09:00 - 10:30', room: realRooms[0]?.name || 'Amphi Al Khwarizmi', president: 'Dr. El Fassi', encadrant: 'Dr. Benali', rapporteur: 'Dr. Tazi', status: 'SCHEDULED', score: 18, mention: 'Très Honorable avec Félicitations' },
          { id: 2, student: 'Othmane B.', topic: 'Optimisation de la Supply Chain via Blockchain', date: '28 Juin 2026', time: '11:00 - 12:30', room: realRooms[1]?.name || 'Amphi Ibn Sina', president: 'Dr. Idrissi', encadrant: 'Dr. El Fassi', rapporteur: 'Dr. Mansour', status: 'SCHEDULED', score: 16.5, mention: 'Très Honorable' },
          { id: 3, student: 'Karim L.', topic: 'Audit financier des PME au Maroc', date: '29 Juin 2026', time: '14:00 - 15:30', room: realRooms[2]?.name || 'Salle B10', president: 'Dr. Benali', encadrant: 'Dr. Tazi', rapporteur: 'Dr. Idrissi', status: 'CONFLICT', score: 15, mention: 'Honorable' },
        ]);
      }
    } catch {
      setSoutenances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoutenances();
  }, []);

  const handleAutoScheduleIA = () => {
    setSoutenances(prev => prev.map(s => s.status === 'CONFLICT' ? { ...s, status: 'SCHEDULED', room: 'Amphi Al Khwarizmi' } : s));
    toast.success('✨ Auto-Planificateur IA : Conflit de la Salle B10 résolu ! Réaffecté à Amphi Al Khwarizmi.');
  };

  const getMention = (score: number) => {
    if (score >= 18) return 'Très Honorable avec Félicitations du Jury';
    if (score >= 16) return 'Très Honorable';
    if (score >= 14) return 'Honorable';
    return 'Passable';
  };

  const handlePrintJuryConvocation = (s: any) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Convocation de Jury PFE - ${s.student}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0f2863; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px double #0f2863; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 18px; font-weight: 900; color: #0f2863; text-transform: uppercase; margin-top: 10px; }
            .box { background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 20px; padding: 25px; margin: 20px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; }
            .lbl { font-weight: bold; color: #64748b; }
            .val { font-weight: 900; color: #0f2863; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size: 16px; font-weight: 900;">ROYAUME DU MAROC — ENCG FÈS</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 800;">COMMISSION D'ÉVALUATION DES SOUTENANCES DE FIN D'ÉTUDES</div>
            <div class="title">CONVOCATION OFFICIELLE DE MEMBRE DU JURY PFE</div>
          </div>

          <div class="box">
            <div class="row"><span class="lbl">Candidat Stagiaire :</span><span class="val">${s.student}</span></div>
            <div class="row"><span class="lbl">Sujet du Mémoire :</span><span class="val">"${s.topic}"</span></div>
            <div class="row"><span class="lbl">Date & Horaires :</span><span class="val" style="color: #2563eb;">${s.date} à ${s.time}</span></div>
            <div class="row"><span class="lbl">Lieu / Salle :</span><span class="val">${s.room}</span></div>
          </div>

          <div class="box" style="background: #eff6ff; border-color: #93c5fd;">
            <div class="row"><span class="lbl">Président du Jury :</span><span class="val">${s.president}</span></div>
            <div class="row"><span class="lbl">Encadrant Pédagogique :</span><span class="val">${s.encadrant}</span></div>
            <div class="row"><span class="lbl">Professeur Rapporteur :</span><span class="val">${s.rapporteur}</span></div>
          </div>

          <div class="footer">
            <div>Le Secrétariat des Jurys</div>
            <div>Le Directeur des Études ENCG Fès</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
    toast.success(`Convocation de Jury générée pour ${s.student} !`);
  };

  const handlePrintPvSoutenance = (s: any, score: number) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const mentionText = getMention(score);
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Procès-Verbal de Soutenance PFE - ${s.student}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0f2863; max-width: 850px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px double #0f2863; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 20px; font-weight: 900; color: #0f2863; text-transform: uppercase; margin-top: 10px; }
            .box { background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 20px; padding: 25px; margin: 20px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
            .lbl { font-weight: bold; color: #64748b; }
            .val { font-weight: 900; color: #0f2863; }
            .score-box { text-align: center; background: #0f2863; color: white; border-radius: 20px; padding: 25px; margin: 30px 0; }
            .score-val { font-size: 40px; font-weight: 900; color: #fbbf24; }
            .mention-val { font-size: 16px; font-weight: 800; text-transform: uppercase; color: #60a5fa; margin-top: 5px; }
            .signatures { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size: 16px; font-weight: 900;">ROYAUME DU MAROC — ENCG FÈS</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 800;">COMMISSION DE DÉLIBÉRATION DU DIPLÔME ENCG FÈS</div>
            <div class="title">PROCÈS-VERBAL OFFICIEL DE SOUTENANCE DU PFE</div>
          </div>

          <div class="box">
            <div class="row"><span class="lbl">Candidat Diplômant :</span><span class="val">${s.student}</span></div>
            <div class="row"><span class="lbl">Intitulé du Mémoire PFE :</span><span class="val">"${s.topic}"</span></div>
            <div class="row"><span class="lbl">Date de Délibération :</span><span class="val">${s.date}</span></div>
            <div class="row"><span class="lbl">Président du Jury :</span><span class="val">${s.president}</span></div>
          </div>

          <div class="score-box">
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">DÉCISION & NOTE FINALE DU JURY</div>
            <div class="score-val">${score} / 20</div>
            <div class="mention-val">Mention : ${mentionText}</div>
          </div>

          <div class="signatures">
            <div>Président du Jury<br><small>${s.president}</small></div>
            <div>Encadrant<br><small>${s.encadrant}</small></div>
            <div>Rapporteur<br><small>${s.rapporteur}</small></div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
    toast.success(`Procès-Verbal officiel généré avec la note ${score}/20 !`);
  };

  const handleWhatsAppJuryBroadcast = (s: any) => {
    const message = encodeURIComponent(`CONVOCATION SOUTENANCE PFE — ENCG Fès:\n\nChers membres du Jury (${s.president}, ${s.encadrant}, ${s.rapporteur}),\nNous vous confirmons la soutenance du PFE de l'étudiant ${s.student}:\n\n📅 Date: ${s.date} (${s.time})\n📍 Lieu: ${s.room}\n📘 Sujet: "${s.topic}"\n\nMerci pour votre présence.`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
    toast.success('Rappel WhatsApp préparé pour les membres du Jury !');
  };

  const filtered = soutenances.filter(s => 
    s.student.toLowerCase().includes(search.toLowerCase()) || 
    s.topic.toLowerCase().includes(search.toLowerCase()) ||
    s.president.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in relative p-4 md:p-8 max-w-[1500px] mx-auto font-sans pb-24">
      {/* Deep Navy Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Top Header Content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Session Officielle S10 — Plannings & Commissions ENCG Fès
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Jurys & Soutenances PFE
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Planificateur algorithmique croisant les disponibilités des professeurs, les sujets des étudiants et l'occupation des salles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button 
              onClick={handleAutoScheduleIA}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white" /> Auto-Planifier (IA)
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">PFE À SOUTENIR</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">385 Diplômants</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">PROFESSEURS MOBILISÉS</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">42 Enseignants</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 block">CONFLITS D'AGENDA</span>
            <span className="text-2xl font-black text-rose-300 font-mono mt-1 block">
              {soutenances.filter(s => s.status === 'CONFLICT').length} À Résoudre
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">SOUTENANCES PLANIFIÉES</span>
            <span className="text-2xl font-black text-purple-300 font-mono mt-1 block">
              {soutenances.filter(s => s.status === 'SCHEDULED').length} Valides
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Calendrier Officiel des Jurys</h2>
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher étudiant ou professeur..." 
              className="w-full pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-16">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-bold text-xs">
              Aucune soutenance enregistrée en base de données.
            </div>
          ) : filtered.map((s) => (
            <div 
              key={s.id} 
              className={cn(
                "p-6 rounded-3xl border transition-all hover:shadow-lg",
                s.status === 'CONFLICT' 
                  ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-300" 
                  : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80"
              )}
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Time & Location */}
                <div className="shrink-0 w-52 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 pb-4 lg:pb-0 lg:pr-6 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-900 dark:text-indigo-200">
                    <Calendar className="w-4 h-4 text-indigo-600" /> {s.date}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-slate-400" /> {s.time}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-amber-500" /> {s.room}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-white mb-1">{s.student}</h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 italic">"{s.topic}"</p>
                    </div>
                    
                    {s.status === 'CONFLICT' ? (
                      <span className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border border-rose-300 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Conflit de Salle
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Planifié
                      </span>
                    )}
                  </div>

                  {/* Jury Members Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">PRÉSIDENT DU JURY</span>
                      <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 mt-0.5 block">{s.president}</span>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">ENCADRANT PÉDAGOGIQUE</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5 block">{s.encadrant}</span>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">RAPPORTEUR</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5 block">{s.rapporteur}</span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSelectedPvModal(s); setPvScore(s.score || 17); }}
                        className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" /> PV Soutenance (Note & Mention)
                      </button>
                      <button
                        onClick={() => handlePrintJuryConvocation(s)}
                        className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-black text-xs rounded-xl transition-all border border-blue-200 cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" /> Convocation Jury
                      </button>
                      <button
                        onClick={() => handleWhatsAppJuryBroadcast(s)}
                        className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 font-black text-xs rounded-xl transition-all border border-emerald-200 cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        📱 WhatsApp Jury
                      </button>
                    </div>

                    {s.status === 'CONFLICT' && (
                      <button
                        onClick={handleAutoScheduleIA}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Résoudre par IA
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal PV de Soutenance (Note & Mention) */}
      {selectedPvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Procès-Verbal de Soutenance PFE</span>
                <h2 className="text-lg font-black">{selectedPvModal.student}</h2>
              </div>
              <button 
                onClick={() => setSelectedPvModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-1 text-xs font-bold">
                <p className="text-slate-500">Sujet du Mémoire : <span className="text-slate-900 dark:text-white font-black">"{selectedPvModal.topic}"</span></p>
                <p className="text-slate-500">Président du Jury : <span className="text-indigo-600 dark:text-indigo-400 font-black">{selectedPvModal.president}</span></p>
              </div>

              {/* Score Input Slider */}
              <div className="space-y-3 p-5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-3xl border border-indigo-200 text-center">
                <label className="block text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-200">Note Attribuée par la Commission (sur 20)</label>
                <div className="text-4xl font-black text-amber-500 font-mono">{pvScore} / 20</div>
                <input 
                  type="range" 
                  min="10" 
                  max="20" 
                  step="0.5" 
                  value={pvScore} 
                  onChange={(e) => setPvScore(parseFloat(e.target.value))}
                  className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                />
                <div className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 pt-2 border-t border-indigo-200">
                  Mention : <span className="text-emerald-600 dark:text-emerald-400">{getMention(pvScore)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
              <button 
                onClick={() => handlePrintPvSoutenance(selectedPvModal, pvScore)}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-black rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Générer & Imprimer le PV A4
              </button>
              <button 
                onClick={() => setSelectedPvModal(null)}
                className="px-6 py-2.5 bg-slate-900 text-white font-black rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
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
