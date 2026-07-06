import { useState } from 'react';
import { useStudentDocumentRequests, useCreateDocumentRequest, useDownloadDocumentRequest } from '../api/useDocumentRequests';
import { useDocumentTypes } from '../api/useDocumentTypes';
import { DocumentStatusBadge } from '../components/DocumentStatusBadge';
import { FileText, Download, Plus, Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/Button';

export default function StudentDocumentRequestsPage() {
  const { data: requests, isLoading } = useStudentDocumentRequests();
  const { data: documentTypes } = useDocumentTypes();
  const createMutation = useCreateDocumentRequest();
  const downloadMutation = useDownloadDocumentRequest();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('');

  const handleCreate = () => {
    if (!selectedType) return;
    createMutation.mutate({ document_template_id: parseInt(selectedType) }, {
      onSuccess: () => {
        setIsModalOpen(false);
        setSelectedType('');
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes Documents</h1>
          <p className="text-muted-foreground text-sm">Demandez et téléchargez vos attestations.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle Demande
        </Button>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Référence</th>
                <th className="px-6 py-3 font-semibold">Document</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold text-center">Statut</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests?.map((r: any) => (
                <tr key={r.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 font-mono font-medium">{r.reference_number}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground"/> {r.template?.name || 'Document'}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center">
                    <DocumentStatusBadge status={r.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.status === 'ready' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => downloadMutation.mutate(r.id)}
                        disabled={downloadMutation.isPending}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {(!requests || requests.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">Aucune demande trouvée.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nouvelle demande</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type de document</label>
                <select 
                  className="w-full mt-1 border rounded-lg p-2 bg-background"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="">Sélectionnez un document</option>
                  {documentTypes?.filter((t: any) => t.is_active).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button onClick={handleCreate} disabled={!selectedType || createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
