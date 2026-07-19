import React from 'react';
import { Landmark, TrendingUp, TrendingDown, DollarSign, Send, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function AdminFinanceDashboard() {
  const payments = [
    { name: 'Othmane B.', amount: '25,000 MAD', status: 'PAID', date: '12/06/2026', type: 'Frais de scolarité' },
    { name: 'Aya R.', amount: '12,500 MAD', status: 'LATE', date: 'Retard: 15 jours', type: 'Frais de scolarité (S2)' },
    { name: 'Club Marketing', amount: '5,000 MAD', status: 'PENDING', date: 'En attente validation', type: 'Budget Événement' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-[#001A4B] rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-blue-900">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-emerald-500/30">
              <Landmark className="w-3.5 h-3.5" /> DAF ENCG
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Direction Financière</h1>
            <p className="text-blue-200 text-lg max-w-2xl">
              Suivi des recouvrements, gestion budgétaire et bourses de mérite.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-4">
            <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors shadow-lg flex items-center gap-2">
              <FileText className="w-5 h-5" /> Exporter Bilan
            </button>
            <button className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg flex items-center gap-2">
              <Send className="w-5 h-5" /> Relances Auto.
            </button>
          </div>
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card rounded-2xl p-6 shadow-sm border relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign className="w-16 h-16 text-emerald-500" /></div>
            <div className="text-sm font-bold text-muted-foreground mb-2">Recettes (Mois)</div>
            <div className="text-3xl font-black text-foreground mb-2">1.2M <span className="text-lg text-muted-foreground">MAD</span></div>
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
              <TrendingUp className="w-4 h-4" /> +15% vs N-1
            </div>
          </div>
          <div className="bg-card rounded-2xl p-6 shadow-sm border relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><AlertCircle className="w-16 h-16 text-rose-500" /></div>
            <div className="text-sm font-bold text-muted-foreground mb-2">Impayés & Retards</div>
            <div className="text-3xl font-black text-foreground mb-2">245k <span className="text-lg text-muted-foreground">MAD</span></div>
            <div className="flex items-center gap-1 text-rose-600 text-xs font-bold">
              <TrendingUp className="w-4 h-4" /> 42 étudiants
            </div>
          </div>
          <div className="bg-card rounded-2xl p-6 shadow-sm border relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingDown className="w-16 h-16 text-blue-500" /></div>
            <div className="text-sm font-bold text-muted-foreground mb-2">Budget Clubs (Dépensé)</div>
            <div className="text-3xl font-black text-foreground mb-2">45k <span className="text-lg text-muted-foreground">MAD</span></div>
            <div className="flex items-center gap-1 text-blue-600 text-xs font-bold">
              Sur enveloppe de 100k
            </div>
          </div>
          <div className="bg-card rounded-2xl p-6 shadow-sm border relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle2 className="w-16 h-16 text-amber-500" /></div>
            <div className="text-sm font-bold text-muted-foreground mb-2">Bourses Distribuées</div>
            <div className="text-3xl font-black text-foreground mb-2">120k <span className="text-lg text-muted-foreground">MAD</span></div>
            <div className="flex items-center gap-1 text-amber-600 text-xs font-bold">
              12 étudiants bénéficiaires
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[2rem] p-8 shadow-sm border">
          <h2 className="text-xl font-black text-foreground mb-6">Transactions Récentes & Suivi</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Bénéficiaire / Émetteur</th>
                  <th className="p-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Type</th>
                  <th className="p-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Montant</th>
                  <th className="p-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Date / Détail</th>
                  <th className="p-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Statut</th>
                  <th className="p-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-bold text-foreground">{p.name}</td>
                    <td className="p-4 text-sm text-muted-foreground font-medium">{p.type}</td>
                    <td className="p-4 font-black text-[#003a8c]">{p.amount}</td>
                    <td className="p-4 text-sm text-muted-foreground">{p.date}</td>
                    <td className="p-4">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border",
                        p.status === 'PAID' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        p.status === 'LATE' ? "bg-rose-50 text-rose-600 border-rose-200" :
                        "bg-amber-50 text-amber-600 border-amber-200"
                      )}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 flex items-center gap-2">
                      {p.status === 'LATE' && (
                        <button 
                          onClick={() => alert(`Relance de paiement envoyée avec succès à ${p.name}`)}
                          className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold" title="Relancer">
                          <Send className="w-4 h-4" /> Relancer
                        </button>
                      )}
                      {p.status === 'PENDING' && (
                        <button 
                          onClick={() => alert(`Paiement de ${p.name} validé avec succès.`)}
                          className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold" title="Valider">
                          <CheckCircle2 className="w-4 h-4" /> Valider
                        </button>
                      )}
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
