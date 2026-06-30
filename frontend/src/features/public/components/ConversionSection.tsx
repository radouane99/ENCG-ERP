import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Clock3, Users } from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface ConversionSectionProps {
  lang?: 'fr' | 'en' | 'ar';
  isRTL?: boolean;
}

const translations = {
  fr: {
    title: "Prêt à transformer l'expérience éducative ?",
    subtitle: "Passez de l'ambition à l'action avec un ERP universitaire pensé pour l'ENCG Fès.",
    cards: [
      {
        title: 'Lancement rapide',
        description: "Une plateforme qui se déploie sans complexité et accélère les processus administratifs.",
        icon: ShieldCheck,
      },
      {
        title: 'Support local',
        description: "Accompagnement dédié et formation terrain pour les équipes pédagogiques et administratives.",
        icon: Clock3,
      },
      {
        title: 'Adoption mesurable',
        description: "Des gains concrets : moins de papier, plus de transparence et des cycles décisionnels optimisés.",
        icon: Users,
      },
    ],
    ctaPrimary: "Commencer l'inscription",
    ctaSecondary: "Voir le contact",
  },
  en: {
    title: 'Ready to transform the education experience?',
    subtitle: 'Move from ambition to action with a university ERP built for ENCG Fes.',
    cards: [
      {
        title: 'Fast onboarding',
        description: 'A platform that deploys without complexity and speeds up administrative workflows.',
        icon: ShieldCheck,
      },
      {
        title: 'Local support',
        description: 'Dedicated assistance and training for faculty and operations teams.',
        icon: Clock3,
      },
      {
        title: 'Measurable adoption',
        description: 'Real results: less paperwork, more transparency and smarter decisions.',
        icon: Users,
      },
    ],
    ctaPrimary: 'Start registration',
    ctaSecondary: 'See contact',
  },
  ar: {
    title: 'هل أنتم مستعدون لتحويل تجربة التعليم؟',
    subtitle: 'انتقل من الطموح إلى التنفيذ مع ERP جامعي مصمم للـ ENCG فاس.',
    cards: [
      {
        title: 'تسريع الإطلاق',
        description: 'منصة تنشر دون تعقيد وتسرع العمليات الإدارية.',
        icon: ShieldCheck,
      },
      {
        title: 'دعم محلي',
        description: 'مساعدة مخصصة وتدريب للهيئة التعليمية وفرق التشغيل.',
        icon: Clock3,
      },
      {
        title: 'تَبَنِّي يمكن قياسه',
        description: 'نتائج حقيقية: أوراق أقل، شفافية أكبر، وقرارات أذكى.',
        icon: Users,
      },
    ],
    ctaPrimary: 'ابدأ التسجيل',
    ctaSecondary: 'عرض جهة الاتصال',
  },
};

export default function ConversionSection({ lang = 'fr', isRTL = false }: ConversionSectionProps) {
  const t = translations[lang] ?? translations.fr;

  return (
    <section className="relative z-10 bg-slate-950 dark:bg-slate-900 py-24 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className={cn('grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center', isRTL ? 'text-right' : 'text-left')}>
          <div>
            <span className="inline-flex items-center gap-2 bg-white/10 text-white/90 px-4 py-2 rounded-full text-xs uppercase tracking-[0.25em] font-semibold mb-6">
              <ShieldCheck className="w-4 h-4" /> Action rapide
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-5">
              {t.title}
            </h2>
            <p className="max-w-2xl text-slate-300 text-lg leading-8 mb-8">
              {t.subtitle}
            </p>
            <div className={cn('flex flex-col sm:flex-row gap-4', isRTL ? 'sm:justify-end' : '')}>
              <Link
                to="/inscription"
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-[#E60028] to-[#FF5E67] px-8 py-4 text-sm font-bold text-white shadow-2xl shadow-[#E60028]/30 hover:scale-[1.02] transition-transform"
              >
                {t.ctaPrimary}
                <ArrowRight className={cn('w-4 h-4', isRTL && 'rotate-180')} />
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/20 bg-white/10 px-8 py-4 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
              >
                {t.ctaSecondary}
                <ArrowRight className={cn('w-4 h-4', isRTL && 'rotate-180')} />
              </a>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {t.cards.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur-xl">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E60028]/10 text-[#E60028] mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-slate-300 text-sm leading-7">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
