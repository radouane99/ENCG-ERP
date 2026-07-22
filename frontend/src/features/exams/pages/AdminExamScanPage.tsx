import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Camera, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  XCircle, 
  User, 
  FileText, 
  MapPin, 
  Calendar, 
  Loader2, 
  ArrowLeft,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { examsApi } from '@/shared/api/exams';
import { cn } from '@shared/lib/utils';

export default function AdminExamScanPage() {
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Sound feedback
  const playAudioFeedback = (type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio context fallback
    }
  };

  // Start camera stream
  const startCamera = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsScanning(true);
    } catch (err) {
      setErrorMsg('Impossible d\'accéder à la caméra. Utilisez la saisie manuelle ou un lecteur douchette.');
      setIsScanning(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Verify QR Token
  const handleVerifyToken = async (qrToken: string) => {
    const cleanToken = qrToken.trim();
    if (!cleanToken) return;

    setLoading(true);
    setErrorMsg(null);
    setActionSuccess(null);

    try {
      const res = await examsApi.scanVerifyQr(cleanToken);
      if (res.success && res.data) {
        setStudentData(res.data);
        playAudioFeedback('success');
      } else {
        setErrorMsg(res.message || 'QR Code non reconnu');
        playAudioFeedback('error');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Convocation introuvable ou QR Code invalide.');
      playAudioFeedback('error');
    } finally {
      setLoading(false);
    }
  };

  // Update Attendance Status
  const handleUpdateStatus = async (status: 'present' | 'late' | 'absent') => {
    if (!studentData) return;

    setLoading(true);
    try {
      const qrToken = tokenInput || studentData.qr_token;
      await examsApi.updateExamAttendance(qrToken, status);
      
      const statusLabels = {
        present: 'PRÉSENT(E)',
        late: 'RETARD (< 20 MIN)',
        absent: 'ABSENT(E)'
      };

      setStudentData({ ...studentData, status });
      setActionSuccess(`Émargement enregistré : ${statusLabels[status]}`);
      playAudioFeedback(status === 'absent' ? 'warning' : 'success');
    } catch (err: any) {
      setErrorMsg('Erreur lors de la mise à jour de l\'émargement.');
      playAudioFeedback('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 pb-24">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/convocations')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            title="Retour aux convocations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Scanner d'Émargement QR Code
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contrôle d'accès et présence en salle d'examen en temps réel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title={soundEnabled ? 'Désactiver les signaux sonores' : 'Activer les signaux sonores'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-indigo-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>
          
          {!isScanning ? (
            <button
              onClick={startCamera}
              className="btn-interactive bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-500/20 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" /> Activer la Caméra
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="btn-interactive bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-red-500/20 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Arrêter la Caméra
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Scanner & Search Input */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Camera Viewport */}
          {isScanning && (
            <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative aspect-video shadow-xl flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-indigo-500/40 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-indigo-400 rounded-xl animate-pulse relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400" />
                </div>
              </div>
              <span className="absolute bottom-3 bg-slate-900/80 text-white px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-sm">
                Placez le QR Code dans le cadre
              </span>
            </div>
          )}

          {/* Manual Input / Douchette Scanner */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-500" />
              Saisie Manuelle ou Douchette Code-barres
            </h3>
            
            <form onSubmit={(e) => { e.preventDefault(); handleVerifyToken(tokenInput); }} className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Collez ou scannez le QR Token (ex: ENCG-N13000...)"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !tokenInput.trim()}
                className="btn-interactive bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vérifier'}
              </button>
            </form>
            
            <p className="text-[11px] text-slate-400">
              💡 Astuce : Les douchette-scanners USB scannent automatiquement et soumettent le code QR au format texte.
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-700 dark:text-red-400 text-sm font-semibold flex items-center gap-3 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Success Banner */}
          {actionSuccess && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex items-center gap-3 animate-in fade-in">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />
              <span>{actionSuccess}</span>
            </div>
          )}
        </div>

        {/* Right Column: Student Verification Identity Card */}
        <div className="lg:col-span-7">
          {studentData ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden animate-in zoom-in-95 duration-200 space-y-0">
              
              {/* Identity Header */}
              <div className="p-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black text-amber-300 shadow-inner shrink-0">
                    {studentData.avatar ? (
                      <img src={studentData.avatar} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      studentData.student_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                      Étudiant Convoqué
                    </span>
                    <h2 className="text-xl font-black text-white mt-1">
                      {studentData.student_name}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                      <span className="font-mono bg-white/10 px-2 py-0.5 rounded font-bold">CNE: {studentData.cne}</span>
                      {studentData.cin && <span className="font-mono bg-white/10 px-2 py-0.5 rounded font-bold">CIN: {studentData.cin}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block uppercase font-semibold">Numéro de Table</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {studentData.seat_number}
                  </span>
                </div>
              </div>

              {/* Identity Details Body */}
              <div className="p-6 space-y-6">
                
                {/* Status Badges Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" /> Module d'Examen
                    </span>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">
                      {studentData.module_name}
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      {studentData.filiere}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" /> Salle d'Examen Assignée
                    </span>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">
                      {studentData.room_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      📅 {studentData.exam_date} à {studentData.exam_time}
                    </p>
                  </div>
                </div>

                {/* Instant Attendance Status Actions */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    ⚡ Marquer le statut d'émargement en direct :
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => handleUpdateStatus('present')}
                      disabled={loading}
                      className={cn(
                        'btn-interactive py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all',
                        studentData.status === 'present'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-500/20'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
                      )}
                    >
                      <CheckCircle className="w-4 h-4" /> Présent(e)
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('late')}
                      disabled={loading}
                      className={cn(
                        'btn-interactive py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all',
                        studentData.status === 'late'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100'
                      )}
                    >
                      <Clock className="w-4 h-4" /> Retard (&lt; 20m)
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('absent')}
                      disabled={loading}
                      className={cn(
                        'btn-interactive py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all',
                        studentData.status === 'absent'
                          ? 'bg-red-600 text-white border-red-700 shadow-md shadow-red-500/20'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-100'
                      )}
                    >
                      <XCircle className="w-4 h-4" /> Absent(e)
                    </button>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                Aucune convocation scannée
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Scannez le QR Code imprimé sur la convocation de l'étudiant avec votre caméra ou votre lecteur douchette USB.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
