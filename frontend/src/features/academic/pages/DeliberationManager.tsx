import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Calculator, Lock, Unlock, FileText, CheckCircle2, 
  AlertTriangle, Users, BookOpen, Calendar
} from 'lucide-react';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

export default function DeliberationManager() {
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [selectedSession, setSelectedSession] = useState('normale');

  // Mocked state for UI demonstration
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [deliberationResults, setDeliberationResults] = useState<any>(null);

  const runDeliberation = async () => {
    setIsDeliberating(true);
    try {
      // Calling the mock deliberation endpoint we created earlier
      const res = await api.get('/academic/mock-deliberation');
      setDeliberationResults(res.data.data);
      toast.success('Délibération générée avec succès selon le modèle APOGEE.');
    } catch (error) {
      toast.error('Erreur lors de la délibération.');
    } finally {
      setIsDeliberating(false);
    }
  };

  const openGradePeriod = async () => {
    try {
      await api.post('/academic/grade-periods', {
        academic_year_id: 1,
        semester_id: 1,
        exam_session_id: 1,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      toast.success('Période de saisie des notes ouverte pour les professeurs.');
    } catch (error) {
      toast.error('Erreur lors de l\'ouverture de la période.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            Moteur de Délibération APOGEE
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion stricte des notes, compensations et passages selon le modèle universitaire marocain.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              Verrouillage des Notes
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Les professeurs ne peuvent saisir les notes que pendant les périodes explicitement ouvertes par l'administration.
            </p>
            <div className="space-y-3">
              <button 
                onClick={openGradePeriod}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 py-2.5 rounded-xl font-medium transition-colors"
              >
                <Unlock className="w-4 h-4" />
                Ouvrir Saisie (Session Normale)
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 py-2.5 rounded-xl font-medium transition-colors">
                <Lock className="w-4 h-4" />
                Fermer la Saisie
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Rapports Académiques
            </h3>
            <div className="space-y-2">
              {[
                { label: 'PV de Délibération', type: 'deliberation_pv' },
                { label: 'Rapport des Compensations', type: 'compensation' },
                { label: 'Bilan des Modules Réservés', type: 'reserved_modules' },
                { label: 'Propositions de Jury', type: 'jury_proposals' }
              ].map(report => (
                <button 
                  key={report.type} 
                  onClick={() => window.open(`/api/academic/reports/${report.type}?semester=${selectedSemester}&session=${selectedSession}`, '_blank')}
                  className="w-full text-left px-4 py-2 text-sm bg-muted/50 hover:bg-muted text-foreground rounded-lg transition-colors flex items-center justify-between group"
                >
                  {report.label}
                  <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Engine Execution */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Lancement du Jury</h3>
              <div className="flex gap-2">
                <select 
                  className="bg-muted text-sm border-none rounded-lg px-3 py-1.5 outline-none"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                >
                  <option value="1">Semestre 1</option>
                  <option value="2">Semestre 2</option>
                  <option value="3">Semestre 3</option>
                  <option value="4">Semestre 4</option>
                  <option value="5">Semestre 5</option>
                </select>
                <select 
                  className="bg-muted text-sm border-none rounded-lg px-3 py-1.5 outline-none"
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                >
                  <option value="normale">Session Normale</option>
                  <option value="rattrapage">Rattrapage</option>
                </select>
              </div>
            </div>

            <div className="bg-muted/30 border border-border/50 rounded-xl p-6 text-center">
              <Calculator className="w-12 h-12 text-primary/40 mx-auto mb-4" />
              <h4 className="font-medium text-foreground mb-2">Moteur Prêt</h4>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                Le moteur va calculer les moyennes (CC 50% + Examen 50%), appliquer les zéros éliminatoires pour absences, plafonner les notes de rattrapage Ã  10, et calculer les compensations semestrielles.
              </p>
              <button 
                onClick={runDeliberation}
                disabled={isDeliberating}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
              >
                {isDeliberating ? 'Calcul en cours...' : 'Générer les Résultats APOGEE'}
              </button>
            </div>

            {deliberationResults && (
              <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h4 className="font-semibold flex items-center gap-2 border-b border-border pb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Simulation Réussie
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">Règle de Rattrapage</p>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">Note CC:</span> <b>{deliberationResults.rule_2_module_resit.cc}</b></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Note Examen Rattrapage:</span> <b className="text-emerald-500">{deliberationResults.rule_2_module_resit.resit_exam}</b></div>
                      <div className="flex justify-between border-t border-border mt-2 pt-2"><span className="text-muted-foreground">Note Finale Module:</span> <b className="text-primary">{deliberationResults.rule_2_module_resit.result.grade} / 20</b></div>
                      <p className="text-xs text-amber-500 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Plafonné Ã  10 (MIN(10, MAX(CC, Rattrapage)))</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">Règle de Progression (1A â†’ 2A)</p>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">Modules Échoués:</span> <b className="text-red-500">{deliberationResults.rule_4_progression.failed_modules}</b></div>
                      <div className="flex justify-between border-t border-border mt-2 pt-2"><span className="text-muted-foreground">Décision Jury:</span> <b className="text-red-500">{deliberationResults.rule_4_progression.decision}</b></div>
                      <p className="text-xs text-muted-foreground mt-2">Maximum modules réservés autorisé: 2</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
