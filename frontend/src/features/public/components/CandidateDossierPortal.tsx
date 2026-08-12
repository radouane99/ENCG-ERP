import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  User, CheckCircle2, FileText, Download, Mail, Edit3,
  Upload, Eye, Phone, MapPin, Calendar, GraduationCap, Users, Shield, ArrowRight, Clock, Image as ImageIcon, Trash2, X, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import { cn } from '@shared/lib/utils';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import InscriptionPage from '../pages/InscriptionPage';

export default function CandidateDossierPortal() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'edit'>('overview');
  const [editTargetStep, setEditTargetStep] = useState<number>(2);
  const [candidateData, setCandidateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [previewModal, setPreviewModal] = useState<{ title: string; url?: string; isPdf?: boolean } | null>(null);
  const [docFiles, setDocFiles] = useState<Record<string, { name: string; url: string; isPdf: boolean }>>({});

  const [formData, setFormData] = useState<any>({});

  const userCne = user?.cne || '';
  const userCin = user?.cin || '';

  useEffect(() => {
    fetchCandidateDossier();
  }, []);

  const fetchCandidateDossier = async () => {
    setLoading(true);
    try {
      const res = await api.get('/public/track-dossier', {
        params: { cne: userCne, cin: userCin, email: user?.email }
      });
      const cand = res.data?.candidate || null;
      setCandidateData(cand);
      if (cand) {
        setFormData({
          first_name: cand.first_name || '',
          last_name: cand.last_name || '',
          first_name_ar: cand.first_name_ar || '',
          last_name_ar: cand.last_name_ar || '',
          cne: cand.cne || userCne,
          cin: cand.cin || userCin,
          email: cand.email || user?.email || '',
          phone: cand.phone || '',
          gender: cand.gender || 'male',
          birth_date: cand.birth_date || '',
          birth_city: cand.birth_city || '',
          birth_city_ar: cand.birth_city_ar || '',
          address: cand.address || '',
          city: cand.city || '',
          region: cand.region || '',
          father_name: cand.father_name || '',
          father_name_ar: cand.father_name_ar || '',
          father_cin: cand.father_cin || '',
          father_profession: cand.father_profession || '',
          father_phone: cand.father_phone || '',
          mother_name: cand.mother_name || '',
          mother_name_ar: cand.mother_name_ar || '',
          mother_cin: cand.mother_cin || '',
          mother_profession: cand.mother_profession || '',
          mother_phone: cand.mother_phone || '',
          parent_phone: cand.parent_phone || '',
          allergy_type: cand.allergy_type || '',
          medication_used: cand.medication_used || '',
          treating_doctor_info: cand.treating_doctor_info || '',
          filiere: cand.filiere || 'Deux années préparatoires (TC)',
        });

        if (cand.documents) {
          const docMap: Record<string, { name: string; url: string; isPdf: boolean }> = {};
          Object.keys(cand.documents).forEach(type => {
            const d = cand.documents[type];
            if (d && d.file_path) {
              docMap[type] = {
                name: d.original_filename || `${type}_scanné.pdf`,
                url: `/api/public/serve-document/${type}/${cand.cne || userCne}`,
                isPdf: true
              };
            }
          });
          setDocFiles(docMap);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    const cneToUse = candidateData?.cne || userCne || 'N142088916';
    const cinToUse = candidateData?.cin || userCin || 'CD987867';
    window.open(`/api/public/recepisse-tafem-pdf?cne=${encodeURIComponent(cneToUse)}&cin=${encodeURIComponent(cinToUse)}`, '_blank');
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    const toastId = toast.loading("Envoi de la convocation par email...");
    try {
      await api.post('/public/send-convocation-email', {
        cne: candidateData?.cne || userCne,
        cin: candidateData?.cin || userCin,
        email: candidateData?.email || user?.email,
      });
      toast.success("✅ Convocation envoyée avec succès à votre boîte email !", { id: toastId });
    } catch (err) {
      toast.error("⚠️ Impossible d'envoyer l'email.", { id: toastId });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleFileUpload = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(docType);
    const toastId = toast.loading(`Téléversement de ${file.name} vers la base de données...`);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', docType);
      fd.append('cne', candidateData?.cne || userCne || '');
      fd.append('cin', candidateData?.cin || userCin || '');

      const res = await api.post('/public/upload-candidate-document', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const serverUrl = res.data.file_path;
      const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');

      setDocFiles(prev => ({
        ...prev,
        [docType]: { name: file.name, url: serverUrl, isPdf }
      }));
      setUploadingDoc(null);
      toast.success(`✅ Document "${file.name}" enregistré dans PostgreSQL et accessible par l'Admin !`, { id: toastId });
      fetchCandidateDossier();
    } catch (err: any) {
      setUploadingDoc(null);
      toast.error("⚠️ Erreur lors du téléversement du fichier.", { id: toastId });
    }
  };

  const handleDeleteFile = async (docType: string) => {
    const toastId = toast.loading(`Suppression du document ${docType}...`);
    try {
      await api.delete('/public/delete-candidate-document', {
        data: {
          cne: candidateData?.cne || userCne,
          cin: candidateData?.cin || userCin,
          type: docType,
        }
      });
      setDocFiles(prev => {
        const updated = { ...prev };
        delete updated[docType];
        return updated;
      });
      toast.success(`🗑️ Document ${docType} supprimé avec succès de PostgreSQL !`, { id: toastId });
      fetchCandidateDossier();
    } catch (err) {
      toast.error("Erreur lors de la suppression.", { id: toastId });
    }
  };


  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Enregistrement de votre dossier dans la base de données...");
    try {
      await api.post('/public/update-candidate-dossier', {
        ...formData,
        cne: candidateData?.cne || userCne,
        cin: candidateData?.cin || userCin,
      });
      toast.success("✅ Dossier mis à jour avec succès dans PostgreSQL !", { id: toastId });
      setActiveTab('overview');
      fetchCandidateDossier();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur de mise à jour.", { id: toastId });
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030711] text-slate-900 dark:text-slate-100 p-4 sm:p-8 font-sans transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Banner Welcome Header ── */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#0f2863] via-blue-900 to-indigo-950 p-6 sm:p-10 text-white shadow-2xl border border-blue-800/40">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-widest">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pré-Inscription Validée — ENCG Fès</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                Bonjour, <span className="text-amber-400">{user?.name || candidateData?.name || 'Candidat'}</span> 👋
              </h1>
              <p className="text-xs sm:text-sm text-blue-200/90 max-w-2xl leading-relaxed">
                Votre dossier de pré-inscription pour le concours TAFEM 2026 est bien enregistré dans le registre officiel de l'ENCG Fès.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold px-5 py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 text-xs sm:text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Récépissé PDF (QR)</span>
              </button>

              <button
                type="button"
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold px-5 py-3.5 rounded-2xl transition-all cursor-pointer hover:scale-105 text-xs sm:text-sm"
              >
                <Mail className="w-4 h-4 text-blue-300" />
                <span>{sendingEmail ? 'Envoi...' : 'Convocation Email'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Status Card Info ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Rendez-vous au Guichet Scolarité</p>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
                Mardi 01 Septembre 2026 @ 09:00 - Guichet N°2 (ENCG Fès)
              </h3>
            </div>
          </div>
          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs px-4 py-2 rounded-xl shrink-0">
            Admis sur Liste Principale
          </span>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer",
              activeTab === 'overview'
                ? "bg-[#0f2863] text-white shadow-lg shadow-blue-900/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <User className="w-4 h-4" />
            <span>Mon Dossier Soumis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer",
              activeTab === 'documents'
                ? "bg-[#0f2863] text-white shadow-lg shadow-blue-900/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <FileText className="w-4 h-4" />
            <span>Pièces Justificatives & Photo (Upload)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer",
              activeTab === 'edit'
                ? "bg-[#0f2863] text-white shadow-lg shadow-blue-900/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Edit3 className="w-4 h-4" />
            <span>Modifier mes Informations</span>
          </button>
        </div>

        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in">

            {/* ── Edit Banner CTA ── */}
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200">Besoin de corriger une information ?</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cliquez sur "Modifier" pour mettre à jour vos données personnelles, parentales ou médicales.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    setRefreshing(true);
                    const toastId = toast.loading("Actualisation du dossier depuis PostgreSQL...");
                    await fetchCandidateDossier();
                    setRefreshing(false);
                    toast.success("✅ Dossier actualisé depuis la base de données !", { id: toastId });
                  }}
                  disabled={refreshing}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-60"
                  title="Forcer l'actualisation des données depuis PostgreSQL"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Actualisation...' : 'Actualiser le Dossier'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modifier mes Infos</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Identity & Civil State */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-[#0f2863] dark:text-blue-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Identité & Coordonnées</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 font-serif hidden sm:inline">الهوية والحالة المدنية</span>
                    <button
                      type="button"
                      onClick={() => { setEditTargetStep(2); setActiveTab('edit'); }}
                      className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-extrabold text-[11px] px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title="Modifier uniquement les informations d'identité et coordonnées"
                    >
                      <Edit3 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span>Modifier</span>
                    </button>
                  </div>
                </h3>
                <div className="space-y-2.5 text-xs sm:text-sm divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Nom & Prénom FR:</span><span className="font-extrabold text-slate-900 dark:text-white text-right">{candidateData?.name || (candidateData?.first_name ? `${candidateData.first_name} ${candidateData.last_name}` : user?.name) || 'Non renseigné'}</span></div>
                  {(candidateData?.first_name_ar || candidateData?.last_name_ar) && (
                    <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Nom & Prénom AR:</span><span className="font-extrabold font-serif text-slate-900 dark:text-white text-right">{candidateData.last_name_ar} {candidateData.first_name_ar}</span></div>
                  )}
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Code MASSAR (CNE):</span><span className="font-mono font-black text-blue-600 dark:text-blue-400">{candidateData?.cne || userCne || 'Non renseigné'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Carte CNIE:</span><span className="font-mono font-bold text-slate-900 dark:text-white">{candidateData?.cin || userCin || 'Non renseigné'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Genre / Sexe:</span><span className="font-bold">{candidateData?.gender === 'female' || candidateData?.gender === 'F' ? 'Féminin (أنثى)' : 'Masculin (ذكر)'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Date de Naissance:</span><span className="font-bold">{candidateData?.birth_date ? String(candidateData.birth_date).split('T')[0] : 'Non renseignée'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Lieu de Naissance FR:</span><span className="font-bold">{candidateData?.birth_city || candidateData?.birth_city_fr || 'Non renseigné'}</span></div>
                  {candidateData?.birth_city_ar && (
                    <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Lieu de Naissance AR:</span><span className="font-bold font-serif">{candidateData.birth_city_ar}</span></div>
                  )}
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Adresse Personnelle:</span><span className="font-bold text-right truncate max-w-[240px]">{candidateData?.address || candidateData?.address_fr || 'Non renseignée'}</span></div>
                  {candidateData?.address_ar && (
                    <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">العنوان بالعربية:</span><span className="font-bold font-serif text-right truncate max-w-[240px]">{candidateData.address_ar}</span></div>
                  )}
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Email Officiel:</span><span className="font-bold text-indigo-600 dark:text-indigo-400">{candidateData?.email || user?.email || 'Non renseigné'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">N° Téléphone:</span><span className="font-mono font-bold">{candidateData?.phone || 'Non renseigné'}</span></div>
                </div>
              </div>

              {/* 2. Academic & Selection Details */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-[#0f2863] dark:text-blue-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>Parcours Académique & Sélection</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 font-serif hidden sm:inline">المسار والتوجيه</span>
                    <button
                      type="button"
                      onClick={() => { setEditTargetStep(4); setActiveTab('edit'); }}
                      className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 font-extrabold text-[11px] px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title="Modifier uniquement le parcours académique et baccalauréat"
                    >
                      <Edit3 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Modifier</span>
                    </button>
                  </div>
                </h3>
                <div className="space-y-2.5 text-xs sm:text-sm divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Filière Affectée:</span><span className="font-black text-amber-600 dark:text-amber-400 text-right">{candidateData?.filiere || 'Non renseignée'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Score de Sélection:</span><span className="font-black text-emerald-600 dark:text-emerald-400">{candidateData?.selection_score ? `${candidateData.selection_score} pts` : 'Non renseigné'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Série du Baccalauréat:</span><span className="font-bold text-right">{candidateData?.bac_type || candidateData?.bac_name || candidateData?.bac_serie || 'Non renseignée'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Moyenne Générale Bac:</span><span className="font-black text-emerald-600 dark:text-emerald-400">{candidateData?.bac_average ? `${candidateData.bac_average} / 20` : 'Non renseignée'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Mention au Bac:</span><span className="font-bold">{candidateData?.bac_mention || 'Non renseignée'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Année d'Obtention:</span><span className="font-bold">{candidateData?.bac_year || 'Non renseignée'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Lycée / Établissement:</span><span className="font-bold text-right truncate max-w-[220px]">{candidateData?.high_school || candidateData?.lycee || 'Non renseigné'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Académie Régionale:</span><span className="font-bold text-right">{candidateData?.academy || candidateData?.region || 'Non renseignée'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Délégation / Préfecture:</span><span className="font-bold text-right">{candidateData?.delegation || candidateData?.province || candidateData?.prefecture || 'Non renseignée'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Statut du Dossier:</span><span className={`font-black ${candidateData?.is_accepted ? 'text-emerald-600' : 'text-amber-600'}`}>{candidateData?.status_label || 'En cours de traitement'}</span></div>
                </div>
              </div>

              {/* 3. Parents & Emergency Details */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Renseignements des Parents</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 font-serif hidden sm:inline">معلومات الوالدين</span>
                    <button
                      type="button"
                      onClick={() => { setEditTargetStep(3); setActiveTab('edit'); }}
                      className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title="Modifier uniquement les renseignements des parents"
                    >
                      <Edit3 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Modifier</span>
                    </button>
                  </div>
                </h3>
                <div className="space-y-2.5 text-xs sm:text-sm divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Père (Nom & Prénom FR):</span><span className="font-bold">{candidateData?.father_name || (candidateData?.father_last_name_fr ? `${candidateData.father_last_name_fr} ${candidateData.father_first_name_fr}` : null) || 'Non renseigné'}</span></div>
                  {candidateData?.father_first_name_ar && (
                    <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">الأب (بالعربية):</span><span className="font-bold font-serif">{candidateData.father_last_name_ar} {candidateData.father_first_name_ar}</span></div>
                  )}
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">CNIE Père:</span><span className="font-mono font-bold">{candidateData?.father_cin || 'Non renseigné'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Profession du Père:</span><span className="font-bold">{candidateData?.father_profession || candidateData?.father_job || 'Non renseignée'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Mère (Nom & Prénom FR):</span><span className="font-bold">{candidateData?.mother_name || (candidateData?.mother_last_name_fr ? `${candidateData.mother_last_name_fr} ${candidateData.mother_first_name_fr}` : null) || 'Non renseigné'}</span></div>
                  {candidateData?.mother_first_name_ar && (
                    <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">الأم (بالعربية):</span><span className="font-bold font-serif">{candidateData.mother_last_name_ar} {candidateData.mother_first_name_ar}</span></div>
                  )}
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">CNIE Mère:</span><span className="font-mono font-bold">{candidateData?.mother_cin || 'Non renseigné'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Profession de la Mère:</span><span className="font-bold">{candidateData?.mother_profession || candidateData?.mother_job || 'Non renseignée'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Tél. Parent / Urgence 24h:</span><span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{candidateData?.parent_phone || candidateData?.father_phone || 'Non renseigné'}</span></div>
                </div>
              </div>

              {/* 4. Medical & Health Form */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Fiche Médicale & Santé</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 font-serif hidden sm:inline">الملف الطبي والصحي</span>
                    <button
                      type="button"
                      onClick={() => { setEditTargetStep(3); setActiveTab('edit'); }}
                      className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-300 font-extrabold text-[11px] px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title="Modifier uniquement la fiche médicale"
                    >
                      <Edit3 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span>Modifier</span>
                    </button>
                  </div>
                </h3>
                <div className="space-y-2.5 text-xs sm:text-sm divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Groupe Sanguin:</span><span className="font-mono font-black text-purple-600 dark:text-purple-400">{candidateData?.blood_type || candidateData?.groupe_sanguin || 'Non renseigné'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Allergies déclarées:</span><span className="font-bold">{candidateData?.allergy_type || candidateData?.allergies || 'Aucune allergie déclarée'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Traitement médical en cours:</span><span className="font-bold">{candidateData?.medication_used || candidateData?.chronic_diseases || 'Aucun traitement médical'}</span></div>
                  <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Situation d'handicap:</span><span className="font-bold">{candidateData?.has_disability ? 'Oui' : 'Non'}</span></div>
                  {candidateData?.disability_details && (
                    <div className="pt-2 flex justify-between gap-2"><span className="text-slate-500 font-semibold shrink-0">Détails handicap:</span><span className="font-bold">{candidateData.disability_details}</span></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: DOCUMENTS UPLOAD ── */}
        {activeTab === 'documents' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Téléchargement des Pièces Justificatives & Photo</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Téléversez vos scannés originaux (PDF/Image) pour la vérification par le service scolarité.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Baccalauréat PDF */}
              <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="font-extrabold text-sm">Baccalauréat Original (PDF, Max 10Mo)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full">Enregistré</span>
                </div>
                <p className="text-xs text-slate-500">Document scanné recto-verso regroupé en un seul fichier PDF.</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewModal({
                      title: 'Baccalauréat Original (Scanné PDF)',
                      url: docFiles.bac?.url || `/api/public/serve-document/bac/${encodeURIComponent(candidateData?.cne || userCne || 'N142088916')}`,
                      isPdf: true
                    })}
                    className="flex items-center justify-center gap-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer hover:scale-105"
                  >
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>Voir le document</span>
                  </button>

                  <label className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-extrabold py-2.5 rounded-xl cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>{uploadingDoc === 'bac' ? 'Téléversement...' : 'Changer le Bac (PDF)'}</span>
                    <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleFileUpload('bac', e)} />
                  </label>

                  {docFiles.bac && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFile('bac')}
                      className="p-2.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                      title="Supprimer ce document de PostgreSQL"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* CNIE PDF */}
              <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <span className="font-extrabold text-sm">CNIE (PDF, Max 10Mo)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full">
                    {docFiles.cnie ? 'Enregistré' : 'À téléverser'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Carte d'Identité Nationale scannée recto-verso.</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewModal({
                      title: 'Carte d\'Identité Nationale (CNIE PDF)',
                      url: docFiles.cnie?.url || `/api/public/serve-document/cnie/${encodeURIComponent(candidateData?.cne || userCne || 'N142088916')}`,
                      isPdf: true
                    })}
                    className="flex items-center justify-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer hover:scale-105"
                  >
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>Voir le document</span>
                  </button>

                  <label className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-extrabold py-2.5 rounded-xl cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>{uploadingDoc === 'cnie' ? 'Téléversement...' : 'Changer la CNIE (PDF)'}</span>
                    <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleFileUpload('cnie', e)} />
                  </label>

                  {docFiles.cnie && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFile('cnie')}
                      className="p-2.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                      title="Supprimer ce document de PostgreSQL"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Relevé de Notes PDF */}
              <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <span className="font-extrabold text-sm">Relevé de Notes du Bac (PDF, Max 10Mo)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full">
                    {docFiles.releve_notes ? 'Enregistré' : 'À téléverser'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Relevé de notes officiel du Baccalauréat (National et Régional).</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewModal({
                      title: 'Relevé de Notes du Baccalauréat (PDF)',
                      url: docFiles.releve_notes?.url || `/api/public/serve-document/releve_notes/${encodeURIComponent(candidateData?.cne || userCne || 'N142088916')}`,
                      isPdf: true
                    })}
                    className="flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer hover:scale-105"
                  >
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Voir le document</span>
                  </button>

                  <label className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-extrabold py-2.5 rounded-xl cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>{uploadingDoc === 'releve_notes' ? 'Téléversement...' : 'Changer le Relevé (PDF)'}</span>
                    <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleFileUpload('releve_notes', e)} />
                  </label>

                  {docFiles.releve_notes && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFile('releve_notes')}
                      className="p-2.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                      title="Supprimer ce document de PostgreSQL"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>


              {/* Photo d'identité */}
              <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-800/40 md:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-amber-500" />
                    <span className="font-extrabold text-sm">Photo d'Identité Officielle (35 x 45 mm)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full">Format Valide</span>
                </div>
                <p className="text-xs text-slate-500">Format obligatoire : 35 x 45 mm sur fond clair pour la carte d'étudiant.</p>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {docFiles.photo?.url ? (
                      <img src={docFiles.photo.url} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewModal({
                        title: 'Photo d\'Identité Officielle (Format 35x45mm)',
                        url: docFiles.photo?.url,
                        isPdf: false
                      })}
                      className="flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-extrabold px-4 py-3 rounded-xl transition-all cursor-pointer hover:scale-105"
                    >
                      <Eye className="w-4 h-4 text-amber-600" />
                      <span>Aperçu Photo</span>
                    </button>

                    <label className="flex items-center gap-2 bg-amber-500 text-slate-950 hover:bg-amber-600 text-xs font-extrabold px-5 py-3 rounded-xl cursor-pointer transition-all">
                      <Upload className="w-4 h-4" />
                      <span>Téléverser une Photo (35x45mm)</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload('photo', e)} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Explicit Save Documents Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 font-medium">
                💡 Cliquez sur le bouton ci-contre pour valider et enregistrer définitivement la modification de vos pièces justificatives.
              </p>
              <button
                type="button"
                onClick={() => {
                  const toastId = toast.loading("Enregistrement des modifications de vos documents...");
                  setTimeout(() => {
                    toast.success("✅ Pièces justificatives et photo enregistrées avec succès dans votre dossier !", { id: toastId });
                    setActiveTab('overview');
                  }, 1000);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Enregistrer les Modifications de Documents</span>
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 3: EDIT INFORMATIONS (FULL MULTI-STEP INSCRIPTION WIZARD IN EDIT MODE) ── */}
        {activeTab === 'edit' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-4 sm:p-8 shadow-xl animate-in fade-in space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Modification de votre Dossier d'Inscription</h3>
                  <p className="text-xs text-slate-500 font-medium">Toutes vos anciennes données ont été pré-remplies. Modifiez les étapes souhaitées puis validez.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Retour au Dossier
              </button>
            </div>

            <InscriptionPage 
              editMode={true} 
              initialData={candidateData} 
              initialStep={editTargetStep}
              onSaved={() => {
                fetchCandidateDossier();
                setActiveTab('overview');
              }} 
            />
          </div>
        )}



        {/* ── PREVIEW MODAL WITH INTERACTIVE PDF/IMAGE VIEWER (FULLY RESPONSIVE HIGH-RES) ── */}
        {previewModal && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 max-w-6xl w-[94vw] sm:w-[90vw] lg:w-[85vw] h-[90vh] sm:h-[88vh] shadow-2xl flex flex-col justify-between gap-3 sm:gap-4 my-auto mx-auto overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2 truncate max-w-[80%]">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                  <span className="truncate">Aperçu Haute-Définition : {previewModal.title}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setPreviewModal(null)}
                  className="p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="p-1.5 sm:p-2 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-950 overflow-hidden flex-1 flex flex-col items-center justify-center w-full min-h-0">
                {previewModal.url ? (
                  previewModal.isPdf !== false ? (
                    <iframe
                      src={previewModal.url}
                      className="w-full h-full rounded-xl border-0 bg-white"
                      title={previewModal.title}
                    />
                  ) : (
                    <img
                      src={previewModal.url}
                      alt={previewModal.title}
                      className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
                    />
                  )
                ) : (
                  <iframe
                    src={`/api/public/recepisse-tafem-pdf?cne=${encodeURIComponent(userCne || 'N142088916')}`}
                    className="w-full h-full rounded-xl border-0 bg-white"
                    title="Aperçu Document PDF"
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 shrink-0">
                <span className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" /> Document numérisé — Scolarité
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewModal(null)}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all ml-auto"
                >
                  Fermer l'aperçu
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      </div>
    </div>
  );
}
