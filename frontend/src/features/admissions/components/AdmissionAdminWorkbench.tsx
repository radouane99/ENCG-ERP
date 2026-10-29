import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ListOrdered,
  GraduationCap,
  Search,
  X,
  RefreshCw,
  FileUp,
  Download,
  ClipboardCheck,
  ExternalLink,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Settings,
  Layers,
  FileText,
  UserCheck,
  QrCode,
  AlertCircle,
  Eye,
  ShieldCheck,
  Building2,
  Inbox
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@shared/lib/api'
import AdmissionConsistencyAlerts from './AdmissionConsistencyAlerts'
import AdmissionDossierOperations from './AdmissionDossierOperations'
import AdmissionOperationsBoard from './AdmissionOperationsBoard'
import AdmissionEnrollments from './AdmissionEnrollments'
import AdmissionCampaignSettings from './AdmissionCampaignSettings'
import { useAdmissionCampaigns, useAdmissionDossier, errorMessage } from '../api/workflow'
import {
  dateText,
  profileLabels,
  documentLabels,
  documentTypes,
  statusLabels,
  entryRouteLabels,
  workflowBase,
  type DocumentType
} from '../model/workflow'

interface Row {
  id: number
  reference_number: string
  cne: string
  cin?: string
  first_name: string
  last_name: string
  dossier_status: string
  eligibility: string
  ranking?: number
}

interface ImportPreview {
  id: number
  valid_rows: number
  errors: { line: number; messages: string[] }[]
  can_commit: boolean
  preview: Record<string, string>[]
}

