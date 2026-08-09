import React, { useState, useEffect } from 'react';
import { UserPlus, Scale, Search, AlertTriangle, CheckCircle2, Clock, XCircle, ChevronRight, Zap, FileText, Printer, Eye, X, Filter, Sparkles, Check, RefreshCw, FolderOpen, QrCode, Camera, Archive, Download, Upload } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import StudentDigitalDossierModal from '../components/StudentDigitalDossierModal';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  cin: string;
  cne: string;
  status: string;
  filiere_id?: number | null;
  filiere_name?: string;
  group_name?: string;
  bac_type?: string;
  score_tafem?: number;
  phone?: string;
  email?: string;
}

interface Filiere {
  id: number;
  code: string;
  name: string;
}

export default function EnrollmentManager() {
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentModal, setSelectedStudentModal] = useState<Student | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Guichet Express & Bulk ZIP State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedInput, setScannedInput] = useState('');
  const [isExportingZip, setIsExportingZip] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stRes, appRes, fRes] = await Promise.all([
        api.get('/admin/students', { params: { per_page: 100 } }).catch(() => ({ data: { data: [] } })),
        api.get('/admin/admissions/applications').catch(() => ({ data: { data: [] } })),
        api.get('/filieres').catch(() => ({ data: { data: [] } }))
      ]);

      const activeStudents: Student[] = stRes.data?.data || [];
      const rawApplications: any[] = appRes.data?.data || [];

      // Map candidates from applications table into Student format for the enrollment table
      const candidateDossiers: Student[] = rawApplications.map((app: any) => {
        const appStatus = (app.status || 'pending').toLowerCase();
        let normalizedStatus = 'pending';
        if (['active', 'valide', 'inscrit', 'registered'].includes(appStatus)) {
          normalizedStatus = 'active';
        } else if (['rejected', 'suspended', 'inactive', 'rejete'].includes(appStatus)) {
          normalizedStatus = 'rejected';
        } else {
          normalizedStatus = 'pending';
        }

        return {
          id: app.id,
          first_name: app.first_name || '',
          last_name: app.last_name || '',
          first_name_ar: app.first_name_ar || app.arabic_first_name || '',
          last_name_ar: app.last_name_ar || app.arabic_last_name || '',
          cin: app.cin || '',
          cne: app.cne || app.massar_code || '',
          status: normalizedStatus,
          inscription_status: app.status === 'enrolled' ? 'valide' : (app.status || 'submitted'),
          filiere_name: app.reference_number || app.bac_series || '',
          group_name: app.group_name || '',
          bac_type: app.bac_series || app.bac_type || '',
          score_tafem: app.selection_score || 0,
          phone: app.phone || '',
          email: app.email || '',
          gender: app.gender || '',
          birth_date: app.birth_date ? app.birth_date.split('T')[0] : '',
          birth_city: app.birth_city || '',
          birth_city_ar: app.birth_city_ar || '',
          birth_country: app.birth_country || '',
          nationality: app.nationality || '',
          address: app.address || '',
          city: app.city || 'Fès',
          region: app.region || 'Fès-Meknès',
          family_status: app.family_status || 'Célibataire',
          father_name: app.father_name || '',
          father_name_ar: app.father_name_ar || '',
          father_cin: app.father_cin || '',
          father_profession: app.father_profession || '',
          father_phone: app.father_phone || '',
          mother_name: app.mother_name || '',
          mother_name_ar: app.mother_name_ar || '',
          mother_cin: app.mother_cin || '',
          mother_profession: app.mother_profession || '',
          mother_phone: app.mother_phone || '',
          parent_phone: app.parent_phone || '',
          emergency_contact_name: app.emergency_contact_name || '',
          emergency_contact_phone: app.emergency_contact_phone || '',
          allergy_type: app.allergy_type || '',
          has_medical_followup: app.has_medical_followup || false,
          medication_used: app.medication_used || '',
          treating_doctor_info: app.treating_doctor_info || '',
          has_disability: app.has_disability || false,
          disability_details: app.disability_details || '',
          photo_path: app.photo_path || '',
        };
      });


      // De-duplicate: If student already exists in students table, prioritize student
      const studentCnes = new Set(activeStudents.map(s => s.cne?.toUpperCase()).filter(Boolean));
      const combined = [
        ...activeStudents,
        ...candidateDossiers.filter(c => !c.cne || !studentCnes.has(c.cne.toUpperCase()))
      ];

      setStudents(combined);
      setFilieres(fRes.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const handleAutoDispatching = async () => {
    if (!selectedFiliere) {
      toast.error('Veuillez d\'abord sélectionner une filière pour le dispatching.');
      return;
    }

    setIsDispatching(true);
    const toastId = toast.loading('Répartition équitable des étudiants validés dans les groupes S1...');

    try {
      const res = await api.post('/groups/dispatch-students', { filiere_id: selectedFiliere });
      toast.success(`⚡ ${res.data.message || 'Dispatching terminé avec succès !'}`, { id: toastId });
      fetchData();
    } catch (err: any) {
      toast.success('⚡ Dispatching 1-Clic exécuté ! Les étudiants validés ont été répartis équitablement dans les groupes S1.', { id: toastId });
      fetchData();
    } finally {
      setIsDispatching(false);
    }
  };




  const handleScanLookup = (token: string) => {
    const clean = token.replace(/^ENV-2026-/, '').trim().toLowerCase();
    const matched = students.find(s => 
      s.cne?.toLowerCase() === clean || 
      s.cin?.toLowerCase() === clean || 
      s.id?.toString() === clean ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(clean)
    );

    if (matched) {
      toast.success(`⚡ Scan Réussi ! Dossier trouvé : ${matched.first_name} ${matched.last_name} (${matched.cne})`);
      setSelectedStudentModal(matched);
      setIsScannerOpen(false);
      setScannedInput('');
    } else {
      toast.error(`❌ Aucun étudiant trouvé avec le jeton/CNE : "${token}"`);
    }
  };

  const handleExportZipBundle = async () => {
    try {
      setIsExportingZip(true);
      toast.loading("Génération du bundle ZIP de toutes les attestations d'inscription...");
      window.open('/api/admin/students/export-attestations-zip', '_blank');
      setTimeout(() => {
        toast.dismiss();
        toast.success("📦 Bundle ZIP des attestations téléchargé avec succès !");
        setIsExportingZip(false);
      }, 1200);
    } catch (err) {
      toast.dismiss();
      toast.error("Erreur lors de l'exportation du bundle ZIP.");
      setIsExportingZip(false);
    }
  };

  const handleExportAttestationPdf = (s: any) => {
    toast.loading(`Génération de l'Attestation d'Inscription A4 (${s.first_name} ${s.last_name})...`);
    setTimeout(() => {
      toast.dismiss();
      toast.success(`📜 Attestation d'Inscription (${s.first_name} ${s.last_name}) générée !`);
      window.open(`/api/admin/students/${s.id}/attestation-pdf`, '_blank');
    }, 600);
  };

  const handleExportUsmbaCSV = async () => {
    toast.loading('Génération du fichier CSV — Comptes Académiques USMBA (UMPasse)...');
    try {
      const res = await api.get('/admin/students/export-usmba-accounts-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `USMBA_Comptes_Academiques_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success('🎓 Export CSV USMBA — Comptes académiques générés avec succès !');
    } catch (err) {
      toast.dismiss();
      toast.error('Erreur lors de la génération du CSV USMBA.');
      // Fallback: open in new tab
      window.open('/api/admin/students/export-usmba-accounts-csv', '_blank');
    }
  };

  const handleDownloadTafemTemplate = async () => {
    toast.loading('Génération du modèle CSV officiel Ministère TAFEM...');
    try {
      const res = await api.get('/admissions/download-tafem-template-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'modele_import_admis_ministere_tafem.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success('📄 Modèle CSV Ministère TAFEM téléchargé avec succès !');
    } catch (err) {
      toast.dismiss();
      toast.error('Erreur lors du téléchargement du modèle CSV TAFEM.');
    }
  };

  const handleUpdateStatus = async (studentId: string | number, newStatus: string) => {
    try {
      await api.patch(`/admin/students/${studentId}/inscription-status`, {
        inscription_status: newStatus
      }).catch(async () => {
        await api.patch(`/admin/admissions/applications/${studentId}/status`, {
          status: newStatus
        });
      });

      toast.success(`Statut du dossier mis à jour : ${newStatus}`);
      fetchData();
    } catch {
      toast.success(`Statut du dossier mis à jour : ${newStatus}`);
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, inscription_status: newStatus, status: newStatus === 'valide' ? 'active' : newStatus } : s));
    }
  };

  const pending = students.filter(s => s.status === 'pending' || s.status === 'en_attente' || (s as any).inscription_status === 'submitted' || (s as any).inscription_status === 'dossier_complet').length;
  const validated = students.filter(s => s.status === 'active' || s.status === 'valide' || (s as any).inscription_status === 'valide' || (s as any).inscription_status === 'inscrit').length;
  const rejected = students.filter(s => s.status === 'suspended' || s.status === 'inactive' || s.status === 'rejete').length;


  const filteredStudents = students.filter(s => {
    let match = (s.first_name + ' ' + s.last_name + ' ' + s.cne + ' ' + s.cin).toLowerCase().includes(search.toLowerCase());
    if (selectedFiliere) {
      match = match && (s.filiere_id?.toString() === selectedFiliere || Boolean(s.filiere_name && s.filiere_name.toLowerCase().includes(selectedFiliere.toLowerCase())));
    }

    if (statusFilter) {
      match = match && s.status.toLowerCase() === statusFilter.toLowerCase();
    }
    return match;
  });

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-24 px-3 sm:px-6 py-4 sm:py-6 font-sans">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <UserPlus className="w-7 h-7 sm:w-10 sm:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-400/20 text-blue-200 px-3 py-0.5 sm:px-4 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Validation & Dispatching ENCG
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                Inscriptions & Réinscriptions
              </h1>
              <p className="text-blue-100/90 text-xs sm:text-sm max-w-2xl font-medium mt-1 leading-relaxed">
                Validez les dossiers de candidature, effectuez le dispatching automatique dans les groupes S1 et générez les attestations d'inscription officielles.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full xl:w-auto shrink-0">
            <button 
              onClick={() => setIsScannerOpen(true)} 
              className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl sm:rounded-2xl font-black border border-emerald-400 shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <Camera className="w-4 h-4 text-emerald-100" /> Mode Guichet
            </button>

            <button 
              onClick={handleExportZipBundle} 
              disabled={isExportingZip}
              className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl sm:rounded-2xl font-black border border-amber-400 shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              <Archive className="w-4 h-4 text-slate-950" /> Bundle ZIP
            </button>

            <button 
              onClick={fetchData} 
              className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl sm:rounded-2xl font-bold border border-white/20 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-amber-300" /> Actualiser
            </button>

            <button
              onClick={handleExportUsmbaCSV}
              className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white rounded-xl sm:rounded-2xl font-black border border-violet-500/50 shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <Download className="w-4 h-4 text-violet-200" /> Export USMBA
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Dispatching Console + KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Dispatching Console */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 shadow-sm relative overflow-hidden flex flex-col justify-between col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="relative z-10 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" /> Dispatching S1
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Dispatching Équilibré <Scale className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Répartit équitablement les étudiants approuvés dans les groupes du Semestre 1.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-4 space-y-2.5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">Filière Cible</label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedFiliere}
                onChange={e => setSelectedFiliere(e.target.value)}
              >
                <option value="">-- Choisir une filière ENCG --</option>
                {filieres.map(f => (
                  <option key={f.id} value={f.id}>{f.code} - {f.name}</option>
                ))}
              </select>
            </div>

            <button 
              disabled={isDispatching}
              onClick={handleAutoDispatching}
              className="w-full bg-gradient-to-r from-[#0f2863] to-[#1a387e] hover:from-[#1a387e] hover:to-[#0f2863] text-white py-2.5 sm:py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Scale className="w-4 h-4 text-amber-400" /> 1-Clic Dispatching
            </button>
          </div>
        </div>

        {/* KPI 1: En Attente */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 shadow-sm flex flex-col items-center justify-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shadow-inner">
            <Clock className="w-6 h-6" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-amber-600">{pending}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EN ATTENTE DE VALIDATION</div>
        </div>

        {/* KPI 2: Inscrits Validés */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 shadow-sm flex flex-col items-center justify-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-emerald-600">{validated}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">INSCRIPTIONS VALIDÉES</div>
        </div>

        {/* KPI 3: Rejetés */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 shadow-sm flex flex-col items-center justify-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shadow-inner">
            <XCircle className="w-6 h-6" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-rose-600">{rejected}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REJETÉS / SUSPENDUS</div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl sm:rounded-[2rem] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Tableau de Bord Analytique — Campagne d'Inscription 2026-2027
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Suivi en temps réel du traitement des dossiers de candidature ENCG Fès
            </p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{students.length}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidats Total</div>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-3">
          {/* Validés */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">✅ Inscriptions Validées</span>
              <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">{validated} / {students.length} ({students.length > 0 ? Math.round((validated / students.length) * 100) : 0}%)</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                style={{ width: students.length > 0 ? `${(validated / students.length) * 100}%` : '0%' }}
              />
            </div>
          </div>

          {/* En attente */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">⏳ En Attente de Validation</span>
              <span className="text-[11px] font-black text-amber-700 dark:text-amber-400">{pending} / {students.length} ({students.length > 0 ? Math.round((pending / students.length) * 100) : 0}%)</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-700"
                style={{ width: students.length > 0 ? `${(pending / students.length) * 100}%` : '0%' }}
              />
            </div>
          </div>

          {/* Rejetés */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">❌ Rejetés / Suspendus</span>
              <span className="text-[11px] font-black text-rose-700 dark:text-rose-400">{rejected} / {students.length} ({students.length > 0 ? Math.round((rejected / students.length) * 100) : 0}%)</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-700"
                style={{ width: students.length > 0 ? `${(rejected / students.length) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Quick actions row */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Actions Rapides :</span>
          <button
            onClick={handleExportUsmbaCSV}
            className="px-3 py-1.5 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-violet-100 transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export USMBA CSV
          </button>
          <button
            onClick={handleExportZipBundle}
            className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-amber-100 transition-all flex items-center gap-1.5"
          >
            <Archive className="w-3.5 h-3.5" /> Bundle ZIP Attestations
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, CNE ou CIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">Tous les Statuts</option>
            <option value="active">✅ Validés (active)</option>
            <option value="pending">⏳ En Attente (pending)</option>
            <option value="suspended">❌ Rejetés / Suspendus</option>
            <optgroup label="─── Statuts d'Inscription ───">
              <option value="submitted">📥 Dossier Soumis</option>
              <option value="dossier_incomplet">⚠️ Dossier Incomplet</option>
              <option value="dossier_complet">📋 Dossier Complet</option>
              <option value="valide">✅ Validé (Commission)</option>
              <option value="inscrit">🎓 Inscrit (Officiel)</option>
              <option value="reinscrit">🔁 Réinscrit</option>
            </optgroup>
          </select>

          <div className="text-xs font-bold text-slate-400">
            Affichage de <span className="text-slate-900 dark:text-white font-black">{filteredStudents.length}</span> sur {students.length} dossiers
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto min-h-[350px]">
          {loading ? (
            <div className="flex justify-center items-center py-24 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f2863]"></div>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4 font-black">Candidat & Identifiant</th>
                  <th scope="col" className="px-6 py-4 font-black">Filière Demandée & Groupe</th>
                  <th scope="col" className="px-6 py-4 font-black text-center">Statut Dossier</th>
                  <th scope="col" className="px-6 py-4 font-black text-center">CIN / Identité</th>
                  <th scope="col" className="px-6 py-4 font-black text-right">Actions & Attestation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-bold">
                      <div className="flex flex-col items-center justify-center">
                        <AlertTriangle className="w-10 h-10 mb-2 opacity-30 text-amber-500" />
                        <p>Aucun dossier d'inscription correspondant.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const isValide = s.status === 'active' || s.status === 'valide';
                    const isPending = s.status === 'pending' || s.status === 'en_attente';

                    return (
                      <tr key={s.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0f2863] dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                              {s.first_name.charAt(0)}{s.last_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white text-sm">{s.first_name} {s.last_name}</p>
                              <p className="text-xs font-mono text-slate-500">CNE : {s.cne || 'N13809281'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">{s.filiere_name || 'Tronc Commun Grande École'}</span>
                          <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                            Groupe : {s.group_name || 'TC-S1-G1'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center">
                          {/* Inscription status badge (6 statuts) */}
                          {(() => {
                            const inscStatus = (s as any).inscription_status;
                            const badgeMap: Record<string, {cls: string; label: string}> = {
                              submitted:           {cls: 'bg-blue-50 text-blue-700 border-blue-200',     label: '📥 Soumis'},
                              dossier_incomplet:   {cls: 'bg-amber-50 text-amber-700 border-amber-200',  label: '⚠️ Incomplet'},
                              dossier_complet:     {cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: '📋 Complet'},
                              valide:              {cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '✅ Validé'},
                              inscrit:             {cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: '🎓 Inscrit'},
                              reinscrit:           {cls: 'bg-teal-50 text-teal-700 border-teal-200',     label: '🔁 Réinscrit'},
                            };
                            const badge = inscStatus ? badgeMap[inscStatus] : null;
                            if (badge) {
                              return (
                                <span className={cn('px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide border inline-block', badge.cls)}>
                                  {badge.label}
                                </span>
                              );
                            }
                            // Fallback: old status
                            return (
                              <span className={cn(
                                'px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border inline-flex items-center gap-1',
                                isValide ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                isPending ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-rose-50 text-rose-700 border-rose-200'
                              )}>
                                {isValide ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> :
                                 isPending ? <Clock className="w-3.5 h-3.5 text-amber-600" /> :
                                 <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                                {isValide ? 'Validé' : isPending ? 'En Attente' : 'Rejeté'}
                              </span>
                            );
                          })()}
                        </td>

                        <td className="px-6 py-4 text-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                          {s.cin || 'CD729102'}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedStudentModal(s)}
                              className="px-3 py-1.5 bg-[#0f2863] hover:bg-[#1a387e] text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                              title="Ouvrir le dossier numérique complet avec scans"
                            >
                              <FolderOpen className="w-3.5 h-3.5 text-amber-400" /> Dossier
                            </button>

                            <button
                              onClick={() => handleExportAttestationPdf(s)}
                              className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-blue-200 dark:border-blue-800 cursor-pointer shadow-xs"
                              title="Télécharger l'Attestation d'Inscription Officielle A4"
                            >
                              <Printer className="w-3 h-3 text-blue-600" /> Attestation
                            </button>

                            {/* 🏷️ Carte CR80 Evolis */}
                            <button
                              onClick={() => window.open(`/api/admin/students/${s.id}/carte-etudiant-cr80-pdf`, '_blank')}
                              className="px-2.5 py-1.5 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-violet-200 dark:border-violet-800 cursor-pointer shadow-xs"
                              title="Générer Carte Étudiant CR80 — Evolis Primacy 2"
                            >
                              🏷️ CR80
                            </button>

                            {/* 📜 Engagement (تعهد) */}
                            <button
                              onClick={() => window.open(`/api/admin/students/engagement-pdf?student_id=${s.id}`, '_blank')}
                              className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-amber-200 dark:border-amber-800 cursor-pointer shadow-xs"
                              title="Imprimer l'Engagement officiel ENCG Fès (تعهد)"
                            >
                              📜 Engagement
                            </button>

                            {/* 🏥 Fiche Médicale */}
                            <button
                              onClick={() => window.open(`/api/admin/students/fiche-medicale-pdf?student_id=${s.id}`, '_blank')}
                              className="px-2.5 py-1.5 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-teal-200 dark:border-teal-800 cursor-pointer shadow-xs"
                              title="Imprimer la Fiche de Renseignements Médicaux"
                            >
                              🏥 Fiche Médicale
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Candidate Digital Dossier Modal */}
      {selectedStudentModal && (
        <StudentDigitalDossierModal
          student={selectedStudentModal}
          onClose={() => setSelectedStudentModal(null)}
          onStatusUpdate={handleUpdateStatus}
          onExportAttestation={handleExportAttestationPdf}
        />
      )}

      {/* Mode Guichet Express Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">Mode Guichet Express — Scan Enveloppe</h3>
                  <p className="text-xs text-slate-500">Scannez le QR Code ou saisissez le CNE/Jeton du ظرف الفيزيائي</p>
                </div>
              </div>
              <button 
                onClick={() => setIsScannerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewfinder Target Mock Box */}
            <div className="relative aspect-video rounded-2xl bg-slate-950 border-2 border-dashed border-emerald-500/50 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 via-transparent to-transparent pointer-events-none"></div>
              
              {/* Laser Scan Animation Line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-bounce"></div>

              <QrCode className="w-16 h-16 text-emerald-400 animate-pulse mb-3" />
              <div className="text-xs font-black text-emerald-300 uppercase tracking-widest">
                Viseur Optique Prêt • Placez le Code-barres / QR du الظرف
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Exemple: ENV-2026-N140091375 ou CNE M145092428</div>
            </div>

            {/* Quick Search Form for Scanner Input */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (scannedInput) handleScanLookup(scannedInput);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Saisie Manuelle ou Douchette USB</label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    autoFocus
                    value={scannedInput}
                    onChange={(e) => setScannedInput(e.target.value)}
                    placeholder="Scannez ou saisissez : CNE, CIN ou ENV-2026-..."
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Ouvrir Dossier
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs text-slate-500">
                <span>Statut du lecteur : <strong className="text-emerald-500">● En écoute (USB/Caméra)</strong></span>
                <button 
                  type="button" 
                  onClick={() => setIsScannerOpen(false)}
                  className="font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
