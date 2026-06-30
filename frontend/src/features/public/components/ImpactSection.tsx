import { ShieldCheck, Clock3, FileSearch, BookOpen } from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface ImpactSectionProps {
  lang?: 'fr' | 'en' | 'ar';
  isRTL?: boolean;
}

const content = {
  fr: {
    title: 'Impact public & confiance',
    description: 'ERP public conçu pour ENCG Fès et USMBA : transparence administrative, conformité pédagogique et accès sécurisé aux documents officiels.',
    badges: ['ENCG Fès', 'USMBA', '100% Institution publique', 'Cloud native'],
    cards: [
      {
        icon: ShieldCheck,
        title: 'Sécurité étatique',
        description: 'Une conception conforme aux standards publics et aux attentes des institutions académiques.',
      },
      {
        icon: Clock3,
        title: 'Temps de traitement réduit',
        description: 'Simplification des flux d’inscription, des convocations et de la gestion des absences.',
      },
      {
        icon: FileSearch,
        title: 'Transparence totale',
        description: 'Suivi clair des demandes et accès 24/7 aux documents officiels depuis un espace sécurisé.',
      },
      {
        icon: BookOpen,
        title: 'Support pédagogique',
        description: 'Outils dédiés pour enseignants, étudiants et administration au sein d’un même environnement.',
      },
    ],
  },
      en: {
        title: 'Public impact & trust',
        description: 'Designed for public institutions, our ERP boosts administrative transparency, shortens processing time, and secures student and faculty data.',
        badges: [],
        cards: [
          {
            icon: ShieldCheck,
            title: 'State-grade security',
            description: 'Built to meet public institution standards and academic requirements.',
          },
          {
            icon: Clock3,
            title: 'Reduced processing time',
            description: 'Streamlined enrollment, convocations, and absence management workflows.',
          },
          {
            icon: FileSearch,
            title: 'Full transparency',
            description: 'Clear request tracking and 24/7 access to official documents in a secure portal.',
          },
          {
            icon: BookOpen,
            title: 'Academic support',
            description: 'Dedicated tools for faculty, students, and administration in one system.',
          },
        ],
      },
      ar: {
        title: 'الأثر العام والثقة',
        description: 'مصمم للمؤسسات العامة، يعمل ERP الخاص بنا على تعزيز الشفافية الإدارية، وتقليل وقت المعالجة، وتأمين بيانات الطلاب وأعضاء الهيئة التدريسية.',
        badges: [],
        cards: [
          {
            icon: ShieldCheck,
            title: 'أمن حكومي',
            description: 'مصمم ليتوافق مع معايير المؤسسات العامة والمتطلبات الأكاديمية.',
          },
          {
            icon: Clock3,
            title: 'تقليل وقت المعالجة',
            description: 'تبسيط عمليات التسجيل، الاستدعاءات، وإدارة الغيابات.',
          },
          {
            icon: FileSearch,
            title: 'شفافية كاملة',
            description: 'تتبع واضح للطلبات ووصول 24/7 إلى الوثائق الرسمية عبر بوابة آمنة.',
          },
          {
            icon: BookOpen,
            title: 'دعم أكاديمي',
            description: 'أدوات مخصصة لأعضاء الهيئة التدريسية والطلاب والإدارة داخل نظام واحد.',
          },
        ],
      },
};

export default function ImpactSection({ lang = 'fr', isRTL = false }: ImpactSectionProps) {
  const section = (content[lang] ?? content.fr) as typeof content['fr'];

  return (
    <section className={cn('relative z-10 bg-slate-50 dark:bg-[#02060D] py-24', isRTL ? 'text-right' : 'text-left')}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center mb-14">
          <div className="inline-flex flex-wrap justify-center gap-3 mb-6">
            {section.badges?.map((badge: string) => (
              <span key={badge} className="inline-flex items-center rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700 dark:text-slate-200 shadow-sm">
                {badge}
              </span>
            ))}
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
            {section.title}
          </h2>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300 leading-8">
            {section.description}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {section.cards.map(({ icon: Icon, title, description }) => (
            <div key={title} className="group rounded-[2rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#09131F] p-8 shadow-lg shadow-slate-200/30 dark:shadow-black/20 transition-all hover:-translate-y-1">
              <div className="inline-flex items-center justify-center rounded-3xl bg-[#E60028]/10 text-[#E60028] w-14 h-14 mb-6">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-7">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
