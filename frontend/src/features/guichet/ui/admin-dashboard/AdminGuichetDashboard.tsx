import React, { useState } from 'react';
import { useAdminRequests, useUpdateDocumentRequestStatus } from '../../api/guichetApi';
import { DocumentRequest, DocumentRequestStatus } from '../../model/types';

export const AdminGuichetDashboard: React.FC = () => {
  const { data: requests, isLoading } = useAdminRequests();
  const { mutate: updateStatus } = useUpdateDocumentRequestStatus();
  
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleStatusChange = (id: number, status: DocumentRequestStatus, admin_notes?: any) => {
    updateStatus({ id, status, admin_notes });
    setSelectedRequest(null);
    setRejectionReason('');
  };

  if (isLoading) return <div className="p-6">Chargement du tableau de bord...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Guichet Électronique - Administration</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b">
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Étudiant (CIN)</th>
              <th className="p-4 font-medium">Document</th>
              <th className="p-4 font-medium">Statut</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests?.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="p-4 text-sm text-gray-500">#{req.id}</td>
                <td className="p-4">
                  <div className="font-medium text-gray-800">
                    {req.student?.user?.first_name} {req.student?.user?.last_name}
                  </div>
                  <div className="text-xs text-gray-500">CIN: {req.student?.user?.cin}</div>
                </td>
                <td className="p-4 text-sm text-gray-700">{req.document_type?.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                    ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${req.status === 'processing' ? 'bg-blue-100 text-blue-800' : ''}
                    ${req.status === 'ready' ? 'bg-green-100 text-green-800' : ''}
                    ${req.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {req.status}
                  </span>
                </td>
                <td className="p-4 space-x-2">
                  {req.status === 'pending' && (
                    <button 
                      onClick={() => handleStatusChange(req.id, 'processing')}
                      className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-sm font-medium transition-colors"
                    >
                      Traiter
                    </button>
                  )}
                  {req.status === 'processing' && (
                    <button 
                      onClick={() => handleStatusChange(req.id, 'ready')}
                      className="px-3 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded text-sm font-medium transition-colors"
                    >
                      Générer PDF
                    </button>
                  )}
                  {(req.status === 'pending' || req.status === 'processing') && (
                    <button 
                      onClick={() => setSelectedRequest(req)}
                      className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-medium transition-colors"
                    >
                      Rejeter
                    </button>
                  )}
                  {req.status === 'ready' && req.media && req.media.length > 0 && (
                    <a 
                      href={req.media[0].original_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
                    >
                      Voir PDF
                    </a>
                  )}
                </td>
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
                onClick={() => handleStatusChange(selectedRequest.id, 'rejected', { reason: rejectionReason })}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
