import React from 'react';
import { Bell, BarChart2, MessageCircle } from 'lucide-react';

export default function EvaluationsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e6007e] italic tracking-tight">Évaluations & Qualité des Enseignements</h1>
        <button className="bg-[#e6007e] hover:bg-[#c5006c] text-white px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-colors shadow-md shadow-[#e6007e]/30">
          Clôturer la campagne
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-white/5/50 flex items-start gap-4">
        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
          <Bell className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Statut de la campagne d'évaluation</div>
          <h2 className="text-lg font-black text-white">La campagne est actuellement OUVERTE aux étudiants.</h2>
          <p className="text-sm text-white/50 mt-1">Les étudiants peuvent évaluer leurs cours de façon anonyme depuis leur espace.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5/50 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-black italic tracking-tight text-white">Résultats Agrégés des Enseignements</h3>
            <p className="text-xs text-white/50">Moyenne des évaluations anonymes soumises par les étudiants.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase text-white font-bold border-b border-white/5">
              <tr>
                <th className="px-4 py-4">Module & Enseignant</th>
                <th className="px-4 py-4">Évaluations</th>
                <th className="px-4 py-4">Organisation (Q1)</th>
                <th className="px-4 py-4">Clarté (Q2)</th>
                <th className="px-4 py-4">Dispo Prof (Q3)</th>
                <th className="px-4 py-4">Utilité (Q4)</th>
                <th className="px-4 py-4 text-[#e6007e]">Score Global</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-gray-400 font-medium italic">
                  Aucune donnée d'évaluation disponible pour le moment.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5/50 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-black italic tracking-tight text-white">Retours Qualitatifs & Commentaires</h3>
            <p className="text-xs text-white/50">Commentaires anonymes récents formulés par les étudiants.</p>
          </div>
        </div>

        <div className="py-16 text-center text-gray-400 font-medium italic">
          Aucun commentaire n'a été formulé pour l'instant.
        </div>
      </div>
    </div>
  );
}
