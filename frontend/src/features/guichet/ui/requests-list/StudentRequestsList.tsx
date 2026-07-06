import React from 'react';
import { useStudentRequests } from '../../api/guichetApi';
import { DocumentRequestStatus } from '../../model/types';

const StatusBadge: React.FC<{ status: DocumentRequestStatus }> = ({ status }) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    ready: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const labels = {
    pending: 'En attente',
    processing: 'En cours',
    ready: 'Prêt',
    rejected: 'Rejeté',
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>
      {labels[status]}
    </span>
  );
};

export const StudentRequestsList: React.FC = () => {
  const { data: requests, isLoading, isError } = useStudentRequests();

  if (isLoading) return <div className="p-4">Chargement de vos demandes...</div>;
  if (isError) return <div className="p-4 text-red-600">Erreur lors du chargement des demandes.</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800">Mes Demandes</h2>
      </div>
      
      {(!requests || requests.length === 0) ? (
        <div className="p-6 text-center text-gray-500">
          Vous n'avez aucune demande en cours.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                <th className="p-4 font-medium">Document</th>
                <th className="p-4 font-medium">Date de demande</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium">Fichier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-800">
                    {req.document_type?.name}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(req.requested_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={req.status} />
                    {req.status === 'rejected' && req.admin_notes?.reason && (
                      <p className="text-xs text-red-600 mt-1">Motif: {req.admin_notes.reason}</p>
                    )}
                  </td>
                  <td className="p-4">
                    {req.status === 'ready' && req.media && req.media.length > 0 ? (
                      <a 
                        href={req.media[0].original_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        Télécharger
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
