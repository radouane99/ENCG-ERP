import { useState } from 'react'
import { ArrowRight, ChevronDown, CircleHelp } from 'lucide-react'

export type FaqLang = 'fr' | 'en' | 'ar'

interface FaqSectionProps {
  lang?: FaqLang
  isRTL?: boolean
}

const content = {
  fr: {
    eyebrow: 'FAQ',
    title: 'Questions fréquentes',
    subtitle: 'Tout ce qu’il faut savoir pour comprendre la valeur de l’ERP ENCG Fès.',
    items: [
      {
        question: 'Comment les documents officiels sont-ils accessibles ?',
        answer: 'Les relevés, attestations et documents administratifs sont disponibles en ligne via un espace sécurisé, avec historique et export PDF.',
      },
      {
        question: 'Qui peut utiliser la plateforme ?',
        answer: 'L’ERP est pensé pour les administrateurs, les enseignants, les étudiants et les services de support, avec des parcours adaptés à chaque rôle.',
      },
      {
        question: 'L’IA est-elle réellement intégrée au quotidien ?',
        answer: 'Oui. L’assistance IA accompagne la saisie, la correction, l’analyse des résultats et la réponse aux questions fréquentes des étudiants.',
      },
    ],
    cta: 'Découvrir la vision produit',
  },
  en: {
    eyebrow: 'FAQ',
    title: 'Frequently asked questions',
    subtitle: 'Everything you need to know about the value of the ENCG Fes ERP.',
    items: [
      {
        question: 'How are official documents accessed?',
        answer: 'Transcripts, certificates, and administrative documents are available online in a secure space, with history and PDF export.',
      },
      {
        question: 'Who can use the platform?',
        answer: 'The ERP is designed for administrators, teachers, students, and support teams, with workflows tailored to each role.',
      },
      {
        question: 'Is AI truly integrated into daily use?',
        answer: 'Yes. AI assistance supports grading, data entry, result analysis, and answers to common student questions.',
      },
    ],
    cta: 'Discover the product vision',
  },
  ar: {
    eyebrow: 'الأسئلة الشائعة',
    title: 'أسئلة متكررة',
    subtitle: 'كل ما تحتاجه لفهم قيمة نظام ERP ENCG Fès.',
    items: [
      {
        question: 'كيف يمكن الوصول إلى الوثائق الرسمية؟',
        answer: 'تتوفر الكشوف والشهادات والوثائق الإدارية عبر منصة آمنة مع تاريخ وامكانية تصدير PDF.',
      },
      {
        question: 'من يمكنه استخدام المنصة؟',
        answer: 'تم تصميم ERP للإداريين والأستاذة والطلاب وفرق الدعم، مع مسارات مخصصة لكل دور.',
      },
      {
        question: 'هل الذكاء الاصطناعي مدمج بالفعل في الاستخدام اليومي؟',
        answer: 'نعم. يدعم الذكاء الاصطناعي التصحيح وإدخال البيانات وتحليل النتائج وإجابة الأسئلة الشائعة للطلاب.',
      },
    ],
    cta: 'اكتشف رؤية المنتج',
  },
}

export default function FaqSection({ lang = 'fr', isRTL = false }: FaqSectionProps) {
  const copy = content[lang]
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
      <div className="rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-white p-8 shadow-xl shadow-slate-100 backdrop-blur-xl dark:border-white/10 dark:from-[#0A1220] dark:via-[#08101B] dark:to-[#0A1220] md:p-10">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E60028]/20 bg-[#E60028]/10 px-3 py-1 text-sm font-semibold text-[#E60028]">
              <CircleHelp className="h-4 w-4" />
              {copy.eyebrow}
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              {copy.title}
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              {copy.subtitle}
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#E60028]/30 hover:text-[#E60028] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            {copy.cta}
            <ArrowRight className={isRTL ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
          </button>
        </div>

        <div className="space-y-4">
          {copy.items.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div key={item.question} className="rounded-[1.5rem] border border-slate-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                >
                  <span className="text-base font-semibold text-slate-900 dark:text-white">{item.question}</span>
                  <ChevronDown className={isOpen ? 'h-5 w-5 shrink-0 text-[#E60028] transition-transform rotate-180' : 'h-5 w-5 shrink-0 text-slate-500 transition-transform'} />
                </button>
                {isOpen ? (
                  <div className="px-5 pb-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {item.answer}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
