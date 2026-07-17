import { Outlet } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex relative overflow-hidden bg-background">
      {/* Decorative Floating Blobs for Right/Global Panel */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl animate-float-delayed pointer-events-none" />

      {/* Left panel — branding with ENCG Fes image background */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden border-e border-border bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(10, 18, 38, 0.35), rgba(7, 11, 22, 0.6)), url('/login-bg.png')`,
        }}
      >
        {/* Animated Glow Blobs inside left panel */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-primary/20 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-accent/15 rounded-full blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '3s' }} />

        {/* Dotted Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Logo and Header */}
        <div className="flex items-center gap-4 relative z-10 animate-fade-in-premium drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          <div className="bg-white p-2.5 rounded-2xl flex items-center justify-center shadow-md">
            <img src="/logo-encg.png" alt="ENCG Fès" className="h-12 object-contain" />
          </div>
          <div>
            <p className="text-white font-extrabold text-xl tracking-tight">ENCG Fès</p>
            <p className="text-white/80 text-xs font-semibold">École Nationale de Commerce et de Gestion</p>
          </div>
        </div>

        {/* Slogan / Slogans quote */}
        <div className="relative z-10 max-w-lg space-y-6 animate-slide-up-premium delay-200 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
          <div className="inline-flex items-center gap-2 bg-black/35 text-white/90 border border-white/10 px-3.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" /> Portail Universitaire Intelligent
          </div>
          <blockquote className="space-y-4">
            <h1 className="text-white text-4xl font-black leading-tight tracking-tight">
              Plateforme de gestion universitaire
            </h1>
            <p className="text-2xl font-medium text-white/80 italic font-sans" dir="rtl">
              منصة الإدارة الجامعية المتكاملة
            </p>
            <p className="text-white/80 text-sm leading-relaxed font-medium">
              Un écosystème connecté simplifiant le parcours académique, administratif et financier pour l'excellence de l'enseignement supérieur au Maroc.
            </p>
          </blockquote>
        </div>

        {/* Stats Blocks */}
        <div className="grid grid-cols-3 gap-5 relative z-10 animate-slide-up-premium delay-400">
          {[
            { label: 'Étudiants', value: '2,400+' },
            { label: 'Enseignants', value: '180+' },
            { label: 'Modules', value: '320+' },
          ].map((stat) => (
            <div 
              key={stat.label} 
              className="group backdrop-blur-md bg-black/25 border border-white/10 hover:border-white/20 hover:bg-black/35 rounded-2xl p-4 text-center cursor-default transition-all duration-300 hover:scale-[1.03]"
            >
              <p className="text-white font-black text-2xl tracking-tight transition-transform duration-300 group-hover:scale-105">{stat.value}</p>
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider mt-1.5 transition-colors group-hover:text-white/80">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md animate-slide-up-premium relative z-20">
          
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden animate-slide-up-premium delay-100">
            <div className="bg-white dark:bg-card p-2 rounded-xl border border-border shadow-sm flex items-center justify-center">
              <img src="/logo-encg.png" alt="ENCG Fès" className="h-10 object-contain" />
            </div>
            <div>
              <p className="text-foreground font-black text-lg leading-none">ENCG Fès</p>
              <p className="text-muted-foreground text-xs mt-1">École Nationale de Commerce et de Gestion</p>
            </div>
          </div>

          {/* Frosted Glass Form Container */}
          <div className="bg-card/60 dark:bg-card/40 backdrop-blur-xl border border-border p-8 rounded-3xl shadow-xl shadow-black/[0.02] dark:shadow-black/20">
            <Outlet />
          </div>

        </div>
      </div>
    </div>
  )
}
