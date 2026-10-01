import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, CheckCircle2, Lock, Stamp, KeyRound } from 'lucide-react';
import api from '@/shared/lib/api';

export default function PublicDocumentVerification() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await api.get(`/documents/verify/${token}`, {
          // suppress global error toast to show clean in-page error
          suppressToast: true,
        } as any);
        if (res.data?.success && res.data?.data) {
          setResult({ is_valid: true, ...res.data.data });
        } else {
          setResult({
            is_valid: false,
            message: res.data?.message || 'Document non reconnu ou invalide.',
          });
        }
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || 'Signature cryptographique invalide ou document altéré. Échec de vérification (Loi 53-05).';
        setResult({
          is_valid: false,
          message: errMsg,
          status_code: err?.response?.status || 403,
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setLoading(false);
      setResult({ is_valid: false, message: 'Aucun jeton de vérification fourni.' });
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-black tracking-wide">Déchiffrement et vérification cryptographique en cours...</h2>
        <p className="text-xs text-slate-400 mt-1">Interrogation du registre central sécurisé de l'ENCG Fès</p>
      </div>
    );
  }

  const isEncrypted = token?.startsWith('ENC-') || result?.is_encrypted;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 py-12 font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#001A4B] via-[#082663] to-[#001A4B] p-8 text-center text-white relative">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 text-amber-300 shadow-lg">
            <Stamp className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-wider">Portail de Vérification Officielle</h1>
          <p className="text-blue-200 text-xs font-bold mt-1">
            École Nationale de Commerce et de Gestion — Université Sidi Mohamed Ben Abdellah (Fès)
          </p>

          {isEncrypted && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 border border-amber-400/40 rounded-full text-[11px] text-amber-200 font-bold">
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              <span>Chiffrement AES-256 + Signature HMAC</span>
            </div>
          )}
        </div>

        <div className="p-8 space-y-6">
          {result?.is_valid ? (
            <div className="space-y-6">
              
              {/* Authenticity Badge */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-950/50 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                    Document Officiel Authentique
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Acte certifié conforme et scellé électroniquement dans le registre académique de l'ENCG Fès.
                  </p>
                </div>
              </div>

              {/* Verified Details Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3.5 text-xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Type d'Acte</span>
                  <span className="font-black text-[#001A4B] dark:text-blue-300 text-right">
                    {result.document_type || 'Acte Officiel Homologué'}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Titulaire / Bénéficiaire</span>
                  <span className="font-bold text-slate-800 dark:text-white text-right">
                    {result.beneficiary || result.student_name || result.club_name}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Numéro d'Enregistrement</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {result.student_number || result.cne || result.tracking_code}
                  </span>
                </div>

                {(result.filiere || result.category) && (
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Pôle / Domaine</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-right">
                      {result.filiere || result.category}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Date d'Émission / Octroi</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {result.issued_at}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Statut Juridique</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-right">
                    {result.status || 'Homologué & Conforme (Loi 53-05)'}
                  </span>
                </div>

                <div className="pt-1">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-indigo-500" /> Empreinte Numérique (SHA-256)
                  </div>
                  <div className="font-mono text-[10px] bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 break-all select-all font-bold">
                    {result.hash || result.security_hash || `SHA256-${token || '8F9A2B4C1E0D3F7A'}`}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Ce document fait foi de plein droit conformément aux dispositions de la loi 53-05 sur l'échange électronique des données juridiques.</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/50 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 shadow-sm">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-rose-700 dark:text-rose-400">
                  Échec de Vérification de Sécurité
                </h2>
                <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300 font-medium leading-relaxed">
                  {result?.message || "Le jeton cryptographique fourni est invalide, altéré ou inexistant dans le registre de l'ENCG Fès."}
                </div>
                <p className="text-[11px] text-slate-400">
                  Toute reproduction non autorisée ou falsification d'un acte officiel est passible de sanctions conformément au code pénal marocain.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            Direction de l'Établissement &amp; Systèmes d'Information • ENCG Fès © 2026
          </p>
        </div>

      </div>
    </div>
  );
}
