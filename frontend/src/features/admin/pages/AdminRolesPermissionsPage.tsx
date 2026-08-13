import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ShieldCheck, UserCog, Key, Search, Filter, Check, X, 
  Sparkles, Layers, RefreshCw, Award, Lock, CheckCircle2, ShieldAlert
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
  const [page, setPage] = useState(1)

  // Edit Modal State
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [userPermissions, setUserPermissions] = useState<string[]>([])

  // Fetch matrix data
  const { data, isLoading } = useQuery({
    queryKey: ['admin-roles-permissions', search, roleFilter, page],
    queryFn: () => api.get('/v1/admin/roles-permissions/data', {
      params: { search, role: roleFilter, page }
    }).then(res => res.data)
  })

  // Mutation to update user roles & permissions
  const updateMutation = useMutation({
    mutationFn: (payload: { userId: number; roles: string[]; permissions: string[] }) =>
      api.post(`/v1/admin/roles-permissions/users/${payload.userId}`, {
        roles: payload.roles,
        permissions: payload.permissions
      }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Droits d\'accès mis à jour avec succès !')
      queryClient.invalidateQueries({ queryKey: ['admin-roles-permissions'] })
      setSelectedUser(null)
    },
    onError: () => toast.error('Erreur lors de la mise à jour des accès.')
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

  // Presets
  const applyPreset = (presetType: 'prof' | 'dept' | 'scolarite' | 'filiere') => {
    if (presetType === 'prof') {
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
    toast.info('Modèle de droits appliqué. Cliquez sur enregistrer.')
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

  const roleColorMap: Record<string, string> = {
    'super-admin': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300',
    'institution-admin': 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300',
    'director': 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300',
    'department-head': 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300',
    'filiere-head': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300',
    'professor': 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300',
    'vacataire': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300',
    'scolarite-agent': 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/50 dark:text-teal-300',
    'student': 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
  }

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-28 font-sans">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 md:p-10 text-white shadow-2xl border border-indigo-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-bold border border-indigo-400/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Matrice d'Habilitation Rôles & Permissions — ENCG Fès</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Gestionnaire des Droits & Privilèges 🔑
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Attribuez dynamiquement les rôles institutionnels et définissez les autorisations d'accès spécifiques pour chaque compte d'utilisateur.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
            <div className="text-center px-4 border-r border-white/10">
              <span className="block text-2xl font-black text-white">{usersPaginated?.total || 0}</span>
              <span className="text-[10px] font-bold uppercase text-slate-300">Utilisateurs</span>
            </div>
            <div className="text-center px-4">
              <span className="block text-2xl font-black text-amber-400">{rolesList.length || 0}</span>
              <span className="text-[10px] font-bold uppercase text-slate-300">Rôles Actifs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute start-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher par nom ou adresse email..."
            className="w-full ps-11 pe-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
            className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
          >
            <option value="">Tous les Rôles System</option>
            {rolesList.map((r: any) => (
              <option key={r.name} value={r.name}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : usersPaginated?.data && usersPaginated.data.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="p-4 ps-6 text-start">Utilisateur & Identifiant</th>
                  <th className="p-4 text-start">Rôles Attribués</th>
                  <th className="p-4 text-start">Permissions Spécifiques</th>
                  <th className="p-4 text-start">Date Création</th>
                  <th className="p-4 pe-6 text-end">Action RBAC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {usersPaginated.data.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 ps-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">{u.name}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r: string) => (
                            <span key={r} className={cn("px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border", roleColorMap[r] || "bg-slate-100 text-slate-700")}>
                              {r}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Aucun rôle</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      {u.permissions && u.permissions.length > 0 ? (
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-[10px] font-extrabold">
                          {u.permissions.length} Permission(s) Spécifique(s)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Héritées du rôle</span>
                      )}
                    </td>

                    <td className="p-4 text-slate-500 font-semibold">{u.created_at}</td>

                    <td className="p-4 pe-6 text-end">
                      <button
                        onClick={() => openEditModal(u)}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 rounded-xl font-extrabold text-xs transition-colors border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                      >
                        Configurer les Accès
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <UserCog className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">Aucun utilisateur trouvé</h3>
        </div>
      )}

      {/* Edit Role & Permissions Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Matrice des Accès : {selectedUser.name}</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">{selectedUser.email}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Row */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">MODÈLES DE RÔLES PRÉ-CONFIGURÉS (PRESETS 1-CLIC)</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('prof')}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-extrabold border border-indigo-200 cursor-pointer"
                >
                  👨‍🏫 Professeur Standard
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('dept')}
                  className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-extrabold border border-purple-200 cursor-pointer"
                >
                  🏢 Chef de Département
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('filiere')}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-extrabold border border-emerald-200 cursor-pointer"
                >
                  📐 Coordonnateur Filière
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('scolarite')}
                  className="px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-extrabold border border-teal-200 cursor-pointer"
                >
                  🎓 Agent Scolarité
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Roles Section */}
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">1. Rôles Système Attribués</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
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
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">2. Permissions Spécifiques par Domaine</span>
                
                <div className="space-y-4">
                  {permissionGroups.map((group: any, gIdx: number) => (
                    <div key={gIdx} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-300 block">{group.category}</span>
                      
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
                                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
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
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-extrabold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-indigo-600/30"
                >
                  {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer les Accès'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
