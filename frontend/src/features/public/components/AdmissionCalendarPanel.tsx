import { Link } from 'react-router-dom'
import { CalendarDays, ArrowRight } from 'lucide-react'
import { useAdmissionCalendar } from '../api/useAdmissionCalendar'

const copy = {
  fr: { title: 'Calendrier des inscriptions', open: 'Inscriptions ouvertes', upcoming: 'Prochaine ouverture', closed: 'Inscriptions fermées', closedText: 'Aucune session d’inscription n’est ouverte actuellement. Les prochaines dates seront publiées après programmation par l’administration.', loading: 'Vérification du calendrier…', error: 'Calendrier momentanément indisponible. Réessayez pour vérifier les dates.', retry: 'Réessayer', register: 'Accéder à cette session', login: 'Suivre mon dossier existant', dates: 'Du', until: 'au', zone: 'Dates selon le calendrier de l’établissement · heure du Maroc.' },
  en: { title: 'Enrollment calendar', open: 'Enrollment open', upcoming: 'Upcoming enrollment', closed: 'Enrollment closed', closedText: 'No enrollment session is currently open. Dates will appear after the administration schedules a session.', loading: 'Checking the calendar…', error: 'Calendar temporarily unavailable. Retry to check the dates.', retry: 'Retry', register: 'Open this session', login: 'Track my existing application', dates: 'From', until: 'to', zone: 'Institution calendar · Morocco time.' },
  ar: { title: 'رزنامة التسجيل', open: 'التسجيل مفتوح', upcoming: 'التسجيل قريباً', closed: 'التسجيل مغلق', closedText: 'لا توجد دورة تسجيل مفتوحة حالياً. ستنشر المواعيد بعد برمجتها من طرف الإدارة.', loading: 'جار التحقق من الرزنامة…', error: 'الرزنامة غير متاحة مؤقتاً. أعد المحاولة للتحقق من المواعيد.', retry: 'إعادة المحاولة', register: 'الولوج إلى هذه الدورة', login: 'تتبع ملفي الحالي', dates: 'من', until: 'إلى', zone: 'مواعيد المؤسسة حسب توقيت المغرب.' },
}

export default function AdmissionCalendarPanel({ lang = 'fr', compact = false }: { lang?: 'fr' | 'en' | 'ar'; compact?: boolean }) {
  const calendar = useAdmissionCalendar()
  const t = copy[lang]
  const format = (date: string) => new Intl.DateTimeFormat(lang === 'ar' ? 'ar-MA' : lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Casablanca' }).format(new Date(`${date}T12:00:00Z`))
  return <section id="inscriptions" data-testid="public-admission-calendar" className={`relative z-10 mx-auto scroll-mt-28 ${compact ? 'py-4' : 'max-w-7xl px-6 py-10'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
    <div className={`portal-surface ${compact ? 'p-4' : 'p-6 sm:p-8'}`}>
      <h2 className={`flex items-center gap-3 font-bold text-foreground ${compact ? 'text-lg' : 'portal-heading'}`}><span className="portal-icon"><CalendarDays className="h-5 w-5" /></span>{t.title}</h2>
      {calendar.isPending ? <p role="status" className="mt-4 text-muted-foreground">{t.loading}</p> : calendar.isError ? <div className="mt-4 space-y-3"><p role="alert">{t.error}</p><button onClick={() => { void calendar.refetch() }} className="min-h-11 rounded-xl border border-border px-4">{t.retry}</button></div> : <>
        <p role="status" data-state={calendar.data.state} className={`portal-status mt-5 ${calendar.data.state === 'open' ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}>{t[calendar.data.state]}</p>
        {calendar.data.state === 'closed' && <p className="mt-2 max-w-3xl text-muted-foreground">{t.closedText}</p>}
        <div className={`mt-4 grid gap-4 ${compact ? '' : 'md:grid-cols-2'}`}>{calendar.data.campaigns.map(campaign => <article key={campaign.id} className="portal-notice">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{campaign.entry_route.toUpperCase()} · S{campaign.entry_semester} · {t[campaign.state]}</p>
          <h3 className="mt-2 font-bold text-foreground">{campaign.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t.dates} {format(campaign.open_date)} {t.until} {format(campaign.close_date)}</p>
          {campaign.state === 'open' && !compact && <Link to={`/inscription?campaign_id=${campaign.id}`} className="portal-action portal-action-primary mt-4">{t.register}<ArrowRight className="h-4 w-4" /></Link>}
        </article>)}</div>
      </>}
      <Link to="/login" className="portal-action portal-action-secondary mt-5">{t.login}</Link>
      <p className="mt-2 text-xs text-muted-foreground">{t.zone}</p>
    </div>
  </section>
}
