import React, { useState } from 'react';
import { FileText, QrCode, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

export default function DocumentCenter() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [document, setDocument] = useState<any>(null);

  const generateDocument = async () => {
    setIsGenerating(true);
    try {
      const res = await api.post('/documents/generate', {
        student_id: 1, // Mock
        document_type: 'Certificat de Scolarité'
      });
      setDocument(res.data.data);
      toast.success(res.data.data.message);
    } catch (error: any) {
      toast.error('Erreur lors de la génération.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Centre de Documents Sécurisés
        </h1>
        <p className="text-muted-foreground mt-1">
          Génération centralisée de documents officiels avec signature cryptographique et QR Code anti-fraude.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Panel */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-fit">
          <h2 className="font-semibold text-lg mb-4">Générer un document</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type de document</label>
              <select className="w-full border-input bg-background rounded-lg p-2.5 text-sm">
                <option>Certificat de Scolarité</option>
                <option>Relevé de Notes</option>
                <option>Attestation de Réussite</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Étudiant</label>
              <input type="text" placeholder="Rechercher par CNE, Nom..." className="w-full border-input bg-background rounded-lg p-2.5 text-sm" />
            </div>

            <button
              onClick={generateDocument}
              disabled={isGenerating}
              className="w-full mt-2 bg-[#1F3A5F] hover:bg-[#152842] text-white px-5 py-3 rounded-xl font-medium flex justify-center items-center gap-2 transition-all disabled:opacity-70"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <QrCode className="w-5 h-5" />
              )}
              Générer avec QR Cryptographique
            </button>
          </div>
        </div>

        {/* Result Preview */}
        <div className="bg-muted/30 border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          {document ? (
            <div className="w-full space-y-4">
              <div className="bg-emerald-500/10 text-emerald-700 p-3 rounded-lg flex items-center justify-center gap-2 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                Document Sécurisé Prêt
              </div>
              
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm text-left">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{document.document_type}</h3>
                    <p className="text-muted-foreground">{document.student_name}</p>
                  </div>
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                
                <div className="bg-muted p-3 rounded-lg text-xs break-all font-mono text-muted-foreground border border-border">
                  Token: {document.verification_token}
                </div>

                <div className="mt-4 flex gap-3">
                  <button className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                    <Download className="w-4 h-4" />
                    Télécharger PDF
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <ShieldCheck className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground max-w-sm">
                Les documents générés intègrent automatiquement un QR code infalsifiable pointant vers le registre de validation de l'université.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
