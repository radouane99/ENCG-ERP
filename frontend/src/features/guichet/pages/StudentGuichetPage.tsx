import React from 'react';
import { DocumentRequestForm } from '../ui/request-form/DocumentRequestForm';
import { StudentRequestsList } from '../ui/requests-list/StudentRequestsList';

const StudentGuichetPage: React.FC = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Guichet Électronique</h1>
        <p className="text-gray-500 mt-2">Gérez vos demandes de documents administratifs en toute simplicité.</p>
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
