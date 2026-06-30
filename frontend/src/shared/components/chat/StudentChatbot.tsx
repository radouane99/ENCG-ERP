import React, { useState } from 'react';
import { MessageSquare, X, Send, GraduationCap, BarChart3, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useAuthStore } from '@stores/authStore';

export default function StudentChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const user = useAuthStore(state => state.user);
  const roles = user?.roles || [];
  
  const isStudent = roles.includes('student');
  const isProfessor = roles.includes('professor');
  const isAdmin = roles.includes('admin') || roles.includes('super-admin');

  const botTitle = isAdmin ? 'Assistant Admin' : isProfessor ? 'Assistant Professeur' : 'Assistant Étudiant';
  const botGreeting = isAdmin ? 'Salut ! Je suis ton assistant administrateur IA 👋' : isProfessor ? 'Salut ! Je suis ton assistant professeur IA 👋' : 'Salut ! Je suis ton assistant étudiant IA 👋';

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[350px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="bg-[#10b981] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">ENCG AI Assistant</h3>
                <p className="text-emerald-100 text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  {botTitle} · Gemini IA
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-emerald-100 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 bg-gray-50 h-[300px] overflow-y-auto space-y-4">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 text-sm text-gray-700">
                <p className="mb-3">{botGreeting}</p>
                <p className="mb-2">Je peux t'aider avec :</p>
                <ul className="space-y-1.5 text-gray-600">
                  {isStudent && (
                    <>
                      <li className="flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5 text-indigo-500" /> Tes notes & moyenne</li>
                      <li className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-blue-500" /> Ton emploi du temps</li>
                      <li className="flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Tes absences</li>
                    </>
                  )}
                  {isProfessor && (
                    <>
                      <li className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-blue-500" /> Ton planning de cours</li>
                      <li className="flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5 text-indigo-500" /> Saisie des notes</li>
                      <li className="flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Convocations surveillance</li>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <li className="flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5 text-indigo-500" /> Statistiques globales</li>
                      <li className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-amber-500" /> Gestion des inscriptions</li>
                      <li className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-blue-500" /> Planification des examens</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto custom-scrollbar">
            {isStudent && (
              <>
                <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
                  <BarChart3 className="w-3 h-3 text-indigo-500" /> Mes notes
                </button>
                <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
                  <Calendar className="w-3 h-3 text-blue-500" /> Cours du jour
                </button>
              </>
            )}
            {isProfessor && (
              <>
                <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
                  <Calendar className="w-3 h-3 text-blue-500" /> Emploi du temps
                </button>
                <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
                  <FileText className="w-3 h-3 text-amber-500" /> Saisir notes
                </button>
              </>
            )}
            {isAdmin && (
              <>
                <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
                  <BarChart3 className="w-3 h-3 text-indigo-500" /> Tableau de bord
                </button>
                <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
                  <Calendar className="w-3 h-3 text-blue-500" /> Examens
                </button>
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="relative">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Pose ta question..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#a7f3d0] flex items-center justify-center text-emerald-700 hover:bg-[#6ee7b7] transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105",
          isOpen ? "bg-gray-100 text-gray-500" : "bg-[#10b981] text-white"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : (
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-[#10b981]"></div>
          </div>
        )}
      </button>
    </div>
  );
}
