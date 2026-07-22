import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
}

export function QRScannerModal({ isOpen, onClose, sessionId }: QRScannerModalProps) {
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<{success: boolean; message: string; warning?: string} | null>(null);

  const scanMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await api.post(`/professor/attendance/${sessionId}/scan`, { token });
      return res.data;
    },
    onSuccess: (data) => {
      setScanResult({
        success: true,
        message: `${data.student_name} a été marqué présent.`,
        warning: data.warning
      });
      setManualCode('');
      // Reset after 3 seconds
      setTimeout(() => setScanResult(null), 3000);
    },
    onError: (error: any) => {
      setScanResult({
        success: false,
        message: error.response?.data?.message || 'Code invalide ou étudiant introuvable.'
      });
      setTimeout(() => setScanResult(null), 3000);
    }
  });

  const handleSimulateScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    scanMutation.mutate(manualCode);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#001A4B] rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/10 flex flex-col relative"
        >
          {/* Close button */}
          <button onClick={onClose} className="absolute top-4 right-4 z-20 text-white/50 hover:text-white bg-white/10 p-2 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>

          <div className="p-8 flex flex-col items-center relative">
            <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md mb-6 relative">
              <div className="absolute inset-0 border-2 border-emerald-400 rounded-3xl animate-pulse opacity-50"></div>
              <QrCode className="w-16 h-16 text-white" />
            </div>
            
            <h2 className="text-2xl font-black text-white text-center mb-2">Scanner de Présence</h2>
            <p className="text-sm text-blue-200 text-center mb-8">
              Scannez le code QR depuis le Wallet de l'étudiant ou entrez son ID manuellement pour la session actuelle.
            </p>

            {/* Scanner Viewport Simulation */}
            <div className="w-full aspect-square bg-black/40 rounded-3xl border border-white/10 relative overflow-hidden flex items-center justify-center mb-8">
              {/* Scanning Laser Line */}
              <motion.div 
                animate={{ y: ["0%", "100%", "0%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute top-0 left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-10"
                style={{ width: '100%' }}
              />
              
              {/* Corner markers */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-white/30 rounded-tl-lg"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-white/30 rounded-tr-lg"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-white/30 rounded-bl-lg"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-white/30 rounded-br-lg"></div>

              <div className="text-white/30 font-bold uppercase tracking-widest text-xs flex flex-col items-center gap-2">
                <QrCode className="w-8 h-8 opacity-50" />
                En attente de scan...
              </div>
            </div>

            {/* Manual Entry Form */}
            <form onSubmit={handleSimulateScan} className="w-full flex gap-2">
              <input 
                type="text" 
                placeholder="Ex: STU-1002" 
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 transition-colors text-center font-mono"
              />
              <button 
                type="submit"
                disabled={scanMutation.isPending || !manualCode.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center justify-center min-w-[100px]"
              >
                {scanMutation.isPending ? <Spinner className="w-5 h-5 text-white" /> : 'Scan'}
              </button>
            </form>

            {/* Result Toast Overlay */}
            <AnimatePresence>
              {scanResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`absolute bottom-24 left-4 right-4 p-4 rounded-xl shadow-2xl flex items-start gap-3 backdrop-blur-md ${
                    scanResult.success ? 'bg-emerald-900/90 border border-emerald-500/50' : 'bg-rose-900/90 border border-rose-500/50'
                  }`}
                >
                  {scanResult.success ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{scanResult.message}</p>
                    {scanResult.warning && (
                      <p className="text-amber-300 text-[10px] font-bold mt-1 uppercase tracking-wider bg-amber-950/50 px-2 py-0.5 rounded inline-block">
                        {scanResult.warning}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
