import { useState, useEffect } from 'react'
import { Upload, Plus, Eye, Edit, Trash2, Users2, Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { Link } from 'react-router-dom'
import api from '@shared/lib/api'
import { toast } from 'sonner'

export default function StaffProfessorsPage() {
  const [activeTab, setActiveTab] = useState('TOUS')
  const [professors, setProfessors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        setLoading(true)
        const res = await api.get('/professors')
        setProfessors(res.data.data || res.data)
      } catch (error) {
        console.error('Failed to fetch professors:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfessors()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce professeur ?')) return
    try {
      await api.delete(`/professors/${id}`)
      toast.success('Professeur supprimé')
      setProfessors(prev => prev.filter(p => p.id !== id))
    } catch { toast.error('Erreur lors de la suppression') }
  }

  const filteredUsers = professors.filter(u => {
    if (activeTab === 'TOUS') return true
    if (activeTab === 'ADMINISTRATEURS') return u.type === 'admin'
    if (activeTab === 'PROFESSEURS') return u.type === 'professor' || !u.type
    return true
  })

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
            <Users2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2863] italic">Staff & Professeurs</h1>
            <p className="text-slate-500 mt-1 text-sm">Gestion complète des comptes administratifs et enseignants de l'UPF.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm uppercase tracking-wide">
            <Upload className="w-4 h-4" /> Importer CSV/Excel
          </button>
          <Link to="/admin/users/create" className="flex items-center gap-2 px-4 py-2.5 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a387e] transition-colors text-sm shadow-sm uppercase tracking-wide">
            <Plus className="w-4 h-4" /> Ajouter Utilisateur
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          {['TOUS', 'ADMINISTRATEURS', 'PROFESSEURS'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap tracking-wider",
                activeTab === tab 
                  ? "bg-[#0f2863] text-white shadow-md" 
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="px-8 py-5">Détails Utilisateur</th>
                <th className="px-8 py-5">Type de Compte</th>
                <th className="px-8 py-5">Infos Spécifiques</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
                  <p className="text-slate-400">Chargement...</p>
                </td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-slate-400">Aucun résultat.</td></tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#0f2863] text-white flex items-center justify-center font-bold shrink-0">
                        {(u.first_name || u.name || '?').charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{u.first_name ? `${u.first_name} ${u.last_name}` : u.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border border-green-500 text-green-600">
                      PROFESSEUR
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-700 text-xs">{u.department || u.speciality || 'N/A'}</div>
                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-1">{u.type || 'PERMANENT'}</div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link to={`/admin/users/${u.id}`} className="text-[#0f2863] hover:bg-blue-50 p-2 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link to={`/admin/users/${u.id}/edit`} className="text-amber-500 hover:bg-amber-50 p-2 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
