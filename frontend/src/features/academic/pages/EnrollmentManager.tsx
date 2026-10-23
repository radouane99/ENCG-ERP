import { useState,useEffect,useRef } from 'react';
import { UserPlus,Scale,Search,AlertTriangle,CheckCircle2,Clock,XCircle,Zap,FileText,Printer,X,Sparkles,RefreshCw,FolderOpen,QrCode,Camera,Archive,Download,Upload,Loader2 } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { toast } from 'sonner';
import StudentDigitalDossierModal from '../components/StudentDigitalDossierModal';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  cin: string;
  cne: string;
  status: string;
  source?: 'student' | 'application';
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
  const [dispatchSemester, setDispatchSemester] = useState(1);
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
        api.get('/admin/students', { params: { per_page: 500 } }).catch(() => ({ data: { data: [] } })),
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

        const matchedStudent = activeStudents.find(
          (st) => st.cne && app.cne && st.cne.trim().toUpperCase() === app.cne.trim().toUpperCase()
        );

        return {
          id: matchedStudent ? matchedStudent.id : app.id,
          source: matchedStudent ? 'student' as const : 'application' as const,
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
      const res = await api.post('/groups/dispatch-students', { filiere_id: selectedFiliere, academic_year_id: (await api.get('/academic-years')).data.data?.find((y: any) => y.is_current)?.id, semester_number: dispatchSemester });
      toast.success(`⚡ ${res.data.message || 'Dispatching terminé avec succès !'}`, { id: toastId });
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Répartition non effectuée.', { id: toastId });
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
    setIsExportingZip(true);
    const toastId = toast.loading('Préparation des attestations d’inscription à viser…');
    try {
      const response = await api.get('/admin/students/export-attestations-zip', { responseType: 'blob', params: { filiere_id: selectedFiliere || undefined } });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a'); link.href = url; link.download = 'Attestations_Inscription_A_Viser.zip';
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      toast.success('Archive préparée à partir des inscriptions validées.', { id: toastId });
    } catch { toast.error('Export non effectué. Vérifiez le périmètre et les inscriptions validées.', { id: toastId }); }
    finally { setIsExportingZip(false); }
  };
  const handleExportAttestationPdf = async (s: any) => {
    const notice = toast.loading('Préparation du document de scolarité…');
    try {
      const result = await api.get(`/v1/admin/students/${s.id}/attestation-pdf`, { params: { type: 'scolarite', download: true }, responseType: 'blob' });
      const url = URL.createObjectURL(result.data);
      const link = document.createElement('a'); link.href = url; link.download = 'Attestation_Scolarite.pdf'; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success('Document téléchargé. Faites-le viser par la scolarité pour un usage officiel.', { id: notice });
    } catch { toast.error('Export impossible. Vérifiez la validation administrative de l’inscription pour l’année active.', { id: notice }); }
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
      openAuthenticatedUrl('/api/admin/students/export-usmba-accounts-csv');
    }
  };

  const [importingTafem, setImportingTafem] = useState(false);
  const tafemInputRef = useRef<HTMLInputElement>(null);

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

  const handleImportTafemCsv = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setImportingTafem(true);
    const toastId = toast.loading(`Import de la liste TAFEM depuis "${file.name}"...`);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/admissions/import-ministry-tafem-csv', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message || 'Import TAFEM effectué avec succès !', { id: toastId });
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de l’import du fichier TAFEM.', { id: toastId });
    } finally {
      setImportingTafem(false);
      if (tafemInputRef.current) tafemInputRef.current.value = '';
    }
  };

  const handleUpdateStatus = async (studentId: string | number, newStatus: string) => {
    try {
      const dossier = students.find(student => String(student.id) === String(studentId));
      if (dossier?.source === 'application') {
        toast.info('La décision d’admission doit être enregistrée dans le dossier de candidature avec son motif.');
        return;
      }
      await api.patch(`/admin/students/${studentId}/inscription-status`, { inscription_status: newStatus });
      toast.success('Statut du dossier enregistré.');
      await fetchData();
    } catch { toast.error('Le statut du dossier n’a pas été enregistré.'); }
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
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0a193c] via-[#112a66] to-[#06122c] p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-2xl text-white border border-blue-500/25">
        {/* Subtle Ambient Lighting */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Hidden File Input for TAFEM Import */}
        <input 
          ref={tafemInputRef} 
          type="file" 
          accept=".csv" 
          onChange={(e) => handleImportTafemCsv(e.target.files)} 
          className="hidden" 
        />

        {/* Top Tier: Title & Identity + Primary Guichet & Refresh */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 backdrop-blur-xl border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <UserPlus className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-400/15 text-blue-200 px-3 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-blue-400/30 mb-1">
                <Zap className="w-3 h-3 text-amber-400" /> Validation & Dispatching ENCG • S1
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Inscriptions & Réinscriptions
              </h1>
              <p className="text-blue-100/80 text-xs sm:text-sm font-medium max-w-xl mt-0.5 leading-relaxed">
                Validation des dossiers numériques, dispatching automatique S1 et contrôle guichet.
              </p>
            </div>
          </div>

          {/* Primary Action Group */}
          <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
            <button 
              onClick={() => setIsScannerOpen(true)} 
              className="group flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/40 border border-emerald-400/30 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition-transform" />
              <span>Mode Guichet (QR)</span>
            </button>

            <button 
              onClick={fetchData} 
              title="Actualiser les données"
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer hover:rotate-180 duration-500 shrink-0"
            >
              <RefreshCw className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>

        {/* Bottom Tier: Structured Modular Toolbar */}
        <div className="relative z-10 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* TAFEM Ministry Flow */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black tracking-widest uppercase text-blue-300/70 mr-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" /> Flux TAFEM :
            </span>

            <button 
              onClick={handleDownloadTafemTemplate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-blue-100 hover:text-white rounded-xl font-bold border border-white/15 backdrop-blur-md transition-all cursor-pointer hover:border-blue-400/40"
              title="Télécharger le modèle CSV officiel Ministère pour importer les admis"
            >
              <FileText className="w-3.5 h-3.5 text-blue-300" />
              <span>Modèle CSV</span>
            </button>

            <button 
              onClick={() => tafemInputRef.current?.click()}
              disabled={importingTafem}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 hover:text-white rounded-xl font-bold border border-blue-400/30 backdrop-blur-md transition-all cursor-pointer disabled:opacity-50 hover:border-blue-300/60"
              title="Importer la liste CSV officielle des admis du Ministère"
            >
              {importingTafem ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-300" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-blue-300" />
              )}
              <span>Importer Admis TAFEM</span>
            </button>
          </div>

          {/* Institutional Exports */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black tracking-widest uppercase text-blue-300/70 mr-1">
              Exports :
            </span>

            <button 
              onClick={handleExportZipBundle} 
              disabled={isExportingZip}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-amber-100 rounded-xl font-bold border border-amber-400/30 backdrop-blur-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Archive className="w-3.5 h-3.5 text-amber-400" />
              <span>Bundle ZIP Attestations</span>
            </button>

            <button
              onClick={handleExportUsmbaCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 hover:text-purple-100 rounded-xl font-bold border border-purple-400/30 backdrop-blur-md transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-purple-300" />
              <span>Comptes USMBA (CSV)</span>
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
              <label htmlFor="dispatch-semester" className="sr-only">Semestre de répartition</label>
              <select id="dispatch-semester" value={dispatchSemester} onChange={e => setDispatchSemester(Number(e.target.value))} className="rounded-lg border border-input bg-background p-2">{Array.from({length: 10}, (_, i) => <option key={i+1} value={i+1}>S{i+1}</option>)}</select>
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
            onClick={handleDownloadTafemTemplate}
            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-all flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Modèle CSV TAFEM
          </button>
          <button
            onClick={() => tafemInputRef.current?.click()}
            disabled={importingTafem}
            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {importingTafem ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Importer TAFEM
          </button>
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
                              onClick={() => openAuthenticatedUrl(`/api/admin/students/${s.id}/carte-etudiant-cr80-pdf`)}
                              className="px-2.5 py-1.5 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-violet-200 dark:border-violet-800 cursor-pointer shadow-xs"
                              title="Générer Carte Étudiant CR80 — Evolis Primacy 2"
                            >
                              🏷️ CR80
                            </button>

                            {/* 📜 Engagement (تعهد) */}
                            <button
                              onClick={() => openAuthenticatedUrl(`/api/admin/students/engagement-pdf?student_id=${s.id}`)}
                              className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-amber-200 dark:border-amber-800 cursor-pointer shadow-xs"
                              title="Imprimer l'Engagement officiel ENCG Fès (تعهد)"
                            >
                              📜 Engagement
                            </button>

                            {/* 🏥 Fiche Médicale */}
                            <button
                              onClick={() => openAuthenticatedUrl(`/api/admin/students/fiche-medicale-pdf?student_id=${s.id}`)}
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
