import React from 'react';
import { useStartSession, useCloseSession } from '../../api/useAbsencesProfessor';
import { Button } from '@shared/components/ui/Button';

export default function ProfessorAbsencesView() {
  const { mutate: startSession, isPending: isStarting } = useStartSession();
  const { mutate: closeSession, isPending: isClosing } = useCloseSession();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion des Absences (Professeur)</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <p className="mb-4 text-slate-600">
          Sélectionnez un module et un groupe pour démarrer l'appel (génération de code QR ou appel manuel).
        </p>
        <div className="flex gap-4">
          <Button 
            onClick={() => startSession({ module_id: 1, group_id: 1, room_name: 'Amphi A' })}
            disabled={isStarting}
          >
            Démarrer l'appel
          </Button>
          <Button variant="outline" disabled={isClosing}>
            Clôturer la session
          </Button>
        </div>
      </div>
    </div>
  );
}
