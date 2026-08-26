import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, QrCode, AlertTriangle, CheckCircle2, ShieldCheck, UserCheck, RefreshCw, Sparkles, Building, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';

export default function ProfessorScanner() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const [exam, setExam] = useState('');
  const [room, setRoom] = useState('');
  const [scannedCount, setScannedCount] = useState(0);
  const [lastScannedStudent, setLastScannedStudent] = useState<any>(null);

  const { data: examsData = [] } = useQuery({
    queryKey: ['professor-exams'],
    queryFn: () => api.get('/academic/exams').then(res => res.data.data || res.data || [])
  });
  
  const { data: roomsData = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get('/academic/rooms').then(res => res.data.data || res.data || [])
  });

  const examsList = examsData;
  const roomsList = roomsData;

  const handleSimulateScan = async () => {
    if (!exam) {
      toast.error("Veuillez d'abord sélectionner l'examen officiel.");
      return;
    }

    try {
      const res = await api.post('/professor/exam-attendance/scan', {
        exam_id: exam,
        room_id: room || undefined,
      });
      const student = res.data?.student || res.data?.data;
      if (!student) {
        toast.error('Aucun étudiant identifié. Scannez un QR de convocation valide.');
        return;
      }
      setLastScannedStudent(student);
      setScannedCount(prev => prev + 1);
      toast.success(`Émargement validé pour ${student.name || student.first_name || 'étudiant'} !`);
    } catch {
      toast.error('Scan impossible. Utilisez un QR de convocation réel.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in duration-500 pb-28">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] rounded-3xl p-8 text-white shadow-xl border border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Camera className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Émargement QR Code Live
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Scanner Présences Examens & Séances</h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium mt-0.5">
              Contrôlez les convocations officielles des étudiants avec détection automatique des plans de table.
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center shrink-0">
          <div className="text-[10px] font-black uppercase text-indigo-200 tracking-wider">Présents Émargés</div>
          <div className="text-3xl font-black text-white">{scannedCount}</div>
          <div className="text-[10px] text-emerald-300 font-bold mt-0.5">En direct</div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 md:p-8 space-y-6">
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Épreuve / Examen en cours</label>
            <select 
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- Sélectionner l'examen --</option>
              {examsList.map((e: any) => (
                <option key={e.id} value={e.id}>{e.name || `Examen #${e.id}`}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Salle / Amphithéâtre Assigné</label>
            <select 
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- Sélectionner la salle --</option>
              {roomsList.map((r: any) => (
                <option key={r.id} value={r.id}>{r.name || `Salle #${r.id}`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Camera Viewfinder */}
        <div className="w-full h-[360px] bg-slate-950 rounded-3xl border-2 border-dashed border-slate-700 relative flex flex-col items-center justify-center overflow-hidden p-6 text-center space-y-4">
          <div className="absolute inset-4 border border-indigo-500/30 rounded-2xl pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-500 rounded-tl-2xl m-4 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-indigo-500 rounded-tr-2xl m-4 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-indigo-500 rounded-bl-2xl m-4 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-indigo-500 rounded-br-2xl m-4 pointer-events-none"></div>
          
          <div className="w-full h-0.5 bg-red-500 absolute top-1/2 left-0 shadow-[0_0_12px_rgba(239,68,68,1)] pointer-events-none"></div>
          
          <div className="w-16 h-16 rounded-2xl bg-white/10 text-white flex items-center justify-center backdrop-blur-md">
            <QrCode className="w-8 h-8 text-indigo-300" />
          </div>

          <div className="text-white space-y-1 z-10">
            <h3 className="font-black text-sm">Viseur Caméra Prêt</h3>
            <p className="text-xs text-slate-400">Présentez le QR Code de la convocation de l'étudiant devant la caméra.</p>
          </div>

          <button
            onClick={handleSimulateScan}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-950/40 z-10 cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> Simuler Scan Convocation QR
          </button>
        </div>

        {/* Last Scanned Student Badge */}
        {lastScannedStudent && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Dernier Étudiant Émargé</span>
                <h4 className="font-black text-sm text-emerald-950">{lastScannedStudent.name}</h4>
                <p className="text-xs text-emerald-800 font-semibold">{lastScannedStudent.filiere} • CNE : {lastScannedStudent.cne}</p>
              </div>
            </div>

            <div className="bg-white/80 border border-emerald-200 px-4 py-2 rounded-2xl text-right shrink-0">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Emplacement Table</span>
              <span className="font-black text-xs text-slate-900">{lastScannedStudent.seat}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
