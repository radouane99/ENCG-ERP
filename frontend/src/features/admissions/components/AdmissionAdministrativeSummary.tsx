import { dateText, statusLabels, statusLabelsAr, type AdmissionDossier } from '../model/workflow'

export default function AdmissionAdministrativeSummary({ dossier, ar }: { dossier: AdmissionDossier; ar: boolean }) {
  const context = dossier.administrative_context
  if (!context) return null
  const empty = ar ? 'غير محدد' : 'Non renseigné'
  const states: Record<string, string> = { ...(ar ? statusLabelsAr : statusLabels), pending: ar ? 'في الانتظار' : 'En attente', academic_validated: ar ? 'مصادق عليه أكاديمياً' : 'Validé pédagogiquement', admin_validated: ar ? 'مصادق عليه إدارياً' : 'Validé administrativement', cancelled: ar ? 'ملغى' : 'Annulé' }
  const cycles: Record<string, string> = { grande_ecole: 'Grande École', licence: 'Licence', master: 'Master', doctorat: 'Doctorat' }
  const cycle = (value: string | null) => cycles[value ?? ''] || value || empty
  const rows = [
    [ar ? 'طريقة الولوج' : 'Mode d’accès', context.entry_route?.toUpperCase()],
    [ar ? 'السنة الجامعية' : 'Année universitaire d’inscription', context.academic_year],
    [ar ? 'الجامعة' : 'Université', context.university],
    [ar ? 'المسلك' : 'Filière', context.filiere],
    [ar ? 'السلك' : 'Cycle', cycle(context.cycle)],
    [ar ? 'الفصل المستهدف' : 'Semestre d’entrée prévu', context.planned_entry_semester ? `S${context.planned_entry_semester}` : empty],
    [ar ? 'الفصول المسجلة فعلياً' : 'Semestres effectivement inscrits', context.registration_semesters.map(s => `S${s}`).join(', ')],
    [ar ? 'حالة التسجيل' : 'Statut inscription', states[context.registration_status] || context.registration_status],
    [ar ? 'تاريخ التسجيل الرسمي' : 'Date d’inscription validée', dateText(context.registration_date)],
    [ar ? 'تاريخ إنشاء الملف' : 'Date de création du dossier', dateText(context.created_at)],
    [ar ? 'آخر تحيين' : 'Dernière mise à jour', dateText(context.updated_at)],
  ]
  return <section className="mt-6 space-y-4" aria-label={ar ? 'المسار الإداري' : 'Parcours administratif'}>
    <h3 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-800 dark:border-slate-800 dark:text-slate-200">{ar ? 'التسجيل وإعادة التسجيل' : 'Inscription et réinscriptions'}</h3>
    <p className="text-xs text-muted-foreground">{ar ? 'معلومات تديرها الإدارة وتُعرض للقراءة فقط.' : 'Ces informations sont issues des dossiers administratifs et affichées en lecture seule.'}</p>
    <dl className="grid gap-4 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label}><dt className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</dt><dd className="mt-1 text-sm">{value || empty}</dd></div>)}</dl>
    <h4 className="text-sm font-semibold">{ar ? 'سجل إعادة التسجيل' : 'Historique des réinscriptions'}</h4>
    {context.renewals.length === 0 ? <p className="text-xs text-muted-foreground">{ar ? 'لا توجد إعادة تسجيل مسجلة.' : 'Aucune réinscription enregistrée.'}</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{(ar ? ['السنة', 'الفصل', 'المسلك', 'السلك', 'التاريخ', 'الحالة'] : ['Année', 'Semestre', 'Filière', 'Cycle', 'Date', 'Statut']).map(label => <th className="p-2 text-xs" key={label}>{label}</th>)}</tr></thead><tbody>{context.renewals.map((row, index) => <tr className="border-t border-slate-100 dark:border-slate-800" key={index}>{[row.academic_year, `S${row.semester}`, row.filiere, cycle(row.cycle), dateText(row.date), states[row.status] || row.status].map((value, column) => <td className="p-2" key={column}>{value || empty}</td>)}</tr>)}</tbody></table></div>}
  </section>
}
