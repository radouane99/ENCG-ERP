import React, { useState } from 'react';
import { useAdminInternships, useValidateInternship } from '../../api/useInternshipsAdmin';
import LoadingScreen from '@shared/components/ui/LoadingScreen';
import { InternshipStatusBadge } from '../components/InternshipStatusBadge';
import { Button } from '@shared/components/ui/Button';
import { Sparkles, Trophy, Building2, User, Check, X, FileText, Download, Search, CheckCircle2, Hourglass, ShieldCheck } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';

export default function AdminInternshipsPage() {
  const { data: internships, isLoading } = useAdminInternships();
  const { mutate: validate } = useValidateInternship();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
            <div class="title">CONVENTION OFFICIELLE DE STAGE DE FIN D'ÉTUDES (PFE)</div>
          </div>

          <div class="box">
            <div class="row"><span class="lbl">Étudiant Stagiaire :</span><span class="val">ID Stagiaire #${internship.student_id}</span></div>
            <div class="row"><span class="lbl">Entreprise d'Accueil :</span><span class="val" style="color: #2563eb;">${internship.company_name || 'Entreprise Partenaire'}</span></div>
            <div class="row"><span class="lbl">Statut Validation :</span><span class="val" style="color: #16a34a;">${(internship.status || 'APPROVED').toUpperCase()}</span></div>
            <div class="row"><span class="lbl">Établissement :</span><span class="val">ENCG Fès - Route d'Imouzzer</span></div>
          </div>

          <p style="font-size: 12px; color: #475569; leading-height: 1.6;">
            Cette convention régit les modalités du stage académique conformément à la réglementation en vigueur à l'Université Sidi Mohamed Ben Abdellah.
          </p>

          <div class="footer">
            <div>Signature de l'Étudiant</div>
            <div>Cachet Entreprise</div>
            <div>Le Directeur ENCG Fès</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
    toast.success('Convention de stage générée avec succès !');
  };

  const handleWhatsAppNotify = (internship: any) => {
    const message = encodeURIComponent(`BONNE NOUVELLE — ENCG Fès:\nBonjour,\nVotre convention de stage auprès de "${internship.company_name}" a été officiellement VALIDÉE par la Direction des Stages !\n\nVous pouvez désormais télécharger votre document signé depuis votre portail étudiant.`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
    toast.success('Notification WhatsApp préparée pour l\'étudiant !');
  };

  if (isLoading) return <LoadingScreen />;

  const filtered = (internships || []).filter((i: any) => {
    const matchesSearch = (i.company_name || '').toLowerCase().includes(search.toLowerCase()) || String(i.student_id).includes(search);
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                <Sparkles className="w-4 h-4 text-amber-400" /> Direction des Stages, PFE & Partenariats Entreprises ENCG Fès
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Gestion des Stages & PFE
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Suivi et validation des conventions de stage de fin d'études, partenariats entreprises et dépôts de mémoires.
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">TOTAL STAGIAIRES</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{internships?.length || 0}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">CONVENTIONS VALIDÉES</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              {internships?.filter((i: any) => i.status === 'approved').length || 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">EN ATTENTE</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
              {internships?.filter((i: any) => i.status === 'pending').length || 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">PARTENAIRES ACTIFS</span>
            <span className="text-2xl font-black text-purple-300 font-mono mt-1 block">
              {new Set(internships?.map((i: any) => i.company_name)).size} Entreprises
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par entreprise ou étudiant..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {['all', 'approved', 'pending', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  statusFilter === st ? "bg-[#0f2863] text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                )}
              >
                {st === 'all' ? 'Toutes' : st === 'approved' ? 'Validées' : st === 'pending' ? 'En Attente' : 'Rejetées'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px] border border-slate-100 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">ÉTUDIANT STAGIAIRE</th>
                <th className="px-6 py-4">ENTREPRISE D'ACCUEIL</th>
                <th className="px-6 py-4 text-center">STATUT CONVENTION</th>
                <th className="px-6 py-4 text-end">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-slate-400 font-bold text-xs">
                    Aucun stage trouvé.
                  </td>
                </tr>
              ) : filtered.map((internship: any) => (
                <tr key={internship.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md">
                        <User className="w-4 h-4 text-amber-300" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white text-xs">Étudiant #{internship.student_id}</p>
                        <p className="text-[10px] font-bold text-slate-400">Master / Diplôme ENCG</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    {internship.company_name || 'Entreprise Non Spécifiée'}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <InternshipStatusBadge status={internship.status} />
                  </td>

                  <td className="px-6 py-4 text-end">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handlePrintConvention(internship)}
                        className="px-3 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-black text-xs rounded-xl transition-all border border-blue-200 cursor-pointer shadow-xs flex items-center gap-1"
                        title="Imprimer Convention PDF"
                      >
                        <FileText className="w-3.5 h-3.5" /> Convention
                      </button>

                      {internship.status === 'approved' && (
                        <button
                          onClick={() => handleWhatsAppNotify(internship)}
                          className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 font-black text-xs rounded-xl transition-all border border-emerald-200 cursor-pointer shadow-xs flex items-center gap-1"
                          title="Alerter par WhatsApp"
                        >
                          📱 WhatsApp
                        </button>
                      )}

                      {internship.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl"
                            onClick={() => validate({ id: internship.id, status: 'approved' })}
                          >
                            <Check className="w-4 h-4 mr-1" /> Approuver
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="font-black text-xs rounded-xl"
                            onClick={() => validate({ id: internship.id, status: 'rejected' })}
                          >
                            <X className="w-4 h-4 mr-1" /> Rejeter
                          </Button>
                        </>
                      )}
                    </div>
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
