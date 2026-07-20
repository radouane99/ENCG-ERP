import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Plus, Eye, Edit, Trash2, Users, Loader2, Search, RefreshCw, X } from 'lucide-react'
import { studentsApi } from '@shared/api/students'
import { academicApi } from '@shared/api/academic'
import EditStudentModal from '../components/EditStudentModal'
import AddStudentModal from '../components/AddStudentModal'

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

  // Filters State
  const [search, setSearch] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')

  // Modals
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

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
      fetchStudents()
    } catch (error) {
      console.error('Failed to delete student:', error)
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    const f = firstName ? firstName.charAt(0).toUpperCase() : ''
    const l = lastName ? lastName.charAt(0).toUpperCase() : ''
    return `${f}${l}` || '?'
  }

  const hasActiveFilters = !!(search || selectedFiliere || selectedSemester || selectedGroup)

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-[#0f2863] shrink-0 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2863] italic">Registre des Étudiants</h1>
            <p className="text-slate-500 mt-1 text-sm">Gestion complète des profils étudiants, matricules, CNE/Massar, CIN et filières.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-xs uppercase tracking-wide">
            <Upload className="w-4 h-4" /> Importer CSV/Excel
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a387e] transition-colors text-xs shadow-sm uppercase tracking-wide"
          >
            <Plus className="w-4 h-4" /> Ajouter Étudiant
          </button>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher un étudiant par Nom, Prénom, CIN, CNE / Massar, ou Code Apogée (Matricule)..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-12 pr-10 py-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
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
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-slate-500 mb-2">Filtrer par Filière</label>
          <select 
            value={selectedFiliere}
            onChange={(e) => {
              setSelectedFiliere(e.target.value)
              setPage(1)
            }}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
          >
            <option value="">Toutes les filières</option>
            {filieres.map(f => (
              <option key={f.id} value={f.code}>{f.name} ({f.code})</option>
            ))}
          </select>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-slate-500 mb-2">Filtrer par Semestre</label>
          <select 
            value={selectedSemester}
            onChange={(e) => {
              setSelectedSemester(e.target.value)
              setPage(1)
            }}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
          >
            <option value="">Tous les semestres</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
              <option key={s} value={s}>Semestre {s}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-slate-500 mb-2">Filtrer par Groupe</label>
          <select 
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value)
              setPage(1)
            }}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
          >
            <option value="">Tous les groupes</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold flex items-center gap-2 shrink-0 h-[46px]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Réinitialiser
          </button>
        )}
      </div>

      {/* Table List */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="px-8 py-5">Détails Étudiant</th>
                <th className="px-8 py-5">CIN & CNE / Massar</th>
                <th className="px-8 py-5">Matricule & Classe</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                    Chargement des étudiants...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 font-medium">
                    Aucun étudiant ne correspond à vos critères de recherche.
                  </td>
                </tr>
              ) : students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        {getInitials(s.first_name, s.last_name)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{s.first_name} {s.last_name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-xs font-bold text-slate-700">
                      CIN: {s.cin || s.user?.cin || '—'}
                    </div>
                    <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                      CNE/Massar: {s.cne || s.massar_code || '—'}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-700 text-xs mb-1">
                      {s.current_filiere 
                        ? `${s.current_filiere}${s.current_group ? ` - ${s.current_group.split(' - ')[0]}` : ''} - S${s.current_semester}` 
                        : 'Non affecté'}
                    </div>
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">MATRICULE: {s.student_number}</div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/students/${s.id}`} className="text-[#0f2863] hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Voir profil">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button onClick={() => setEditingStudent(s)} className="text-amber-500 hover:bg-amber-50 p-2 rounded-lg transition-colors" title="Modifier">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Supprimer">
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
        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-400">
            Page {page} sur {totalPages} (Total: {total} étudiants)
          </p>
          <div className="flex items-center gap-1">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)} 
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 text-xs font-medium disabled:opacity-50"
            >
              &lt;
            </button>
            <button className="px-3 py-1.5 bg-[#0f2863] text-white rounded-lg shadow-sm text-xs font-bold">
              {page}
            </button>
            <button 
              disabled={page === totalPages || totalPages === 0} 
              onClick={() => setPage(p => p + 1)} 
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 text-xs font-medium disabled:opacity-50"
            >
              &gt;
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
    </div>
  )
}
