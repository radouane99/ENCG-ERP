import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, Download, Clock, CheckCircle2, XCircle, Loader2, UploadCloud, File, FileText, Trash2, Check, ArrowRight, Mail } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import DocumentViewerModal from '@shared/components/ui/DocumentViewerModal'
import api from '@shared/lib/api'
import { toast } from 'sonner'

export default function AdminRequestsPage() {
  const { t, i18n } = useTranslation('admin')
  const isRtl = i18n.language === 'ar'

  const [selectedDoc, setSelectedDoc] = useState<{url: string, title: string, person?: string} | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})

  // Drag & Drop State for Dragging Files into Upload Zone
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string, size: number, type: string, progress: number }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Drag & Drop State for Kanban columns
  const [activeDropColumn, setActiveDropColumn] = useState<string | null>(null)
  const [draggedRequestId, setDraggedRequestId] = useState<number | null>(null)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/document-requests')
      setRequests(res.data.data)
      setStats(res.data.stats || {})
    } catch (error) {
      console.error('Failed to fetch document requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [])

  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
    let rejection_reason: string | undefined
    if (status === 'rejected') {
      rejection_reason = prompt(t('requests.messages.rejection_prompt') || 'Motif du refus :') || undefined
    }
    try {
      await api.patch(`/admin/document-requests/${id}/status`, { 
        status: status === 'approved' ? 'ready' : 'rejected', 
        admin_notes: status === 'rejected' ? { reason: rejection_reason } : undefined 
      })
      toast.success(status === 'approved' ? (t('requests.messages.approve_success') || 'Demande approuvée avec succès.') : (t('requests.messages.reject_success') || 'Demande refusée.'))
      fetchRequests()
    } catch (error: any) { 
      toast.error(error.response?.data?.message || t('requests.messages.error') || 'Erreur lors de la mise à jour.') 
    }
  }

  // Handle Drag & Drop Kanban Dropping
  const handleKanbanDragOver = (e: React.DragEvent, colStatus: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (activeDropColumn !== colStatus) {
      setActiveDropColumn(colStatus)
    }
  }

  const handleKanbanDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setActiveDropColumn(null)
  }

  const handleKanbanDrop = (e: React.DragEvent, colStatus: 'approved' | 'rejected') => {
    e.preventDefault()
    setActiveDropColumn(null)
    const reqIdStr = e.dataTransfer.getData('requestId') || (draggedRequestId ? String(draggedRequestId) : null)
    if (!reqIdStr) return

    const reqId = parseInt(reqIdStr, 10)
    if (isNaN(reqId)) return

    const targetReq = requests.find(r => r.id === reqId)
    if (!targetReq) return

    if (targetReq.status === colStatus) return

    handleUpdateStatus(reqId, colStatus)
  }

  // Handle Drag & Drop File Upload Zone
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files))
    }
  }

  const processFiles = (files: File[]) => {
    const validFiles = files.filter(f => f.size <= 15 * 1024 * 1024)
    if (validFiles.length < files.length) {
      toast.warning('Certains fichiers dépassent la taille maximale autorisée (15Mo).')
    }

    validFiles.forEach(file => {
      const newFileItem = {
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0
      }

      setUploadedFiles(prev => [...prev, newFileItem])
      toast.success(`Fichier "${file.name}" ajouté avec succès pour import !`)

      // Simulate upload progress
      let currentProgress = 0
      const interval = setInterval(() => {
        currentProgress += 25
        setUploadedFiles(prev => prev.map(item => item.name === file.name ? { ...item, progress: Math.min(currentProgress, 100) } : item))
        if (currentProgress >= 100) {
          clearInterval(interval)
        }
      }, 200)
    })
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const approvedRequests = requests.filter(r => r.status === 'approved')
  const rejectedRequests = requests.filter(r => r.status === 'rejected')

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center space-y-2 mb-4">
        <h1 className="text-3xl font-black text-[#0f2863] tracking-tight">{t('requests.title') || 'Gestion des Demandes Administratives'}</h1>
        <p className="text-slate-500 font-medium text-sm max-w-xl">
          Consultez, validez ou rejetez les demandes de documents. Glissez-déposez les cartes pour changer leur statut !
        </p>
      </div>

      {/* Banner & Drag and Drop File Upload Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="lg:col-span-2 bg-gradient-to-br from-[#0f2863] via-[#1a387e] to-[#0b1f4f] p-8 text-white rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 space-y-2">
            <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-3 py-1 rounded-full border border-amber-300/30 uppercase tracking-widest">
              Guichet Unique & Signature Numérique
            </span>
            <h2 className="text-2xl font-black italic tracking-wide">{t('requests.subtitle') || 'Traitement Automatisé des Attestations'}</h2>
            <p className="text-white/80 text-xs leading-relaxed max-w-lg font-medium">
              Glissez-déposez une carte de demande vers la colonne "Approuvé" ou "Refusé" pour mettre à jour son statut instantanément avec génération automatique de l'attestation PDF.
            </p>
          </div>

          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/10 z-10 text-xs font-bold">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
              <span>En attente: {stats.pending || pendingRequests.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              <span>Approuvés: {stats.approved || approvedRequests.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <span>Refusés: {stats.rejected || rejectedRequests.length}</span>
            </div>
          </div>
        </div>

        {/* Drag & Drop File Upload Dropzone */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "rounded-[2rem] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 border-2 border-dashed relative overflow-hidden",
            isDraggingFile 
              ? "border-blue-500 bg-blue-50/80 scale-[1.02] shadow-lg ring-4 ring-blue-200" 
              : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/80 shadow-sm"
          )}
        >
          <input 
            ref={fileInputRef} 
            type="file" 
            multiple 
            className="hidden" 
            accept=".pdf,.doc,.docx,.png,.jpg"
            onChange={(e) => e.target.files && processFiles(Array.from(e.target.files))} 
          />

          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 border border-blue-100 shadow-xs">
            <UploadCloud className="w-6 h-6 animate-bounce" />
          </div>

          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            {isDraggingFile ? 'Déposez vos fichiers ici !' : 'Zone de Dépôt de Documents'}
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            Glissez-déposez des scans ou PDF à importer (Attestations, Relevés...)
          </p>

          <span className="mt-3 px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase rounded-full border border-slate-200">
            Parcourir les fichiers
          </span>

          {uploadedFiles.length > 0 && (
            <div className="w-full mt-4 space-y-2 text-left" onClick={(e) => e.stopPropagation()}>
              {uploadedFiles.slice(-2).map((file, idx) => (
                <div key={idx} className="bg-slate-100 p-2 rounded-xl border border-slate-200 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span className="font-bold text-slate-800 truncate max-w-[120px]">{file.name}</span>
                  </div>
                  <span className="font-mono text-emerald-600 font-bold shrink-0">{file.progress}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Kanban Board with Drag & Drop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        
        {/* Column: EN ATTENTE */}
        <div className="bg-slate-50/80 rounded-[2rem] p-4 flex flex-col h-[780px] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 px-2 pt-2">
            <h3 className="text-xs font-black text-amber-600 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" /> {t('requests.kanban.pending') || 'EN ATTENTE'}
            </h3>
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black shadow-xs">
              {stats.pending || pendingRequests.length}
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-12 border-2 border-dashed border-slate-200 rounded-2xl p-4">
                <p className="font-semibold">{t('requests.empty_pending') || 'Aucune demande en attente'}</p>
              </div>
            ) : pendingRequests.map(req => (
              <RequestCard 
                t={t} 
                key={req.id} 
                request={req}
                onDragStart={() => setDraggedRequestId(req.id)}
                onPreview={() => setSelectedDoc({url: req.preview_url || req.url || '', title: req.type, person: req.person})}
                onApprove={() => handleUpdateStatus(req.id, 'approved')}
                onReject={() => handleUpdateStatus(req.id, 'rejected')}
              />
            ))}
          </div>
        </div>

        {/* Column: APPROUVÉ (Dropzone) */}
        <div 
          onDragOver={(e) => handleKanbanDragOver(e, 'approved')}
          onDragLeave={handleKanbanDragLeave}
          onDrop={(e) => handleKanbanDrop(e, 'approved')}
          className={cn(
            "rounded-[2rem] p-4 flex flex-col h-[780px] border transition-all duration-200 shadow-sm",
            activeDropColumn === 'approved'
              ? "bg-emerald-50/90 border-emerald-400 ring-4 ring-emerald-200 scale-[1.01]"
              : "bg-slate-50/80 border-slate-200"
          )}
        >
          <div className="flex items-center justify-between mb-4 px-2 pt-2">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {t('requests.kanban.approved') || 'APPROUVÉ'}
            </h3>
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shadow-xs">
              {stats.approved || approvedRequests.length}
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {approvedRequests.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-12 border-2 border-dashed border-slate-200 rounded-2xl p-4">
                <p className="font-semibold">Glissez une demande ici pour l'approuver !</p>
              </div>
            ) : approvedRequests.map(req => (
              <RequestCard 
                t={t} 
                key={req.id} 
                request={req}
                onDragStart={() => setDraggedRequestId(req.id)}
                onPreview={() => setSelectedDoc({url: req.preview_url || req.url || '', title: req.type, person: req.person})}
              />
            ))}
          </div>
        </div>

        {/* Column: REFUSÉ (Dropzone) */}
        <div 
          onDragOver={(e) => handleKanbanDragOver(e, 'rejected')}
          onDragLeave={handleKanbanDragLeave}
          onDrop={(e) => handleKanbanDrop(e, 'rejected')}
          className={cn(
            "rounded-[2rem] p-4 flex flex-col h-[780px] border transition-all duration-200 shadow-sm",
            activeDropColumn === 'rejected'
              ? "bg-red-50/90 border-red-400 ring-4 ring-red-200 scale-[1.01]"
              : "bg-slate-50/80 border-slate-200"
          )}
        >
          <div className="flex items-center justify-between mb-4 px-2 pt-2">
            <h3 className="text-xs font-black text-red-600 uppercase tracking-wider flex items-center gap-2">
              <XCircle className="w-4 h-4" /> {t('requests.kanban.rejected') || 'REFUSÉ'}
            </h3>
            <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-black shadow-xs">
              {stats.rejected || rejectedRequests.length}
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {rejectedRequests.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-12 border-2 border-dashed border-slate-200 rounded-2xl p-4">
                <p className="font-semibold">Glissez une demande ici pour la refuser</p>
              </div>
            ) : rejectedRequests.map(req => (
              <RequestCard 
                t={t} 
                key={req.id} 
                request={req}
                onDragStart={() => setDraggedRequestId(req.id)}
                onPreview={() => setSelectedDoc({url: req.preview_url || req.url || '', title: req.type, person: req.person})}
              />
            ))}
          </div>
        </div>

      </div>

      <DocumentViewerModal 
        isOpen={!!selectedDoc} 
        onClose={() => setSelectedDoc(null)} 
        pdfUrl={selectedDoc?.url || ''} 
        title={selectedDoc?.title || 'Document'} 
        studentName={selectedDoc?.person || 'Étudiant ENCG'}
      />
    </div>
  )
}

