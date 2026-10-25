import { useState } from 'react';
import { useAdminJustifications,useUpdateJustificationStatus } from '../../api/absencesApi';
import { AbsenceJustification } from '../../model/types';

export default function AdminAbsencesPage() {
  const { data: justifications, isLoading } = useAdminJustifications();
  const { mutate: updateStatus, isPending } = useUpdateJustificationStatus();

  const [selectedJustification, setSelectedJustification] = useState<AbsenceJustification | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleUpdate = (id: number, status: string, reason?: string) => {
    updateStatus({ id, status, rejection_reason: reason }, {
      onSuccess: () => {
        setSelectedJustification(null);
        setRejectionReason('');
      }
    });
  };

  if (isLoading) return <div className="p-8">Chargement des justificatifs...</div>;

  return (
    <div className="">
      <div className="mb-8">
        <h1 className="text-foreground erp-page-title">Validation des Absences</h1>
        <p className="text-muted-foreground">Gérez les justificatifs médicaux soumis par les étudiants.</p>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Étudiant</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Séance (Module)</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Motif & PJ</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {justifications?.map((j: AbsenceJustification) => (
              <tr key={j.id} className="hover:bg-muted/50">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{j.student?.user?.first_name} {j.student?.user?.last_name}</div>
                  <div className="text-xs text-muted-foreground">CIN: {j.student?.user?.cin}</div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {j.attendance?.attendanceSession?.module?.name}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="font-medium text-slate-700 capitalize">{j.reason}</div>
                  {j.media && j.media.length > 0 && (
                    <a href={j.media[0].original_url} target="_blank" rel="noreferrer" className="text-primary hover:underline mt-1 inline-block">Voir le fichier</a>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    j.status === 'approved' ? 'bg-green-100 text-green-800' :
                    j.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {j.status}
                  </span>
                </td>
                <td className="px-6 py-4 space-x-2">
                  {j.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleUpdate(j.id, 'approved')}
                        disabled={isPending}
                        className="px-3 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded text-sm font-medium"
                      >
                        Accepter
                      </button>
                      <button 
                        onClick={() => setSelectedJustification(j)}
                        className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-medium"
                      >
                        Rejeter
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedJustification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl p-6 max-w-sm w-full shadow-sm">
            <h3 className="text-lg font-bold mb-4">Rejeter le justificatif</h3>
            <textarea
              className="w-full border border-slate-300 rounded p-2 mb-4 rounded-[var(--control-radius)]"
              rows={3}
              placeholder="Motif de refus..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end space-x-3">
              <button onClick={() => setSelectedJustification(null)} className="px-4 py-2 text-muted-foreground">Annuler</button>
              <button 
                onClick={() => handleUpdate(selectedJustification.id, 'rejected', rejectionReason)}
                disabled={!rejectionReason.trim() || isPending}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
