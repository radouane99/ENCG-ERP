import React, { useState } from 'react';
import { ClipboardList, Users, CheckCircle2, GraduationCap, FileText, Send, Mail, Printer, LayoutList } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ConvocationDashboard() {
  const [activeTab, setActiveTab] = useState<'etudiants' | 'surveillants' | 'dispo'>('surveillants');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-500/10 rounded-xl">
            <ClipboardList className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-pink-600 italic">Gestion des Convocations d'Examens</h1>
          </div>
        </div>
        <div className="text-sm font-bold text-white/50">
          24/06/2026
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-white/50 uppercase mb-1 block">Session d'examens</label>
          <select className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
            <option>Normale Automne â€” 2025/2026</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-white/50 uppercase mb-1 block">Filière</label>
          <select className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
            <option>Toutes les filières</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-white/50 uppercase mb-1 block">Statut</label>
          <select className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
            <option>Tous les statuts</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button 
          onClick={() => setActiveTab('etudiants')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors border-b-2 ${activeTab === 'etudiants' ? 'border-[#1F3A5F] text-white' : 'border-transparent text-white/50 hover:text-foreground'}`}
        >
          <GraduationCap className="w-4 h-4" /> Étudiants (750)
        </button>
        <button 
          onClick={() => setActiveTab('surveillants')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors border-b-2 ${activeTab === 'surveillants' ? 'border-[#e91e63] text-[#e91e63]' : 'border-transparent text-white/50 hover:text-foreground'}`}
        >
          <Users className="w-4 h-4" /> Surveillants (28)
        </button>
        <button 
          onClick={() => setActiveTab('dispo')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase transition-colors border-b-2 ${activeTab === 'dispo' ? 'border-blue-500 text-blue-500' : 'border-transparent text-white/50 hover:text-foreground'}`}
        >
          <LayoutList className="w-4 h-4" /> Disponibilités (5)
        </button>
      </div>

      {/* KPIs depending on tab */}
      {activeTab === 'surveillants' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#7165e3] text-white p-6 rounded-2xl shadow-sm">
            <div className="text-4xl font-black mb-1">28</div>
            <div className="text-xs font-bold uppercase opacity-90">Total Profs</div>
          </div>
          <div className="bg-[#2979ff] text-white p-6 rounded-2xl shadow-sm">
            <div className="text-4xl font-black mb-1">23</div>
            <div className="text-xs font-bold uppercase opacity-90">Générées</div>
          </div>
          <div className="bg-[#00bfa5] text-white p-6 rounded-2xl shadow-sm">
            <div className="text-4xl font-black mb-1">0</div>
            <div className="text-xs font-bold uppercase opacity-90">Envoyées</div>
          </div>
          <div className="bg-[#4caf50] text-white p-6 rounded-2xl shadow-sm">
            <div className="text-4xl font-black mb-1">5</div>
            <div className="text-xs font-bold uppercase opacity-90">Confirmées</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#1F3A5F] text-white p-6 rounded-2xl shadow-sm">
            <div className="text-4xl font-black mb-1 flex items-center gap-2"><GraduationCap className="w-6 h-6 opacity-50"/> 750</div>
            <div className="text-xs font-bold uppercase opacity-90">Total Étudiants</div>
          </div>
          <div className="bg-[#2979ff] text-white p-6 rounded-2xl shadow-sm">
            <div className="text-4xl font-black mb-1 flex items-center gap-2"><FileText className="w-6 h-6 opacity-50"/> 728</div>
            <div className="text-xs font-bold uppercase opacity-90">Générées</div>
          </div>
          <div className="bg-[#00bfa5] text-white p-6 rounded-2xl shadow-sm">
            <div className="text-4xl font-black mb-1 flex items-center gap-2"><Send className="w-6 h-6 opacity-50"/> 21</div>
            <div className="text-xs font-bold uppercase opacity-90">Envoyées</div>
          </div>
          <div className="bg-[#8e24aa] text-white p-6 rounded-2xl shadow-sm">
            <div className="text-4xl font-black mb-1 flex items-center gap-2"><CheckCircle2 className="w-6 h-6 opacity-50"/> 1</div>
            <div className="text-xs font-bold uppercase opacity-90">Téléchargées</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white border border-white/10 p-6 rounded-2xl shadow-sm">
        <h3 className="text-[#e91e63] font-bold text-sm uppercase flex items-center gap-2 mb-4">
          <span className="bg-[#e91e63] p-1 rounded text-white"><LayoutList className="w-4 h-4"/></span> 
          Actions â€” {activeTab === 'surveillants' ? 'Surveillance' : 'Étudiants'}
        </h3>
        
        {activeTab === 'surveillants' ? (
          <div className="flex flex-wrap gap-3">
            <button className="bg-[#e91e63] hover:bg-[#c2185b] text-white px-4 py-2.5 rounded-lg font-bold text-xs uppercase shadow-sm flex items-center gap-2">
              Affectation Auto des Surveillants
            </button>
            <button className="bg-[#2979ff] hover:bg-[#1565c0] text-white px-4 py-2.5 rounded-lg font-bold text-xs uppercase shadow-sm flex items-center gap-2">
              <FileText className="w-4 h-4" /> Générer Convocations Profs
            </button>
            <button className="bg-[#e91e63] hover:bg-[#c2185b] text-white px-4 py-2.5 rounded-lg font-bold text-xs uppercase shadow-sm flex items-center gap-2">
              <Mail className="w-4 h-4" /> Envoyer Emails Profs
            </button>
            <Link to="/academic/convocations/professor/1/print" className="bg-[#7165e3] hover:bg-[#5c50c5] text-white px-4 py-2.5 rounded-lg font-bold text-xs uppercase shadow-sm flex items-center gap-2">
              <Printer className="w-4 h-4" /> Imprimer Convocations Profs
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <button className="bg-[#2979ff] hover:bg-[#1565c0] text-white px-4 py-2.5 rounded-lg font-bold text-xs uppercase shadow-sm flex items-center gap-2">
              <FileText className="w-4 h-4" /> Générer Convocations Étudiants
            </button>
            <button className="bg-[#00bfa5] hover:bg-[#009688] text-white px-4 py-2.5 rounded-lg font-bold text-xs uppercase shadow-sm flex items-center gap-2">
              <Mail className="w-4 h-4" /> Envoyer Emails Étudiants
            </button>
            <Link to="/academic/convocations/student/1/print" className="bg-[#7165e3] hover:bg-[#5c50c5] text-white px-4 py-2.5 rounded-lg font-bold text-xs uppercase shadow-sm flex items-center gap-2">
              <Printer className="w-4 h-4" /> Aperçu Convocation Étudiant (Demo)
            </Link>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white border border-white/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-bold text-lg">
            Convocations de {activeTab === 'surveillants' ? 'surveillance' : 'passage'}
          </h3>
        </div>
        
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-white/50 font-bold uppercase bg-white/5/20">
            <tr>
              {activeTab === 'surveillants' ? (
                <>
                  <th className="px-6 py-4">Professeur</th>
                  <th className="px-6 py-4">Examen</th>
                  <th className="px-6 py-4">Date / Heure</th>
                  <th className="px-6 py-4">Salle</th>
                  <th className="px-6 py-4">Rôle</th>
                  <th className="px-6 py-4 text-right">Statut</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4">Étudiant</th>
                  <th className="px-6 py-4">Filière</th>
                  <th className="px-6 py-4 text-right">Statut</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {activeTab === 'surveillants' ? (
              <>
                <tr className="hover:bg-white/5/10">
                  <td className="px-6 py-4 font-bold">Radouane el asri</td>
                  <td className="px-6 py-4 font-medium">Introduction - Génie Civil</td>
                  <td className="px-6 py-4 text-xs">01/07/2026<br/>09:00</td>
                  <td className="px-6 py-4 text-xs font-bold text-white/50">Labo Info 1</td>
                  <td className="px-6 py-4"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Principal</span></td>
                  <td className="px-6 py-4 text-right"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase border border-emerald-200">Confirmée</span></td>
                </tr>
                <tr className="hover:bg-white/5/10">
                  <td className="px-6 py-4 font-bold">Prof. Hicham Alaoui</td>
                  <td className="px-6 py-4 font-medium">Avancé - Marketing & Commerce</td>
                  <td className="px-6 py-4 text-xs">02/07/2026<br/>09:00</td>
                  <td className="px-6 py-4 text-xs font-bold text-white/50">Salle TD 02</td>
                  <td className="px-6 py-4"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Principal</span></td>
                  <td className="px-6 py-4 text-right"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase border border-blue-200">Générée</span></td>
                </tr>
                <tr className="hover:bg-white/5/10">
                  <td className="px-6 py-4 font-bold">Radouane el asri</td>
                  <td className="px-6 py-4 font-medium">Introduction - Marketing & Commerce</td>
                  <td className="px-6 py-4 text-xs">01/07/2026<br/>16:30</td>
                  <td className="px-6 py-4 text-xs font-bold text-white/50">Labo Info 1</td>
                  <td className="px-6 py-4"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Principal</span></td>
                  <td className="px-6 py-4 text-right"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase border border-emerald-200">Confirmée</span></td>
                </tr>
              </>
            ) : (
              <>
                <tr className="hover:bg-white/5/10">
                  <td className="px-6 py-4 font-bold">Aniss El Alaoui</td>
                  <td className="px-6 py-4 font-medium">Génie Informatique</td>
                  <td className="px-6 py-4 text-right"><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase border border-purple-200">Téléchargée</span></td>
                </tr>
                <tr className="hover:bg-white/5/10">
                  <td className="px-6 py-4 font-bold">Salma Bennis</td>
                  <td className="px-6 py-4 font-medium">Finance & Audit</td>
                  <td className="px-6 py-4 text-right"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase border border-emerald-200">Envoyée</span></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
