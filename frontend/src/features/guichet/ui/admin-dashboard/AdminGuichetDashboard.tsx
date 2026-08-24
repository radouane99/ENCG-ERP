import React, { useState } from 'react';
import { useAdminRequests, useUpdateDocumentRequestStatus } from '../../api/guichetApi';
import { DocumentRequest, DocumentRequestStatus } from '../../model/types';
import { documentStatusLabel } from '@shared/lib/lmd';
import PageHeader from '@shared/components/layout/PageHeader';

export const AdminGuichetDashboard: React.FC = () => {
  const { data: requests, isLoading } = useAdminRequests();
  const { mutate: updateStatus } = useUpdateDocumentRequestStatus();
  
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleStatusChange = (id: number, status: DocumentRequestStatus, admin_notes?: string | null) => {
    updateStatus({ id, status, admin_notes });
    setSelectedRequest(null);
    setRejectionReason('');
  };

  if (isLoading) return <div className="p-6">Chargement du tableau de bord...</div>;

  const renderActions = (req: DocumentRequest) => (
    <div className="flex flex-wrap gap-2">
      {req.status === 'pending' && (
        <button
          onClick={() => handleStatusChange(req.id, 'processing')}
          className="min-h-11 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-sm font-medium"
        >
          Traiter
        </button>
      )}
      {req.status === 'processing' && (
        <button
          onClick={() => handleStatusChange(req.id, 'ready')}
          className="min-h-11 px-3 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl text-sm font-medium"
        >
          Générer PDF
        </button>
      )}
      {(req.status === 'pending' || req.status === 'processing') && (
        <button
          onClick={() => setSelectedRequest(req)}
          className="min-h-11 px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-medium"
        >
          Rejeter
        </button>
      )}
      {req.status === 'ready' && (
        <button
          type="button"
          onClick={() => handleStatusChange(req.id, 'collected')}
          className="min-h-11 px-3 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl text-sm font-medium"
        >
          Marquer à retirer
        </button>
      )}
      {req.status === 'ready' && req.media && req.media.length > 0 && (
        <a
          href={req.media[0].original_url}
          target="_blank"
          rel="noreferrer"
          className="min-h-11 inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-sm font-medium"
        >
          Voir PDF
        </a>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Guichet Électronique" subtitle="Demandes administratives — En attente, Prêt, À retirer" />
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-border">

      <div className="md:hidden p-4 space-y-3">
        {requests?.map((req) => (
          <article key={req.id} className="rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-black text-sm text-primary dark:text-white">
                  {req.student?.user?.first_name} {req.student?.user?.last_name}
                </p>
                <p className="text-xs text-slate-500">#{req.id} · CIN {req.student?.user?.cin}</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                {documentStatusLabel(req.status)}
              </span>
            </div>
            <p className="text-sm font-medium">{req.document_type?.name}</p>
            {renderActions(req)}
          </article>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm border-b border-border">
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Étudiant (CIN)</th>
              <th className="p-4 font-medium">Document</th>
              <th className="p-4 font-medium">Statut</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests?.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-4 text-sm text-slate-500">#{req.id}</td>
                <td className="p-4">
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {req.student?.user?.first_name} {req.student?.user?.last_name}
                  </div>
                  <div className="text-xs text-slate-500">CIN: {req.student?.user?.cin}</div>
                </td>
                <td className="p-4 text-sm">{req.document_type?.name}</td>
                <td className="p-4">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800">
                    {documentStatusLabel(req.status)}
                  </span>
                </td>
                <td className="p-4">{renderActions(req)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rejection Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4">Rejeter la demande #{selectedRequest.id}</h3>
            <textarea
              className="w-full border border-gray-300 rounded p-2 mb-4 focus:ring-red-500 focus:border-red-500"
              rows={4}
              placeholder="Motif du rejet (obligatoire)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Annuler
              </button>
              <button 
                disabled={!rejectionReason.trim()}
                onClick={() => handleStatusChange(selectedRequest.id, 'rejected', rejectionReason)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

// [Phase 8] Default export required for React.lazy() dynamic import
export default AdminGuichetDashboard;
