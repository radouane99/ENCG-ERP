import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BarChart2, MessageSquare, AlertTriangle } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function AdminEvaluationsPage() {
  return (
    <div className="space-y-8 animate-in p-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#0f2863] italic">Évaluations & Qualité des Enseignements</h1>
        <button className="bg-[#c01844] hover:bg-[#a01438] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm">
          CLÔTURER LA CAMPAGNE
        </button>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-white rounded-[2rem] p-8 border border-amber-100 shadow-sm flex items-start gap-6 relative overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-500 flex items-center justify-center shrink-0">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">STATUT DE LA CAMPAGNE D'ÉVALUATION</h3>
          <p className="text-xl font-bold text-slate-800 mb-1">La campagne est actuellement <span className="text-amber-600">OUVERTE</span> aux étudiants.</p>
          <p className="text-xs text-slate-500 font-medium">Les étudiants peuvent évaluer leurs cours de façon anonyme depuis leur espace.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-blue-500"><BarChart2 className="w-5 h-5" /></div>
          <h2 className="text-lg font-bold text-slate-800 italic">Résultats Agrégés des Enseignements</h2>
        </div>
        <p className="text-xs text-slate-500 mb-8 ml-8">Moyenne des évaluations anonymes soumises par les étudiants.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="pb-4 px-4">MODULE & ENSEIGNANT</th>
                <th className="pb-4 px-4 text-center">ÉVALUATIONS</th>
                <th className="pb-4 px-4 text-center">ORGANISATION (Q1)</th>
                <th className="pb-4 px-4 text-center">CLARTÉ (Q2)</th>
                <th className="pb-4 px-4 text-center">DISPO PROF (Q3)</th>
                <th className="pb-4 px-4 text-center">UTILITÉ (Q4)</th>
                <th className="pb-4 px-4 text-center">SCORE GLOBAL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-400 text-xs italic">
                  Aucune donnée d'évaluation disponible pour le moment.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-purple-500"><MessageSquare className="w-5 h-5" /></div>
          <h2 className="text-lg font-bold text-slate-800 italic">Retours Qualitatifs & Commentaires</h2>
        </div>
        <p className="text-xs text-slate-500 mb-8 ml-8">Commentaires anonymes récents formulés par les étudiants.</p>

        <div className="py-12 text-center text-slate-400 text-xs italic">
          Aucun commentaire n'a été formulé pour l'instant.
        </div>
      </div>
    </div>
  )
}
