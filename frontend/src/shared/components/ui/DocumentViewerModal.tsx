import { X, Download, Printer } from 'lucide-react'

interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string
  title?: string
}

export default function DocumentViewerModal({ isOpen, onClose, pdfUrl, title = 'Document Administratif' }: DocumentViewerModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4 sm:p-6 md:p-8">
      <div className="bg-slate-100 w-full max-w-5xl h-full flex flex-col rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{title}</h2>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Aperçu du document PDF généré</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <a 
              href={pdfUrl} 
              download 
              className="flex items-center gap-2 px-4 py-2 bg-[#0f2863] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#1a387e] transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </a>
            <button 
              onClick={() => {
                const iframe = document.getElementById('pdf-iframe') as HTMLIFrameElement;
                iframe?.contentWindow?.print();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Content */}
        <div className="flex-1 bg-slate-200/50 p-4 md:p-8 overflow-hidden relative">
          <iframe 
            id="pdf-iframe"
            src={pdfUrl} 
            className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-200"
            title="PDF Document Viewer"
          >
            <p className="text-center mt-10">Votre navigateur ne supporte pas les iframes ou le lecteur PDF.</p>
          </iframe>
        </div>

      </div>
    </div>
  )
}
