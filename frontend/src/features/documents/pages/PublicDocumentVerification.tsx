import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, FileText, CheckCircle } from 'lucide-react';
import api from '@/shared/lib/api';

export default function PublicDocumentVerification() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await api.get(`/documents/verify/${token}`);
        setResult(res.data.data);
      } catch (error) {
        setResult({ is_valid: false, message: "Erreur de connexion au serveur de vérification." });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-medium text-foreground">Vérification cryptographique en cours...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1F3A5F] p-6 text-center text-white">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-90" />
          <h1 className="text-2xl font-bold">Portail de Vérification</h1>
          <p className="text-white/80 text-sm mt-1">Université Mohammed Premier</p>
        </div>

        <div className="p-8">
          {result?.is_valid ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-emerald-700">Document Authentique</h2>
                  <p className="text-muted-foreground mt-1">Ce document a été certifié par nos systèmes.</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-5 border border-border space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Type de document</div>
                  <div className="font-medium text-foreground">{result.document_type}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Titulaire</div>
                  <div className="font-medium text-foreground">{result.student_name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Matricule Étudiant</div>
                  <div className="font-medium text-foreground">{result.student_number}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date d'émission</div>
                  <div className="font-medium text-foreground">{new Date(result.issued_at).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-10 h-10 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-700">Document Non Reconnu</h2>
                <p className="text-red-600/80 mt-2 max-w-sm">
                  {result?.message || "Le code cryptographique est invalide ou le document a été falsifié."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
