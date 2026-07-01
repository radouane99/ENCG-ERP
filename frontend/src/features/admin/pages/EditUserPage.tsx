import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cn } from '@shared/lib/utils'

export default function EditUserPage() {
  const { id } = useParams()

  const [formData, setFormData] = useState({
    name: 'Prof. Fatima Zahra Bennani',
    email: 'fatima.bennani@usmba.ac.ma',
    password: '',
    password_confirmation: '',
    role: 'Professor',
    department: 'Génie Civil',
    contract: 'Permanent'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

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

        <form className="p-10 space-y-8">
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
              <option value="Professor">Professor</option>
              <option value="Admin">Administrateur</option>
            </select>
          </div>

          {formData.role === 'Professor' && (
            <div className="border-2 border-emerald-50 rounded-3xl p-8 space-y-6 mt-6 bg-emerald-50/30">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Département d'enseignement</label>
                <input 
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Type de contrat</label>
                <select
                  name="contract"
                  value={formData.contract}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Vacataire">Vacataire</option>
                </select>
              </div>
            </div>
          )}

          <div className="pt-6">
            <button 
              type="button" 
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
