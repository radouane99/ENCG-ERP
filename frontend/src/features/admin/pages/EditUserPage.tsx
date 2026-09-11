import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Save, 
  User as UserIcon, 
  Key, 
  ShieldCheck 
} from 'lucide-react'
import api from '@shared/lib/api'
import { toast } from 'sonner'

export default function EditUserPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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
        setLoading(true)
        const res = await api.get(`/users/${id}`)
        const user = res.data.data
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
          role: user.roles?.[0] || user.role || 'professor'
        }))
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors du chargement de l\'utilisateur')
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
    setSubmitting(true)
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role
      }
      if (formData.password) {
        if (formData.password !== formData.password_confirmation) {
          setSubmitting(false)
          return toast.error('Les mots de passe saisis ne correspondent pas')
        }
        payload.password = formData.password
        payload.password_confirmation = formData.password_confirmation
      }
      await api.put(`/users/${id}`, payload)
      toast.success('Profil et habilitations mis à jour avec succès !')
      navigate(`/admin/users/${id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto p-6 md:p-8 space-y-6 animate-pulse font-sans">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl w-48" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-[1000px] mx-auto font-sans pb-24 animate-in fade-in">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/admin/users/${id}`}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0f2863] dark:text-blue-400">
              Édition Compte
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Modifier le Profil de {formData.name}
            </h1>
          </div>
        </div>

        <Link
          to={`/admin/users/${id}`}
          className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 transition-colors text-xs uppercase tracking-wide w-fit"
        >
          Annuler & Revenir
        </Link>
      </div>

      {/* ── Header Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#021833] via-[#092857] to-[#041b3b] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-900/60 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-400/30">
          <ShieldCheck className="w-3.5 h-3.5" /> Administration des Utilisateurs
        </div>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
          Mise à Jour des Coordonnées & Rôle
        </h2>
        <p className="text-blue-200/90 text-xs md:text-sm font-medium max-w-2xl">
          Modifiez l'identité, l'adresse de messagerie académique et les habilitations système de cet utilisateur.
        </p>
      </div>

      {/* ── Form Card ── */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-8">
        <div className="space-y-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <UserIcon className="w-5 h-5 text-[#0f2863] dark:text-blue-400" /> Identité & Connexion
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                Nom Complet Officiel
              </label>
              <div className="relative">
                <input 
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex : Pr. Mohammed ALAOUI"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 px-4 py-3.5 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                Adresse Email Institutionnelle
              </label>
              <div className="relative">
                <input 
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nom.prenom@encg-fes.ac.ma"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 px-4 py-3.5 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Key className="w-5 h-5 text-amber-500" /> Sécurité & Mot de Passe <span className="text-xs font-medium text-slate-400 font-sans">(Optionnel)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                Nouveau Mot de Passe
              </label>
              <input 
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Laisser vide pour conserver le mot de passe actuel"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 px-4 py-3.5 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                Confirmation du Mot de Passe
              </label>
              <input 
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                placeholder="Répéter le nouveau mot de passe"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 px-4 py-3.5 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-5 h-5 text-indigo-600" /> Rôle Institutionnel Spatie
          </h3>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
              Affectation du Rôle Métier
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 px-4 py-3.5 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            >
              <option value="super-admin">🛡️ Super Administrateur (Accès Total)</option>
              <option value="institution-admin">🏛️ Administrateur Institutionnel (ENCG)</option>
              <option value="director">🎓 Directeur / Direction Pédagogique</option>
              <option value="department-head">👨‍🏫 Chef de Département Académique</option>
              <option value="filiere-head">📋 Coordonnateur de Filière</option>
              <option value="professor">👨‍🏫 Professeur Permanent (PES / PH / PA)</option>
              <option value="vacataire">📝 Enseignant Vacataire (Art. 73 CGI)</option>
              <option value="scolarite-agent">📑 Agent de Scolarité</option>
              <option value="finance-officer">💰 Responsable Financier / DAF</option>
              <option value="hr-officer">👥 Responsable Ressources Humaines</option>
              <option value="library-manager">📚 Responsable Médiathèque / Bibliothèque</option>
              <option value="discipline-committee">⚖️ Comité de Discipline</option>
              <option value="student">🎓 Étudiant ENCG</option>
            </select>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-end gap-3">
          <Link
            to={`/admin/users/${id}`}
            className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs uppercase tracking-wider text-center transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 bg-gradient-to-r from-[#0f2863] to-blue-900 hover:opacity-95 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Enregistrement en cours...' : 'Enregistrer les Modifications'}
          </button>
        </div>
      </form>
    </div>
  )
}
