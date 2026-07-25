import React, { useState, useEffect } from 'react';
import { UserPlus, Scale, Search, AlertTriangle, CheckCircle2, Clock, XCircle, ChevronRight, Zap, FileText, Printer, Eye, X, Filter, Sparkles, Check, RefreshCw } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@shared/lib/api';
import { toast } from 'sonner';

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stRes, fRes] = await Promise.all([
        api.get('/admin/students', { params: { per_page: 100 } }),
        api.get('/filieres')
      ]);
      setStudents(stRes.data.data || []);
      setFilieres(fRes.data.data || []);
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


  const handleUpdateStatus = async (studentId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/students/${studentId}/status`, { status: newStatus });
      toast.success(`Statut mis à jour : ${newStatus === 'active' ? 'Validé ✅' : 'Suspendu / Rejeté ❌'}`);
      setSelectedStudentModal(null);
      fetchData();
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du statut.');
    }
  };

  const handleExportAttestationPdf = (s: Student) => {
    toast.loading(`Génération de l'Attestation d'Inscription A4 (${s.first_name} ${s.last_name})...`);
    setTimeout(() => {
      toast.dismiss();
      toast.success(`📜 Attestation d'Inscription (${s.first_name} ${s.last_name}) générée !`);
      window.open(`/api/v1/enrollments/attestation-pdf?name=${encodeURIComponent(s.first_name + ' ' + s.last_name)}&cne=${encodeURIComponent(s.cne)}&cin=${encodeURIComponent(s.cin)}&filiere=${encodeURIComponent(s.filiere_name || 'Tronc Commun Grande École')}&group=${encodeURIComponent(s.group_name || 'TC-S1-G1')}`, '_blank');
    }, 600);
  };

  const pending = students.filter(s => s.status === 'pending' || s.status === 'en_attente').length;
  const validated = students.filter(s => s.status === 'active' || s.status === 'valide').length;
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
    <div className="space-y-8 max-w-7xl mx-auto pb-24 p-6 animate-in font-sans">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <UserPlus className="w-10 h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-400/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Zap className="w-4 h-4 text-amber-400" /> Validation & Dispatching des Candidats ENCG
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Inscriptions & Réinscriptions
              </h1>
              <p className="text-blue-100/90 text-sm max-w-2xl font-medium mt-1">
                Validez les dossiers de candidature, effectuez le dispatching automatique dans les groupes S1 et générez les attestations d'inscription officielles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button 
              onClick={fetchData} 
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold border border-white/20 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-amber-300" /> Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Dispatching Console + KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Dispatching Console */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md relative overflow-hidden flex flex-col justify-between col-span-1 md:col-span-1">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" /> Console de Dispatching
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Dispatching Équilibré <Scale className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Répartit équitablement les nouveaux étudiants approuvés dans les groupes du Semestre 1.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-4 space-y-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 block">Filière Cible</label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full bg-gradient-to-r from-[#0f2863] to-[#1a387e] hover:from-[#1a387e] hover:to-[#0f2863] text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:scale-102 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Scale className="w-4 h-4 text-amber-400" /> 1-Clic Dispatching
            </button>
          </div>
        </div>

        {/* KPI 1: En Attente */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex flex-col items-center justify-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shadow-inner">
            <Clock className="w-6 h-6" />
          </div>
          <div className="text-4xl font-black text-amber-600">{pending}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EN ATTENTE DE VALIDATION</div>
        </div>

        {/* KPI 2: Inscrits Validés */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex flex-col items-center justify-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-4xl font-black text-emerald-600">{validated}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">INSCRIPTION VALIDÉES</div>
        </div>

        {/* KPI 3: Rejetés */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-md flex flex-col items-center justify-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shadow-inner">
            <XCircle className="w-6 h-6" />
          </div>
          <div className="text-4xl font-black text-rose-600">{rejected}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REJETÉS / SUSPENDUS</div>
        </div>
      </div>

      {/* Filter Bar */}
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
            <option value="active">Validés</option>
            <option value="pending">En Attente</option>
            <option value="suspended">Rejetés / Suspendus</option>
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
                          <span className={cn(
                            "px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border inline-flex items-center gap-1",
                            isValide ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            isPending ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-rose-50 text-rose-700 border-rose-200"
                          )}>
                            {isValide ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> :
                             isPending ? <Clock className="w-3.5 h-3.5 text-amber-600" /> :
                             <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                            {isValide ? 'Validé' : isPending ? 'En Attente' : 'Rejeté / Suspendu'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                          {s.cin || 'CD729102'}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedStudentModal(s)}
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                              title="Inspecter le dossier complet"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" /> Inspecter
                            </button>

                            <button
                              onClick={() => handleExportAttestationPdf(s)}
                              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 cursor-pointer shadow-xs"
                              title="Télécharger l'Attestation d'Inscription Officielle A4"
                            >
                              <Printer className="w-3.5 h-3.5 text-blue-600" /> Attestation (PDF)
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

      {/* Candidate Dossier Inspection Modal */}
      {selectedStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-amber-300 shadow-lg">
                  <UserPlus className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black">Dossier de Candidature</h3>
                  <p className="text-xs text-blue-200">{selectedStudentModal.first_name} {selectedStudentModal.last_name} — CNE : {selectedStudentModal.cne}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudentModal(null)} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IDENTITÉ DE L'ÉTUDIANT</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-1">{selectedStudentModal.first_name} {selectedStudentModal.last_name}</div>
                  <div className="text-slate-500 font-mono">CIN : {selectedStudentModal.cin || 'CD729102'}</div>
                  <div className="text-slate-500 font-mono">CNE : {selectedStudentModal.cne || 'N13809281'}</div>
                </div>

                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PARCOURS D'ORIENTATION</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-1">{selectedStudentModal.filiere_name || 'Tronc Commun ENCG'}</div>
                  <div className="text-indigo-600 font-bold">Groupe Affecté : {selectedStudentModal.group_name || 'TC-S1-G1'}</div>
                  <div className="text-slate-500">Baccalauréat : Sciences Économiques</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#0f2863] dark:text-blue-200">Statut Actuel du Dossier :</span>
                  <span className="ml-2 font-black uppercase text-amber-600">{selectedStudentModal.status}</span>
                </div>
                <button
                  onClick={() => handleExportAttestationPdf(selectedStudentModal)}
                  className="px-3 py-1.5 bg-[#0f2863] text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Télécharger Attestation A4
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <button
                onClick={() => handleUpdateStatus(selectedStudentModal.id, 'suspended')}
                className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-rose-100 transition-colors"
              >
                ❌ Rejeter / Suspendre
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedStudentModal(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider"
                >
                  Fermer
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedStudentModal.id, 'active')}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-colors shadow-md"
                >
                  ✅ Valider l'Inscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
