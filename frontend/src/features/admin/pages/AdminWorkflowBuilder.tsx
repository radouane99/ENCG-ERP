import React from 'react';
import { Network, Plus, Play, Settings, Save, AlertCircle, Check, GitBranch, ArrowRight, Bell, Database, Zap, FileText } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function AdminWorkflowBuilder() {
  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24 h-[calc(100vh-80px)] flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#0f2863]/10 text-[#0f2863] rounded-2xl flex items-center justify-center border border-[#0f2863]/20 shadow-sm">
            <Network className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-extrabold text-[#0f2863] tracking-tight">Workflow Builder</h1>
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-200">
                ACTIF
              </span>
            </div>
            <p className="text-slate-500 font-medium text-sm">Automatisation No-Code & Moteur de règles métiers de l'ENCG</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
            <Settings className="w-4 h-4 text-slate-500" /> Paramètres
          </button>
          <button className="flex items-center gap-2 bg-[#0f2863] text-white px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#091b44] transition-colors shadow-md">
            <Save className="w-4 h-4" /> ENREGISTRER
          </button>
        </div>
      </div>

      {/* Builder Workspace */}
      <div className="flex-1 bg-slate-50 rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner flex relative">
        
        {/* Sidebar Components */}
        <div className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col h-full shadow-sm z-10 shrink-0">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> DÉCLENCHEURS (TRIGGERS)
          </h3>
          <div className="space-y-3 mb-8">
            <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3 cursor-grab hover:border-blue-500 hover:bg-blue-50/50 transition-all shadow-sm group">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Justificatif Médical</p>
                <p className="text-[10px] text-slate-500">Portail Étudiant</p>
              </div>
            </div>
            <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3 cursor-grab hover:border-emerald-500 hover:bg-emerald-50/50 transition-all shadow-sm group">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Nouvelle Inscription</p>
                <p className="text-[10px] text-slate-500">Service Scolarité</p>
              </div>
            </div>
          </div>

          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-indigo-500" /> ACTIONS & LOGIQUE
          </h3>
          <div className="space-y-3">
            <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3 cursor-grab hover:border-rose-500 hover:bg-rose-50/50 transition-all shadow-sm group">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Envoyer Notification</p>
                <p className="text-[10px] text-slate-500">Email, SMS, Push</p>
              </div>
            </div>
            <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3 cursor-grab hover:border-indigo-500 hover:bg-indigo-50/50 transition-all shadow-sm group">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Mise à jour BDD</p>
                <p className="text-[10px] text-slate-500">Absences & Registres</p>
              </div>
            </div>
            <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3 cursor-grab hover:border-purple-500 hover:bg-purple-50/50 transition-all shadow-sm group">
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Condition (Si/Sinon)</p>
                <p className="text-[10px] text-slate-500">Règle conditionnelle</p>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-slate-50/70" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #cbd5e1 1.5px, transparent 0)', backgroundSize: '28px 28px' }}>
          
          {/* Node 1: Trigger */}
          <div className="absolute top-20 left-16 w-80 bg-white rounded-2xl shadow-xl border-2 border-blue-500 overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-700">DÉCLENCHEUR</div>
                <div className="text-sm font-extrabold text-slate-900">Justificatif Médical Reçu</div>
              </div>
            </div>
            <div className="p-4 bg-white space-y-2">
              <div className="text-xs font-semibold text-slate-600">Écouteur : Portail Étudiant</div>
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-800 font-semibold">
                payload.type === 'MEDICAL'
              </div>
            </div>
            {/* Connector Output */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full z-10 shadow-sm"></div>
          </div>

          {/* SVG Connector Lines */}
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            <path d="M 384 180 C 440 180, 440 180, 500 180" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="6,6" className="animate-[dash_1s_linear_infinite]" />
            <path d="M 820 180 C 870 180, 870 100, 930 100" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="6,6" />
            <path d="M 820 180 C 870 180, 870 280, 930 280" fill="none" stroke="#f43f5e" strokeWidth="3" strokeDasharray="6,6" />
          </svg>

          {/* Node 2: Condition */}
          <div className="absolute top-20 left-[500px] w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Connector Input */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-purple-500 rounded-full z-10 shadow-sm"></div>
            
            <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-sm">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-purple-700">CONDITION</div>
                <div className="text-sm font-extrabold text-slate-900">Validation Médecin</div>
              </div>
            </div>
            <div className="p-4 bg-white space-y-2">
              <div className="text-xs font-semibold text-slate-600">Règle de décision :</div>
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-800 font-semibold">
                document.status === 'VALIDATED'
              </div>
            </div>
            {/* Connector Outputs */}
            <div className="absolute right-0 top-8 translate-x-1/2 w-5 h-5 bg-emerald-500 rounded-full z-10 border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white font-bold">
              <Check className="w-3 h-3" />
            </div>
            <div className="absolute right-0 bottom-8 translate-x-1/2 w-5 h-5 bg-rose-500 rounded-full z-10 border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white font-bold">
              ×
            </div>
          </div>

          {/* Node 3: Action Success */}
          <div className="absolute top-[30px] left-[930px] w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full z-10 shadow-sm"></div>
            <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-700">ACTION (VRAI)</div>
                <div className="text-sm font-extrabold text-slate-900">Mise à jour Absences</div>
              </div>
            </div>
            <div className="p-4 bg-white">
              <div className="text-xs font-semibold text-slate-600">Action : Marquer comme <span className="text-emerald-600 font-bold">"Justifié"</span></div>
            </div>
          </div>

          {/* Node 4: Action Refusal */}
          <div className="absolute top-[230px] left-[930px] w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-rose-500 rounded-full z-10 shadow-sm"></div>
            <div className="bg-rose-50 px-4 py-3 border-b border-rose-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-sm">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-rose-700">ACTION (FAUX)</div>
                <div className="text-sm font-extrabold text-slate-900">Notification Refus</div>
              </div>
            </div>
            <div className="p-4 bg-white">
              <div className="text-xs font-semibold text-slate-600">Destinataire : <span className="text-slate-900 font-bold">Étudiant & Professeur</span></div>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
