import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, Download } from 'lucide-react';

import AttestationTravailTemplate from '../components/templates/AttestationTravailTemplate';
import OrdreMissionTemplate from '../components/templates/OrdreMissionTemplate';
import ReleveNotesTemplate from '../components/templates/ReleveNotesTemplate';
import ConventionStageTemplate from '../components/templates/ConventionStageTemplate';

export default function DocumentPreviewPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();

  const currentType = type || 'attestation';

  const renderTemplate = () => {
    switch (currentType) {
      case 'attestation': return <AttestationTravailTemplate />;
      case 'mission': return <OrdreMissionTemplate />;
      case 'releve': return <ReleveNotesTemplate />;
      case 'convention': return <ConventionStageTemplate />;
      default: return <div className="p-8 text-center text-white/50">Document introuvable.</div>;
    }
  };

  const getTitle = () => {
    switch (currentType) {
      case 'attestation': return 'Attestation de Travail';
      case 'mission': return 'Ordre de Mission';
      case 'releve': return 'Relevé de Notes S1';
      case 'convention': return 'Convention de Stage';
      default: return 'Document';
    }
  };

  return (
    <div className="min-h-screen bg-white/[0.05]/50 flex flex-col">
      {/* Top Bar - Hidden when printing */}
      <div className="bg-white border-b border-white/10 px-8 py-4 flex justify-between items-center sticky top-0 z-50 print:hidden shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-gray-200 flex items-center justify-center text-white/70 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#002a7a]">Aperçu du document</h1>
            <p className="text-xs text-white/50">{getTitle()}</p>
          </div>
        </div>

        <div className="flex gap-2">          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#e6007e] hover:bg-[#c5006c] text-white px-6 py-2 rounded-xl font-bold text-sm uppercase tracking-wider transition-colors shadow-md shadow-[#e6007e]/30"
          >
            <Printer className="w-4 h-4" />
            Imprimer / PDF
          </button>
        </div>
      </div>

      {/* Document Container */}
      <div className="flex-1 overflow-auto py-10 print:py-0 print:overflow-visible flex justify-center">
        {/* The wrapper sets the A4 visual on screen, while print: classes ensure it prints properly */}
        <div className="print:shadow-none print:m-0 w-[210mm] min-h-[297mm]">
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
}
