import React from 'react'
import { BookOpen, Users, Calendar, Award, ChevronRight, MessageSquare, BrainCircuit } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@shared/lib/utils'

export default function ProfessorDashboard() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-[1200px] mx-auto animate-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] p-8 text-white rounded-[2rem] shadow-xl shadow-[hsl(var(--color-primary))/10] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl mix-blend-overlay"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            {isRtl ? 'مرحباً، أستاذ بنسودة' : 'Bonjour, Pr. BENSOUDA'}
          </h1>
          <p className="text-white/80 font-medium">
            {t('modules:prof_dash.subtitle')}
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20">
            <p className="text-3xl font-bold leading-none">3</p>
            <p className="text-[10px] uppercase tracking-wider text-white/70 mt-1">{t('modules:prof_dash.today_sessions')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20">
            <p className="text-3xl font-bold leading-none">120</p>
            <p className="text-[10px] uppercase tracking-wider text-white/70 mt-1">{isRtl ? 'طالب' : 'Étudiants'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main features) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">{isRtl ? 'الوصول السريع' : 'Accès Rapide'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Classroom Card */}
            <Link to="/professors/classroom" className="group bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 hover:shadow-lg transition-all hover:-translate-y-1 block relative overflow-hidden">
              <div className="absolute top-0 end-0 p-6 opacity-5 text-[hsl(var(--color-primary))] transform group-hover:scale-110 transition-transform">
                <Users size={80} />
              </div>
              <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">{isRtl ? 'القسم الرقمي (Classroom)' : 'Espace Classroom'}</h3>
              <p className="text-[hsl(var(--muted-foreground))] text-sm mb-4">
                {isRtl ? 'إدارة الغياب بالـ QR، مشاركة الملفات، والتفاعل' : 'Appel par QR Code, partage de documents et interaction.'}
              </p>
              <div className="flex items-center text-blue-600 font-semibold text-sm">
                {isRtl ? 'دخول القسم' : 'Entrer dans la classe'} <ChevronRight className={cn("w-4 h-4 ms-1", isRtl && "rotate-180")} />
              </div>
            </Link>

            {/* AI Assistant Card */}
            <Link to="/professors/ai-assistant" className="group bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 hover:shadow-lg transition-all hover:-translate-y-1 block relative overflow-hidden">
              <div className="absolute top-0 end-0 p-6 opacity-5 text-purple-600 transform group-hover:scale-110 transition-transform">
                <BrainCircuit size={80} />
              </div>
              <div className="w-12 h-12 bg-purple-500/10 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <BrainCircuit size={24} />
              </div>
              <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">{t('modules:prof_dash.ai_title')}</h3>
              <p className="text-[hsl(var(--muted-foreground))] text-sm mb-4">
                {isRtl ? 'توليد أسئلة QCM، تحليل نتائج الطلاب، تلخيص' : 'Générateur de QCM, analyse prédictive des résultats.'}
              </p>
              <div className="flex items-center text-purple-600 font-semibold text-sm">
                {isRtl ? 'بدء المحادثة' : 'Démarrer l\'assistant'} <ChevronRight className={cn("w-4 h-4 ms-1", isRtl && "rotate-180")} />
              </div>
            </Link>

          </div>

          <h2 className="text-lg font-bold text-[hsl(var(--foreground))] pt-4">{t('modules:prof_dash.today_timetable')}</h2>
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-2 shadow-sm">
            <div className="flex items-center p-4 hover:bg-[hsl(var(--muted)/50)] rounded-2xl transition-colors">
              <div className="w-16 text-center font-bold text-[hsl(var(--color-primary))]">08:30</div>
              <div className="w-1 bg-[hsl(var(--color-primary))] rounded-full h-10 mx-4"></div>
              <div className="flex-1">
                <h4 className="font-bold text-[hsl(var(--foreground))]">Management Stratégique (M12)</h4>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Amphi 1 • S6 • Gestion</p>
              </div>
            </div>
            <div className="flex items-center p-4 hover:bg-[hsl(var(--muted)/50)] rounded-2xl transition-colors">
              <div className="w-16 text-center font-bold text-amber-500">10:30</div>
              <div className="w-1 bg-amber-500 rounded-full h-10 mx-4"></div>
              <div className="flex-1">
                <h4 className="font-bold text-[hsl(var(--foreground))]">Finance d'Entreprise (M04)</h4>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Salle 14 • S4 • ENCG</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Widgets) */}
        <div className="space-y-6">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-[hsl(var(--foreground))]">
              <MessageSquare className="w-5 h-5 text-pink-500" />
              {t('modules:prof_dash.admin_alerts')}
            </h3>
            <div className="space-y-4">
              <div className="bg-pink-500/10 text-pink-700 dark:text-pink-400 p-4 rounded-2xl text-sm font-medium">
                Saisie des notes de rattrapage ouverte jusqu'au 15 Juillet.
              </div>
              <div className="bg-blue-500/10 text-blue-700 dark:text-blue-400 p-4 rounded-2xl text-sm font-medium">
                Réunion du département Finance prévue ce Jeudi à 14h.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
