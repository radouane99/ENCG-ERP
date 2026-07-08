import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, Download, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import DocumentViewerModal from '@shared/components/ui/DocumentViewerModal'
import api from '@shared/lib/api'
import { toast } from 'sonner'

export default function AdminRequestsPage() {
  const { t, i18n } = useTranslation('admin')
  const isRtl = i18n.language === 'ar'

  const [selectedDoc, setSelectedDoc] = useState<{url: string, title: string} | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/document-requests')
      setRequests(res.data.data)
      setStats(res.data.stats || {})
    } catch (error) {
      console.error('Failed to fetch document requests:', error)
      // Fallback: keep requests empty for display
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [])

  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
    let rejection_reason: string | undefined
    if (status === 'rejected') {
      rejection_reason = prompt(t('requests.messages.rejection_prompt')) || undefined
    }
    try {
      await api.patch(`/admin/document-requests/${id}/status`, { status, rejection_reason })
      toast.success(status === 'approved' ? t('requests.messages.approve_success') : t('requests.messages.reject_success'))
      fetchRequests()
    } catch { toast.error(t('requests.messages.error')) }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const approvedRequests = requests.filter(r => r.status === 'approved')
  const rejectedRequests = requests.filter(r => r.status === 'rejected')

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex justify-center mb-8">
        <h1 className="text-2xl font-bold text-[#0f2863] italic">{t('requests.title')}</h1>
      </div>

      {/* Banner */}
      <div className="bg-[#0f2863] p-8 text-white rounded-[1.5rem] shadow-lg relative overflow-hidden max-w-5xl mx-auto mb-12">
        <h2 className="text-2xl font-bold italic mb-2 relative z-10">{t('requests.subtitle')}</h2>
        <p className="text-white/80 text-sm font-medium relative z-10">{t('requests.description')}</p>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        
        {/* Column: EN ATTENTE */}
        <div className="bg-slate-50/50 rounded-[2rem] p-4 flex flex-col h-[800px] overflow-y-auto border border-slate-100">
          <div className="flex items-center justify-between mb-6 px-2 pt-2">
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">{t('requests.kanban.pending')}</h3>
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold shadow-sm">
              {stats.pending || pendingRequests.length}
            </span>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
            ) : pendingRequests.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">{t('requests.empty_pending')}</p>
            ) : pendingRequests.map(req => (
              <RequestCard t={t} key={req.id} request={req}
                onPreview={() => setSelectedDoc({url: req.preview_url || req.url || '', title: req.type})}
                onApprove={() => handleUpdateStatus(req.id, 'approved')}
                onReject={() => handleUpdateStatus(req.id, 'rejected')}
              />
            ))}
          </div>
        </div>

        {/* Column: APPROUVÉ */}
        <div className="bg-slate-50/50 rounded-[2rem] p-4 flex flex-col h-[800px] overflow-y-auto border border-slate-100">
          <div className="flex items-center justify-between mb-6 px-2 pt-2">
            <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-2">{t('requests.kanban.approved')}</h3>
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shadow-sm">
              {stats.approved || approvedRequests.length}
            </span>
          </div>
          <div className="space-y-4">
            {approvedRequests.map(req => (
              <RequestCard t={t} key={req.id} request={req}
                onPreview={() => setSelectedDoc({url: req.preview_url || req.url || '', title: req.type})}
              />
            ))}
          </div>
        </div>

        {/* Column: REFUSÉ */}
        <div className="bg-slate-50/50 rounded-[2rem] p-4 flex flex-col h-[800px] overflow-y-auto border border-slate-100">
          <div className="flex items-center justify-between mb-6 px-2 pt-2">
            <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">{t('requests.kanban.rejected')}</h3>
            <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold shadow-sm">
              {stats.rejected || rejectedRequests.length}
            </span>
          </div>
          <div className="space-y-4">
            {rejectedRequests.map(req => (
              <RequestCard t={t} key={req.id} request={req} onPreview={() => {}} />
            ))}
          </div>
        </div>

      </div>

      <DocumentViewerModal 
        isOpen={!!selectedDoc} 
        onClose={() => setSelectedDoc(null)} 
        pdfUrl={selectedDoc?.url || ''} 
        title={selectedDoc?.title || 'Document'} 
      />
    </div>
  )
}

function RequestCard({ request, onPreview, onApprove, onReject, t }: { request: any, onPreview: () => void, onApprove?: () => void, onReject?: () => void, t: any }) {: { request: any, onPreview: () => void, onApprove?: () => void, onReject?: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col transition-all hover:shadow-md cursor-grab active:cursor-grabbing">
      <div className="flex items-start justify-between mb-4">
        <span className="px-3 py-1 bg-[#1a4b9c] text-white text-[9px] font-bold uppercase tracking-wider rounded-md">
          {request.type}
        </span>
        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      </div>
      
      <div className="mb-4">
        <h4 className="font-bold text-slate-800 text-sm mb-0.5">{request.person}</h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{request.role}</p>
      </div>

      <div className="bg-slate-50 rounded-xl p-3 mb-4">
        <p className={cn("text-xs font-medium italic", request.status === 'rejected' ? 'text-red-500' : 'text-slate-500')}>
          {request.motif}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between text-[10px] font-bold">
        <span className="text-slate-400 uppercase tracking-wider">
          {request.time}
        </span>
        
        {request.status === 'pending' && onApprove && (
          <div className="flex items-center gap-2 mt-2">
            <button onClick={onApprove} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('requests.actions.approve')}</button>
            <button onClick={onReject} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition-colors">
              <XCircle className="w-3.5 h-3.5" /> {t('requests.actions.reject')}</button>
          </div>
        )}

        {request.status === 'approved' && (
          <div className="flex items-center gap-3 text-blue-600">
            <button onClick={onPreview} className="flex items-center gap-1 hover:text-blue-800 transition-colors">
              <Eye className="w-3.5 h-3.5" /> {t('requests.actions.preview')}</button>
            <a href={request.url} download className="flex items-center gap-1 hover:text-blue-800 transition-colors">
              <Download className="w-3.5 h-3.5" /> {t('requests.actions.download')}</a>
          </div>
        )}

        {request.status === 'rejected' && request.reason && (
          <span className="text-red-500 uppercase tracking-wider">
            {request.reason}
          </span>
        )}
      </div>
    </div>
  )
}
