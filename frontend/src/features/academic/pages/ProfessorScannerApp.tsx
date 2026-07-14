import React, { useState, useEffect } from 'react';
import { Scan, Users, Clock, MapPin, CheckCircle2, RefreshCw } from 'lucide-react';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

export default function ProfessorScannerApp() {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  
  // Stats
  const [scanned, setScanned] = useState(0);
  const totalExpected = 45; // Default for demo

  // Fetch or create an attendance session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await api.post('/professor/attendance/start', {
          schedule_id: 1, // Assume a schedule ID for the current class
          type: 'EXAM',
          duration: 90
        });
        setSession(res.data.data || { id: 1 });
      } catch (err) {
        // Fallback for demo if endpoint fails
        setSession({ id: 1 });
      }
    };
    initSession();
  }, []);

  const simulateScan = async () => {
    setScanning(true);
    // Simulate camera delay
    setTimeout(async () => {
      try {
        // Call the real manual call endpoint
        const sessionId = session?.id || 1;
        const res = await api.post(`/professor/attendance/${sessionId}/manual-call`, {
          student_id: Math.floor(Math.random() * 10) + 1, // random student ID for demo
          status: 'present'
        });
        
        setLastScan({
          name: res.data.data?.student?.first_name || 'Étudiant',
          time: new Date().toLocaleTimeString(),
          status: 'success'
        });
        
        setScanned(s => s + 1);
        toast.success("Présence enregistrée !");
      } catch (error) {
        toast.error('Erreur de scan. Veuillez réessayer.');
      } finally {
        setScanning(false);
      }
    }, 1500);
  };

  return (
    <div className="bg-[#1F3A5F] min-h-screen font-sans text-white pb-20">
      {/* Mobile App Header */}
      <div className="p-6 bg-[#152842] rounded-b-3xl shadow-lg mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-black">ENCG Scanner</h1>
            <p className="text-xs text-blue-200">Mode Surveillant</p>
          </div>
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-400">
            <span className="font-bold text-sm">HA</span>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase mb-2">
            <Clock className="w-4 h-4" /> En cours
          </div>
          <h2 className="text-lg font-bold leading-tight mb-1">Session Live</h2>
          <p className="text-sm text-blue-100 mb-4">Génie Informatique - Groupe 2</p>
          
          <div className="flex justify-between text-xs font-medium">
            <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-pink-400"/> Amphi Al Khwarizmi</div>
            <div className="flex items-center gap-1"><Users className="w-3 h-3 text-pink-400"/> Principal</div>
          </div>
        </div>
      </div>

      {/* Main Scanner Area */}
      <div className="px-6">
        <div className="bg-white rounded-3xl p-6 shadow-xl text-center relative overflow-hidden">
          
          <h3 className="text-gray-800 font-bold mb-4">Scanner QR Code Étudiant</h3>
          
          {/* Simulated Camera Viewfinder */}
          <div className="relative w-48 h-48 mx-auto bg-gray-50 rounded-xl mb-6 flex items-center justify-center overflow-hidden border-2 border-gray-100">
            {/* Viewfinder Corners */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-pink-500 rounded-tl-lg"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-pink-500 rounded-tr-lg"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-pink-500 rounded-bl-lg"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-pink-500 rounded-br-lg"></div>

            {scanning ? (
              <div className="w-full h-1 bg-pink-500 shadow-[0_0_10px_#e91e63] animate-[scan_1.5s_ease-in-out_infinite]"></div>
            ) : (
              <Scan className="w-12 h-12 text-gray-300" />
            )}
          </div>

          <button 
            onClick={simulateScan}
            disabled={scanning || !session}
            className={`w-full py-4 rounded-xl font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${
              scanning || !session ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#e91e63] text-white hover:bg-[#c2185b] shadow-lg shadow-pink-500/30'
            }`}
          >
            {scanning ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> Analyse...</>
            ) : (
              <><Scan className="w-5 h-5" /> Simuler un Scan</>
            )}
          </button>

          {/* Result Alert */}
          {lastScan && !scanning && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 animate-in slide-in-from-bottom-4 fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-left text-sm">
                <div className="font-bold text-emerald-800">{lastScan.name}</div>
                <div className="text-emerald-600 text-xs">Présence validée à {lastScan.time}</div>
              </div>
            </div>
          )}

        </div>

        {/* Live Stats */}
        <div className="mt-6 flex gap-4">
          <div className="flex-1 bg-white/10 rounded-2xl p-4 text-center backdrop-blur-sm border border-white/5">
            <div className="text-2xl font-black text-emerald-400">{scanned}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mt-1">Présents</div>
          </div>
          <div className="flex-1 bg-white/10 rounded-2xl p-4 text-center backdrop-blur-sm border border-white/5">
            <div className="text-2xl font-black text-red-400">{totalExpected - scanned}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mt-1">En attente</div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(-80px); }
          50% { transform: translateY(80px); }
          100% { transform: translateY(-80px); }
        }
      `}} />
    </div>
  );
}
