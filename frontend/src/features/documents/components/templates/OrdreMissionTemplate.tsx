import React from 'react';

export default function OrdreMissionTemplate() {
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
          <div>Réf : <span className="font-medium text-white/80">2026/ORD-MISS/0002</span></div>
          <div>Émis le : <span className="font-medium text-white/80">24/06/2026</span></div>
          <div className="px-3 py-1 bg-pink-50 border border-pink-200 text-[#e6007e] rounded-full text-[10px]">
            âœ“ ORDRE OFFICIEL VALIDÉ
          </div>
        </div>

        {/* Document Title */}
        <div className="border border-pink-100 bg-pink-50/30 rounded-2xl py-6 text-center mb-10">
          <p className="text-[10px] font-bold text-[#002a7a] uppercase tracking-[0.2em] mb-2">
            Document Administratif Officiel
          </p>
          <h1 className="text-3xl font-bold text-[#e6007e] uppercase tracking-wide serif">
            Ordre de Mission
          </h1>
        </div>

        {/* Content Body */}
        <div className="flex-1 space-y-8 text-[13px] text-white/90 leading-relaxed">
          <p className="text-justify">
            Le Secrétariat Général de l'<strong className="text-white">Université Privée de Fès (UPF)</strong> ordonne par la présente Ã  l'enseignant(e) désigné(e) ci-dessous de se rendre dans le lieu indiqué aux dates spécifiées, afin d'accomplir la mission académique ou administrative décrite :
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
              <div className="p-4 text-[10px] font-bold text-[#002a7a] uppercase tracking-wider bg-white/[0.02]/50">Établissement</div>
              <div className="p-4 font-bold text-white bg-white">Université Privée de Fès (UPF)</div>
            </div>
            <div className="grid grid-cols-[160px_1fr] border-b border-white/10">
              <div className="p-4 text-[10px] font-bold text-[#002a7a] uppercase tracking-wider bg-white/[0.02]/50">Destination</div>
              <div className="p-4 font-bold text-[#002a7a] bg-white">Rabat</div>
            </div>
            <div className="grid grid-cols-[160px_1fr] border-b border-white/10">
              <div className="p-4 text-[10px] font-bold text-[#002a7a] uppercase tracking-wider bg-white/[0.02]/50">Période de Mission</div>
              <div className="p-4 font-bold text-white bg-white">Du <span className="text-[#002a7a]">01/06/2026</span> au <span className="text-[#002a7a]">06/06/2026</span></div>
            </div>
            <div className="grid grid-cols-[160px_1fr]">
              <div className="p-4 text-[10px] font-bold text-[#002a7a] uppercase tracking-wider bg-white/[0.02]/50">Objet / Motif</div>
              <div className="p-4 font-bold text-white bg-white">Participation évènement</div>
            </div>
          </div>

          <div className="p-4 border border-white/10 bg-white/[0.02] italic text-white/50 text-xs text-justify">
            Les autorités locales de la destination et tous représentants des services publics et de la force publique sont priés de faciliter l'accomplissement de la mission de l'intéressé(e) et de lui prêter assistance en cas de besoin.
          </div>
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
                <p>SECRÉTARIAT</p>
              </div>
            </div>
          </div>

          <div className="text-center w-1/3">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-8">Fait Ã  Fès, le 24/06/2026</p>
            <p className="font-bold text-sm text-white uppercase">Le Secrétaire Général</p>
          </div>
        </div>
      </div>
    </div>
  );
}
