import React, { useState } from 'react';
import { FileSignature, PenTool, MessageSquare, Check, ChevronRight, Zap, Download } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function ProfessorSmartGrading() {
  const [grade, setGrade] = useState('14');
  const [feedback, setFeedback] = useState('Bonne compréhension globale. Attention cependant Ã  la syntaxe SQL sur la question 3.');

  return (
    <div className="max-w-[1400px] mx-auto p-6 font-sans animate-in fade-in zoom-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-white/5">
            <FileSignature className="w-6 h-6 text-[#003a8c]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#001A4B] italic">Correction Intelligente</h1>
            <p className="text-sm text-white/50">Examen Final : Base de données - <span className="font-bold">Zineb Guessous</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400">Copie 12/45</span>
          <button className="w-10 h-10 bg-white rounded-xl shadow-sm border border-white/5 flex items-center justify-center hover:bg-white/[0.02] transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left Pane: PDF Viewer Mock */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-white/5 flex flex-col overflow-hidden">
          {/* PDF Toolbar */}
          <div className="h-14 border-b border-white/5 bg-white/[0.02]/50 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center" title="Stylo Rouge">
                <PenTool className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-lg hover:bg-gray-200 text-white/70 flex items-center justify-center" title="Commentaire">
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white/50">Page 1 / 4</span>
            </div>
            <button className="w-8 h-8 rounded-lg hover:bg-gray-200 text-white/70 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </button>
          </div>
          
          {/* PDF Canvas */}
          <div className="flex-1 bg-gray-200 overflow-auto p-8 flex justify-center custom-scrollbar">
            {/* The Paper */}
            <div className="w-[600px] h-[848px] bg-white shadow-md relative p-12 font-serif text-sm">
              <div className="border-b-2 border-black pb-4 mb-8 flex justify-between">
                <div>
                  <div className="font-bold text-lg">Zineb Guessous</div>
                  <div className="text-white/50">NÂ° Étudiant: 2026451</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">Examen Final SQL</div>
                  <div className="text-white/50">Juin 2026</div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="font-bold mb-2">Q1. Écrire la requête pour récupérer tous les étudiants.</h3>
                  <div className="font-mono text-white/80 bg-white/[0.02] p-4 rounded-lg">
                    SELECT * FROM etudiants;
                  </div>
                  {/* Mock Annotation */}
                  <div className="absolute top-[220px] right-8 transform rotate-12 text-2xl font-black text-red-500">
                    2/2
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-2">Q2. Écrire la requête pour trouver la moyenne des notes par module.</h3>
                  <div className="font-mono text-white/80 bg-white/[0.02] p-4 rounded-lg">
                    SELECT module, AVG(note) FROM notes GROUP BY module;
                  </div>
                  <div className="absolute top-[350px] right-8 transform rotate-12 text-2xl font-black text-red-500">
                    3/3
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-2">Q3. Jointure entre 'etudiants' et 'notes'.</h3>
                  <div className="font-mono text-white/80 bg-white/[0.02] p-4 rounded-lg">
                    SELECT * FROM etudiants INNER JOIN notes ON id_etu = notes.id
                  </div>
                  {/* Red drawing mock */}
                  <svg className="absolute top-[480px] left-[350px] w-32 h-12" style={{ pointerEvents: 'none' }}>
                    <path d="M 10 20 Q 50 5 100 20" stroke="red" strokeWidth="2" fill="transparent" />
                    <text x="30" y="40" fill="red" fontSize="12" fontFamily="sans-serif">Manque ";"</text>
                  </svg>
                  <div className="absolute top-[480px] right-8 transform rotate-12 text-2xl font-black text-red-500">
                    1.5/2
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Grading Tools */}
        <div className="w-96 flex flex-col gap-6">
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5 flex-1 flex flex-col">
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6">Évaluation</h2>
            
            <div className="mb-8">
              <label className="block text-xs font-bold text-white/50 mb-2">Note Globale (/20)</label>
              <div className="flex items-end gap-2">
                <input 
                  type="text" 
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="text-5xl font-black text-[#001A4B] w-24 bg-transparent focus:outline-none border-b-2 border-dashed border-gray-300 focus:border-[#e6007e] pb-1"
                />
                <span className="text-xl font-bold text-gray-400 mb-2">/ 20</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-bold text-white/50 mb-2">Commentaires / Feedback</label>
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full flex-1 bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#003a8c] focus:border-transparent transition-all"
                placeholder="Saisissez vos commentaires ici..."
              />
            </div>

            {/* AI Assistant for feedback */}
            <div className="mt-4 bg-purple-50 border border-purple-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-purple-900">Suggestion IA</span>
              </div>
              <p className="text-[11px] text-purple-700 mb-3">
                "Très bon travail dans l'ensemble. La maîtrise des jointures est presque parfaite, attention juste Ã  la ponctuation SQL."
              </p>
              <button 
                onClick={() => setFeedback("Très bon travail dans l'ensemble. La maîtrise des jointures est presque parfaite, attention juste Ã  la ponctuation SQL.")}
                className="text-[10px] bg-purple-200 hover:bg-purple-300 text-purple-800 font-bold px-3 py-1.5 rounded-lg transition-colors uppercase tracking-widest"
              >
                Utiliser ce texte
              </button>
            </div>
          </div>

          <button className="w-full bg-[#003a8c] text-white font-bold py-4 rounded-2xl shadow-md hover:bg-[#002a66] transition-colors flex items-center justify-center gap-2">
            <Check className="w-5 h-5" /> Valider et Suivant
          </button>
        </div>

      </div>

    </div>
  );
}
