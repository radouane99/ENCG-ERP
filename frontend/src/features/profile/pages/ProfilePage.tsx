import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@stores/authStore'
import { Camera, Save, User as UserIcon, Lock, Mail, Phone, Loader2 } from 'lucide-react'
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
    name_ar: user?.name_ar || '',
    email: user?.email || '',
    phone: user?.phone || '',
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
        setErrorMessage(i18n.language === 'ar' ? 'ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø­Ø¬Ù… Ø§Ù„ØµÙˆØ±Ø© Ø£Ù‚Ù„ Ù…Ù† 2 Ù…ÙŠØºØ§Ø¨Ø§ÙŠØª' : 'La taille de l\'image doit être inférieure Ã  2 Mo')
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
      if (formData.name_ar) payload.append('name_ar', formData.name_ar)
      payload.append('email', formData.email)
      if (formData.phone) payload.append('phone', formData.phone)
      
      if (formData.password) {
        if (formData.password !== formData.password_confirmation) {
          setErrorMessage(i18n.language === 'ar' ? 'ÙƒÙ„Ù…ØªØ§ Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± Ù…ØªØ·Ø§Ø¨Ù‚ØªÙŠÙ†' : 'Les mots de passe ne correspondent pas')
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
        setSuccessMessage(i18n.language === 'ar' ? 'ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø´Ø®ØµÙŠ Ø¨Ù†Ø¬Ø§Ø­' : 'Profil mis Ã  jour avec succès')
        setFormData(prev => ({ ...prev, password: '', password_confirmation: '' }))
      }
    } catch (error: any) {
      console.error(error)
      setErrorMessage(error.response?.data?.message || (i18n.language === 'ar' ? 'Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„ØªØ­Ø¯ÙŠØ«' : 'Une erreur s\'est produite lors de la mise Ã  jour'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {i18n.language === 'ar' ? 'Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø´Ø®ØµÙŠ' : 'Mon Profil'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {i18n.language === 'ar' ? 'Ù‚Ù… Ø¨ØªØ­Ø¯ÙŠØ« Ø¨ÙŠØ§Ù†Ø§ØªÙƒ Ø§Ù„Ø´Ø®ØµÙŠØ© ÙˆØµÙˆØ±ØªÙƒ' : 'Mettez Ã  jour vos informations personnelles et votre photo'}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          
          {/* Avatar Upload Section */}
          <div className="flex flex-col md:flex-row gap-8 items-center mb-10 pb-8 border-b border-border">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-lg bg-muted flex items-center justify-center text-4xl text-muted-foreground font-bold relative z-10">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/jpg" 
                className="absolute inset-0 opacity-0 cursor-pointer z-30" 
                onChange={handleFileChange}
              />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg z-30 pointer-events-none group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h3 className="text-xl font-semibold text-foreground">{user?.name}</h3>
              <p className="text-muted-foreground text-sm mt-1">{user?.roles?.[0]}</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {i18n.language === 'ar' ? 'ØµÙˆØ±Ø© Ø¨Ø­Ø¬Ù… Ø£Ù‚Ù„ Ù…Ù† 2MB' : 'Image max 2MB'}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  JPG, PNG
                </span>
              </div>
            </div>
          </div>

          {/* Error and Success Alerts */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Basic Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium flex items-center gap-2 text-foreground">
                <UserIcon className="w-5 h-5 text-primary" />
                {i18n.language === 'ar' ? 'Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©' : 'Informations de base'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {i18n.language === 'ar' ? 'Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„' : 'Nom complet'}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {i18n.language === 'ar' ? 'Ø§Ù„Ø§Ø³Ù… Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©' : 'Nom en Arabe'}
                  </label>
                  <input
                    type="text"
                    name="name_ar"
                    value={formData.name_ar}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-right"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {i18n.language === 'ar' ? 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ' : 'Email'}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {i18n.language === 'ar' ? 'Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ' : 'Téléphone'}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Security */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium flex items-center gap-2 text-foreground">
                <Lock className="w-5 h-5 text-primary" />
                {i18n.language === 'ar' ? 'Ø§Ù„Ø£Ù…Ø§Ù†' : 'Sécurité'}
              </h3>
              
              <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-4">
                <p className="text-sm text-muted-foreground">
                  {i18n.language === 'ar' 
                    ? 'Ø§ØªØ±Ùƒ Ø§Ù„Ø­Ù‚ÙˆÙ„ ÙØ§Ø±ØºØ© Ø¥Ø°Ø§ ÙƒÙ†Øª Ù„Ø§ ØªØ±ØºØ¨ ÙÙŠ ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±' 
                    : 'Laissez vide si vous ne souhaitez pas changer votre mot de passe'}
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {i18n.language === 'ar' ? 'ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©' : 'Nouveau mot de passe'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {i18n.language === 'ar' ? 'ØªØ£ÙƒÙŠØ¯ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±' : 'Confirmer le mot de passe'}
                  </label>
                  <input
                    type="password"
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-all shadow-lg hover:shadow-xl",
                "bg-gradient-to-r from-primary to-primary/80 hover:scale-105 active:scale-95",
                isLoading && "opacity-70 pointer-events-none"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {i18n.language === 'ar' ? 'Ø­ÙØ¸ Ø§Ù„ØªØºÙŠÙŠØ±Ø§Øª' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
