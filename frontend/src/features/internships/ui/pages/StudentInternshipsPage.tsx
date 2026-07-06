import React, { useState } from 'react';
import { useStudentInternships } from '../../api/useInternshipsStudent';
import LoadingScreen from '@shared/components/ui/LoadingScreen';
import { InternshipStatusBadge } from '../components/InternshipStatusBadge';
import { Button } from '@shared/components/ui/Button';
import { DocumentUploadModal } from '../components/DocumentUploadModal';

export default function StudentInternshipsPage() {
  const { data: internships, isLoading } = useStudentInternships();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState<number | null>(null);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Mes Stages & PFE</h1>
        <Button>Nouvelle Demande</Button>
      </div>

      <div className="grid gap-6">
        {internships?.map((internship) => (
          <div key={internship.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{internship.position_title}</h3>
                <p className="text-slate-600">{internship.company_name} - {internship.company_city}</p>
                <p className="text-sm text-slate-500 mt-1">
                  Du {new Date(internship.start_date).toLocaleDateString()} au {new Date(internship.end_date).toLocaleDateString()}
                </p>
              </div>
              <InternshipStatusBadge status={internship.status} />
            </div>

            <div className="mt-6 flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedInternship(internship.id);
                  setUploadModalOpen(true);
                }}
              >
                Uploader un rapport / document
              </Button>
            </div>
          </div>
        ))}
        {internships?.length === 0 && (
          <div className="bg-white p-8 text-center rounded-lg border border-slate-200">
            <p className="text-slate-500">Vous n'avez aucune demande de stage en cours.</p>
          </div>
        )}
      </div>

      {selectedInternship && (
        <DocumentUploadModal 
          internshipId={selectedInternship}
          isOpen={uploadModalOpen} 
          onClose={() => setUploadModalOpen(false)} 
        />
      )}
    </div>
  );
}
