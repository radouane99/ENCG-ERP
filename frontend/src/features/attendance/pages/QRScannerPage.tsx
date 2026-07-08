import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScanLine, CheckCircle2, XCircle, Camera, Navigation, AlertCircle } from 'lucide-react';
import api from '@/shared/lib/api';
import toast from 'react-hot-toast';

export default function QRScannerPage() {
  const { t } = useTranslation(['attendance', 'common']);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');
  
  // For demonstration without an actual camera dependency
  const [manualToken, setManualToken] = useState('');

  const submitScan = async (token: string) => {
    setIsScanning(true);
    setScanResult(null);
    try {
      // Mock getting geolocation
      const position = { coords: { latitude: 34.0042, longitude: -4.9998 } };
      
      const res = await api.post('/v1/mobile/student/attendance/scan', {
        qr_token: token,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      
      setScanResult('success');
      setMessage(res.data.message || t('attendance:scanner.success_msg'));
      toast.success(t('attendance:scanner.success_msg'));
    } catch (e: any) {
      setScanResult('error');
      setMessage(e.response?.data?.message || t('attendance:scanner.error_msg'));
      toast.error(t('attendance:scanner.fail'));
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">{t('attendance:scanner.title')}</h1>
        <p className="text-white/50 text-sm">
          {t('attendance:scanner.subtitle')}
        </p>
      </div>

      <div className="bg-card border border-white/10 shadow-xl rounded-3xl overflow-hidden relative">
        {/* Mock Scanner Viewport */}
        <div className="relative aspect-[4/5] bg-slate-900 flex items-center justify-center overflow-hidden">
          {/* Scanning frame overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
            <div className="flex-1 bg-black/60" />
            <div className="flex">
              <div className="w-12 bg-black/60" />
              <div className="flex-1 aspect-square relative">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                {/* Scan line animation */}
                <div className="absolute top-0 inset-x-0 h-0.5 bg-primary shadow-[0_0_8px_2px_rgba(168,10,11,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
              </div>
              <div className="w-12 bg-black/60" />
            </div>
            <div className="flex-1 bg-black/60" />
          </div>

          <div className="relative z-0 text-white/50 flex flex-col items-center gap-4">
            <Camera className="w-12 h-12" />
            <span className="text-sm">{t('attendance:scanner.waiting_cam')}</span>
          </div>

          {/* Result Overlay */}
          {scanResult && (
            <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-200">
              {scanResult === 'success' ? (
                <>
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">{t('attendance:scanner.success')}</h3>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="w-12 h-12 text-red-500" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">{t('attendance:scanner.fail')}</h3>
                </>
              )}
              <p className="text-white/80">{message}</p>
              
              <button 
                onClick={() => setScanResult(null)}
                className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
              >
                {t('attendance:scanner.scan_again')}
              </button>
            </div>
          )}
        </div>

        {/* GPS Status Indicator */}
        <div className="bg-white/5 p-4 flex items-center justify-between text-xs font-medium text-white/50 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-500" />
            <span>{t('attendance:scanner.gps.status')}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            <span>{t('attendance:scanner.gps.required')}</span>
          </div>
        </div>

        {/* Mock Input for Testing */}
        <div className="p-6">
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
            {t('attendance:scanner.simulation.title')}
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder={t('attendance:scanner.simulation.placeholder')}
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              className="flex-1 bg-background border border-white/10 rounded-xl px-4 text-sm"
            />
            <button 
              onClick={() => submitScan(manualToken)}
              disabled={!manualToken || isScanning}
              className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              <ScanLine className="w-4 h-4" /> {t('attendance:scanner.simulation.btn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
