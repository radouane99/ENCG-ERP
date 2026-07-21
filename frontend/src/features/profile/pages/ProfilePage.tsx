import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@stores/authStore'
import { Camera, Save, User as UserIcon, Lock, Mail, Phone, Loader2, Upload, ShieldCheck } from 'lucide-react'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { QRCodeSVG } from 'qrcode.react'

export default function ProfilePage() {
  const { t, i18n } = useTranslation('common')
  const { user, updateUser } = useAuthStore()

  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('La taille de l\'image doit être inférieure à 2 Mo')
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
      setErrorMessage('')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const payload = new FormData()
      payload.append('name', formData.name)
      payload.append('email', formData.email)
      
      if (formData.password) {
        if (formData.password !== formData.password_confirmation) {
          setErrorMessage('Les mots de passe ne correspondent pas')
          setIsLoading(false)
          return
        }
        payload.append('password', formData.password)
        payload.append('password_confirmation', formData.password_confirmation)
      }

      if (avatarFile) {
        payload.append('avatar', avatarFile)
      }

      const response = await api.post('/profile', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.status === 200) {
        const meRes = await api.get('/v1/auth/me')
        updateUser(meRes.data.data)
        setSuccessMessage('Profil mis à jour avec succès')
        setFormData(prev => ({ ...prev, password: '', password_confirmation: '' }))
      }
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } } };
      console.error(error)
      setErrorMessage(e.response?.data?.message || 'Une erreur s\'est produite lors de la mise à jour')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetup2FA = async () => {
    setIsSettingUp2FA(true)
    setErrorMessage('')
    try {
      const res = await api.post('/v1/auth/two-factor/setup')
      setSetupData(res.data)
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Erreur lors de la configuration 2FA')
    } finally {
      setIsSettingUp2FA(false)
    }
  }

  const handleConfirm2FA = async () => {
    if (!totpCode || totpCode.length !== 6) return
    setIsConfirming2FA(true)
    setErrorMessage('')
    try {
      const res = await api.post('/v1/auth/two-factor/confirm', { code: totpCode })
      setSuccessMessage(res.data.message)
      setSetupData(null)
      setTotpCode('')
      const meRes = await api.get('/v1/auth/me')
      updateUser(meRes.data.data)
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Code incorrect')
    } finally {
      setIsConfirming2FA(false)
    }
  }

  const handleDisable2FA = async () => {
    const password = prompt('Veuillez entrer votre mot de passe pour désactiver la 2FA:')
    if (!password) return
    
    setErrorMessage('')
    try {
      const res = await api.delete('/v1/auth/two-factor/disable', { data: { password } })
      setSuccessMessage(res.data.message)
      const meRes = await api.get('/v1/auth/me')
      updateUser(meRes.data.data)
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Erreur lors de la désactivation')
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Profile
        </h1>
      </div>

      {/* Error and Success Alerts */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          {successMessage}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Profile Mastery Card */}
        <div className="bg-white border border-slate-100 rounded-[1.5rem] shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0f2863] italic">Profile Mastery</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">
              Manage your academic identity and contact protocols.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 border-dashed rounded-3xl p-8 mb-10 flex items-center gap-8">
            {/* Avatar block */}
            <div className="relative group cursor-pointer shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white shadow-sm flex items-center justify-center text-3xl text-slate-400 font-bold relative z-10 border border-slate-100">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/jpg" 
                className="absolute inset-0 opacity-0 cursor-pointer z-30" 
                onChange={handleFileChange}
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0f2863] text-white flex items-center justify-center shadow-md z-30 pointer-events-none ring-4 ring-white">
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Academic Portrait</h4>
              <button type="button" className="px-5 py-2.5 bg-white border border-slate-200 text-[#0f2863] font-bold rounded-lg hover:bg-slate-50 transition-colors text-xs uppercase tracking-wide">
                Upload New Image
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Full Legal Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Full Legal Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                required
              />
            </div>

            {/* Academic Email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Academic Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                className="w-full rounded-2xl border border-transparent bg-slate-50 px-5 py-4 text-sm font-bold text-slate-600 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "flex items-center gap-2 px-8 py-3.5 bg-[#0f2863] text-white font-bold rounded-2xl hover:bg-[#1a387e] transition-colors text-sm uppercase tracking-wide shadow-md disabled:opacity-50"
              )}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Commit Changes
            </button>
          </div>
        </div>

        {/* Update Password Card */}
        <div className="bg-white border border-slate-100 rounded-[1.5rem] shadow-sm p-8 md:p-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Update Password</h2>
            <p className="text-sm text-slate-500 mt-1">
              Ensure your account is using a long, random password to stay secure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                New Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                minLength={8}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <div className="mt-8">
            <button
              type="submit"
              disabled={isLoading || (!formData.password)}
              className={cn(
                "flex items-center gap-2 px-8 py-3.5 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-colors text-sm uppercase tracking-wide shadow-md disabled:opacity-50"
              )}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Password
            </button>
          </div>
        </div>

        {/* Two Factor Authentication Card */}
        <div className="bg-white border border-slate-100 rounded-[1.5rem] shadow-sm p-8 md:p-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#0f2863]" />
              Double Authentification (2FA)
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Ajoutez une couche de sécurité supplémentaire en utilisant une application d'authentification comme Google Authenticator.
            </p>
          </div>
          
          {/* Real 2FA State */}
          <div className="space-y-6 max-w-3xl">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800 mb-2">
                  Statut : {user?.two_factor_enabled ? <span className="text-emerald-600">Configuré et Actif</span> : <span className="text-slate-500">Non configuré</span>}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Lorsque la double authentification est activée, vous serez invité à saisir un jeton aléatoire sécurisé lors de l'authentification.
                </p>
                
                {user?.two_factor_enabled ? (
                  <button
                    type="button"
                    onClick={handleDisable2FA}
                    className="px-6 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors text-xs uppercase tracking-wide shadow-sm border border-red-200"
                  >
                    Désactiver 2FA
                  </button>
                ) : (
                  !setupData && (
                    <button
                      type="button"
                      disabled={isSettingUp2FA}
                      onClick={handleSetup2FA}
                      className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors text-xs uppercase tracking-wide shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSettingUp2FA && <Loader2 className="w-4 h-4 animate-spin" />}
                      Activer 2FA
                    </button>
                  )
                )}
              </div>
            </div>

            {setupData && (
              <div className="bg-white border border-slate-300 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-2">1. Scannez le QR Code</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Scannez ce QR Code avec Google Authenticator, Authy ou saisissez la clé manuellement: <strong className="select-all">{setupData.secret}</strong>
                </p>
                
                <div className="w-48 h-48 bg-white border border-slate-200 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                  <QRCodeSVG value={setupData.qr_code_url} size={160} level="M" />
                </div>
                
                <h3 className="text-sm font-bold text-slate-800 mb-2">2. Confirmez le code</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Entrez le code à 6 chiffres généré par votre application pour confirmer la configuration.
                </p>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Ex: 123456" 
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-lg font-mono tracking-widest outline-none focus:border-blue-500 w-40 text-center" 
                  />
                  <button 
                    type="button" 
                    disabled={isConfirming2FA || totpCode.length !== 6}
                    onClick={handleConfirm2FA}
                    className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isConfirming2FA && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirmer
                  </button>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-2">Codes de secours (Recovery Codes)</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Sauvegardez ces codes en lieu sûr. Ils vous permettront de vous connecter si vous perdez accès à votre appareil.
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-w-sm">
                    {setupData.recovery_codes.map((code: string, i: number) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-xs font-mono font-bold text-slate-700 select-all">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Account Card */}
        <div className="bg-white border border-red-100 rounded-[1.5rem] shadow-sm p-8 md:p-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-red-600">Delete Account</h2>
            <p className="text-sm text-slate-500 mt-1">
              Once your account is deleted, all of its resources and data will be permanently deleted.
            </p>
          </div>
          <button
            type="button"
            className="px-8 py-3.5 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-colors text-sm uppercase tracking-wide border border-red-200"
          >
            Delete Account
          </button>
        </div>
      </form>
    </div>
  )
}
