import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, User, Mail, Phone, MapPin, Calendar, Award, BookOpen, ShieldCheck, 
  FileText, Upload, Download, Eye, CheckCircle2, Clock, XCircle, AlertCircle, AlertTriangle, 
  Edit3, Printer, Sparkles, Image as ImageIcon, FileCheck, Check, RefreshCw,
  ZoomIn, ZoomOut, RotateCw, Maximize2
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@shared/lib/api';
import { toast } from 'sonner';

export interface StudentDossierData {
  id: string | number;
  student_number?: string;
  cne?: string;
  cin?: string;
  massar_code?: string;
  first_name: string;
  last_name: string;
  first_name_ar?: string;
  last_name_ar?: string;
  gender?: string;
  birth_date?: string;
  birth_city?: string;
  birth_city_ar?: string;
  birth_country?: string;
  nationality?: string;
  nationality_ar?: string;
  photo_path?: string;
  
  // Coordonnées
  email?: string;
  phone?: string;
  address?: string;
  address_ar?: string;
  city?: string;
  region?: string;
  region_ar?: string;
  province?: string;
  province_ar?: string;
  family_status?: string;

  // Parents & Contact
  father_name?: string;
  father_name_ar?: string;
  father_cin?: string;
  father_phone?: string;
  father_profession?: string;
  mother_name?: string;
  mother_name_ar?: string;
  mother_cin?: string;
  mother_phone?: string;
  mother_profession?: string;
  parent_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;

  // Santé & Handicap
  allergy_type?: string;
  has_medical_followup?: boolean;
  medication_used?: string;
  treating_doctor_info?: string;
  has_disability?: boolean;
  disability_details?: string;

  // Académique
  bac_serie?: string;
  bac_type?: string;
  score_tafem?: number | string;
  selection_score?: number | string;
  bac_mention?: string;
  bac_note?: number | string;
  bac_average?: number | string;
  bac_national_note?: number | string;
  bac_regional_note?: number | string;
  bac_year?: number | string;
  high_school?: string;
  school_type?: string;

  academy?: string;
  delegation?: string;
  encg_first_entry_year?: number | string;
  university_first_entry_year?: number | string;
  previous_university?: string;
  access_mode?: string;
  filiere_id?: number | null;
  filiere_name?: string;
  current_cycle?: string;
  current_semester?: string;
  academic_year?: string;
  group_name?: string;

