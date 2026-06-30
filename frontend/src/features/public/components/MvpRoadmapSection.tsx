import { ArrowRight, BadgeCheck, BookOpen, ShieldCheck, Sparkles } from 'lucide-react'

const phases = [
  {
    title: 'Phase 1',
    subtitle: 'Fondations produit',
    description: 'Authentification, rôles, gestion des profils et base de permissions.',
    points: ['Connexion sécurisée', 'Adresses e-mail vérifiées', 'Tableau de bord par rôle'],
    accent: 'from-[#E60028] to-[#A80A0B]',
  },
  {
    title: 'Phase 2',
    subtitle: 'Structure académique',
    description: 'Filières, groupes, modules, salles et affectations simples.',
    points: ['Gestion académique', 'Répartition étudiants', 'Planification de base'],
    accent: 'from-sky-600 to-blue-700',
  },
  {
    title: 'Phase 3',
    subtitle: 'Examens & notes',
    description: 'Création d’examens, convocation, saisie de notes et validation.',
    points: ['Examens', 'Convocations', 'PV et relevés'],
    accent: 'from-emerald-600 to-teal-700',
  },
  {
    title: 'Phase 4',
    subtitle: 'Documents & services',
    description: 'Absences, réclamations et génération de documents officiels.',
    points: ['Absences', 'Réclamations', 'Documents PDF'],
    accent: 'from-violet-600 to-fuchsia-700',
  },
]

export default function MvpRoadmapSection() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
      <div className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-8 shadow-xl shadow-slate-100 backdrop-blur-xl dark:border-white/10 dark:bg-[#0A1220]/80 dark:shadow-none md:p-10">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E60028]/20 bg-[#E60028]/10 px-3 py-1 text-sm font-semibold text-[#E60028]">
              <Sparkles className="h-4 w-4" />
              Roadmap MVP
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
              Une première version ambitieuse, mais livrable.
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Le MVP met l’accent sur le cœur du besoin académique : sécurité, structure, examens et documents officiels.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-semibold">
              <BadgeCheck className="h-4 w-4" />
              Priorité : livraison rapide et robuste
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {phases.map((phase, index) => (
            <article
              key={phase.title}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/5"
            >
              <div className={`mb-4 inline-flex rounded-full bg-gradient-to-r ${phase.accent} px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white`}>
                {phase.title}
              </div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {index === 0 ? <ShieldCheck className="h-4 w-4 text-[#E60028]" /> : null}
                {index === 1 ? <BookOpen className="h-4 w-4 text-sky-600" /> : null}
                {index === 2 ? <Sparkles className="h-4 w-4 text-emerald-600" /> : null}
                {index === 3 ? <BadgeCheck className="h-4 w-4 text-violet-600" /> : null}
                {phase.subtitle}
              </div>
              <p className="mb-4 text-sm leading-6 text-slate-600 dark:text-slate-400">{phase.description}</p>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {phase.points.map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#E60028]" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white dark:border-white/10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Prochaine amélioration</p>
            <p className="mt-1 text-lg font-semibold">Ajouter l’interface administrative de gestion des examens et notes.</p>
          </div>
          <a
            href="#contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:opacity-90"
          >
            Voir la vision produit <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
