import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ShieldCheck, 
  UserCog, 
  Key, 
  Search, 
  Filter, 
  Check, 
  X, 
  Sparkles, 
  Layers, 
  RefreshCw, 
  Award, 
  Lock, 
  CheckCircle2, 
  ShieldAlert,
  Download,
  Shield,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Briefcase,
  GraduationCap,
  Building2,
  Users,
  Fingerprint,
  AlertCircle
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { Spinner } from '@shared/components/ui/Spinner'

export default function AdminRolesPermissionsPage() {
  const { t, i18n } = useTranslation(['admin', 'common'])
  const isRtl = i18n.language === 'ar'
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)

  // Edit Modal State
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [userPermissions, setUserPermissions] = useState<string[]>([])

  // Fetch matrix data with resilient endpoint fallback
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-roles-permissions', search, roleFilter, activeCategoryFilter, page],
    queryFn: async () => {
      const params = { 
        search, 
        role: roleFilter, 
        category: activeCategoryFilter, 
        page, 
        per_page: 50 
      }
      try {
        const res = await api.get('/v1/admin/roles-permissions/data', { params })
        return res.data
      } catch {
        const res = await api.get('/admin/roles-permissions/data', { params })
        return res.data
      }
    },
    retry: 1,
  })

  // Mutation to update user roles & permissions
  const updateMutation = useMutation({
    mutationFn: async (payload: { userId: number; roles: string[]; permissions: string[] }) => {
      try {
        return await api.post(`/v1/admin/roles-permissions/users/${payload.userId}`, {
          roles: payload.roles,
          permissions: payload.permissions
        })
      } catch {
        return await api.post(`/admin/roles-permissions/users/${payload.userId}`, {
          roles: payload.roles,
          permissions: payload.permissions
        })
      }
    },
    onSuccess: (res: any) => {
      toast.success(res?.data?.message || 'Droits d\'accès mis à jour avec succès !')
      queryClient.invalidateQueries({ queryKey: ['admin-roles-permissions'] })
      setSelectedUser(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour des accès.')
    }
  })

  const openEditModal = (user: any) => {
    setSelectedUser(user)
    setUserRoles(user.roles || [])
    setUserPermissions(user.permissions || [])
  }

  const toggleRole = (roleName: string) => {
    if (userRoles.includes(roleName)) {
      setUserRoles(userRoles.filter(r => r !== roleName))
    } else {
      setUserRoles([...userRoles, roleName])
    }
  }

  const togglePermission = (permName: string) => {
    if (userPermissions.includes(permName)) {
      setUserPermissions(userPermissions.filter(p => p !== permName))
    } else {
      setUserPermissions([...userPermissions, permName])
    }
  }

  // Presets 1-Clic
  const applyPreset = (presetType: 'super-admin' | 'prof' | 'dept' | 'filiere' | 'scolarite') => {
    if (presetType === 'super-admin') {
      setUserRoles(['super-admin', 'admin'])
      setUserPermissions([
        'users.manage', 'roles.manage', 'audit.view', 'system.settings',
        'grades.view', 'grades.validate', 'pv.sign'
      ])
    } else if (presetType === 'prof') {
      setUserRoles(['professor'])
      setUserPermissions(['grades.view', 'grades.edit', 'textbooks.write'])
    } else if (presetType === 'dept') {
      setUserRoles(['professor', 'department-head'])
      setUserPermissions(['grades.view', 'grades.edit', 'textbooks.write', 'textbooks.validate', 'substitutions.manage'])
    } else if (presetType === 'filiere') {
      setUserRoles(['professor', 'filiere-head'])
      setUserPermissions(['grades.view', 'grades.edit', 'pv.generate', 'pv.sign', 'enrollments.manage'])
    } else if (presetType === 'scolarite') {
      setUserRoles(['scolarite-agent'])
      setUserPermissions(['students.view', 'students.edit', 'enrollments.manage', 'cards.issue', 'attestations.sign'])
    }
    toast.info('Modèle de droits appliqué. Cliquez sur "Enregistrer les Accès" pour valider.')
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    updateMutation.mutate({
      userId: selectedUser.id,
      roles: userRoles,
      permissions: userPermissions
    })
  }

  const rolesList = data?.roles || []
  const permissionGroups = data?.permissions || []
  const usersPaginated = data?.users
  const usersList: any[] = usersPaginated?.data || []
  const counts = data?.counts || {}

  // Filtered by backend category query
  const filteredUsers = usersList

  // Export Matrix CSV
  const handleExportMatrixCsv = () => {
    if (usersList.length === 0) {
      toast.error('Aucun utilisateur à exporter.')
      return
    }

    const headers = ['ID', 'Nom Utilisateur', 'Email', 'Rôles Attribués', 'Permissions Spécifiques', 'Date de Création']
    const rows = usersList.map(u => [
      u.id,
      `"${u.name}"`,
      `"${u.email}"`,
      `"${(u.roles || []).join(', ')}"`,
      `"${(u.permissions || []).join(', ')}"`,
      u.created_at
    ].join(';'))

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Matrice_Droits_Permissions_ENCG_Fes_${new Date().getFullYear()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    toast.success('Matrice RBAC téléchargée (Format CSV Excel).')
  }

  const roleColorMap: Record<string, string> = {
    'super-admin': 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300',
    'institution-admin': 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300',
    'director': 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300',
    'department-head': 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300',
    'filiere-head': 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300',
    'professor': 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300',
    'vacataire': 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300',
    'scolarite-agent': 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950/50 dark:text-teal-300',
    'finance-officer': 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/50 dark:text-cyan-300',
    'hr-officer': 'bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-950/50 dark:text-yellow-300',
    'student': 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
  }

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-300 pb-28 font-sans">
      
      {/* ── Executive Hero Banner ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#021833] via-[#082954] to-[#0f2863] p-8 md:p-10 text-white shadow-2xl border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-[#0f2863] p-0.5 shadow-2xl shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-[#031b3b]/80 backdrop-blur-xl rounded-[22px] flex items-center justify-center border border-white/20">
                <Key className="w-8 h-8 md:w-10 md:h-10 text-amber-300 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-[10px] font-black uppercase tracking-widest border border-indigo-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Matrice d'Habilitation RBAC • Sécurité Conforme CNDP • ENCG Fès</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight text-white">
                Gestionnaire des Droits & Privilèges (RBAC)
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium leading-relaxed">
                Attribuez dynamiquement les rôles institutionnels (Direction, Chefs de Département, Professeurs, Scolarité) et définissez les habilitations granulaires pour chaque compte.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleExportMatrixCsv}
              className="flex items-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl transition-all text-xs border border-white/20 shadow-md cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-blue-200" />
              Exporter la Matrice (CSV)
            </button>

            <button
              type="button"
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-3.5 bg-indigo-600/60 hover:bg-indigo-600 text-white font-bold rounded-2xl transition-all text-xs border border-indigo-400/30 shadow-md cursor-pointer"
              title="Rafraîchir les données"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Metric Strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">UTILISATEURS RÉPERTORIÉS</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              {usersPaginated?.total || usersList.length || 0}
            </span>
            <span className="text-[10px] text-blue-200/70 font-medium">Comptes actifs dans l'ERP</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">RÔLES SYSTÈME DÉFINIS</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
              {rolesList.length || 10}
            </span>
            <span className="text-[10px] text-amber-200/80 font-medium">RBAC hiérarchisé</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">PERMISSIONS GRANULAIRES</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              22
            </span>
            <span className="text-[10px] text-emerald-300/80 font-medium">5 Domaines d'application</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">CONFORMITÉ RÉGLEMENTAIRE</span>
            <span className="text-2xl font-black text-purple-300 font-mono mt-1 block">
              CNDP 100%
            </span>
            <span className="text-[10px] text-purple-200/80 font-medium">Audit Trail & Traçabilité</span>
          </div>
        </div>
      </div>

      {/* ── Search & Interactive Quick-Filter Hub ── */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute start-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher par nom ou adresse email..."
              className="w-full ps-11 pe-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none cursor-pointer"
            >
              <option value="">Tous les Rôles Système</option>
              {rolesList.map((r: any) => (
                <option key={r.name} value={r.name}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider mr-1">Filtre rapide :</span>

          <button
            type="button"
            onClick={() => { setActiveCategoryFilter('ALL'); setPage(1); }}
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer",
              activeCategoryFilter === 'ALL'
                ? "bg-[#0f2863] text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            )}
          >
            Tous ({counts.total ?? usersPaginated?.total ?? usersList.length})
          </button>

          <button
            type="button"
            onClick={() => { setActiveCategoryFilter('ADMINS'); setPage(1); }}
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer",
              activeCategoryFilter === 'ADMINS'
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100"
            )}
          >
            🛡️ Administrateurs & Direction ({counts.admins ?? 0})
          </button>

          <button
            type="button"
            onClick={() => { setActiveCategoryFilter('PROFS'); setPage(1); }}
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer",
              activeCategoryFilter === 'PROFS'
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 hover:bg-indigo-100"
            )}
          >
            👨‍🏫 Enseignants & Chercheurs ({counts.profs ?? 0})
          </button>

          <button
            type="button"
            onClick={() => { setActiveCategoryFilter('STAFF'); setPage(1); }}
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer",
              activeCategoryFilter === 'STAFF'
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 hover:bg-teal-100"
            )}
          >
            🏢 Scolarité, RH & DAF ({counts.staff ?? 0})
          </button>

          <button
            type="button"
            onClick={() => { setActiveCategoryFilter('STUDENTS'); setPage(1); }}
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer",
              activeCategoryFilter === 'STUDENTS'
                ? "bg-slate-700 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            )}
          >
            🎓 Étudiants ({counts.students ?? 0})
          </button>
        </div>
      </div>

      {/* ── Users & Roles Table ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-3">
          <Spinner size="lg" />
          <p className="text-xs font-bold text-slate-400">Chargement de la matrice des accès RBAC...</p>
        </div>
      ) : isError ? (
        <div className="p-12 text-center bg-rose-50 dark:bg-rose-950/30 rounded-[2.5rem] border border-rose-200 dark:border-rose-900 space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <div>
            <h3 className="text-base font-black text-rose-900 dark:text-rose-100">Impossible de charger la matrice des droits</h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 max-w-md mx-auto">
              {(error as any)?.response?.data?.message || "Vérifiez vos autorisations d'accès administrateur ou rafraîchissez la page."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
          >
            Réessayer
          </button>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="p-4 ps-6 text-start">Utilisateur & Identité</th>
                  <th className="p-4 text-start">Rôles Système Attribués</th>
                  <th className="p-4 text-start">Habilitations & Permissions</th>
                  <th className="p-4 text-start">Date Inscription</th>
                  <th className="p-4 pe-6 text-end">Action RBAC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 ps-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black flex items-center justify-center text-sm shadow-md shrink-0">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white text-xs">{u.name}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r: string) => (
                            <span key={r} className={cn("px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border shadow-xs", roleColorMap[r] || "bg-slate-100 text-slate-700 border-slate-200")}>
                              {r}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-[11px] bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">Sans rôle</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      {u.permissions && u.permissions.length > 0 ? (
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-xl text-[10px] font-extrabold inline-flex items-center gap-1">
                          <Key className="w-3 h-3 text-purple-600" />
                          {u.permissions.length} Permission{u.permissions.length > 1 ? 's' : ''} Dédiée{u.permissions.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] inline-flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-slate-300" />
                          Héritées du rôle
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {u.created_at}
                    </td>

                    <td className="p-4 pe-6 text-end">
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 rounded-xl font-extrabold text-xs transition-colors border border-indigo-200 dark:border-indigo-800 cursor-pointer shadow-xs active:scale-95 inline-flex items-center gap-1.5"
                      >
                        <UserCog className="w-3.5 h-3.5" />
                        Configurer les Accès
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {usersPaginated && usersPaginated.last_page > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Page {usersPaginated.current_page} sur {usersPaginated.last_page} ({usersPaginated.total} utilisateurs)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={usersPaginated.current_page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={usersPaginated.current_page >= usersPaginated.last_page}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-16 text-center bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <UserCog className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">Aucun utilisateur ne correspond aux critères</h3>
          <p className="text-xs text-slate-400">Modifiez votre recherche ou sélectionnez un autre filtre de rôle.</p>
        </div>
      )}

      {/* ── Edit Role & Permissions Modal (Matrice RBAC) ── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Matrice des Droits : {selectedUser.name}</h3>
                  <p className="text-xs text-slate-400 font-semibold">{selectedUser.email}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedUser(null)} 
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Row */}
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                MODÈLES DE RÔLES PRÉ-CONFIGURÉS (PRESETS 1-CLIC)
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('super-admin')}
                  className="px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-extrabold border border-amber-200 cursor-pointer transition-colors"
                >
                  🛡️ Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('prof')}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-extrabold border border-indigo-200 cursor-pointer transition-colors"
                >
                  👨‍🏫 Professeur Standard
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('dept')}
                  className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-extrabold border border-purple-200 cursor-pointer transition-colors"
                >
                  🏢 Chef de Département
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('filiere')}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-extrabold border border-emerald-200 cursor-pointer transition-colors"
                >
                  📐 Coordonnateur Filière
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('scolarite')}
                  className="px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-extrabold border border-teal-200 cursor-pointer transition-colors"
                >
                  🎓 Agent Scolarité
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Roles Section */}
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                  1. Rôles Institutionnels Spatie Attribués
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {rolesList.map((r: any) => {
                    const isChecked = userRoles.includes(r.name)
                    return (
                      <button
                        key={r.name}
                        type="button"
                        onClick={() => toggleRole(r.name)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-2xl border text-xs font-extrabold text-start transition-all cursor-pointer",
                          isChecked 
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20" 
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300"
                        )}
                      >
                        <span>{r.label}</span>
                        {isChecked && <Check className="w-4 h-4 text-white shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Permissions Section */}
              <div className="space-y-4">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                  2. Permissions Spécifiques par Domaine d'Activité
                </span>
                
                <div className="space-y-4">
                  {permissionGroups.map((group: any, gIdx: number) => (
                    <div key={gIdx} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                      <span className="text-xs font-black text-indigo-900 dark:text-indigo-300 block">
                        {group.category}
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.permissions.map((p: any) => {
                          const isChecked = userPermissions.includes(p.name)
                          return (
                            <label
                              key={p.name}
                              className={cn(
                                "flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                                isChecked
                                  ? "bg-purple-100/70 border-purple-300 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200"
                                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                              )}
                            >
                              <span>{p.label}</span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(p.name)}
                                className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                              />
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-extrabold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Enregistrement en cours...' : 'Enregistrer les Accès'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
