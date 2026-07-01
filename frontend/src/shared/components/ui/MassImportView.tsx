import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, ArrowLeft, Info, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'

interface MassImportViewProps {
  title: string
  bannerTitle: string
  bannerSubtitle: string
  modelName: string
  templateName: string
  templateDesc: React.ReactNode
  instructions: React.ReactNode
  apiModel: string
  onBack: () => void
  onSuccess: () => void
}

export default function MassImportView({
  title,
  bannerTitle,
  bannerSubtitle,
  modelName,
  templateName,
  templateDesc,
  instructions,
  apiModel,
  onBack,
  onSuccess
}: MassImportViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; count?: number; errors?: any[] } | null>(null)

  const handleTemplate = async () => {
    try {
      const response = await api.get(`/export/${apiModel}/template`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Template_${apiModel}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`Template téléchargé !`)
    } catch (err) {
      toast.error('Erreur lors du téléchargement du template')
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error("Veuillez sélectionner un fichier.")
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setIsImporting(true)
    setResult(null)

    try {
      const res = await api.post(`/import/${apiModel}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const count = res.data.imported ?? 0
      setResult({ success: true, count })
      toast.success(`${count} enregistrement(s) importé(s) avec succès !`)
      onSuccess()
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erreur d\'importation'
      const failures = err?.response?.data?.failures ?? []
      setResult({ success: false, errors: failures })
      toast.error(msg)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in p-6 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#0f2863] italic">{title}</h1>
      </div>

      <div className="bg-[#0f2863] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2 italic">{bannerTitle}</h2>
          <p className="text-blue-100">{bannerSubtitle}</p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Upload className="w-32 h-32" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-md mb-3">
              MODÈLE CSV {modelName.toUpperCase()}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{templateName}</h3>
            <div className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              {templateDesc}
            </div>
          </div>
          <button 
            onClick={handleTemplate}
            className="shrink-0 px-6 py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors text-sm uppercase tracking-wider shadow-sm"
          >
            Télécharger le modèle (.csv)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Téléverser le Fichier</h3>
            <p className="text-sm text-slate-500">Déposez votre fichier de {modelName.toLowerCase()} rempli pour l'intégrer en base de données.</p>
          </div>
          <button 
            onClick={onBack}
            className="shrink-0 px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm uppercase tracking-wider flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
        </div>

        <div className="space-y-6 max-w-3xl">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sélectionner le fichier CSV (Excel)</label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white file:text-slate-700 file:border file:border-slate-200 file:shadow-sm hover:file:bg-slate-50 cursor-pointer text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex gap-4">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Instructions de formatage</h4>
              <div className="text-sm text-blue-700/80">
                {instructions}
              </div>
            </div>
          </div>

          {result && (
            <div className={cn(
              "p-4 rounded-xl border flex gap-3",
              result.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
            )}>
              {result.success ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
              <div>
                <h4 className="text-sm font-bold">{result.success ? "Importation réussie" : "Erreur d'importation"}</h4>
                <p className="text-sm opacity-90">
                  {result.success ? `${result.count} enregistrement(s) ont été importés.` : `${result.errors?.length || 0} erreur(s) détectée(s).`}
                </p>
              </div>
            </div>
          )}

          <button 
            onClick={handleImport}
            disabled={!file || isImporting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a387e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm uppercase tracking-wider"
          >
            {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {isImporting ? "Importation en cours..." : `Lancer l'importation de ${modelName}`}
          </button>
        </div>
      </div>
    </div>
  )
}
