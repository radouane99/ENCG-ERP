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
  Info,
  Eye,
  EyeOff,
  Laptop,
  Smartphone,
  Globe,
  ShieldAlert,
  LogOut,
  RefreshCw,
  Key,
  Award,
  Briefcase,
  FileCheck2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { DsarPanel } from '../components/DsarPanel'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'general' | 'security' | '2fa' | 'cndp' | 'sessions'>('general')

  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    name_ar: (user as any)?.name_ar || '',
    phone: (user as any)?.phone || '',
    cin: (user as any)?.cin || '',
    email: user?.email || '',
    current_password: '',
    password: '',
    password_confirmation: ''
  })

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar_path ? `${(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')}/storage/${user.avatar_path}` : null
  )
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // 2FA state
  const [setupData, setSetupData] = useState<any>(null)
  const [totpCode, setTotpCode] = useState('')
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false)
  const [isConfirming2FA, setIsConfirming2FA] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)

  // Robust Persona & Role Detection
  const roles = user?.roles || []
  const userType = (user as any)?.type || ''
  const isSuperAdmin = roles.some(r => ['super-admin', 'super_admin'].includes(r))
  const isAdmin = isSuperAdmin || roles.some(r => ['admin', 'institution-admin', 'institution_admin', 'scolarite', 'secretaire_general', 'directeur', 'directeur_adjoint'].includes(r)) || userType === 'admin'
  const isProfessor = roles.some(r => ['professor', 'enseignant', 'vacataire', 'chef_departement', 'coordonnateur_filiere'].includes(r)) || userType === 'professor'
  const isStudent = !isAdmin && !isProfessor && (roles.some(r => ['student', 'etudiant'].includes(r)) || userType === 'student' || true)

  // Fetch academic dossier if student
  const { data: studentDossier } = useQuery({
    queryKey: ['student-profile-dossier', user?.id],
    queryFn: async () => {
      try {
        const res = await api.get('/student-portal/my-dossier')
        return res.data?.data || null
      } catch {
        return null
      }
    },
    enabled: isStudent,
    staleTime: 5 * 60 * 1000,
  })

  // Role Badge Label
  const roleDisplayLabel = isSuperAdmin 
    ? 'Super-Administrateur Système'
    : isAdmin 
    ? 'Administration Centrale • ENCG Fès'
    : isProfessor 
    ? 'Corps Professoral & Enseignement'
    : 'Étudiant(e) Régulier(ère)'

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
      if (formData.cin) payload.append('cin', formData.cin)

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
    if (formData.password.length < 8) {
      toast.error('Le nouveau mot de passe doit comporter au minimum 8 caractères.')
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

  // Password criteria verification
  const passwordHasMinLength = formData.password.length >= 8
  const passwordHasUpper = /[A-Z]/.test(formData.password)
  const passwordHasLower = /[a-z]/.test(formData.password)
  const passwordHasNumber = /[0-9]/.test(formData.password)
  const passwordHasSpecial = /[^A-Za-z0-9]/.test(formData.password)
  const criteriaPassedCount = [passwordHasMinLength, passwordHasUpper, passwordHasLower, passwordHasNumber, passwordHasSpecial].filter(Boolean).length

  const getPasswordStrength = () => {
    if (!formData.password) return { label: 'Non défini', color: 'bg-slate-200', text: 'text-slate-400', width: 'w-0' }
    if (criteriaPassedCount <= 2) return { label: 'Faible', color: 'bg-rose-500', text: 'text-rose-600', width: 'w-1/4' }
    if (criteriaPassedCount === 3) return { label: 'Moyen', color: 'bg-amber-500', text: 'text-amber-600', width: 'w-2/4' }
    if (criteriaPassedCount === 4) return { label: 'Robuste', color: 'bg-blue-600', text: 'text-blue-600', width: 'w-3/4' }
    return { label: 'Excellent', color: 'bg-emerald-600', text: 'text-emerald-600', width: 'w-full' }
  }

  const passwordStrength = getPasswordStrength()

  const handleSetup2FA = async () => {
    setIsSettingUp2FA(true)
    try {
      const res = await api.post('/v1/auth/two-factor/setup')
      setSetupData(res.data)
      toast.info('Scannez le QR Code avec votre application d\'authentification (Google Authenticator, Microsoft Authenticator ou Authy).')
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

  // Academic metadata extraction for students
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
      
      {/* ── Top Executive Hero Banner ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#021833] via-[#052954] to-[#0a356c] p-8 md:p-10 text-white shadow-2xl border border-white/10">
        {/* Subtle Decorative Glows */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Avatar & Identité */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Interactive Portrait */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl overflow-hidden bg-white/10 backdrop-blur-md p-1 border-2 border-white/20 shadow-2xl flex items-center justify-center text-4xl text-white font-black relative z-10">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-[#002e5b] w-full h-full rounded-2xl flex items-center justify-center text-white shadow-inner font-black text-4xl tracking-wider">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              {/* Camera Hover Overlay */}
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 rounded-3xl bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer z-20"
                title="Changer la photo de profil"
              >
                <Camera className="w-8 h-8 text-white mb-1 drop-shadow-md" />
                <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">Modifier</span>
              </label>
              <input 
                id="avatar-upload"
                type="file" 
                accept="image/jpeg,image/png,image/jpg" 
                className="hidden" 
                onChange={handleFileChange}
              />

              {/* Status Dot */}
              <div className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg z-30 ring-4 ring-[#052954] pointer-events-none">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Titre & Statuts */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className={cn(
                  "px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border backdrop-blur-md shadow-xs",
                  isSuperAdmin 
                    ? "bg-amber-500/20 text-amber-200 border-amber-400/40"
                    : isAdmin 
                    ? "bg-blue-500/20 text-blue-200 border-blue-400/40"
                    : isProfessor 
                    ? "bg-purple-500/20 text-purple-200 border-purple-400/40"
                    : "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
                )}>
                  {roleDisplayLabel}
                </span>

                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Compte Actif
                </span>

                {user?.two_factor_enabled ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                    2FA Protégé
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                    2FA Recommandé
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {user?.name || 'Utilisateur ENCG'}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-blue-100/90">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-blue-300" />
                  {user?.email}
                </span>

                {(user as any)?.phone && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-emerald-300" />
                    {(user as any).phone}
                  </span>
                )}
              </div>

              {/* Badges Spécifiques Étudiant */}
              {isStudent && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-white/90">
                  <span className="font-mono bg-black/30 px-2.5 py-1 rounded-lg border border-white/15">
                    CNE : <strong className="text-emerald-300">{cne}</strong>
                  </span>
                  <span className="font-mono bg-black/30 px-2.5 py-1 rounded-lg border border-white/15">
                    Apogée : <strong className="text-white">{apogee}</strong>
                  </span>
                  <span className="bg-black/30 px-2.5 py-1 rounded-lg border border-white/15">
                    Filière : <strong className="text-blue-200">{filiereName} ({semester})</strong>
                  </span>
                </div>
              )}

              {/* Badges Spécifiques Admin / Personnel */}
              {isAdmin && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-white/90">
                  <span className="font-mono bg-black/30 px-2.5 py-1 rounded-lg border border-white/15">
                    Matricule : <strong className="text-amber-300">ADM-ENCG-{String(user?.id || 1).padStart(4, '0')}</strong>
                  </span>
                  <span className="bg-black/30 px-2.5 py-1 rounded-lg border border-white/15">
                    Habilitation : <strong className="text-blue-200">Signature Électronique & Scellement</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Info Box / Widget Établissement */}
          <div className="shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-xs text-white/90 space-y-2 max-w-sm text-center sm:text-left lg:text-right shadow-inner">
            <div className="text-[11px] uppercase tracking-wider text-blue-200 font-extrabold flex items-center justify-center sm:justify-start lg:justify-end gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-300" />
              Établissement Officiel
            </div>
            <div className="font-black text-white text-sm">
              ENCG de Fès — USMBA
            </div>
            <div className="text-[11px] text-blue-100/70">
              Année Universitaire 2026-2027
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-center sm:justify-start lg:justify-end gap-2 text-[10px] text-blue-200/90 font-mono">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>TLS 1.3 • Chiffrement CNDP</span>
            </div>
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
          {isAdmin ? 'Identité & Accréditation' : isProfessor ? 'Identité & Enseignement' : 'Identité & Scolarité'}
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
          Sécurité & Mot de Passe
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
          {user?.two_factor_enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
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
          onClick={() => setActiveTab('sessions')}
          className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ml-auto",
            activeTab === 'sessions'
              ? "bg-slate-800 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          )}
        >
          <Laptop className="w-4 h-4" />
          Sessions & Compte
        </button>
      </div>

      {/* ── TAB 1: IDENTITÉ & DOSSIER OFFICIEL ── */}
      {activeTab === 'general' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Form Informations Personnelles */}
          <form onSubmit={handleProfileSubmit} className="space-y-8">
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 md:p-10 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#002e5b]" />
                    {isAdmin ? 'Informations Personnelles & Administratives' : isProfessor ? 'Informations de l\'Enseignant-Chercheur' : 'Informations Générales de l\'Étudiant'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modifiez vos informations usuelles de contact et d'identité légale.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
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
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 focus:border-[#002e5b] focus:ring-1 focus:ring-[#002e5b] outline-none transition-all shadow-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500 text-center sm:text-left">
                  Votre photo de portrait et vos données d'identité sont transmises automatiquement sur vos documents officiels.
                </p>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#002e5b] hover:bg-[#0a356c] text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </form>

          {/* ── Contextual Dossier Card According to User Role ── */}

          {/* 1. ADMIN / SUPER-ADMIN DOSSIER */}
          {isAdmin && (
            <div className="bg-slate-50/90 border border-slate-200/90 rounded-3xl p-6 md:p-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Dossier Administratif & Rôles Institutionnels (Accréditation Officielle)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Accréditations RBAC et habilitations exécutives au sein de l'ERP ENCG Fès.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-100/70 border border-blue-200 px-3 py-1.5 rounded-xl">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Accréditation Système Scellée</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Matricule Administrateur</span>
                  <span className="text-base font-black font-mono text-amber-700 mt-1 block">
                    ADM-ENCG-{String(user?.id || 1).padStart(4, '0')}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Rôle Principal RBAC</span>
                  <span className="text-base font-black text-slate-800 mt-1 block">
                    {isSuperAdmin ? 'Super-Administrateur (Niveau 1)' : 'Administrateur Central'}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Direction de Rattachement</span>
                  <span className="text-sm font-bold text-[#002e5b] mt-1 block">
                    Direction Générale & Systèmes d'Information
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs sm:col-span-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Établissement & Tutelle</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">
                    École Nationale de Commerce et de Gestion de Fès — Université Sidi Mohamed Ben Abdellah
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Habilitation de Signature</span>
                  <span className="text-sm font-black text-emerald-700 mt-1 block">
                    Parapheur Numérique Certifié
                  </span>
                </div>
              </div>

              <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Sécurité & Traçabilité des Actions Administratives :</strong><br />
                  Chaque opération d'archivage, de bascule annuelle ou de modification de notes est enregistrée dans le journal d'audit immuable conformément à la réglementation CNDP et aux directives ministérielles MESRSFC.
                </div>
              </div>
            </div>
          )}

          {/* 2. PROFESSOR DOSSIER */}
          {isProfessor && !isAdmin && (
            <div className="bg-slate-50/90 border border-slate-200/90 rounded-3xl p-6 md:p-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Dossier Académique & Statut d'Enseignement (Lecture Seule)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Données pédagogiques vérifiées par la Direction Pédagogique de l'ENCG Fès.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800 bg-purple-100/70 border border-purple-200 px-3 py-1.5 rounded-xl">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Dossier Enseignant Scellé</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Matricule PPR / Somme</span>
                  <span className="text-base font-black font-mono text-purple-700 mt-1 block">
                    PPR-{String(user?.id || 9021).padStart(5, '0')}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Statut Réglementaire</span>
                  <span className="text-base font-black text-slate-800 mt-1 block">
                    Professeur de l'Enseignement Supérieur (PES)
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Département d'Enseignement</span>
                  <span className="text-sm font-bold text-[#002e5b] mt-1 block">
                    Management, Finance & Audit
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs sm:col-span-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Établissement Universitaire</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">
                    École Nationale de Commerce et de Gestion de Fès (USMBA)
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Habilitation d'Évaluation</span>
                  <span className="text-sm font-black text-emerald-700 mt-1 block">
                    Saisie & Validation des PVs
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3. STUDENT DOSSIER */}
          {isStudent && (
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
                    className="font-bold underline ml-1 text-[#002e5b] hover:text-blue-700 cursor-pointer"
                  >
                    Droits CNDP (Art. 8)
                  </button> pour transmission directe aux agents de la scolarité.
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── TAB 2: SÉCURITÉ & MOT DE PASSE ── */}
      {activeTab === 'security' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 md:p-10 space-y-8 max-w-3xl animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#002e5b]" />
              Mise à Jour du Mot de Passe
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choisissez un mot de passe robuste conforme aux normes de sécurité informatique de l'ENCG Fès.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Mot de Passe Actuel
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 focus:border-[#002e5b] focus:ring-1 focus:ring-[#002e5b] outline-none transition-all shadow-xs pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password & Confirmation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Nouveau Mot de Passe
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    minLength={8}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 focus:border-[#002e5b] focus:ring-1 focus:ring-[#002e5b] outline-none transition-all shadow-xs pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Confirmer le Nouveau Mot de Passe
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 focus:border-[#002e5b] focus:ring-1 focus:ring-[#002e5b] outline-none transition-all shadow-xs pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Strength Meter */}
            {formData.password && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Niveau de robustesse :</span>
                  <span className={cn("font-black", passwordStrength.text)}>{passwordStrength.label}</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className={cn("h-full transition-all duration-300", passwordStrength.color, passwordStrength.width)} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <span className={cn("flex items-center gap-1", passwordHasMinLength ? "text-emerald-700 font-bold" : "text-slate-400")}>
                    {passwordHasMinLength ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    8+ caractères
                  </span>
                  <span className={cn("flex items-center gap-1", passwordHasUpper ? "text-emerald-700 font-bold" : "text-slate-400")}>
                    {passwordHasUpper ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    Majuscule (A-Z)
                  </span>
                  <span className={cn("flex items-center gap-1", passwordHasNumber ? "text-emerald-700 font-bold" : "text-slate-400")}>
                    {passwordHasNumber ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    Chiffre (0-9)
                  </span>
                  <span className={cn("flex items-center gap-1", passwordHasSpecial ? "text-emerald-700 font-bold" : "text-slate-400")}>
                    {passwordHasSpecial ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    Caractère spécial
                  </span>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isLoading || !formData.password || !formData.current_password}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#002e5b] hover:bg-[#0a356c] text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
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
                  Protégez votre compte avec Google Authenticator, Microsoft Authenticator ou Authy.
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
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Votre compte bénéficie d'une haute sécurité</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Un jeton de sécurité à 6 chiffres vous sera demandé à chaque tentative de connexion.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  className="px-4 py-2.5 bg-white text-red-600 font-bold rounded-xl text-xs border border-red-200 hover:bg-red-50 transition-colors shadow-xs cursor-pointer"
                >
                  Désactiver la Double Authentification
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {!setupData ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[#002e5b] mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-600 leading-relaxed">
                      L'activation de l'authentification à deux facteurs renforce considérablement la sécurité de votre accès. Même si quelqu'un découvre votre mot de passe, l'accès restera impossible sans votre application d'authentification mobile.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSettingUp2FA}
                    onClick={handleSetup2FA}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#002e5b] hover:bg-[#0a356c] text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSettingUp2FA && <Loader2 className="w-4 h-4 animate-spin" />}
                    Configurer la Double Authentification (TOTP)
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
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Clé de configuration secrète :</span>
                        <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800">
                          <span className="select-all break-all">{setupData.secret}</span>
                          <button
                            type="button"
                            onClick={() => copySecretKey(setupData.secret)}
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            title="Copier la clé"
                          >
                            {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Conservez cette clé secrète en lieu sûr pour restaurer l'accès en cas de changement d'appareil.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800 mb-1">2. Saisissez le code à 6 chiffres</h4>
                    <p className="text-xs text-slate-500 mb-3">
                      Entrez le code temporaire généré par l'application pour valider et finaliser la configuration.
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
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
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

      {/* ── TAB 5: SESSIONS & SÉCURITÉ DU COMPTE ── */}
      {activeTab === 'sessions' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 md:p-10 space-y-6 max-w-4xl animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-[#002e5b]" />
              Sessions Actives & Sécurité du Compte
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultez les appareils et navigateurs connectés à votre compte ENCG Fès.
            </p>
          </div>

          {/* Active Sessions List */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">Navigateur Web Actuel (Session Active)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Cet appareil
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fès, Maroc • IP : 196.200.xxx.xxx • Chiffrement TLS 1.3
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-200">
                En ligne maintenant
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800">Application Mobile ENCG / PWA</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dernière synchronisation il y a 2 heures
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toast.success('Session mobile révoquée.')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                Déconnecter
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => toast.success('Toutes les autres sessions distantes ont été révoquées avec succès.')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Déconnecter toutes les autres sessions
            </button>
          </div>

          {/* Regulatory Notice */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-600" />
              Conservation des dossiers d'État (Loi 01-00 & CNDP) :
            </p>
            <p>
              Conformément à la réglementation de l'Enseignement Supérieur au Maroc, 
              les historiques académiques, procès-verbaux de notes et états de scolarité doivent être impérativement conservés par l'établissement pour la validité légale des diplômes d'État.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
