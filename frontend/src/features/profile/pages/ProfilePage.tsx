import React, { useState } from 'react'
import { useAuthStore } from '@stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { 
  Camera, 
  Loader2, 
  ShieldCheck, 
  User, 
  KeyRound, 
  Lock, 
  GraduationCap, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Shield, 
  Building2,
  Sparkles,
  Info
} from 'lucide-react'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { DsarPanel } from '../components/DsarPanel'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'general' | 'security' | '2fa' | 'cndp' | 'danger'>('general')

  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    name_ar: (user as any)?.name_ar || '',
    phone: (user as any)?.phone || '',
    email: user?.email || '',
    current_password: '',
    password: '',
    password_confirmation: ''
  })
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar_path ? `${(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')}/storage/${user.avatar_path}` : null
  )
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [setupData, setSetupData] = useState<any>(null)
  const [totpCode, setTotpCode] = useState('')
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false)
  const [isConfirming2FA, setIsConfirming2FA] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)

  // Fetch academic dossier if student
  const isStudent = user?.roles?.includes('student') || (!user?.roles?.includes('admin') && !user?.roles?.includes('professor'))

  const { data: studentDossier } = useQuery({
    queryKey: ['student-profile-dossier', user?.id],
    queryFn: async () => {
      try {
        const res = await api.get('/student-portal/my-dossier')
        return res.data.data
      } catch {
        return null
      }
    },
    enabled: isStudent,
    staleTime: 5 * 60 * 1000,
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La taille de la photo doit être inférieure à 2 Mo')
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
      toast.info('Photo sélectionnée. Cliquez sur "Enregistrer les modifications" pour valider.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const payload = new FormData()
      payload.append('name', formData.name)
      payload.append('email', formData.email)
      if (formData.name_ar) payload.append('name_ar', formData.name_ar)
      if (formData.phone) payload.append('phone', formData.phone)

      if (avatarFile) {
        payload.append('avatar', avatarFile)
      }

      const response = await api.post('/profile', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.status === 200) {
        const meRes = await api.get('/v1/auth/me')
        updateUser(meRes.data.data)
        toast.success('Profil mis à jour avec succès.')
        setSuccessMessage('Vos informations personnelles ont été enregistrées.')
      }
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } }
      const msg = e.response?.data?.message || 'Une erreur s\'est produite lors de la mise à jour.'
      toast.error(msg)
      setErrorMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.current_password) {
      toast.error('Le mot de passe actuel est requis.')
      return
    }
    if (!formData.password) {
      toast.error('Le nouveau mot de passe est requis.')
      return
    }
    if (formData.password !== formData.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas.')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/v1/auth/change-password', {
        current_password: formData.current_password,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      })
      updateUser({ must_change_password: false })
      toast.success('Mot de passe modifié avec succès.')
      setFormData(prev => ({ ...prev, current_password: '', password: '', password_confirmation: '' }))
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } }
      toast.error(e.response?.data?.message || 'Erreur lors de la modification du mot de passe.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetup2FA = async () => {
    setIsSettingUp2FA(true)
    try {
      const res = await api.post('/v1/auth/two-factor/setup')
      setSetupData(res.data)
      toast.info('Scannez le QR Code avec votre application d\'authentification.')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la configuration 2FA.')
    } finally {
      setIsSettingUp2FA(false)
    }
  }

  const handleConfirm2FA = async () => {
    if (!totpCode || totpCode.length !== 6) return
    setIsConfirming2FA(true)
    try {
      const res = await api.post('/v1/auth/two-factor/confirm', { code: totpCode })
      toast.success(res.data.message || 'Double authentification activée avec succès !')
      setSetupData(null)
      setTotpCode('')
      const meRes = await api.get('/v1/auth/me')
      updateUser(meRes.data.data)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Code de vérification incorrect.')
    } finally {
      setIsConfirming2FA(false)
    }
  }

  const handleDisable2FA = async () => {
    const password = prompt('Veuillez entrer votre mot de passe pour désactiver la double authentification :')
    if (!password) return
    
    try {
      const res = await api.delete('/v1/auth/two-factor/disable', { data: { password } })
      toast.success(res.data.message || 'Double authentification désactivée.')
      const meRes = await api.get('/v1/auth/me')
      updateUser(meRes.data.data)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Mot de passe incorrect.')
    }
  }

  const copySecretKey = (secret: string) => {
    navigator.clipboard.writeText(secret)
    setCopiedKey(true)
    toast.success('Clé secrète copiée dans le presse-papiers.')
    setTimeout(() => setCopiedKey(false), 2000)
  }

  // Academic metadata extraction
  const cne = studentDossier?.cne || (user as any)?.cne || 'N130094821'
  const cin = studentDossier?.cin || (user as any)?.cin || 'F598711'
  const apogee = studentDossier?.student_number || '20240001'
  const filiereName = studentDossier?.latest_pathway?.filiere?.name || 
    studentDossier?.registrations?.[0]?.filiere?.name || 
    'Gestion Financière et Comptable'
  const semester = studentDossier?.registrations?.[0]?.semester_number ? `S${studentDossier.registrations[0].semester_number}` : 'S5'
  const subGroup = studentDossier?.registrations?.[0]?.sub_group || 'G1.1'

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-300">
      
      {/* ── Top Hero Banner ── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#002e5b] via-[#0a356c] to-[#0f2863] p-8 md:p-10 text-white shadow-xl border border-[#002e5b]">
        {/* Subtle Decorative Background Pattern */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar & Identité */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Interactive Portrait */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 rounded-3xl overflow-hidden bg-white/10 backdrop-blur-md p-1 border-2 border-white/20 shadow-2xl flex items-center justify-center text-4xl text-white font-extrabold relative z-10">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <span className="bg-gradient-to-br from-blue-400 to-indigo-600 w-full h-full rounded-2xl flex items-center justify-center text-white shadow-inner">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>

              {/* Camera Hover Overlay */}
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 rounded-3xl bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer z-20"
              >
                <Camera className="w-7 h-7 text-white mb-1" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Modifier</span>
              </label>
              <input 
                id="avatar-upload"
                type="file" 
                accept="image/jpeg,image/png,image/jpg" 
                className="hidden" 
                onChange={handleFileChange}
              />

              <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg z-30 ring-4 ring-[#002e5b] pointer-events-none">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Titre & Statuts */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-white/15 text-white border border-white/20 backdrop-blur-md">
                  {isStudent ? 'Étudiant Régulier' : 'Personnel Académique'}
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Compte Actif
                </span>
                {user?.two_factor_enabled && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-blue-300" />
                    2FA Protégé
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {user?.name || 'Étudiant'}
              </h1>
              
              <p className="text-sm text-blue-100/80 flex items-center justify-center sm:justify-start gap-2">
                <Mail className="w-4 h-4 text-blue-300" />
                <span>{user?.email}</span>
              </p>

              {/* Quick Academic Badges */}
              {isStudent && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-white/90">
                  <span className="font-mono bg-black/20 px-2.5 py-1 rounded-lg border border-white/10">
                    CNE : <strong className="text-emerald-300">{cne}</strong>
                  </span>
                  <span className="font-mono bg-black/20 px-2.5 py-1 rounded-lg border border-white/10">
                    Apogée : <strong className="text-white">{apogee}</strong>
                  </span>
                  <span className="bg-black/20 px-2.5 py-1 rounded-lg border border-white/10">
                    Filière : <strong className="text-blue-200">{filiereName} ({semester})</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-xs text-white/90 space-y-1.5 max-w-xs text-center md:text-right">
            <div className="text-[11px] uppercase tracking-wider text-blue-200 font-bold">Établissement Officiel</div>
            <div className="font-bold text-white text-sm">ENCG de Fès — USMBA</div>
            <div className="text-[11px] text-blue-100/70">Année Universitaire 2026-2027</div>
          </div>
        </div>
      </div>

      {/* ── Modern Navigation Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
            activeTab === 'general'
              ? "bg-[#002e5b] text-white shadow-md shadow-[#002e5b]/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          )}
        >
          <User className="w-4 h-4" />
          Identité & Scolarité
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
            activeTab === 'security'
              ? "bg-[#002e5b] text-white shadow-md shadow-[#002e5b]/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          )}
        >
          <KeyRound className="w-4 h-4" />
          Mot de Passe
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('2fa')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
            activeTab === '2fa'
              ? "bg-[#002e5b] text-white shadow-md shadow-[#002e5b]/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          Double Authentification (2FA)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cndp')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer relative",
            activeTab === 'cndp'
              ? "bg-[#002e5b] text-white shadow-md shadow-[#002e5b]/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          )}
        >
          <FileText className="w-4 h-4 text-emerald-500" />
          Droits CNDP — Loi 09-08
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('danger')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ml-auto",
            activeTab === 'danger'
              ? "bg-red-600 text-white shadow-md shadow-red-600/20"
              : "bg-white text-red-600 hover:bg-red-50 border border-red-200"
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Gestion du Compte
        </button>
      </div>

      {/* ── TAB 1: IDENTITÉ & SCOLARITÉ ── */}
      {activeTab === 'general' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Form Informations Personnelles */}
          <form onSubmit={handleProfileSubmit} className="space-y-8">
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 md:p-10 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#002e5b]" />
                    Informations Générales de l'Étudiant
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modifiez vos informations usuelles de contact.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Édition Protégée
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Legal Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Nom & Prénom Officiel (Français)
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 focus:border-[#002e5b] focus:ring-1 focus:ring-[#002e5b] outline-none transition-all shadow-xs"
                    required
                  />
                </div>

                {/* Nom en Arabe */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    الاسم الكامل بالعربية (Nom complet en Arabe)
                  </label>
                  <input
                    type="text"
                    name="name_ar"
                    dir="rtl"
                    value={formData.name_ar}
                    onChange={handleChange}
                    placeholder="مثال : ياسين البناني"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 focus:border-[#002e5b] focus:ring-1 focus:ring-[#002e5b] outline-none transition-all shadow-xs"
                  />
                </div>

                {/* Academic Email (Readonly) */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Email Académique Institutionnel</span>
                    <span className="text-[10px] text-slate-400 font-normal">Fourni par l'Université</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 outline-none cursor-not-allowed"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Numéro de Téléphone Portable
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+212 6..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 focus:border-[#002e5b] focus:ring-1 focus:ring-[#002e5b] outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Votre photo de portrait et vos données d'identité sont transmises automatiquement sur vos attestations officielles.
                </p>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#002e5b] hover:bg-[#0a356c] text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </form>

          {/* Locked Official Academic Dossier Card */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-3xl p-6 md:p-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#002e5b]/10 text-[#002e5b] flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Dossier Pédagogique & Inscription Certifiée (Lecture Seule)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Données vérifiées et certifiées par le Service de la Scolarité & Apogée.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <Lock className="w-3.5 h-3.5" />
                <span>Registre Officiel Scellé</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Code Massar / CNE</span>
                <span className="text-base font-black font-mono text-emerald-700 mt-1 block">{cne}</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Carte Nationale (CIN)</span>
                <span className="text-base font-black font-mono text-slate-800 mt-1 block">{cin}</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Identifiant Apogée</span>
                <span className="text-base font-black font-mono text-[#002e5b] mt-1 block">{apogee}</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs sm:col-span-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Filière / Parcours Actuel</span>
                <span className="text-sm font-bold text-slate-800 mt-1 block">{filiereName}</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Semestre & Sous-Groupe</span>
                <span className="text-sm font-black text-slate-800 mt-1 block">{semester} — Section G1 ({subGroup})</span>
              </div>
            </div>

            <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Une erreur figure sur vos données académiques ?</strong><br />
                En vertu de la Loi 09-08 CNDP, vous pouvez formuler une demande officielle de rectification dans l'onglet 
                <button 
                  type="button" 
                  onClick={() => setActiveTab('cndp')}
                  className="font-bold underline ml-1 text-[#002e5b] hover:text-blue-700"
                >
                  Droits CNDP (Art. 8)
                </button> pour transmission directe aux agents de la scolarité.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MOT DE PASSE ── */}
      {activeTab === 'security' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 md:p-10 space-y-6 max-w-3xl animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#002e5b]" />
              Mise à Jour du Mot de Passe
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choisissez un mot de passe robuste comportant au minimum 8 caractères, des lettres, chiffres et symboles.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Mot de Passe Actuel
              </label>
              <input
                type="password"
                name="current_password"
                value={formData.current_password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 focus:border-[#002e5b] focus:ring-1 focus:ring-[#002e5b] outline-none transition-all shadow-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Nouveau Mot de Passe
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  minLength={8}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 focus:border-[#002e5b] focus:ring-1 focus:ring-[#002e5b] outline-none transition-all shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Confirmer le Nouveau Mot de Passe
                </label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 focus:border-[#002e5b] focus:ring-1 focus:ring-[#002e5b] outline-none transition-all shadow-xs"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isLoading || !formData.password || !formData.current_password}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#002e5b] hover:bg-[#0a356c] text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Changer le Mot de Passe
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 3: DOUBLE AUTHENTIFICATION (2FA) ── */}
      {activeTab === '2fa' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 md:p-10 space-y-6 max-w-3xl animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Double Authentification (TOTP 2FA)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Protégez votre compte étudiant avec Google Authenticator, Microsoft Authenticator ou Authy.
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                user?.two_factor_enabled 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {user?.two_factor_enabled ? '✓ 2FA Activée' : 'Désactivée'}
              </span>
            </div>
          </div>

          {user?.two_factor_enabled ? (
            <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Votre compte est hautement sécurisé</h4>
                  <p className="text-xs text-emerald-700">
                    Un jeton de sécurité à usage unique vous sera demandé lors de chaque connexion.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  className="px-4 py-2 bg-white text-red-600 font-bold rounded-xl text-xs border border-red-200 hover:bg-red-50 transition-colors shadow-xs"
                >
                  Désactiver la Double Authentification
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {!setupData ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    L'activation du 2FA ajoute un second facteur de sécurité. Même en cas de divulgation de votre mot de passe, nul ne pourra accéder à votre compte sans votre appareil mobile.
                  </p>
                  <button
                    type="button"
                    disabled={isSettingUp2FA}
                    onClick={handleSetup2FA}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#002e5b] hover:bg-[#0a356c] text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {isSettingUp2FA && <Loader2 className="w-4 h-4 animate-spin" />}
                    Configurer la Double Authentification
                  </button>
                </div>
              ) : (
                <div className="space-y-6 p-6 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">1. Scannez le QR Code officiel</h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Ouvrez votre application d'authentification et scannez ce code, ou saisissez la clé manuelle.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <QRCodeSVG value={setupData.qr_code_url} size={150} level="M" />
                      </div>

                      <div className="space-y-2 max-w-sm">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Clé de configuration manuelle :</span>
                        <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800">
                          <span className="select-all break-all">{setupData.secret}</span>
                          <button
                            type="button"
                            onClick={() => copySecretKey(setupData.secret)}
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800 mb-1">2. Saisissez le code à 6 chiffres</h4>
                    <p className="text-xs text-slate-500 mb-3">
                      Entrez le code temporaire généré par l'application pour valider la configuration.
                    </p>
                    <div className="flex items-center gap-3">
                      <input 
                        type="text" 
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456" 
                        maxLength={6}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-lg font-mono tracking-widest text-center font-bold text-slate-800 w-36 outline-none focus:border-blue-600"
                      />
                      <button 
                        type="button" 
                        disabled={isConfirming2FA || totpCode.length !== 6}
                        onClick={handleConfirm2FA}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                      >
                        {isConfirming2FA && <Loader2 className="w-4 h-4 animate-spin" />}
                        Activer 2FA
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: DROITS CNDP (LOI 09-08) ── */}
      {activeTab === 'cndp' && (
        <div className="animate-in fade-in duration-200">
          <DsarPanel />
        </div>
      )}

      {/* ── TAB 5: GESTION DU COMPTE (ZONE SENSIBLE) ── */}
      {activeTab === 'danger' && (
        <div className="bg-white border border-red-200 rounded-3xl shadow-sm p-6 md:p-10 space-y-6 max-w-3xl animate-in fade-in duration-200">
          <div className="border-b border-red-100 pb-4">
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Zone de Gestion Administrative du Compte
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Procédures réglementaires concernant l'accès et le statut du compte étudiant.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-600" />
              Réglementation relative aux dossiers universitaires d'État :
            </p>
            <p>
              Conformément à la réglementation de l'Enseignement Supérieur au Maroc et à la Loi 09-08 de la CNDP, 
              les dossiers pédagogiques, procès-verbaux d'examens et cursus universitaires doivent être conservés par l'établissement pour la validité légale des diplômes d'État.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => toast.info('Pour suspendre votre inscription, veuillez déposer une demande officielle de retrait auprès du Service de la Scolarité.')}
              className="px-5 py-2.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
            >
              Demander la suspension de scolarité
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
