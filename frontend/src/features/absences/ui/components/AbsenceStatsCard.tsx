import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@shared/components/ui/Card';
import { GlobalAbsenceStats } from '../../model/types';

interface Props {
  stats: GlobalAbsenceStats;
}

export const AbsenceStatsCard: React.FC<Props> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Présents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.present}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Absents (Injustifiés)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Retards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">{stats.late}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Absences Justifiées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.excused}</div>
        </CardContent>
      </Card>
    </div>
  );
};
