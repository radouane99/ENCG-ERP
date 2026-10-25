import { useParams } from 'react-router-dom';
import { ShieldCheck, User, ShieldAlert, Plus, BookOpen } from 'lucide-react';

export default function ManageStudentCreditPage() {
  useParams();

  return (
    <div className="space-y-8 animate-in max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center text-[#0f2863] shrink-0 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[#0f2863] italic erp-page-title">Dossier Crédits & Dérogation Exceptionnelle</h1>
            <p className="text-muted-foreground mt-1 text-[10px] font-bold uppercase tracking-wider">Fiche d'aménagement et réinscription spéciale de ANISS EL ALAOUI</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Student Info & Derogation */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* FICHE ÉTUDIANT */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <User className="w-4 h-4" /> Fiche Étudiant
            </h3>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl shrink-0">
                A
              </div>
              <div>
                <div className="font-bold text-foreground text-lg">ANISS EL ALAOUI</div>
                <div className="text-sm text-muted-foreground">aniss.massawi42@gmail.com</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matricule</span>
                <span className="font-bold text-foreground">S20260001</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Code CIN</span>
                <span className="font-bold text-foreground">-</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filière</span>
                <span className="font-bold text-foreground text-right">Génie Informatique</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Groupe/Niveau</span>
                <span className="font-bold text-foreground text-right">Génie Informatique - Groupe 1 (L1)</span>
              </div>
            </div>
          </div>

          {/* CAS SPÉCIAUX / DÉROGATION */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Cas Spéciaux / Dérogation
            </h3>

            <div className="space-y-6">
              <label className="flex items-start gap-4 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="pt-1">
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-ring" />
                </div>
                <div>
                  <div className="font-bold text-foreground mb-1">Accorder une Dérogation</div>
                  <div className="text-xs text-muted-foreground font-medium leading-relaxed">Autoriser la réinscription exceptionnelle d'un étudiant exclu pour double ajournement.</div>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="pt-1">
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500" />
                </div>
                <div>
                  <div className="font-bold text-foreground mb-1">Statut "Dernière Chance"</div>
                  <div className="text-xs text-muted-foreground font-medium leading-relaxed">Marquer comme étudiant bénéficiant d'une dernière chance absolue de validation.</div>
                </div>
              </label>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Note / Justification Administrative</label>
                <textarea 
                  rows={4}
                  placeholder="Décision du conseil, raisons médicales, accord exceptionnel du doyen..."
                  className="w-full border border-border bg-slate-50/50 px-5 py-4 text-sm font-bold text-foreground focus:border-primary focus:ring-1 focus:ring-ring transition-all outline-none resize-none rounded-[var(--control-radius)]"
                ></textarea>
              </div>

              <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-xs uppercase tracking-wide shadow-md">
                Enregistrer le Statut Dérogatoire
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Credits */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* AFFECTER UN MODULE EN CRÉDIT */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Affecter un Module en Crédit
            </h3>

            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sélectionner le Module (Filière Génie Informatique)</label>
              <div className="flex flex-col md:flex-row gap-4">
                <select className="flex-1 border border-border bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-foreground focus:border-primary focus:ring-1 focus:ring-ring transition-all outline-none rounded-[var(--control-radius)]">
                  <option>-- Choisir le module --</option>
                </select>
                <button className="px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary transition-colors text-xs uppercase tracking-wide shadow-sm whitespace-nowrap">
                  Créer le Crédit
                </button>
              </div>
            </div>
          </div>

          {/* MODULES ACTUELLEMENT EN CRÉDIT */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Modules Actuellement en Crédit
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-4 py-4">Module</th>
                    <th className="px-4 py-4">Année d'Affectation</th>
                    <th className="px-4 py-4">Statut</th>
                    <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground italic font-bold">
                      Cet étudiant n'a aucun module en crédit en cours.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  )
}
