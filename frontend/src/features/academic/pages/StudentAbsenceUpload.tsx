import React, { useState } from 'react';
import { AlertTriangle, UploadCloud, Clock, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

export default function StudentAbsenceUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'abi' | 'abj'>('abi'); // 'abi' (injustifiée) -> 'abj' (justifiée en attente)
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    
    // Simulating API call for file upload
    setTimeout(() => {
      setStatus('abj');
      setUploading(false);
      toast.success('Certificat médical envoyé avec succès. En attente de validation.');
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white/90">Régularisation d'Absence (Règlement Apogée)</h1>
            <p className="text-sm text-white/50">Portail Étudiant â€” Espace Justificatifs</p>
          </div>
        </div>
      </div>

      {status === 'abi' ? (
        <>
          {/* Alert Box */}
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h3 className="text-red-800 font-bold text-lg mb-1">Absence Injustifiée (ABI) Détectée</h3>
                <p className="text-red-700 text-sm mb-4">
                  Vous avez été marqué(e) absent(e) Ã  l'examen de <strong className="text-red-900">Programmation Avancée</strong> du 01/07/2026. 
                  Conformément au règlement universitaire, une note de 0/20 vous sera attribuée et le module ne pourra pas être validé par compensation.
                </p>
                <div className="flex items-center gap-2 text-red-800 font-bold text-sm bg-red-100 px-3 py-2 rounded-lg inline-flex">
                  <Clock className="w-4 h-4" /> Temps restant pour justifier : <span className="font-black text-red-600">38h 14m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="bg-white border border-white/10 p-8 rounded-2xl shadow-sm text-center">
            <h2 className="font-bold text-lg mb-2">Dépôt de Certificat Médical</h2>
            <p className="text-sm text-white/50 mb-8">Veuillez uploader votre certificat médical officiel scanné. Tout faux document entraînera un conseil de discipline.</p>

            <div className="max-w-md mx-auto">
              <label 
                htmlFor="file-upload" 
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white/[0.02] hover:bg-white/[0.05] hover:border-gray-400'}`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <>
                      <FileText className="w-12 h-12 text-blue-500 mb-3" />
                      <p className="text-sm font-bold text-blue-700">{file.name}</p>
                      <p className="text-xs text-blue-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-white/50"><span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez</p>
                      <p className="text-xs text-white/50">PDF, JPG ou PNG (Max 5MB)</p>
                    </>
                  )}
                </div>
                <input id="file-upload" type="file" className="hidden" accept=".pdf,image/png,image/jpeg" onChange={handleFileChange} />
              </label>

              <button 
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`w-full mt-6 py-3 rounded-xl font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${
                  !file || uploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                }`}
              >
                {uploading ? 'Envoi en cours...' : 'Soumettre le justificatif'}
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Success State */
        <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-emerald-800 mb-2">Justificatif Reçu</h2>
          <p className="text-emerald-700 max-w-md mx-auto mb-6">
            Votre certificat médical a été transmis avec succès au service de scolarité. Votre statut d'absence a été provisoirement modifié en <strong>ABJ (Absence Justifiée)</strong>.
          </p>
          <div className="bg-white p-4 rounded-xl inline-block text-sm border border-emerald-100">
            <span className="text-white/50">Statut actuel :</span> <span className="font-bold text-orange-500 ml-2">En cours de vérification par l'administration</span>
          </div>
        </div>
      )}
    </div>
  );
}
