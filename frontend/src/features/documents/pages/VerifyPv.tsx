import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, FileText, ArrowLeft, Building2, ShieldCheck, Clock, Layers } from 'lucide-react';
import api from '@/shared/lib/api';

export default function VerifyPv() {
  const { moduleId, groupId } = useParams<{ moduleId: string; groupId: string }>();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const verifyPv = async () => {
      try {
        const response = await api.get(`/verify/pv/${moduleId}/${groupId}`);
        setResult(response.data);
      } catch (error) {
        setResult({ success: false });
      } finally {
        setLoading(false);
      }
    };
    verifyPv();
  }, [moduleId, groupId]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-[#0f2863] p-6 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-[#0f2863]" />
          </div>
          <h1 className="text-white font-bold text-xl">ENCG Fès</h1>
          <p className="text-white/80 text-sm">Portail Public de Vérification</p>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {loading ? (
            <div className="space-y-4">
              <div className="w-16 h-16 border-4 border-[#0f2863]/20 border-t-[#0f2863] rounded-full animate-spin mx-auto" />
              <p className="text-slate-500 font-medium animate-pulse">Validation de signature en cours...</p>
            </div>
          ) : result?.success ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">PV Signé & Authentique</h2>
                <p className="text-slate-500 text-xs font-semibold">
                  Ce procès-verbal de délibération a été certifié avec signature électronique et archivé.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 text-left space-y-3 border border-slate-100 text-xs">
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Type de Document</p>
                    <p className="font-bold text-slate-700">{result.data.document_type}</p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200 flex items-start gap-3">
                  <Layers className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Détail du Module</p>
                    <p className="font-bold text-slate-700">{result.data.module}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Groupe: {result.data.group} | Filière: {result.data.filiere}</p>
                  </div>
                </div>
                
                <div className="pt-2.5 border-t border-slate-200 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Signataire</p>
                    <p className="font-bold text-slate-700">{result.data.signed_by}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Adresse IP: {result.data.ip_address}</p>
                  </div>
                </div>
                
                <div className="pt-2.5 border-t border-slate-200 flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Signé le</p>
                    <p className="font-bold text-slate-700">{new Date(result.data.signed_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Empreinte Digitale (SHA-256)</p>
                  <p className="text-[9px] font-mono break-all text-slate-500">{result.data.fingerprint}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Non Vérifiable</h2>
                <p className="text-slate-500 text-sm">
                  Ce procès-verbal de délibération n'a pas pu être authentifié. Il n'a pas encore été signé électroniquement ou a été modifié illégalement.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour à la plateforme
          </Link>
        </div>
      </div>
    </div>
  );
}
