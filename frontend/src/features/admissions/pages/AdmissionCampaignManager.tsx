import React, { useState } from 'react';
import { Target, Users, Search, Download, Calculator, FileCheck2, Filter } from 'lucide-react';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

export default function AdmissionCampaignManager() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const calculateSeuil = async () => {
    setIsCalculating(true);
    try {
      const res = await api.post('/admissions/campaigns/1/calculate-seuil');
      setResult(res.data.data);
      toast.success('Seuil calculé et candidats triés avec succès.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du calcul.');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Moteur de Présélection (TAFEM)
          </h1>
          <p className="text-muted-foreground mt-1">
            Calcul du Seuil, tri par mérite et génération des listes d'attente pour l'accès Ã  l'ENCG.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Campagne 2026-2027</h2>
            
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Formule:</span>
                <span className="font-medium text-foreground">75% Nat + 25% Reg</span>
              </div>
              <div className="flex justify-between">
                <span>Capacité Cible:</span>
                <span className="font-medium text-foreground">450 places</span>
              </div>
              <div className="flex justify-between">
                <span>Candidats Inscrits:</span>
                <span className="font-medium text-foreground">12 500</span>
              </div>
            </div>

            <button
              onClick={calculateSeuil}
              disabled={isCalculating}
              className="w-full mt-6 bg-[#A80A0B] hover:bg-[#7D0809] text-white px-4 py-3 rounded-xl font-medium flex justify-center items-center gap-2 transition-all disabled:opacity-70"
            >
              {isCalculating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Calculator className="w-5 h-5" />
              )}
              Calculer le Seuil (Rank)
            </button>
          </div>

          {result && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-emerald-800 flex items-center gap-2 mb-3">
                <FileCheck2 className="w-5 h-5" />
                Résultat du Calcul
              </h3>
              <div className="text-3xl font-black text-emerald-600 mb-1">
                {result.seuil_calculated.toFixed(2)}
              </div>
              <p className="text-emerald-700/80 text-sm">Seuil d'admissibilité</p>
              
              <div className="mt-4 pt-4 border-t border-emerald-500/20">
                <p className="text-sm font-medium text-emerald-800">
                  {result.invited_to_exam} candidats convoqués Ã  l'écrit.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Main Content: Ranking List */}
        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-border flex flex-wrap gap-4 items-center justify-between bg-muted/20">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                Classement par Mérite
              </h2>
              
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    className="pl-9 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 bg-background border border-input rounded-lg text-sm font-medium hover:bg-muted">
                  <Filter className="w-4 h-4" />
                  Filtres
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium hover:bg-primary/20">
                  <Download className="w-4 h-4" />
                  Exporter
                </button>
              </div>
            </div>

            <div className="flex-1 p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Rang</th>
                    <th className="px-6 py-4 font-medium">Nom Complet</th>
                    <th className="px-6 py-4 font-medium text-right">Score Calculé</th>
                    <th className="px-6 py-4 font-medium text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result ? (
                    result.top_candidates.map((candidate: any, idx: number) => (
                      <tr key={candidate.application_id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-foreground">
                          #{idx + 1}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {candidate.last_name} {candidate.first_name}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-medium text-primary">
                          {candidate.score.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Présélectionné(e)
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                        Cliquez sur "Calculer le Seuil" pour lancer l'algorithme de classement sur l'ensemble de la base de données (Mode Batch).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
