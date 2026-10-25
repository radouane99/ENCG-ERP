import React from 'react';
import { DocumentRequestForm } from '../ui/request-form/DocumentRequestForm';
import { StudentRequestsList } from '../ui/requests-list/StudentRequestsList';

const StudentGuichetPage: React.FC = () => {
  return (
    <div data-testid="student-guichet-page" className="max-w-6xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-foreground erp-page-title">Guichet Électronique</h1>
        <p className="text-muted-foreground mt-2">Gérez vos demandes de documents administratifs en toute simplicité.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <DocumentRequestForm />
        </div>
        <div className="lg:col-span-2">
          <StudentRequestsList />
        </div>
      </div>
    </div>
  );
};

export default StudentGuichetPage;
