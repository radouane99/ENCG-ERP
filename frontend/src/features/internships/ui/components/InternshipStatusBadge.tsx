import React from 'react';

interface Props {
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

export const InternshipStatusBadge: React.FC<Props> = ({ status }) => {
  const getBadgeClass = () => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const labels = {
    pending: 'En attente',
    approved: 'Approuvé',
    completed: 'Terminé',
    rejected: 'Rejeté',
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeClass()}`}>
      {labels[status] || status}
    </span>
  );
};
