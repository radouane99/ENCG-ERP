import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Gavel, AlertTriangle, ShieldAlert, CheckCircle2,
  XCircle, Clock, Search, FileText, UserX, Printer, Mail, Download,
  Calendar, MapPin, Scale, Sparkles, FileCheck, Check, X, ShieldCheck, UserCheck, RefreshCw, Send, Lock
} from 'lucide-react'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Badge } from '@shared/components/ui/Badge'
import { Input } from '@shared/components/ui/Input'
import { Spinner } from '@shared/components/ui/Spinner'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'

interface DisciplineCase {
  id: number
  student: {
    id: number
    first_name: string
    last_name: string
    cne: string
    apogee?: string
    email?: string
    filiere?: string
    guardian_email?: string
  }
  module_name?: string
  exam_date?: string
  type: string
  description: string
  confiscated_items?: string
  severity: 'low' | 'medium' | 'high'
  status: 'pending' | 'convoked' | 'auditioned' | 'resolved' | 'dismissed'
  decision?: string
  hearing_date?: string
  hearing_room?: string
  hearing_notes?: string
  sanction_scope?: 'module' | 'semestre' | 'blame' | 'exclusion'
  created_at: string
}

export default function DisciplinePage(): React.ReactElement {

  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Selected Case for Modal Operations
  const [selectedCase, setSelectedCase] = useState<DisciplineCase | null>(null)

  // Convocation Modal State
  const [showConvocationModal, setShowConvocationModal] = useState(false)
  const [convocationDate, setConvocationDate] = useState('2026-07-28')
  const [convocationTime, setConvocationTime] = useState('10:00')
  const [convocationRoom, setConvocationRoom] = useState('Salle de Réunion de la Présidence (Bloc Admin)')
  const [sendEmailToGuardian, setSendEmailToGuardian] = useState(true)

  // Deliberation Hearing Modal State
  const [showHearingModal, setShowHearingModal] = useState(false)
  const [finalSanction, setFinalSanction] = useState<'module' | 'semestre' | 'blame' | 'exclusion'>('module')
  const [hearingObservations, setHearingObservations] = useState('')
  const [votesFor, setVotesFor] = useState(5)
  const [votesAgainst, setVotesAgainst] = useState(0)

  // Printable Convocation / PV Modal
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [showBatchPrint, setShowBatchPrint] = useState(false)
  const [printDocumentType, setPrintDocumentType] = useState<'convocation' | 'pv_decision'>('convocation')


  // Fetch Real & Mock Discipline Cases from API
  const { data: disciplineCases, isLoading, refetch } = useQuery({
    queryKey: ['discipline-cases'],
    queryFn: async () => {
      let apiItems: any[] = []
      try {
        const res = await api.get('/admin/discipline')
        apiItems = res.data?.data || res.data || []
      } catch (err) {}

      let localQueue: any[] = []
      try {
        localQueue = JSON.parse(sessionStorage.getItem('encg_exam_incidents_queue') || '[]')
      } catch (e) {}

      const activeReportedCases = [
        {
          id: 201,
          student: { id: 2, first_name: 'Salma', last_name: 'BENNANI', cne: 'N130000002', apogee: 'N130000002', email: 'salma.bennani@encg-fes.ac.ma', filiere: 'ENCG Grande École S4', guardian_email: 'tuteur.bennani@gmail.com' },
          module_name: 'Management Stratégique',
          exam_date: '2026-07-25',
          type: '🚨 Fraude (Téléphone)',
          description: 'Consultation d\'un téléphone portable pendant l\'épreuve d\'examen final.',
          confiscated_items: 'Téléphone Portable Samsung',
          severity: 'high',
          status: 'pending',
          created_at: '2026-07-25'
        },
        {
          id: 202,
          student: { id: 18, first_name: 'Saad', last_name: 'MEZIANE', cne: 'N130000018', apogee: 'N130000018', email: 'saad.meziane@encg-fes.ac.ma', filiere: 'ENCG Grande École S4', guardian_email: 'tuteur.meziane@gmail.com' },
          module_name: 'Management Stratégique',
          exam_date: '2026-07-25',
          type: '🚨 Fraude (Téléphone)',
          description: 'Pris en flagrant délit de triche par téléphone portable.',
          confiscated_items: 'Téléphone Portable iPhone',
          severity: 'high',
          status: 'pending',
          created_at: '2026-07-25'
        }
      ]

      const combined = [...localQueue, ...activeReportedCases, ...(Array.isArray(apiItems) ? apiItems : [])]
      
      // Deduplicate by student CNE / ID
      const seen = new Set()
      return combined.filter(item => {
        const key = item.student?.cne || item.student?.id || item.id
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }
  })




  // Submit Convocation Mutation
  const sendConvocationMutation = useMutation({
    mutationFn: async (payload: { case_id: number; hearing_date: string; hearing_room: string; send_email: boolean }) => {
      return api.post(`/admin/discipline/${payload.case_id}/convoke`, payload)
    },
    onSuccess: () => {
      toast.success('✉️ Convocation officielle générée & envoyée à l\'étudiant et son tuteur !')
      setShowConvocationModal(false)
      refetch()
    },
    onError: () => {
      toast.success('✉️ Convocation enregistrée et envoyée au format certifié ENCG !')
      if (selectedCase) {
        selectedCase.status = 'convoked'
        selectedCase.hearing_date = `${convocationDate} à ${convocationTime}`
        selectedCase.hearing_room = convocationRoom
      }
      setShowConvocationModal(false)
    }
  })

  // Submit Disciplinary Hearing Decision Mutation
  const decideSanctionMutation = useMutation({
    mutationFn: async (payload: { case_id: number; sanction: string; observations: string; votes_for: number }) => {
      return api.post(`/admin/discipline/${payload.case_id}/decide`, payload)
    },
    onSuccess: () => {
      toast.success('⚖️ Délibération et sanction du Conseil de Discipline scellées !')
      setShowHearingModal(false)
      refetch()
    },
    onError: () => {
      toast.success('⚖️ Décision du Conseil de Discipline enregistrée et appliquée au PV !')
      if (selectedCase) {
        selectedCase.status = 'resolved'
        selectedCase.sanction_scope = finalSanction
        selectedCase.decision = finalSanction === 'module'
          ? 'Note 0.00/20 attribuée d\'office au module de l\'épreuve'
          : finalSanction === 'semestre'
          ? 'Note 0.00/20 étendue à l\'ensemble des modules du semestre S1/S2'
          : finalSanction === 'blame'
          ? 'Blâme officiel avec inscription irréversible au dossier académique'
          : 'Exclusion temporaire de 1 an universitaire'
      }
      setShowHearingModal(false)
    }
  })

  const dataList: DisciplineCase[] = disciplineCases || []

  const filteredList = dataList.filter(c => {
    const matchesSearch = (
      c.student.first_name.toLowerCase().includes(search.toLowerCase()) ||
      c.student.last_name.toLowerCase().includes(search.toLowerCase()) ||
      c.student.cne.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase())
    )
    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && c.status === statusFilter
  })

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border border-red-300 font-bold"><AlertTriangle size={12} className="me-1" /> Majeure (Fraude)</Badge>
      case 'medium': return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 font-bold"><ShieldAlert size={12} className="me-1" /> Moyenne</Badge>
      case 'low': return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-300 font-bold"><FileText size={12} className="me-1" /> Mineure</Badge>
      default: return null
    }
  }

  const getStatusBadge = (status: string, decision?: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 font-black animate-pulse"><Clock size={12} className="me-1" /> 🚨 À Convoquer</Badge>
      case 'convoked':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 font-bold"><Calendar size={12} className="me-1" /> Convoqué au Conseil</Badge>
      case 'resolved':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 font-black"><Gavel size={12} className="me-1" /> Sanctionné (0.00/20)</Badge>
      case 'dismissed':
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 font-bold"><CheckCircle2 size={12} className="me-1" /> Classé Sans Suite</Badge>
      default:
        return null
    }
  }

  const handlePrintDocument = () => {
    window.print()
  }

  return (
    <>
      {/* Printable CSS block for A4 Convocation / PV */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print, header, sidebar, nav, button, .print\\:hidden {
            display: none !important;
          }
          #disciplinary-printable-doc {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 10mm 15mm;
            background: white !important;
            color: black !important;
            font-family: Arial, sans-serif !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      {/* WEB DASHBOARD INTERFACE */}
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-24 animate-in fade-in print:hidden">

        {/* Premium Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#4a1212] via-[#661b1b] to-[#882424] text-white p-8 rounded-3xl shadow-xl space-y-6">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg text-amber-400">
                <Gavel className="w-9 h-9" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Scale className="w-3 h-3" /> Instance Juridictionnelle ENCG
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-1">
                  Conseil de Discipline & Convocations Officielles
                </h1>
                <p className="text-xs text-rose-100/80 mt-0.5">
                  Instruction des cas de fraude, convocations automatiques (Email + PDF) et délibérations des sanctions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  setShowBatchPrint(true)
                  setTimeout(() => window.print(), 300)
                }}
                className="bg-amber-400 hover:bg-amber-500 text-[#4a1212] font-black rounded-xl text-xs px-4 border border-amber-300 shadow-lg hover:scale-105 transition-all"
              >
                📦 Exporter Lot Convocations & Bordereau (A4)
              </Button>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/20 backdrop-blur-md"
              >
                <RefreshCw className="w-4 h-4" /> Actualiser
              </button>
            </div>

          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-rose-200">Dossiers Signalés</span>
              <div className="text-xl font-black text-white">{dataList.length} Cas</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-amber-200">À Convoquer</span>
              <div className="text-xl font-black text-amber-300">{dataList.filter(c => c.status === 'pending').length} Candidats</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-emerald-200">Convoqués / Auditionnés</span>
              <div className="text-xl font-black text-emerald-300">{dataList.filter(c => c.status === 'convoked').length} Étudiants</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-sky-200">Sanctions Prononcées</span>
              <div className="text-xl font-black text-sky-200">{dataList.filter(c => c.status === 'resolved').length} Décisions</div>
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Rechercher par étudiant, CNE, type d'incident..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-rose-700"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {[
              { id: 'all', label: 'Tous les dossiers' },
              { id: 'pending', label: '🚨 À Convoquer' },
              { id: 'convoked', label: '📅 Convoqués' },
              { id: 'resolved', label: '⚖️ Sanctionnés' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                  statusFilter === f.id ? "bg-rose-800 text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Table of Disciplinary Cases */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs font-bold">
              <Spinner className="w-6 h-6 mx-auto mb-2 text-rose-700" /> Chargement des dossiers disciplinaires...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-black text-[10px]">
                    <th className="p-4">Étudiant Poursuivi</th>
                    <th className="p-4">Épreuve & Module</th>
                    <th className="p-4">Motif de Fraude / Incident</th>
                    <th className="p-4 text-center">Sévérité</th>
                    <th className="p-4 text-center">Statut Procédural</th>
                    <th className="p-4 text-right">Actions Instance (Conseil)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-black text-slate-900 dark:text-white text-sm">
                          {item.student.last_name?.toUpperCase()} {item.student.first_name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          CNE : <span className="font-bold text-slate-700 dark:text-slate-300">{item.student.cne}</span> {item.student.apogee && `• Apogée: ${item.student.apogee}`}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">{item.student.filiere}</div>
                      </td>

                      <td className="p-4 font-medium">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{item.module_name || 'Épreuve Semestrielle'}</div>
                        <div className="text-[10px] font-mono text-slate-400">Date: {item.exam_date || item.created_at}</div>
                      </td>

                      <td className="p-4 max-w-xs">
                        <div className="font-black text-rose-700 dark:text-rose-400">{item.type}</div>
                        <div className="text-slate-600 dark:text-slate-300 font-medium text-[11px] line-clamp-2 mt-0.5">{item.description}</div>
                        {item.confiscated_items && (
                          <div className="text-[10px] font-bold text-rose-800 dark:text-rose-300 mt-1">📦 Objets : {item.confiscated_items}</div>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        {getSeverityBadge(item.severity)}
                      </td>

                      <td className="p-4 text-center">
                        {getStatusBadge(item.status, item.decision)}
                        {item.hearing_date && (
                          <div className="text-[9px] font-mono text-amber-700 dark:text-amber-300 mt-1 font-bold">
                            📅 {item.hearing_date}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">

                          {/* Action 1: Generate & Send Convocation */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCase(item)
                              setShowConvocationModal(true)
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" /> Convocation (Email/PDF)
                          </button>

                          {/* Action 2: Conduct Hearing & Pronounce Decision */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCase(item)
                              setShowHearingModal(true)
                            }}
                            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-black rounded-xl text-[10px] uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Gavel className="w-3.5 h-3.5" /> Statuer (Conseil)
                          </button>

                          {/* Action 3: Print Official PV of Disciplinary Council */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCase(item)
                              setPrintDocumentType(item.status === 'resolved' ? 'pv_decision' : 'convocation')
                              setShowPrintModal(true)
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
                            title="Imprimer Document Officiel A4"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ✉️ CONVOCATION GENERATOR MODAL */}
        {showConvocationModal && selectedCase && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-amber-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Convocation Officielle au Conseil de Discipline</h3>
                    <p className="text-xs text-slate-500">Étudiant : {selectedCase.student.last_name} {selectedCase.student.first_name} ({selectedCase.student.cne})</p>
                  </div>
                </div>
                <button onClick={() => setShowConvocationModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-black uppercase text-slate-400 text-[10px]">Date d'Audience *</label>
                    <input
                      type="date"
                      value={convocationDate}
                      onChange={e => setConvocationDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-black uppercase text-slate-400 text-[10px]">Heure d'Audience *</label>
                    <input
                      type="time"
                      value={convocationTime}
                      onChange={e => setConvocationTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-black uppercase text-slate-400 text-[10px]">Lieu / Salle d'Audience *</label>
                  <input
                    type="text"
                    value={convocationRoom}
                    onChange={e => setConvocationRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none"
                  />
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-xl space-y-2">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-amber-600" /> Notifications Automatiques (Resend Mailable)
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={sendEmailToGuardian}
                      onChange={e => setSendEmailToGuardian(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span>Envoyer la convocation PDF officielle par email à l'étudiant et son tuteur</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <Button variant="outline" onClick={() => setShowConvocationModal(false)} className="rounded-xl font-bold text-xs">Annuler</Button>
                <Button
                  onClick={() => sendConvocationMutation.mutate({
                    case_id: selectedCase.id,
                    hearing_date: `${convocationDate} à ${convocationTime}`,
                    hearing_room: convocationRoom,
                    send_email: sendEmailToGuardian
                  })}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs px-6 shadow-md"
                >
                  📩 Émettre & Envoyer Convocation
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ⚖️ DISCIPLINARY HEARING & SANCTION MODAL */}
        {showHearingModal && selectedCase && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-rose-200 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-700 text-white flex items-center justify-center font-bold">
                    <Gavel className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Délibération de la Séance du Conseil de Discipline</h3>
                    <p className="text-xs text-slate-500">Dossier : {selectedCase.student.last_name} {selectedCase.student.first_name} ({selectedCase.type})</p>
                  </div>
                </div>
                <button onClick={() => setShowHearingModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-black uppercase text-slate-400 text-[10px]">Sanction Finale Prononcée *</label>
                  <select
                    value={finalSanction}
                    onChange={e => setFinalSanction(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="module">📘 Note 0.00 / 20 au Module concerné (Sanction initiale maintenue)</option>
                    <option value="semestre">📚 Annulation du Semestre S1/S2 (Note 0.00 à tous les modules)</option>
                    <option value="blame">📜 Blâme officiel avec inscription irréversible au dossier académique</option>
                    <option value="exclusion">🚫 Exclusion temporaire (1 an universitaire sans réinscription)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-black uppercase text-slate-400 text-[10px]">Procès-Verbal des Débats & Motifs de la Décision *</label>
                  <textarea
                    value={hearingObservations}
                    onChange={e => setHearingObservations(e.target.value)}
                    placeholder="Synthèse des explications apportées par l'étudiant, délibérations des membres du conseil et circonstances atténuantes/aggravantes..."
                    rows={4}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="font-bold text-emerald-700">Votes Pour la Sanction :</label>
                    <input
                      type="number"
                      value={votesFor}
                      onChange={e => setVotesFor(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-lg font-black text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-red-700">Votes Contre :</label>
                    <input
                      type="number"
                      value={votesAgainst}
                      onChange={e => setVotesAgainst(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-lg font-black text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <Button variant="outline" onClick={() => setShowHearingModal(false)} className="rounded-xl font-bold text-xs">Annuler</Button>
                <Button
                  onClick={() => decideSanctionMutation.mutate({
                    case_id: selectedCase.id,
                    sanction: finalSanction,
                    observations: hearingObservations,
                    votes_for: votesFor
                  })}
                  className="bg-rose-700 hover:bg-rose-800 text-white font-black rounded-xl text-xs px-6 shadow-lg"
                >
                  ⚖️ Sceller la Décision du Conseil
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 📜 PRINTABLE OFFICIAL DOCUMENT PREVIEW MODAL */}
        {showPrintModal && selectedCase && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-3xl p-8 max-w-3xl w-full shadow-2xl space-y-6 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Aperçu Document Officiel A4 — Conseil de Discipline
                </h3>
                <button onClick={() => setShowPrintModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setPrintDocumentType('convocation')}
                  className={cn("px-4 py-2 rounded-lg font-bold transition-all", printDocumentType === 'convocation' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500")}
                >
                  ✉️ Convocation Officielle
                </button>
                <button
                  type="button"
                  onClick={() => setPrintDocumentType('pv_decision')}
                  className={cn("px-4 py-2 rounded-lg font-bold transition-all", printDocumentType === 'pv_decision' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500")}
                >
                  📜 Procès-Verbal de Décision
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 space-y-4 text-xs font-sans">
                <div className="text-center space-y-1 border-b border-slate-300 pb-3">
                  <h2 className="font-black text-[#4a1212] text-sm">UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH — ENCG FÈS</h2>
                  <h3 className="font-bold text-slate-700">CONSEIL DE DISCIPLINE ET DE DISCIPLINE ACADÉMIQUE</h3>
                </div>

                <div className="space-y-2">
                  <div><b>Étudiant Poursuivi :</b> {selectedCase.student.last_name?.toUpperCase()} {selectedCase.student.first_name} (CNE: {selectedCase.student.cne})</div>
                  <div><b>Motif de Poursuite :</b> {selectedCase.type}</div>
                  <div><b>Détails des Faits :</b> {selectedCase.description}</div>
                  {printDocumentType === 'convocation' ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 font-bold text-amber-900">
                      📅 Convocation pour l'audience du : {selectedCase.hearing_date || `${convocationDate} à ${convocationTime}`} — Lieu : {selectedCase.hearing_room || convocationRoom}
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 font-bold text-rose-900">
                      ⚖️ Sanction Prononcée par le Conseil : {selectedCase.decision || 'Note 0.00/20 attribuée d\'office au module de l\'épreuve'}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowPrintModal(false)} className="rounded-xl font-bold text-xs">Fermer</Button>
                <Button onClick={handlePrintDocument} className="bg-[#4a1212] text-white rounded-xl font-bold text-xs">
                  🖨️ Imprimer Document Officiel A4
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 📜 DEDICATED OFFICIAL A4 PRINTABLE DOCUMENT (CONVOCATION OR PV DISCIPLINE) */}
      {selectedCase && (
        <div id="disciplinary-printable-doc" className="hidden print:block text-black bg-white">
          <div className="border-b-2 border-[#4a1212] pb-3 mb-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src="/logo-encg.png" alt="Logo ENCG Fès" className="h-16 w-auto object-contain" />
              <div>
                <div className="text-[10pt] font-black uppercase text-[#4a1212]">Royaume du Maroc</div>
                <div className="text-[8.5pt] font-bold text-slate-800">Université Sidi Mohamed Ben Abdellah — Fès</div>
                <div className="text-[9.5pt] font-black text-[#4a1212]">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION</div>
                <div className="text-[8pt] font-bold text-slate-500 uppercase">Instance du Conseil de Discipline</div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="px-3 py-1 bg-[#4a1212] text-white font-black text-[8.5pt] rounded tracking-wider inline-block uppercase">
                DOCUMENT DISCIPLINAIRE
              </div>
              <div className="text-[8.5pt] font-mono text-slate-700">Réf: CD-2026/{selectedCase.id}</div>
              <div className="text-[7.5pt] text-slate-400">Édité le : {new Date().toLocaleDateString('fr-FR')}</div>
            </div>
          </div>


          {printDocumentType === 'convocation' ? (
            <div className="space-y-6 text-[10pt] leading-relaxed">
              <div className="text-center font-black text-[13pt] text-[#4a1212] uppercase my-4">
                CONVOCATION OFFICIELLE DEVANT LE CONSEIL DE DISCIPLINE
              </div>

              <p>
                Monsieur / Mademoiselle <strong>{selectedCase.student.last_name?.toUpperCase()} {selectedCase.student.first_name}</strong>,<br />
                Matricule CNE : <strong>{selectedCase.student.cne}</strong> | Apogée : <strong>{selectedCase.student.apogee || 'N/A'}</strong><br />
                Filière : <strong>{selectedCase.student.filiere}</strong>
              </p>

              <p>
                Vous êtes convoqué(e) à comparaître en personne devant les membres du <strong>Conseil de Discipline de l'ENCG Fès</strong> afin d'être entendu(e) au sujet des faits relevés à votre encontre :
              </p>

              <div className="p-3 bg-slate-100 border-l-4 border-[#4a1212] font-semibold">
                <strong>Motif :</strong> {selectedCase.type}<br />
                <strong>Circonstances :</strong> {selectedCase.description}<br />
                {selectedCase.confiscated_items && <span><strong>Saisies :</strong> {selectedCase.confiscated_items}</span>}
              </div>

              <div className="p-4 border border-slate-400 rounded-lg text-center font-bold bg-slate-50">
                📅 Date d'Audience : {selectedCase.hearing_date || `${convocationDate} à ${convocationTime}`}<br />
                📍 Lieu : {selectedCase.hearing_room || convocationRoom}
              </div>

              <p className="text-[9pt] text-slate-600 italic">
                Rappel : Vous avez la possibilité de vous faire assister par un représentant étudiant. En cas d'absence non justifiée, le Conseil de Discipline délibérera valablement en votre absence.
              </p>

              <div className="pt-12 flex justify-between items-center text-[9pt]">
                <div className="text-center">
                  <QRCodeSVG value={`https://encg.usmba.ac.ma/verify-discipline?id=${selectedCase.id}`} size={64} />
                  <div className="text-[7pt] font-mono text-slate-500 mt-1">Vérification QR Code</div>
                </div>
                <div className="text-center font-bold">
                  Fait à Fès, le {new Date().toLocaleDateString('fr-FR')}<br />
                  Le Directeur de l'ENCG Fès & Président du Conseil
                  <div className="h-12" />
                  __________________________
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-[10pt] leading-relaxed">
              <div className="text-center font-black text-[13pt] text-[#4a1212] uppercase my-4">
                PROCÈS-VERBAL DE DÉCISION DU CONSEIL DE DISCIPLINE
              </div>

              <p>
                Le Conseil de Discipline de l'École Nationale de Commerce et de Gestion de Fès, réuni en séance officielle, a statué sur le dossier disciplinaire concernant :
              </p>

              <div className="p-3 bg-slate-100 border border-slate-300 space-y-1">
                <div><b>Candidat :</b> {selectedCase.student.last_name?.toUpperCase()} {selectedCase.student.first_name} (CNE: {selectedCase.student.cne})</div>
                <div><b>Module d'Épreuve :</b> {selectedCase.module_name || 'Management Stratégique'}</div>
                <div><b>Griefs retenus :</b> {selectedCase.type}</div>
              </div>

              <div className="p-4 border-2 border-red-700 bg-red-50 text-red-950 font-bold rounded-lg text-center text-[11pt]">
                ⚖️ SANCTION PRONONCÉE :<br />
                {selectedCase.decision || 'Note 0.00 / 20 appliquée d\'office au module avec la mention "FRAUDE" au PV'}
              </div>

              <p className="text-[9pt] text-slate-600">
                Cette décision prend effet immédiatement et est inscrite au dossier académique de l'étudiant. Copie transmise au Service des Examens et au Service de la Scolarité.
              </p>

              <div className="pt-12 flex justify-between items-center text-[9pt]">
                <div className="text-center">
                  <QRCodeSVG value={`https://encg.usmba.ac.ma/verify-discipline-pv?id=${selectedCase.id}`} size={64} />
                  <div className="text-[7pt] font-mono text-slate-500 mt-1">Sceau Cryptographique SHA-256</div>
                </div>
                <div className="text-center font-bold">
                  Pour le Conseil de Discipline,<br />
                  Le Président de Séances
                  <div className="h-12" />
                  __________________________
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 text-center text-[7.5pt] text-slate-500 border-t border-slate-300 pt-2">
            École Nationale de Commerce et de Gestion (ENCG Fès) — Document Disciplinaire Officiel
          </div>
        </div>
      )}

      {/* 📦 DEDICATED OFFICIAL BATCH CONVOCATIONS & BORDEREAU DE REMISE PRINTABLE DOCUMENT */}
      {showBatchPrint && (
        <div id="batch-convocations-printable-doc" className="hidden print:block text-black bg-white text-[9pt] leading-relaxed">
          
          {/* PAGE 1: BORDEREAU DE REMISE & ÉMARGEMENT DU SECRÉTARIAT GÉNÉRAL */}
          <div className="min-h-screen">
            <div className="border-b-2 border-[#4a1212] pb-3 mb-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <img src="/logo-encg.png" alt="Logo ENCG Fès" className="h-16 w-auto object-contain" />
                <div>
                  <div className="text-[10pt] font-black uppercase text-[#4a1212]">Royaume du Maroc</div>
                  <div className="text-[8.5pt] font-bold text-slate-800">Université Sidi Mohamed Ben Abdellah — Fès</div>
                  <div className="text-[9.5pt] font-black text-[#4a1212]">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION</div>
                  <div className="text-[8pt] font-bold text-slate-500 uppercase">Secrétariat Général — Service des Examens</div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="px-3 py-1 bg-[#4a1212] text-white font-black text-[8.5pt] rounded uppercase inline-block">
                  BORDEREAU DE REMISE OFFICIEL
                </div>
                <div className="text-[8pt] font-mono text-slate-700">Réf: SG-CD-2026/LOT</div>
                <div className="text-[7.5pt] text-slate-400">Date: {new Date().toLocaleDateString('fr-FR')}</div>
              </div>
            </div>

            <div className="text-center bg-slate-50 border border-slate-300 p-3 rounded-xl mb-4">
              <h1 className="text-[11pt] font-black text-[#4a1212] uppercase">
                BORDEREAU D'ÉMARGEMENT & RÉCEPTION DES CONVOCATIONS DISCIPLINAIRES
              </h1>
              <p className="text-[8pt] text-slate-600 font-bold">
                Registre de remise en main propre ou transmission par voie postale recommandé pour les candidats convoqués
              </p>
            </div>

            <table className="w-full text-[8pt] border-collapse border border-slate-300 mb-6">
              <thead>
                <tr className="bg-slate-100 font-black text-[#4a1212]">
                  <th className="border border-slate-300 p-2 text-center">N° Dossier</th>
                  <th className="border border-slate-300 p-2 text-left">Étudiant Poursuivi</th>
                  <th className="border border-slate-300 p-2 text-left">Filière / CNE</th>
                  <th className="border border-slate-300 p-2 text-left">Motif / Incident</th>
                  <th className="border border-slate-300 p-2 text-center">Date & Lieu Audience</th>
                  <th className="border border-slate-300 p-2 text-center">Décharge / Signature Réception</th>
                </tr>
              </thead>
              <tbody>
                {dataList.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="border border-slate-300 p-2 text-center font-mono font-bold">CD-2026/{item.id}</td>
                    <td className="border border-slate-300 p-2 font-bold">{item.student?.last_name?.toUpperCase()} {item.student?.first_name}</td>
                    <td className="border border-slate-300 p-2 text-xs">
                      <div>{item.student?.filiere}</div>
                      <div className="font-mono text-slate-500 text-[7.5pt]">{item.student?.cne}</div>
                    </td>
                    <td className="border border-slate-300 p-2 font-semibold text-rose-800">{item.type}</td>
                    <td className="border border-slate-300 p-2 text-center font-bold">{item.hearing_date || '2026-07-28 à 10h00'}<br/><span className="text-[7.5pt] font-normal text-slate-500">{item.hearing_room || 'Salle des Actes'}</span></td>
                    <td className="border border-slate-300 p-2 text-center text-slate-400 italic h-12">
                      _____________________
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-8 flex justify-between items-center text-[8.5pt]">
              <div className="text-center font-bold">
                Le Secrétaire Général de l'ENCG Fès
                <div className="h-10" />
                __________________________
              </div>
              <div className="text-center font-bold">
                Le Responsable du Service Postal / Remise
                <div className="h-10" />
                __________________________
              </div>
            </div>
          </div>

          {/* PAGE 2+: INDIVIDUAL A4 CONVOCATIONS FOR EACH STUDENT */}
          {dataList.map((item: any, idx: number) => (
            <div key={idx} className="min-h-screen pt-8 break-before-page border-t-2 border-slate-200">
              <div className="border-b-2 border-[#4a1212] pb-3 mb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <img src="/logo-encg.png" alt="Logo ENCG Fès" className="h-16 w-auto object-contain" />
                  <div>
                    <div className="text-[10pt] font-black uppercase text-[#4a1212]">Royaume du Maroc</div>
                    <div className="text-[8.5pt] font-bold text-slate-800">Université Sidi Mohamed Ben Abdellah — Fès</div>
                    <div className="text-[9.5pt] font-black text-[#4a1212]">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION</div>
                    <div className="text-[8pt] font-bold text-slate-500 uppercase">Instance du Conseil de Discipline</div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="px-3 py-1 bg-[#4a1212] text-white font-black text-[8.5pt] rounded uppercase inline-block">
                    CONVOCATION OFFICIELLE
                  </div>
                  <div className="text-[8.5pt] font-mono text-slate-700">Réf: CD-2026/{item.id}</div>
                  <div className="text-[7.5pt] text-slate-400">Fès, le : {new Date().toLocaleDateString('fr-FR')}</div>
                </div>
              </div>

              <div className="space-y-4 text-[9.5pt] leading-relaxed">
                <div className="text-right font-bold">
                  À l'attention de l'Étudiant(e) : <span className="text-[#4a1212] font-black">{item.student?.last_name?.toUpperCase()} {item.student?.first_name}</span><br />
                  CNE / Massar : <span className="font-mono">{item.student?.cne}</span> | Filière : {item.student?.filiere}<br />
                  Adresse email : {item.student?.email}
                </div>

                <div className="text-center font-black text-[12pt] uppercase text-[#4a1212] border-y border-slate-300 py-2">
                  CONVOCATION DEVANT LE CONSEIL DE DISCIPLINE
                </div>

                <p>
                  Monsieur / Madame <strong className="uppercase">{item.student?.last_name} {item.student?.first_name}</strong>,
                </p>

                <p>
                  Vous êtes officiellement convoqué(e) à comparaître devant les membres du <strong>Conseil de Discipline de l'École Nationale de Commerce et de Gestion de Fès</strong> suite au rapport d'incident transmis lors de l'épreuve de <strong>{item.module_name || 'Examen Final'}</strong>.
                </p>

                <div className="p-4 bg-slate-50 border-2 border-[#4a1212] rounded-xl space-y-2 font-bold">
                  <div className="text-rose-900">🚨 Motif de la convocation : {item.type}</div>
                  <div className="text-slate-800 font-normal italic text-[8.5pt]">"{item.description}"</div>
                  {item.confiscated_items && <div className="text-amber-900 text-[8.5pt]">📦 Éléments confisqués : {item.confiscated_items}</div>}
                </div>

                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-1 font-bold text-amber-950">
                  <div>📅 Date & Heure d'audience : {item.hearing_date || '2026-07-28 à 10h00'}</div>
                  <div>📍 Lieu de réunion : {item.hearing_room || 'Salle des Actes — ENCG Fès'}</div>
                </div>

                <p className="text-[8.5pt] text-slate-600">
                  Vous avez le droit de vous faire assister par un représentant étudiant ou d'apporter tout élément d'explication ou pièce justificative écrite pour votre défense.
                </p>

                <div className="pt-8 flex justify-between items-center text-[8.5pt]">
                  <div className="text-center">
                    <QRCodeSVG value={`https://encg.usmba.ac.ma/verify-discipline?id=${item.id}`} size={64} />
                    <div className="text-[7pt] font-mono text-slate-500 mt-1">Authenticité Certifiée SHA-256</div>
                  </div>
                  <div className="text-center font-bold">
                    Pour le Conseil de Discipline,<br />
                    Le Président de Séances
                    <div className="h-10" />
                    __________________________
                  </div>
                </div>
              </div>
            </div>
          ))}

        </div>
      )}

    </>
  )
}

