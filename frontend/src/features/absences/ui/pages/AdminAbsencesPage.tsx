import React from 'react';
import { useAdminAbsenceStats } from '../../api/useAbsencesAdmin';
import { AbsenceStatsCard } from '../components/AbsenceStatsCard';
import LoadingScreen from '@shared/components/ui/LoadingScreen';

export default function AdminAbsencesPage() {
  const { data: stats, isLoading } = useAdminAbsenceStats();

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Gestion des Absences</h1>
      </div>

      {stats && <AbsenceStatsCard stats={stats} />}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">Justifications en Attente</h2>
        {/* We would render a table here utilizing another hook like usePendingJustifications() */}
        <p className="text-slate-500">Aucune justification en attente de validation.</p>
      </div>
    </div>
  );
}
