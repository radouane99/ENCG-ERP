import React from 'react';
import { useStudentConvocations, useDownloadConvocation } from '../../api/useConvocationsStudent';
import LoadingScreen from '@shared/components/ui/LoadingScreen';
import { ConvocationStatusBadge } from '../components/ConvocationStatusBadge';
import { Button } from '@shared/components/ui/Button';

export default function StudentConvocationsPage() {
  const { data: convocations, isLoading } = useStudentConvocations();
  const { mutate: download } = useDownloadConvocation();

  if (isLoading) return <LoadingScreen />;

  const handleDownload = (id: number) => {
    download(id, {
      onSuccess: (data) => {
        // En vrai: window.open(data.pdf_url, '_blank')
        alert(`Le PDF sera téléchargé depuis: ${data.pdf_url}`);
      }
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Mes Convocations</h1>
      </div>

      <div className="grid gap-6">
        {convocations?.map((conv) => (
          <div key={conv.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  Examen: Module #{conv.exam?.module_id}
                </h3>
                <p className="text-slate-600">
                  Date : {conv.exam ? new Date(conv.exam.exam_date).toLocaleDateString() : 'Non définie'} à {conv.exam?.start_time}
                </p>
                <div className="mt-2 bg-slate-50 p-3 rounded border border-slate-200 inline-block">
                  <p className="font-semibold">Salle : #{conv.room_id}</p>
                  <p className="font-bold text-lg text-blue-800">Place N° {conv.seat_number}</p>
                </div>
              </div>
              <ConvocationStatusBadge status={conv.status} />
            </div>

            <div className="mt-6">
              <Button onClick={() => handleDownload(conv.id)}>
                Télécharger la Convocation
              </Button>
            </div>
          </div>
        ))}
        {convocations?.length === 0 && (
          <div className="bg-white p-8 text-center rounded-lg border border-slate-200">
            <p className="text-slate-500">Vous n'avez aucune convocation disponible.</p>
          </div>
        )}
      </div>
    </div>
  );
}
