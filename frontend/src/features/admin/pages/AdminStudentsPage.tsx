import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Plus, Eye, Edit, Trash2, Users, Loader2, X, Save } from 'lucide-react'
import { studentsApi } from '@shared/api/students'
import { academicApi } from '@shared/api/academic'
import EditStudentModal from '../components/EditStudentModal'

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  current_filiere: string;
  current_semester: number;
  student_number: string;
  cne: string;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filieres, setFilieres] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await studentsApi.getStudents({ page, per_page: 15 })
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
  }, [page])

  useEffect(() => {
    academicApi.getFilieres().then(setFilieres).catch(console.error)
    academicApi.getGroups().then(setGroups).catch(console.error)
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet étudiant ?')) return
    try {
      await studentsApi.deleteStudent(id)
      fetchStudents()
    } catch (error) {
      console.error('Failed to delete student:', error)
    }
  }

  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : '?'

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2863] italic">Registre des Étudiants</h1>
            <p className="text-slate-500 mt-1 text-sm">Gestion complète des profils étudiants, matricules et classes.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm uppercase tracking-wide">
            <Upload className="w-4 h-4" /> Importer CSV/Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a387e] transition-colors text-sm shadow-sm uppercase tracking-wide">
            <Plus className="w-4 h-4" /> Ajouter Étudiant
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1 max-w-sm">
          <label className="block text-xs font-bold text-slate-500 mb-2">Filtrer par Filière</label>
          <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700">
            <option value="">Toutes les filières</option>
            {filieres.map(f => (
              <option key={f.id} value={f.code}>{f.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 max-w-sm">
          <label className="block text-xs font-bold text-slate-500 mb-2">Filtrer par Groupe</label>
          <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700">
            <option value="">Tous les groupes</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="px-8 py-5">Détails Étudiant</th>
                <th className="px-8 py-5">Matricule & Classe</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                    Chargement des étudiants...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-slate-400">Aucun étudiant trouvé.</td>
                </tr>
              ) : students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                        {getInitials(s.first_name)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{s.first_name} {s.last_name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-700 text-xs mb-1">{s.current_filiere ? `${s.current_filiere} - S${s.current_semester}` : 'Non affecté'}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MATRICULE: {s.student_number}</div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link to={`/admin/students/${s.id}`} className="text-[#0f2863] hover:bg-blue-50 p-2 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button onClick={() => setEditingStudent(s)} className="text-amber-500 hover:bg-amber-50 p-2 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
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
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 text-xs font-medium disabled:opacity-50">&lt;</button>
            <button className="px-3 py-1.5 bg-[#0f2863] text-white rounded-lg shadow-sm text-xs font-bold">{page}</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 text-xs font-medium disabled:opacity-50">&gt;</button>
          </div>
        </div>
      </div>
      
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
