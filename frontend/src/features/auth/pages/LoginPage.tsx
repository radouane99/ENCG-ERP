import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Eye, EyeOff, LogIn, Mail, Lock, Sparkles, UserCheck, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@stores/authStore'
import { Button } from '@shared/components/ui/Button'
import { Input } from '@shared/components/ui/Input'
import { cn } from '@shared/lib/utils'
import { CndpPrivacyModal } from '@shared/components/ui/CndpPrivacyModal'
import { fetchSsoProviders, type SsoProvider } from '@features/auth/api/sso'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  remember: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { t, i18n } = useTranslation('auth')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showCndpModal, setShowCndpModal] = useState(false)
  const [ssoProviders, setSsoProviders] = useState<SsoProvider[]>([])
  const isAr = i18n.language === 'ar'

  useEffect(() => {
    const error = searchParams.get('error')
    if (!error) {
      return
    }
    const messages: Record<string, string> = {
      domain: t('sso_error_domain'),
      unknown_account: t('sso_error_unknown_account'),
      sso: t('sso_error_generic'),
      google: t('sso_error_generic'),
    }
    toast.error(messages[error] || t('sso_error_generic'))
    navigate('/login', { replace: true })
  }, [searchParams, navigate, t])

  useEffect(() => {
    fetchSsoProviders()
      .then(setSsoProviders)
      .catch(() => setSsoProviders([]))
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  })

  const handleQuickDemoFill = (email: string) => {
    setValue('email', email)
    setValue('password', 'password')
    toast.info(isAr ? `تم اختيار حساب التجربة: ${email}` : `Compte démo sélectionné : ${email}`)
  }

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await login(data.email, data.password)
      if (result.requiresTwoFactor) {
        navigate('/two-factor')
      } else {
        navigate('/dashboard')
        toast.success(isAr ? 'مرحباً بك!' : 'Bienvenue sur votre portail ENCG !')
      }
    } catch (err) {
      const errorResponse = err as any
      const message = errorResponse.response?.data?.message
      if (errorResponse.response?.status === 422) {
        setError('email', { message: message || 'Identifiants incorrects' })
      } else {
        toast.error(message || 'Erreur de connexion')
      }
    }
  }

  return (
    <div data-testid="login-page" dir={isAr ? 'rtl' : 'ltr'} className={cn("space-y-6 font-sans", isAr && "text-right")}>
      {/* Header Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border border-primary/20">
          <UserCheck className="w-3 h-3" /> {isAr ? 'مدخل آمن — المدرسة الوطنية للتجارة والتسيير بفاس' : 'Portail Officiel ENCG Fès'}
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          {t('login_title')}
        </h1>
        <p className="text-muted-foreground text-xs mt-1 font-medium">
          {t('login_subtitle')}
        </p>
      </div>

      {import.meta.env.DEV && (
      <div className="p-3 bg-muted/50 dark:bg-muted/30 border border-border/70 rounded-2xl space-y-2">
        <div className="flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground tracking-wider">
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-500" /> {isAr ? 'حسابات التجربة السريعة' : 'Comptes Démo Rapides'}</span>
          <span className="text-[9px] text-primary">{isAr ? 'تعبئة تلقائية' : '1-Click AutoFill'}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => handleQuickDemoFill('admin@encg-fes.ma')}
            className="px-2 py-1.5 rounded-xl bg-card hover:bg-primary/10 hover:border-primary/40 border border-border font-bold text-foreground transition-all cursor-pointer text-center truncate"
            title={isAr ? 'دخول الإدارة' : 'Connexion Admin'}
          >
            👨‍💼 {isAr ? 'إدارة' : 'Admin'}
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoFill('prof@encg-fes.ma')}
            className="px-2 py-1.5 rounded-xl bg-card hover:bg-primary/10 hover:border-primary/40 border border-border font-bold text-foreground transition-all cursor-pointer text-center truncate"
            title={isAr ? 'دخول الأستاذ' : 'Connexion Professeur'}
          >
            👨‍🏫 {isAr ? 'أستاذ' : 'Prof'}
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoFill('student@encg-fes.ma')}
            className="px-2 py-1.5 rounded-xl bg-card hover:bg-primary/10 hover:border-primary/40 border border-border font-bold text-foreground transition-all cursor-pointer text-center truncate"
            title={isAr ? 'دخول الطالب' : 'Connexion Étudiant'}
          >
            🎓 {isAr ? 'طالب' : 'Étudiant'}
          </button>
        </div>
      </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field with Lead Icon */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center justify-between" htmlFor="email">
            <span>{t('email')}</span>
            <span className="text-[10px] text-muted-foreground font-normal">{isAr ? 'nom@encg-fes.ma' : 'Format: nom@encg-fes.ma'}</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Mail className="w-4 h-4" />
            </div>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              error={!!errors.email}
              placeholder="nom@encg-fes.ma"
              className={cn("w-full transition-all focus:ring-2 focus:ring-primary/20 bg-background/80 rounded-xl", isAr ? "pr-10 pl-3" : "ps-10")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive mt-1 font-semibold">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field with Lead Icon & Password Toggle */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-foreground" htmlFor="password">
              {t('password')}
            </label>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-xs text-primary hover:underline font-bold"
            >
              {t('forgot_password')}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Lock className="w-4 h-4" />
            </div>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              error={!!errors.password}
              placeholder="••••••••"
              className={cn("w-full transition-all focus:ring-2 focus:ring-primary/20 bg-background/80 rounded-xl", isAr ? "pr-10 pl-10" : "ps-10 pe-10")}
            />
            <button
              type="button"
              aria-label={showPassword ? (isAr ? 'إخفاء كلمة المرور' : 'Masquer le mot de passe') : (isAr ? 'إظهار كلمة المرور' : 'Afficher le mot de passe')}
              onClick={() => setShowPassword(!showPassword)}
              className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer", isAr ? "left-3" : "end-3")}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive mt-1 font-semibold">{errors.password.message}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('remember')}
              className="w-4 h-4 rounded border-border bg-transparent text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <span className="text-xs font-semibold text-muted-foreground">
              {t('remember_me')}
            </span>
          </label>
        </div>

        {/* Main Submit Button */}
        <Button
          id="login-submit"
          data-testid="login-submit"
          type="submit"
          isLoading={isSubmitting}
          className="w-full mt-2 py-3 rounded-xl font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-[#E60028] hover:opacity-95 shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer uppercase text-xs tracking-wider"
        >
          {!isSubmitting && <LogIn className="w-4 h-4 me-2" />}
          {isSubmitting ? t('logging_in') : t('login_button')}
        </Button>

        {ssoProviders.length > 0 && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/80"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                <span className="bg-card px-3 py-0.5 rounded-full border border-border/60">
                  {t('sso_divider')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {ssoProviders.map((provider) => (
                <Button
                  key={provider.id}
                  type="button"
                  variant="outline"
                  className="w-full font-bold border-border/80 bg-background/60 hover:bg-muted text-foreground rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  onClick={() => {
                    window.location.href = provider.redirect
                  }}
                >
                  <SsoProviderIcon providerId={provider.id} />
                  <span className="text-xs">{t('sso_continue_with', { provider: provider.label })}</span>
                </Button>
              ))}
            </div>
          </>
        )}
      </form>

      {/* CNDP Footer Link */}
      <div className="pt-2 text-center text-[10px] font-semibold text-muted-foreground flex flex-col items-center justify-center gap-1">
        <span>{isAr ? 'منصة آمنة وفق القانون 09-08' : 'Conformité CNDP — Loi n° 09-08'}</span>
        <button
          type="button"
          onClick={() => setShowCndpModal(true)}
          className="text-primary hover:underline font-bold text-[11px] cursor-pointer"
          data-testid="cndp-privacy-link"
        >
          {isAr ? 'معلومات حماية البيانات الشخصية' : 'Protection des Données Personnelles'}
        </button>
      </div>

      <CndpPrivacyModal isOpen={showCndpModal} onClose={() => setShowCndpModal(false)} lang={i18n.language} />
    </div>
  )
}

function SsoProviderIcon({ providerId }: { providerId: string }) {
  if (providerId === 'google') {
    return (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    )
  }

  if (providerId === 'microsoft') {
    return (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23" aria-hidden>
        <path fill="#f25022" d="M1 1h10v10H1z" />
        <path fill="#7fba00" d="M12 1h10v10H12z" />
        <path fill="#00a4ef" d="M1 12h10v10H1z" />
        <path fill="#ffb900" d="M12 12h10v10H12z" />
      </svg>
    )
  }

  return <Shield className="w-4 h-4 shrink-0 text-primary" />
}
