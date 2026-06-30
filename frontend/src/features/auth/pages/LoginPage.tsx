import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@stores/authStore'
import { Button } from '@shared/components/ui/Button'
import { Input } from '@shared/components/ui/Input'
import { cn } from '@shared/lib/utils'

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
        <h1 className="text-2xl font-bold text-foreground">
          {isAr ? 'تسجيل الدخول' : 'Connexion'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAr ? 'أدخل بياناتك للوصول إلى المنصة' : 'Entrez vos identifiants pour accéder à la plateforme'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            {isAr ? 'البريد الإلكتروني' : 'Adresse email'}
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            error={!!errors.email}
            placeholder="nom@encg-fes.ma"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              {isAr ? 'كلمة المرور' : 'Mot de passe'}
            </label>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-xs text-primary hover:underline"
            >
              {isAr ? 'نسيت كلمة المرور؟' : 'Mot de passe oublié ?'}
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
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('remember')}
            className="w-4 h-4 rounded border-input accent-primary"
          />
          <span className="text-sm text-muted-foreground">
            {isAr ? 'تذكرني' : 'Se souvenir de moi'}
          </span>
        </label>

        {/* Submit */}
        <Button
          id="login-submit"
          type="submit"
          isLoading={isSubmitting}
          className="w-full mt-2 font-semibold text-white gradient-primary hover:opacity-90 transition-all duration-200"
        >
          {!isSubmitting && <LogIn className="w-4 h-4" />}
          {isSubmitting
            ? (isAr ? 'جاري الدخول...' : 'Connexion en cours...')
            : (isAr ? 'تسجيل الدخول' : 'Se connecter')}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        {isAr ? 'منصة إدارة جامعة ENCG فاس — نظام آمن ومشفر' : 'ENCG ERP — Plateforme sécurisée conforme à la loi 09-08'}
      </p>
    </div>
  )
}