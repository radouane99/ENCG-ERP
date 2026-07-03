import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'react-hot-toast'

export default function EditUserPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'professor'
  })

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${id}`)
        const user = res.data.data
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
          role: user.role || 'professor'
        }))
      } catch (error) {
        toast.error('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role
      }
      if (formData.password) {
        if (formData.password !== formData.password_confirmation) {
          return toast.error('Les mots de passe ne correspondent pas')
        }
        payload.password = formData.password
        payload.password_confirmation = formData.password_confirmation
      }
      await api.put(`/users/${id}`, payload)
      toast.success('Utilisateur mis à jour avec succès')
      navigate('/admin/users')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  if (loading) return <div className="p-10 text-center text-slate-500">Chargement...</div>

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Modifier l'Utilisateur : {formData.name}</h1>
        </div>
        <Link to="/admin/users" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-xs uppercase tracking-wide">
          Retour à la liste
        </Link>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
        {/* Orange Banner */}
        <div className="bg-gradient-to-r from-[#d97706] to-[#f59e0b] p-10 text-white m-4 rounded-[1.5rem] shadow-md">
          <h2 className="text-3xl font-bold italic mb-2">Mise à jour du Compte</h2>
          <p className="text-white/90 text-sm font-medium">
            Modifiez les informations personnelles ou mettez à jour le rôle et les attributs d'un utilisateur.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <h3 className="text-xl font-bold text-[#0f2863] italic mb-6">Modifier les Paramètres</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nom Complet</label>
              <input 
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Adresse Email</label>
              <input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nouveau Mot de Passe [Optionnel]</label>
              <input 
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Laisser vide pour ne pas modifier"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none placeholder:text-slate-400 placeholder:font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Confirmer Nouveau Mot de Passe</label>
              <input 
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                placeholder="Laisser vide pour ne pas modifier"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none placeholder:text-slate-400 placeholder:font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Rôle de l'utilisateur</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none"
            >
              <option value="super-admin">Super Administrateur</option>
              <option value="institution-admin">Admin Institution</option>
              <option value="director">Directeur</option>
              <option value="department-head">Chef de Département</option>
              <option value="professor">Professeur</option>
              <option value="vacataire">Vacataire</option>
              <option value="finance-officer">Finance</option>
              <option value="hr-officer">Ressources Humaines</option>
              <option value="library-manager">Bibliothécaire</option>
              <option value="discipline-committee">Comité de Discipline</option>
            </select>
          </div>



          <div className="pt-6">
            <button 
              type="submit" 
              className="w-full py-4 bg-[#f59e0b] text-white font-bold rounded-2xl hover:bg-[#d97706] transition-colors text-sm uppercase tracking-wide shadow-lg shadow-orange-500/20"
            >
              Sauvegarder les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
