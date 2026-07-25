import React, { useState } from 'react'
import {
  BookOpen, Sparkles, Loader2, FileText, CheckCircle2, Share2, Lightbulb, Network
} from 'lucide-react'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { toast } from 'sonner'

export default function StudentCourseAnalysisPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)

  const handleAnalyze = async () => {
    if (!content.trim() || content.length < 10) {
      toast.error('Veuillez coller le texte de votre cours (minimum 10 caractères).')
      return
    }

    setIsAnalyzing(true)
    setAnalysis(null)

    try {
      const res = await api.post('/student/ai/analyze-course', {
        course_content: content,
        title: title || 'Support de Cours'
      })
      setAnalysis(res.data)
      toast.success('Analyse du cours effectuée par Gemini !')
    } catch {
      toast.error('Erreur lors de l\'analyse IA.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in pb-24">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <BookOpen className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-sky-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Assistant d'Évaluation & Synthèse IA
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Analyse & Carte Mentale de Cours
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Collez votre support de cours : l'IA génère un résumé exécutif, extrait les définitions fondamentales et construit une carte mentale visuelle pour vos révisions.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Input Pane */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Support de Cours
          </h2>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Titre du Cours / Module</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Finance d'Entreprise — Chapitre 3 : Diagnostic Financier"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Texte du Cours à Analyser</label>
            <textarea
              rows={13}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Collez ici le cours déposé par votre professeur dans Classroom ou le LMS..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium resize-none outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !content.trim()}
            className="w-full py-4 bg-gradient-to-r from-[#0f2863] to-indigo-700 hover:opacity-90 text-white font-black rounded-2xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-40"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
            {isAnalyzing ? 'Analyse Gemini en cours...' : 'Générer l\'Analyse & la Carte Mentale'}
          </button>
        </div>

        {/* Results Pane */}
        <div className="space-y-6">
          {!analysis && !isAnalyzing && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center text-slate-400 space-y-3">
              <Sparkles className="w-12 h-12 mx-auto text-indigo-400/40" />
              <h3 className="font-black text-sm text-slate-600 dark:text-slate-300">Aucune analyse générée</h3>
              <p className="text-xs">Collez le contenu du cours à gauche pour obtenir le résumé et la carte mentale.</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
              <p className="font-black text-sm text-slate-900 dark:text-white">Google Gemini résume le cours...</p>
              <p className="text-xs text-slate-400">Extraction des concepts clés et construction de la carte mentale Mermaid.</p>
            </div>
          )}

          {analysis && !isAnalyzing && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
              
              {/* Executive Summary */}
              <div className="space-y-2">
                <h3 className="font-black text-xs uppercase text-indigo-600 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Résumé Exécutif
                </h3>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {analysis.executive_summary}
                </p>
              </div>

              {/* Key Definitions */}
              {analysis.key_definitions?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-black text-xs uppercase text-emerald-600 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" /> Définitions Clés à Retenir
                  </h3>
                  <div className="space-y-2">
                    {analysis.key_definitions.map((d: any, i: number) => (
                      <div key={i} className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl">
                        <span className="font-black text-xs text-emerald-800 dark:text-emerald-300 block">{d.term}</span>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{d.definition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Takeaways */}
              {analysis.key_takeaways?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-black text-xs uppercase text-purple-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Points Essentiels d'Examen
                  </h3>
                  <ul className="space-y-1">
                    {analysis.key_takeaways.map((t: string, i: number) => (
                      <li key={i} className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="text-purple-500 font-bold">•</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mermaid Mindmap text view */}
              {analysis.mermaid_mindmap && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="font-black text-xs uppercase text-slate-400 flex items-center gap-1.5">
                    <Network className="w-4 h-4" /> Schéma / Carte Mentale
                  </h3>
                  <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono overflow-x-auto">
                    {analysis.mermaid_mindmap}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
