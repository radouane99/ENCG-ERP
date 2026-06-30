import { ArrowRight, Cloud, ShieldCheck, Sparkles, Clock3, Users } from 'lucide-react'

export type BenefitsLang = 'fr' | 'en' | 'ar'

interface BenefitsSectionProps {
  lang?: BenefitsLang
  isRTL?: boolean
}

const content = {
  fr: {
    eyebrow: 'Valeurs clés',
    title: 'Un ERP construit pour transformer le quotidien du campus.',
    subtitle: "Un écosystème qui met la performance, la sécurité et l’expérience utilisateur au cœur de chaque interaction.",
    cards: [
      {
        title: 'Opérations unifiées',
        description: 'Toutes les données académiques, administratives et financières dans un seul espace sécurisé.',
        points: ['Gestion centralisée', 'Flux sans rupture', 'Reportings immédiats'],
        icon: Cloud,
      },
      {
        title: 'Sécurité d’État',
        description: 'Chiffrement, permissions par rôle et conformité aux exigences institutionnelles.',
        points: ['Accès contrôlé', 'Audit complet', 'Traçabilité totale'],
        icon: ShieldCheck,
      },
      {
        title: 'IA accessible',
        description: 'Assistance proactive pour les étudiants et les équipes pédagogiques, disponible 24/7.',
        points: ['Réponses instantanées', 'Assistance aux évaluations', 'Conseils personnalisés'],
        icon: Sparkles,
      },
      {
        title: 'Expérience fluide',
        description: 'Interface moderne optimisée pour tous les utilisateurs, du candidat au professeur.',
        points: ['Navigation claire', 'Accès rapide', 'Tableaux de bord mobiles'],
        icon: Users,
      },
    ],
    statPrimary: '24/7 support IA',
    statSecondary: '100% cloud native',
    statTertiary: '3 parcours métier',
    action: 'Découvrir l’ERP',
  },
  en: {
    eyebrow: 'Core benefits',
    title: 'An ERP built to transform campus day-to-day operations.',
    subtitle: 'A unified ecosystem that puts performance, security, and user experience at the center of every interaction.',
    cards: [
      {
        title: 'Unified operations',
        description: 'All academic, administrative, and financial data in one secure place.',
        points: ['Centralized management', 'Smooth workflows', 'Instant reporting'],
        icon: Cloud,
      },
      {
        title: 'State-grade security',
        description: 'Encryption, role-based permissions, and institutional compliance.',
        points: ['Controlled access', 'Full audit trail', 'Complete traceability'],
        icon: ShieldCheck,
      },
      {
        title: 'Accessible AI',
        description: 'Proactive support for students and teaching staff, available 24/7.',
        points: ['Instant answers', 'Assessment support', 'Personalized guidance'],
        icon: Sparkles,
      },
      {
        title: 'Smooth experience',
        description: 'A modern interface optimized for every user, from applicants to professors.',
        points: ['Clear navigation', 'Fast access', 'Mobile-ready dashboards'],
        icon: Users,
      },
    ],
    statPrimary: '24/7 AI support',
    statSecondary: '100% cloud native',
    statTertiary: '3 role journeys',
    action: 'Explore the ERP',
  },
  ar: {
    eyebrow: 'الفوائد الرئيسية',
    title: 'نظام ERP مصمم لتحويل تجربة الحياة الجامعية اليومية.',
    subtitle: 'نظام موحد يضع الأداء والأمان وتجربة المستخدم في قلب كل تفاعل.',
    cards: [
      {
        title: 'عمليات موحدة',
        description: 'جميع البيانات الأكاديمية والإدارية والمالية في مكان آمن واحد.',
        points: ['إدارة مركزية', 'سير عمل سلس', 'تقارير فورية'],
        icon: Cloud,
      },
      {
        title: 'أمان حكومي',
        description: 'تشفير وأذونات حسب الدور والامتثال لمتطلبات المؤسسة.',
        points: ['وصول مسيطر عليه', 'تدقيق كامل', 'تتبع شامل'],
        icon: ShieldCheck,
      },
      {
        title: 'ذكاء اصطناعي متاح',
        description: 'دعم استباقي للطلاب والطاقم التعليمي على مدار الساعة.',
        points: ['إجابات فورية', 'دعم التقييمات', 'إرشاد شخصي'],
        icon: Sparkles,
      },
      {
        title: 'تجربة سلسة',
        description: 'واجهة حديثة مصممة لكل مستخدم، من المرشحين إلى الأساتذة.',
        points: ['تنقل واضح', 'وصول سريع', 'لوحات تحكم جاهزة للجوال'],
        icon: Users,
      },
    ],
    statPrimary: 'دعم الذكاء الاصطناعي 24/7',
    statSecondary: 'سحابي 100%',
    statTertiary: '3 مسارات دورية',
    action: 'اكتشف ERP',
  },
}

export default function BenefitsSection({ lang = 'fr', isRTL = false }: BenefitsSectionProps) {
  const copy = content[lang]

  return (
    <section id="benefits" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
      <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-slate-100 backdrop-blur-xl dark:border-white/10 dark:bg-[#0A1220]/90 dark:shadow-none md:p-10">
        <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E60028]/20 bg-[#E60028]/10 px-3 py-1 text-sm font-semibold text-[#E60028]">
              <Clock3 className="h-4 w-4" />
              {copy.eyebrow}
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              {copy.title}
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              {copy.subtitle}
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#E60028] to-[#A80A0B] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#E60028]/20 hover:shadow-[#E60028]/40 transition-all">
            {copy.action}
            <ArrowRight className={isRTL ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {copy.cards.map((card) => {
            const Icon = card.icon
            return (
              <article key={card.title} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-[#E60028]/10 text-[#E60028] dark:bg-[#E60028]/15">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{card.title}</h3>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400 mb-5">{card.description}</p>
                <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  {card.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#E60028]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[copy.statPrimary, copy.statSecondary, copy.statTertiary].map((stat) => (
            <div key={stat} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 mb-3">{stat}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">&nbsp;</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
