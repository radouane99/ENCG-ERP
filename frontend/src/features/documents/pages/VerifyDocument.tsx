import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, FileText, ArrowLeft, Building2 } from 'lucide-react';
import api from '@/shared/lib/api';

export default function VerifyDocument() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // We intentionally do not use useQuery here so it only fetches once on mount and avoids auth requirements
    const verifyDoc = async () => {
      try {
        const response = await api.get(`/verify/document/${id}`);
        setResult(response.data);
      } catch (error) {
        setResult({ success: false });
      } finally {
        setLoading(false);
      }
    };
    verifyDoc();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#A80A0B] p-6 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-[#A80A0B]" />
          </div>
          <h1 className="text-white font-bold text-xl">ENCG Fès</h1>
          <p className="text-white/80 text-sm">Vérification de Document</p>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {loading ? (
            <div className="space-y-4">
              <div className="w-16 h-16 border-4 border-[#A80A0B]/20 border-t-[#A80A0B] rounded-full animate-spin mx-auto" />
              <p className="text-slate-500 font-medium animate-pulse">Vérification en cours...</p>
            </div>
          ) : result?.success ? (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Document Valide</h2>
                <p className="text-slate-500 text-sm">
                  Ce document a été vérifié cryptographiquement et est authentique.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 text-left space-y-3 border border-slate-100">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Type de Document</p>
                    <p className="text-sm font-semibold text-slate-700">{result.data.document_type}</p>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Titulaire</p>
                  <p className="text-sm font-semibold text-slate-700">{result.data.student_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">CNE: {result.data.cne} â€¢ Filière: {result.data.filiere}</p>
                </div>
                
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Délivré le</p>
                  <p className="text-sm font-semibold text-slate-700">{result.data.issued_at}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Document Invalide</h2>
                <p className="text-slate-500 text-sm">
                  Nous n'avons pas pu vérifier l'authenticité de ce document. Il se peut qu'il ait été falsifié ou que le code QR soit erroné.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour Ã  l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
