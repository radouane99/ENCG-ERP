import React from 'react';
import { BrainCircuit, TrendingUp, AlertTriangle, Users, Activity, Target, Zap, ChevronDown, BellRing } from 'lucide-react';
import { cn } from '@shared/lib/utils';

import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';

export default function AdminPredictiveAnalytics() {
  const { data: analyticsData } = useQuery({
    queryKey: ['admin-predictive-analytics'],
    queryFn: () => api.get('/admin/predictive-analytics').then(res => res.data.data)
  });

  const dropoutRisks = analyticsData?.dropoutRisks || [];
  const predictions = analyticsData?.predictions || [
    { label: 'Prévision Inscriptions', value: '+0%', subtext: 'En attente des données', color: 'bg-emerald-400/10 border-emerald-400/20' },
    { label: 'Taux de Réussite', value: '0%', subtext: 'En attente des données', color: 'bg-blue-400/10 border-blue-400/20' },
    { label: 'Charge Professeurs', value: '0%', subtext: 'En attente des données', color: 'bg-amber-400/10 border-amber-400/20' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Premium Header */}
      <div className="bg-card rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-border">
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-emerald-500/20">
              <BrainCircuit className="w-3.5 h-3.5" /> Moteur IA Actif
            </div>
            <h1 className="text-4xl font-black text-foreground mb-2">Centre de Contrôle IA & Prédictions</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Anticipez l'avenir de l'ENCG grâce à l'analyse prédictive. Détectez les risques de décrochage et optimisez la gestion des flux.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-3 bg-muted border border-border p-4 rounded-2xl backdrop-blur-md">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400" />
            </div>
            <div>
              <div className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Précision Modèle</div>
              <div className="text-emerald-400 font-black text-2xl">94.8%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI Predictions */}
        {predictions.map((pred, idx) => (
          <div key={idx} className={cn("rounded-2xl p-6 shadow-sm border relative overflow-hidden transition-all hover:scale-[1.02] cursor-pointer bg-card", pred.color)}>
            <div className="flex justify-between items-start mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", pred.color.replace('border-', 'border border-').replace('/10', '/20'))}>
                {pred.icon || <Activity className="w-5 h-5" />}
              </div>
            </div>
            <div className="text-3xl font-black text-foreground mb-1">{pred.value}</div>
            <div className="font-bold text-foreground text-sm">{pred.label}</div>
            <div className="text-xs font-medium text-muted-foreground mt-1">{pred.subtext}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Dropout Risk Alert */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Alertes Décrochage IA</h2>
                <p className="text-xs font-medium text-muted-foreground">Étudiants nécessitant une intervention</p>
              </div>
            </div>
            <button className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors">
              Générer Rapport
            </button>
          </div>

          <div className="space-y-3">
            {dropoutRisks.map((student, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0 border border-primary/20">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{student.name}</h4>
                      <p className="text-xs font-medium text-muted-foreground">{student.id}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 border",
                    student.risk > 80 ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  )}>
                    Risque: {student.risk}%
                  </div>
                </div>
                
                <div className="bg-background p-3 rounded-lg text-xs border border-border">
                  <span className="font-bold text-primary">Diagnostic IA :</span> <span className="text-muted-foreground">{student.reason}</span>
                </div>
                
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 bg-primary text-white py-2 rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm">
                    Contacter Étudiant
                  </button>
                  <button className="flex-1 bg-muted border border-border text-foreground py-2 rounded-lg text-xs font-bold hover:bg-muted/80 transition-colors flex items-center justify-center gap-1.5">
                    <BellRing className="w-3.5 h-3.5" /> Alerter Tuteur
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Semantic Analysis */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Analyse Sémantique</h2>
                <p className="text-xs font-medium text-muted-foreground">Sentiments des évaluations (NLP)</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center py-6">
            {/* Donut Chart */}
            <div className="w-40 h-40 rounded-full border-[12px] border-emerald-500/20 relative flex items-center justify-center mb-8" style={{ borderRightColor: '#f43f5e33', borderBottomColor: '#facc1533', transform: 'rotate(-45deg)' }}>
              <div className="w-[116px] h-[116px] rounded-full border-[12px] border-emerald-500 absolute" style={{ borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }} />
              <div className="text-center" style={{ transform: 'rotate(45deg)' }}>
                <div className="text-3xl font-black text-foreground">72%</div>
                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">POSITIF</div>
              </div>
            </div>

            <div className="w-full space-y-3 px-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-bold text-foreground"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Qualité de l'enseignement</div>
                <span className="font-bold text-muted-foreground">85%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-bold text-foreground"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Vie associative</div>
                <span className="font-bold text-muted-foreground">68%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-bold text-foreground"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Charge de travail</div>
                <span className="font-bold text-muted-foreground">45%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-bold text-foreground"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Restauration</div>
                <span className="font-bold text-muted-foreground">30%</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
