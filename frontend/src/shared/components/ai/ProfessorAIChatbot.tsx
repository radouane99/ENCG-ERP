import React, { useState } from 'react';
import { X, Calendar, UserX, FileText, Building, Send, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@stores/authStore';

export default function ProfessorAIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { hasAnyRole } = useAuthStore();

  // Only render if user is a professor
  if (!hasAnyRole(['professor', 'vacataire'])) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-tr from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-orange-500/30 transition-transform hover:scale-105 z-50 animate-bounce-short"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col border border-gray-100 font-sans animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 flex items-center justify-between text-white relative">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl shadow-sm backdrop-blur-sm border border-white/30">
                🧑‍🏫
              </div>
              <div>
                <h3 className="font-black text-lg leading-tight">UPF Prof AI</h3>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-100">
                  <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse"></div>
                  Assistant enseignant · Gemini IA
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors relative z-10"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Background decoration */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 p-5 bg-gray-50/50 min-h-[300px] max-h-[400px] overflow-y-auto">
            
            {/* AI Message */}
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-sm shrink-0 shadow-sm border border-amber-200">
                🧑‍🏫
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 text-gray-700 text-sm w-full">
                <p className="mb-4">Bonjour Professeur ! Je suis votre assistant IA 🤝</p>
                <p className="font-bold text-gray-900 mb-2">Je peux vous aider avec :</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" /> Votre emploi du temps
                  </li>
                  <li className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-emerald-500" /> Absences de vos étudiants
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-500" /> Générer des QCM
                  </li>
                  <li className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-500" /> Réservation de salles
                  </li>
                </ul>
              </div>
            </div>

          </div>

          {/* Quick Actions */}
          <div className="px-5 py-3 flex flex-wrap gap-2 border-t border-gray-100 bg-white">
            <button className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1.5 transition-colors">
              <Calendar className="w-3 h-3" /> Mon planning
            </button>
            <button className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition-colors">
              <UserX className="w-3 h-3" /> Absences non justifiées
            </button>
            <button className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-full text-xs font-bold border border-rose-200 flex items-center gap-1.5 transition-colors">
              <FileText className="w-3 h-3" /> Générer un QCM
            </button>
            <button className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-xs font-bold border border-gray-200 flex items-center gap-1.5 transition-colors">
              <Building className="w-3 h-3" /> Réserver une salle
            </button>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white">
            <div className="flex gap-2 items-center bg-gray-50 p-1.5 rounded-2xl border border-gray-200 focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-400 transition-all">
              <input 
                type="text" 
                placeholder="Votre question..."
                className="flex-1 bg-transparent px-3 py-2 text-sm font-medium focus:outline-none text-gray-700 placeholder:text-gray-400"
              />
              <button className="bg-orange-300 hover:bg-orange-400 text-white w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                <Send className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
