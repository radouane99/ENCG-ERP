import { Outlet, Link } from 'react-router-dom'
import { Sparkles, Globe, Sun, Moon, ArrowRight, ShieldCheck, Award, ChevronDown, Check } from 'lucide-react'
import { useTheme } from '@shared/components/layout/ThemeProvider'
import { useTranslation } from 'react-i18next'
import { cn } from '@shared/lib/utils'
import { useState, useEffect } from 'react'
import { changeAppLanguage } from '@shared/lib/locale'

const QUOTES = [
  { fr: "Excellence & Innovation dans le Management & le Commerce", ar: "التميز والابتكار في التدبير والتجارة", en: "Excellence & innovation in management and business" },
  { fr: "Formons les Leaders Financiers et Managers de Demain", ar: "تكوين قادة الغد في التسيير والمالية", en: "Training tomorrow’s financial leaders and managers" },
  { fr: "Diplômes Certifiés Blockchain & Réseau Alumnis ENCG Fès", ar: "دبلومات موثقة برقميات الأمان وشبكة خريجين واعدة", en: "Blockchain-certified degrees & ENCG Fez alumni network" },
]

import { useRef } from 'react'

export default function AuthLayout() {
  const { theme, setTheme } = useTheme()
  const { i18n } = useTranslation('auth')
  const currentTheme = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme
  const isAr = i18n.language === 'ar'
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [langOpen, setLangOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangOpen(false)
      }
    }
    if (langOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [langOpen])

  const changeLanguage = (lang: string) => {
    void changeAppLanguage(lang)
    setLangOpen(false)
  }

  const LANGUAGES = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇲🇦' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ]

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-background text-foreground select-none font-sans">
      {/* Decorative Floating Ambient Blobs */}
      <div className="absolute -top-40 -right-40 w-[650px] h-[650px] rounded-full bg-primary/10 dark:bg-primary/15 blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute -bottom-40 -left-40 w-[550px] h-[550px] rounded-full bg-indigo-500/10 dark:bg-blue-600/15 blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

      {/* ── Left Panel — Premium Branding with ENCG Fès Campus ── */}
      <div 
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 xl:p-16 overflow-hidden border-e border-border/40 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(8, 15, 34, 0.65), rgba(4, 9, 20, 0.88)), url('/login-bg.png')`,
        }}
      >
        {/* Animated Glow Blobs inside left panel */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#E60028]/15 rounded-full blur-[100px] pointer-events-none" style={{ animationDelay: '3s' }} />

        {/* Overlay Grid */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Logo and Campus Title */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-white p-2.5 rounded-2xl flex items-center justify-center shadow-xl shadow-black/20 border border-white/20 hover:scale-105 transition-transform duration-300">
            <img src="/logo-encg.png" alt="ENCG Fès" className="h-11 object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-black text-xl tracking-tight">ENCG Fès</p>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                USMBA
              </span>
            </div>
            <p className="text-white/75 text-xs font-semibold">
              {isAr ? 'المدرسة الوطنية للتجارة والتسيير بفاس' : 'École Nationale de Commerce et de Gestion de Fès'}
            </p>
          </div>
        </div>

        {/* Dynamic Slogan & Rotating Quote Ticker */}
        <div className="relative z-10 max-w-xl space-y-6 my-auto py-8">
          <div className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/15 text-white/90 border border-white/15 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md transition-all shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
            {isAr ? 'البوابة الجامعية الذكية والآمنة' : 'Portail Universitaire Intelligent & Sécurisé'}
          </div>

          <div className="space-y-4">
            <h1 className="text-white text-3xl xl:text-4xl font-black leading-tight tracking-tight">
              {isAr ? (
                <>
                  منصة الإدارة الجامعية <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-amber-200">
                    الرقمية المتكاملة
                  </span>
                </>
              ) : (
                <>
                  Plateforme de Gestion <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-amber-200">
                    Universitaire Intégrée
                  </span>
                </>
              )}
            </h1>
            
            {/* Rotating Quote Banner */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/15 backdrop-blur-md transition-all duration-500 animate-in fade-in duration-500">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold mb-1">
                <Award className="w-4 h-4" /> {isAr ? 'رؤية التميز الأكاديمي' : 'Vision d\'Excellence ENCG'}
              </div>
              <p className="text-white/90 text-sm font-semibold italic">
                "{i18n.language.startsWith('ar') ? QUOTES[quoteIndex].ar : i18n.language.startsWith('en') ? QUOTES[quoteIndex].en : QUOTES[quoteIndex].fr}"
              </p>
            </div>

            <p className="text-white/80 text-xs leading-relaxed font-medium max-w-lg">
              {isAr 
                ? 'منظومة أكاديمية وإدارية متكاملة تضمن التميز والنجاعة للطلبة والأساتذة والأطر الإدارية بالمدرسة الوطنية للتجارة والتسيير بفاس.' 
                : 'Un écosystème académique et administratif connecté garantissant l\'excellence opérationnelle pour les étudiants, professeurs et administrateurs de l\'ENCG Fès.'}
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3 text-xs font-semibold text-white/70">
            <span className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> {isAr ? 'مطابقة للقانون 09-08' : 'Conformité CNDP 09-08'}
            </span>
            <span className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
              🔒 {isAr ? 'تشفير آمن SSL 256-bit' : 'SSL 256-bit Encrypted'}
            </span>
          </div>
        </div>

        {/* Live Stats Footers */}
        <div className="grid grid-cols-3 gap-4 relative z-10">
          {[
            { label: isAr ? 'طلبة مسجلون' : 'Étudiants Actifs', value: '2,400+', icon: '🎓' },
            { label: isAr ? 'أساتذة ومؤطرون' : 'Enseignants', value: '180+', icon: '👨‍🏫' },
            { label: isAr ? 'وحدات أكاديمية' : 'Modules APOGEE', value: '320+', icon: '📚' },
          ].map((stat) => (
            <div 
              key={stat.label} 
              className="group backdrop-blur-md bg-black/30 border border-white/10 hover:border-white/25 hover:bg-black/45 rounded-2xl p-4 text-center cursor-default transition-all duration-300 hover:scale-[1.02] shadow-lg"
            >
              <div className="text-lg mb-1 group-hover:scale-110 transition-transform">{stat.icon}</div>
              <p className="text-white font-black text-2xl tracking-tight font-mono">{stat.value}</p>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel — Main Auth Container ── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 relative z-10 min-h-screen lg:min-h-0">
        
        {/* Top Navbar: Quick Settings */}
        <div className="flex items-center justify-between w-full max-w-lg mx-auto mb-6 sm:mb-0">
          <Link 
            to="/inscription" 
            className="flex items-center gap-2 text-xs font-black text-primary hover:text-primary/80 transition-all bg-primary/10 hover:bg-primary/15 border border-primary/20 px-3.5 py-2 rounded-xl shadow-sm hover:scale-[1.02]"
          >
            <span>{isAr ? 'التسجيل القبلي TAFEM' : 'Préinscription TAFEM'}</span>
            <ArrowRight className={cn("w-3.5 h-3.5", isAr && "rotate-180")} />
          </Link>

          <div className="flex items-center gap-2">
            {/* Custom Sleek Language Dropdown */}
            <div ref={dropdownRef} className="relative z-50">
              <button
                type="button"
                onClick={() => setLangOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-card hover:bg-muted border border-border/80 rounded-xl px-3 py-2 text-xs font-bold text-foreground shadow-sm transition-all cursor-pointer hover:border-primary/30"
              >
                <span className="text-base leading-none">{currentLang.flag}</span>
                <span>{currentLang.label}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-200", langOpen && "rotate-180")} />
              </button>

              {/* Floating Menu */}
              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        changeLanguage(lang.code)
                      }}
                      onClick={() => {
                        changeLanguage(lang.code)
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer pointer-events-auto",
                        i18n.language === lang.code 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="text-base leading-none">{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {i18n.language === lang.code && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-sm cursor-pointer"
              title="Changer de thème"
            >
              {currentTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Center Card Container with Animated Slide-up & Zoom-in */}
        <div className="w-full max-w-md mx-auto my-auto py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Mobile Header Logo */}
          <div className="flex items-center justify-center gap-3 mb-6 lg:hidden">
            <div className="bg-white p-2 rounded-xl border border-border shadow-sm flex items-center justify-center">
              <img src="/logo-encg.png" alt="ENCG Fès" className="h-10 object-contain" />
            </div>
            <div>
              <p className="text-foreground font-black text-lg leading-none">ENCG Fès</p>
              <p className="text-muted-foreground text-xs mt-1">École Nationale de Commerce et de Gestion</p>
            </div>
          </div>

          {/* Frosted Glass Form Card */}
          <div className="bg-card/90 dark:bg-card/80 backdrop-blur-2xl border border-border/80 p-8 sm:p-9 rounded-[2.5rem] shadow-2xl shadow-black/10 relative overflow-hidden transition-all duration-300 hover:shadow-primary/5">
            {/* Top Accent Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-[#E60028]" />
            <Outlet />
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] font-semibold text-muted-foreground mt-6">
          © 2026 ENCG Fès — Université Sidi Mohamed Ben Abdellah · Tous droits réservés
        </div>

      </div>
    </div>
  )
}