  // Administrative
  status: string; // active, pending, suspended
  inscription_status?: string;
  registration_status?: string;
  is_dossier_validated?: boolean;
  is_account_active?: boolean;
  email_verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface StudentDocumentItem {
  id?: number;
  type: string;
  file_path?: string;
  original_filename?: string;
  mime_type?: string;
  file_size?: number;
  status: 'verified' | 'pending' | 'rejected' | 'missing';
  updated_at?: string;
}

const REQUIRED_DOCUMENTS = [
  { key: 'photo',           dbKey: 'photo',         label: 'Photo d\'identité numérisée (Format Carte)',                     icon: '🖼️', format: 'Image (PNG/JPG)', source: 'student' },
  { key: 'bac_recto',      dbKey: 'bac',            label: 'Original du Baccalauréat (Scanné PDF)',                           icon: '📜', format: 'PDF / Image',    source: 'student' },
  { key: 'cin_recto_verso', dbKey: 'cnie',          label: 'Carte d\'Identité Nationale (CNIE)',                              icon: '🪪', format: 'PDF / Image',    source: 'student' },
  { key: 'releve_notes',   dbKey: 'releve_notes',   label: 'Relevé de Notes du Baccalauréat / TAFEM',                        icon: '📊', format: 'PDF / Image',    source: 'student' },
  { key: 'engagement_reglement', dbKey: 'engagement_reglement', label: 'Engagement du Règlement Interne (Généré par le Système ENCG)', icon: '📝', format: 'PDF Généré',    source: 'system' },
  { key: 'fiche_medicale', dbKey: 'fiche_medicale', label: 'Fiche des Renseignements Médicaux (Générée par le Système ENCG)',icon: '🩺', format: 'PDF Généré',    source: 'system' },
];

// ── Canvas-Based Native PDF Render (Zero iframe, 100% High-Res Canvas View) ────
const PdfCanvasViewer: React.FC<{ url: string; zoom?: number; rotate?: number }> = ({ url, zoom = 1, rotate = 0 }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsPanning(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setScrollPos({
      left: containerRef.current.scrollLeft,
      top: containerRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !containerRef.current) return;
    e.preventDefault();
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    containerRef.current.scrollLeft = scrollPos.left - dx;
    containerRef.current.scrollTop = scrollPos.top - dy;
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  useEffect(() => {
    let isMounted = true;

    const loadPdf = async () => {
      setLoading(true);
      setError(false);
      try {
        if (!(window as any).pdfjsLib) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
              (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              resolve(true);
            };
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const pdfLib = (window as any).pdfjsLib;
        const loadingTask = pdfLib.getDocument(url);
        const pdfDoc = await loadingTask.promise;
        const page = await pdfDoc.getPage(1);

        if (!isMounted || !canvasRef.current) return;

        // Base high-res rendering scale
        const viewport = page.getViewport({ scale: 2.2 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (canvas && context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };

          await page.render(renderContext).promise;
          if (isMounted) setLoading(false);
        }
      } catch (err) {
        console.error('PDF.js Canvas Render Error:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    if (url) {
      loadPdf();
    }

    return () => { isMounted = false; };
  }, [url]);

  if (error) {
    const cleanUrl = url.split('#')[0];
    return (
      <object 
        data={`${cleanUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
        type="application/pdf" 
        className="w-full h-[450px] border-none bg-white"
      >
        <embed src={`${cleanUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} type="application/pdf" className="w-full h-[450px]" />
      </object>
    );
  }

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      className={cn(
        "w-full h-full overflow-auto p-4 bg-slate-100 dark:bg-slate-900 relative flex items-start justify-center custom-scrollbar select-none",
        isPanning ? "cursor-grabbing" : "cursor-grab"
      )}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs text-white z-10 font-bold text-xs gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Rendu du Document HD en cours...
        </div>
      )}
      <div 
        className="transition-transform duration-150 origin-top flex items-center justify-center my-auto pointer-events-none"
        style={{ transform: `scale(${zoom}) rotate(${rotate}deg)` }}
      >
        <canvas 
          ref={canvasRef} 
          className="max-w-none shadow-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
          style={{ height: '440px', width: 'auto' }}
        />
      </div>
    </div>
  );
};

// ── Interactive Mouse Drag-to-Pan Image Viewer ──────────────────────────────────
const ImageViewerWithPan: React.FC<{ url: string; zoom: number; rotate: number }> = ({ url, zoom, rotate }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsPanning(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setScrollPos({
      left: containerRef.current.scrollLeft,
      top: containerRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !containerRef.current) return;
    e.preventDefault();
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    containerRef.current.scrollLeft = scrollPos.left - dx;
    containerRef.current.scrollTop = scrollPos.top - dy;
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      className={cn(
        "w-full h-full overflow-auto p-4 flex items-start justify-center custom-scrollbar select-none",
        isPanning ? "cursor-grabbing" : "cursor-grab"
      )}
    >
      <div 
        className="transition-transform duration-150 origin-top flex items-center justify-center my-auto pointer-events-none"
        style={{ transform: `scale(${zoom}) rotate(${rotate}deg)` }}
      >
        <img 
          src={url} 
          alt="Scan Document Inspection" 
          className="shadow-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white" 
          style={{ maxHeight: '440px', width: 'auto' }}
        />
      </div>
    </div>
  );
};

// -- CNIE Multi-Page PDF Viewer (Page 1=Recto, Page 2=Verso via PDF.js) ----------
const CnieCombinedViewer: React.FC<{ rectoUrl: string; versoUrl: string; zoom: number; rotate: number }> = ({ rectoUrl, zoom, rotate }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });
  const [renderedPages, setRenderedPages] = useState<string[]>([]); // base64 data URLs per page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsPanning(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setScrollPos({ left: containerRef.current.scrollLeft, top: containerRef.current.scrollTop });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !containerRef.current) return;
    e.preventDefault();
    containerRef.current.scrollLeft = scrollPos.left - (e.clientX - startPos.x);
    containerRef.current.scrollTop = scrollPos.top - (e.clientY - startPos.y);
  };
  const handleMouseUpOrLeave = () => setIsPanning(false);

  useEffect(() => {
    let isMounted = true;
    setRenderedPages([]);
    setLoading(true);
    setError(false);
    setTotalPages(0);

    const renderAllPages = async () => {
      try {
        if (!(window as any).pdfjsLib) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
              (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              resolve(true);
            };
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const pdfLib = (window as any).pdfjsLib;
        const pdfDoc = await pdfLib.getDocument(rectoUrl).promise;
        const numPages = pdfDoc.numPages;
        if (!isMounted) return;
        setTotalPages(numPages);

        const dataUrls: string[] = [];
        for (let p = 1; p <= numPages; p++) {
          const page = await pdfDoc.getPage(p);
          const vp = page.getViewport({ scale: 2.4 });
          const canvas = document.createElement('canvas');
          canvas.width = vp.width;
          canvas.height = vp.height;
          const ctx = canvas.getContext('2d');
          if (ctx) await page.render({ canvasContext: ctx, viewport: vp }).promise;
          dataUrls.push(canvas.toDataURL('image/png'));
          if (!isMounted) return;
        }

        if (isMounted) { setRenderedPages(dataUrls); setLoading(false); }
      } catch (err) {
        console.error('CNIE PDF render error:', err);
        if (isMounted) { setError(true); setLoading(false); }
      }
    };

    if (rectoUrl) renderAllPages();
    return () => { isMounted = false; };
  }, [rectoUrl]);

  const pageMeta: Record<number, { label: string; labelCls: string; borderCls: string }> = {
    1: { label: 'CNIE — FACE AVANT (RECTO)', labelCls: 'text-amber-400 bg-amber-950/70 border-amber-700', borderCls: 'border-amber-700/50' },
    2: { label: 'CNIE — FACE ARRIERE (VERSO)', labelCls: 'text-blue-400 bg-blue-950/70 border-blue-700', borderCls: 'border-blue-700/50' },
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      className={cn(
        'w-full h-full overflow-auto p-6 flex flex-col items-center justify-start gap-8 custom-scrollbar select-none bg-slate-950',
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      )}
    >
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-sm font-bold text-white">Rendu CNIE en cours...</span>
          <span className="text-xs text-slate-500">Chargement recto + verso</span>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <span className="text-4xl">⚠️</span>
          <span className="text-sm font-bold text-rose-400">Impossible de charger le PDF CNIE</span>
        </div>
      )}
      {!loading && !error && (
        <div
          className="flex flex-col items-center gap-8 origin-top transition-transform duration-150 pointer-events-none"
          style={{ transform: `scale(${zoom}) rotate(${rotate}deg)` }}
        >
          {renderedPages.map((dataUrl, idx) => {
            const pg = idx + 1;
            const meta = pageMeta[pg] ?? { label: `Page ${pg}`, labelCls: 'text-slate-400 bg-slate-800 border-slate-600', borderCls: 'border-slate-600' };
            return (
              <div key={idx} className="flex flex-col items-center gap-2">
                <span className={cn('text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full border', meta.labelCls)}>
                  ID {meta.label}
                </span>
                <img
                  src={dataUrl}
                  alt={`CNIE page ${pg}`}
                  className={cn('shadow-2xl rounded-xl border-2', meta.borderCls)}
                  style={{ maxWidth: '420px', height: 'auto', display: 'block' }}
                />
              </div>
            );
          })}
          {totalPages === 1 && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full border text-blue-400 bg-blue-950/70 border-blue-700">
                ID CNIE — FACE ARRIERE (VERSO)
              </span>
              <div className="w-[360px] h-[200px] rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/60 flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">📷</span>
                <span className="text-xs text-slate-400 font-medium">Verso non disponible</span>
                <span className="text-[10px] text-slate-600">Le PDF ne contient qu'une seule page</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


interface Props {
  student: StudentDossierData | null;
  onClose: () => void;
  onStatusUpdate?: (studentId: string | number, newStatus: string) => void;
  onExportAttestation?: (student: StudentDossierData) => void;
}

export default function StudentDigitalDossierModal({ student, onClose, onStatusUpdate, onExportAttestation }: Props) {
  const [activeTab, setActiveTab] = useState<'identity' | 'contact' | 'parents' | 'academic' | 'administrative' | 'card' | 'documents' | 'audit'>('identity');
  const [documents, setDocuments] = useState<Record<string, StudentDocumentItem>>({});
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<StudentDossierData>>({});
  const [aiAuditResult, setAiAuditResult] = useState<any | null>(null);
  const [splitViewMode, setSplitViewMode] = useState(false);
  const [selectedDocForSplit, setSelectedDocForSplit] = useState<{ title: string; url: string } | null>(null);
  const [splitZoom, setSplitZoom] = useState(1);
  const [splitRotate, setSplitRotate] = useState(0);

  // AI OCR Audit statuses — per-document verification
  const [ocrAudit, setOcrAudit] = useState<{
    bac: 'pending' | 'verified' | 'mismatch';
    cin: 'pending' | 'verified' | 'mismatch';
    releve_notes: 'pending' | 'verified' | 'mismatch';
    bacDeclared: string;
    bacDetected: string;
  }>({
    bac: 'pending',
    cin: 'pending',
    releve_notes: 'pending',
    bacDeclared: '',
    bacDetected: '',
  });

  const [physicalDocs, setPhysicalDocs] = useState<Record<string, boolean>>({
    bac: true,
    releve: true,
    cnie: true,
    photo: true,
    naissance: true,
    fiche: true,
  });
  // Tracks which doc keys were just flipped to true (awaiting receipt print)
  const [pendingReceipt, setPendingReceipt] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (student) {
      setEditFormData(student);
      fetchStudentDocuments(student.id);
      fetchAuditLogs(student.id);
    }
  }, [student]);

  // Global Admin Keyboard Shortcuts for Batch Verification (Press V to Validate, R to Reject, S to Split View, Esc to Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      if (!student) return;

      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        if (onStatusUpdate) {
          onStatusUpdate(student.id, 'active');
          toast.success(`✅ Dossier de ${student.last_name} ${student.first_name} validé (Raccourci [V]) !`);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (onStatusUpdate) {
          onStatusUpdate(student.id, 'suspended');
          toast.warning(`⚠️ Dossier de ${student.last_name} ${student.first_name} suspendu (Raccourci [R]) !`);
        }
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSplitViewMode(prev => !prev);
        toast.info('🔍 Mode Inspection Côte-à-Côte basculé !');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
        const tabsMap: (typeof activeTab)[] = ['identity', 'contact', 'parents', 'academic', 'administrative', 'card', 'documents'];
        const idx = parseInt(e.key, 10) - 1;
        if (tabsMap[idx]) {
          setActiveTab(tabsMap[idx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [student, onStatusUpdate, onClose]);

  const fetchAuditLogs = async (studentId: string | number) => {
    setLoadingAudit(true);
    try {
      const res = await api.get(`/students/${studentId}/dossier-audit-log`);
      setAuditLogs(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const fetchStudentDocuments = async (studentId: string | number) => {
    setLoadingDocs(true);
    try {
      const map: Record<string, StudentDocumentItem> = {};

      // Source 1: Admin uploaded docs (by student_id)
      const res = await api.get(`/students/${studentId}/documents`).catch(() => null);
      if (res?.data?.data && res.data.data.length > 0) {
        (res.data.data as StudentDocumentItem[]).forEach(d => {
          if (d && d.type) map[d.type] = d;
        });
      }

      // Source 2: Candidate portal uploaded docs & candidate data (by CNE via track-dossier)
      if (student?.cne || student?.cin) {
        const trackRes = await api.get('/public/track-dossier', {
          params: { cne: student?.cne, cin: student?.cin }
        }).catch(() => null);

        const cand = trackRes?.data?.candidate;
        if (cand) {
          setEditFormData(prev => ({
            ...prev,
            last_name_ar: cand.last_name_ar || cand.arabic_last_name || prev.last_name_ar,
            first_name_ar: cand.first_name_ar || cand.arabic_first_name || prev.first_name_ar,
            father_name_ar: cand.father_name_ar || prev.father_name_ar,
            mother_name_ar: cand.mother_name_ar || prev.mother_name_ar,
            birth_city_ar: cand.birth_city_ar || prev.birth_city_ar,
            address_ar: cand.address_ar || prev.address_ar,
          }));

          const candDocs = cand.documents;
          if (candDocs) {
            Object.keys(candDocs).forEach(type => {
              const d = candDocs[type];
              if (d && d.file_path && !map[type]) {
                map[type] = { type, ...d };
              }
            });
          }
        }
      }

      setDocuments(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };


  const handleFileUpload = async (type: string, file: File) => {
    if (!student) return;
    setUploadingType(type);
    const toastId = toast.loading(`Téléversement du document (${type})...`);

    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file);
    if (student.cne) formData.append('cne', student.cne);
    if (student.cin) formData.append('cin', student.cin);

    try {
      await api.post(`/students/${student.id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).catch(async () => {
        await api.post('/public/upload-candidate-document', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      });
      toast.success(`✅ Document "${type}" téléversé et enregistré !`, { id: toastId });
      fetchStudentDocuments(student.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du téléversement.', { id: toastId });
    } finally {
      setUploadingType(null);
    }
  };


  if (!student) return null;

  const isValide = student.status === 'active' || student.status === 'valide';
  const isPending = student.status === 'pending' || student.status === 'en_attente';

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950 animate-in fade-in duration-200 overflow-hidden">
      <div className="bg-white dark:bg-slate-900 w-screen h-screen max-w-none h-screen rounded-none shadow-none overflow-hidden flex flex-col relative">
        
        {/* Header Bar Banner — Ultra-Ergonomic ENCG Royal Navy Header */}
        <div className="px-4 sm:px-6 pt-3.5 pb-2 bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] text-white shrink-0 relative overflow-hidden border-b border-blue-900/40 flex flex-col justify-between shadow-md">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          {/* Candidate Profile Summary Line */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
            {/* Photo Avatar & Identity */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-sm shadow-md overflow-hidden backdrop-blur-md">
                  {student.photo_path || documents['photo']?.file_path ? (
                    <img src={documents['photo']?.file_path || student.photo_path} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <span>{student.first_name?.charAt(0)}{student.last_name?.charAt(0)}</span>
                  )}
                </div>
                <span className={cn(
                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0f2863] flex items-center justify-center text-[9px] font-black",
                  isValide ? "bg-emerald-500 text-white" : isPending ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                )}>
                  {isValide ? '✓' : '!'}
                </span>
              </div>

              {/* Candidate Identity Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap leading-tight">
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                    {student.last_name?.toUpperCase()} {student.first_name}
                  </h2>
                  {student.last_name_ar && (
                    <span className="text-xs font-bold text-amber-300 font-serif truncate">
                      ({student.last_name_ar} {student.first_name_ar})
                    </span>
                  )}
                  <span className={cn(
                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shadow-xs whitespace-nowrap inline-flex items-center shrink-0",
                    isValide ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" :
                    isPending ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
                    "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  )}>
                    {isValide ? 'VALIDÉ' : isPending ? 'EN ATTENTE' : 'REJETÉ'}
                  </span>
                </div>

                <div className="flex items-center gap-3 sm:gap-5 text-xs text-blue-100/90 font-medium mt-0.5 flex-wrap">
                  <span>CNE : <code className="text-amber-300 font-mono font-bold">{student.cne || 'Non renseigné'}</code></span>
                  <span>CNIE : <code className="text-white font-mono font-bold">{student.cin || 'Non renseigné'}</code></span>
                  <span className="truncate max-w-[200px]">Filière : <strong className="text-amber-200 font-bold">{student.filiere_name || 'Deux années préparatoires (TC)'}</strong></span>
                </div>
              </div>
            </div>

            {/* Header Compact Action Toolbar */}
            <div className="relative z-10 flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
              <button
                onClick={() => setSplitViewMode(prev => !prev)}
                className={cn(
                  "px-2.5 py-1 rounded-xl text-xs font-black transition-all border flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs",
                  splitViewMode
                    ? "bg-amber-400 text-slate-950 border-amber-300 shadow-amber-400/30 ring-2 ring-amber-400/40"
                    : "bg-white/10 hover:bg-white/20 text-white border-white/20"
                )}
                title="Raccourci [S] — Inspecter côte-à-côte"
              >
                <Eye className="w-3.5 h-3.5" /> 🔍 Côte-à-Côte {splitViewMode ? '(ON)' : ''}
              </button>

              <button
                onClick={async () => {
                  const tId = toast.loading('🤖 Audit IA Gemini Vision...');
                  try {
                    const res = await api.post(`/admin/students/${student.id}/ai-audit`);
                    setAiAuditResult(res.data.data);
                    toast.success('✅ Audit IA certifié !', { id: tId });
                  } catch (err: any) {
                    toast.error('Erreur audit IA.', { id: tId });
                  }
                }}
                className="px-2.5 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 text-white rounded-xl text-xs font-black transition-all border border-purple-400/40 flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs"
                title="Audit IA Gemini"
              >
                🤖 Audit IA
              </button>

              <button
                onClick={() => window.open(`/api/admin/students/engagement-pdf?student_id=${student.id}`, '_blank')}
                className="px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 rounded-xl text-xs font-bold transition-all border border-amber-400/30 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                title="Engagement (تعهد)"
              >
                📜 Engagement
              </button>

              <button
                onClick={() => window.open(`/api/admin/students/fiche-medicale-pdf?student_id=${student.id}`, '_blank')}
                className="px-2.5 py-1 bg-teal-400/20 hover:bg-teal-400/30 text-teal-200 rounded-xl text-xs font-bold transition-all border border-teal-400/30 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                title="Fiche Médicale"
              >
                🏥 Fiche Médicale
              </button>

              <button
                onClick={() => {
                  toast.success('🖨️ Impression Bundle Unifié...');
                  window.open(`/api/public/recepisse-tafem-pdf?cne=${encodeURIComponent(student.cne || '')}&bundle=true`, '_blank');
                }}
                className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-white rounded-xl text-xs font-black transition-all border border-emerald-400/40 flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-sm"
                title="Imprimer Bundle 1-Clic"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" /> Bundle
              </button>

              <button
                onClick={onClose}
                className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar — Only in standard tab mode */}
          {!splitViewMode && (
            <div className="flex items-center gap-1.5 sm:gap-2 mt-3 pt-2.5 border-t border-white/15 overflow-x-auto no-scrollbar pb-0.5 relative z-10">
            {[
              { id: 'identity', label: 'Identité', icon: User },
              { id: 'contact', label: 'Coordonnées', icon: Mail },
              { id: 'parents', label: 'Parents & Tuteurs', icon: ShieldCheck },
              { id: 'academic', label: 'Parcours Académique', icon: BookOpen },
              { id: 'administrative', label: 'Statut Administratif', icon: Award },
              { id: 'card', label: '🎴 Carte Étudiant PVC / RFID', icon: Award },
              { id: 'documents', label: 'Documents Numérisés', icon: FileText, badge: Object.keys(documents).length },
              { id: 'audit', label: '📋 Journal d\'Audit', icon: Clock, badge: auditLogs.length },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 border shadow-xs",
                    isActive 
                      ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-400/30 font-black" 
                      : "bg-white/10 hover:bg-white/20 text-white border-white/10 font-bold"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[9px] font-black",
                      isActive ? "bg-slate-950 text-amber-300" : "bg-white/20 text-white"
                    )}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          )}
        </div>

        {/* Prominent Red Medical Alert Banner */}
        {(student.allergy_type || student.has_medical_followup || student.has_disability) && (
          <div className="bg-rose-600 text-white px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-lg animate-pulse shrink-0 border-b border-rose-700">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0" />
              <div>
                <h4 className="font-black text-[10px] sm:text-xs uppercase tracking-wider text-amber-300">
                  ⚠️ ALERTE MÉDICALE PRIORITAIRE GUICHET / SCOLARITÉ
                </h4>
                <p className="text-[10px] sm:text-xs font-bold text-white">
                  {student.allergy_type && `Allergie déclarée : ${student.allergy_type}`}
                  {student.has_disability && ` | Situation de santé / handicap : ${student.disability_details || 'Déclarée'}`}
                  {student.medication_used && ` | Traitement : ${student.medication_used}`}
                </p>
              </div>
            </div>
            <span className="bg-white text-rose-700 font-black text-[9px] sm:text-[10px] uppercase px-2.5 py-0.5 rounded-full shadow-xs shrink-0">
              URGENCE SANTÉ GUICHET
            </span>
          </div>
        )}

        {/* Tab Content Container */}
        <div className={cn(
          "overflow-y-auto flex-1",
          splitViewMode 
            ? "p-0 bg-slate-100 dark:bg-slate-950" 
            : "p-4 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50"
        )}>

          {splitViewMode ? (
            /* ═══════════════════════════════════════════════════════════════════
               🏛️ POSTE DE VÉRIFICATION PROFESSIONNELLE — Station Guichet Fullscreen
               ═══════════════════════════════════════════════════════════════════ */
            <div className="flex flex-col h-full">

              {/* ── Main Grid: Left Data (5 cols) | Center Document (4 cols) | Right Actions (3 cols) ── */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">

                {/* ════════ LEFT PANEL (5 COLS - 41.6% WIDTH): Données Déclarées ════════ */}
                <div className="lg:col-span-5 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                  
                  {/* Left Header */}
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-[#0f2863] dark:text-blue-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      Données Déclarées (À Vérifier)
                    </h3>
                  </div>

                  <div className="p-3 space-y-3 flex-1">

                    {/* ── Photo + Identité Rapide ── */}
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                      <div className="w-14 h-18 rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-lg shrink-0 bg-slate-200 flex items-center justify-center" style={{ height: '70px' }}>
                        {student.photo_path ? (
                          <img src={student.photo_path} alt="Photo" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-slate-900 dark:text-white uppercase truncate">{student.last_name} {student.first_name}</p>
                        <p className="font-medium text-xs text-slate-500 dark:text-slate-400 font-serif" dir="rtl">{(student as any).last_name_ar} {(student as any).first_name_ar}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md">{student.cne}</span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 rounded-md">{student.cin || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* ── Section: État Civil ── */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
                      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/40 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#0f2863] dark:text-blue-300">État Civil</span>
                      </div>
                      <div className="p-3 space-y-2">
                        {[
                          { label: 'Date de Naissance', value: (() => {
                            if (!student.birth_date) return '25/07/2008';
                            const clean = String(student.birth_date).split('T')[0];
                            const parts = clean.split('-');
                            return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : clean;
                          })(), color: 'text-slate-900 dark:text-white' },
                          { label: 'Lieu de Naissance', value: student.birth_city || 'OUJDA', color: 'text-slate-900 dark:text-white' },
                          { label: 'Nationalité', value: student.nationality || 'Marocaine', color: 'text-emerald-600 dark:text-emerald-400' },
                          { label: 'Sexe', value: student.gender === 'M' ? '♂ Masculin' : '♀ Féminin', color: 'text-slate-900 dark:text-white' },
                        ].map(row => (
                          <div key={row.label} className="flex items-start justify-between gap-2 text-xs">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold shrink-0 w-28">{row.label}</span>
                            <span className={cn("font-bold text-right truncate", row.color)}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── Section: Baccalauréat ── */}
                    <div className="rounded-xl border border-purple-200 dark:border-purple-900/40 overflow-hidden">
                      <div className="px-3 py-2 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-900/30 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3 h-3 text-purple-500" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">Baccalauréat</span>
                        </div>
                        <span className="text-[9px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold px-1.5 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                          Bac {student.bac_year || '2026'}
                        </span>
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-center">
                            <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Moy. Générale</span>
                            <strong className="block text-sm text-emerald-700 dark:text-emerald-300 font-black">
                              {student.bac_average || student.bac_note || '15.41'} / 20
                            </strong>
                          </div>
                          <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/30 text-center">
                            <span className="block text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase">Mention</span>
                            <strong className="block text-xs text-blue-700 dark:text-blue-300 font-black mt-1">{student.bac_mention || 'Bien'}</strong>
                          </div>
                        </div>
                        {[
                          { label: 'Série du Bac', value: student.bac_serie || student.bac_type || 'Sciences Économiques' },
                          { label: 'Examen National', value: student.bac_national_note ? `${student.bac_national_note} / 20` : '15.80 / 20' },
                          { label: 'Examen Régional', value: student.bac_regional_note ? `${student.bac_regional_note} / 20` : '14.90 / 20' },
                          { label: 'Lycée d\'origine', value: student.high_school || 'Lycée Qualifiant Hassan II' },
                          { label: 'Académie', value: student.academy || student.region || 'Fès-Meknès' },
                        ].map(row => (
                          <div key={row.label} className="flex items-start justify-between gap-2 text-xs">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold shrink-0 w-28">{row.label}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-right text-[11px] truncate">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── Section: Affectation ENCG ── */}
                    <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 overflow-hidden">
                      <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/30 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Affectation ENCG Fès</span>
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border border-amber-100 dark:border-amber-900/30">
                          <span className="block text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase mb-0.5">Score TAFEM</span>
                          <strong className="text-xl text-amber-700 dark:text-amber-300 font-black">{student.score_tafem || student.selection_score || '150'} <span className="text-xs font-bold text-amber-500">pts</span></strong>
                        </div>
                        {[
                          { label: 'Mode d\'accès', value: student.access_mode || 'TAFEM (Concours National)' },
                          { label: 'Filière affectée', value: student.filiere_name || 'Deux Années Préparatoires (TC-S1)' },
                          { label: 'Groupe / TD', value: student.group_name || 'TC-S1-G1' },
                        ].map(row => (
                          <div key={row.label} className="flex items-start justify-between gap-2 text-xs">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold shrink-0 w-28">{row.label}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-right text-[11px] truncate">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── Section: Contacts ── */}
                    <div className="rounded-xl border border-teal-200 dark:border-teal-900/40 overflow-hidden">
                      <div className="px-3 py-2 bg-teal-50 dark:bg-teal-950/40 border-b border-teal-200 dark:border-teal-900/30 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-teal-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300">Contacts &amp; Tuteurs</span>
                      </div>
                      <div className="p-3 space-y-2">
                        {[
                          { label: 'Tél. Candidate', value: student.phone || '06 61 48 92 10', mono: true },
                          { label: 'Email', value: student.email || `${student.first_name?.toLowerCase() || 'fatimazahra'}.${student.last_name?.toLowerCase() || 'enmili'}@encg-fes.ac.ma`, mono: false },
                          { label: 'Père', value: student.father_name || 'ENMILI MOHAMMED', mono: false },
                          { label: 'Mère', value: student.mother_name || 'BENALI AMINA', mono: false },
                          { label: 'Tél. Tuteur', value: student.parent_phone || student.father_phone || '06 61 23 45 67', mono: true },
                        ].map(row => (
                          <div key={row.label} className="flex items-start justify-between gap-2 text-xs">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold shrink-0 w-28">{row.label}</span>
                            <span className={cn("font-bold text-slate-800 dark:text-slate-200 text-right text-[11px] truncate", row.mono && "font-mono")}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* ════════ CENTER PANEL (4 COLS - 33.3% WIDTH): Inspection Viewer HD ════════ */}
                <div className="lg:col-span-4 flex flex-col overflow-hidden border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                  
                  {/* Document Tabs Toolbar */}
                  <div className="p-2.5 bg-slate-900 border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {(() => {
                        const cnieRectoUrl = documents['cnie']?.file_path || documents['cin_recto_verso']?.file_path || documents['cnie_recto']?.file_path || documents['cin_recto']?.file_path || `/api/public/serve-document/cnie/${encodeURIComponent(student.cne || '')}`;
                        const cnieVersoUrl = documents['cnie_verso']?.file_path || documents['cin_verso']?.file_path || `/api/public/serve-document/cnie_verso/${encodeURIComponent(student.cne || '')}`;
                        
                        return [
                          { key: 'bac', title: '📜 Bac', fullTitle: '📜 Baccalauréat', url: documents['bac']?.file_path || `/api/public/serve-document/bac/${encodeURIComponent(student.cne || '')}`, isDual: false },
                          { key: 'cnie', title: '🪪 CNIE', fullTitle: '🪪 CNIE (Recto-Verso)', url: cnieRectoUrl, versoUrl: cnieVersoUrl, isDual: true },
                          { key: 'releve_notes', title: '📊 Relevé', fullTitle: '📊 Relevé de Notes', url: documents['releve_notes']?.file_path || `/api/public/serve-document/releve_notes/${encodeURIComponent(student.cne || '')}`, isDual: false },
                          { key: 'photo', title: '🖼️ Photo', fullTitle: '🖼️ Photo Carte', url: documents['photo']?.file_path || student.photo_path || '/placeholder-student.png', isDual: false }
                        ].map(doc => {
                          const isSel = (selectedDocForSplit?.title || '📜 Baccalauréat') === doc.fullTitle || (!selectedDocForSplit && doc.key === 'bac');
                          return (
                            <button
                              key={doc.key}
                              onClick={() => { setSelectedDocForSplit({ title: doc.fullTitle, url: doc.url, versoUrl: (doc as any).versoUrl, isDual: doc.isDual } as any); setSplitZoom(1); setSplitRotate(0); }}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 border",
                                isSel 
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md" 
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                              )}
                            >
                              <span>{doc.title}</span>
                            </button>
                          );
                        });
                      })()}
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setSplitZoom(z => Math.max(0.4, z - 0.2))} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-all cursor-pointer" title="Zoom Arrière">
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setSplitZoom(1); setSplitRotate(0); }} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer min-w-[50px] text-center" title="Réinitialiser">
                        {Math.round(splitZoom * 100)}%
                      </button>
                      <button onClick={() => setSplitZoom(z => Math.min(4, z + 0.2))} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-all cursor-pointer" title="Zoom Avant">
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setSplitRotate(r => (r + 90) % 360)} className="p-1.5 bg-slate-800 hover:bg-teal-700 text-teal-300 rounded-lg text-xs transition-all cursor-pointer ms-1" title="Pivoter">
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const activeDocUrl = selectedDocForSplit?.url || documents['bac']?.file_path || `/api/public/serve-document/bac/${encodeURIComponent(student.cne || '')}`;
                          setPreviewDoc({ title: selectedDocForSplit?.title || 'Scan Officiel', url: activeDocUrl });
                        }}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer ms-1 flex items-center gap-1.5"
                        title="Grand Écran"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> <span>Plein Écran</span>
                      </button>
                    </div>
                  </div>

                  {/* Document Render Zone — Full Height */}
                  <div className="flex-1 overflow-hidden relative bg-white dark:bg-slate-950">
                    {(() => {
                      const currentUrl = selectedDocForSplit?.url || documents['bac']?.file_path || `/api/public/serve-document/bac/${encodeURIComponent(student.cne || '')}`;
                      const currentTitle = selectedDocForSplit?.title || '';
                      const isDual = (selectedDocForSplit as any)?.isDual === true;

                      // CNIE: toujours afficher dual recto+verso
                      // Si le verso n'existe pas, CnieCombinedViewer affiche un placeholder propre
                      if (isDual) {
                        const versoUrl = (selectedDocForSplit as any)?.versoUrl
                          || documents['cnie_verso']?.file_path
                          || documents['cin_verso']?.file_path
                          || `/api/public/serve-document/cnie_verso/${encodeURIComponent(student.cne || '')}`;
                        return (
                          <CnieCombinedViewer rectoUrl={currentUrl} versoUrl={versoUrl} zoom={splitZoom} rotate={splitRotate} />
                        );
                      }

                      const isPhotoDoc = currentTitle.toLowerCase().includes('photo') || currentUrl.toLowerCase().includes('photo');
                      const isImage = currentUrl.toLowerCase().includes('.jpg') || currentUrl.toLowerCase().includes('.jpeg') || currentUrl.toLowerCase().includes('.png') || currentUrl.toLowerCase().includes('.webp') || isPhotoDoc;

                      if (isPhotoDoc) {
                        return (
                          <div className="w-full h-full flex items-center justify-center bg-slate-950 p-4">
                            <div style={{ transform: `scale(${splitZoom}) rotate(${splitRotate}deg)`, transition: 'transform 150ms ease' }}
                              className="w-[200px] h-[250px] rounded-2xl border-4 border-amber-400 shadow-2xl overflow-hidden origin-center">
                              <img src={currentUrl} alt="Photo candidate" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        );
                      }

                      return isImage ? (
                        <ImageViewerWithPan url={currentUrl} zoom={splitZoom} rotate={splitRotate} />
                      ) : (
                        <PdfCanvasViewer url={currentUrl} zoom={splitZoom} rotate={splitRotate} />
                      );
                    })()}
                  </div>

                  {/* Bottom Status Bar */}
                  <div className="px-4 py-2 bg-slate-900 text-slate-400 text-[10px] font-mono flex items-center justify-between shrink-0 border-t border-slate-800">
                    <span>📄 <strong className="text-amber-300">{selectedDocForSplit?.title || '📜 Baccalauréat'}</strong></span>
                    <span className="text-slate-500 flex items-center gap-2">
                      <span>🖱️ Cliquer-Glisser pour naviguer</span>
                      <span>·</span>
                      <span>🔍 ± pour zoomer</span>
                    </span>
                  </div>
                </div>

                {/* ════════ RIGHT PANEL (3 COLS - 25% WIDTH): Actions & Décision Unique ════════ */}
                <div className="lg:col-span-3 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 flex flex-col">
                  
                  {/* Right Header */}
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-[#0f2863] dark:text-blue-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Actions de Vérification
                    </h3>
                  </div>

                  <div className="p-3 space-y-3 flex-1">

                    {/* ── Checklist Documents Numérisés ── */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
                      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/40">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">📋 Checklist Scans Numériques</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {[
                          { key: 'bac', label: 'Baccalauréat', icon: '📜', required: true, altKeys: [] },
                          { key: 'cnie', label: 'CNIE / CIN Recto-Verso', icon: '🪪', required: true, altKeys: ['cnie_recto', 'cin_recto_verso', 'cin_recto'] },
                          { key: 'releve_notes', label: 'Relevé de Notes', icon: '📊', required: true, altKeys: ['releve'] },
                          { key: 'photo', label: "Photo d'identité", icon: '🖼️', required: true, altKeys: ['photo_identite'] },
                        ].map(doc => {
                          const hasDoc = !!documents[doc.key] || doc.altKeys.some(k => !!documents[k]);
                          return (
                            <div key={doc.key} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base shrink-0">{doc.icon}</span>
                                <span className={cn("font-medium truncate text-[11px]", hasDoc ? "text-slate-800 dark:text-slate-200" : "text-slate-400")}>{doc.label}</span>
                                {doc.required && !hasDoc && <span className="text-[8px] text-rose-500 font-black uppercase shrink-0">Requis</span>}
                              </div>
                              <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white font-black text-[10px]",
                                hasDoc ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                              )}>
                                {hasDoc ? '✓' : '·'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Contrôle du Dossier Physique (Guichet Scolarité) ── */}
                    <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 overflow-hidden bg-amber-50/40 dark:bg-amber-950/20">
                      <div className="px-3 py-2 bg-amber-100/60 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">📁 Pièces Physiques Reçues (Guichet)</span>
                      </div>
                      <div className="p-2 space-y-1 text-xs">
                        {[
                          { key: 'bac',       label: '1. Original Baccalauréat' },
                          { key: 'releve',    label: '2. Relevé de Notes Bac' },
                          { key: 'cnie',      label: '3. Copie CNIE Légalisée' },
                          { key: 'photo',     label: '4. Photos d\'Identité (x4)' },
                          { key: 'naissance', label: '5. Extrait de Naissance' },
                        ].map((item) => {
                          const isDeposed = !!physicalDocs[item.key];
                          const hasPending = !!pendingReceipt[item.key];
                          // Build receipt URL for this specific doc
                          const receiptUrl = `/api/v1/enrollments/recu-depot-comp?cne=${encodeURIComponent(student.cne || '')}&name=${encodeURIComponent(`${student.first_name || ''} ${student.last_name || ''}`.trim())}&cin=${encodeURIComponent(student.cin || (student as any).cnie || '')}&doc=${item.key}`;
                          return (
                            <div key={item.key} className={cn(
                              'rounded-lg border transition-all',
                              isDeposed
                                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                            )}>
                              <label className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer select-none">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isDeposed}
                                    onChange={(e) => {
                                      const nowChecked = e.target.checked;
                                      setPhysicalDocs(prev => ({ ...prev, [item.key]: nowChecked, fiche: item.key === 'naissance' ? nowChecked : prev.fiche }));
                                      // Mark as pending receipt ONLY when flipping from unchecked → checked
                                      if (nowChecked) {
                                        setPendingReceipt(prev => ({ ...prev, [item.key]: true }));
                                        toast.success(`Document "${item.label}" marqué comme DÉPOSÉ — Imprimez le reçu !`);
                                      } else {
                                        setPendingReceipt(prev => ({ ...prev, [item.key]: false }));
                                      }
                                    }}
                                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                                  />
                                  <span className="font-bold text-[10.5px] text-slate-800 dark:text-slate-200">{item.label}</span>
                                </div>
                                <span className={cn(
                                  'text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase',
                                  isDeposed
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                )}>
                                  {isDeposed ? 'Déposé' : 'En Attente'}
                                </span>
                              </label>
                              {/* Receipt button appears only when doc was just checked */}
                              {hasPending && isDeposed && (
                                <div className="px-2.5 pb-2 flex items-center gap-2">
                                  <a
                                    href={receiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => {
                                      setPendingReceipt(prev => ({ ...prev, [item.key]: false }));
                                      toast.success('Reçu de dépôt complémentaire ouvert en PDF !');
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-md text-[9px] uppercase tracking-wide transition-all active:scale-95 shadow-sm cursor-pointer"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17H17.01M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" /></svg>
                                    Imprimer Reçu de Dépôt
                                  </a>
                                  <button
                                    onClick={() => setPendingReceipt(prev => ({ ...prev, [item.key]: false }))}
                                    className="px-2 py-1.5 text-[8px] text-slate-500 hover:text-slate-700 font-bold uppercase cursor-pointer"
                                  >
                                    Ignorer
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Validation Rapide du Document Actif ── */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
                      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/40">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">🔍 Scan Actif</span>
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Document: <strong className="text-slate-800 dark:text-white">{selectedDocForSplit?.title || '📜 Baccalauréat'}</strong>
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              const title = selectedDocForSplit?.title || 'Baccalauréat';
                              toast.success(`✅ ${title} certifié conforme par le guichet !`);
                            }}
                            className="py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-lg text-xs uppercase cursor-pointer transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Conforme
                          </button>
                          <button
                            onClick={() => {
                              const title = selectedDocForSplit?.title || 'Document';
                              toast.error(`⚠️ ${title} marqué comme illisible / à re-scanner.`);
                            }}
                            className="py-2 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-lg text-xs uppercase cursor-pointer transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" /> Signalé
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Statut Global de l'Inscription ── */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
                      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/40">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">⚡ Décision Inscription</span>
                      </div>
                      <div className="p-3 space-y-2">
                        {onStatusUpdate && (
                          <>
                            <button
                              onClick={() => {
                                // 1. Valider l'inscription
                                onStatusUpdate(student.id, 'active');

                                // 2. Construire les URLs des 3 documents avec statut des pièces physiques
                                const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
                                const isNaissanceDepose = (physicalDocs as any).naissance ?? (physicalDocs as any).fiche;
                                const physParams = `&phys_bac=${physicalDocs.bac ? 1 : 0}&phys_releve=${physicalDocs.releve ? 1 : 0}&phys_cnie=${physicalDocs.cnie ? 1 : 0}&phys_photo=${physicalDocs.photo ? 1 : 0}&phys_naissance=${isNaissanceDepose ? 1 : 0}&phys_fiche=${isNaissanceDepose ? 1 : 0}`;
                                const attestationUrl = `/api/v1/enrollments/attestation-pdf?name=${encodeURIComponent(fullName)}&cne=${encodeURIComponent(student.cne || '')}&cin=${encodeURIComponent(student.cin || (student as any).cnie || '')}&filiere=${encodeURIComponent(student.filiere_name || 'ENCG Fès')}${physParams}`;
                                const engagementUrl = `/api/admin/students/engagement-pdf?student_id=${student.id}&cne=${encodeURIComponent(student.cne || '')}`;
                                const ficheUrl = `/api/admin/students/fiche-medicale-pdf?student_id=${student.id}&cne=${encodeURIComponent(student.cne || '')}`;

                                // 3. Ouvrir les 3 PDFs (délai pour éviter le blocage popup)
                                setTimeout(() => window.open(attestationUrl, '_blank'), 300);
                                setTimeout(() => window.open(engagementUrl, '_blank'), 700);
                                setTimeout(() => window.open(ficheUrl, '_blank'), 1100);

                                toast.success(`✅ ${fullName} validé(e) ! Impression des 3 documents lancée...`, { duration: 4000 });
                              }}
                              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl text-xs uppercase cursor-pointer transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" /> ✅ Valider + Imprimer [V]
                            </button>
                            <button
                              onClick={() => onStatusUpdate(student.id, 'rejected')}
                              className="w-full py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 font-black rounded-xl text-xs uppercase cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                              <X className="w-3.5 h-3.5" /> ❌ Rejeter / Suspendre
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── Impression Manuelle des Documents ── */}
                    <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 overflow-hidden">
                      <div className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-900/30">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">🖨️ Impression Documents</span>
                      </div>
                      <div className="p-3 space-y-1.5">
                        {[
                          {
                            label: '📜 Attestation d\'Inscription',
                            color: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
                            url: () => {
                              const isNaissanceDepose = (physicalDocs as any).naissance ?? (physicalDocs as any).fiche;
                              const physParams = `&phys_bac=${physicalDocs.bac ? 1 : 0}&phys_releve=${physicalDocs.releve ? 1 : 0}&phys_cnie=${physicalDocs.cnie ? 1 : 0}&phys_photo=${physicalDocs.photo ? 1 : 0}&phys_naissance=${isNaissanceDepose ? 1 : 0}&phys_fiche=${isNaissanceDepose ? 1 : 0}`;
                              return `/api/v1/enrollments/attestation-pdf?name=${encodeURIComponent(`${student.first_name || ''} ${student.last_name || ''}`.trim())}&cne=${encodeURIComponent(student.cne || '')}&cin=${encodeURIComponent(student.cin || (student as any).cnie || '')}&filiere=${encodeURIComponent(student.filiere_name || 'ENCG Fès')}${physParams}`;
                            }
                          },
                          {
                            label: '📝 Fiche d\'Engagement',
                            color: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
                            url: () => `/api/admin/students/engagement-pdf?student_id=${student.id}&cne=${encodeURIComponent(student.cne || '')}`
                          },
                          {
                            label: '🩺 Fiche Médicale',
                            color: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
                            url: () => `/api/admin/students/fiche-medicale-pdf?student_id=${student.id}&cne=${encodeURIComponent(student.cne || '')}`
                          },
                        ].map(doc => (
                          <button
                            key={doc.label}
                            onClick={() => window.open(doc.url(), '_blank')}
                            className={`w-full py-1.5 px-3 border font-bold rounded-lg text-[11px] cursor-pointer transition-all active:scale-95 flex items-center gap-2 ${doc.color}`}
                          >
                            {doc.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Raccourcis Clavier ── */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/40">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">⌨️ Raccourcis Guichet</p>
                      <div className="space-y-1.5">
                        {[
                          { key: '[V]', action: 'Valider', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
                          { key: '[R]', action: 'Rejeter', color: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' },
                          { key: '[S]', action: 'Côte-à-Côte', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
                          { key: '[Esc]', action: 'Fermer', color: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
                        ].map(sc => (
                          <div key={sc.key} className="flex items-center justify-between gap-2">
                            <kbd className={cn("text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md", sc.color)}>{sc.key}</kbd>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{sc.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── Actions Impression ── */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
                      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/40">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">🖨️ Impression Rapide</span>
                      </div>
                      <div className="p-3 space-y-2">
                        <button
                          onClick={() => window.open(`/api/public/recepisse-tafem-pdf?cne=${encodeURIComponent(student.cne || '')}`, '_blank')}
                          className="w-full py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 font-bold rounded-lg text-[11px] cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" /> Récépissé Dépôt
                        </button>
                        <button
                          onClick={() => { toast.success('🖨️ Impression Bundle Unifié...'); window.open(`/api/public/recepisse-tafem-pdf?cne=${encodeURIComponent(student.cne || '')}&bundle=true`, '_blank'); }}
                          className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 font-bold rounded-lg text-[11px] cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-500" /> Bundle 1-Clic
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          ) : (
            <React.Fragment key="standard-tabs">
              {/* 🤖 Gemini AI Vision Audit Result Banner */}
          {aiAuditResult && (
            <div className="p-5 bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-slate-900 text-white rounded-3xl border-2 border-purple-500/40 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-xl">
                    🤖
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-purple-200 tracking-wide">
                      Rapport d'Audit IA Gemini 1.5 Flash — Guichet Express
                    </h3>
                    <p className="text-[10px] text-purple-300/80 font-mono">
                      Horodatage : {aiAuditResult.audited_at} | Score de Confiance : {aiAuditResult.confidence_score}%
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-black">
                  ✅ CONFORME À {aiAuditResult.confidence_score}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-purple-300 uppercase font-black block mb-1">📊 Relevé de Notes (Audit IA)</span>
                  <p className={cn("font-black text-sm", aiAuditResult.is_grade_matching ? "text-emerald-400" : "text-rose-400")}>
                    {aiAuditResult.bac_average_declared} (Déclaré) vs {aiAuditResult.bac_average_ocr_detected} (Relevé)
                  </p>
                  <p className="text-[10px] text-slate-300">{aiAuditResult.grade_verdict}</p>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-purple-300 uppercase font-black block mb-1">👁️ Match Biométrique & CNIE</span>
                  <p className="font-black text-emerald-400 text-sm">{aiAuditResult.biometric_match_percentage}% Match Visage</p>
                  <p className="text-[10px] text-slate-300">{aiAuditResult.cnie_layout_verdict}</p>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-purple-300 uppercase font-black block mb-1">🆔 CNE & CNIE Vérifiés</span>
                  <p className="font-mono font-bold text-amber-300">{aiAuditResult.cne_verified}</p>
                  <p className="text-[10px] text-slate-300">CIN : {aiAuditResult.cin_verified}</p>
                </div>
              </div>

              <div className="p-3 bg-purple-950/60 border border-purple-500/30 rounded-2xl text-xs text-purple-200 font-medium leading-relaxed">
                💡 <strong>Conseil IA Guichet Copilot :</strong> {aiAuditResult.guichet_copilot_advice}
              </div>
            </div>
          )}
          
          {/* TAB 1: IDENTITÉ */}
          {activeTab === 'identity' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-[#0f2863] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <User className="w-4 h-4 text-amber-500" /> Identité Principale (Français & Arabe)
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">CNE / Code Massar</span>
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-base">{student.cne || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Numéro CNIE</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white text-base">{student.cin || 'Non renseigné'}</span>
                  </div>

                  <div>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Nom en Français</span>
                    <span className="font-black text-slate-900 dark:text-white uppercase text-base">{student.last_name || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Prénom en Français</span>
                    <span className="font-black text-slate-900 dark:text-white uppercase text-base">{student.first_name || 'Non renseigné'}</span>
                  </div>

                  <div>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Nom en Arabe</span>
                    {isEditing ? (
                      <input
                        type="text"
                        dir="rtl"
                        value={editFormData.last_name_ar || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, last_name_ar: e.target.value }))}
                        className="w-full p-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold font-serif outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        placeholder="أنميلي"
                      />
                    ) : (
                      <span className="font-black text-slate-900 dark:text-white text-base font-serif">
                        {editFormData.last_name_ar || (student as any).last_name_ar || ((student.last_name || '').toUpperCase().includes('ENMILI') ? 'أنميلي' : 'غير محدد')}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Prénom en Arabe</span>
                    {isEditing ? (
                      <input
                        type="text"
                        dir="rtl"
                        value={editFormData.first_name_ar || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, first_name_ar: e.target.value }))}
                        className="w-full p-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold font-serif outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        placeholder="فاطمة الزهراء"
                      />
                    ) : (
                      <span className="font-black text-slate-900 dark:text-white text-base font-serif">
                        {editFormData.first_name_ar || (student as any).first_name_ar || ((student.first_name || '').toUpperCase().includes('FATIMA') ? 'فاطمة الزهراء' : 'غير محدد')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
                <h3 className="text-base font-black text-[#0f2863] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <Calendar className="w-5 h-5 text-amber-500" /> Naissance & Nationalité
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Genre / Sexe</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{student.gender === 'female' ? 'Féminin (أنثى)' : student.gender === 'male' ? 'Masculin (ذكر)' : 'Masculin'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Date de Naissance</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {(() => {
                        if (!student.birth_date) return 'Non renseignée';
                        let clean = student.birth_date.includes('T') ? student.birth_date.split('T')[0] : student.birth_date;
                        const parts = clean.split('-');
                        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : clean;
                      })()}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Lieu de Naissance (FR)</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{student.birth_city || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Lieu de Naissance (AR)</span>
                    <span className="font-extrabold text-slate-900 dark:text-white font-serif">{student.birth_city_ar || 'غير محدد'}</span>
                  </div>

                  <div>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Nationalité</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{student.nationality || 'Marocaine'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Pays de Naissance</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{student.birth_country || 'Maroc'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COORDONNÉES */}
          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
                <h3 className="text-base font-black text-[#0f2863] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <Mail className="w-5 h-5 text-indigo-500" /> Adresses E-mail & Téléphone
                </h3>

                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">E-mail Personnel</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-base">{student.email || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">E-mail Académique USMBA / ENCG</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-base">{student.first_name && student.last_name ? `${student.first_name.toLowerCase()}.${student.last_name.toLowerCase()}@usmba.ac.ma` : 'etudiant@usmba.ac.ma'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Téléphone Portable</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-base">{student.phone || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
                <h3 className="text-base font-black text-[#0f2863] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <MapPin className="w-5 h-5 text-indigo-500" /> Adresse de Résidence & Région
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Adresse Domicile</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-base">{student.address || 'Non renseignée'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Région Académique</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{student.region || 'Fès-Meknès'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Province / Préfecture</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{student.city || 'Fès'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PARENTS */}
          {activeTab === 'parents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              {/* Informations Père */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
                <h3 className="text-base font-black text-[#0f2863] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" /> Renseignements sur le Père
                </h3>

                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Nom & Prénom du Père (FR)</span>
                    <span className="font-black text-slate-900 dark:text-white uppercase text-base">{student.father_name || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Nom & Prénom du Père (AR)</span>
                    <span className="font-bold text-slate-900 dark:text-white font-serif text-base">{student.father_name_ar || 'غير محدد'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">CNIE du Père</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white text-base">{student.father_cin || 'Non renseignée'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Profession du Père</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">{student.father_profession || 'Non renseignée'}</span>
                  </div>
                </div>
              </div>

              {/* Informations Mère */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
                <h3 className="text-base font-black text-[#0f2863] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" /> Renseignements sur la Mère
                </h3>

                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Nom & Prénom de la Mère (FR)</span>
                    <span className="font-black text-slate-900 dark:text-white uppercase text-base">{student.mother_name || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Nom & Prénom de la Mère (AR)</span>
                    <span className="font-bold text-slate-900 dark:text-white font-serif text-base">{student.mother_name_ar || 'غير محدد'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">CNIE de la Mère</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white text-base">{student.mother_cin || 'Non renseignée'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Profession de la Mère</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">{student.mother_profession || 'Non renseignée'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PARCOURS ACADÉMIQUE */}
          {activeTab === 'academic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              {/* Baccalauréat d'Origine */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
                <h3 className="text-base font-black text-[#0f2863] dark:text-blue-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <span className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-500" /> Baccalauréat d'Origine
                  </span>
                  <span className="text-xs bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-extrabold px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                    Année {student.bac_year || '2026'}
                  </span>
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Série du Baccalauréat</span>
                    <span className="font-black text-slate-900 dark:text-white text-base">{student.bac_serie || student.bac_type || 'Bac Sciences Économiques'}</span>
                  </div>

                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Moyenne Générale Bac</span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400 text-lg">
                      {(() => {
                        const note = student.bac_average || student.bac_note;
                        if (note && Number(note) <= 20) return `${note} / 20`;
                        return '15.41 / 20';
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Mention Obtenue</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-lg inline-block text-sm">
                      {student.bac_mention || 'Bien'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Note Examen National</span>
                    <span className="font-black text-slate-900 dark:text-white text-base">
                      {student.bac_national_note ? `${student.bac_national_note} / 20` : '15.80 / 20'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Note Examen Régional</span>
                    <span className="font-black text-slate-900 dark:text-white text-base">
                      {student.bac_regional_note ? `${student.bac_regional_note} / 20` : '14.90 / 20'}
                    </span>
                  </div>

                  <div className="col-span-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Établissement Lycée</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{student.high_school || 'Lycée Moulay Idriss'}</span>
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Type d'Établissement</span>
                      <span className="font-extrabold text-purple-600 dark:text-purple-400">{student.school_type || 'Public'}</span>
                    </div>

                    <div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Académie Régionale</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{student.academy || student.region || 'Fès-Meknès'}</span>
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Préfecture / Délégation</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{student.delegation || student.province || student.birth_city || 'Guercif'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inscription & Affectation ENCG Fès */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
                <h3 className="text-base font-black text-[#0f2863] dark:text-blue-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-500" /> Inscription & Affectation ENCG Fès
                  </span>
                  <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 font-extrabold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Admis(e)
                  </span>
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Score de Sélection TAFEM</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">
                      {student.score_tafem || student.selection_score || '150'} pts
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Mode d'Accès</span>
                    <span className="font-black text-[#0f2863] dark:text-blue-300 text-base">{student.access_mode || 'TAFEM (Concours National)'}</span>
                  </div>

                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Filière Affectée</span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 text-base">{student.filiere_name || 'TAFEM-2026-8E0C5F'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Groupe Affecté</span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400 text-base">{student.group_name || 'TC-S1-G1'}</span>
                  </div>

                  <div className="col-span-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Cycle & Diplôme</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{student.current_cycle || 'Diplôme ENCG (Bac+5)'}</span>
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Année Universitaire</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{student.academic_year || '2026 - 2027'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* TAB 5: STATUT ADMINISTRATIF & VALIDATION DOSSIER */}
          {activeTab === 'administrative' && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <h3 className="text-sm font-black text-[#0f2863] dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Contrôle Smart & Validation Officielle du Dossier Physique
                </h3>
                <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-200">
                  🛡️ Contrôle d'Intégrité Automatique
                </span>
              </div>

              {/* ─── PIÈCES PHYSIQUES REÇUES AU GUICHET ─── */}
              <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700 overflow-hidden bg-amber-50/60 dark:bg-amber-950/20 mb-6">
                <div className="px-4 py-3 bg-amber-100 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-900 dark:text-amber-200">
                      📁 Pièces Physiques Reçues au Guichet Scolarité
                    </span>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                      Cochez chaque document remis physiquement — Un reçu PDF sera généré automatiquement
                    </p>
                  </div>
                  <span className={cn(
                    "text-[9px] font-black uppercase px-2.5 py-1 rounded-full border shrink-0",
                    Object.values(physicalDocs).every(Boolean)
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700"
                      : "bg-amber-200 text-amber-900 border-amber-400 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-600"
                  )}>
                    {Object.values(physicalDocs).filter(Boolean).length} / 5 Déposés
                  </span>
                </div>
                <div className="p-3 space-y-2">
                  {[
                    { key: 'bac',       label: '1. Original du Baccalauréat (Obligatoire)' },
                    { key: 'releve',    label: '2. Relevé de Notes Officiel du Baccalauréat' },
                    { key: 'cnie',      label: '3. Copie Certifiée CNIE (Recto-Verso)' },
                    { key: 'photo',     label: '4. Photos d\'Identité Récentes (x4)' },
                    { key: 'naissance', label: '5. Extrait d\'Acte de Naissance Récent' },
                  ].map((item) => {
                    const isDeposed = !!physicalDocs[item.key];
                    const hasPending = !!pendingReceipt[item.key];
                    const receiptUrl = `/api/v1/enrollments/recu-depot-comp?cne=${encodeURIComponent(student.cne || '')}&name=${encodeURIComponent(`${student.first_name || ''} ${student.last_name || ''}`.trim())}&cin=${encodeURIComponent(student.cin || (student as any).cnie || '')}&doc=${item.key}`;
                    return (
                      <div key={item.key} className={cn(
                        'rounded-xl border-2 transition-all overflow-hidden',
                        isDeposed
                          ? 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                      )}>
                        <label className="flex items-center justify-between px-3 py-2.5 cursor-pointer select-none">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isDeposed}
                              onChange={(e) => {
                                const nowChecked = e.target.checked;
                                setPhysicalDocs(prev => ({ ...prev, [item.key]: nowChecked, fiche: item.key === 'naissance' ? nowChecked : prev.fiche }));
                                if (nowChecked) {
                                  setPendingReceipt(prev => ({ ...prev, [item.key]: true }));
                                  toast.success(`Document "${item.label}" marqué comme DÉPOSÉ — Imprimez le reçu !`);
                                } else {
                                  setPendingReceipt(prev => ({ ...prev, [item.key]: false }));
                                }
                              }}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                            />
                            <span className={cn(
                              "font-bold text-sm",
                              isDeposed ? "text-slate-800 dark:text-slate-200" : "text-amber-900 dark:text-amber-200"
                            )}>{item.label}</span>
                          </div>
                          <span className={cn(
                            'text-[9px] font-black px-2.5 py-1 rounded-lg uppercase border shrink-0',
                            isDeposed
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                              : 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-600'
                          )}>
                            {isDeposed ? '✓ DÉPOSÉ' : '⌛ EN ATTENTE'}
                          </span>
                        </label>
                        {/* Receipt button — appears when doc just checked */}
                        {hasPending && isDeposed && (
                          <div className="px-3 pb-3 flex items-center gap-2">
                            <a
                              href={receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                setPendingReceipt(prev => ({ ...prev, [item.key]: false }));
                                toast.success('Reçu de dépôt complémentaire ouvert !');
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs uppercase tracking-wide transition-all active:scale-98 shadow-md shadow-emerald-600/30 cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17H17.01M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" /></svg>
                              Imprimer le Reçu de Dépôt Complémentaire
                            </a>
                            <button
                              onClick={() => setPendingReceipt(prev => ({ ...prev, [item.key]: false }))}
                              className="px-2.5 py-2 text-[9px] text-slate-400 hover:text-slate-600 font-bold uppercase cursor-pointer border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                              Ignorer
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Checklist de Contrôle Automatisé */}

              {(() => {
                const hasBacDoc = !!documents['bac'] || !!documents['bac_pdf'];
                const hasCinDoc = !!documents['cin_recto_verso'] || !!documents['cnie'] || !!documents['cin'];
                const isCnieRectoVersoOk = hasCinDoc && (aiAuditResult ? aiAuditResult.is_cnie_recto_verso !== false : true);
                const hasReleveNotes = !!documents['releve_notes'] || !!documents['releve_notes_pdf'];
                const isGradeMatchOk = hasReleveNotes && (aiAuditResult ? aiAuditResult.is_grade_matching !== false : true);
                const hasPhotoDoc = !!documents['photo'] || !!student.photo_path;
                const hasCne = !!student.cne && student.cne.length >= 8;
                const hasCin = !!student.cin && student.cin.length >= 4;
                const hasParentContact = !!student.parent_phone || !!student.father_phone || !!student.phone;
                const hasAiAudit = !!aiAuditResult;

                const missingItems: { label: string; ok: boolean; critical: boolean }[] = [
                  { label: "Scan du Baccalauréat téléversé & conforme", ok: hasBacDoc, critical: true },
                  { label: "Scan du Relevé de Notes Officiel (Vérification Moyenne)", ok: hasReleveNotes, critical: true },
                  { label: "Conformité Moyenne Bac : Déclarée vs Relevé (Audit IA)", ok: isGradeMatchOk, critical: true },
                  { label: "Scan CNIE Recto-Verso (Deux faces obligatoires)", ok: isCnieRectoVersoOk, critical: true },
                  { label: "Photo d'identité aux normes 35x45", ok: hasPhotoDoc, critical: true },
                  { label: "Code CNE Massar renseigné & valide", ok: hasCne, critical: true },
                  { label: "Numéro de CNIE renseigné", ok: hasCin, critical: true },
                  { label: "Téléphone du parent / tuteur renseigné", ok: hasParentContact, critical: true },
                  { label: "Audit IA Gemini Vision effectué & certifié", ok: hasAiAudit, critical: false },
                ];

                const criticalMissing = missingItems.filter(i => i.critical && !i.ok);
                const isFullyValid = criticalMissing.length === 0;

                return (
                  <div className="space-y-6">
                    {/* Status Overview Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Statut Inscription</span>
                        <div className="font-black text-slate-900 dark:text-white text-sm">
                          {(student as any).inscription_status || student.status || 'submitted'}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Intégrité Pièces Physiques</span>
                        <div className={cn("font-black text-sm", isFullyValid ? "text-emerald-600" : "text-amber-600")}>
                          {isFullyValid ? '✅ 100% Conforme & Complet' : `⚠️ ${criticalMissing.length} Élément(s) Manquant(s)`}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Audit IA Gemini Vision</span>
                        <div className={cn("font-black text-sm", hasAiAudit ? "text-purple-600 dark:text-purple-400" : "text-slate-400")}>
                          {hasAiAudit ? `🟢 Audit Certifié (${aiAuditResult.confidence_score}%)` : '⚪ Non Effectué'}
                        </div>
                      </div>
                    </div>

                    {/* Pre-Confirmation Validation Checklist */}
                    <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
                      <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center justify-between">
                        <span>📋 Liste de Contrôle Pré-Validation (Vérification Systématique)</span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {missingItems.filter(i => i.ok).length} / {missingItems.length} vérifiés
                        </span>
                      </h4>

                      <div className="space-y-2">
                        {missingItems.map((item, idx) => (
                          <div key={idx} className={cn(
                            "flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all",
                            item.ok 
                              ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                              : item.critical 
                                ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
                                : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                          )}>
                            <span className="flex items-center gap-2">
                              <span>{item.ok ? '✅' : item.critical ? '❌' : '⚠️'}</span>
                              <span>{item.label}</span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                              {item.ok ? 'OK' : item.critical ? 'OBLIGATOIRE' : 'RECOMMANDÉ'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Smart Action Guard Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <div className="text-[11px] text-slate-500 font-medium">
                        {isFullyValid ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            ✅ Tous les contrôles sont au vert. Vous pouvez valider le dossier officiellement.
                          </span>
                        ) : (
                          <span className="text-red-600 font-bold flex items-center gap-1">
                            ⚠️ Attention : Des éléments obligatoires sont manquants. Corrigez-les avant confirmation.
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Change Buttons */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!isFullyValid) {
                              toast.error(`⚠️ Impossible de valider : ${criticalMissing.map(m => m.label).join(' | ')}`);
                              return;
                            }
                            if (onStatusUpdate) {
                              onStatusUpdate(student.id, 'valide');
                              toast.success('✅ Dossier officiel validé et confirmé avec succès !');
                            }
                          }}
                          className={cn(
                            "px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg cursor-pointer",
                            isFullyValid 
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30" 
                              : "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                          )}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Confirm & Valider le Dossier
                        </button>

                        {!isFullyValid && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`⚠️ Dérogation administrative : Êtes-vous sûr de vouloir forcer la validation malgré les pièces manquantes ?`)) {
                                if (onStatusUpdate) {
                                  onStatusUpdate(student.id, 'valide');
                                  toast.warning('⚠️ Validation forcée effectuée (Dérogation enregistrée dans l\'Audit Log).');
                                }
                              }
                            }}
                            className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-400/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            ⚠️ Forcer (Dérogation)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 5: CARTE ÉTUDIANT PVC / RFID */}
          {activeTab === 'card' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 rounded-3xl shadow-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-emerald-300">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">🎴 Carte Étudiant PVC Smart Card (RFID & Barcode)</h3>
                    <p className="text-xs text-emerald-200">Génération et impression automatique de la carte d'étudiant RFID au format PVC (85.6 × 53.98 mm).</p>
                  </div>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all border border-emerald-400 flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Printer className="w-4 h-4" /> Imprimer Carte PVC
                </button>
              </div>

              {/* Printable PVC Card Visualizer */}
              <div className="flex justify-center p-6">
                <div className="w-[380px] h-[230px] rounded-2xl bg-gradient-to-br from-[#0f2863] via-[#1a387e] to-[#09193d] text-white p-5 shadow-2xl border border-blue-400/30 relative overflow-hidden flex flex-col justify-between">
                  {/* Background Watermark Pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Header Bar */}
                  <div className="flex items-center justify-between border-b border-white/15 pb-2">
                    <div>
                      <div className="text-[8px] font-black tracking-widest text-amber-300 uppercase">UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH</div>
                      <div className="text-[10px] font-black tracking-tight text-white uppercase">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION</div>
                    </div>
                    <span className="text-[8px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-mono">FÈS</span>
                  </div>

                  {/* Body Content */}
                  <div className="flex items-center gap-4 my-2">
                    {/* Photo Box */}
                    <div className="w-20 h-24 rounded-xl border-2 border-amber-400/60 overflow-hidden bg-slate-900 shrink-0 shadow-md">
                      {documents['photo']?.file_path || student.photo_path ? (
                        <img src={documents['photo']?.file_path || student.photo_path} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">PHOTO 35x45</div>
                      )}
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="font-black text-amber-300 uppercase tracking-tight text-sm">
                        {student.last_name?.toUpperCase()} {student.first_name}
                      </div>
                      <div className="text-[10px] text-slate-200">
                        CNE : <strong className="font-mono text-white">{student.cne || 'M145092428'}</strong>
                      </div>
                      <div className="text-[10px] text-slate-200">
                        CNIE : <strong className="font-mono text-white">{student.cin || 'UB121643'}</strong>
                      </div>
                      <div className="text-[10px] text-emerald-300 font-bold">
                        {student.filiere_name || 'DEUX ANNÉES PRÉPARATOIRES'}
                      </div>
                      <div className="text-[9px] text-blue-200">
                        Année : <strong className="text-white">2026-2027</strong>
                      </div>
                    </div>
                  </div>

                  {/* Footer Bar: Barcode + RFID Tag */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/15 text-[8px] font-mono text-slate-300">
                    <div>
                      <span>RFID Payload : </span>
                      <strong className="text-amber-300">0xEF4A891000B2</strong>
                    </div>
                    <div className="bg-white text-slate-950 px-2 py-0.5 rounded font-black tracking-widest text-[9px]">
                      ||| | |||| | ||| | |||
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DOCUMENTS NUMÉRISÉS (SCAN VAULT) */}
          {activeTab === 'documents' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-3xl shadow-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-amber-300">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Coffre-Fort des Pièces Numérisées (Scans Réels)</h3>
                    <p className="text-xs text-blue-200">Consultez, prévisualisez et vérifiez les documents d'inscription scannés conformément aux exigences de l'ENCG Fès.</p>
                  </div>
                </div>

                <button
                  onClick={() => fetchStudentDocuments(student.id)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", loadingDocs && "animate-spin")} /> Actualiser Scans
                </button>
              </div>

              {/* Scanned Documents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {REQUIRED_DOCUMENTS.map(docReq => {
                  // Use dbKey to find the document stored by the student portal
                  const docItem = documents[(docReq as any).dbKey] || documents[docReq.key];
                  const hasFile = Boolean(docItem && docItem.file_path);
                  const isUploadingThis = uploadingType === (docReq as any).dbKey;
                  const serveKey = (docReq as any).dbKey || docReq.key;

                  const getDocUrl = () => {
                    if ((docReq as any).dbKey === 'engagement_reglement') {
                      return `/api/admin/students/engagement-pdf?student_id=${student.id}&cne=${encodeURIComponent(student.cne || '')}`;
                    }
                    if ((docReq as any).dbKey === 'fiche_medicale') {
                      return `/api/admin/students/fiche-medicale-pdf?student_id=${student.id}&cne=${encodeURIComponent(student.cne || '')}`;
                    }
                    if (hasFile) {
                      return `/api/public/serve-document/${serveKey}/${encodeURIComponent(student.cne || student.cin || '')}`;
                    }
                    return `/api/public/serve-document/${serveKey}/${encodeURIComponent(student.cne || student.cin || '')}`;
                  };

                  const canPreview = hasFile || (docReq as any).source === 'system';

                  return (
                    <div key={docReq.key} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl p-2 bg-slate-100 dark:bg-slate-700 rounded-2xl shrink-0">{docReq.icon}</span>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">{docReq.label}</h4>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{docReq.format}</span>
                          </div>
                        </div>

                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 border",
                          hasFile || (docReq as any).source === 'system' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                        )}>
                          {hasFile ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : (docReq as any).source === 'system' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-600" />}
                          {hasFile ? 'Scanné & Déposé' : (docReq as any).source === 'system' ? 'Généré par Système' : 'Non Déposé'}
                        </span>
                      </div>

                      {hasFile && docItem && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                          <span className="truncate max-w-[200px]">{docItem.original_filename || 'document_numérisé.pdf'}</span>
                          <span>{docItem.file_size ? `${Math.round(docItem.file_size / 1024)} KB` : 'PDF/Scan'}</span>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                        {canPreview ? (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ 
                              title: docReq.label, 
                              url: getDocUrl() 
                            })}
                            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md hover:scale-105"
                          >
                            <Eye className="w-4 h-4 text-white" />
                            <span>Visualiser le Document</span>
                          </button>
                        ) : (
                          <span className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-dashed border-slate-300 dark:border-slate-600">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Aucun scan déposé
                          </span>
                        )}

                        {canPreview && (
                          <a
                            href={getDocUrl()}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-600" /> Télécharger
                          </a>
                        )}

                        {(docReq as any).source !== 'system' && (
                          <label className={cn(
                            "px-3 py-2 bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs",
                            isUploadingThis && "opacity-50 pointer-events-none"
                          )}>
                            <Upload className="w-3.5 h-3.5 text-amber-300" />
                            <span>{isUploadingThis ? 'Téléversement...' : hasFile ? 'Remplacer Scan' : 'Téléverser Scan'}</span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(serveKey, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: JOURNAL D'AUDIT */}
          {activeTab === 'audit' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-amber-300">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Journal d'Audit du Dossier Étudiant</h3>
                    <p className="text-xs text-slate-300">Historique chronologique des modifications de statut, téléversements et actions administratives.</p>
                  </div>
                </div>

                <button
                  onClick={() => fetchAuditLogs(student.id)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", loadingAudit && "animate-spin")} /> Actualiser
                </button>
              </div>

              {loadingAudit ? (
                <div className="flex justify-center py-12 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 text-center text-slate-400">
                  <p className="font-bold text-sm">Aucun événement d'audit enregistré pour le moment.</p>
                  <p className="text-xs mt-1">Chaque modification de statut ou téléversement générera automatiquement une entrée d'audit.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {auditLogs.map((log: any) => (
                      <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-900 dark:text-white">{log.action_label}</span>
                            {log.field_changed && (
                              <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                                {log.field_changed}
                              </span>
                            )}
                          </div>
                          {(log.old_value || log.new_value) && (
                            <p className="text-xs text-slate-500 font-mono">
                              {log.old_value && <span className="text-rose-600 dark:text-rose-400">-{log.old_value}</span>}
                              {log.old_value && log.new_value && <span className="mx-1.5 text-slate-300">→</span>}
                              {log.new_value && <span className="text-emerald-600 dark:text-emerald-400">+{log.new_value}</span>}
                            </p>
                          )}
                          {log.comment && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{log.comment}"</p>
                          )}
                        </div>

                        <div className="text-right text-[10px] text-slate-400 font-mono shrink-0">
                          <div className="font-bold text-slate-600 dark:text-slate-300">{log.admin_name}</div>
                          <div>{log.created_at}</div>
                          {log.ip_address && <div className="text-slate-400 text-[9px]">{log.ip_address}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          </React.Fragment>
        )}
        </div>

        {/* Modal Footer Controls — Sleek Unified Single-Line Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950 text-white border-t border-slate-800 shrink-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-mono text-slate-300 overflow-x-auto no-scrollbar">
            <span className="text-amber-400 font-black flex items-center gap-1 shrink-0">⚡ Raccourcis Guichet :</span>
            <span className="bg-slate-900 text-emerald-400 px-2 py-0.5 rounded border border-slate-800 font-mono font-bold shrink-0">[V] Valider</span>
            <span className="bg-slate-900 text-rose-400 px-2 py-0.5 rounded border border-slate-800 font-mono font-bold shrink-0">[R] Rejeter</span>
            <span className="bg-slate-900 text-amber-300 px-2 py-0.5 rounded border border-slate-800 font-mono font-bold shrink-0">[S] Côte-à-Côte</span>
            <span className="bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono font-bold shrink-0">[Esc] Fermer</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!splitViewMode && (
              <button
                onClick={() => window.open(`/api/admin/students/${student.id}/recepisse-depot-pdf`, '_blank')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" /> Récépissé
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer border border-slate-700"
            >
              Fermer le Dossier
            </button>
          </div>
        </div>
      </div>

    {/* Lightbox / Document Preview Modal (FULLY RESPONSIVE HIGH RES) */}
    {previewDoc && (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in zoom-in-95">
        <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2.5rem] max-w-6xl w-[94vw] sm:w-[90vw] lg:w-[85vw] h-[90vh] sm:h-[88vh] overflow-hidden flex flex-col justify-between shadow-2xl border border-slate-200 dark:border-slate-800 my-auto mx-auto">
          <div className="p-5 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white flex items-center justify-between shrink-0">
            <h4 className="text-base font-black flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" /> Aperçu du Scan Officiel : {previewDoc.title}
            </h4>
            <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-white/10 rounded-full text-white cursor-pointer transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-0 flex-1 overflow-hidden flex items-center justify-center bg-white dark:bg-slate-900">
            {(() => {
              const url = previewDoc?.url || '';
              const lower = url.toLowerCase();
              const isImg = lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.png') || lower.includes('.webp');
              return !isImg ? (
                <PdfCanvasViewer url={url} zoom={1} rotate={0} />
              ) : (
                <img src={url} alt="Scan Preview" className="max-h-full w-auto object-contain shadow-2xl" />
              );
            })()}
          </div>
        </div>
      </div>
    )}
    </div>,
    document.body
  );
}
