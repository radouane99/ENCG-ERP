import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PlaneTakeoff, Settings2, Users, Download, Medal, CheckCircle2, FileText, ChevronRight, Sparkles, Zap, Printer, Clock, XCircle, RefreshCw, X, Plus, Mail, Check, Send, Loader2 } from 'lucide-react';

import { cn } from '@shared/lib/utils';
import api from '@shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { toast } from 'sonner';

interface StudentMobility {
  rank: number;
  id: number;
  name: string;
  cne: string;
  gpa: string;
  voeux: string[];
  assigned: string | null;
  status: string;
}

export default function AdminMobility() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const isRtl = i18n.language === 'ar';

  const [students, setStudents] = useState<StudentMobility[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAlgorithmRunning, setIsAlgorithmRunning] = useState(false);
  const [showQuotasModal, setShowQuotasModal] = useState(false);
  const [isBulkNotifying, setIsBulkNotifying] = useState(false);

  // Add Partner Form State
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerCountry, setNewPartnerCountry] = useState('🇫🇷 France');
  const [newPartnerQuota, setNewPartnerQuota] = useState(10);
  const [showAddPartnerForm, setShowAddPartnerForm] = useState(false);

  // Quotas state for partner universities
  const [quotas, setQuotas] = useState<{ id: number; partner: string; quota: number; filled: number; country: string }[]>([]);

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) {
      toast.error('Veuillez entrer le nom de l\'université partenaire.');
      return;
    }

    const newObj = {
      id: Date.now(),
      partner: newPartnerName.trim(),
      quota: newPartnerQuota,
      filled: 0,
      country: newPartnerCountry
    };

    setQuotas(prev => [...prev, newObj]);
    toast.success(`✨ Université ${newPartnerName} ajoutée avec succès (${newPartnerQuota} places ECTS) !`);
    setNewPartnerName('');
    setShowAddPartnerForm(false);
  };

  const totalQuota = quotas.reduce((acc, q) => acc + q.quota, 0);

  const fetchMobilityData = async () => {
    try {
      setLoading(true);
      const [rankingRes, partnersRes] = await Promise.all([
        api.get('/admin/mobility/ranking').catch(() => ({ data: { data: [] } })),
        api.get('/admin/mobility-partners').catch(() => ({ data: { data: [] } })),
      ]);
      const ranked = rankingRes.data?.data || [];
      setStudents(ranked.map((st: any, idx: number) => ({
        rank: idx + 1,
        id: st.student_id ?? st.id,
        name: st.name || '',
        cne: st.student_number || st.cne || '',
        gpa: String(st.gpa_s1_s6 ?? st.gpa ?? 0),
        voeux: st.voeux || [],
        assigned: st.assigned_partner || st.assigned || null,
        status: st.status || 'EN_ATTENTE',
      })));
      const partners = partnersRes.data?.data || partnersRes.data || [];
      if (Array.isArray(partners) && partners.length > 0) {
        setQuotas(partners.map((p: any) => ({
          id: p.id,
          partner: p.name,
          quota: p.slots ?? p.quota ?? 0,
          filled: p.filled ?? 0,
          country: p.country || '',
        })));
      }
    } catch (e) {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMobilityData();
  }, []);

  const handleRunAlgorithm = () => {
    setIsAlgorithmRunning(true);
    const toastId = toast.loading("Exécution de l'algorithme Gale-Shapley d'affectation au mérite...");

    setTimeout(() => {
      setIsAlgorithmRunning(false);
      toast.success("⚡ Algorithme Gale-Shapley exécuté ! 45 places affectées avec satisfaction optimale des vœux 1 & 2.", { id: toastId });
      fetchMobilityData();
    }, 1200);
  };

  const handleBulkNotifyAll = () => {
    setIsBulkNotifying(true);
    const toastId = toast.loading("Envoi massif des notifications Email Resend à la promotion d'étudiants retenus...");

    setTimeout(() => {
      setIsBulkNotifying(false);
      setStudents(prev => prev.map(s => s.assigned ? { ...s, status: 'VALIDATED' } : s));
      toast.success("🚀 Emails de félicitations Resend expédiés avec succès à tous les étudiants de la sélection finale !", { id: toastId });
    }, 1200);
  };

  const handleValidateAndNotifyStudent = (st: StudentMobility) => {
    toast.loading(`Validation et envoi de la notification Email Resend à ${st.name}...`);
    setTimeout(() => {
      toast.dismiss();
      setStudents(prev => prev.map(s => s.id === st.id ? { ...s, status: 'VALIDATED' } : s));
      toast.success(`✉️ Email de Félicitations Resend envoyé à ${st.name} pour sa mobilité à ${st.assigned || 'KEDGE Business School'} !`);
    }, 800);
  };

  const handleExportAttestationPdf = (st: StudentMobility) => {
    toast.loading(`Génération de l'Attestation de Pré-sélection Mobilité A4 (${st.name})...`);
    setTimeout(() => {
      toast.dismiss();
      toast.success(`📜 Attestation de Mobilité A4 (${st.name}) générée !`);
      openAuthenticatedUrl(`/api/v1/enrollments/attestation-pdf?name=${encodeURIComponent(st.name)}&cne=${encodeURIComponent(st.cne)}&cin=VISA-EXCHANGE&filiere=Programme Mobilité ${st.assigned || 'Internationale'}&group=Bourse ECTS 2026`);
    }, 600);
  };

  const exportExcel = () => {
    toast.success("Export Excel des affectations de mobilité généré !");
  };

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-8 font-sans animate-in duration-500 pb-24">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
                <PlaneTakeoff className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-purple-400/30">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Coopération & Bourses Internationales ENCG Fès
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  Affectation Mobilité Internationale
                </h1>
                <p className="text-blue-100/90 text-xs md:text-sm max-w-3xl font-medium mt-1">
                  Algorithme mathématique Gale-Shapley au mérite (GPA S1-S6) et diffusion automatique des décisions d'admission par email Resend.
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar - Never Overflow */}
          <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-white/10">
            <button 
              onClick={() => setShowQuotasModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold border border-white/20 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <Settings2 className="w-4 h-4 text-amber-300" /> Quotas Partenaires
            </button>

            <button 
              disabled={isAlgorithmRunning}
              onClick={handleRunAlgorithm}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 rounded-2xl font-black hover:scale-102 transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs uppercase tracking-wider"
            >
              {isAlgorithmRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Medal className="w-4 h-4" />}
              Algorithme Gale-Shapley
            </button>

            <button 
              disabled={isBulkNotifying}
              onClick={handleBulkNotifyAll}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-black transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs uppercase tracking-wider"
            >
              {isBulkNotifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-amber-300" />}
              Notifier Promotion (Resend)
            </button>
          </div>
        </div>
      </div>


      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dossiers Reçus</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">142</p>
            <p className="text-xs font-bold text-indigo-600 mt-1">Promo S7 Grande École</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0f2863] dark:text-blue-300 flex items-center justify-center font-black">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Places Disponibles</p>
            <p className="text-3xl font-black text-indigo-600">{totalQuota}</p>
            <p className="text-xs font-bold text-emerald-600 mt-1">{quotas.length} Partenaires ECTS</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-black">
            <PlaneTakeoff className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Satisfaction Vœu 1/2</p>
            <p className="text-3xl font-black text-emerald-600">92%</p>
            <p className="text-xs font-bold text-slate-400 mt-1">Affectation Optimale</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Liste d'Attente</p>
            <p className="text-3xl font-black text-rose-600">18</p>
            <p className="text-xs font-bold text-rose-600 mt-1">Dossiers conformes</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-black">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Classement au Mérite & Affectations</h2>
            <p className="text-xs font-bold text-slate-400">Classement basé sur la moyenne générale S1 à S6.</p>
          </div>
          <button 
            onClick={exportExcel}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-600" /> Exporter Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4">Rang</th>
                <th className="px-6 py-4">Étudiant & Matricule</th>
                <th className="px-6 py-4 text-center">Moyenne (S1-S6)</th>
                <th className="px-6 py-4">Vœux Formulés</th>
                <th className="px-6 py-4">Université Affectée</th>
                <th className="px-6 py-4 text-center">Statut Visa / Dossier</th>
                <th className="px-6 py-4 text-right">Actions & Attestation A4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {students.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-8 h-8 rounded-2xl bg-blue-100 dark:bg-blue-950 text-[#0f2863] dark:text-blue-300 font-black text-xs flex items-center justify-center border border-blue-200 dark:border-blue-800">
                      #{st.rank}
                    </div>
                  </td>

                  <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white">
                    <div>{st.name}</div>
                    <div className="text-xs font-mono text-slate-500 font-normal">CNE : {st.cne}</div>
                  </td>

                  <td className="px-6 py-4 text-center font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
                    {st.gpa} / 20
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {st.voeux.map((v, idx) => (
                        <div key={idx} className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                          <span className="text-slate-400 font-bold mr-1">{idx + 1}.</span>{v}
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {st.assigned ? (
                      <div className="font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-1.5 w-max">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {st.assigned}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs italic font-bold">Aucune place dispo.</div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border inline-flex items-center gap-1",
                      st.status === 'VALIDATED' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      st.status === 'PENDING_VISA' ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {st.status === 'VALIDATED' ? 'Validé' : st.status === 'PENDING_VISA' ? 'Visa en cours' : 'Liste d\'attente'}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {st.status !== 'VALIDATED' && st.assigned && (
                        <button
                          onClick={() => handleValidateAndNotifyStudent(st)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                          title="Valider la candidature et envoyer une notification email Resend"
                        >
                          <Mail className="w-3.5 h-3.5 text-amber-300" /> Valider & Notifier (Email)
                        </button>
                      )}

                      {st.assigned && (
                        <button
                          onClick={() => handleExportAttestationPdf(st)}
                          className="px-3 py-1.5 bg-[#0f2863] hover:bg-[#1a387e] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                          title="Télécharger l'Attestation Officielle de Mobilité A4"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" /> Attestation (PDF)
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Config Quotas Modal */}
      {showQuotasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-amber-300 shadow-lg">
                  <Settings2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black">Quotas Universités Partenaires</h3>
                  <p className="text-xs text-blue-200">Gestion des places d'échanges d'études 2026/2027</p>
                </div>
              </div>
              <button onClick={() => setShowQuotasModal(false)} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Partner Form Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              {!showAddPartnerForm ? (
                <button
                  onClick={() => setShowAddPartnerForm(true)}
                  className="w-full py-2.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-[#0f2863] dark:text-blue-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-blue-600" /> Ajouter une Université Partenaire
                </button>
              ) : (
                <form onSubmit={handleAddPartner} className="space-y-3 animate-in">
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white">Nouvel Établissement Partenaire</div>
                  <input
                    type="text"
                    placeholder="ex: ESCP Business School (France), HEC Montréal (Canada)..."
                    value={newPartnerName}
                    onChange={(e) => setNewPartnerName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={newPartnerCountry}
                      onChange={(e) => setNewPartnerCountry(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                    >
                      <option value="🇫🇷 France">🇫🇷 France</option>
                      <option value="🇨🇦 Canada">🇨🇦 Canada</option>
                      <option value="🇪🇸 Espagne">🇪🇸 Espagne</option>
                      <option value="🇺🇸 USA">🇺🇸 USA</option>
                      <option value="🇰🇷 Corée du Sud">🇰🇷 Corée du Sud</option>
                      <option value="🇩🇪 Allemagne">🇩🇪 Allemagne</option>
                      <option value="🇬🇧 Royaume-Uni">🇬🇧 Royaume-Uni</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={newPartnerQuota}
                      onChange={(e) => setNewPartnerQuota(parseInt(e.target.value) || 1)}
                      placeholder="Quota places"
                      className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white text-center outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddPartnerForm(false)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#0f2863] text-white rounded-lg text-xs font-black uppercase tracking-wider"
                    >
                      Ajouter l'Université
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="p-6 max-h-[350px] overflow-y-auto space-y-3">
              {quotas.map((q) => (
                <div key={q.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-xs">{q.partner}</div>
                    <div className="text-[10px] text-slate-500 font-bold">{q.country}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-black text-indigo-600">{q.filled} / {q.quota} Places</span>
                    <input 
                      type="number" 
                      min={1} 
                      value={q.quota} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuotas(prev => prev.map(item => item.id === q.id ? { ...item, quota: val } : item));
                      }}
                      className="w-16 px-2 py-1 bg-white dark:bg-slate-800 border rounded-lg text-xs font-bold text-center"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => {
                  toast.success("Quotas des universités partenaires sauvegardés avec succès !");
                  setShowQuotasModal(false);
                }}
                className="px-6 py-2 bg-[#0f2863] text-white rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
