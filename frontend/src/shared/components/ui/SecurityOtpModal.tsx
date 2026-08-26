import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@shared/lib/api';
import { useAuthStore } from '@stores/authStore';

interface SecurityOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle: string;
  actionDescription: string;
}

export default function SecurityOtpModal({
  isOpen,
  onClose,
  onSuccess,
  actionTitle,
  actionDescription,
}: SecurityOtpModalProps) {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const twoFactorEnabled = useAuthStore((s) => s.user?.two_factor_enabled);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = otp.join('');
    if (fullCode.length < 6) {
      toast.error('Veuillez saisir les 6 chiffres du code Authenticator.');
      return;
    }

    if (!twoFactorEnabled) {
      toast.error('Activez la 2FA dans votre profil avant cette opération.');
      return;
    }

    setIsVerifying(true);
    try {
      await api.post('/v1/auth/two-factor/step-up', { code: fullCode });
      toast.success('Autorisation 2FA confirmée.');
      onSuccess();
      onClose();
    } catch {
      toast.error('Code 2FA invalide ou 2FA non configurée.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-8 space-y-6 text-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Validation 2FA</h3>
              <p className="text-[11px] text-slate-400">Application Authenticator • ENCG Fès</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 space-y-1">
          <p className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-500" /> {actionTitle}
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">{actionDescription}</p>
        </div>

        <div className="space-y-4 text-center">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Saisissez le code à 6 chiffres de Google Authenticator / Authy
          </p>
          <div className="flex items-center justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-13 text-center text-xl font-black rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 outline-none"
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold cursor-pointer">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying || otp.join('').length < 6}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 disabled:opacity-50 text-white font-black cursor-pointer flex items-center gap-2"
          >
            {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
