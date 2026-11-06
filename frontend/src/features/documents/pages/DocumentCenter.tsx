import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FileText,QrCode,Download,ShieldCheck,CheckCircle2 } from 'lucide-react';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

export default function DocumentCenter() {
  const { t } = useTranslation('documents');
  const [isGenerating, setIsGenerating] = useState(false);
  const [document, setDocument] = useState<{ request_id: number; verification_token: string; name?: string } | null>(null);
  const [docType, setDocType] = useState('');
  const [studentId, setStudentId] = useState('');
  const { data: types = [], isError } = useQuery({
    queryKey: ['document-center-types'],
    queryFn: async () => {
      const response = await api.get<{ data: { id: number; name: string; is_active: boolean }[] }>('/dashboard/document-types');
      return response.data.data.filter(type => type.is_active);
    },
  });

  const generateDocument = async () => {
    setIsGenerating(true);
    setDocument(null);
    try {
      const res = await api.post<{ data: { request_id: number; verification_token: string } }>('/documents/generate', {
        student_id: Number(studentId),
        document_type_id: Number(docType),
      });
      setDocument({ ...res.data.data, name: types.find(type => type.id === Number(docType))?.name });
      toast.success(t('center.generated'));
    } catch {
      toast.error(t('center.generation_failed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDocument = async (requestId: number) => {
    try {
      const response = await api.get<Blob>(`/admin/document-requests/${requestId}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `document-${requestId}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error(t('center.download_failed'));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-foreground flex items-center gap-2 erp-page-title">
          <FileText className="w-6 h-6 text-primary" />
          {t('center.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('center.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Panel */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-fit">
          <h2 className="font-semibold text-lg mb-4">{t('center.generate_heading')}</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="document-center-type" className="block text-sm font-medium mb-1">{t('center.type')}</label>
              <select id="document-center-type" value={docType} onChange={e => setDocType(e.target.value)} className="w-full border-input bg-background p-2.5 text-sm rounded-[var(--control-radius)]">
                <option value="">{t(isError ? 'center.types_unavailable' : 'center.choose_type')}</option>
                {types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </div>
            
            <div>
              <label htmlFor="document-center-student" className="block text-sm font-medium mb-1">{t('center.student_id')}</label>
              <input id="document-center-student" type="number" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder={t('center.student_placeholder')} className="w-full border-input bg-background p-2.5 text-sm rounded-[var(--control-radius)]" />
            </div>

            <button
              onClick={generateDocument}
              disabled={isGenerating || !docType || !Number.isInteger(Number(studentId)) || Number(studentId) < 1}
              className="w-full mt-2 bg-[#1F3A5F] hover:bg-[#152842] text-white px-5 py-3 rounded-xl font-medium flex justify-center items-center gap-2 transition-all disabled:opacity-70"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <QrCode className="w-5 h-5" />
              )}
              {t('center.generate')}
            </button>
          </div>
        </div>

        {/* Result Preview */}
        <div className="bg-muted/30 border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          {document ? (
            <div className="w-full space-y-4">
              <div className="bg-emerald-500/10 text-emerald-700 p-3 rounded-lg flex items-center justify-center gap-2 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                {t('center.ready')}
              </div>
              
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm text-start">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{document.name ?? t('center.official_document')}</h3>
                  </div>
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                
                <div className="bg-muted p-3 rounded-lg text-xs break-all font-mono text-muted-foreground border border-border">
                  {t('center.token')} <bdi dir="ltr">{document.verification_token}</bdi>
                </div>

                <div className="mt-4 flex gap-3">
                  <button onClick={() => void downloadDocument(document.request_id)} className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                    <Download className="w-4 h-4" />
                    {t('center.download')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <ShieldCheck className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground max-w-sm">
                {t('center.preview_help')}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
