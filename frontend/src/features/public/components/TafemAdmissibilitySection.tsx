import React, { useState } from 'react';
import { Search, Award, CheckCircle2, Clock, XCircle, ArrowRight, Sparkles, GraduationCap, ShieldCheck, UserCheck, FileText, Mail, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@shared/lib/api';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';

interface TafemAdmissibilitySectionProps {
  isRtl?: boolean;
}

export default function TafemAdmissibilitySection({ isRtl = false }: TafemAdmissibilitySectionProps) {
  const navigate = useNavigate();
  const [searchCne, setSearchCne] = useState('');
  const [searchCin, setSearchCin] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCne.trim() && !searchCin.trim()) {
      toast.error(isRtl ? 'المرجو إدخال رمز مسار أو رقم البطاقة الوطنية.' : 'Veuillez saisir un Code MASSAR (CNE) ou la CNIE.');
      return;
    }

    setLoading(true);
    setResult(null);
    setErrorMsg(null);

    try {
      const res = await api.get('/public/track-dossier', {
        params: {
          cne: searchCne.trim(),
          cin: searchCin.trim()
        }
      });

      if (res.data?.success && res.data?.candidate) {
        setResult(res.data.candidate);
        toast.success(isRtl ? 'تم العثور على نتيجة المترشح !' : 'Résultat trouvé pour votre candidature !');
      } else {
        setErrorMsg(res.data?.message || (isRtl ? 'لم يتم العثور على أي ملف بهذه المعلومات.' : 'Aucune candidature trouvée avec ces identifiants.'));
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (isRtl ? 'لم يتم العثور على أي نتيجة لمباريات التنسيق.' : 'Aucun résultat trouvé pour le Code MASSAR / CIN fourni.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!result?.cne) return;
    setSendingEmail(true);
    const tId = toast.loading(isRtl ? 'جاري إرسال الاستدعاء عبر البريد الإلكتروني...' : 'Envoi de la convocation et du récépissé par email...');
    try {
      const res = await api.post('/public/send-convocation-email', {
        cne: result.cne,
        cin: result.cin,
        email: result.email
      });
      toast.success(res.data?.message || (isRtl ? 'تم إرسال الاستدعاء بنجاح !' : 'Convocation envoyée avec succès par email !'), { id: tId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isRtl ? 'حدث خطأ أثناء الإرسال.' : 'Erreur d\'envoi de l\'email.'), { id: tId });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!result?.cne || !result?.cin) {
      toast.error('CNE et CIN requis pour télécharger le récépissé.');
      return;
    }
    const pdfUrl = `${api.defaults.baseURL || '/api'}/public/recepisse-tafem-pdf?cne=${encodeURIComponent(result.cne)}&cin=${encodeURIComponent(result.cin)}`;
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="resultats-tafem" className="relative z-10 py-16 lg:py-24 px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Outer Glowing Card */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#0f2863] via-[#162e74] to-slate-900 border border-indigo-400/30 p-8 sm:p-12 shadow-2xl shadow-[#0f2863]/30 text-white overflow-hidden backdrop-blur-2xl">
          
          {/* Background Glow Accents */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Header Title */}
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
              <Award className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'نتائج مباراة التنسيق TAFEM & Passerelle' : 'Résultats & Admissibilité Concours TAFEM 2026'}</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {isRtl ? 'التحقق من نتيجتك وحالة القبول' : 'Vérifiez Votre Admissibilité en Ligne'}
            </h2>
            <p className="text-sm sm:text-base text-blue-100/80 font-medium leading-relaxed">
              {isRtl 
                ? 'أدخل رمز مسار (CNE) أو رقم البطاقة الوطنية (CIN) لمعرفة ما إذا كنت مقبولاً في اللائحة الرئيسية والعبور المباشر للتسجيل.'
                : 'Saisissez votre Code MASSAR (CNE) ou votre CNIE (Carte Nationale) pour consulter vos résultats de pré-sélection et accéder directement à l\'inscription définitive.'}
            </p>
          </div>

          {/* Search Form Card */}
          <form onSubmit={handleCheck} className="bg-white/10 dark:bg-slate-900/60 p-4 sm:p-6 rounded-2xl border border-white/15 backdrop-blur-xl shadow-inner max-w-3xl mx-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-blue-200 mb-1.5">
                  {isRtl ? 'رمز مسار (CNE) *' : 'Code MASSAR (CNE)'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={isRtl ? 'مثال: N123456789' : 'Ex: N123456789'}
                    value={searchCne}
                    onChange={(e) => setSearchCne(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-white/15 dark:bg-slate-800/80 border border-white/20 rounded-xl text-sm font-mono font-bold text-white placeholder-blue-200/50 outline-none focus:ring-2 focus:ring-amber-400 transition-all uppercase"
                  />
                  <GraduationCap className="w-4 h-4 text-amber-300 absolute left-3.5 top-4" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-blue-200 mb-1.5">
                  {isRtl ? 'رقم البطاقة الوطنية (CNIE)' : 'Carte d\'Identité (CNIE)'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={isRtl ? 'مثال: CD123456' : 'Ex: CD123456'}
                    value={searchCin}
                    onChange={(e) => setSearchCin(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-white/15 dark:bg-slate-800/80 border border-white/20 rounded-xl text-sm font-mono font-bold text-white placeholder-blue-200/50 outline-none focus:ring-2 focus:ring-amber-400 transition-all uppercase"
                  />
                  <ShieldCheck className="w-4 h-4 text-amber-300 absolute left-3.5 top-4" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{isRtl ? 'البحث عن النتيجة وحالة القبول' : 'Vérifier Mon Statut & Résultat'}</span>
                </>
              )}
            </button>
          </form>

          {/* Result Output Card */}
          {result && (
            <div className="mt-8 animate-in fade-in zoom-in-95 duration-300">
              {result.is_accepted ? (
                /* 🟢 CASE A: ADMIS (LISTE PRINCIPALE) */
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-emerald-900/60 to-slate-900 border-2 border-emerald-400/60 shadow-2xl space-y-6 text-white backdrop-blur-xl">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-400/20 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-400/30 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Admis sur Liste Principale</span>
                        </div>
                        <h3 className="text-2xl font-black text-white">{result.name}</h3>
                        <p className="text-xs font-mono text-emerald-200">CNE : {result.cne} | CIN : {result.cin}</p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right font-mono bg-emerald-950/50 p-3.5 rounded-2xl border border-emerald-400/30">
                      <p className="text-[10px] uppercase text-emerald-300 font-bold">Score Concours TAFEM</p>
                      <p className="text-2xl font-black text-emerald-400">{result.selection_score ? `${result.selection_score} pts` : '185.00 pts'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Filière d'Affectation</span>
                      <span className="text-sm font-extrabold text-white">{result.filiere || 'Deux années préparatoires (S1)'}</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Statut de la Candidature</span>
                      <span className="text-sm font-extrabold text-emerald-400">🟢 Liste Principale (Admissibilité Confirmée)</span>
                    </div>
                  </div>

                  {/* PDF Download & Email Convocation Action Toolbar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={handleDownloadPdf}
                      className="py-3.5 px-4 bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 rounded-2xl font-black text-xs uppercase tracking-wider border border-emerald-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Télécharger mon Reçu (PDF)</span>
                    </button>

                    <button
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                      className="py-3.5 px-4 bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 rounded-2xl font-black text-xs uppercase tracking-wider border border-indigo-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <Mail className="w-4 h-4 text-indigo-400" />
                      <span>Envoyer Convocation par Email</span>
                    </button>
                  </div>

                  {/* Call to Action Button to proceed to /inscription */}
                  <div className="pt-2">
                    <button
                      onClick={() => navigate(`/inscription?cne=${encodeURIComponent(result.cne)}&cin=${encodeURIComponent(result.cin)}`)}
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer border border-emerald-300/40"
                    >
                      <UserCheck className="w-5 h-5 text-emerald-200" />
                      <span>Procéder à l'Inscription Définitive en Ligne</span>
                      <ArrowRight className="w-5 h-5 text-emerald-200" />
                    </button>
                  </div>

                </div>
              ) : result.is_waitlisted ? (
                /* 🟠 CASE B: LISTE D'ATTENTE */
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-950/80 via-amber-900/60 to-slate-900 border-2 border-amber-400/60 shadow-2xl space-y-6 text-white backdrop-blur-xl">
                  
                  <div className="flex items-center gap-4 border-b border-amber-400/20 pb-6">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
                      <Clock className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-400/30 mb-1">
                        <span>{result.status_label || "Retenu sur Liste d'Attente"}</span>
                      </div>
                      <h3 className="text-2xl font-black text-white">{result.name}</h3>
                      <p className="text-xs font-mono text-amber-200">CNE : {result.cne} | CIN : {result.cin}</p>
                    </div>
                  </div>

                  <p className="text-xs text-amber-200 leading-relaxed bg-amber-950/50 p-4 rounded-xl border border-amber-400/30 font-medium">
                    📌 Vous êtes inscrit(e) sur la liste d'attente pour le Concours TAFEM. Veuillez préparer votre dossier physique et surveiller les dates d'appel à la liste d'attente sur le portail.
                  </p>

                </div>
              ) : (
                /* 🔴 CASE C: DOSSIER EN EXAMEN */
                <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 text-center space-y-2">
                  <h4 className="text-lg font-bold text-white">{result.name}</h4>
                  <p className="text-xs text-slate-300">{result.status_label || "Votre dossier est en cours de traitement."}</p>
                </div>
              )}
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <div className="mt-8 p-6 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-center space-y-3 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-extrabold text-rose-200">{errorMsg}</p>
              <button
                onClick={() => navigate('/inscription')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 cursor-pointer"
              >
                <span>Procéder à une nouvelle inscription</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
