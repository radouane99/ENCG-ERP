import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '@shared/lib/api'

export default function ViewUserPage() {
  const { id } = useParams()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${id}`)
        setUser(res.data.data)
      } catch (error) {
        console.error('Erreur de chargement', error)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [id])

  if (loading) return <div className="p-10 text-center text-slate-500">Chargement...</div>
  if (!user) return <div className="p-10 text-center text-red-500">Utilisateur non trouvé</div>

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Fiche Profil de {user.name}</h1>
        </div>
        <Link to="/admin/users" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-xs uppercase tracking-wide">
          Retour à la liste
        </Link>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
        {/* Dark Blue Banner */}
        <div className="bg-[#0f2863] p-10 text-white m-4 rounded-[1.5rem] shadow-md flex items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center text-4xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1 block">
              {user.role_label || user.role}
            </span>
            <h2 className="text-3xl font-bold italic mb-1">{user.name}</h2>
            <p className="text-blue-200 text-sm font-medium">
              {user.email}
            </p>
          </div>
        </div>

        <div className="p-10 space-y-8">
          <h3 className="text-xl font-bold text-[#0f2863] italic mb-6">Informations Académiques & Profil</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-6">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nom Complet</span>
              <p className="font-bold text-slate-800 text-lg">{user.name}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Adresse Email</span>
              <p className="font-bold text-slate-800 text-lg">{user.email}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Rôle Système</span>
              <p className="font-bold text-slate-800 text-lg">{user.role_label || user.role}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date d'inscription</span>
              <p className="font-bold text-slate-800 text-lg">{user.joined}</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Département d'enseignement</span>
              <p className="font-bold text-slate-400 text-sm">Non assigné</p>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Type de contrat</span>
              <p className="font-bold text-slate-400 text-sm">Non assigné</p>
            </div>
          </div>

          <div className="pt-8">
            <Link 
              to={`/admin/users/${id}/edit`}
              className="w-full inline-block text-center py-4 bg-[#f59e0b] text-white font-bold rounded-2xl hover:bg-[#d97706] transition-colors text-sm uppercase tracking-wide shadow-lg shadow-orange-500/20"
            >
              Modifier le Profil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
