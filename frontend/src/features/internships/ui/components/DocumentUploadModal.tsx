import React, { useState } from 'react';
import { Button } from '@shared/components/ui/Button';
import { useUploadInternshipDocument } from '../../api/useInternshipsStudent';

interface Props {
  internshipId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentUploadModal: React.FC<Props> = ({ internshipId, isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('rapport_final');
  const { mutate: upload, isPending } = useUploadInternshipDocument();

  if (!isOpen) return null;

  const handleUpload = () => {
    if (file) {
      upload({ internshipId, file, documentType: docType }, {
        onSuccess: () => {
          onClose();
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Uploader un document</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Type de document</label>
          <select 
            className="w-full border p-2 rounded"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          >
            <option value="convention">Convention signée</option>
            <option value="rapport_etape">Rapport d'étape</option>
            <option value="rapport_final">Rapport final (PFE)</option>
            <option value="attestation">Attestation de stage</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Fichier (PDF, DOC)</label>
          <input 
            type="file" 
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border p-2 rounded"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleUpload} disabled={!file || isPending}>
            {isPending ? 'Envoi...' : 'Envoyer'}
          </Button>
        </div>
      </div>
    </div>
  );
};