function RequestCard({ 
  request, 
  onPreview, 
  onApprove, 
  onReject, 
  onDragStart,
  t 
}: { 
  request: any, 
  onPreview: () => void, 
  onApprove?: () => void, 
  onReject?: () => void,
  onDragStart?: () => void,
  t: (key: string) => string 
}) {
  return (
    <div 
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('requestId', String(request.id))
        if (onDragStart) onDragStart()
      }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col transition-all hover:shadow-md cursor-grab active:cursor-grabbing hover:border-blue-300 relative group"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="px-2.5 py-0.5 bg-[#0f2863] text-amber-300 text-[9px] font-black uppercase tracking-wider rounded-lg shadow-2xs">
          {request.type}
        </span>
        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          ID: #{request.id}
        </span>
      </div>
      
      <div className="mb-3">
        <h4 className="font-extrabold text-slate-900 text-sm leading-tight mb-0.5">{request.person}</h4>
        <p className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">{request.role}</p>
      </div>

      <div className="bg-slate-50 rounded-xl p-2.5 mb-2 border border-slate-100">
        <p className={cn("text-xs font-medium italic", request.status === 'rejected' ? 'text-red-500' : 'text-slate-600')}>
          {request.motif}
        </p>
      </div>

      {/* Email Notification Status Indicator */}
      {request.status !== 'pending' && (
        <div className="mb-3">
          {request.email_sent ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200" title={`Envoyé le ${request.email_sent_at ? new Date(request.email_sent_at).toLocaleTimeString('fr-FR') : ''}`}>
              <Mail className="w-3 h-3 text-emerald-600" /> Notification Email Envoyée ({request.email_recipient || 'Étudiant'})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <Mail className="w-3 h-3 text-amber-600" /> Notification Email Prête / Resend
            </span>
          )}
        </div>
      )}

      <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
        <span className="text-slate-400 uppercase tracking-wider text-[9px]">
          {request.time}
        </span>
        
        {request.status === 'pending' && onApprove && (
          <div className="flex items-center gap-1.5">
            <button 
              onClick={onApprove} 
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-700 transition-colors shadow-2xs"
            >
              <CheckCircle2 className="w-3 h-3" /> {t('requests.actions.approve') || 'Approuver'}
            </button>
            <button 
              onClick={onReject} 
              className="flex items-center gap-1 px-2.5 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg hover:bg-red-600 transition-colors shadow-2xs"
            >
              <XCircle className="w-3 h-3" /> {t('requests.actions.reject') || 'Refuser'}
            </button>
          </div>
        )}

        {(request.status === 'approved' || request.status === 'ready') && (
          <div className="flex items-center gap-2 text-blue-700">
            <button onClick={onPreview} className="flex items-center gap-1 hover:text-blue-900 transition-colors bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
              <Eye className="w-3 h-3" /> {t('requests.actions.preview') || 'Aperçu'}
            </button>
            <a href={request.url} download className="flex items-center gap-1 hover:text-blue-900 transition-colors bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
              <Download className="w-3 h-3" /> {t('requests.actions.download') || 'Télécharger'}
            </a>
          </div>
        )}

        {request.status === 'rejected' && request.reason && (
          <span className="text-red-500 font-extrabold text-[9px] uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded border border-red-200">
            {request.reason}
          </span>
        )}
      </div>
    </div>
  )
}
