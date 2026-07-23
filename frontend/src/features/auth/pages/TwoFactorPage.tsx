import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ArrowRight, Loader2, KeyRound } from 'lucide-react'
import { useAuthStore } from '@stores/authStore'
import { toast } from 'sonner'

export default function TwoFactorPage() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { verifyTwoFactor, requiresTwoFactor } = useAuthStore()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Redirect if not in 2FA flow
  useEffect(() => {
    if (!requiresTwoFactor) {
      navigate('/login', { replace: true })
    }
  }, [requiresTwoFactor, navigate])

  if (!requiresTwoFactor) {
    return null
  }

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1)
    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    // Auto-submit when all 6 digits are filled
    if (index === 5 && digit) {
      const fullCode = [...newCode.slice(0, 5), digit].join('')
      if (fullCode.length === 6) {
        submitCode(fullCode)
      }
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newCode = pasted.split('')
      setCode(newCode)
      inputRefs.current[5]?.focus()
      submitCode(pasted)
    }
  }

  const submitCode = async (fullCode: string) => {
    if (fullCode.length !== 6) return
    setIsLoading(true)
    try {
      await verifyTwoFactor(fullCode)
      toast.success('Authentification réussie !')
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Code invalide ou expiré.'
      toast.error(msg)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    submitCode(code.join(''))
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 text-primary mx-auto rounded-2xl flex items-center justify-center mb-4 ring-4 ring-primary/20">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Vérification en deux étapes</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Entrez le code à 6 chiffres généré par votre application <strong>Google Authenticator</strong> ou <strong>Authy</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mt-8">
        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-${index}`}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={isLoading}
              className="w-12 h-14 text-center text-xl font-bold bg-background border-2 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading || code.join('').length < 6}
          className="w-full bg-primary text-white hover:bg-primary/90 h-11 rounded-lg font-medium shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>Vérifier <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
        
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <KeyRound className="w-4 h-4" />
            Vous pouvez aussi utiliser un <strong>code de récupération</strong>.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm text-primary hover:underline"
          >
            ← Retour à la connexion
          </button>
        </div>
      </form>
    </div>
  )
}
