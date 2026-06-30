import { ArrowRight, MessageSquare, Star, Users } from 'lucide-react'

export type TestimonialsLang = 'fr' | 'en' | 'ar'

interface TestimonialsSectionProps {
  lang?: TestimonialsLang
  isRTL?: boolean
}

const content = {
  fr: {
    eyebrow: 'Ils témoignent',
    title: 'Ce que nos utilisateurs disent déjà.',
    subtitle: 'Des retours concrets qui illustrent la confiance portée à l’ERP ENCG Fès.',
    testimonials: [
      {
        name: 'Khadija El Amrani',
        role: 'Responsable Admission',
        quote: 'La visibilité en temps réel sur les inscriptions a transformé notre capacité à piloter les campagnes d’admission.',
      },
      {
        name: 'Prof. Samir Bennis',
        role: 'Enseignant',
        quote: 'La correction assistée par IA réduit de moitié le temps passé sur les notes et me laisse plus de temps pour mes étudiants.',
      },
      {
        name: 'Yassine Belkadi',
        role: 'Étudiant',
        quote: 'Tous mes documents officiels sont accessibles en quelques clics, c’est une vraie révolution pour la vie étudiante.',
      },
    ],
    cta: 'Voir les cas d’usage',
  },
  en: {
    eyebrow: 'What they say',
    title: 'Voices from the campus community.',
    subtitle: 'Real feedback showing how ENCG Fes ERP is making administration, teaching, and student life easier.',
    testimonials: [
      {
        name: 'Khadija El Amrani',
        role: 'Admissions Lead',
        quote: 'Real-time insight into enrollments transformed how we manage admission campaigns.',
      },
      {
        name: 'Prof. Samir Bennis',
        role: 'Teacher',
        quote: 'AI-assisted grading cuts my evaluation workload in half and gives me more time with students.',
      },
      {
        name: 'Yassine Belkadi',
        role: 'Student',
        quote: 'All my official documents are available with a few clicks — a true student-life revolution.',
      },
    ],
    cta: 'See use cases',
  },
  ar: {
    eyebrow: 'ماذا يقولون',
    title: 'آراء مجتمع الحرم الجامعي.',
    subtitle: 'ردود فعل حقيقية توضح كيف يسهل ERP ENCG Fès الإدارة والتدريس والحياة الطلابية.',
    testimonials: [
      {
        name: 'خديجة العمراني',
        role: 'مسؤولة القبول',
        quote: 'توفر البيانات الفورية عن التسجيلات حسّن قدراتنا في إدارة حملات القبول.',
      },
      {
        name: 'الأستاذ سمير بنيس',
        role: 'أستاذ',
        quote: 'التصحيح المدعوم بالذكاء الاصطناعي يختصر وقت التقييم ويمنحني المزيد من الوقت مع الطلاب.',
      },
      {
        name: 'ياسين بلقاضي',
        role: 'طالب',
        quote: 'جميع وثائقي الرسمية متاحة بنقرات قليلة — ثورة حقيقية في حياة الطالب.',
      },
    ],
    cta: 'عرض حالات الاستخدام',
  },
}

export default function TestimonialsSection({ lang = 'fr', isRTL = false }: TestimonialsSectionProps) {
  const copy = content[lang]

  return (
    <section id="testimonials" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
      <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-slate-100 backdrop-blur-xl dark:border-white/10 dark:bg-[#0A1220]/90 dark:shadow-none md:p-10">
        <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E60028]/20 bg-[#E60028]/10 px-3 py-1 text-sm font-semibold text-[#E60028]">
              <MessageSquare className="h-4 w-4" />
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
            {copy.cta}
            <ArrowRight className={isRTL ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {copy.testimonials.map((item) => (
            <article key={item.name} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#E60028]/10 text-[#E60028] dark:bg-[#E60028]/15">
                  <Star className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{item.role}</p>
                </div>
              </div>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">“{item.quote}”</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition group-hover:text-[#E60028] dark:text-slate-300">
                {lang === 'ar' ? 'اقرأ المزيد' : 'Read more'}
                <ArrowRight className={isRTL ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
