import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@stores/authStore'
import { Camera, Save, User as UserIcon, Lock, Mail, Phone, Loader2, Upload, ShieldCheck } from 'lucide-react'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'

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
    user?.avatar_path ? `${import.meta.env.VITE_API_URL}/storage/${user.avatar_path}` : null
  )
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

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

      if (response.data.user) {
        updateUser(response.data.user)
        setSuccessMessage('Profil mis à jour avec succès')
        setFormData(prev => ({ ...prev, password: '', password_confirmation: '' }))
      }
    } catch (error: any) {
      console.error(error)
      setErrorMessage(error.response?.data?.message || 'Une erreur s\'est produite lors de la mise à jour')
    } finally {
      setIsLoading(false)
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
            <h2 className="text-xl font-bold text-slate-800">Double Authentification (2FA) Active</h2>
            <p className="text-sm text-slate-500 mt-1">
              La sécurité de votre compte administrateur est renforcée par un mot de passe à usage unique (TOTP).
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-start gap-4 max-w-3xl">
            <ShieldCheck className="w-6 h-6 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">
                Votre compte est hautement sécurisé par authentificateur mobile.
              </p>
            </div>
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
