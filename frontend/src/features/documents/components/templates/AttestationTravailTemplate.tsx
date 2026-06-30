import React from 'react';

export default function AttestationTravailTemplate() {
  return (
    <div className="w-[210mm] min-h-[297mm] bg-white mx-auto shadow-xl print:shadow-none print:w-full print:h-auto font-sans relative overflow-hidden bg-white">
      {/* Outer borders */}
      <div className="absolute inset-4 border-[3px] border-[#002a7a] pointer-events-none"></div>
      <div className="absolute inset-[1.25rem] border border-[#002a7a] pointer-events-none"></div>

      <div className="p-12 h-full flex flex-col">
        {/* Header Section */}
        <div className="flex justify-between items-center border-b-[3px] border-[#002a7a] pb-4 mb-4">
          <div className="text-[10px] font-bold text-[#002a7a] leading-tight w-1/3">
            <p>ROYAUME DU MAROC</p>
            <p>UNIVERSITÉ PRIVÉE DE FÈS</p>
            <p className="font-medium mt-1">École Supérieure d'Ingénierie</p>
            <p className="font-medium">et de Technologie de Fès</p>
          </div>
          
          <div className="w-1/3 flex flex-col items-center">
            {/* Mock Logo placeholder since we don't have the image file in the codebase, or we can use an img tag if it exists */}
            <div className="font-black text-3xl tracking-tight text-[#002a7a] mb-1 flex items-baseline">
              UPF<span className="text-[#e6007e]">.</span>
            </div>
            <p className="text-xs text-[#002a7a] font-bold tracking-widest uppercase">University</p>
            <p className="text-[9px] font-bold text-[#002a7a] mt-1">UNIVERSITÉ PRIVÉE DE FÈS</p>
          </div>

          <div className="text-[10px] font-bold text-[#e6007e] text-right leading-tight w-1/3 font-arabic">
            <p>Ø§Ù„Ù…Ù…Ù„ÙƒØ© Ø§Ù„Ù…ØºØ±Ø¨ÙŠØ©</p>
            <p>Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø®Ø§ØµØ© Ù„ÙØ§Ø³</p>
            <p className="font-medium mt-1">Ø§Ù„Ù…Ø¯Ø±Ø³Ø© Ø§Ù„Ø¹Ù„ÙŠØ§ Ù„Ù„Ù‡Ù†Ø¯Ø³Ø©</p>
            <p className="font-medium">ÙˆØ§Ù„ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø¨ÙØ§Ø³</p>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex justify-end items-center gap-6 mb-8 text-[11px] font-bold text-[#002a7a]">
          <div>Réf : <span className="font-medium text-white/80">2026/ATT-TRAV/0008</span></div>
          <div>Émis le : <span className="font-medium text-white/80">24/06/2026</span></div>
          <div className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-600 rounded-full text-[10px]">
            âœ“ DOCUMENT OFFICIEL VALIDÉ
          </div>
        </div>

        {/* Document Title */}
        <div className="border border-white/10 bg-white/[0.02]/50 rounded-2xl py-6 text-center mb-10">
          <p className="text-[10px] font-bold text-[#e6007e] uppercase tracking-[0.2em] mb-2">
            Document Administratif Officiel
          </p>
          <h1 className="text-3xl font-bold text-[#002a7a] uppercase tracking-wide serif">
            Attestation de Travail
          </h1>
        </div>

        {/* Content Body */}
        <div className="flex-1 space-y-8 text-[13px] text-white/90 leading-relaxed">
          <p className="text-justify">
            Le Secrétariat Général de l'<strong className="text-white">Université Privée de Fès (UPF)</strong> certifie par la présente que la personne dont l'identité est précisée ci-dessous est bien employée en qualité de <strong className="text-white">membre du corps enseignant</strong> au sein de notre établissement.
          </p>

          {/* Details Table */}
          <div className="border border-white/10">
            <div className="grid grid-cols-[160px_1fr] border-b border-white/10">
              <div className="p-4 text-[10px] font-bold text-[#002a7a] uppercase tracking-wider bg-white/[0.02]/50">Nom Complet</div>
              <div className="p-4 font-bold text-white bg-white">Prof. Radouane el asri</div>
            </div>
            <div className="grid grid-cols-[160px_1fr] border-b border-white/10">
              <div className="p-4 text-[10px] font-bold text-[#002a7a] uppercase tracking-wider bg-white/[0.02]/50">Département</div>
              <div className="p-4 font-bold text-white bg-white">Génie Informatique</div>
            </div>
            <div className="grid grid-cols-[160px_1fr] border-b border-white/10">
              <div className="p-4 text-[10px] font-bold text-[#002a7a] uppercase tracking-wider bg-white/[0.02]/50">Statut</div>
              <div className="p-4 font-bold text-white bg-white">Enseignant(e)-Chercheur(se) â€” Temps plein</div>
            </div>
            <div className="grid grid-cols-[160px_1fr] border-b border-white/10">
              <div className="p-4 text-[10px] font-bold text-[#002a7a] uppercase tracking-wider bg-white/[0.02]/50">Établissement</div>
              <div className="p-4 font-bold text-white bg-white">Université Privée de Fès (UPF)</div>
            </div>
            <div className="grid grid-cols-[160px_1fr]">
              <div className="p-4 text-[10px] font-bold text-[#002a7a] uppercase tracking-wider bg-white/[0.02]/50">Année Universitaire</div>
              <div className="p-4 font-bold text-white bg-white">2025-2026</div>
            </div>
          </div>

          <p className="text-justify">
            Cette attestation est délivrée Ã  l'intéressé(e) sur sa demande, pour servir et valoir ce que de droit, et ce sans aucune autre obligation de la part de notre institution.
          </p>
        </div>

        {/* Footer Signatures */}
        <div className="mt-16 flex justify-between items-end pb-8">
          <div className="text-center w-1/3">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-8">Signature de l'intéressé(e)</p>
            <p className="font-bold text-sm text-white">Prof. Radouane el asri</p>
          </div>
          
          <div className="w-1/3 flex justify-center">
            {/* Mock Seal */}
            <div className="w-24 h-24 border-2 border-[#002a7a] rounded-full flex flex-col items-center justify-center p-2 opacity-80">
              <div className="w-full h-full border border-[#002a7a] rounded-full flex flex-col items-center justify-center text-[8px] text-[#002a7a] font-bold text-center leading-tight">
                <p>UNIVERSITÉ PRIVÉE<br/>DE FÈS</p>
                <p className="text-sm font-black my-0.5">â˜… UPF â˜…</p>
                <p>Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø®Ø§ØµØ© Ù„ÙØ§Ø³</p>
              </div>
            </div>
          </div>

          <div className="text-center w-1/3">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-8">Fait Ã  Fès, le 24/06/2026</p>
            <p className="font-bold text-sm text-white uppercase">Le Directeur des RH</p>
          </div>
        </div>
      </div>
    </div>
  );
}
