import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSignature, PenTool, MessageSquare, Check, ChevronRight, Zap, Download, UploadCloud } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import { Spinner } from '@shared/components/ui/Spinner';

export default function ProfessorSmartGrading() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const isRtl = i18n.language === 'ar';
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [gradingData, setGradingData] = useState<any>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const formData = new FormData();
      formData.append('file', selectedFile);

      setIsProcessing(true);
      try {
        const res = await api.post('/professor/smart-grading/process', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        const data = res.data.data;
        setGradingData(data);
        setGrade(data.total_score.toString());
        setFeedback("Travail globalement satisfaisant. (Généré par l'IA)");
        toast.success("Analyse terminée !");
      } catch (err) {
        toast.error("Erreur lors de l'analyse IA");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleExport = async () => {
    if (!gradingData) return;
    
    setIsExporting(true);
    try {
      await api.post('/professor/smart-grading/export', {
        student_id: gradingData.student_id,
        score: parseFloat(grade),
        assessment_id: 1 // example
      });
      toast.success("Note synchronisée avec succès vers Apogée");
      // Reset for next paper
      setFile(null);
      setGradingData(null);
      setGrade('');
      setFeedback('');
    } catch (err) {
      toast.error("Erreur de synchronisation");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-6 font-sans animate-in fade-in zoom-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
            <FileSignature className="w-6 h-6 text-[#003a8c]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#001A4B] italic">Correction Intelligente (IA)</h1>
            <p className="text-sm text-gray-500">Examen Final : Module X</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left Pane: PDF Viewer / Uploader */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          
          {!file && !isProcessing && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gray-50">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <UploadCloud className="w-10 h-10 text-[#003a8c]" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Uploader une copie scannée</h2>
              <p className="text-sm text-gray-500 text-center mb-8 max-w-md">
                Glissez-déposez le PDF de la copie ici. L'IA analysera l'écriture manuscrite et proposera une note.
              </p>
              
              <label className="bg-[#003a8c] hover:bg-[#002a66] text-white px-6 py-3 rounded-xl font-bold cursor-pointer transition-colors shadow-sm">
                Sélectionner un fichier
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,image/*" 
                  onChange={handleFileUpload} 
                />
              </label>
            </div>
          )}

          {isProcessing && (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
              <Spinner className="w-12 h-12 text-[#003a8c] mb-4" />
              <p className="font-bold text-[#001A4B] animate-pulse">Analyse visuelle en cours...</p>
              <p className="text-xs text-gray-400 mt-2">Extraction des réponses et calcul des notes partielles.</p>
            </div>
          )}

          {file && gradingData && !isProcessing && (
            <>
              {/* PDF Toolbar */}
              <div className="h-14 border-b border-gray-100 bg-gray-50 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-600">{file.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">Page 1 / 1</span>
                </div>
              </div>
              
              {/* PDF Canvas (Simulated with extracted data) */}
              <div className="flex-1 bg-gray-200 overflow-auto p-8 flex justify-center custom-scrollbar">
                <div className="w-[600px] bg-white shadow-md relative p-12 font-serif text-sm">
                  <div className="border-b-2 border-black pb-4 mb-8 flex justify-between">
                    <div>
                      <div className="font-bold text-lg">Étudiant: {gradingData.student_id}</div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {gradingData.annotations.map((ann: any, idx: number) => (
                      <div key={idx} className="relative border border-dashed border-gray-300 p-4 rounded-lg bg-gray-50">
                        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-100 border border-red-200 flex items-center justify-center transform rotate-12">
                          <span className="text-xs font-bold text-red-600">{ann.score}/{ann.max_score}</span>
                        </div>
                        <p className="text-gray-700 font-medium italic mb-2">Zone détectée ({ann.type})</p>
                        <p className="text-sm text-gray-500">Feedback IA : {ann.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Pane: Grading Tools */}
        <div className="w-96 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1 flex flex-col relative overflow-hidden">
            
            {/* Disabled overlay if no data */}
            {(!gradingData || isProcessing) && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10"></div>
            )}

            <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6">Évaluation</h2>
            
            <div className="mb-8">
              <label className="block text-xs font-bold text-gray-500 mb-2">Note Globale (/20)</label>
              <div className="flex items-end gap-2">
                <input 
                  type="text" 
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="text-5xl font-black text-[#001A4B] w-28 bg-transparent focus:outline-none border-b-2 border-dashed border-gray-300 focus:border-[#e6007e] pb-1"
                />
                <span className="text-xl font-bold text-gray-400 mb-2">/ 20</span>
              </div>
              {gradingData && (
                 <p className="text-xs text-green-600 mt-2 font-medium">
                   Confiance IA: {(gradingData.confidence * 100).toFixed(0)}%
                 </p>
              )}
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-bold text-gray-500 mb-2">Commentaires / Feedback</label>
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#003a8c] focus:border-transparent transition-all"
                placeholder="Saisissez vos commentaires ici..."
              />
            </div>

          </div>

          <button 
            onClick={handleExport}
            disabled={!gradingData || isExporting}
            className="w-full bg-[#003a8c] disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-md hover:bg-[#002a66] transition-colors flex items-center justify-center gap-2"
          >
            {isExporting ? <Spinner className="w-5 h-5 text-white" /> : <Check className="w-5 h-5" />}
            Valider et Exporter
          </button>
        </div>

      </div>

    </div>
  );
}
