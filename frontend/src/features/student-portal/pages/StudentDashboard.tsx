import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  GraduationCap, Calendar, FileText, Upload, CheckCircle2, 
  Clock, AlertCircle
} from 'lucide-react';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'grades' | 'absences'>('overview');

  // Fetch grades (only published ones will be returned by API)
  const { data: gradesData, isLoading: loadingGrades } = useQuery({
    queryKey: ['student-grades'],
    queryFn: () => api.get('/student-portal/grades').then(res => res.data.data)
  });

  const submitAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/student-portal/absences', {
        student_id: 1, // Mocked
        attendance_id: 1, // Mocked 
        reason: 'medical',
        description: 'Certificat médical de 2 jours'
      });
      toast.success('Votre justificatif a été soumis avec succès.');
    } catch (error) {
      toast.error('Erreur lors de la soumission du justificatif.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Student Header */}
      <div className="bg-gradient-to-r from-[#1F3A5F] to-[#2A4D7C] rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/20">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Fatima ALAOUI</h1>
            <p className="text-blue-100 mt-1">CNE: N123456789 â€¢ ENCG Fès</p>
            <div className="flex gap-3 mt-4">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                S5 - Gestion Financière et Comptable
              </span>
              <span className="bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-emerald-500/30">
                Inscrite (Active)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="border-b border-white/10">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview' ? 'border-[#A80A0B] text-[#A80A0B]' : 'border-transparent text-white/50 hover:text-foreground'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('grades')}
              className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'grades' ? 'border-[#A80A0B] text-[#A80A0B]' : 'border-transparent text-white/50 hover:text-foreground'
              }`}
            >
              Mes Notes & Résultats
            </button>
            <button
              onClick={() => setActiveTab('absences')}
              className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'absences' ? 'border-[#A80A0B] text-[#A80A0B]' : 'border-transparent text-white/50 hover:text-foreground'
              }`}
            >
              Justification d'Absence
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-white/10/50 bg-white/5/20 rounded-xl p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-white" />
                  Prochains Cours
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-white/10/50">
                    <div>
                      <p className="font-medium text-sm">Fiscalité d'Entreprise</p>
                      <p className="text-xs text-white/50">Amphi B â€¢ Pr. El Fassi</p>
                    </div>
                    <span className="text-xs font-medium text-[#A80A0B]">Aujourd'hui, 14:00</span>
                  </div>
                </div>
              </div>
              <div className="border border-white/10/50 bg-white/5/20 rounded-xl p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Alertes & Notifications
                </h3>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-lg text-sm flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>La période de choix des modules électifs se termine dans 3 jours.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'grades' && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-semibold text-lg">Relevé de Notes (S5)</h3>
                <span className="bg-white/5 px-3 py-1 rounded-lg text-xs text-white/50">
                  Seules les notes publiées et délibérées sont affichées.
                </span>
              </div>
              
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white/5 text-white/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Module</th>
                      <th className="px-4 py-3 font-medium text-center">Note CC</th>
                      <th className="px-4 py-3 font-medium text-center">Note Examen</th>
                      <th className="px-4 py-3 font-medium text-center">Moyenne Finale</th>
                      <th className="px-4 py-3 font-medium text-center">Statut APOGEE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {/* Mock Data mimicking APOGEE deliberation */}
                    <tr className="bg-background">
                      <td className="px-4 py-3 font-medium">Fiscalité d'Entreprise</td>
                      <td className="px-4 py-3 text-center">14.00</td>
                      <td className="px-4 py-3 text-center">16.00</td>
                      <td className="px-4 py-3 text-center font-bold">15.00</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded font-medium text-xs">Validé (V)</span>
                      </td>
                    </tr>
                    <tr className="bg-background">
                      <td className="px-4 py-3 font-medium">Recherche Opérationnelle</td>
                      <td className="px-4 py-3 text-center">12.00</td>
                      <td className="px-4 py-3 text-center text-red-500 font-medium">ABSENT</td>
                      <td className="px-4 py-3 text-center font-bold text-red-500">0.00</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-red-500/10 text-red-600 px-2 py-1 rounded font-medium text-xs">Non Validé (NV)</span>
                      </td>
                    </tr>
                    <tr className="bg-background">
                      <td className="px-4 py-3 font-medium">Marketing Digital</td>
                      <td className="px-4 py-3 text-center">8.00</td>
                      <td className="px-4 py-3 text-center">9.00</td>
                      <td className="px-4 py-3 text-center font-bold">8.50</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-blue-500/10 text-blue-600 px-2 py-1 rounded font-medium text-xs">Validé par Comp. (VPC)</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'absences' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-4">Déclarer une absence</h3>
                <form onSubmit={submitAbsence} className="space-y-4 border border-white/10/50 bg-white/5/10 p-5 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium mb-1">Motif</label>
                    <select className="w-full border-input bg-background rounded-lg p-2 text-sm">
                      <option>Raison Médicale (Certificat)</option>
                      <option>Événement Familial</option>
                      <option>Convocation Officielle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea className="w-full border-input bg-background rounded-lg p-2 text-sm h-24" placeholder="Détails supplémentaires..."></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pièce Jointe (PDF/Image)</label>
                    <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:bg-white/5/50 transition-colors cursor-pointer">
                      <Upload className="w-6 h-6 text-white/50 mx-auto mb-2" />
                      <p className="text-sm text-white/50">Cliquez ou glissez votre fichier ici</p>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-[#1F3A5F] text-white rounded-lg py-2.5 font-medium hover:bg-[#152842] transition-colors">
                    Soumettre le Justificatif
                  </button>
                </form>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Historique des Justificatifs</h3>
                <div className="space-y-3">
                  <div className="border border-white/10 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">Certificat Médical - 2 jours</p>
                      <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Soumis le 10/11/2025
                      </p>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded font-medium text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Accepté
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
