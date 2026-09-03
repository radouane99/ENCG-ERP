import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  Sparkles, BrainCircuit, BookOpen, FileText, CheckCircle2, Printer
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { Spinner } from '@shared/components/ui/Spinner'

export default function ProfessorAiCopilotPage() {
  const [activeTab, setActiveTab] = useState<'textbook' | 'exam'>('textbook')

  // Textbook outline state
  const [selectedModuleOutline, setSelectedModuleOutline] = useState('')
  const [sessionCount, setSessionCount] = useState(12)

  // Exam paper state
  const [selectedModuleExam, setSelectedModuleExam] = useState('')
  const [examType, setExamType] = useState<'case_study' | 'qcm' | 'mixed' | 'reflection'>('case_study')
  const [difficulty, setDifficulty] = useState<'standard' | 'advanced' | 'master'>('standard')
  const [instructions, setInstructions] = useState('Épreuve officielle de fin de semestre ENCG Fès')
  const [localeFes, setLocaleFes] = useState(true)

  // Results
  const [textbookResult, setTextbookResult] = useState<any[] | null>(null)
  const [examResult, setExamResult] = useState<any | null>(null)

  // Fetch modules
  const { data: modules = [] } = useQuery({
    queryKey: ['professor-modules'],
    queryFn: () => api.get('/modules').then(res => res.data.data || res.data)
  })

  // Textbook outline mutation
  const textbookMutation = useMutation({
    mutationFn: (payload: any) => api.post('/v1/professor/copilot/textbook-outline', payload),
    onSuccess: (res) => {
      setTextbookResult(res.data.data)
      toast.success('Trame de Cahier de Texte générée avec succès !')
    },
    onError: () => toast.error('Erreur lors de la génération de la trame.')
  })

  // Exam paper mutation
  const examMutation = useMutation({
    mutationFn: (payload: any) => api.post('/v1/professor/copilot/generate-exam-paper', payload),
    onSuccess: (res) => {
      setExamResult(res.data.data)
      toast.success('Sujet d\'examen & barème créés avec succès par l\'IA !')
    },
    onError: () => toast.error('Erreur lors de la génération du sujet d\'examen.')
  })

  const handleGenerateOutline = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedModuleOutline) {
      toast.error('Veuillez sélectionner un module.')
      return
    }
    textbookMutation.mutate({
      module_id: Number(selectedModuleOutline),
      session_count: Number(sessionCount)
    })
  }

  const handleGenerateExam = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedModuleExam) {
      toast.error('Veuillez sélectionner un module.')
      return
    }
    examMutation.mutate({
      module_id: Number(selectedModuleExam),
      exam_type: examType,
      difficulty: difficulty,
      instructions: instructions,
      locale_context: localeFes ? 'fes' : 'generic',
    })
  }

  const handlePrintExam = () => {
    window.print()
  }

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-32 font-sans">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 p-8 md:p-10 text-white shadow-2xl border border-purple-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <BrainCircuit className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-purple-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Copilote Pédagogique ENCG — Gemini 1.5 Pro
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Assistant IA & Concepteur d'Épreuves
              </h1>
              <p className="text-purple-200/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Générez la trame officielle de vos cahiers de texte d'après vos supports de cours ou créez des épreuves d'examens originales avec barème sur 20 points.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shrink-0">
            <button
              onClick={() => setActiveTab('textbook')}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                activeTab === 'textbook' ? "bg-white text-indigo-950 shadow-lg" : "text-white/80 hover:text-white"
              )}
            >
              📖 Trame Cahier de Texte
            </button>
            <button
              onClick={() => setActiveTab('exam')}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                activeTab === 'exam' ? "bg-white text-indigo-950 shadow-lg" : "text-white/80 hover:text-white"
              )}
            >
              📝 Concepteur d'Examens
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Textbook Outline Generator */}
      {activeTab === 'textbook' && (
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Form Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6 h-fit">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> Paramètres du Cahier de Texte
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                L'IA analyse le syllabus et les supports PDF de la Classroom.
              </p>
            </div>

            <form onSubmit={handleGenerateOutline} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">Module d'Enseignement</label>
                <select
                  value={selectedModuleOutline}
                  onChange={e => setSelectedModuleOutline(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
                  required
                >
                  <option value="">-- Choisir un module ENCG --</option>
                  {modules.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.code ? `[${m.code}] ` : ''}{m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">Nombre de Séances Prévues</label>
                <input
                  type="number"
                  value={sessionCount}
                  onChange={e => setSessionCount(Number(e.target.value))}
                  min={4}
                  max={24}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={textbookMutation.isPending}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {textbookMutation.isPending ? <Spinner size="sm" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                <span>Générer la Trame IA</span>
              </button>
            </form>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-2 space-y-4">
            {textbookResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Trame pédagogique générée ({textbookResult.length} séances)</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {textbookResult.map((sess: any, idx: number) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-black uppercase tracking-wider">
                          SÉANCE {sess.session_number || idx + 1} ({sess.duration_hours || 3}H)
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{sess.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium"><strong>Objectifs :</strong> {sess.objectives}</p>
                      <p className="text-xs text-slate-500 font-medium"><strong>Déroulement & Thèmes :</strong> {sess.topics}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 p-16 text-center space-y-3">
                <BrainCircuit className="w-12 h-12 text-indigo-300 mx-auto" />
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200">Prêt à générer la trame pédagogique</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Sélectionnez un module pour créer un déroulement complet de cours adapté aux exigences ENCG.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Exam & Rubric Paper Generator */}
      {activeTab === 'exam' && (
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Form Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6 h-fit">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" /> Concepteur d'Examens
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Génération assistée d'études de cas, QCM et barèmes détaillés sur 20 points.
              </p>
            </div>

            <form onSubmit={handleGenerateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">Module d'Examen</label>
                <select
                  value={selectedModuleExam}
                  onChange={e => setSelectedModuleExam(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
                  required
                >
                  <option value="">-- Choisir le module --</option>
                  {modules.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.code ? `[${m.code}] ` : ''}{m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">Format de l'Épreuve</label>
                <select
                  value={examType}
                  onChange={e => setExamType(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
                >
                  <option value="case_study">Étude de Cas Réelle (Analyse Stratégique ENCG)</option>
                  <option value="qcm">QCM Rigoureux (20 Questions)</option>
                  <option value="mixed">Épreuve Mixte (Étude de Cas + QCM + Synthèse)</option>
                  <option value="reflection">Dissertation / Question de Réflexion</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">Niveau d'Exigence</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
                >
                  <option value="standard">Standard (Tronc Commun ENCG)</option>
                  <option value="advanced">Avancé (Spécialité Semestre 7/8)</option>
                  <option value="master">Expert / Master (Semestre 9/10)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">Consignes & Orientation</label>
                <textarea
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold"
                />
                <label className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-600">
                  <input type="checkbox" checked={localeFes} onChange={(e) => setLocaleFes(e.target.checked)} />
                  Cas Fès (agro, textile, logistique, artisanat) + barème LMD ≥ 6
                </label>
              </div>

              <button
                type="submit"
                disabled={examMutation.isPending}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {examMutation.isPending ? <Spinner size="sm" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                <span>Générer l'Épreuve & Barème sur 20</span>
              </button>
            </form>
          </div>

          {/* Exam Result Display */}
          <div className="lg:col-span-2 space-y-6">
            {examResult ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-md space-y-6 print:shadow-none print:border-none">
                
                {/* Print action header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 print:hidden">
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-black uppercase">
                    Sujet Officiel d'Examen sur 20 Points
                  </span>
                  <button
                    onClick={handlePrintExam}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Imprimer / Exporter PDF
                  </button>
                </div>

                {/* Exam Title & Context */}
                <div className="space-y-3">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{examResult.title}</h2>
                    <span className="text-xs font-bold text-indigo-600">Durée : 2h00 — Barème Officiel : 20 / 20</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                    <span className="font-extrabold uppercase text-slate-400 text-[10px] block">Mise en Situation / Contexte Entreprise :</span>
                    <p className="leading-relaxed italic">{examResult.context}</p>
                  </div>
                </div>

                {/* Sections & Questions */}
                <div className="space-y-6">
                  {examResult.sections?.map((sec: any, idx: number) => (
                    <div key={idx} className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <h4 className="font-extrabold text-indigo-900 dark:text-indigo-300 text-base">{sec.section_title}</h4>
                      
                      <div className="space-y-3">
                        {sec.questions?.map((q: any, qIdx: number) => (
                          <div key={qIdx} className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl space-y-1 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-xs text-slate-900 dark:text-white">Question {q.num || qIdx + 1}</span>
                              <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">({q.points} Pts)</span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{q.text}</p>
                            {q.expected_answer && (
                              <p className="text-[11px] text-slate-400 font-medium pt-1 italic">
                                🔑 Éléments de réponse attendus : {q.expected_answer}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Evaluation Rubric */}
                {examResult.rubric && (
                  <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">Grille d'Évaluation & Barème Détaillé</h4>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {examResult.rubric.map((r: any, rIdx: number) => (
                        <div key={rIdx} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{r.criteria}</span>
                            <p className="text-[10px] text-slate-400">{r.description}</p>
                          </div>
                          <span className="font-black text-indigo-600 shrink-0 ms-4">{r.points} Pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 p-16 text-center space-y-3">
                <FileText className="w-12 h-12 text-purple-300 mx-auto" />
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200">Aucun sujet généré</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Remplissez le formulaire de gauche pour concevoir une épreuve complète sur 20 points.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
