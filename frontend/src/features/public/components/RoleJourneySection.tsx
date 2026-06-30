import { ArrowRight, Building2, GraduationCap, ShieldCheck, Users } from 'lucide-react'

export type RoleJourneyLang = 'fr' | 'en' | 'ar'

interface RoleJourneySectionProps {
  lang?: RoleJourneyLang
  isRTL?: boolean
}

const content = {
  fr: {
    eyebrow: 'Rôles & Acteurs',
    title: 'Trois rôles, trois périmètres d’accès dédiés.',
    subtitle: 'Un système protégé par des middlewares stricts et une authentification multi-couche.',
    roles: [
      {
        title: 'Administrateur',
        icon: Building2,
        description: 'Pilote stratégique de l’établissement avec accès global et supervision de toute la plateforme.',
        points: ['Gestion des utilisateurs et de la structure académique', 'Planification des examens et génération des convocations', 'Validation des PV, rapports analytiques et configuration institutionnelle'],
      },
      {
        title: 'Professeur',
        icon: GraduationCap,
        description: 'Acteur pédagogique avec accès limité à son périmètre d’enseignement et à ses contrats.',
        points: ['Saisie et validation des notes', 'Gestion des absences et cahier de textes', 'Surveillance des examens et génération de PV'],
      },
      {
        title: 'Étudiant',
        icon: Users,
        description: 'Bénéficiaire des services académiques avec consultation sécurisée de son dossier.',
        points: ['Consultation des notes, emploi du temps et documents officiels', 'Soumission des réclamations et justificatifs d’absence', 'Participation à la vie associative et aux outils IA'],
      },
    ],
  },
  en: {
    eyebrow: 'Roles & Actors',
    title: 'Three roles, three dedicated access domains.',
    subtitle: 'A system protected by strict middleware and multi-layer authentication.',
    roles: [
      {
        title: 'Administrator',
        icon: Building2,
        description: 'Strategic leader with full access to the institution and governance workflows.',
        points: ['User management and academic structure setup', 'Exam planning and convocations generation', 'Validation of reports, official records and platform settings'],
      },
      {
        title: 'Professor',
        icon: GraduationCap,
        description: 'Pedagogical actor with scoped access to teaching responsibilities and contract checks.',
        points: ['Grade entry and validation', 'Absence management and lesson tracking', 'Exam surveillance and report generation'],
      },
      {
        title: 'Student',
        icon: Users,
        description: 'Academic beneficiary with secure read-only access to their record.',
        points: ['View grades, schedule and official documents', 'Submit claims and absence justifications', 'Join campus life and use AI study tools'],
      },
    ],
  },
  ar: {
    eyebrow: 'الأدوار والفاعلون',
    title: 'ثلاثة أدوار، ثلاثة نطاقات وصول مخصصة.',
    subtitle: 'نظام محمي بواسطة وسطاء صارمين ومصادقة متعددة الطبقات.',
    roles: [
      {
        title: 'المسؤول',
        icon: Building2,
        description: 'القائد الاستراتيجي مع وصول كامل إلى المؤسسة وسير العمل الحكومي.',
        points: ['إدارة المستخدمين والبنية الأكاديمية', 'تخطيط الامتحانات وتوليد الاستدعاءات', 'اعتماد التقارير والسجلات الرسمية وإعدادات المنصة'],
      },
      {
        title: 'الأستاذ',
        icon: GraduationCap,
        description: 'فاعل تربوي وصوله محدود لمسؤوليته التعليمية والتحقق من العقد.',
        points: ['إدخال النقاط واعتمادها', 'إدارة الغياب وتتبع الدروس', 'الإشراف على الامتحانات وتوليد المحاضر'],
      },
      {
        title: 'الطالب',
        icon: Users,
        description: 'مستفيد أكاديمي مع وصول آمن للمعاينة فقط لسجله.',
        points: ['عرض النقاط والجدول الزمني والوثائق الرسمية', 'تقديم الشكاوى وتبريرات الغياب', 'المشاركة في الحياة الجامعية واستخدام أدوات الذكاء الاصطناعي'],
      },
    ],
  },
}

export default function RoleJourneySection({ lang = 'fr', isRTL = false }: RoleJourneySectionProps) {
  const copy = content[lang]

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
      <div className="rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-white p-8 shadow-xl shadow-slate-100 backdrop-blur-xl dark:border-white/10 dark:from-[#0A1220] dark:via-[#08101B] dark:to-[#0A1220] md:p-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E60028]/20 bg-[#E60028]/10 px-3 py-1 text-sm font-semibold text-[#E60028]">
              <ShieldCheck className="h-4 w-4" />
              {copy.eyebrow}
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
              {copy.title}
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">{copy.subtitle}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            {lang === 'ar' ? 'أكثر من 3 parcours prêts à vivre' : 'Plus de 3 parcours prêts à vivre'}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {copy.roles.map((role) => {
            const Icon = role.icon
            return (
              <article
                key={role.title}
                className="group rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E60028]/10 text-[#E60028] dark:bg-[#E60028]/15">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{role.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{role.description}</p>
                <ul className="mt-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {role.points.map((point) => (
                    <li key={point} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#E60028]" />
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition group-hover:text-[#E60028] dark:text-slate-300">
                  {lang === 'ar' ? 'اعرف المزيد' : 'Découvrir'} <ArrowRight className={isRTL ? 'mr-1 h-4 w-4 rotate-180' : 'ml-1 h-4 w-4'} />
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
