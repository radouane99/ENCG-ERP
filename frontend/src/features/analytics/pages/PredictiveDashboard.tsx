import React, { useState, useEffect } from 'react';
import { AlertTriangle, BrainCircuit, Activity, ChevronRight, UserX, AlertOctagon } from 'lucide-react';
import api from '@/shared/lib/api';

export default function PredictiveDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/at-risk-students');
        setData(res.data.data ?? res.data);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? err?.message ?? 'Erreur lors de la récupération des données prédictives');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Analyse prédictive en cours (IA)...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
          <strong>Erreur:</strong> {error}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-primary" />
          IA Prédictive & Risque d'Échec
        </h1>
        <p className="text-muted-foreground mt-1">
          Détection algorithmique des étudiants risquant l'abandon ou le redoublement, basée sur l'historique d'assiduité et les notes intermédiaires.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-medium text-muted-foreground">Population Analysée</h3>
          </div>
          <div className="text-3xl font-bold text-foreground">{data.total_analyzed}</div>
          <p className="text-sm text-muted-foreground mt-1">Étudiants actifs ce semestre</p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-medium text-amber-700">Total Ã  Risque (Score &gt; 60)</h3>
          </div>
          <div className="text-3xl font-bold text-amber-700">{data.total_at_risk}</div>
          <p className="text-sm text-amber-600/80 mt-1">{((data.total_at_risk / data.total_analyzed) * 100).toFixed(1)}% des étudiants</p>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertOctagon className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-medium text-red-700">Cas Critiques (Score &gt; 80)</h3>
          </div>
          <div className="text-3xl font-bold text-red-700">{data.critical_count}</div>
          <p className="text-sm text-red-600/80 mt-1">Intervention pédagogique urgente requise</p>
        </div>
      </div>

      {/* List of At Risk Students */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-muted/20">
          <h2 className="font-semibold text-lg">Étudiants Nécessitant une Attention Pédagogique</h2>
        </div>
        
        <div className="divide-y divide-border">
          {data.students.map((student: any) => (
            <div key={student.student_id} className="p-6 hover:bg-muted/10 transition-colors flex flex-col md:flex-row gap-6 md:items-center justify-between">
              
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${student.category === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                  <UserX className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">{student.first_name} {student.last_name}</h3>
                  <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                    <span>Matricule: {student.student_number}</span>
                    <span>â€¢</span>
                    <span>Absences: {student.absences}</span>
                    <span>â€¢</span>
                    <span>Moyenne CC: {student.cc_average}/20</span>
                  </div>
                  
                  <div className="mt-3 space-y-1">
                    {student.risk_factors.map((factor: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-muted-foreground">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Risk Score</span>
                  <div className={`text-2xl font-black ${student.category === 'CRITICAL' ? 'text-red-600' : 'text-amber-500'}`}>
                    {student.risk_score}
                  </div>
                </div>
                
                <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1 mt-2">
                  Planifier un entretien
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
