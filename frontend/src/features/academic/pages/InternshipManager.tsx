import React from 'react';
import { Building2, FileSignature, FolderOpen, CheckCircle2 } from 'lucide-react';

export default function InternshipManager() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 p-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion Administrative des Stages</h1>
          <p className="text-sm text-muted-foreground">Conventions, suivi et évaluation des PFE & stages.</p>
        </div>
      </div>

      {/* Hero / Pilotage Console */}
      <div className="relative rounded-2xl overflow-hidden bg-card border border-border shadow-sm p-8">
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '20px 20px' }}
        />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 border border-primary/20">
              Console de Pilotage
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Building2 className="w-7 h-7 text-primary/70" /> Conventions & Stages ENCG
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Validez les conventions de stage déposées par les étudiants et affectez-leur un enseignant-tuteur pour le suivi mensuel.
            </p>
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="bg-muted border border-border rounded-2xl p-5 text-center min-w-[110px]">
              <div className="text-3xl font-black text-foreground mb-1">0</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">En Attente</div>
            </div>
            <div className="bg-muted border border-border rounded-2xl p-5 text-center min-w-[110px]">
              <div className="text-3xl font-black text-foreground mb-1">0</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actifs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Validation Section */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-3 bg-muted/30">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <FileSignature className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Demandes de stage en attente de validation</h3>
            <p className="text-xs text-muted-foreground">Validez les conventions et affectez un enseignant encadrant.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] text-muted-foreground font-bold uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4">Étudiant</th>
                <th className="px-6 py-4">Groupe</th>
                <th className="px-6 py-4">Entreprise / Sujet</th>
                <th className="px-6 py-4">Dates Prévues</th>
                <th className="px-6 py-4">Affecter un Tuteur</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground italic">
                  Aucune demande de convention de stage en attente.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* General Registry Section */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-3 bg-muted/30">
          <FolderOpen className="w-5 h-5 text-amber-400" fill="currentColor" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Registre Général des Stages</h3>
            <p className="text-xs text-muted-foreground">Suivi de tous les stages validés, actifs et clôturés.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] text-muted-foreground font-bold uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4">Étudiant</th>
                <th className="px-6 py-4">Entreprise</th>
                <th className="px-6 py-4">Tuteur Académique</th>
                <th className="px-6 py-4 text-center">Rapports</th>
                <th className="px-6 py-4 text-center">Score Final</th>
                <th className="px-6 py-4 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-muted/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm shrink-0">
                      A
                    </div>
                    <div>
                      <div className="font-bold text-foreground">Aniss el alaoui</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Génie Informatique – Groupe 1</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-foreground">ENCG</td>
                <td className="px-6 py-4 font-medium text-foreground">Radouane el asri</td>
                <td className="px-6 py-4 text-center font-bold text-foreground">1</td>
                <td className="px-6 py-4 text-center font-black text-primary">19.50 / 20</td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" /> Terminé
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
