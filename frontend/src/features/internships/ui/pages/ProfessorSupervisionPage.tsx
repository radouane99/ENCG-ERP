import React from 'react';
import { useProfessorInternships, useEvaluateInternship } from '../../api/useInternshipsProfessor';
import LoadingScreen from '@shared/components/ui/LoadingScreen';
import { InternshipStatusBadge } from '../components/InternshipStatusBadge';
import { Button } from '@shared/components/ui/Button';

export default function ProfessorSupervisionPage() {
  const { data: internships, isLoading } = useProfessorInternships();
  const { mutate: evaluate } = useEvaluateInternship();

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Encadrement des Stages & PFE</h1>
      
      <div className="grid gap-6">
        {internships?.map((internship) => (
          <div key={internship.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold">{internship.position_title}</h3>
                <p className="text-slate-600">{internship.company_name} - {internship.company_city}</p>
              </div>
              <InternshipStatusBadge status={internship.status} />
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold text-sm text-slate-700 mb-2">Documents soumis :</h4>
              {/* This would map over internship.documents if populated */}
              <p className="text-sm text-slate-500 italic">Aucun document chargé.</p>
            </div>

            {internship.soutenance && internship.soutenance.status === 'scheduled' && (
              <div className="mt-4 p-4 bg-slate-50 rounded-md border border-slate-200">
                <p className="font-medium">Soutenance programmée le {new Date(internship.soutenance.date_time).toLocaleDateString()}</p>
                <div className="mt-2 flex gap-2 items-center">
                  <input type="number" placeholder="Note /20" className="border p-2 rounded w-24" id={`grade-${internship.id}`} />
                  <Button 
                    onClick={() => {
                      const gradeInput = document.getElementById(`grade-${internship.id}`) as HTMLInputElement;
                      if (gradeInput && gradeInput.value) {
                        evaluate({ id: internship.soutenance!.id, grade: parseFloat(gradeInput.value) });
                      }
                    }}
                  >
                    Valider la note
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {internships?.length === 0 && (
          <p className="text-slate-500">Vous n'avez aucun étudiant sous votre encadrement.</p>
        )}
      </div>
    </div>
  );
}
