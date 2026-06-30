import { Outlet } from 'react-router-dom'
import { Building2 } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl flex items-center justify-center">
            <img src="/logo-encg.png" alt="ENCG Fès" className="h-12 object-contain" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">ENCG Fès</p>
            <p className="text-white/70 text-sm">École Nationale de Commerce et de Gestion</p>
          </div>
        </div>

        <div>
          <blockquote className="text-white">
            <p className="text-3xl font-bold leading-snug mb-4">
              Plateforme de gestion universitaire
            </p>
            <p className="text-xl font-light text-white/80 mb-6">
              منصة الإدارة الجامعية
            </p>
            <p className="text-white/70 text-sm leading-relaxed">
              Un système intégré pour la gestion académique, administrative,
              pédagogique et financière — conçu pour les universités publiques marocaines.
            </p>
          </blockquote>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Étudiants', value: '2,400+' },
            { label: 'Enseignants', value: '180+' },
            { label: 'Modules', value: '320+' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-white font-bold text-xl">{stat.value}</p>
              <p className="text-white/70 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <img src="/logo-encg.png" alt="ENCG Fès" className="h-10 object-contain" />
            <span className="font-bold text-foreground">ENCG ERP</span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}
