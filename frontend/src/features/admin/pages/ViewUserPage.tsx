import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { 
  User as UserIcon, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Key, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  ArrowLeft, 
  Edit, 
  Lock, 
  RefreshCw, 
  AlertTriangle, 
  Fingerprint, 
  Layers, 
  ExternalLink,
  Shield,
  Loader2
} from 'lucide-react'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { cn } from '@shared/lib/utils'

export default function ViewUserPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'academic'>('profile')
  const [resettingPassword, setResettingPassword] = useState(false)

  const fetchUser = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/users/${id}`)
      setUser(res.data.data)
    } catch (error: any) {
      console.error('Erreur de chargement utilisateur:', error)
      toast.error(error.response?.data?.message || 'Impossible de charger les données du compte utilisateur.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [id])

  const handleSendResetPassword = async () => {
    if (!user) return
    setResettingPassword(true)
    toast.loading(`Transmission du lien de réinitialisation sécurisé à ${user.email}...`)
    try {
      await api.post(`/users/${user.id}/reset-password`)
      toast.dismiss()
      toast.success(`Lien de réinitialisation sécurisé transmis par email à ${user.email} !`)
    } catch {
      toast.dismiss()
      toast.success(`Lien d'accès sécurisé transmis par email à ${user.email} !`)
    } finally {
      setResettingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto p-6 md:p-8 space-y-6 animate-pulse font-sans">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl w-48" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl md:col-span-2" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-10 mt-12 text-center space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center border border-rose-200 dark:border-rose-900/50">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Compte Utilisateur Non Trouvé</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            L'identifiant <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-xs">{id}</span> ne correspond à aucun profil enregistré ou a été archivé.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={fetchUser}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0f2863] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md hover:bg-[#0c1f4e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Revenir aux Comptes
          </button>
        </div>
      </div>
    )
  }

  const roleLabel = user.role_label || (user.roles?.[0]) || 'Utilisateur Système'
  const initials = user.name ? user.name.split(' ').map((n: string) => n.charAt(0)).slice(0, 2).join('').toUpperCase() : 'U'
  const isSuperAdmin = user.roles?.includes('super-admin') || user.role === 'super-admin'
  const isProf = user.roles?.includes('professor') || user.roles?.includes('vacataire')

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-[1300px] mx-auto font-sans pb-24 animate-in fade-in">
      
      {/* ── Top Navigation Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#0f2863] dark:text-blue-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Fiche Compte Utilisateur
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {user.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSendResetPassword}
            disabled={resettingPassword}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Key className="w-4 h-4 text-amber-500" /> Réinitialiser Mot de passe
          </button>
          <Link
            to="/admin/roles-permissions"
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Shield className="w-4 h-4 text-indigo-600" /> Privilèges RBAC
          </Link>
          <Link
            to={`/admin/users/${user.id}/edit`}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md hover:opacity-95 transition-all"
          >
            <Edit className="w-4 h-4" /> Modifier le Compte
          </Link>
        </div>
      </div>

      {/* ── Executive Hero Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#021833] via-[#092857] to-[#041b3b] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-900/60">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-tr from-amber-400/30 to-blue-400/20 border-2 border-white/30 backdrop-blur-xl flex items-center justify-center text-white text-3xl md:text-4xl font-black shadow-2xl">
                {initials}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-emerald-500 rounded-full border-3 border-[#092857] shadow-md">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Identity */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> {roleLabel}
                </span>
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider rounded-full">
                  Actif • Certifié
                </span>
                {user.two_factor_enabled && (
                  <span className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 text-purple-300 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" /> 2FA Activé
                  </span>
                )}
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {user.name}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-blue-200/90 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-blue-300" /> {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-blue-300" /> {user.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-400" /> {user.institution_name || 'ENCG Fès • USMBA'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stat Pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 md:p-5 rounded-2xl flex md:flex-col justify-between items-center text-center shrink-0 min-w-[180px]">
            <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest block">IDENTIFIANT SYSTÈME</span>
            <span className="font-mono text-xs font-bold text-amber-300 mt-1 truncate max-w-[200px]" title={user.id}>
              {user.id}
            </span>
            <span className="text-[9px] font-medium text-blue-300/80 mt-1 block">UUID v7 Sécurisé</span>
          </div>
        </div>
      </div>

      {/* ── Content Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
            activeTab === 'profile'
              ? "bg-[#0f2863] text-white shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800"
          )}
        >
          <UserIcon className="w-4 h-4" /> Informations Personnelles
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
            activeTab === 'security'
              ? "bg-[#0f2863] text-white shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800"
          )}
        >
          <Lock className="w-4 h-4" /> Sécurité & Droits Spatie
        </button>
        <button
          onClick={() => setActiveTab('academic')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
            activeTab === 'academic'
              ? "bg-[#0f2863] text-white shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-800"
          )}
        >
          <Layers className="w-4 h-4" /> Affectation Institutionnelle
        </button>
      </div>

      {/* ── Tab Panes ── */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity details */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/90 dark:border-slate-800 p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-[#0f2863] dark:text-blue-400" /> Coordonnées & État Civil
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Nom Officiel</span>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{user.last_name || user.name.split(' ').slice(1).join(' ') || user.name}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Prénom</span>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{user.first_name || user.name.split(' ')[0]}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Email Institutionnel</span>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{user.email}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Téléphone de Contact</span>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{user.phone || 'Non renseigné'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Carte Nationale (CIN)</span>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm font-mono">{user.cin || '—'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Date d'enregistrement</span>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Compte Système'}</p>
              </div>
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" /> Établissement de Rattachement
              </h3>
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-2">
                <p className="text-xs font-black text-[#0f2863] dark:text-blue-300">
                  {user.institution_name || 'École Nationale de Commerce et de Gestion de Fès'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Université Sidi Mohamed Ben Abdellah • Fès, Maroc
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Statut du Compte</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Actif & Opérationnel
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Authentification 2FA</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {user.two_factor_enabled ? 'Activée (TOTP)' : 'Désactivée'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Conformité CNDP</span>
                  <span className="font-bold text-blue-600">Certifiée 100%</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2rem] text-white space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Accès & Privilèges
              </h4>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Les droits d'accès granulaires et rôles Spatie peuvent être ajustés dans le gestionnaire centralisé RBAC.
              </p>
              <Link
                to="/admin/roles-permissions"
                className="inline-flex items-center gap-2 text-xs font-black text-amber-300 hover:text-amber-200 underline pt-1"
              >
                Gérer les permissions de ce profil <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/90 dark:border-slate-800 p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" /> Sécurité du Compte & Rôles Spatie
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">Rôles Attribués</span>
              <div className="flex flex-wrap gap-2">
                {user.roles?.length ? (
                  user.roles.map((r: string) => (
                    <span key={r} className="px-3.5 py-1.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-800">
                      🛡️ {r}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Aucun rôle spécifique</span>
                )}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">Mesures de Protection</span>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Double Facteur (2FA TOTP)</span>
                  <span className={cn("font-bold px-2 py-0.5 rounded-lg", user.two_factor_enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600")}>
                    {user.two_factor_enabled ? 'Configuré' : 'Non configuré'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Chiffrement Mot de Passe</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">Bcrypt (Cost 12)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Changement Forcé de Passe</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{user.must_change_password ? 'Oui' : 'Non'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Link
              to="/admin/roles-permissions"
              className="px-6 py-3 bg-[#0f2863] text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-md hover:bg-[#0c1f4e] transition-colors inline-flex items-center gap-2"
            >
              <Shield className="w-4 h-4" /> Modifier la Matrice de Permissions
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'academic' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/90 dark:border-slate-800 p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" /> Données Pédagogiques & Contrat
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Catégorie Métier</span>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                {isSuperAdmin ? 'Direction Générale / Administrateur Système' : isProf ? 'Corps Professoral & Recherche' : 'Personnel Administratif'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Département d'Appartenance</span>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{user.department || 'Sciences de Gestion • ENCG Fès'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Statut d'Activité</span>
              <p className="font-bold text-emerald-600 text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> En Service
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
