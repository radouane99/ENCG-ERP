import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Search, Shield, AlertTriangle, Users, BookOpen, User, CheckCircle2, Loader2 } from 'lucide-react'
import { studentsApi } from '@shared/api/students'

export default function StudentsCreditsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await studentsApi.getStudents({ search: search || undefined, page, per_page: 15 })
      setStudents(res.data)
      setTotalPages(res.meta.last_page)
      setTotal(res.meta.total)
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStudents() }, [page])

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2863] italic">Gestion des Crédits & Cas Spéciaux</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium uppercase tracking-wide">Régulation Académique Marocaine, Dérogations et suivi des modules en crédit</p>
          </div>
        </div>
      </div>

      {/* Blue Banner: CADRE RÉGLEMENTAIRE MAROCAIN */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white rounded-[2rem] shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10">
          <ShieldCheck className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-4">
          <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider">
            Cadre Réglementaire Marocain
          </span>
          <h2 className="text-2xl font-bold italic">Règles Nationales de Progression & Cas Exceptionnels</h2>
          <ul className="text-sm text-blue-100 font-medium space-y-2 max-w-4xl list-disc pl-5">
            <li><strong className="text-white">Crédit de Module :</strong> Un étudiant n'ayant pas validé un ou plusieurs modules (note &lt; 10) mais ayant une moyenne générale &ge; 10/20 (sans note éliminatoire &lt; 5) est autorisé à s'inscrire en année supérieure avec crédit des modules restants.</li>
            <li><strong className="text-white">Dérogation Spéciale (Ajournements multiples) :</strong> Un étudiant ne peut normalement pas s'inscrire plus de deux fois dans le même niveau (double ajournement exclu). Une <strong>**Dérogation Administrative**</strong> exceptionnelle peut être accordée par le chef d'établissement pour accorder une <strong>**Dernière Chance**</strong> de réinscription.</li>
          </ul>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Effectif Global</p>
            <p className="text-3xl font-bold text-slate-800">{total || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Étudiants avec Crédits</p>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Dérogations Accordées</p>
            <p className="text-3xl font-bold text-amber-500">0</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Dernière Chance</p>
            <p className="text-3xl font-bold text-red-500">0</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters and Table */}
      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden p-6 md:p-8 space-y-6">
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
              placeholder="Nom, Matricule, CNE..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select className="w-full md:w-64 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option>-- Toutes les Filières --</option>
          </select>
          <select className="w-full md:w-64 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option>-- Tous les statuts --</option>
          </select>
          <button onClick={() => fetchStudents()} className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm shadow-sm">
            Filtrer
          </button>
          <button onClick={() => { setSearch(''); fetchStudents() }} className="w-full md:w-auto px-8 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm">
            Réinitialiser
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Étudiant</th>
                <th className="px-6 py-4">Filière & Niveau</th>
                <th className="px-6 py-4">Statut Dérogatoire</th>
                <th className="px-6 py-4">Crédits Modules</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
                  <p className="text-slate-400">Chargement des étudiants...</p>
                </td></tr>
              ) : students.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                        {(student.first_name || student.name || '?').charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{(student.first_name || '') + ' ' + (student.last_name || student.name || '')}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <User className="w-3 h-3 inline-block mr-1" /> {student.student_number || student.matricule} - CNE: {student.cne || '-'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-800 text-sm mb-1">{student.current_filiere || student.filiere || 'N/A'}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">S{student.current_semester || '?'}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {student.status === 'active' ? 'RÉGULIER / NORMAL' : student.status?.toUpperCase() || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-slate-500 italic">Aucun crédit actif</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Link 
                      to={`/admin/students-credits/${student.id}/manage`}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-xs uppercase tracking-wide"
                    >
                      <Search className="w-4 h-4" /> Gérer Crédits
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
