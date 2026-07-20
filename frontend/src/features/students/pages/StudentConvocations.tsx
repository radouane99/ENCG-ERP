import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Clock, MapPin, FileText, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@shared/lib/utils';
import { examsApi } from '@shared/api/exams';
import { useAuthStore } from '@stores/authStore';

export default function StudentConvocations() {
  const { t, i18n } = useTranslation(['exams', 'common']);
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [convocations, setConvocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchConvocations();
  }, []);

  const fetchConvocations = async () => {
    try {
      setIsLoading(true);
      if (!user?.id) {
        console.error('Aucun utilisateur étudiant connecté — impossible de récupérer les convocations.');
        setConvocations([]);
        return;
      }
      const studentId = user.id;
      const res = await examsApi.getStudentConvocations(studentId);
      if (res.success) {
        setConvocations(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async (convId: number) => {
    try {
      setIsDownloading(convId.toString());
      const blob = await examsApi.downloadConvocationPdf(convId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `convocation_${convId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-[#0b1021] rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl border border-white/10">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        
        <div className="relative z-10 flex-1">
          <div className="text-[10px] font-bold text-[#003a8c] bg-blue-500/20 w-max px-3 py-1 rounded-full uppercase tracking-widest border border-blue-500/30 mb-4">
            ESPACE ÉTUDIANT
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Mes Convocations</h1>
          <p className="text-gray-400">Téléchargez chaque convocation en PDF ou attendez l'email de notification.</p>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center min-w-[100px] backdrop-blur-md">
            <div className="text-3xl font-black text-white">7</div>
            <div className="text-[9px] font-bold text-white/60 uppercase tracking-widest mt-1">À VENIR</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-[100px] backdrop-blur-md">
            <div className="text-3xl font-black text-white/50">0</div>
            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">PASSÉES</div>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#001A4B] rounded-xl flex items-center justify-center shadow-sm">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-black text-[#001A4B] flex items-center gap-3">
            Convocations Ã  venir
            <span className="bg-[#003a8c] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
              7
            </span>
          </h2>
        </div>

        <div className="space-y-6">
          {convocations.map((conv, idx) => (
            <div key={idx} className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl border border-white/5 hover:border-blue-200 bg-white/[0.02]/50 hover:bg-white hover:shadow-md transition-all group">
              
              {/* Date Box */}
              <div className="w-20 h-20 bg-gradient-to-b from-amber-400 to-amber-500 rounded-2xl shadow-inner border border-amber-300 flex flex-col items-center justify-center text-white shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">{conv.date.split('.')[0]}</span>
                <span className="text-2xl font-black">{conv.date.split(' ')[1]}</span>
              </div>

              {/* Details */}
              <div className="flex-1 w-full text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h3 className="text-lg font-black text-white">{conv.module}</h3>
                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-blue-100">
                    {conv.type}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-white/50 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" /> {conv.time}
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/[0.05] px-2 py-1 rounded-md text-white/70">
                    âŒ› {conv.duration}
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-600">
                    <MapPin className="w-4 h-4" /> Amphi Al Khwarizmi
                  </div>
                </div>

                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                  RÉF: <span className="text-white/70">{conv.ref}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center justify-center gap-3 shrink-0">
                <div className="text-center">
                  <div className="text-xl font-black text-[#001A4B]">{conv.days}</div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">JOURS</div>
                </div>
                <button 
                  onClick={() => handleDownloadPdf(conv.id)}
                  disabled={isDownloading === conv.id.toString()}
                  className="bg-[#0b1021] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#000d26] transition-colors shadow-sm disabled:opacity-50"
                >
                  {isDownloading === conv.id.toString() ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  PDF
                </button>
              </div>

            </div>
          ))}
          {isLoading && (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-[#003a8c] animate-spin" />
            </div>
          )}
          {!isLoading && convocations.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              Aucune convocation à venir.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
