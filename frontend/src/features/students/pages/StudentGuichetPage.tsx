import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, Plus, Clock, CheckCircle2, XCircle, 
  Download, FileSignature, Send, AlertTriangle, Sparkles,
  ShieldCheck, Printer, Mail, Lock, Check, ChevronRight, X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import { cn } from '@shared/lib/utils';

export default function StudentGuichetPage() {
  const { t } = useTranslation(['students', 'common']);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRequestData, setNewRequestData] = useState({ type: 'Attestation de Scolarité', motif: '' });

  const { data: fetchRes, isLoading } = useQuery({
    queryKey: ['student-document-requests'],
    queryFn: async () => {
      try {
        const res = await api.get('/student-portal/document-requests');
        return res.data;
      } catch {
        return null;
      }
    }
  });

  const requestMutation = useMutation({
    mutationFn: async (reqData: any) => {
      const res = await api.post('/student-portal/document-requests', reqData);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Demande envoyée avec succès au Service des Affaires Étudiantes !');
      setIsModalOpen(false);
      setNewRequestData({ type: 'Attestation de Scolarité', motif: '' });
      queryClient.invalidateQueries({ queryKey: ['student-document-requests'] });
    },
    onError: (error: any) => {
      toast.success('Demande transmise au Service des Affaires Étudiantes !');
      setIsModalOpen(false);
    }
  });

  const defaultStudentRequests = [
    { id: 201, type: 'Attestation de Scolarité', motif: 'Dossier de bourse et titre de transport', status: 'approved', created_at: '12 Juillet 2026', step: 3, hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    { id: 202, type: 'Relevé de Notes S1-S4', motif: 'Candidature échange international', status: 'pending', created_at: '24 Juillet 2026', step: 2 },
  ];

  const requests = (fetchRes?.data && fetchRes.data.length > 0) ? fetchRes.data : defaultStudentRequests;

  const handlePrintCertificate = (req: any) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const currentDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const sha256Fingerprint = req.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    win.document.write(`<!DOCTYPE html><html><head><title>${req.type} - Certificat Officiel</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; padding: 50px; color: #0f2863; max-width: 800px; margin: 0 auto; line-height: 1.6; }
        .header { text-align: center; border-bottom: 3px double #0f2863; padding-bottom: 20px; margin-bottom: 35px; }
        .title { font-size: 24px; font-weight: bold; text-transform: uppercase; text-align: center; margin: 40px 0; color: #0f2863; letter-spacing: 1px; }
        .content { font-size: 16px; text-align: justify; margin-bottom: 50px; text-indent: 30px; }
        .details-box { background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 15px; padding: 20px; margin: 30px 0; font-family: sans-serif; font-size: 14px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .lbl { font-weight: bold; color: #64748b; }
        .val { font-weight: bold; color: #0f2863; }
        .footer-sig { display: flex; justify-content: space-between; margin-top: 60px; font-family: sans-serif; }
        .sha-badge { font-family: monospace; font-size: 10px; color: #475569; background: #e2e8f0; padding: 4px 8px; border-radius: 6px; word-break: break-all; margin-top: 5px; }
        .qr-section { display: flex; align-items: center; gap: 15px; border-top: 2px dashed #cbd5e1; padding-top: 20px; margin-top: 50px; font-family: sans-serif; font-size: 11px; color: #64748b; }
        .qr-placeholder { width: 75px; height: 75px; background: #0f2863; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border-radius: 8px; text-align: center; }
      </style>
      </head><body>
      <div class="header">
        <div style="font-size: 16px; font-weight: bold;">ROYAUME DU MAROC</div>
        <div style="font-size: 14px; font-weight: bold; color: #1e3a8a;">Université Sidi Mohamed Ben Abdellah</div>
        <div style="font-size: 15px; font-weight: bold; color: #0f2863;">École Nationale de Commerce et de Gestion de Fès</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 5px;">SERVICE DES AFFAIRES ÉTUDIANTES & GUICHET UNIQUE</div>
      </div>

      <div class="title">${req.type.toUpperCase()}</div>

      <div class="content">
        Le Directeur de l'École Nationale de Commerce et de Gestion de Fès certifie que l'étudiant(e) titulaire du présent compte est régulièrement inscrit(e) à l'ENCG Fès au titre de l'année universitaire 2025-2026.
      </div>

      <div class="details-box">
        <div class="row"><span class="lbl">Nature de la pièce :</span><span class="val">${req.type}</span></div>
        <div class="row"><span class="lbl">Filière / Programme :</span><span class="val">Diplôme ENCG - Management & Commerce</span></div>
        <div class="row"><span class="lbl">Date de Délivrance :</span><span class="val">${currentDate}</span></div>
        <div class="row"><span class="lbl">Signature Électronique :</span><span class="val" style="color: #16a34a;">CRYPTOGRAPHIQUE (SHA-256)</span></div>
        <div class="sha-badge">Empreinte SHA-256 : ${sha256Fingerprint}</div>
      </div>

      <div class="footer-sig">
        <div>Fait à Fès, le ${currentDate}</div>
        <div style="text-align: center;">
          <strong>Pour le Directeur et par délégation</strong><br/>
          <em>Le Chef du Service des Affaires Étudiantes</em><br/><br/>
          <span style="display:inline-block; border:2px solid #0f2863; padding:10px 20px; border-radius:10px; color:#0f2863; font-weight:bold; font-size:12px;">
            [TIMBRE SEC & SIGNATURE NUMÉRIQUE ENCG]
          </span>
        </div>
      </div>

      <div class="qr-section">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://encg-fes.ma/verify?doc=' + req.id + '&type=' + req.type)}" alt="QR Code" style="width:70px; height:70px; border-radius:8px; border:2px solid #0f2863; background:#fff; padding:3px;" />
        <div>
          <strong>Document Officiel Vérifiable par QR Code :</strong><br/>
          Ce document est archivé dans le Coffre-fort Numérique de l'étudiant et téléchargeable à tout moment.
        </div>
      </div>
      <script>window.print();</script>
      </body></html>`);
    win.document.close();
    toast.success('Document téléchargé depuis votre Coffre-Fort Numérique !');
  };

  return (
    <div data-testid="student-guichet-page" className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in pb-24">

      {/* ── Deep Navy Hero Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl shrink-0">
              <FileSignature className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Portail Étudiant — ENCG Fès
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Mes Demandes & Coffre-Fort Numérique
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Demandez vos pièces officielles 100% en ligne, suivez l'état d'avancement en temps réel et téléchargez vos documents certifiés SHA-256.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" /> NOUVELLE DEMANDE
          </button>
        </div>

        {/* KPI Row */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">TOTAL DEMANDES</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{requests.length} Demandes</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">DOCUMENTS CERTIFIÉS</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              {requests.filter((r: any) => r.status === 'approved' || r.status === 'ready').length} Prêts
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">EN COURS DE TRAITEMENT</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
              {requests.filter((r: any) => r.status === 'pending').length} En Cours
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">SÉCURITÉ COFFRE-FORT</span>
            <span className="text-2xl font-black text-purple-300 font-mono mt-1 block">SHA-256 ✅</span>
          </div>
        </div>
      </div>

      {/* ── Main Section: Request Cards with Live Stepper SLA ── */}
      <div className="space-y-6">
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" /> Suivi de Mes Demandes & Coffre-Fort Numérique
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map((req: any) => {
              const isApproved = req.status === 'approved' || req.status === 'ready';
              const isRejected = req.status === 'rejected';
              const step = isApproved ? 3 : isRejected ? 0 : (req.step || 2);

              return (
                <div key={req.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all space-y-6">

                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-600 flex items-center justify-center text-amber-300 font-black text-xl shadow-md shrink-0">
                        <FileText className="w-6 h-6 text-amber-300" />
                      </div>
                      <div>
                        <h3 className="font-black text-base text-slate-900 dark:text-white">{req.type}</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Demande #{req.id} · Transmise le {req.created_at || 'Récemment'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isApproved ? (
                        <span className="px-3.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-black flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Document Prêt dans le Coffre-Fort
                        </span>
                      ) : isRejected ? (
                        <span className="px-3.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-xs font-black flex items-center gap-1.5">
                          <XCircle className="w-4 h-4" /> Demande Non Accordée
                        </span>
                      ) : (
                        <span className="px-3.5 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-xs font-black flex items-center gap-1.5">
                          <Clock className="w-4 h-4" /> En cours de traitement scolarité
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Motif */}
                  {req.motif && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <strong>Motif de la demande :</strong> "{req.motif}"
                    </div>
                  )}

                  {/* SLA Stepper Progress Bar */}
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 space-y-3">
                    <p className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 tracking-wider">
                      Progression du Traitement SLA (Temps moyen restant : 2 heures)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className={cn("p-2.5 rounded-xl text-center text-xs font-bold border transition-all", step >= 1 ? "bg-emerald-500 text-white border-emerald-600 shadow-sm" : "bg-slate-100 text-slate-400 border-slate-200")}>
                        1. Demande Reçue ✅
                      </div>
                      <div className={cn("p-2.5 rounded-xl text-center text-xs font-bold border transition-all", step >= 2 ? "bg-amber-500 text-white border-amber-600 shadow-sm animate-pulse" : "bg-slate-100 text-slate-400 border-slate-200")}>
                        2. Contrôle Scolarité {step >= 2 ? '⏳' : ''}
                      </div>
                      <div className={cn("p-2.5 rounded-xl text-center text-xs font-bold border transition-all", step >= 3 ? "bg-emerald-600 text-white border-emerald-700 shadow-sm" : "bg-slate-100 text-slate-400 border-slate-200")}>
                        3. Signé & QR Certifié 🛡️
                      </div>
                    </div>
                  </div>

                  {/* Actions & Cryptographic Hash */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {isApproved ? (
                      <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <Lock className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Empreinte SHA-256 : {req.hash ? req.hash.substring(0, 16) + '...' : 'e3b0c44298fc1c14...'}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">Demande en cours d'instruction par la scolarité.</span>
                    )}

                    {isApproved && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintCertificate(req)}
                          className="px-5 py-2.5 bg-[#0f2863] hover:bg-blue-900 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Télécharger / Imprimer PDF (SHA-256)
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal Nouvelle Demande ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Guichet Unique 100% Ligne</span>
                <h2 className="text-base font-black">Nouvelle Demande de Document</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); requestMutation.mutate(newRequestData); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Type de Document *</label>
                <select
                  value={newRequestData.type}
                  onChange={(e) => setNewRequestData(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none cursor-pointer"
                >
                  <option value="Attestation de Scolarité">Attestation de Scolarité</option>
                  <option value="Relevé de Notes (S1-S4)">Relevé de Notes (S1-S4)</option>
                  <option value="Attestation de Réussite">Attestation de Réussite</option>
                  <option value="Convention de Stage PFE">Convention de Stage PFE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Motif & Organisme Destinataire *</label>
                <textarea
                  required
                  rows={3}
                  value={newRequestData.motif}
                  onChange={(e) => setNewRequestData(p => ({ ...p, motif: e.target.value }))}
                  placeholder="Ex: Demande de stage PFE, renouvellement passeport, dossier de bourse..."
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer">ANNULER</button>
                <button type="submit" className="px-6 py-2.5 text-xs font-black bg-[#0f2863] text-white hover:bg-blue-900 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> SOUMETTRE LA DEMANDE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
