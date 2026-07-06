import React, { useState } from 'react';
import { useAdminConvocations, useGenerateConvocations, usePublishConvocations } from '../../api/useConvocationsAdmin';
import LoadingScreen from '@shared/components/ui/LoadingScreen';
import { ConvocationStatusBadge } from '../components/ConvocationStatusBadge';
import { Button } from '@shared/components/ui/Button';

export default function AdminConvocationsPage() {
  const [examId, setExamId] = useState(1); // Default to exam 1 for MVP
  const [roomId, setRoomId] = useState(1); // Default to room 1 for MVP
  
  const { data: convocations, isLoading } = useAdminConvocations(examId);
  const { mutate: generate, isPending: isGenerating } = useGenerateConvocations();
  const { mutate: publish, isPending: isPublishing } = usePublishConvocations();

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Gestion des Convocations</h1>
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

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Étudiant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Place N°</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Référence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {convocations?.map((convocation) => (
              <tr key={convocation.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  ID: {convocation.student_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {convocation.seat_number || 'Non assigné'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                  {convocation.reference.split('-')[0]}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ConvocationStatusBadge status={convocation.status} />
                </td>
              </tr>
            ))}
            {convocations?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
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
