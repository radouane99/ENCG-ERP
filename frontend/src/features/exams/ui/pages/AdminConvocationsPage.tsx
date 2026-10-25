import { useState } from 'react';
import { useAdminConvocations,useGenerateConvocations,usePublishConvocations } from '../../api/useConvocationsAdmin';
import LoadingScreen from '@shared/components/ui/LoadingScreen';
import { ConvocationStatusBadge } from '../components/ConvocationStatusBadge';
import { Button } from '@shared/components/ui/Button';

export default function AdminConvocationsPage() {
  const [examId] = useState(1); // Default to exam 1 for MVP
  const [roomId] = useState(1); // Default to room 1 for MVP
  
  const { data: convocations, isLoading } = useAdminConvocations(examId);
  const { mutate: generate, isPending: isGenerating } = useGenerateConvocations();
  const { mutate: publish, isPending: isPublishing } = usePublishConvocations();

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-foreground erp-page-title">Gestion des Convocations</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => generate({ examId, roomId })}
            disabled={isGenerating}
          >
            Générer pour l'examen {examId}
          </Button>
          <Button 
            onClick={() => publish(examId)}
            disabled={isPublishing}
          >
            Publier les Convocations
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Étudiant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Place N°</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Référence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-slate-200">
            {convocations?.map((convocation) => (
              <tr key={convocation.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  ID: {convocation.student_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {convocation.seat_number || 'Non assigné'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                  {convocation.reference.split('-')[0]}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ConvocationStatusBadge status={convocation.status} />
                </td>
              </tr>
            ))}
            {convocations?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                  Aucune convocation générée pour cet examen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
