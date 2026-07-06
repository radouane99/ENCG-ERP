import React from 'react';

interface Props {
  status: 'draft' | 'sent' | 'viewed' | 'printed';
}

export const ConvocationStatusBadge: React.FC<Props> = ({ status }) => {
  const getBadgeClass = () => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-yellow-100 text-yellow-800';
      case 'printed': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const labels = {
    draft: 'Brouillon',
    sent: 'Envoyée',
    viewed: 'Consultée',
    printed: 'Imprimée',
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeClass()}`}>
      {labels[status] || status}
    </span>
  );
};
