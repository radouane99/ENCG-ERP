import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ArrowLeft, 
  Building2, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  GraduationCap, 
  Hash, 
  Copy, 
  Check,
  Award
} from 'lucide-react';
import api from '@/shared/lib/api';
import { cleanUtf8Text } from '@/shared/lib/utils';

export default function VerifyDocument() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    const verifyDoc = async () => {
      try {
        const response = await api.get(`/verify/document/${id}`);
        setResult(response.data);
      } catch {
        setResult({ success: false });
      } finally {
        setLoading(false);
      }
    };
    verifyDoc();
  }, [id]);

  const doc = result?.data;

  const handleCopyHash = () => {
    if (doc?.security_hash) {
      navigator.clipboard.writeText(doc.security_hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        
        {/* Luxury Executive Academic Header */}
        <div className="bg-gradient-to-r from-[#002e5b] via-[#0f2863] to-[#091838] p-6 text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner">
              <Building2 className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-white font-extrabold text-xl tracking-tight">ENCG FÈS</h1>
            <p className="text-blue-200 text-xs font-medium tracking-wide uppercase mt-0.5">
              Système d'Information & Vérification Électronique
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[10px] font-semibold border border-white/15">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Conformité Loi 53-05 (Validité Numérique)
            </div>
          </div>
        </div>

        {/* Dynamic Verification Content */}
        <div className="p-6 sm:p-8">
          {loading ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 border-4 border-blue-200 border-t-[#0f2863] rounded-full animate-spin mx-auto" />
              <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold animate-pulse">
                Interrogation cryptographique du registre sécurisé...
              </p>
            </div>
          ) : result?.success && doc ? (
            <div className="space-y-6">
              {/* Success Badge */}
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Document Officiel Authentique
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Ce document a été signé et scellé numériquement par l'École Nationale de Commerce et de Gestion de Fès.
                </p>
              </div>

              {/* Certificate Details Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/60 space-y-3.5 text-left text-xs sm:text-sm">
                
                {/* Document Type */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-950/80 text-[#0f2863] dark:text-blue-300 rounded-xl mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                      Nature du Document
                    </p>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug">
                      {cleanUtf8Text(doc.document_type || 'Document Académique')}
                    </p>
                  </div>
                </div>

                {/* Module d'Examen (si présent) */}
                {doc.module && (
                  <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded-xl mt-0.5">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                        Épreuve & Module
                      </p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">
                        {cleanUtf8Text(doc.module)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Beneficiary / Student / Cohorte */}
                <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-xl mt-0.5">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                      Titulaire / Cohorte
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {cleanUtf8Text(doc.student_name || doc.beneficiary || 'Bénéficiaire')}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                      {cleanUtf8Text(doc.filiere || 'Tronc Commun')} {doc.semester ? `• Semestre ${doc.semester}` : ''}
                    </p>
                  </div>
                </div>

                {/* Lieu & Horaire (si présent) */}
                {(doc.room || doc.exam_time) && (
                  <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-2">
                    {doc.room && (
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="truncate">{cleanUtf8Text(doc.room)}</span>
                      </div>
                    )}
                    {doc.exam_time && (
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>{doc.exam_time}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Issued date */}
                <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Délivré le : <strong>{doc.issued_at || '—'}</strong></span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    Certifié Conforme
                  </span>
                </div>

                {/* SHA-256 Hash Fingerprint */}
                {doc.security_hash && (
                  <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Hash className="w-3 h-3" /> Empreinte SHA-256
                      </span>
                      <button
                        onClick={handleCopyHash}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedHash ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" /> Copié
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copier
                          </>
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 break-all select-all">
                      {doc.security_hash}
                    </p>
                  </div>
                )}
              </div>

              {/* Institution Footer Note */}
              <div className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                {doc.institution || 'École Nationale de Commerce et de Gestion de Fès (USMBA)'}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 border-2 border-red-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
                <XCircle className="w-9 h-9 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Document Invalide ou Introuvable
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  L'identifiant électronique fourni ne correspond à aucun document authentifié dans les registres officiels de l'ENCG Fès. Il se peut qu'il ait été altéré ou falsifié.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Retour au Portail ENCG Fès
          </Link>
        </div>
      </div>
    </div>
  );
}
