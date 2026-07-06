import React from 'react';
import { useAdminInternships, useValidateInternship } from '../../api/useInternshipsAdmin';
import LoadingScreen from '@shared/components/ui/LoadingScreen';
import { InternshipStatusBadge } from '../components/InternshipStatusBadge';
import { Button } from '@shared/components/ui/Button';

export default function AdminInternshipsPage() {
  const { data: internships, isLoading } = useAdminInternships();
  const { mutate: validate } = useValidateInternship();

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Gestion des Stages & PFE</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Étudiant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Entreprise</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {internships?.map((internship) => (
              <tr key={internship.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  ID: {internship.student_id} {/* Replace with relation if loaded */}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {internship.company_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <InternshipStatusBadge status={internship.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {internship.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        className="mr-2"
                        onClick={() => validate({ id: internship.id, status: 'approved' })}
                      >
                        Approuver
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => validate({ id: internship.id, status: 'rejected' })}
                      >
                        Rejeter
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
