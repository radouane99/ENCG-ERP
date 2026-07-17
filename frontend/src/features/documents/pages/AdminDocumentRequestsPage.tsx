import { useState } from 'react';
import { useAdminDocumentRequests, useUpdateDocumentRequestStatus, useGenerateDocumentRequest } from '../api/useDocumentRequests';
import { DocumentStatusBadge } from '../components/DocumentStatusBadge';
import { Search, FileText, FileOutput, Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/Button';

export default function AdminDocumentRequestsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: requests, isLoading } = useAdminDocumentRequests(statusFilter ? { status: statusFilter } : undefined);
  const updateStatus = useUpdateDocumentRequestStatus();
  const generatePdf = useGenerateDocumentRequest();

  const handleUpdateStatus = (id: number, status: string) => {
    updateStatus.mutate({ id, status });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Demandes</h1>
          <p className="text-muted-foreground text-sm">Traitez les demandes de documents des étudiants.</p>
        </div>
        <select 
          className="border rounded-lg p-2 bg-background text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="processing">En cours</option>
          <option value="ready">Prêt</option>
          <option value="rejected">Refusé</option>
        </select>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Référence</th>
                <th className="px-6 py-3 font-semibold">Étudiant</th>
                <th className="px-6 py-3 font-semibold">Document</th>
                <th className="px-6 py-3 font-semibold text-center">Statut</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests?.map((r: any) => (
                <tr key={r.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 font-mono font-medium">{r.reference_number}</td>
                  <td className="px-6 py-4 font-medium">{r.user?.name || `${r.user?.first_name || ''} ${r.user?.last_name || ''}`}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground"/> {r.template?.name}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <DocumentStatusBadge status={r.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 items-center">
                      {r.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200" onClick={() => handleUpdateStatus(r.id, 'processing')}>Accepter</Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => handleUpdateStatus(r.id, 'rejected')}>Refuser</Button>
                        </>
                      )}
                      {r.status === 'processing' && (
                        <>
                          <select 
                            className="border rounded-lg p-1 text-xs bg-background mr-2"
                            id={`signatory-${r.id}`}
                            defaultValue="LE DIRECTEUR DE L'ENCG FÈS"
                          >
                            <option value="LE DIRECTEUR DE L'ENCG FÈS">Directeur</option>
                            <option value="LE SECRÉTAIRE GÉNÉRAL">Secrétaire Général</option>
                            <option value="LE RESPONSABLE SCOLARITÉ">Responsable Scolarité</option>
                          </select>
                          <Button size="sm" onClick={() => {
                            const select = document.getElementById(`signatory-${r.id}`) as HTMLSelectElement;
                            generatePdf.mutate({ id: r.id, signatoryTitle: select.value });
                          }} disabled={generatePdf.isPending}>
                             <FileOutput className="w-4 h-4 mr-2" /> Générer
                          </Button>
                        </>
                      )}
                    </div>
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
    </div>
  );
}
