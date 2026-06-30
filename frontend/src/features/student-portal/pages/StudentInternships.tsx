import React from 'react';
import { Briefcase, MapPin, Calendar as CalendarIcon, User, Mail, Download, Crown, FileText } from 'lucide-react';

export default function StudentInternships() {
  return (
    <div className="max-w-[1000px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-50 text-[#003a8c] rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#003a8c] italic">Mon Espace Stage</h1>
          <p className="text-white/50 font-medium">Suivi complet de votre expérience professionnelle, conventions et rapports mensuels.</p>
        </div>
      </div>

      {/* Stage Actuel Details */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white/5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-[10px] font-black text-[#003a8c] uppercase tracking-widest mb-1">MON STAGE ACTUEL</div>
            <h2 className="text-2xl font-black text-white">ENCG</h2>
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
            TERMINÉ & ÉVALUÉ
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-rose-500 mt-0.5" />
              <div>
                <span className="font-bold text-white/80">Adresse :</span> <span className="text-white/70">FES</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Briefcase className="w-4 h-4 text-amber-700 mt-0.5" />
              <div>
                <span className="font-bold text-white/80">Sujet :</span> <span className="text-white/70">Development mobile</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarIcon className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <span className="font-bold text-white/80">Période :</span> <span className="text-white/70">du 01/06/2026 au 30/07/2026</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-[#001A4B] mt-0.5" />
              <div>
                <span className="font-bold text-white/80">Tuteur Pro :</span> <span className="text-white/70">RADOUANE EL-ASRI (0609265349)</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-[#001A4B] mt-0.5" />
              <div>
                <span className="font-bold text-white/80">Tuteur Académique :</span> <span className="text-white/70">Radouane el asri</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[#001A4B] mt-0.5" />
              <div>
                <span className="font-bold text-white/80">Contact Tuteur :</span> <span className="text-white/70">radouane.asri99@gmail.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Banner */}
      <div className="bg-[#10b981] rounded-[2rem] overflow-hidden shadow-lg border border-emerald-500 relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        
        <div className="p-8 pb-6 border-b border-emerald-400/50 flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Évaluation Finale Terminée !</h3>
            <p className="text-emerald-50 font-medium">Votre note finale et les commentaires de votre tuteur académique.</p>
          </div>
        </div>
        
        <div className="p-8 flex items-center justify-between relative z-10">
          <div className="space-y-6 flex-1">
            <div className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">NOTE DE STAGE</div>
            <div className="italic text-emerald-50 font-medium text-lg">"good idea"</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-white">19.50 <span className="text-xl text-emerald-200">/ 20</span></div>
          </div>
        </div>
      </div>

      {/* Monthly Reports */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-5 h-5 text-gray-400" />
          <h3 className="text-[12px] font-black text-[#001A4B] uppercase tracking-widest">RAPPORTS MENSUELS DE STAGE</h3>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-4">
                <h4 className="font-bold text-[#001A4B]">Rapport Mensuel NÂ°1 : rapport</h4>
                <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-200/50">
                  EN ATTENTE
                </span>
              </div>
              <p className="text-sm text-white/70 font-medium">rapport</p>
            </div>
            
            <button className="shrink-0 flex items-center gap-2 bg-white border border-white/10 text-white/80 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-white/[0.02] transition-colors shadow-sm">
              <Download className="w-4 h-4" /> TÉLÉCHARGER LE FICHIER RENDU
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
