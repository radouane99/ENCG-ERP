import React,{ useState } from 'react';
import { useDocumentTypes,useCreateDocumentRequest } from '../../api/guichetApi';

export const DocumentRequestForm: React.FC = () => {
  const { data: documentTypes, isLoading } = useDocumentTypes();
  const { mutate: createRequest, isPending } = useCreateDocumentRequest();
  const [selectedType, setSelectedType] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedType) {
      setError('Veuillez sélectionner un type de document.');
      return;
    }

    createRequest(Number(selectedType), {
      onSuccess: () => {
        setSuccess('Demande envoyée avec succès.');
        setSelectedType('');
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || 'Erreur lors de la demande.');
      },
    });
  };

  if (isLoading) return <div className="p-4">Chargement des documents...</div>;

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
      <h2 className="text-xl font-semibold mb-4 text-foreground">Nouvelle Demande</h2>
      
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="document_type" className="block text-sm font-medium text-gray-700 mb-1">
            Type de document
          </label>
          <select
            id="document_type"
            className="w-full p-2 border border-gray-300 focus:ring-ring focus:border-primary rounded-[var(--control-radius)]"
            value={selectedType}
            onChange={(e) => setSelectedType(Number(e.target.value))}
            disabled={isPending}
          >
            <option value="">-- Sélectionnez un document --</option>
            {documentTypes?.filter(dt => dt.is_active).map((dt) => (
              <option key={dt.id} value={dt.id}>
                {dt.name} {dt.fee_amount > 0 ? `(${dt.fee_amount} MAD)` : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending || !selectedType}
          className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Envoi en cours...' : 'Soumettre la demande'}
        </button>
      </form>
    </div>
  );
};
