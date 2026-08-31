import { useRef, useState, useEffect } from 'react'
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, ChevronDown, FileDown, Sparkles, HelpCircle } from 'lucide-react'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { cn } from '@shared/lib/utils'
import type { ImportResult } from '../../../types/models'

interface ExcelActionsProps {
  /** API model slug: 'students' | 'professors' | 'filieres' | 'modules' | 'groups' | 'rooms' | 'vacataires' */
  model: string
  /** Label shown in button tooltips */
  label?: string
  /** Visual variant: 'hero' for navy/gradient headers, 'default' for standard white cards */
  variant?: 'hero' | 'default'
  /** Callback to refresh the parent table after a successful import */
  onImportSuccess?: () => void
}

/**
 * ExcelActions — Premium reusable Export + Import toolbar with dropdown & templates.
 */
export default function ExcelActions({ model, label, variant = 'hero', onImportSuccess }: ExcelActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setShowDropdown(false)
    setExporting(true)
    const toastId = toast.loading(`Génération du fichier Excel (${label ?? model})...`)
    try {
      const response = await api.get(`/export/${model}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${label ?? model}_${new Date().toISOString().slice(0, 10)}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`📊 Export réussi — ${label ?? model}.xlsx téléchargé !`, { id: toastId })
    } catch {
      toast.error('Erreur lors de l\'export Excel', { id: toastId })
    } finally {
      setExporting(false)
    }
  }

  // ── Download Template ───────────────────────────────────────────────────────
  const handleTemplate = async () => {
    setShowDropdown(false)
    const toastId = toast.loading(`Téléchargement du modèle (${label ?? model})...`)
    try {
      const response = await api.get(`/export/${model}/template`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Template_${label ?? model}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`📋 Modèle Vierge ${label ?? model} prêt à l'emploi !`, { id: toastId })
    } catch {
      toast.error('Erreur lors du téléchargement du template', { id: toastId })
    }
  }

  // ── Import ──────────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setImporting(true)
    setImportResult(null)
    const toastId = toast.loading(`Importation du fichier ${file.name}...`)

    try {
      const res = await api.post(`/import/${model}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const count = res.data.imported ?? 0
      setImportResult({ success: true, count })
      toast.success(`✨ ${count} enregistrement(s) importé(s) avec succès !`, { id: toastId })
      onImportSuccess?.()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; failures?: ImportResult['errors'] } } }
      const msg = e?.response?.data?.message ?? 'Erreur d\'importation'
      const failures = e?.response?.data?.failures ?? []
      setImportResult({ success: false, errors: failures })
      toast.error(msg, { id: toastId })
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const isHero = variant === 'hero'

  return (
    <div className="flex items-center gap-2.5">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
        id={`excel-import-${model}`}
      />

      {/* IMPORT button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        title={`Importer un fichier Excel ${label ?? model}`}
        className={cn(
          "flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
          isHero
            ? "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl hover:border-white/30 hover:scale-102"
            : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
        )}
      >
        {importing ? (
          <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
        ) : (
          <Upload className="w-4 h-4 text-amber-300" />
        )}
        <span className="hidden sm:inline">{importing ? 'Import...' : 'Importer Excel'}</span>
      </button>

      {/* EXPORT + TEMPLATE Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            title={`Exporter ${label ?? model} en Excel`}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-l-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
              isHero
                ? "bg-white/10 hover:bg-white/20 text-white border-y border-l border-white/20 backdrop-blur-xl hover:border-white/30"
                : "bg-blue-50 text-blue-700 border-y border-l border-blue-200 hover:bg-blue-100 hover:border-blue-300"
            )}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <Download className="w-4 h-4 text-emerald-400" />
            )}
            <span className="hidden sm:inline">{exporting ? 'Export...' : 'Exporter Excel'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            title="Options d'exportation & Modèle"
            className={cn(
              "flex items-center justify-center px-2.5 py-3 rounded-r-2xl text-xs font-black transition-all cursor-pointer shadow-sm",
              isHero
                ? "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl hover:border-white/30"
                : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300",
              showDropdown && (isHero ? "bg-white/25 border-white/40" : "bg-blue-200")
            )}
          >
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", showDropdown && "rotate-180 text-amber-300")} />
          </button>
        </div>

        {/* 🌟 PREMIUM POPUP MENU */}
        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 z-[9999] w-72 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between mb-1">
              <span>Options Excel & Export</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>

            {/* Option 1: Full Export */}
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50/80 dark:hover:bg-blue-950/40 text-slate-800 dark:text-white flex items-center gap-3 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                  Exporter la Liste (.xlsx)
                </div>
                <div className="text-[10px] text-slate-400">
                  Fichier complet avec tous les champs
                </div>
              </div>
            </button>

            {/* Option 2: Blank Template */}
            <button
              type="button"
              onClick={handleTemplate}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-amber-50/80 dark:hover:bg-amber-950/40 text-slate-800 dark:text-white flex items-center gap-3 transition-all cursor-pointer group mt-1"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
                <FileDown className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                  Modèle Vierge (Template)
                </div>
                <div className="text-[10px] text-slate-400">
                  Canevas pré-formaté pour importation
                </div>
              </div>
            </button>

            {/* Info hint */}
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 px-2 flex items-center gap-1.5 text-[10px] text-slate-400">
              <HelpCircle className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>Formats acceptés : .xlsx, .xls, .csv</span>
            </div>
          </div>
        )}
      </div>

      {/* Inline result badge */}
      {importResult && (
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border animate-in fade-in backdrop-blur-md",
          importResult.success
            ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
            : "bg-red-500/20 text-red-200 border-red-400/40"
        )}>
          {importResult.success
            ? <><CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> {importResult.count} importé(s)</>
            : <><AlertCircle className="w-3.5 h-3.5 text-red-300" /> {importResult.errors?.length ?? 0} erreur(s)</>
          }
        </div>
      )}
    </div>
  )
}
