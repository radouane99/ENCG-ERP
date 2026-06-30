import React, { useState } from 'react';
import { UserPlus, Scale, Search, AlertTriangle, CheckCircle2, Clock, XCircle, ChevronRight } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function EnrollmentManager() {
  const [selectedFiliere, setSelectedFiliere] = useState('');

  const kpis = [
    { label: 'En Attente', value: '0', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: Clock },
    { label: 'Inscrits Validés', value: '251', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2 },
    { label: 'Rejetés / Suspendus', value: '0', color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 p-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <UserPlus className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Inscriptions & Réinscriptions</h1>
          <p className="text-sm text-muted-foreground">Validation des Candidatures & Dispatching des Groupes</p>
        </div>
      </div>

      {/* Grid: Dispatching Console + KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Dispatching Console */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between col-span-1 md:col-span-1">
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> Console de Dispatching
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                Dispatching Équilibré <Scale className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Répartit équitablement les nouveaux étudiants approuvés dans les groupes du Semestre 1.
              </p>
            </div>
          </div>
          <div className="relative z-10 mt-4 space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Sélectionner la filière</label>
              <select
                className="w-full bg-background border border-border text-foreground rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={selectedFiliere}
                onChange={e => setSelectedFiliere(e.target.value)}
              >
                <option value="">Choisir une filière</option>
                <option value="gi">Génie Informatique</option>
                <option value="gc">Génie Civil</option>
                <option value="ge">Génie Électrique</option>
                <option value="eg">Économie & Gestion</option>
                <option value="mc">Marketing & Commerce</option>
              </select>
            </div>
            <button className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2">
              <Scale className="w-4 h-4" /> Affecter les groupes
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center gap-2">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center mb-1', kpi.bg)}>
              <kpi.icon className={cn('w-5 h-5', kpi.color)} />
            </div>
            <div className={cn('text-4xl font-black', kpi.color)}>{kpi.value}</div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px]">
          <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Filière</label>
          <select className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>Toutes les filières</option>
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Statut</label>
          <select className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>En Attente</option>
            <option>Validé</option>
            <option>Rejeté</option>
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Type</label>
          <select className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>Tous</option>
            <option>Nouvelle Inscription</option>
            <option>Réinscription</option>
          </select>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-primary/90 transition-colors">
          <Search className="w-4 h-4" /> Filtrer
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground">Registre des Inscriptions</h2>
          <span className="text-xs font-medium text-muted-foreground">0 dossier(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground font-bold uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4">Étudiant / Candidat</th>
                <th className="px-6 py-4">Filière Demandée</th>
                <th className="px-6 py-4 text-center">Type / Inscription</th>
                <th className="px-6 py-4 text-center">Cursus Bac</th>
                <th className="px-6 py-4">Parents / CIN</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-medium">Aucune candidature en attente de validation.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