export default function AdmissionAdminWorkbench() {
  const [params, setParams] = useSearchParams()
  const linkedCampaign = Number(params.get('campaign_id'))
  const linkedApplication = Number(params.get('application_id'))

  const campaigns = useAdmissionCampaigns()
  const [campaign, setCampaign] = useState<number | undefined>(() =>
    Number.isSafeInteger(linkedCampaign) && linkedCampaign > 0 ? linkedCampaign : undefined
  )

  // Pipeline phases / tabs:
  // 1: settings (Campagnes & Paramètres)
  // 2: import (Importation de la liste officielle)
  // 3: dossiers (Revue des dossiers & OCR)
  // 4: appointments (Guichet & Émargement)
  // 5: enrollments (Inscriptions & Groupes)
  // utility: operations (Suivi & Incidents)
  const [tab, setTab] = useState<'dossiers' | 'import' | 'appointments' | 'settings' | 'enrollments' | 'operations'>('dossiers')

  // Search & filters for dossiers
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [eligibilityFilter, setEligibilityFilter] = useState('')
  const [page, setPage] = useState(1)

  // Dossier selection & inspection
  const [selected, setSelected] = useState<number>()
  const [documentType, setDocumentType] = useState<DocumentType>('bac')
  const dossier = useAdmissionDossier(selected, !!selected)

  // Review states & actions
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')
  const [officialNumber, setOfficialNumber] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [verifiedContact, setVerifiedContact] = useState(false)
  const [physical, setPhysical] = useState<Record<string, boolean>>({
    bac_original: false,
    releve_notes: false,
    cin_copy: false,
    photos: false,
  })
  const [corrections, setCorrections] = useState<Record<string, string | number>>({})

  // Import states
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [reconcileTarget, setReconcileTarget] = useState<Record<number, string>>({})
  const [reconcileReason, setReconcileReason] = useState('')

  // Appointments & Reception states
  const [allocation, setAllocation] = useState<{
    id: string
    assignments: { reference: string; starts_at: string; desk: string }[]
    unassigned: number
  } | null>(null)
  const [scanToken, setScanToken] = useState('')
  const [scan, setScan] = useState<{
    name: string
    reference: string
    desk: string
    starts_at: string
    checked_in_at: string | null
  } | null>(null)
  const [slot, setSlot] = useState({ starts_at: '', ends_at: '', desk: '', capacity: '15' })

  const cache = useQueryClient()

  // Auto-select initial campaign
  useEffect(() => {
    if (!campaign && campaigns.data?.length) {
      setCampaign(campaigns.data[0].id)
    }
  }, [campaigns.data, campaign])

  // Reset pagination on filter changes
  useEffect(() => {
    setPage(1)
    setPreview(null)
    setAllocation(null)
    setSelected(
      campaign === linkedCampaign && !status && !search && Number.isSafeInteger(linkedApplication) && linkedApplication > 0
        ? linkedApplication
        : undefined
    )
  }, [campaign, status, search, eligibilityFilter, linkedCampaign, linkedApplication])

  // Reset dossier form when selection changes
  useEffect(() => {
    setReason('')
    setOfficialNumber('')
    setContactEmail(dossier.data?.email || '')
    setVerifiedContact(false)
    setPhysical(
      Object.fromEntries(
        Object.keys(
          dossier.data?.physical_requirements ?? {
            bac_original: '',
            releve_notes: '',
            cin_copy: '',
            photos: '',
          }
        ).map((key) => [key, false])
      )
    )
  }, [selected, dossier.data?.id, dossier.data?.email, dossier.data?.physical_requirements])

  // Fetch list of candidates with server-side filters
  const rows = useQuery({
    queryKey: ['admission-list', campaign, status, search, eligibilityFilter, page],
    enabled: !!campaign,
    queryFn: async ({ signal }) =>
      (
        await api.get<{ data: Row[]; current_page: number; last_page: number; total: number }>(
          `${workflowBase}/applications`,
          {
            params: {
              campaign_id: campaign,
              status: status || undefined,
              search: search || undefined,
              eligibility: eligibilityFilter || undefined,
              page,
            },
            signal,
          }
        )
      ).data,
  })

  // Fetch campaign statistics
  const stats = useQuery({
    queryKey: ['admission-stats', campaign],
    enabled: !!campaign,
    queryFn: async ({ signal }) =>
      (await api.get<{ stats: Record<string, number> }>(`${workflowBase}/stats`, { params: { campaign_id: campaign }, signal })).data.stats,
  })

  // Fetch appointment slots
  const slots = useQuery({
    queryKey: ['admission-slots', campaign],
    enabled: !!campaign && tab === 'appointments',
    queryFn: async ({ signal }) =>
      (
        await api.get<{
          data: { id: number; starts_at: string; ends_at: string; desk: string; capacity: number; reserved: number }[]
        }>(`${workflowBase}/slots`, { params: { campaign_id: campaign }, signal })
      ).data.data,
  })

  // Fetch unlinked documents for reconciliation
  const unlinked = useQuery({
    queryKey: ['admission-unlinked'],
    enabled: tab === 'import',
    queryFn: async ({ signal }) =>
      (await api.get<{ data: { id: number; type: string; cne: string; url: string }[] }>(`${workflowBase}/unlinked-documents`, { signal })).data.data,
  })

  // Refresh all admission queries
  const refresh = async (includeDossier = true) => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: ['admission-operations'] }),
      cache.invalidateQueries({ queryKey: ['admission-list'] }),
      cache.invalidateQueries({ queryKey: ['admission-stats'] }),
      ...(includeDossier ? [cache.invalidateQueries({ queryKey: ['admission-dossier'] })] : []),
      cache.invalidateQueries({ queryKey: ['admission-slots'] }),
    ])
  }

  const perform = async (action: () => Promise<void>, includeDossier = true) => {
    setBusy(true)
    setError('')
    try {
      await action()
      await refresh(includeDossier)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const app = dossier.data
  const requiredDocuments = app?.required_documents ?? documentTypes
  const selectedCampaign = campaigns.data?.find((c) => c.id === campaign)
  const document = app?.documents[documentType]
  const extracted = app?.ocr_runs?.find((r) => r.document_id === document?.id)

  useEffect(() => setCorrections({}), [selected, documentType])

  const review = (decision: 'verified' | 'rejected') => {
    if (!app || !document) return
    void perform(async () => {
      const r = await api.post(`${workflowBase}/documents/${document.id}/review`, {
        application_id: app.id,
        version: app.version,
        decision,
        reason,
        corrections,
      })
      cache.setQueryData(['admission-dossier', app.id], r.data.candidate)
      setReason('')
      setCorrections({})
      toast.success(decision === 'verified' ? 'Pièce déclarée conforme ✓' : 'Demande de remplacement transmise')
    }, false)
  }

  const decide = (decision: string) => {
    if (!app) return
    void perform(async () => {
      const r = await api.post(`${workflowBase}/decide`, {
        application_id: app.id,
        version: app.version,
        decision,
        reason,
        official_number: officialNumber || undefined,
        physical_checklist: decision === 'approved' ? physical : undefined,
      })
      cache.setQueryData(['admission-dossier', app.id], r.data.candidate)
      toast.success(decision === 'approved' ? 'Inscription définitive validée avec succès 🎓' : 'Statut du dossier mis à jour')
      setReason('')
    }, false)
  }

  // Quick helper to download standard import CSV template
  const downloadCsvTemplate = () => {
    const isCnaem = selectedCampaign?.entry_route === 'cnaem'
    const headers = isCnaem
      ? 'cne,cin,first_name,last_name,admission_score,list_type,rank,email'
      : 'cne,cin,first_name,last_name,bac_average,tafem_score,list_type,rank,email'
    const sample = isCnaem
      ? 'R130099887,BE987654,Benali,Karim,15.75,main,1,karim.benali@encg-fes.ac.ma'
      : 'N145012345,BK765432,Idrissi,Fatima,17.20,165.50,main,1,fatima.idrissi@encg-fes.ac.ma'
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, sample].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `modele_import_${selectedCampaign?.entry_route || 'tafem'}_encg.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Modèle CSV officiel téléchargé')
  }

  // Handler for clicking KPI cards to automatically filter dossiers
  const handleKpiFilter = (targetStatus: string, targetEligibility?: string) => {
    setTab('dossiers')
    setStatus(targetStatus)
    if (targetEligibility !== undefined) {
      setEligibilityFilter(targetEligibility)
    }
  }

  // 5 Operational phases with descriptions
  const phases = [
    {
      id: 'settings',
      step: 1,
      title: 'Campagne & Quotas',
      shortTitle: 'Paramètres',
      desc: 'Dates, filière & capacités',
      icon: Settings,
    },
    {
      id: 'import',
      step: 2,
      title: 'Import des Admis',
      shortTitle: 'Import CSV',
      desc: 'Listes officielles TAFEM/CNAEM',
      icon: FileUp,
    },
    {
      id: 'dossiers',
      step: 3,
      title: 'Revue des Pièces & OCR',
      shortTitle: 'Revue Dossiers',
      desc: 'Contrôle IA, conformité & corrections',
      icon: ClipboardCheck,
      badge: stats.data?.submitted ? String(stats.data.submitted) : undefined,
    },
    {
      id: 'appointments',
      step: 4,
      title: 'Guichet & Émargement',
      shortTitle: 'Guichet & Scan',
      desc: 'Rendez-vous & scan du jeton',
      icon: QrCode,
    },
    {
      id: 'enrollments',
      step: 5,
      title: 'Inscriptions & Groupes',
      shortTitle: 'Inscriptions',
      desc: 'N° Apogée, sections & TD',
      icon: GraduationCap,
    },
  ] as const

  return (
    <main data-testid="admin-tafem-page" className="mx-auto max-w-[1560px] space-y-6 p-4 sm:p-6 lg:p-8 text-foreground">
      {/* 1. EXECUTIVE HEADER */}
      <header className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold tracking-wide text-blue-300 ring-1 ring-blue-400/30">
              <Building2 size={13} className="text-blue-300" />
              SERVICE DES ADMISSIONS & CONCOURS · ENCG FÈS
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Admissions & Nouvelles Inscriptions
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed">
              Dispositif officiel d'admission TAFEM (S1) et Passerelles CNAEM/DUT (S5/S7). Contrôle numérique unifié,
              assistance OCR, émargement au guichet et affectation automatique des sous-groupes TD.
            </p>
          </div>

          {/* Active Campaign Selector Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white/10 p-3 sm:p-4 rounded-xl backdrop-blur-md border border-white/15">
            <div className="space-y-1">
              <label htmlFor="workbench-campaign-select" className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                Campagne active
              </label>
              <div className="flex items-center gap-2">
                <select
                  id="workbench-campaign-select"
                  className="min-h-10 rounded-lg border border-white/20 bg-slate-900/90 px-3 py-1.5 text-sm font-semibold text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                  value={campaign ?? ''}
                  onChange={(e) => setCampaign(Number(e.target.value))}
                >
                  <option value="" disabled className="bg-slate-900 text-slate-300">
                    Sélectionner une campagne
                  </option>
                  {campaigns.data?.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      {c.name} ({entryRouteLabels[c.entry_route ?? 'tafem']?.split('—')[0]?.trim() || 'TAFEM'})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  aria-label="Actualiser les données"
                  title="Actualiser les données"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/80 hover:bg-blue-600 active:scale-95 text-white transition-all shadow-md disabled:opacity-50 cursor-pointer"
                  disabled={busy}
                  onClick={() => void refresh()}
                >
                  <RefreshCw size={17} className={busy ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {selectedCampaign && (
              <div className="hidden xl:flex flex-col border-l border-white/15 pl-4 space-y-1 text-xs">
                <span className="text-slate-400">Parcours & Niveau</span>
                <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  S{selectedCampaign.entry_semester ?? 1} · {selectedCampaign.status === 'open' ? 'Active / Ouverte' : selectedCampaign.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sub-navigation links */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs font-medium text-slate-300">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Raccourcis scolarité :</span>
            <Link
              to="/admin/reinscriptions"
              className="inline-flex items-center gap-1 text-blue-300 hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Réinscriptions (Anciens étudiants)
            </Link>
            <span>·</span>
            <Link
              to="/alumni/dashboard"
              className="inline-flex items-center gap-1 text-blue-300 hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Lauréats & Diplômes
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('operations')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                tab === 'operations'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <AlertCircle size={14} />
              Suivi Opérationnel & Alertes
            </button>
          </div>
        </div>
      </header>

      {/* 2. DYNAMIC CLICK-TO-FILTER EXECUTIVE METRIC CARDS */}
      <section aria-label="Indicateurs de campagne" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        {/* Total Dossiers */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleKpiFilter('', '')}
          onKeyDown={(e) => e.key === 'Enter' && handleKpiFilter('', '')}
          className={`group relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer ${
            tab === 'dossiers' && !status && !eligibilityFilter
              ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-600/30 dark:bg-blue-950/40'
              : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Total Dossiers</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {stats.data?.total_candidates ?? '—'}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">Tous candidats inscrits</p>
        </div>

        {/* À Examiner */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleKpiFilter('submitted')}
          onKeyDown={(e) => e.key === 'Enter' && handleKpiFilter('submitted')}
          className={`group relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer ${
            tab === 'dossiers' && status === 'submitted'
              ? 'border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-500/30 dark:bg-amber-950/40'
              : 'border-slate-200 bg-white hover:border-amber-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400">À Examiner</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 group-hover:scale-110 transition-transform">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-900 dark:text-amber-400 tabular-nums">
              {stats.data?.submitted ?? 0}
            </p>
            {Number(stats.data?.submitted || 0) > 0 && (
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <p className="mt-1 text-[11px] font-medium text-amber-800 dark:text-amber-400">En attente de revue</p>
        </div>

        {/* À Corriger */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleKpiFilter('needs_correction')}
          onKeyDown={(e) => e.key === 'Enter' && handleKpiFilter('needs_correction')}
          className={`group relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer ${
            tab === 'dossiers' && status === 'needs_correction'
              ? 'border-rose-500 bg-rose-50/80 shadow-md ring-2 ring-rose-500/30 dark:bg-rose-950/40'
              : 'border-slate-200 bg-white hover:border-rose-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-400">À Corriger</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 group-hover:scale-110 transition-transform">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-rose-900 dark:text-rose-400 tabular-nums">
            {stats.data?.needs_correction ?? 0}
          </p>
          <p className="mt-1 text-[11px] font-medium text-rose-800 dark:text-rose-400">Pièces non conformes</p>
        </div>

        {/* Inscriptions Validées */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleKpiFilter('approved')}
          onKeyDown={(e) => e.key === 'Enter' && handleKpiFilter('approved')}
          className={`group relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer ${
            tab === 'dossiers' && status === 'approved'
              ? 'border-emerald-500 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/30 dark:bg-emerald-950/40'
              : 'border-slate-200 bg-white hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-400">Validés</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-emerald-900 dark:text-emerald-400 tabular-nums">
            {stats.data?.approved ?? 0}
          </p>
          <p className="mt-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-400">Dossiers finalisés</p>
        </div>

        {/* Liste d'Attente */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleKpiFilter('', 'waiting')}
          onKeyDown={(e) => e.key === 'Enter' && handleKpiFilter('', 'waiting')}
          className={`group relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer ${
            tab === 'dossiers' && eligibilityFilter === 'waiting'
              ? 'border-purple-500 bg-purple-50/80 shadow-md ring-2 ring-purple-500/30 dark:bg-purple-950/40'
              : 'border-slate-200 bg-white hover:border-purple-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-400">Liste d'Attente</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 group-hover:scale-110 transition-transform">
              <ListOrdered size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-purple-900 dark:text-purple-400 tabular-nums">
            {stats.data?.waiting ?? 0}
          </p>
          <p className="mt-1 text-[11px] font-medium text-purple-800 dark:text-purple-400">Éligibles selon désistements</p>
        </div>

        {/* Places Restantes */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setTab('enrollments')}
          onKeyDown={(e) => e.key === 'Enter' && setTab('enrollments')}
          className={`group relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer ${
            tab === 'enrollments'
              ? 'border-indigo-500 bg-indigo-50/80 shadow-md ring-2 ring-indigo-500/30 dark:bg-indigo-950/40'
              : 'border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-400">Places Restantes</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 group-hover:scale-110 transition-transform">
              <GraduationCap size={18} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-indigo-900 dark:text-indigo-400 tabular-nums">
            {stats.data?.available_places ?? '—'}
          </p>
          <p className="mt-1 text-[11px] font-medium text-indigo-800 dark:text-indigo-400">
            Quota total : {selectedCampaign?.target_capacity ?? '500'}
          </p>
        </div>
      </section>

      {/* 3. UNIFIED 5-STEP PIPELINE NAVIGATION (NO MORE DUPLICATE TABS!) */}
      <nav aria-label="Pipeline des admissions" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <ol className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          {phases.map((p) => {
            const Icon = p.icon
            const isActive = tab === p.id
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setTab(p.id as typeof tab)}
                  aria-current={isActive ? 'step' : undefined}
                  className={`group flex h-full w-full flex-col justify-between p-4 text-left transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-blue-50/70 border-b-2 border-blue-600 dark:bg-blue-950/40 dark:border-blue-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-blue-900 text-white shadow-sm dark:bg-blue-500'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {p.step}
                    </span>

                    {p.badge && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        {p.badge} à revoir
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white">
                      <Icon size={16} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                      <span>{p.title}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-snug">{p.desc}</p>
                  </div>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Global Error Banner */}
      {(error || rows.error || stats.error || campaigns.error || dossier.error || slots.error) && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200 shadow-sm">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Une erreur s'est produite lors du chargement :</p>
            <p className="text-xs">
              {error || errorMessage(rows.error || stats.error || campaigns.error || dossier.error || slots.error)}
            </p>
          </div>
        </div>
      )}

      {/* 4. ACTIVE PHASE CONTENT */}

      {/* PHASE 1: CONFIGURATION & CAMPAGNE */}
      {tab === 'settings' && (
        <div className="space-y-6">
          <AdmissionCampaignSettings campaignId={campaign} onSelect={setCampaign} />
        </div>
      )}

      {/* PHASE 2: IMPORTATION DE LA LISTE OFFICIELLE */}
      {tab === 'import' && (
        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                <FileUp size={13} />
                Étape 2 · Ingestion des Admis
              </div>
              <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                Importer la liste officielle des candidats
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Import sécurisé au format CSV sans écraser les dossiers existants. Les scores et rangs officiels serviront de référence pour l'affectation.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadCsvTemplate}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              <Download size={16} className="text-blue-600" />
              Télécharger le modèle CSV officiel
            </button>
          </div>

          {/* Drag & drop upload box */}
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center transition-all hover:border-blue-500 hover:bg-blue-50/20 dark:border-slate-700 dark:bg-slate-800/40">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <FileUp size={28} />
            </div>
            <h3 className="mt-4 font-bold text-slate-900 dark:text-white text-base">
              Sélectionnez ou déposez votre fichier de résultats CSV
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Colonnes requises : <code className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-800 dark:bg-slate-700 dark:text-slate-200">cne</code>,{' '}
              <code className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-800 dark:bg-slate-700 dark:text-slate-200">cin</code>,{' '}
              <code className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-800 dark:bg-slate-700 dark:text-slate-200">first_name</code>,{' '}
              <code className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-800 dark:bg-slate-700 dark:text-slate-200">last_name</code>,{' '}
              <code className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                {selectedCampaign?.entry_route === 'cnaem' ? 'admission_score' : 'bac_average, tafem_score'}
              </code>,{' '}
              <code className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-800 dark:bg-slate-700 dark:text-slate-200">list_type (main/waiting)</code>,{' '}
              <code className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-800 dark:bg-slate-700 dark:text-slate-200">rank</code>
            </p>

            <div className="mt-5">
              <label
                htmlFor="admission-csv-upload-input"
                className={`inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-800 cursor-pointer ${
                  busy || !campaign ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <FileUp size={16} />
                Parcourir les fichiers CSV
              </label>
              <input
                id="admission-csv-upload-input"
                type="file"
                accept=".csv,text/csv"
                disabled={busy || !campaign}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    void perform(async () => {
                      const form = new FormData()
                      form.append('file', file)
                      form.append('campaign_id', String(campaign))
                      const r = await api.post<ImportPreview>(`${workflowBase}/imports/preview`, form)
                      setPreview(r.data)
                      toast.info(`Prévisualisation : ${r.data.valid_rows} ligne(s) prêtes`)
                    })
                  }
                  e.target.value = ''
                }}
              />
            </div>
          </div>

          {/* Import Preview Table */}
          {preview && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Rapport de prévisualisation de l'import
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ {preview.valid_rows} candidat(s) valide(s)
                    </span>{' '}
                    ·{' '}
                    <span className={preview.errors.length ? 'font-semibold text-rose-600' : 'text-slate-500'}>
                      {preview.errors.length} erreur(s) de validation
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  disabled={busy || !preview.can_commit}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  onClick={() =>
                    void perform(async () => {
                      const r = await api.post(`${workflowBase}/imports/${preview.id}/commit`)
                      setPreview(null)
                      toast.success(`${r.data.imported} candidat(s) importé(s) officiellement 🎓`)
                    })
                  }
                >
                  <Check size={18} />
                  Valider et intégrer les {preview.valid_rows} candidats
                </button>
              </div>

              {preview.errors.length > 0 && (
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                  {preview.errors.slice(0, 30).map((e) => (
                    <div
                      key={e.line}
                      className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                    >
                      <AlertCircle size={14} className="shrink-0 text-rose-600" />
                      <span>
                        <strong>Ligne {e.line} :</strong> {e.messages.join(' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <tr>
                      <th className="p-3">CNE</th>
                      <th className="p-3">Nom & Prénom</th>
                      <th className="p-3">Rang</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Liste</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {preview.preview.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-mono font-medium">{r.cne}</td>
                        <td className="p-3 font-semibold">
                          {r.last_name} {r.first_name}
                        </td>
                        <td className="p-3">{r.rank || '—'}</td>
                        <td className="p-3">{r.tafem_score || r.admission_score || '—'}</td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              r.list_type === 'main'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            }`}
                          >
                            {r.list_type === 'main' ? 'Principale' : 'Attente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inherited Documents Reconciliation Section */}
          <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900/60 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Rapprochement des documents orphelins ou hérités
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl">
                  Permet de lier une pièce déposée hors parcours automatique vers un dossier officiel après vérification d'identité.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="reconcile-reason-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Motif et justificatif administratif du rapprochement
              </label>
              <input
                id="reconcile-reason-input"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="Ex : Rectification d'attribution suite à changement d'adresse ou homonymie vérifiée"
                value={reconcileReason}
                onChange={(e) => setReconcileReason(e.target.value)}
              />
            </div>

            {unlinked.data?.length === 0 ? (
              <p className="mt-4 text-xs font-medium text-slate-500 italic">
                ✓ Aucun document en attente de rapprochement pour cette campagne.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {unlinked.data?.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Pièce #{d.id} · {documentLabels[d.type as DocumentType] || d.type}
                        </span>
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <ExternalLink size={12} />
                          Aperçu
                        </a>
                      </div>
                      <p className="text-xs text-slate-500">Identifiant CNE associé : {d.cne}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        aria-label={`Dossier vérifié pour la pièce ${d.id}`}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        value={reconcileTarget[d.id] || ''}
                        onChange={(e) => setReconcileTarget((p) => ({ ...p, [d.id]: e.target.value }))}
                      >
                        <option value="">Sélectionner le dossier cible</option>
                        {rows.data?.data.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.reference_number} · {a.last_name} {a.first_name} ({a.cne})
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={busy || !reconcileTarget[d.id] || reconcileReason.trim().length < 5}
                        className="rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
                        onClick={() =>
                          void perform(async () => {
                            const id = Number(reconcileTarget[d.id])
                            const r = await api.get(`${workflowBase}/dossier`, { params: { application_id: id } })
                            await api.post(`${workflowBase}/unlinked-documents/${d.id}/reconcile`, {
                              application_id: id,
                              version: r.data.candidate.version,
                              reason: reconcileReason,
                              identity_verified: true,
                            })
                            await unlinked.refetch()
                            toast.success('Document rattaché avec succès après vérification')
                          })
                        }
                      >
                        Confirmer et lier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Official List PDF Exports */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Procès-verbaux & listes d'admission officielles (Format PDF A4) :
            </span>
            <div className="flex flex-wrap gap-2.5">
              <a
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                href={`${api.defaults.baseURL}${workflowBase}/list-pdf?campaign_id=${campaign}&type=main`}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={14} className="text-emerald-600" />
                Télécharger la Liste Principale (PDF)
              </a>
              <a
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                href={`${api.defaults.baseURL}${workflowBase}/list-pdf?campaign_id=${campaign}&type=waiting`}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={14} className="text-purple-600" />
                Télécharger la Liste d'Attente (PDF)
              </a>
            </div>
          </div>
        </section>
      )}

      {/* PHASE 3: REVUE DES DOSSIERS & OCR (MAIN WORKSPACE) */}
      {tab === 'dossiers' && (
        <div className="space-y-4">
          {/* Quick Filter Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search input with clear button */}
              <div className="relative flex-1 min-w-[280px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  aria-label="Recherche candidat par CNE, CIN, nom ou prénom"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="Rechercher par CNE, CIN, Nom ou Prénom..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Effacer la recherche"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Status fast filter chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  ['', 'Tous les états'],
                  ['submitted', '⏳ À examiner'],
                  ['needs_correction', '⚠️ À corriger'],
                  ['approved', '✓ Validés'],
                  ['draft', 'Brouillons'],
                ].map(([val, label]) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setStatus(val)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      status === val
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Promote waiting list candidates */}
              <button
                type="button"
                disabled={busy || !campaign}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-800 transition-all disabled:opacity-50 cursor-pointer"
                onClick={() =>
                  void perform(async () => {
                    const r = await api.post(`${workflowBase}/promote`, { campaign_id: campaign, limit: 10 })
                    toast.success(r.data.message)
                  })
                }
              >
                <Sparkles size={14} />
                Inviter liste d'attente (Top 10)
              </button>
            </div>
          </div>

          {/* Master-Detail Split: Left = Queue, Right = Detailed Station */}
          <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
            {/* Left Queue Panel */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col h-[780px]">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                <div>
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white">File des Candidats</h2>
                  <p className="text-xs text-slate-500">{rows.data?.total ?? 0} candidat(s) répertorié(s)</p>
                </div>
                {rows.isFetching && <Loader2 size={16} className="animate-spin text-blue-600" />}
              </div>

              {/* Candidate Card List */}
              <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1">
                {rows.data?.data.map((row) => {
                  const isRowSelected = selected === row.id
                  return (
                    <div
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelected(row.id)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelected(row.id)}
                      className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer ${
                        isRowSelected
                          ? 'border-blue-600 bg-blue-50/80 shadow-md ring-1 ring-blue-600 dark:bg-blue-950/50'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600">
                            {row.last_name} {row.first_name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                            <span>{row.cne}</span>
                            {row.cin && <span>· {row.cin}</span>}
                          </div>
                        </div>

                        {row.ranking && (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            #{row.ranking}
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            row.dossier_status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : row.dossier_status === 'submitted'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : row.dossier_status === 'needs_correction'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {statusLabels[row.dossier_status] || row.dossier_status}
                        </span>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            row.eligibility === 'main'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : row.eligibility === 'waiting'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {statusLabels[row.eligibility] || row.eligibility}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {!rows.isFetching && rows.data?.data.length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    <Inbox className="mx-auto mb-2 text-slate-300" size={32} />
                    <p className="text-xs font-semibold">Aucun candidat trouvé</p>
                    <p className="text-[11px] mt-1">Modifiez vos critères de recherche ou de filtre.</p>
                  </div>
                )}
              </div>

              {/* Pagination footer */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-xs dark:border-slate-800">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((x) => Math.max(1, x - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40 cursor-pointer dark:border-slate-700"
                >
                  <ChevronLeft size={14} />
                  Précédent
                </button>
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  Page {page} / {rows.data?.last_page ?? 1}
                </span>
                <button
                  type="button"
                  disabled={page >= (rows.data?.last_page ?? 1)}
                  onClick={() => setPage((x) => x + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40 cursor-pointer dark:border-slate-700"
                >
                  Suivant
                  <ChevronRight size={14} />
                </button>
              </div>
            </section>

            {/* Right Detailed Dossier Workspace */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-y-auto max-h-[850px]">
              {dossier.isLoading && selected ? (
                <div className="flex h-96 flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 size={32} className="animate-spin text-blue-600" />
                  <p className="text-sm font-semibold">Chargement du dossier candidat...</p>
                </div>
              ) : !app ? (
                <div className="flex h-96 flex-col items-center justify-center p-8 text-center text-slate-400">
                  <ClipboardCheck className="mx-auto mb-3 text-slate-300 dark:text-slate-700" size={48} />
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                    Sélectionnez un dossier dans la file
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm">
                    Cliquez sur un candidat à gauche pour examiner ses pièces justificatives, rapprocher les résultats OCR et valider l'inscription.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Candidate Identity Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                          {app.last_name} {app.first_name}
                        </h2>
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          v{app.version}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 flex flex-wrap items-center gap-2">
                        <span className="font-mono font-medium">CNE : {app.cne}</span>
                        <span>·</span>
                        <span className="font-mono">CIN : {app.cin || '—'}</span>
                        <span>·</span>
                        <span className="font-mono">Réf : {app.reference_number}</span>
                      </p>
                    </div>

                    {/* Eligibility Status Pill & Fast Switcher */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={busy || app.eligibility === 'main'}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            app.eligibility === 'main'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'border border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300'
                          }`}
                          onClick={() =>
                            void perform(async () => {
                              const r = await api.post(`${workflowBase}/applications/${app.id}/eligibility`, {
                                eligibility: 'main',
                              })
                              cache.setQueryData(['admission-dossier', app.id], r.data.candidate)
                              toast.success('Candidat placé sur Liste Principale ⭐')
                            })
                          }
                        >
                          ⭐ Liste Principale
                        </button>

                        <button
                          type="button"
                          disabled={busy || app.eligibility === 'waiting'}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            app.eligibility === 'waiting'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'border border-purple-300 text-purple-800 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300'
                          }`}
                          onClick={() =>
                            void perform(async () => {
                              const r = await api.post(`${workflowBase}/applications/${app.id}/eligibility`, {
                                eligibility: 'waiting',
                              })
                              cache.setQueryData(['admission-dossier', app.id], r.data.candidate)
                              toast.success('Candidat placé sur Liste d’Attente ⏳')
                            })
                          }
                        >
                          ⏳ Liste d’Attente
                        </button>
                      </div>

                      <span className="text-[11px] font-semibold text-slate-500">
                        État actuel : <strong>{statusLabels[app.dossier_status]}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Alerts & Operations components */}
                  <AdmissionConsistencyAlerts applicationId={app.id} />
                  <AdmissionDossierOperations key={app.id} applicationId={app.id} />

                  {/* Contact & Account Activation */}
                  <details className="group rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                    <summary className="font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <UserCheck size={15} className="text-blue-600" />
                        Vérifier le contact personnel / activer l'accès au portail candidat
                      </span>
                      <span className="text-[10px] text-blue-600 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-3 space-y-3 pt-2 text-xs">
                      <p className="text-slate-500">
                        À effectuer après rapprochement des pièces du titulaire. Un compte existant conserve son mot de passe.
                      </p>
                      <div>
                        <label htmlFor="contact-email-input" className="font-semibold text-slate-700 dark:text-slate-300">
                          Adresse e-mail personnelle
                        </label>
                        <input
                          id="contact-email-input"
                          type="email"
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                        />
                      </div>
                      <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={verifiedContact}
                          onChange={(e) => setVerifiedContact(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        J'ai vérifié ce contact directement auprès du titulaire du dossier.
                      </label>
                      <button
                        type="button"
                        disabled={busy || !verifiedContact || !contactEmail}
                        className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
                        onClick={() =>
                          void perform(async () => {
                            const r = await api.post(`${workflowBase}/applications/${app.id}/activation`, {
                              email: contactEmail,
                              contact_verified: verifiedContact,
                            })
                            toast.success(r.data.message)
                          })
                        }
                      >
                        Enregistrer le contact et délivrer l'accès
                      </button>
                    </div>
                  </details>

                  {/* Document Inspection Hub */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">
                        Pièces du dossier :
                      </span>
                      {requiredDocuments.map((type) => {
                        const doc = app.documents[type]
                        const isSelectedDoc = documentType === type
                        const isVerified = doc?.status === 'verified'
                        const isSubmitted = !!doc

                        return (
                          <button
                            type="button"
                            key={type}
                            onClick={() => setDocumentType(type)}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                              isSelectedDoc
                                ? 'bg-blue-900 text-white shadow-md'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            <span>{documentLabels[type] || type}</span>
                            {isVerified ? (
                              <CheckCircle2 size={13} className="text-emerald-400" />
                            ) : isSubmitted ? (
                              <span className="h-2 w-2 rounded-full bg-amber-400" />
                            ) : (
                              <span className="text-[10px] text-slate-400">✕</span>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Split View: Left = Document Preview, Right = OCR & Data Matching */}
                    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                      {/* Document Preview Box */}
                      <div className="rounded-xl border border-slate-200 bg-slate-900/90 p-3 shadow-inner flex flex-col min-h-[520px]">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs text-white">
                          <span className="font-semibold flex items-center gap-1.5">
                            <FileText size={14} className="text-blue-400" />
                            {documentLabels[documentType]}
                          </span>
                          {document?.signed_url && (
                            <a
                              href={document.signed_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-300 hover:text-white"
                            >
                              <ExternalLink size={12} />
                              Ouvrir en plein écran
                            </a>
                          )}
                        </div>

                        <div className="flex-1 flex items-center justify-center p-2">
                          {document ? (
                            document.mime_type.startsWith('image/') ? (
                              <img
                                src={document.signed_url}
                                alt={documentLabels[documentType]}
                                className="max-h-[460px] w-full object-contain rounded-lg"
                              />
                            ) : (
                              <iframe
                                title={`Aperçu ${documentLabels[documentType]}`}
                                src={document.signed_url}
                                className="h-[460px] w-full rounded-lg bg-white"
                              />
                            )
                          ) : (
                            <div className="text-center text-slate-400 p-8">
                              <FileText className="mx-auto mb-2 opacity-40" size={40} />
                              <p className="text-xs">Cette pièce n'a pas encore été déposée par le candidat.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* OCR Assistant & Candidate Profile Fields */}
                      <div className="space-y-4">
                        {/* OCR Run Card */}
                        {extracted && (
                          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs dark:border-blue-900/60 dark:bg-blue-950/20">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                                <Sparkles size={14} className="text-blue-600" />
                                Données extraites par OCR (Gemini Vision)
                              </h4>
                              <span className="text-[10px] text-blue-600 font-semibold">À vérifier</span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                              Vérifiez sur l'image ci-contre. Cliquez sur reporter pour corriger automatiquement.
                            </p>

                            <div className="mt-3 space-y-2">
                              {Object.entries(extracted.fields ?? {}).map(([key, field]) => (
                                <div
                                  key={key}
                                  className="flex items-center justify-between gap-2 rounded-lg bg-white p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900"
                                >
                                  <div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      {profileLabels[key] || key} :
                                    </span>{' '}
                                    <span className={field.conflict ? 'font-bold text-rose-600' : 'text-slate-900 dark:text-white'}>
                                      {String(field.value)}
                                    </span>
                                  </div>

                                  {!['cin', 'cne'].includes(key) && app.dossier_status !== 'approved' && (
                                    <button
                                      type="button"
                                      className="rounded bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-800 hover:bg-blue-200 cursor-pointer"
                                      onClick={() => {
                                        const map: Record<string, string> = {
                                          first_name_fr: 'first_name',
                                          last_name_fr: 'last_name',
                                          bac_type: 'bac_series',
                                        }
                                        setCorrections((c) => ({ ...c, [map[key] || key]: field.value }))
                                      }}
                                    >
                                      Reporter
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Corrections applied */}
                            {Object.entries(corrections).map(([key, value]) => (
                              <div key={key} className="mt-2">
                                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  Correction : {profileLabels[key] || key}
                                </label>
                                <input
                                  className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                                  value={value}
                                  onChange={(e) => setCorrections((c) => ({ ...c, [key]: e.target.value }))}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Profile declared values */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
                            Informations déclarées (Profil Apogée)
                          </h4>
                          <dl className="space-y-2 text-xs max-h-56 overflow-y-auto">
                            {[
                              ['CNE Officiel', app.cne],
                              ['CNIE Officielle', app.cin],
                              ['Nom complet importé', `${app.last_name} ${app.first_name}`],
                              ...Object.entries(app.profile).map(([key, value]) => [key, String(value ?? '—')]),
                            ].map(([key, value]) => (
                              <div key={key} className="flex justify-between border-b border-slate-100 pb-1.5 dark:border-slate-800">
                                <dt className="text-slate-500">{profileLabels[key] || key}</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white text-right">{value}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      </div>
                    </div>

                    {/* Review Decision Bar */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-800/20">
                      <div>
                        <label htmlFor="dossier-review-reason" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Observation ou consigne de correction (visible par le candidat)
                        </label>
                        <textarea
                          id="dossier-review-reason"
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Ex : Copie recto-verso de la CNIE tronquée, merci de redéposer une photo nette..."
                          rows={2}
                          maxLength={2000}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={busy || !document || !['submitted', 'under_review'].includes(app.dossier_status)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                          onClick={() => review('verified')}
                        >
                          <Check size={14} />
                          Vérifier & Valider cette pièce
                        </button>

                        <button
                          type="button"
                          disabled={busy || !document || !reason || !['submitted', 'under_review'].includes(app.dossier_status)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 disabled:opacity-50 cursor-pointer dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                          onClick={() => review('rejected')}
                        >
                          <X size={14} />
                          Pièce non conforme (À remplacer)
                        </button>

                        <button
                          type="button"
                          disabled={busy || !reason || !['submitted', 'under_review'].includes(app.dossier_status)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50 cursor-pointer dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          onClick={() => decide('needs_correction')}
                        >
                          <AlertTriangle size={14} />
                          Demander correction globale du dossier
                        </button>
                      </div>
                    </div>

                    {/* Physical Guichet & Definitive Registration */}
                    <details className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/20 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/10">
                      <summary className="font-extrabold text-sm text-emerald-950 dark:text-emerald-300 cursor-pointer flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <GraduationCap size={18} className="text-emerald-600" />
                          Contrôle physique au guichet & Validation de l'inscription définitive
                        </span>
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-full font-bold text-emerald-800 dark:text-emerald-200">
                          Étape Finale
                        </span>
                      </summary>

                      <div className="mt-4 space-y-4 pt-2 text-xs">
                        <p className="text-slate-600 dark:text-slate-400">
                          Cochez les originaux physiquement présentés au guichet. Le numéro APOGEE officiel attribué sera scellé dans le dossier administratif de l'étudiant.
                        </p>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {Object.entries(physical).map(([key, value]) => (
                            <label
                              key={key}
                              className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 font-medium text-slate-800 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                            >
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => setPhysical((p) => ({ ...p, [key]: e.target.checked }))}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              {(app.physical_requirements ?? {
                                bac_original: 'Baccalauréat original reçu',
                                releve_notes: 'Relevé de notes officiel reçu',
                                cin_copy: 'Copie certifiée CNIE reçue',
                                photos: "4 Photos d'identité reçues",
                              } as Record<string, string>)[key] || key}
                            </label>
                          ))}
                        </div>

                        <div>
                          <label htmlFor="official-apogee-number-input" className="font-bold text-slate-800 dark:text-slate-200">
                            Numéro APOGEE officiel
                          </label>
                          <input
                            id="official-apogee-number-input"
                            className="mt-1 w-full max-w-sm rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            placeholder="Ex : 26001234"
                            value={officialNumber}
                            onChange={(e) => setOfficialNumber(e.target.value)}
                            autoComplete="off"
                          />
                        </div>

                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-extrabold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                          disabled={
                            busy ||
                            !officialNumber ||
                            !Object.values(physical).every(Boolean) ||
                            !requiredDocuments.every((t) => app.documents[t]?.status === 'verified') ||
                            !['submitted', 'under_review'].includes(app.dossier_status)
                          }
                          onClick={() => decide('approved')}
                        >
                          <GraduationCap size={18} />
                          Valider l’inscription définitive 🎓
                        </button>
                      </div>
                    </details>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* PHASE 4: GUICHET & ACCUEIL RENDEZ-VOUS */}
      {tab === 'appointments' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create slots */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Créneaux de Réception Guichet</h2>
                <p className="mt-1 text-xs text-slate-500">Planification des plages d'accueil pour le dépôt des pièces physiques.</p>
              </div>
              <Calendar size={20} className="text-blue-600" />
            </div>

            <form
              className="grid gap-4 sm:grid-cols-2 text-xs"
              onSubmit={(e) => {
                e.preventDefault()
                void perform(async () => {
                  await api.post(`${workflowBase}/slots`, {
                    campaign_id: campaign,
                    ...slot,
                    capacity: Number(slot.capacity),
                  })
                  toast.success('Nouveau créneau publié')
                })
              }}
            >
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Début (Heure du Maroc)</label>
                <input
                  required
                  type="datetime-local"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  value={slot.starts_at}
                  onChange={(e) => setSlot((s) => ({ ...s, starts_at: e.target.value }))}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Fin (Heure du Maroc)</label>
                <input
                  required
                  type="datetime-local"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  value={slot.ends_at}
                  onChange={(e) => setSlot((s) => ({ ...s, ends_at: e.target.value }))}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Numéro ou Nom du Guichet</label>
                <input
                  required
                  type="text"
                  placeholder="Ex : Guichet A1 - Amphi 1"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  value={slot.desk}
                  onChange={(e) => setSlot((s) => ({ ...s, desk: e.target.value }))}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Capacité maximale</label>
                <input
                  required
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  value={slot.capacity}
                  onChange={(e) => setSlot((s) => ({ ...s, capacity: e.target.value }))}
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={busy || !campaign}
                  className="rounded-xl bg-blue-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
                >
                  Publier le créneau d'accueil
                </button>
              </div>
            </form>

            {/* List of slots with capacity bar */}
            <div className="mt-6 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Créneaux configurés</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {slots.data?.map((s) => {
                  const percent = Math.min(100, Math.round((s.reserved / s.capacity) * 100))
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-white">
                          {dateText(s.starts_at)} · {s.desk}
                        </span>
                        <a
                          className="font-semibold text-blue-600 hover:underline"
                          href={`${api.defaults.baseURL}${workflowBase}/appointment-labels?slot_id=${s.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Étiquettes PDF
                        </a>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {s.reserved} / {s.capacity} ({percent}%)
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Barcode & Token Fast Scanner */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Contrôle d'Émargement</h2>
                <p className="mt-1 text-xs text-slate-500">Scan rapide du jeton ou QR code présenté au guichet par le candidat.</p>
              </div>
              <QrCode size={20} className="text-emerald-600" />
            </div>

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void perform(async () => {
                  const r = await api.get(`${workflowBase}/scan/${encodeURIComponent(scanToken.trim())}`)
                  setScan(r.data.candidate)
                })
              }}
            >
              <input
                required
                aria-label="Jeton de rendez-vous"
                placeholder="Scannez ou saisissez le jeton (ex: TKN-12345)"
                className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={scanToken}
                onChange={(e) => {
                  setScanToken(e.target.value)
                  setScan(null)
                }}
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
              >
                Vérifier
              </button>
            </form>

            {scan && (
              <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-50/50 p-5 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold">{scan.name}</h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900">
                    Jeton Valide
                  </span>
                </div>
                <p className="text-xs">
                  Réf : <strong>{scan.reference}</strong> · Guichet : <strong>{scan.desk}</strong> · Heure :{' '}
                  {dateText(scan.starts_at)}
                </p>

                <button
                  type="button"
                  disabled={busy || !!scan.checked_in_at}
                  className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                  onClick={() =>
                    void perform(async () => {
                      const r = await api.post(`${workflowBase}/scan/${encodeURIComponent(scanToken.trim())}/check-in`)
                      setScan(r.data.candidate)
                      toast.success("Émargement d'entrée validé avec succès ✓")
                    })
                  }
                >
                  {scan.checked_in_at ? '✓ Entrée déjà enregistrée' : "Valider l'entrée au guichet"}
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* PHASE 5: INSCRIPTIONS DÉFINITIVES & GROUPES */}
      {tab === 'enrollments' && (
        <AdmissionEnrollments
          key={campaign}
          campaignId={campaign}
          entrySemester={selectedCampaign?.entry_semester ?? 1}
        />
      )}

      {/* UTILITY TAB: SUIVI & INCIDENTS OPÉRATIONNELS */}
      {tab === 'operations' && (
        <AdmissionOperationsBoard
          key={campaign}
          campaignId={campaign}
          onOpen={(id) => {
            setTab('dossiers')
            setSelected(id)
          }}
        />
      )}

      {/* Global Progress Spinner */}
      {busy && (
        <div
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-semibold text-white shadow-2xl ring-1 ring-white/20 animate-in fade-in"
          role="status"
        >
          <Loader2 className="animate-spin text-blue-400" size={16} />
          <span>Traitement en cours...</span>
        </div>
      )}
    </main>
  )
}
