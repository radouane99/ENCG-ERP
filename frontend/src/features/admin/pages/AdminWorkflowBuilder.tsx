import React from 'react';
import { Network, Plus, Play, Settings, Save, AlertCircle, Check, GitBranch, ArrowRight, Bell, Database } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function AdminWorkflowBuilder() {
  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24 h-[calc(100vh-80px)] flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-[#003a8c] rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black text-[#003a8c] italic">Workflow Builder</h1>
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                ACTIF
              </span>
            </div>
            <p className="text-white/50 font-medium">Automatisation No-Code des processus de l'ENCG</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-white/10 text-white/80 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white/[0.02] transition-colors shadow-sm">
            <Settings className="w-4 h-4" /> Paramètres
          </button>
          <button className="flex items-center gap-2 bg-[#001A4B] text-white px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#003a8c] transition-colors shadow-sm">
            <Save className="w-4 h-4" /> ENREGISTRER
          </button>
        </div>
      </div>

      {/* Builder Workspace */}
      <div className="flex-1 bg-[#f8fafc] rounded-[2rem] border border-white/10 overflow-hidden shadow-inner flex relative">
        
        {/* Sidebar Components */}
        <div className="w-72 bg-white border-r border-white/10 p-6 flex flex-col h-full shadow-sm z-10 shrink-0">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">DÉCLENCHEURS (TRIGGERS)</h3>
          <div className="space-y-3 mb-8">
            <div className="p-3 border border-dashed border-gray-300 rounded-xl bg-white/[0.02] flex items-center gap-3 cursor-grab hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><AlertCircle className="w-4 h-4" /></div>
              <span className="text-sm font-bold text-white/80">Justificatif Reçu</span>
            </div>
            <div className="p-3 border border-dashed border-gray-300 rounded-xl bg-white/[0.02] flex items-center gap-3 cursor-grab hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600"><Plus className="w-4 h-4" /></div>
              <span className="text-sm font-bold text-white/80">Nouvelle Inscription</span>
            </div>
          </div>

          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">ACTIONS</h3>
          <div className="space-y-3">
            <div className="p-3 border border-white/10 rounded-xl bg-white flex items-center gap-3 cursor-grab shadow-sm hover:border-[#e6007e] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#e6007e]/10 flex items-center justify-center text-[#e6007e]"><Bell className="w-4 h-4" /></div>
              <span className="text-sm font-bold text-white/80">Envoyer Notification</span>
            </div>
            <div className="p-3 border border-white/10 rounded-xl bg-white flex items-center gap-3 cursor-grab shadow-sm hover:border-indigo-400 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600"><Database className="w-4 h-4" /></div>
              <span className="text-sm font-bold text-white/80">Mettre Ã  jour BDD</span>
            </div>
            <div className="p-3 border border-white/10 rounded-xl bg-white flex items-center gap-3 cursor-grab shadow-sm hover:border-purple-400 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600"><GitBranch className="w-4 h-4" /></div>
              <span className="text-sm font-bold text-white/80">Condition (Si/Sinon)</span>
            </div>
          </div>
        </div>

        {/* Canvas Area (Mockup) */}
        <div className="flex-1 relative overflow-hidden bg-[#f8fafc]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #e2e8f0 1px, transparent 0)', backgroundSize: '32px 32px' }}>
          
          {/* Mockup Nodes */}
          <div className="absolute top-20 left-20 w-72 bg-white rounded-2xl shadow-lg border-2 border-blue-500 overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white"><AlertCircle className="w-4 h-4" /></div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-0.5">DÉCLENCHEUR</div>
                <div className="text-sm font-bold text-white">Justificatif Médical Reçu</div>
              </div>
            </div>
            <div className="p-4 bg-white">
              <div className="text-xs text-white/50 mb-2">Écoute : Portail Étudiant</div>
              <div className="bg-white/[0.02] border border-white/10 rounded-lg p-2 text-xs font-mono text-white/70">payload.type === 'MEDICAL'</div>
            </div>
            {/* Connector Output */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full z-10"></div>
          </div>

          {/* SVG Line */}
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            <path d="M 368 180 C 420 180, 420 180, 480 180" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="6,6" className="animate-[dash_1s_linear_infinite]" />
            <path d="M 768 180 C 820 180, 820 280, 880 280" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="6,6" />
            <path d="M 768 180 C 820 180, 820 80, 880 80" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="6,6" />
          </svg>

          <div className="absolute top-20 left-[480px] w-72 bg-white rounded-2xl shadow-lg border border-white/10 overflow-hidden">
            {/* Connector Input */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-gray-300 rounded-full z-10"></div>
            
            <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-white"><GitBranch className="w-4 h-4" /></div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-0.5">CONDITION</div>
                <div className="text-sm font-bold text-white">Validation Médecin</div>
              </div>
            </div>
            <div className="p-4 bg-white">
              <div className="text-xs text-white/50 mb-2">Si document valide = VRAI</div>
            </div>
            {/* Connector Outputs */}
            <div className="absolute right-0 top-8 translate-x-1/2 w-4 h-4 bg-emerald-500 rounded-full z-10 border-2 border-white shadow-sm flex items-center justify-center text-[8px] text-white font-bold"><Check className="w-2 h-2"/></div>
            <div className="absolute right-0 bottom-8 translate-x-1/2 w-4 h-4 bg-rose-500 rounded-full z-10 border-2 border-white shadow-sm"></div>
          </div>

          <div className="absolute top-[30px] left-[880px] w-72 bg-white rounded-2xl shadow-lg border border-white/10 overflow-hidden">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-gray-300 rounded-full z-10"></div>
            <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white"><Database className="w-4 h-4" /></div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-0.5">ACTION</div>
                <div className="text-sm font-bold text-white">Mise Ã  jour Absences</div>
              </div>
            </div>
            <div className="p-4 bg-white">
              <div className="text-xs text-white/50">Action : Marquer comme "Justifié"</div>
            </div>
          </div>

          <div className="absolute top-[230px] left-[880px] w-72 bg-white rounded-2xl shadow-lg border border-white/10 overflow-hidden">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-gray-300 rounded-full z-10"></div>
            <div className="bg-rose-50 px-4 py-3 border-b border-rose-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center text-white"><Bell className="w-4 h-4" /></div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-0.5">ACTION</div>
                <div className="text-sm font-bold text-white">Notification Refus</div>
              </div>
            </div>
            <div className="p-4 bg-white">
              <div className="text-xs text-white/50">Destinataire : Étudiant</div>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
