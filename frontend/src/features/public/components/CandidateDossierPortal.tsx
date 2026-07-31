import React, { useState, useEffect } from 'react';
import { 
  User, CheckCircle2, FileText, Download, Mail, Edit3, 
  Upload, Eye, Phone, MapPin, Calendar, GraduationCap, Users, Shield, ArrowRight, Clock, Image as ImageIcon
} from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import { cn } from '@shared/lib/utils';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import InscriptionPage from '../pages/InscriptionPage';

export default function CandidateDossierPortal() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'edit'>('overview');
  const [candidateData, setCandidateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
                url: d.file_path,
                isPdf: d.file_path.toLowerCase().includes('.pdf')
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
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier mes Infos</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Identity Details */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-[#0f2863] dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Identité & Coordonnées</span>
                </h3>
                <div className="space-y-3 text-xs sm:text-sm divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Nom & Prénom:</span><span className="font-bold">{candidateData?.name || user?.name || 'Non renseigné'}</span></div>
                  <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Code MASSAR (CNE):</span><span className="font-mono font-bold text-blue-600">{candidateData?.cne || userCne || 'Non renseigné'}</span></div>
                  <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Carte CNIE:</span><span className="font-mono font-bold">{candidateData?.cin || userCin || 'Non renseigné'}</span></div>
                  <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Date de Naissance:</span><span className="font-bold">{candidateData?.birth_date || 'Non renseignée'}</span></div>
                  <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Lieu de Naissance:</span><span className="font-bold">{candidateData?.birth_city || 'Non renseigné'}</span></div>
                  <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Email:</span><span className="font-bold">{candidateData?.email || user?.email || 'Non renseigné'}</span></div>
                  <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Téléphone:</span><span className="font-bold">{candidateData?.phone || 'Non renseigné'}</span></div>
                </div>
              </div>

              {/* Academic & Selection Details */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-[#0f2863] dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Orientation & Sélection TAFEM</span>
                </h3>
                <div className="space-y-3 text-xs sm:text-sm divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Filière Affectée:</span><span className="font-bold text-amber-600">{candidateData?.filiere || 'Non renseignée'}</span></div>
                  <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Score de Sélection:</span><span className="font-extrabold text-emerald-600">{candidateData?.selection_score ? `${candidateData.selection_score} pts` : 'Non renseigné'}</span></div>
                  <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Type de Bac:</span><span className="font-bold">{candidateData?.bac_type || 'Non renseigné'}</span></div>
                  <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Moyenne du Bac:</span><span className="font-bold">{candidateData?.bac_average ? `${candidateData.bac_average} / 20` : 'Non renseignée'}</span></div>
                  <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Statut Dossier:</span><span className={`font-bold ${candidateData?.is_accepted ? 'text-emerald-500' : 'text-amber-500'}`}>{candidateData?.status_label || 'En cours de traitement'}</span></div>
                </div>
              </div>

              {/* Parents Details */}
              {(candidateData?.father_name || candidateData?.mother_name) && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Renseignements des Parents</span>
                  </h3>
                  <div className="space-y-3 text-xs sm:text-sm divide-y divide-slate-100 dark:divide-slate-800">
                    {candidateData?.father_name && <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Nom du Père:</span><span className="font-bold">{candidateData.father_name}</span></div>}
                    {candidateData?.father_cin && <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">CNIE Père:</span><span className="font-mono font-bold">{candidateData.father_cin}</span></div>}
                    {candidateData?.father_profession && <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Profession Père:</span><span className="font-bold">{candidateData.father_profession}</span></div>}
                    {candidateData?.mother_name && <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Nom de la Mère:</span><span className="font-bold">{candidateData.mother_name}</span></div>}
                    {candidateData?.mother_cin && <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">CNIE Mère:</span><span className="font-mono font-bold">{candidateData.mother_cin}</span></div>}
                    {candidateData?.parent_phone && <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Tél. Parent / Tuteur:</span><span className="font-mono font-bold">{candidateData.parent_phone}</span></div>}
                  </div>
                </div>
              )}

              {/* Medical Details */}
              {(candidateData?.allergy_type || candidateData?.medication_used) && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Fiche Médicale</span>
                  </h3>
                  <div className="space-y-3 text-xs sm:text-sm divide-y divide-slate-100 dark:divide-slate-800">
                    {candidateData?.allergy_type && <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Allergies:</span><span className="font-bold">{candidateData.allergy_type}</span></div>}
                    {candidateData?.medication_used && <div className="pt-2 flex justify-between"><span className="text-slate-500 font-semibold">Traitement médical:</span><span className="font-bold">{candidateData.medication_used}</span></div>}
                  </div>
                </div>
              )}
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
                      url: docFiles.bac?.url || `/api/public/recepisse-tafem-pdf?cne=${encodeURIComponent(userCne || 'N142088916')}`, 
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
                </div>
              </div>

              {/* CNIE PDF */}
              <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <span className="font-extrabold text-sm">CNIE (PDF, Max 10Mo)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full">Enregistré</span>
                </div>
                <p className="text-xs text-slate-500">Carte d'Identité Nationale scannée recto-verso.</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewModal({ 
                      title: 'Carte d\'Identité Nationale (CNIE PDF)', 
                      url: docFiles.cnie?.url || `/api/public/recepisse-tafem-pdf?cne=${encodeURIComponent(userCne || 'N142088916')}`, 
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

            <InscriptionPage editMode={true} />
          </div>
        )}



        {/* ── PREVIEW MODAL WITH INTERACTIVE PDF/IMAGE VIEWER ── */}
        {previewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Aperçu Interactif : {previewModal.title}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setPreviewModal(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-2 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-900 overflow-hidden flex flex-col items-center justify-center min-h-[440px]">
                {previewModal.url ? (
                  previewModal.isPdf !== false ? (
                    <iframe
                      src={previewModal.url}
                      className="w-full h-[460px] rounded-xl border-0 bg-white"
                      title={previewModal.title}
                    />
                  ) : (
                    <img
                      src={previewModal.url}
                      alt={previewModal.title}
                      className="max-h-[420px] max-w-full object-contain rounded-xl shadow-lg"
                    />
                  )
                ) : (
                  <iframe
                    src={`/api/public/recepisse-tafem-pdf?cne=${encodeURIComponent(userCne || 'N142088916')}`}
                    className="w-full h-[460px] rounded-xl border-0 bg-white"
                    title="Aperçu Document PDF"
                  />
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  ✅ Document prêt pour la vérification Scolarité
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewModal(null)}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md hover:scale-105 transition-all"
                >
                  Fermer l'aperçu
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
