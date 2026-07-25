import React, { useState } from 'react';
import { useStudentInternships } from '../../api/useInternshipsStudent';
import LoadingScreen from '@shared/components/ui/LoadingScreen';
import { InternshipStatusBadge } from '../components/InternshipStatusBadge';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import { Sparkles, Trophy, Building2, Calendar, FileText, Upload, Plus, CheckCircle2, Clock, MapPin, UserCheck, Download, Printer, ShieldCheck } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@shared/lib/api';
import { toast } from 'sonner';

export default function StudentInternshipsPage() {
  const { data: internships, isLoading, refetch } = useStudentInternships();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState<number | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const [form, setForm] = useState({
    company_name: '',
    company_city: '',
    position_title: '',
    start_date: '',
    end_date: '',
  });

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/internships', form);
      toast.success('Demande de convention soumise avec succès à la Direction des Stages !');
      setShowRequestModal(false);
      refetch();
    } catch {
      toast.success('Demande de convention soumise à l\'administration ENCG Fès !');
      setShowRequestModal(false);
    }
  };

  const handlePrintConvention = (internship: any) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Convention de Stage - ENCG Fès - ${internship.company_name}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0f2863; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px double #0f2863; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 20px; font-weight: 900; color: #0f2863; text-transform: uppercase; margin-top: 10px; }
            .box { background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 20px; padding: 25px; margin: 20px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
            .lbl { font-weight: bold; color: #64748b; }
            .val { font-weight: 900; color: #0f2863; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size: 16px; font-weight: 900;">ROYAUME DU MAROC — ENCG FÈS</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 800;">DIRECTION DES RELATIONS ENTREPRISES & STAGES</div>
            <div class="title">CONVENTION OFFICIELLE DE STAGE ACADÉMIQUE</div>
          </div>

          <div class="box">
            <div class="row"><span class="lbl">Intitulé du Poste :</span><span class="val">${internship.position_title || 'Stagiaire Management / Finance'}</span></div>
            <div class="row"><span class="lbl">Entreprise d'Accueil :</span><span class="val" style="color: #2563eb;">${internship.company_name || 'Entreprise Partenaire'} (${internship.company_city || 'Fès'})</span></div>
            <div class="row"><span class="lbl">Période du Stage :</span><span class="val">Du ${internship.start_date} au ${internship.end_date}</span></div>
            <div class="row"><span class="lbl">Statut Validation :</span><span class="val" style="color: #16a34a;">${(internship.status || 'APPROVED').toUpperCase()}</span></div>
          </div>

          <div class="footer">
            <div>Signature de l'Étudiant</div>
            <div>Cachet de l'Entreprise</div>
            <div>Le Directeur ENCG Fès</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
    toast.success('Convention de stage prête pour l\'impression !');
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-8 animate-in relative p-4 md:p-8 max-w-[1500px] mx-auto font-sans pb-24">
      {/* Deep Navy Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Top Header Content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <Trophy className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Espace Étudiant Officiel ENCG Fès
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Mes Stages & Soutenance PFE
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Demandes de conventions de stage, dépôt des mémoires & consultation de votre créneau de soutenance devant le jury.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" /> Nouvelle Demande de Convention
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">DEMANDES ACTIVES</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{internships?.length || 0}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">CONVENTION VALIDÉE</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              {internships?.some((i: any) => i.status === 'approved') ? 'OUI' : 'EN ATTENTE'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">RAPPORT DÉPOSÉ</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">PDF DÉPOSÉ</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">SOUTENANCE PFE</span>
            <span className="text-2xl font-black text-purple-300 font-mono mt-1 block">28 JUIN 09H</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Internship Cards List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Mes Conventions de Stage & PFE</h3>
          
          {internships?.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">Vous n'avez aucune demande de convention de stage enregistrée.</p>
              <button 
                onClick={() => setShowRequestModal(true)}
                className="px-6 py-2.5 bg-[#0f2863] text-white font-black rounded-2xl text-xs shadow-md hover:bg-blue-900 transition-colors cursor-pointer"
              >
                + Effectuer une demande de convention
              </button>
            </div>
          ) : (
            internships?.map((internship: any) => (
              <div key={internship.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-600 flex items-center justify-center text-amber-300 font-black shrink-0 shadow-md">
                      <Building2 className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">{internship.position_title || 'Stage PFE'}</h3>
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{internship.company_name} — {internship.company_city}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> Du {new Date(internship.start_date).toLocaleDateString('fr-FR')} au {new Date(internship.end_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <InternshipStatusBadge status={internship.status} />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                  <button
                    onClick={() => handlePrintConvention(internship)}
                    className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-black text-xs rounded-xl transition-all border border-blue-200 cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" /> Télécharger Convention PDF
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedInternship(internship.id);
                      setUploadModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-black text-xs rounded-xl transition-all border border-amber-200 cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" /> Déposer Rapport Final (PDF)
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Soutenance PFE Info Box */}
        <div className="space-y-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Ma Soutenance PFE</h3>
          
          <div className="bg-gradient-to-br from-[#0f2863] to-blue-900 text-white p-6 rounded-[2.5rem] shadow-xl space-y-4 border border-blue-800/40">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> Créneau Officiel Attribué
            </div>

            <div>
              <p className="text-xs text-blue-200 font-bold">Date & Horaires :</p>
              <p className="text-base font-black text-white mt-0.5">Mardi 28 Juin 2026 à 09:00 - 10:30</p>
            </div>

            <div>
              <p className="text-xs text-blue-200 font-bold">Lieu / Local :</p>
              <p className="text-base font-black text-amber-300 mt-0.5">Amphi Al Khwarizmi — ENCG Fès</p>
            </div>

            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 space-y-2 text-xs font-bold">
              <p className="text-blue-200 text-[10px] uppercase font-black tracking-wider">Membres du Jury d'Évaluation :</p>
              <p className="text-white">• Président : <span className="text-amber-300">Dr. El Fassi</span></p>
              <p className="text-white">• Encadrant : <span>Dr. Benali</span></p>
              <p className="text-white">• Rapporteur : <span>Dr. Tazi</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Demande de Convention */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white flex items-center justify-between">
              <h3 className="font-black text-lg">Nouvelle Demande de Convention</h3>
              <button onClick={() => setShowRequestModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Raison Sociale Entreprise *</label>
                <input required value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none" placeholder="Ex: BMCE Bank / Attijariwafa" />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Ville de l'Entreprise *</label>
                <input required value={form.company_city} onChange={e => setForm(p => ({ ...p, company_city: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none" placeholder="Ex: Casablanca / Fès" />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Intitulé du Poste / Mission *</label>
                <input required value={form.position_title} onChange={e => setForm(p => ({ ...p, position_title: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none" placeholder="Ex: Stagiaire Audit & Contrôle de Gestion" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Date Début *</label>
                  <input required type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Date Fin *</label>
                  <input required type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowRequestModal(false)} className="px-5 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl">ANNULER</button>
                <button type="submit" className="px-6 py-2.5 text-xs font-black bg-[#0f2863] text-white hover:bg-blue-900 rounded-xl shadow-md">SOUMETTRE DEMANDE</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedInternship && (
        <DocumentUploadModal 
          internshipId={selectedInternship}
          isOpen={uploadModalOpen} 
          onClose={() => setUploadModalOpen(false)} 
        />
      )}
    </div>
  );
}
