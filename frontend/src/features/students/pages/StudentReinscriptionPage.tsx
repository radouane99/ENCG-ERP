import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GraduationCap,
  Printer,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@shared/components/layout/PageHeader'
import { Button } from '@shared/components/ui/Button'
import { confirmStudentRenewal, useRenewalStatus } from '../api/renewal'

const field =
  'mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium'

export default function StudentReinscriptionPage() {
  const cache = useQueryClient()
  const status = useRenewalStatus()
  const [contact, setContact] = useState({ phone: '', address: '', city: '' })
  const [hasInsurance, setHasInsurance] = useState(true)
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status.data) {
      setContact({
        phone: status.data.phone ?? '',
        address: status.data.address ?? '',
        city: status.data.city ?? '',
      })
    }
  }, [status.data?.student_name])

  const confirm = useMutation({
    mutationFn: () => confirmStudentRenewal({ ...contact, has_insurance: hasInsurance }),
    onSuccess: async () => {
      toast.success('Réinscription annuelle confirmée avec succès !')
      await cache.invalidateQueries({ queryKey: ['student-reinscription-status'] })
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        'La confirmation a échoué. Vos coordonnées sont conservées.'
      setError(message)
      toast.error(message)
    },
  })

  const data = status.data
  const receipt = data?.is_confirmed || confirm.isSuccess
  const paymentComplete = data?.payment_status === 'paid' || !data?.payment_required
  const reserveModules = data?.failed_modules || []
  const hasDebts = reserveModules.length > 0

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (consent && data?.can_confirm) {
      confirm.mutate()
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6 print:max-w-none print:p-0 font-sans pb-24">
      <PageHeader
        title="Ma réinscription annuelle • ENCG Fès"
        subtitle={
          data
            ? `Campagne universitaire ${data.academic_year} · Confirmation du passage pédagogique`
            : 'Vérification de votre inscription annuelle'
        }
      />

      {status.isPending ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center text-muted-foreground space-y-3">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="font-semibold text-sm">Chargement de votre dossier académique et des délibérations…</p>
        </div>
      ) : status.isError ? (
        <div role="alert" className="space-y-3 rounded-3xl border border-border bg-card p-8 text-center">
          <p className="text-sm font-semibold text-red-600">
            Votre dossier ne peut pas être chargé actuellement. Veuillez vérifier votre connexion ou réessayer.
          </p>
          <Button variant="outline" onClick={() => status.refetch()}>
            Réessayer
          </Button>
        </div>
      ) : (
        data && (
          <>
            {/* Banner Statut Principal */}
            <section
              className={`rounded-3xl border p-6 md:p-8 transition-all relative overflow-hidden ${
                receipt
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
                  : 'border-blue-200 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 dark:border-blue-900 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-2xl shrink-0 ${
                    receipt ? 'bg-emerald-500 text-white' : 'bg-[#0f2863] text-white shadow-md'
                  }`}
                >
                  {receipt ? (
                    <CheckCircle2 className="h-7 w-7" />
                  ) : (
                    <GraduationCap className="h-7 w-7 text-amber-300" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                      Rentrée {data.academic_year}
                    </span>
                    {data.annual_average && (
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Moyenne annuelle : <strong>{data.annual_average} / 20</strong>
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                    {receipt
                      ? 'Réinscription annuelle confirmée'
                      : `Passage vers : ${data.target_year_label || data.target_level}`}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {receipt
                      ? 'Votre confirmation annuelle est enregistrée dans les registres officiels. Votre récépissé est disponible ci-dessous.'
                      : data.blocking_reason ??
                        'Vérifiez votre situation pédagogique et validez vos coordonnées pour confirmer votre inscription.'}
                  </p>
                </div>
              </div>
            </section>

            {/* Situation Académique & Modules en Réserve */}
            <section className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-black text-base md:text-lg text-slate-900 dark:text-white">
                    Situation Pédagogique & Délibérations
                  </h2>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    hasDebts
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                  }`}
                >
                  {data.decision_label || (hasDebts ? 'Admis avec réserve' : 'Admis sans réserve')}
                </span>
              </div>

              {/* Transition de Niveau */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[10px]">Niveau Antérieur</span>
                  <p className="font-black text-sm text-slate-800 dark:text-slate-200 mt-0.5">
                    {data.previous_level || data.current_level}
                  </p>
                  <span className="text-slate-500 text-[11px]">{data.current_filiere}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[10px]">
                    Niveau Cible Réinscription
                  </span>
                  <p className="font-black text-sm text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {data.target_year_label || data.target_level}
                  </p>
                  <span className="text-slate-500 text-[11px]">Semestres S{data.target_semester} & S{(data.target_semester || 1) + 1}</span>
                </div>
              </div>

              {/* Alerte et Tableau des Modules en Réserve (Dettes) */}
              {hasDebts ? (
                <div className="space-y-4 pt-2">
                  <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-300 text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>{reserveModules.length} module(s) en réserve (dette) à repasser cette année :</span>
                    </div>
                    <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                      Conformément au règlement des études de l’ENCG Fès, vous êtes admis en année supérieure par
                      compensation, mais vous devez obligatoirement vous présenter aux sessions d’examens pour
                      rattraper le(s) module(s) ci-dessous :
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-black uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4">Code</th>
                          <th className="py-2.5 px-4">Intitulé du Module</th>
                          <th className="py-2.5 px-4">Semestre</th>
                          <th className="py-2.5 px-4">Note Antérieure</th>
                          <th className="py-2.5 px-4">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {reserveModules.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 font-medium">
                            <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {m.code}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{m.name}</td>
                            <td className="py-3 px-4 font-bold text-slate-600 dark:text-slate-400">{m.semester}</td>
                            <td className="py-3 px-4 font-mono font-bold text-amber-700 dark:text-amber-300">
                              {m.grade !== null ? `${m.grade} / 20` : '—'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                En réserve (Dette)
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30 p-4 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <strong className="block font-black text-sm">Aucun module en réserve (aucune dette)</strong>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                      Félicitations ! Vous avez validé l’intégralité de vos modules des semestres précédents. Vous
                      démarrez votre nouvelle année académique avec un dossier 100% propre.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Récépissé ou Formulaire de Confirmation */}
            {receipt ? (
              <section
                className="rounded-3xl border border-emerald-200 dark:border-emerald-800 bg-card p-6 md:p-8 space-y-4 shadow-sm"
                aria-label="Confirmation annuelle"
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="h-6 w-6 text-emerald-600" />
                  <h2 className="font-black text-lg text-slate-900 dark:text-white">
                    Récépissé Officiel de Réinscription
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ce document officiel atteste de votre réinscription administrative pour l’année universitaire{' '}
                  <strong>{data.academic_year}</strong> à l’École Nationale de Commerce et de Gestion de Fès.
                </p>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400">Numéro de Référence Enregistré</p>
                  <p className="font-mono font-black text-sm md:text-base text-indigo-700 dark:text-indigo-300 break-all">
                    {data.receipt_reference ??
                      confirm.data?.data.receipt_reference ??
                      'Chargement de la référence…'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Confirmé le :{' '}
                    {data.confirmed_at
                      ? new Date(data.confirmed_at).toLocaleString('fr-FR')
                      : 'Confirmation enregistrée'}
                  </p>
                </div>
                <Button
                  className="mt-2 print:hidden cursor-pointer"
                  variant="outline"
                  leadingIcon={<Printer className="h-4 w-4" />}
                  onClick={() => window.print()}
                >
                  Imprimer mon récépissé officiel
                </Button>
              </section>
            ) : (
              <section className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-5 shadow-xs">
                <div>
                  <h2 className="font-black text-lg text-slate-900 dark:text-white">
                    Confirmation des Coordonnées & Assurance
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Vérifiez et mettez à jour vos informations de contact avant de finaliser votre inscription.
                  </p>
                </div>

                <form className="space-y-4" onSubmit={submit}>
                  {error && (
                    <p
                      role="alert"
                      className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </p>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Téléphone personnel
                      <input
                        className={field}
                        type="tel"
                        autoComplete="tel"
                        required
                        maxLength={20}
                        value={contact.phone}
                        onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                        placeholder="Ex: 0612345678"
                      />
                    </label>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Ville de résidence
                      <input
                        className={field}
                        autoComplete="address-level2"
                        required
                        maxLength={100}
                        value={contact.city}
                        onChange={(e) => setContact({ ...contact, city: e.target.value })}
                        placeholder="Ex: Fès"
                      />
                    </label>
                  </div>

                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Adresse complète
                    <input
                      className={field}
                      autoComplete="street-address"
                      required
                      maxLength={255}
                      value={contact.address}
                      onChange={(e) => setContact({ ...contact, address: e.target.value })}
                      placeholder="Adresse de résidence pendant l'année universitaire"
                    />
                  </label>

                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/60 space-y-2">
                    <label className="flex items-start gap-3 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-slate-300"
                        checked={hasInsurance}
                        onChange={(e) => setHasInsurance(e.target.checked)}
                      />
                      <span>
                        <strong>Assurance Étudiante & AMO :</strong> J’atteste avoir souscrit à l’assurance obligatoire
                        (responsabilité civile étudiante et/ou AMO) pour l’année universitaire {data.academic_year}.
                      </span>
                    </label>
                  </div>

                  <label className="flex items-start gap-3 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-slate-300"
                      required
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    <span>
                      Je confirme sur l’honneur l’exactitude de ces informations et valide ma réinscription en{' '}
                      <strong>{data.target_year_label || data.target_level}</strong>.
                    </span>
                  </label>

                  <div className="flex justify-end border-t border-border pt-4">
                    <Button
                      disabled={!data.can_confirm || !consent}
                      isLoading={confirm.isPending}
                      type="submit"
                      className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-6 py-2.5 font-bold cursor-pointer"
                    >
                      Confirmer ma réinscription en {data.target_year_label || data.target_level}
                    </Button>
                  </div>
                </form>
              </section>
            )}
          </>
        )
      )}
    </div>
  )
}
