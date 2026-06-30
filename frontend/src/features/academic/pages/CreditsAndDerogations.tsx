import React, { useState } from 'react';
import { Shield, BookOpen, AlertTriangle, ShieldCheck, Search, SlidersHorizontal, Settings2 } from 'lucide-react';

export default function CreditsAndDerogations() {
  const students = [
    { id: 1, name: 'ANISS EL ALAOUI', matricule: 'S20260001', filiere: 'Génie Informatique', niveau: 'GÉNIE INFORMATIQUE - GROUPE 1 (L1)', status: 'RÉGULIER / NORMAL', credits: 'Aucun crédit actif' },
    { id: 2, name: 'AHMED NACIRI', matricule: 'S20260002', filiere: 'Génie Informatique', niveau: 'GÉNIE INFORMATIQUE - GROUPE 1 (L1)', status: 'RÉGULIER / NORMAL', credits: 'Aucun crédit actif' },
    { id: 3, name: 'ILYAS ALAOUI', matricule: 'S20260003', filiere: 'Génie Informatique', niveau: 'GÉNIE INFORMATIQUE - GROUPE 1 (L1)', status: 'RÉGULIER / NORMAL', credits: 'Aucun crédit actif' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-blue-500" fill="currentColor" />
        <div>
          <h1 className="text-2xl font-black text-white italic">Gestion des Crédits & Cas Spéciaux</h1>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">RÉGULATION ACADÉMIQUE MAROCAINE, DÉROGATIONS ET SUIVI DES MODULES EN CRÉDIT</p>
        </div>
      </div>

      {/* Rules Box */}
      <div className="bg-gradient-to-r from-[#4741d6] to-[#2979ff] rounded-3xl p-8 text-white shadow-lg">
        <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
          <Shield className="w-3 h-3" /> CADRE RÉGLEMENTAIRE MAROCAIN
        </div>
        <h2 className="text-xl font-bold mb-4">Règles Nationales de Progression & Cas Exceptionnels</h2>
        <ul className="space-y-3 text-sm text-blue-50 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 bg-white rounded-full shrink-0"></span>
            <p><strong>Crédit de Module :</strong> Un étudiant n'ayant pas validé un ou plusieurs modules (note &lt; 10) mais ayant une moyenne générale â‰¥ 10/20 (sans note éliminatoire &lt; 5) est autorisé Ã  s'inscrire en année supérieure avec crédit des modules restants.</p>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 bg-white rounded-full shrink-0"></span>
            <p><strong>Dérogation Spéciale (Ajournements multiples) :</strong> Un étudiant ne peut normalement pas s'inscrire plus de deux fois dans le même niveau (double ajournement exclu). Une <strong>Dérogation Administrative</strong> exceptionnelle peut être accordée par le chef d'établissement pour accorder une <strong>Dernière Chance</strong> de réinscription.</p>
          </li>
        </ul>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">EFFECTIF GLOBAL</div>
            <div className="text-3xl font-black text-white">251</div>
          </div>
          <div className="p-3 bg-pink-100 rounded-2xl">
            <div className="w-6 h-6 text-pink-500">ðŸ¢</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">ÉTUDIANTS AVEC CRÉDITS</div>
            <div className="text-3xl font-black text-[#2979ff]">0</div>
          </div>
          <div className="p-3 bg-blue-100 rounded-2xl">
            <div className="w-6 h-6 text-blue-500">ðŸ“š</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">DÉROGATIONS ACCORDÉES</div>
            <div className="text-3xl font-black text-[#00bfa5]">0</div>
          </div>
          <div className="p-3 bg-emerald-100 rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">DERNIÈRE CHANCE</div>
            <div className="text-3xl font-black text-red-500">0</div>
          </div>
          <div className="p-3 bg-red-100 rounded-2xl">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-white/10 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
          <input 
            type="text" 
            placeholder="Nom, Matricule, CIN..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select className="flex-1 border border-white/10 bg-white rounded-xl px-4 py-2.5 text-sm text-white/80 outline-none">
          <option>-- Toutes les Filières --</option>
        </select>
        <select className="flex-1 border border-white/10 bg-white rounded-xl px-4 py-2.5 text-sm text-white/80 outline-none">
          <option>-- Tous les statuts --</option>
        </select>
        <button className="bg-[#2979ff] hover:bg-[#1565c0] text-white px-8 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm">
          Filtrer
        </button>
        <button className="text-white/50 font-bold text-sm hover:text-white px-4">
          Réinitialiser
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/[0.04] rounded-3xl shadow-lg border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-white/50 font-bold uppercase tracking-widest bg-white/[0.02] border-b border-white/10">
              <tr>
                <th className="px-6 py-4">ÉTUDIANT</th>
                <th className="px-6 py-4">FILIÈRE & NIVEAU</th>
                <th className="px-6 py-4">STATUT DÉROGATOIRE</th>
                <th className="px-6 py-4">CRÉDITS MODULES</th>
                <th className="px-6 py-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-white/[0.02]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2979ff] text-white font-bold flex items-center justify-center text-lg">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white">{student.name}</div>
                        <div className="text-[10px] font-bold text-white/50 mt-0.5 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {student.matricule} - CIN: --
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-white/90">{student.filiere}</div>
                    <div className="text-[10px] font-bold text-white/50 uppercase mt-0.5">{student.niveau}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {student.status}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold italic text-white/90">{student.credits}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/70 hover:text-white bg-white/[0.05] hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                      <Settings2 className="w-3 h-3" /> GÉRER CRÉDITS
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
