import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24 h-[calc(100vh-100px)] flex flex-col">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-2 shrink-0">
        <h1 className="text-xl font-black text-[#001A4B] italic">Messagerie Interne</h1>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-white/5 flex-1 flex overflow-hidden">
        
        {/* Left Pane: Inbox */}
        <div className="w-1/3 border-r border-white/5 flex flex-col bg-white/[0.02]/30">
          <div className="p-6 border-b border-white/5 shrink-0">
            <h2 className="text-lg font-black text-white italic">Boîte de réception</h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-blue-50/50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100/50">
              <span className="text-2xl">ðŸ“¬</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AUCUNE CONVERSATION</p>
          </div>
        </div>

        {/* Right Pane: Conversation Content */}
        <div className="w-2/3 flex flex-col items-center justify-center text-center p-12 bg-white">
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-50 to-purple-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-indigo-100/50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
              <span className="text-3xl opacity-80">ðŸ’¬</span>
            </div>
          </div>
          
          <h3 className="text-2xl font-black text-white mb-3">Sélectionnez une conversation</h3>
          <p className="text-sm text-white/50 max-w-sm">
            Choisissez une conversation dans la liste de gauche pour afficher les messages ou en envoyer un nouveau.
          </p>
        </div>

      </div>

    </div>
  );
}
