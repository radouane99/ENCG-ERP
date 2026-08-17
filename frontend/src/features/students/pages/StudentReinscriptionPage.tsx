import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, Sparkles, AlertCircle, ArrowRight, ArrowLeft,
  ShieldCheck, FileText, Download, User, MapPin, Phone,
  Building2, GraduationCap, Clock, Check, AlertTriangle
} from 'lucide-react';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import { cn } from '@shared/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

export default function StudentReinscriptionPage() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form state
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [selectedFiliereId, setSelectedFiliereId] = useState<string>('');
  const [hasInsurance, setHasInsurance] = useState(true);

  // Fetch status
  const { data: statusRes, isLoading } = useQuery({
    queryKey: ['student-reinscription-status'],
    queryFn: async () => {
      const res = await api.get('/student-portal/reinscription/status');
      return res.data?.data || res.data;
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/student-portal/reinscription/confirm', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Réinscription confirmée avec succès !');
      queryClient.invalidateQueries({ queryKey: ['student-reinscription-status'] });
      setStep(4);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la confirmation.');
    },
  });

  const s = statusRes || {};

  // Prefill when data loads
  React.useEffect(() => {
    if (s.phone && !phone) setPhone(s.phone);
    if (s.address && !address) setAddress(s.address);
    if (s.city && !city) setCity(s.city);
    if (s.is_confirmed) setStep(4);
  }, [s, phone, address, city]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-bold text-sm">Vérification de votre dossier de délibération...</p>
      </div>
    );
  }

  const handleConfirmSubmit = () => {
    if (!phone || !address || !city) {
      toast.error('Veuillez renseigner toutes vos coordonnées.');
      return;
    }
    confirmMutation.mutate({
      phone,
      address,
      city,
      filiere_id: selectedFiliereId ? parseInt(selectedFiliereId) : undefined,
      has_insurance: hasInsurance,
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#0a1b44] rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl relative overflow-hidden border border-blue-400/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" /> Rentrée Universitaire {s.academic_year || '2026/2027'}
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight">
              Portail de Réinscription en Ligne
            </h1>
            <p className="text-blue-200 text-sm max-w-xl">
              Confirmation administrative de votre passage en année supérieure suite aux délibérations officielles de l'ENCG Fès.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center min-w-[200px]">
            <span className="text-[10px] text-blue-200 uppercase font-black tracking-widest block">Votre Statut Jury</span>
            {s.is_admis ? (
              <span className="text-lg font-black text-emerald-300 flex items-center justify-center gap-1.5 mt-1">
                <CheckCircle2 className="w-5 h-5" /> ADMIS(E) EN {s.target_level?.split(' ')[0] || 'ANNÉE SUP.'}
              </span>
            ) : (
              <span className="text-base font-black text-amber-300 flex items-center justify-center gap-1.5 mt-1">
                <AlertTriangle className="w-5 h-5" /> AJOURNÉ(E) • REDOUBLEMENT
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stepper Wizard Progress */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {[
          { id: 1, label: '1. Décision Jury', desc: 'Résultats validés' },
          { id: 2, label: '2. Coordonnées', desc: 'Contact & Adresse' },
          { id: 3, label: '3. Filière & Pièces', desc: 'Choix & Assurance' },
          { id: 4, label: '4. Récépissé Officiel', desc: 'Confirmation A4' },
        ].map((st) => (
          <div
            key={st.id}
            className={cn(
              "p-3.5 rounded-2xl border transition-all text-left",
              step === st.id
                ? "bg-[#0f2863] text-white border-[#0f2863] shadow-md ring-4 ring-[#0f2863]/10"
                : step > st.id
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
            )}
          >
            <div className="text-xs font-black tracking-wider uppercase">{st.label}</div>
            <div className="text-[11px] opacity-80 hidden md:block mt-0.5">{st.desc}</div>
          </div>
        ))}
      </div>

      {/* STEP 1: Décision du Jury & Promotion */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Validation de Votre Année Académique</h3>
              <p className="text-xs text-slate-500 font-medium">Bilan officiel des délibérations de l'année précédente</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-black text-slate-400 uppercase">Niveau Précédent :</span>
              <div className="text-base font-black text-slate-800 dark:text-slate-100">{s.current_level}</div>
              <span className="text-xs text-slate-500 font-medium block">Semestre S{s.current_semester}</span>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
              <span className="text-xs font-black text-emerald-600 uppercase">Nouveau Niveau Cible :</span>
              <div className="text-base font-black text-emerald-800 dark:text-emerald-200">{s.target_level}</div>
              <span className="text-xs text-emerald-600 font-bold block">Promotion au Semestre S{s.target_semester}</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Le jury de délibération de l'ENCG Fès a validé votre cursus. Votre place pour la rentrée <strong>{s.academic_year}</strong> est réservée. Veuillez confirmer vos coordonnées et finaliser votre réinscription ci-dessous.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 bg-[#0f2863] text-white font-bold rounded-2xl text-xs uppercase tracking-wider hover:bg-[#1a387e] transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              Étape suivante : Coordonnées <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Vérification des Coordonnées */}
      {step === 2 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Mise à Jour de Vos Coordonnées</h3>
              <p className="text-xs text-slate-500 font-medium">Informations de contact pour l'année {s.academic_year}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase mb-1">Nom & Prénom</label>
              <input
                type="text"
                disabled
                value={s.student_name || ''}
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase mb-1">Code Massar / CNE</label>
              <input
                type="text"
                disabled
                value={s.cne || ''}
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-600 dark:text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase mb-1">Numéro de Téléphone (GSM / WhatsApp) *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 06 12 34 56 78"
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase mb-1">Ville de Résidence Actuelle *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Fès"
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase mb-1">Adresse Complète à Fès / Résidence Universitaire *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Résidence Al Qods, Quartier Narjiss, Fès"
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-xs cursor-pointer"
            >
              Retour
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-3 bg-[#0f2863] text-white font-bold rounded-2xl text-xs uppercase tracking-wider hover:bg-[#1a387e] transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              Étape suivante : Filière & Assurance <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Filière & Assurance */}
      {step === 3 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Choix de Filière & Assurance Scolaire</h3>
              <p className="text-xs text-slate-500 font-medium">Finalisation de vos options d'inscription</p>
            </div>
          </div>

          {s.requires_filiere_choice ? (
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase">
                Sélectionnez votre Filière de Spécialisation (Semestre S{s.target_semester}) *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(s.filieres || []).map((f: any) => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFiliereId(String(f.id))}
                    className={cn(
                      "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between",
                      selectedFiliereId === String(f.id)
                        ? "border-[#0f2863] bg-blue-50/50 dark:bg-blue-950/40 text-[#0f2863] dark:text-blue-200 font-black shadow-sm"
                        : "border-slate-200 dark:border-slate-700 hover:border-blue-300 text-slate-700 dark:text-slate-300 font-bold"
                    )}
                  >
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">{f.code}</span>
                      <span className="text-xs">{f.name}</span>
                    </div>
                    {selectedFiliereId === String(f.id) && <Check className="w-5 h-5 text-[#0f2863]" />}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-black text-slate-400 uppercase block">Filière d'affectation :</span>
              <span className="text-sm font-black text-[#0f2863] dark:text-blue-300 mt-1 block">
                {s.current_filiere || 'Tronc Commun (Management & Commerce)'}
              </span>
            </div>
          )}

          <div className="p-5 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/40 flex items-start gap-3">
            <input
              type="checkbox"
              id="ins"
              checked={hasInsurance}
              onChange={(e) => setHasInsurance(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-300 text-[#0f2863] focus:ring-[#0f2863]"
            />
            <label htmlFor="ins" className="text-xs text-amber-900 dark:text-amber-200 cursor-pointer">
              <strong>Assurance Responsabilité Civile & Mutuelle Étudiante :</strong> J'atteste être en règle avec la souscription de l'assurance obligatoire pour l'année universitaire {s.academic_year}.
            </label>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-xs cursor-pointer"
            >
              Retour
            </button>
            <button
              onClick={handleConfirmSubmit}
              disabled={confirmMutation.isPending}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {confirmMutation.isPending ? 'Confirmation en cours...' : 'Confirmer Ma Réinscription Définitive'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Récépissé Officiel Confirmé */}
      {step === 4 && (
        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 md:p-10 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Réinscription Confirmée pour l'Année {s.academic_year} !
            </h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Votre dossier a été validé avec succès. Votre récépissé officiel ci-dessous fait foi de votre réinscription régulière à l'ENCG Fès.
            </p>
          </div>

          {/* Official Printable Receipt Box */}
          <div className="max-w-md mx-auto p-6 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-left space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase block">RÉCÉPISSÉ DE RÉINSCRIPTION</span>
                <span className="text-xs font-mono font-black text-[#0f2863] dark:text-blue-300">{s.receipt_reference || 'REC-REINSC-2026-OK'}</span>
              </div>
              <QRCodeSVG value={`https://encg-fes.ac.ma/verify/reinscription/${s.cne}`} size={44} />
            </div>

            <div className="space-y-1.5 text-xs">
              <div><span className="text-slate-400 font-bold">Étudiant :</span> <strong className="text-slate-800 dark:text-white uppercase">{s.student_name}</strong></div>
              <div><span className="text-slate-400 font-bold">CNE / Massar :</span> <strong className="font-mono">{s.cne}</strong></div>
              <div><span className="text-slate-400 font-bold">Niveau Validé :</span> <strong className="text-emerald-600">{s.target_level}</strong></div>
              <div><span className="text-slate-400 font-bold">Date de Validation :</span> <span>{s.confirmed_at || '15/08/2026 14:45'}</span></div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-[#0f2863] text-white font-bold rounded-2xl text-xs uppercase tracking-wider hover:bg-[#1a387e] transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" /> Imprimer Récépissé (A4 PDF)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
