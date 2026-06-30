import { useRef, useState } from 'react'
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, ChevronDown } from 'lucide-react'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { cn } from '@shared/lib/utils'

interface ExcelActionsProps {
  /** API model slug: 'students' | 'professors' | 'filieres' | 'modules' | 'groups' | 'rooms' | 'vacataires' */
  model: string
  /** Label shown in button tooltips */
  label?: string
  /** Callback to refresh the parent table after a successful import */
  onImportSuccess?: () => void
}

/**
 * ExcelActions — reusable Export + Import toolbar.
 *
 * Usage:
 *   <ExcelActions model="students" label="Étudiants" onImportSuccess={refetch} />
 */
export default function ExcelActions({ model, label, onImportSuccess }: ExcelActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; count?: number; errors?: any[] } | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true)
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
      toast.success(`Export réussi — ${label ?? model}.xlsx téléchargé !`)
    } catch (err: any) {
      toast.error('Erreur lors de l\'export Excel')
    } finally {
      setExporting(false)
    }
  }

  // ── Download Template ───────────────────────────────────────────────────────
  const handleTemplate = async () => {
    setShowDropdown(false)
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
      toast.success(`Template téléchargé !`)
    } catch (err) {
      toast.error('Erreur lors du téléchargement du template')
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

    try {
      const res = await api.post(`/import/${model}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const count = res.data.imported ?? 0
      setImportResult({ success: true, count })
      toast.success(`${count} enregistrement(s) importé(s) avec succès !`)
      onImportSuccess?.()
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erreur d\'importation'
      const failures = err?.response?.data?.failures ?? []
      setImportResult({ success: false, errors: failures })
      toast.error(msg)
    } finally {
      setImporting(false)
      // Reset so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2">
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
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        title={`Importer un fichier Excel ${label ?? model}`}
        className={cn(
          "flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border transition-all",
          "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300",
          "disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {importing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">{importing ? 'Importation...' : 'Importer Excel'}</span>
      </button>

      {/* EXPORT + TEMPLATE dropdown */}
      <div className="relative">
        <div className="flex items-center">
          <button
            onClick={handleExport}
            disabled={exporting}
            title={`Exporter ${label ?? model} en Excel`}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-l-lg border-y border-l transition-all",
              "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{exporting ? 'Export...' : 'Exporter Excel'}</span>
          </button>

          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-r-lg border transition-all",
              "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300"
            )}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 mt-1 z-20 w-52 bg-card border rounded-xl shadow-lg overflow-hidden">
              <button
                onClick={handleTemplate}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span className="font-medium">Télécharger le template</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Inline result badge */}
      {importResult && (
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border animate-in fade-in",
          importResult.success
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-red-50 text-red-700 border-red-200"
        )}>
          {importResult.success
            ? <><CheckCircle className="w-3.5 h-3.5" /> {importResult.count} importé(s)</>
            : <><AlertCircle className="w-3.5 h-3.5" /> {importResult.errors?.length ?? 0} erreur(s)</>
          }
        </div>
      )}
    </div>
  )
}
