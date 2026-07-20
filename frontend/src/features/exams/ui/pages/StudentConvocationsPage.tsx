import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, QrCode, MapPin, Clock, FileText, CheckCircle2, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useAuthStore } from '@stores/authStore';
import api from '@shared/lib/api';

export default function StudentConvocationsPage() {
  const { t, i18n } = useTranslation(['student', 'common']);
  const isRtl = i18n.language === 'ar';
  const { user } = useAuthStore();

  const [activeSession, setActiveSession] = useState<'ORDINAIRE' | 'RATTRAPAGE'>('ORDINAIRE');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);

  // Query real student exam seatings & convocations from MySQL database
  const { data: convData, isLoading } = useQuery({
    queryKey: ['studentConvocations', activeSession],
    queryFn: async () => {
      const res = await api.get(`/v1/student-portal/convocations?session_type=${activeSession}`);
      return res.data;
    }
  });

  const convocations = convData?.convocations || [];

  const handleDownloadPdf = () => {
    const studentId = user?.id || 1;
    const url = `/api/students/${studentId}/convocation-pdf?session_type=${activeSession}`;
    window.open(url, '_blank');
  };

  return (
    <div className={cn("p-6 max-w-7xl mx-auto space-y-8 pb-20", isRtl && "rtl")}>
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#002e5b] to-[#0f2863] text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Document Officiel Sécurisé — ENCG Fès</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {isRtl ? 'استدعاءات الامتحانات الرسمية' : 'Mes Convocations aux Examens'}
            </h1>
            <p className="text-slate-300 text-sm mt-2 max-w-2xl">
              {isRtl 
                ? 'تحميل الاستدعاءات الرسمية للاختبارات النهائية والدورات الاستدراكية المزودة برمز QR الرقمي لمرور القاعات.'
                : 'Consultez et téléchargez vos convocations officielles pour la Session Normale et la Session de Rattrapage avec votre QR Code de passage en amphi.'}
            </p>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Download className="w-5 h-5" />
            <span>{isRtl ? 'تحميل الاستدعاء الكامل (PDF)' : 'Télécharger la Convocation (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Session Selector Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveSession('ORDINAIRE')}
          className={cn(
            "flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all",
            activeSession === 'ORDINAIRE'
              ? "bg-[#002e5b] text-white shadow-md shadow-[#002e5b]/20"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <Calendar className="w-4 h-4" />
          <span>{isRtl ? 'الدورة العادية (Session Normale)' : 'Session Ordinaire (Normale)'}</span>
        </button>

        <button
          onClick={() => setActiveSession('RATTRAPAGE')}
          className={cn(
            "flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all",
            activeSession === 'RATTRAPAGE'
              ? "bg-[#002e5b] text-white shadow-md shadow-[#002e5b]/20"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <Calendar className="w-4 h-4" />
          <span>{isRtl ? 'الدورة الاستدراكية (Rattrapage)' : 'Session de Rattrapage'}</span>
        </button>
      </div>

      {/* Exam Schedule Cards List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#002e5b]" />
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
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-50 text-[#002e5b] font-bold text-xs rounded-lg border border-blue-100">
                    {exam.code}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {exam.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{exam.module}</h3>

                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 pt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800">{exam.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800">{exam.time} ({exam.duration})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-[#002e5b]">{exam.room}</span>
                  </div>
                </div>
              </div>

              {/* Seat & Digital QR Ticket Actions */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 md:self-center">
                <div className="text-center px-3 border-r border-slate-200">
                  <div className="text-xs font-bold text-slate-400 uppercase">{isRtl ? 'المقعد' : 'Place'}</div>
                  <div className="text-xl font-extrabold text-[#002e5b]">{exam.seat}</div>
                </div>

                <button
                  onClick={() => {
                    setSelectedExam(exam);
                    setShowQrModal(true);
                  }}
                  className="flex items-center gap-2 bg-[#002e5b] hover:bg-[#0f2863] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all"
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
      <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-4 text-amber-900">
        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold">{isRtl ? 'تنبيه مهم للطلبة :' : 'Instructions Importantes pour les Épreuves :'}</p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-800">
            <li>{isRtl ? 'حضور الطالب 15 دقيقة قبل بداية الامتحان إجباري.' : 'Présence obligatoire 15 minutes avant l\'épreuve.'}</li>
            <li>{isRtl ? 'إظهار بطاقة الطالب أو الاستدعاء عند باب القاعة.' : 'Présentation impérative de la carte d\'étudiant ou de l\'attestation.'}</li>
            <li>{isRtl ? 'يمنع منعا كليا إدخال الهواتف والساعات الذكية.' : 'Téléphones et montres connectées strictly interdits sous peine de Conseil de Discipline.'}</li>
          </ul>
        </div>
      </div>

      {/* QR Code Digital Entrance Pass Modal */}
      {showQrModal && selectedExam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 bg-blue-50 text-[#002e5b] rounded-2xl flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">{selectedExam.module}</h3>
              <p className="text-xs text-slate-500 mt-1">{selectedExam.room} — {selectedExam.seat}</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block mx-auto">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedExam.qrToken)}`}
                alt="QR Code Pass"
                className="w-44 h-44 mx-auto rounded-lg"
              />
              <p className="text-[10px] font-mono font-bold text-slate-400 mt-2">{selectedExam.qrToken}</p>
            </div>

            <p className="text-xs text-slate-500">
              {isRtl ? 'امسح هذا الرمز عند باب القاعة لتسجيل الحضور.' : 'Scannez ce Pass QR à la porte de la salle d\'examen.'}
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs transition-colors"
            >
              {isRtl ? 'إغلاق' : 'Fermer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
