import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@stores/authStore'
import { Button } from '@shared/components/ui/Button'
import { Input } from '@shared/components/ui/Input'
import { cn } from '@shared/lib/utils'
import { CndpPrivacyModal } from '@shared/components/ui/CndpPrivacyModal'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  remember: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { t, i18n } = useTranslation('auth')
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showCndpModal, setShowCndpModal] = useState(false)
  const isAr = i18n.language === 'ar'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await login(data.email, data.password)
      if (result.requiresTwoFactor) {
        navigate('/two-factor')
      } else {
        navigate('/dashboard')
        toast.success(isAr ? 'مرحباً بك!' : 'Bienvenue !')
      }
    } catch (err: any) {
      const message = err.response?.data?.message
      if (err.response?.status === 422) {
        setError('email', { message: message || 'Identifiants incorrects' })
      } else {
        toast.error(message || 'Erreur de connexion')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          {t('login_title')}
        </h1>
        <p className="text-muted-foreground text-xs mt-1.5 font-medium">
          {t('login_subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-foreground" htmlFor="email">
            {t('email')}
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            error={!!errors.email}
            placeholder="nom@encg-fes.ma"
            className="w-full transition-all focus:ring-2 focus:ring-primary/20"
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1 font-semibold">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-foreground" htmlFor="password">
              {t('password')}
            </label>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-xs text-primary hover:underline font-semibold"
            >
              {t('forgot_password')}
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              error={!!errors.password}
              placeholder="••••••••"
              className="w-full transition-all focus:ring-2 focus:ring-primary/20 pe-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive mt-1 font-semibold">{errors.password.message}</p>
          )}
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register('remember')}
            className="w-4 h-4 rounded border-border bg-transparent text-primary focus:ring-primary accent-primary"
          />
          <span className="text-sm font-medium text-muted-foreground">
            {t('remember_me')}
          </span>
        </label>

        {/* Submit */}
        <Button
          id="login-submit"
          type="submit"
          isLoading={isSubmitting}
          className="w-full mt-3 font-bold text-white gradient-primary hover:opacity-95 shadow-md shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
        >
          {!isSubmitting && <LogIn className="w-4 h-4" />}
          {isSubmitting ? t('logging_in') : t('login_button')}
        </Button>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border"></span>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            <span className="bg-card px-3">
              {isAr ? 'أو' : 'Ou'}
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full font-bold border-border bg-transparent hover:bg-muted text-foreground transition-all duration-200 flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-[0.99]"
          onClick={() => {
            window.location.href = `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/google/redirect`
          }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            <path fill="none" d="M1 1h22v22H1z" />
          </svg>
          {isAr ? 'المتابعة بحساب Google' : 'Se connecter avec Google'}
        </Button>
      </form>

      <p className="text-center text-[10px] font-semibold tracking-wide text-muted-foreground uppercase flex flex-col gap-1 items-center justify-center">
        <span>{isAr ? 'منصة إدارة جامعة ENCG فاس — نظام آمن ومشفر' : 'ENCG ERP — Plateforme sécurisée conforme à la loi 09-08'}</span>
        <button
          type="button"
          onClick={() => setShowCndpModal(true)}
          className="text-primary hover:underline font-bold normal-case cursor-pointer"
        >
          {isAr ? 'حماية المعطيات الشخصية (CNDP)' : 'Protection des Données Personnelles (CNDP)'}
        </button>
      </p>

      <CndpPrivacyModal isOpen={showCndpModal} onClose={() => setShowCndpModal(false)} lang={i18n.language} />
    </div>
  )
}
