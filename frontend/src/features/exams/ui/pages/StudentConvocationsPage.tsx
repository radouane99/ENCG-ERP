import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Download, 
  QrCode, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Ticket,
  FileCheck2,
  X,
  Eye,
  ExternalLink
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useAuthStore } from '@stores/authStore';
import api from '@shared/lib/api';
import { toast } from 'sonner';

export default function StudentConvocationsPage() {
  const { i18n } = useTranslation(['student', 'common']);
  const isRtl = i18n.language === 'ar';
  const { user } = useAuthStore();

  const [activeSession, setActiveSession] = useState<'ORDINAIRE' | 'RATTRAPAGE'>('ORDINAIRE');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  // Query real student exam seatings & convocations
  const { data: convData, isLoading } = useQuery({
    queryKey: ['studentConvocations', activeSession],
    queryFn: async () => {
      const res = await api.get(`/v1/student-portal/convocations?session_type=${activeSession}`);
      return res.data;
    }
  });

  const convocations = convData?.convocations || [];

  const handlePreviewPdf = async () => {
    if (previewPdfUrl) {
      setIsPreviewModalOpen(true);
      return;
    }

    try {
      setIsPreviewLoading(true);
      toast.info(isRtl ? 'جاري تجهيز معاينة الاستدعاء الرسمي...' : "Chargement de l'Aperçu officiel (PDF A4)...");
      const studentId = (user as any)?.student?.id || (user as any)?.id || 'me';
      const url = `/students/${studentId}/convocation-pdf?session_type=${activeSession}`;

      const res = await api.get(url, {
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const objectUrl = window.URL.createObjectURL(blob);
      setPreviewPdfUrl(objectUrl);
      setIsPreviewModalOpen(true);
    } catch (err: any) {
      console.error('Erreur aperçu convocation:', err);
      let errorMsg = isRtl ? 'فشل تحميل ملف الاستدعاء.' : 'Erreur lors du chargement de la convocation PDF.';
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errorMsg = json.message;
        } catch {}
      } else if (err?.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      toast.error(errorMsg);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      toast.info(isRtl ? 'جاري استخراج استدعاء الامتحان الرسمي...' : 'Génération de la Convocation officielle aux Examens (PDF)...');

      const studentId = (user as any)?.student?.id || (user as any)?.id || 'me';
      const url = `/students/${studentId}/convocation-pdf?session_type=${activeSession}`;

      const res = await api.get(url, {
        responseType: 'blob',
        headers: { Accept: 'application/pdf' },
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Convocation_Examens_${user?.name?.replace(/\s+/g, '_') || 'Etudiant'}_${activeSession}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 60000);

      toast.success(isRtl ? 'تم تحميل استدعاء الامتحان بنجاح !' : 'Convocation officielle téléchargée avec succès !');
    } catch (err: any) {
      console.error('Erreur téléchargement convocation:', err);
      let errorMsg = isRtl ? 'فشل تحميل ملف الاستدعاء.' : 'Erreur lors du téléchargement de la convocation PDF.';
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errorMsg = json.message;
        } catch {}
      } else if (err?.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      toast.error(errorMsg);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className={cn("p-4 sm:p-6 max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-20", isRtl && "rtl")}>
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#001A4B] via-[#0f2863] to-[#1e3a8a] text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-blue-950/40">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold border border-white/15">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isRtl ? 'وثيقة رسمية مؤمنة — المدرسة الوطنية للتجارة والتسيير بفاس' : 'Document Officiel Sécurisé — ENCG Fès'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isRtl ? 'استدعاءات الامتحانات الرسمية' : 'Mes Convocations aux Examens'}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {isRtl 
                ? 'تحميل الاستدعاءات الرسمية للاختبارات النهائية والدورات الاستدراكية المزودة برمز QR الرقمي لمرور القاعات والتحقق من رقم المقعد.'
                : 'Consultez votre planning d\'épreuves, vos places réservées en amphi/salle et téléchargez votre convocation certifiée conforme avec Pass QR d\'accès.'}
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{activeSession === 'ORDINAIRE' ? 'Session Normale (Printemps 2026)' : 'Session de Rattrapage'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-semibold">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{convocations.length} {isRtl ? 'اختبارات مبرمجة' : 'épreuve(s) assignée(s)'}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons: Preview & Download */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button
              onClick={handlePreviewPdf}
              disabled={isPreviewLoading || isDownloadingPdf}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 h-12 px-5 rounded-2xl font-bold text-xs sm:text-sm backdrop-blur-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Eye className={cn("w-4 h-4 text-blue-200", isPreviewLoading && "animate-pulse")} />
              <span>{isPreviewLoading ? (isRtl ? 'جاري التحميل...' : 'Chargement...') : (isRtl ? 'معاينة مباشرة' : 'Aperçu Direct')}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf || isPreviewLoading}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white h-12 px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-xl shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shrink-0"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isRtl ? 'جاري إنشاء الـ PDF...' : 'Génération...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isRtl ? 'تحميل الاستدعاء (PDF)' : 'Télécharger la Convocation (PDF)'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Session Selector Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => {
            setActiveSession('ORDINAIRE');
            setPreviewPdfUrl(null);
          }}
          className={cn(
            "flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer",
            activeSession === 'ORDINAIRE'
              ? "bg-[#002e5b] text-white shadow-lg shadow-[#002e5b]/25"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <Calendar className="w-4 h-4" />
          <span>{isRtl ? 'الدورة العادية (Session Normale)' : 'Session Ordinaire (Normale)'}</span>
        </button>

        <button
          onClick={() => {
            setActiveSession('RATTRAPAGE');
            setPreviewPdfUrl(null);
          }}
          className={cn(
            "flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer",
            activeSession === 'RATTRAPAGE'
              ? "bg-[#002e5b] text-white shadow-lg shadow-[#002e5b]/25"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <Calendar className="w-4 h-4" />
          <span>{isRtl ? 'الدورة الاستدراكية (Rattrapage)' : 'Session de Rattrapage'}</span>
        </button>
      </div>

      {/* Exam Schedule Cards List */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-20 space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#002e5b]" />
          <p className="text-xs font-semibold text-slate-500">
            {isRtl ? 'جاري تحميل جدول الاختبارات الرسمية...' : 'Chargement des convocations officielles...'}
          </p>
        </div>
      ) : convocations.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">
            {isRtl ? 'لا توجد امتحانات مبرمجة في هذه الدورة' : 'Aucune convocation disponible pour cette session.'}
          </h3>
          <p className="text-xs text-slate-400">
            {isRtl ? 'سيتم نشر جدول الامتحانات فور اعتماده من قبل الإدارة.' : 'Le planning d\'examen sera affiché dès publication officielle par la scolarité.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {convocations.map((exam: any) => (
            <div 
              key={exam.id}
              className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group border-l-4 border-l-[#002e5b]"
            >
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-50 text-[#002e5b] font-extrabold text-xs rounded-lg border border-blue-100 font-mono">
                    {exam.code}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{exam.status || 'Programmée'}</span>
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-[#002e5b] transition-colors">
                  {exam.module}
                </h3>

                <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600 pt-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800">{exam.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-slate-700">{exam.time} ({exam.duration})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span className="font-bold text-[#002e5b] bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                      {exam.room}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seat & Digital QR Ticket Actions */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 md:self-center">
                <div className="text-center px-4 border-r border-slate-200">
                  <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{isRtl ? 'المقعد' : 'Place'}</div>
                  <div className="text-xl font-extrabold text-[#002e5b]">{exam.seat}</div>
                </div>

                <button
                  onClick={() => {
                    setSelectedExam(exam);
                    setShowQrModal(true);
                  }}
                  className="flex items-center gap-2 bg-[#002e5b] hover:bg-[#0f2863] active:scale-95 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{isRtl ? 'عرض Pass QR' : 'Pass QR Entrée'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rules Banner */}
      <div className="bg-amber-50 border border-amber-200/90 p-5 rounded-2xl flex items-start gap-4 text-amber-900 shadow-sm">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1.5">
          <p className="font-bold text-amber-950 uppercase tracking-wide">
            {isRtl ? 'تنبيه مهم للطلبة أثناء الاختبارات :' : 'Consignes Officielles & Discipline des Épreuves :'}
          </p>
          <ul className="list-disc list-inside space-y-1 text-amber-900 font-medium">
            <li>{isRtl ? 'حضور الطالب 15 دقيقة قبل بداية الامتحان إجباري.' : 'Présence obligatoire devant la salle 15 minutes avant le début de l\'épreuve.'}</li>
            <li>{isRtl ? 'إظهار بطاقة الطالب أو الاستدعاء عند باب القاعة.' : 'Présentation obligatoire de la carte d\'étudiant ou de la CIN avec la convocation imprimée.'}</li>
            <li>{isRtl ? 'يمنع منعا كليا إدخال الهواتف والساعات الذكية.' : 'Téléphones portables et montres connectées strictly interdits sous peine de Conseil de Discipline immédiat.'}</li>
            <li>{isRtl ? 'التوقيع في لائحة الحضور إلزامي قبل الخروج من القاعة.' : 'Signature obligatoire de la feuille d\'émargement avant de quitter la salle d\'examen.'}</li>
          </ul>
        </div>
      </div>

      {/* QR Code Digital Entrance Pass Modal */}
      {showQrModal && selectedExam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95 border border-slate-200 relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-blue-50 text-[#002e5b] rounded-2xl flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
              <Ticket className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                ENCG Fès — Pass Numérique
              </span>
              <h3 className="font-extrabold text-slate-900 text-base mt-2">{selectedExam.module}</h3>
              <p className="text-xs font-bold text-slate-600 mt-1">
                {selectedExam.room} &bull; <span className="text-emerald-700 font-extrabold">{selectedExam.seat}</span>
              </p>
              <p className="text-[11px] text-slate-500">{selectedExam.date} à {selectedExam.time}</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block mx-auto shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedExam.qrToken || `CONV-${selectedExam.id}`)}`}
                alt="QR Code Pass"
                className="w-44 h-44 mx-auto rounded-lg"
              />
              <p className="text-[10px] font-mono font-bold text-slate-500 mt-2">{selectedExam.qrToken || `CONV-${selectedExam.id}`}</p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {isRtl ? 'امسح هذا الرمز عند باب القاعة لتسجيل الحضور وتأكيد مكان الجلوس.' : 'Scannez ce Pass QR à la porte de la salle pour contrôle d\'identité et émargement biométrique.'}
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
            >
              {isRtl ? 'إغلاق' : 'Fermer'}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal Aperçu Convocation PDF ── */}
      {isPreviewModalOpen && previewPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2 truncate">
                    <span>{isRtl ? 'معاينة استدعاء الامتحان الرسمي' : 'Aperçu Convocation Officielle aux Examens'}</span>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {activeSession === 'ORDINAIRE' ? 'Session Normale' : 'Session Rattrapage'}
                    </span>
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    {user?.name || 'Étudiant'} • {convocations.length} {isRtl ? 'اختبارات مبرمجة' : 'épreuves assignées'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => window.open(previewPdfUrl, '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  title="Ouvrir en plein écran dans un nouvel onglet"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isRtl ? 'نافذة جديدة' : 'Nouvel Onglet'}</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>{isRtl ? 'تحميل' : 'Télécharger'}</span>
                </button>

                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Fermer l'aperçu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-2 sm:p-4 bg-slate-100/50 dark:bg-slate-950/50 overflow-hidden flex flex-col items-center justify-center">
              <iframe
                src={`${previewPdfUrl}#toolbar=0&navpanes=0`}
                className="w-full h-[65vh] sm:h-[75vh] rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white shadow-inner"
                title="Aperçu Convocation PDF"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
