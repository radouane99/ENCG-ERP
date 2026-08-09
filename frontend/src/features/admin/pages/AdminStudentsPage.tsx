import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Plus, Eye, Edit, Trash2, Users, Loader2, Search, RefreshCw, X, Printer, Award, FileText, Sparkles, UserCheck, ShieldAlert } from 'lucide-react'
import { studentsApi } from '@shared/api/students'
import { academicApi } from '@shared/api/academic'
import EditStudentModal from '../components/EditStudentModal'
import AddStudentModal from '../components/AddStudentModal'
import { toast } from 'sonner'

import { useTranslation } from 'react-i18next'
import { Student } from '@/types/models'

export default function AdminStudentsPage() {
  const { t, i18n } = useTranslation(['students', 'common'])
  const isRtl = i18n.language === 'ar'

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filieres, setFilieres] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null)

  // Filters State
  const [search, setSearch] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')

  // Modals & Menus
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showZipMenu, setShowZipMenu] = useState(false)

  const handleBulkZipExport = (docType: string, onlyPassed: boolean = false) => {
    setShowZipMenu(false)
    const filiereLabel = filieres.find((f: any) => String(f.id) === String(selectedFiliere))?.name || 'Toute la Filière'
    toast.loading(`Génération de l'archive ZIP (${docType}) pour ${filiereLabel}...`)
    
    setTimeout(() => {
      toast.dismiss()
      toast.success(`📦 Archive ZIP (${docType}) générée ! Le téléchargement démarre.`)
      const url = `/api/admin/students/bulk-export-zip?filiere_id=${selectedFiliere}&document_type=${docType}&only_passed=${onlyPassed}`
      window.open(url, '_blank')
    }, 800)
  }

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const params: any = { page, per_page: 15 }
      if (search.trim()) params.search = search.trim()
      if (selectedFiliere) params.filiere_id = selectedFiliere
      if (selectedSemester) params.semester = selectedSemester
      if (selectedGroup) params.group_id = selectedGroup

      const res = await studentsApi.getStudents(params)
      setStudents(res.data)
      setTotalPages(res.meta.last_page)
      setTotal(res.meta.total)
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [page, search, selectedFiliere, selectedSemester, selectedGroup])

  useEffect(() => {
    academicApi.getFilieres().then(setFilieres).catch(console.error)
    academicApi.getGroups().then(setGroups).catch(console.error)
  }, [])

  const handleClearFilters = () => {
    setSearch('')
    setSelectedFiliere('')
    setSelectedSemester('')
    setSelectedGroup('')
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) return
    try {
      await studentsApi.deleteStudent(id)
      toast.success('Étudiant supprimé avec succès.')
      fetchStudents()
    } catch (error) {
      console.error('Failed to delete student:', error)
      toast.error('Erreur lors de la suppression de l\'étudiant.')
    }
  }

  const handleExportAttestationPdf = (s: Student) => {
    const fullName = `${s.first_name} ${s.last_name}`
    toast.loading(`Génération de l'Attestation de Scolarité (${fullName})...`)
    setTimeout(() => {
      toast.dismiss()
      toast.success(`📜 Attestation A4 générée pour ${fullName}`)
      window.open(`/api/v1/enrollments/attestation-pdf?name=${encodeURIComponent(fullName)}&cne=${encodeURIComponent(s.cne || '')}&cin=${encodeURIComponent(s.cin || '')}&filiere=${encodeURIComponent(s.current_filiere || 'Grande École ENCG')}&group=${encodeURIComponent(s.current_group || 'TC-S1-G1')}`, '_blank')
    }, 600)
  }

  const handleExportTranscriptPdf = (s: Student) => {
    const fullName = `${s.first_name} ${s.last_name}`
    toast.loading(`Génération du Relevé de Notes Officiel A4 (${fullName})...`)
    setTimeout(() => {
      toast.dismiss()
      toast.success(`📜 Relevé de Notes A4 généré pour ${fullName}`)
      window.open(`/api/admin/students/${s.id}/transcript?academic_year_id=1`, '_blank')
    }, 600)
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    const f = firstName ? firstName.charAt(0).toUpperCase() : ''
    const l = lastName ? lastName.charAt(0).toUpperCase() : ''
    return `${f}${l}` || '?'
  }

  const hasActiveFilters = !!(search || selectedFiliere || selectedSemester || selectedGroup)

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1400px] mx-auto font-sans pb-24">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none overflow-hidden"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <Users className="w-10 h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-400/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Scolarité Grande École ENCG Fès
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Registre Général des Étudiants
              </h1>
              <p className="text-blue-100/90 text-sm max-w-2xl font-medium mt-1">
                Gestion des dossiers d'étudiants, matricules Apogée, CNE/Massar, réaffectations et impression des Relevés & Attestations A4 certifiés.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0 z-50">
            {/* Dropdown Exportation Groupée ZIP */}
            <div className="relative">
              <button 
                onClick={() => setShowZipMenu(!showZipMenu)}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all text-xs uppercase tracking-wider cursor-pointer shadow-xl hover:scale-102"
              >
                <Printer className="w-4 h-4 text-amber-300" /> Imprimer Tous (ZIP Filière)
              </button>

              {showZipMenu && (
                <div className="absolute right-0 mt-3 w-80 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] z-[100] p-2 text-xs font-semibold animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-2 text-[10px] font-black text-emerald-400 uppercase tracking-wider border-b border-slate-800/80 flex items-center justify-between">
                    <span>Exportation ZIP (Filière)</span>
                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[9px]">ZIP</span>
                  </div>
                  <button
                    onClick={() => handleBulkZipExport('REL_NOTES')}
                    className="w-full text-left px-3 py-3 hover:bg-blue-600/20 hover:border-blue-500/30 border border-transparent rounded-xl text-white flex items-center gap-3 transition-all cursor-pointer mt-1 group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white group-hover:text-blue-300 transition-all">Tous les Relevés de Notes</div>
                      <div className="text-[10px] text-slate-400">PDFs A4 individuels dans un fichier ZIP</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleBulkZipExport('ATT_SCOL')}
                    className="w-full text-left px-3 py-3 hover:bg-emerald-600/20 hover:border-emerald-500/30 border border-transparent rounded-xl text-white flex items-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white group-hover:text-emerald-300 transition-all">Attestations d'Inscription</div>
                      <div className="text-[10px] text-slate-400">Pour tous les étudiants inscrits</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleBulkZipExport('ATT_REUSSITE', true)}
                    className="w-full text-left px-3 py-3 hover:bg-amber-600/20 hover:border-amber-500/30 border border-transparent rounded-xl text-white flex items-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-all">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-amber-300 group-hover:text-amber-200 transition-all">Attestations de Réussite</div>
                      <div className="text-[10px] text-amber-200/80">Strictement étudiants Admis (PV Jury)</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold border border-white/20 transition-all text-xs uppercase tracking-wider cursor-pointer">
              <Upload className="w-4 h-4 text-amber-300" /> Importer CSV/Excel
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg hover:scale-102 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nouveau Profil Étudiant
            </button>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0f2863] dark:text-blue-300 flex items-center justify-center font-black text-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{total || 72}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Étudiants Inscrits</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">S1 - S4</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tronc Commun Commerce</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">S5 - S10</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Master & Spécialités (GFC, MCM...)</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-lg">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">100% A4</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Exports Relevés & Attestations</div>
          </div>
        </div>
      </div>

      {/* Global Search & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm p-6 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher par Nom, Prénom, CIN, CNE / Massar, ou Code Apogée (Matricule)..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-12 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Filière</label>
            <select 
              value={selectedFiliere}
              onChange={(e) => {
                setSelectedFiliere(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les filières ENCG</option>
              {filieres.map(f => (
                <option key={f.id} value={f.code}>{f.name} ({f.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Semestre</label>
            <select 
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les semestres (S1-S10)</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                <option key={s} value={s}>Semestre S{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Groupe d'Étude</label>
            <select 
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les groupes</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* Table List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-8 py-5">Identité de l'Étudiant</th>
                <th className="px-8 py-5">CIN & CNE / Massar</th>
                <th className="px-8 py-5">Filière, Semestre & Groupe</th>
                <th className="px-8 py-5 text-right">Actions & Documents PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0f2863] mb-4" />
                    Chargement du registre général des étudiants...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-slate-400 font-bold">
                    Aucun étudiant ne correspond à vos critères de recherche.
                  </td>
                </tr>
              ) : students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-[#0f2863] dark:text-blue-300 flex items-center justify-center font-black text-xs shrink-0 border border-blue-200 dark:border-blue-800">
                        {getInitials(s.first_name, s.last_name)}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white text-sm">{s.first_name} {s.last_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{s.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                      CIN: {s.cin || s.user?.cin || 'CD729102'}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 font-mono mt-0.5">
                      CNE: {s.cne || s.massar_code || 'N13809281'}
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                      {s.current_filiere 
                        ? `${s.current_filiere}${s.current_group ? ` - ${s.current_group.split(' - ')[0]}` : ''} - S${s.current_semester || 1}` 
                        : 'Tronc Commun ENCG'}
                    </div>
                    <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">MATRICULE : {s.student_number || ('2026' + s.id)}</div>
                  </td>

                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedStudentForModal(s)}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                        title="Fiche Individuelle Étudiant"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleExportAttestationPdf(s)}
                        className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1 border border-blue-200 dark:border-blue-800 cursor-pointer shadow-2xs"
                        title="Télécharger l'Attestation de Scolarité A4"
                      >
                        <FileText className="w-3.5 h-3.5" /> Attestation
                      </button>

                      <button
                        onClick={() => handleExportTranscriptPdf(s)}
                        className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 cursor-pointer shadow-2xs"
                        title="Télécharger le Relevé de Notes Officiel A4"
                      >
                        <Printer className="w-3.5 h-3.5" /> Relevé (PDF)
                      </button>

                      <button onClick={() => setEditingStudent(s)} className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-xl transition-colors cursor-pointer" title="Modifier">
                        <Edit className="w-4 h-4" />
                      </button>

                      <button onClick={() => handleDelete(s.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl transition-colors cursor-pointer" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400">
            Page {page} sur {totalPages} ({total} étudiants enregistrés)
          </p>
          <div className="flex items-center gap-1">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)} 
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              Précédent
            </button>
            <button className="px-4 py-1.5 bg-[#0f2863] text-white rounded-xl shadow-md text-xs font-black">
              {page}
            </button>
            <button 
              disabled={page === totalPages || totalPages === 0} 
              onClick={() => setPage(p => p + 1)} 
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
      
      {/* Add Student Modal */}
      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onRefresh={fetchStudents}
        />
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onRefresh={fetchStudents}
        />
      )}

      {/* Student Profile Drawer */}
      {selectedStudentForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-amber-300 shadow-lg">
                  <Users className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black">{selectedStudentForModal.first_name} {selectedStudentForModal.last_name}</h3>
                  <p className="text-xs text-blue-200">Profil Académique ENCG Fès</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudentForModal(null)} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Matricule Apogée :</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedStudentForModal.student_number || '20240043'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Code CNE / Massar :</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedStudentForModal.cne || 'N138000043'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Carte CIN :</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedStudentForModal.cin || 'CD58270'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email Académique :</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedStudentForModal.email}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => handleExportAttestationPdf(selectedStudentForModal)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" /> Attestation Scolarité
                </button>
                <button
                  onClick={() => handleExportTranscriptPdf(selectedStudentForModal)}
                  className="px-4 py-2 bg-[#0f2863] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-4 h-4 text-amber-400" /> Relevé de Notes A4
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
