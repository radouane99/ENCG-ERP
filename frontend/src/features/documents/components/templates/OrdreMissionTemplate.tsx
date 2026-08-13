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
            <p>ENCG FÈS</p>
            <p className="font-medium mt-1">École Nationale de Commerce</p>
            <p className="font-medium">et de Gestion de Fès</p>
          </div>
          
          <div className="w-1/3 flex flex-col items-center">
            <div className="font-black text-3xl tracking-tight text-[#002a7a] mb-1 flex items-baseline">
              ENCG<span className="text-[#e6007e]">.</span>
            </div>
            <p className="text-[10px] font-bold text-[#e6007e] uppercase tracking-wider text-center">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</p>
            <p className="text-[9px] font-bold text-[#002a7a] mt-1">ENCG FÈS</p>
          </div>

          <div className="text-[10px] font-bold text-[#002a7a] text-right leading-tight w-1/3 font-arabic">
            <p>المملكة المغربية</p>
            <p>المدرسة الوطنية للتجارة والتسيير بفاس</p>
            <p className="font-medium mt-1">جامعة سيدي محمد بن عبد الله</p>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex justify-end items-center gap-6 mb-8 text-[11px] font-bold text-[#002a7a]">
          <div>Réf : <span className="font-medium text-slate-600">2026/ORD-MISS/0002</span></div>
          <div>Émis le : <span className="font-medium text-slate-600">24/06/2026</span></div>
          <div className="px-3 py-1 bg-pink-50 border border-pink-200 text-[#e6007e] rounded-full text-[10px]">
            ✓ ORDRE OFFICIEL VALIDÉ
          </div>
        </div>

        {/* Document Title */}
        <h1 className="text-xl font-bold text-[#002a7a] uppercase tracking-wider text-center mb-8 serif">
          Ordre de Mission Officiel
        </h1>

        {/* Main Body Content */}
        <div className="space-y-6 text-slate-800 text-sm leading-relaxed mb-8 flex-1">
          <p>
            Le Secrétariat Général de l'<strong className="text-[#002a7a]">École Nationale de Commerce et de Gestion de Fès (ENCG Fès)</strong> ordonne par la présente à l'enseignant(e) désigné(e) ci-dessous de se rendre dans le lieu indiqué aux dates spécifiées, afin d'accomplir la mission académique ou administrative décrite :
          </p>

          {/* Details Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[160px_1fr] border-b border-slate-200">
              <div className="p-4 text-[10px] font-bold text-[#002a7a] uppercase tracking-wider bg-slate-50">Nom Complet</div>
              <div className="p-4 font-bold text-slate-900 bg-white">Prof. Radouane el asri</div>
            </div>
            <div className="grid grid-cols-[160px_1fr] border-b border-slate-200">
              <div className="p-4 text-[10px] font-bold text-[#002a7a] uppercase tracking-wider bg-slate-50">Département</div>
              <div className="p-4 font-bold text-slate-900 bg-white">Management & Commerce</div>
            </div>
            <div className="grid grid-cols-[160px_1fr] border-b border-slate-200">
              <div className="p-4 text-[10px] font-bold text-[#002a7a] uppercase tracking-wider bg-slate-50">Établissement</div>
              <div className="p-4 font-bold text-slate-900 bg-white">École Nationale de Commerce et de Gestion de Fès (ENCG Fès)</div>
            </div>
            <div className="grid grid-cols-[160px_1fr] border-b border-slate-200">
              <div className="p-4 text-[10px] font-bold text-[#002a7a] uppercase tracking-wider bg-slate-50">Destination</div>
              <div className="p-4 font-bold text-[#002a7a] bg-white">Rabat</div>
            </div>
            <div className="grid grid-cols-[160px_1fr] border-b border-slate-200">
              <div className="p-4 text-[10px] font-bold text-[#002a7a] uppercase tracking-wider bg-slate-50">Période de Mission</div>
              <div className="p-4 font-bold text-slate-900 bg-white">Du <span className="text-[#002a7a]">01/06/2026</span> au <span className="text-[#002a7a]">06/06/2026</span></div>
            </div>
            <div className="grid grid-cols-[160px_1fr]">
              <div className="p-4 text-[10px] font-bold text-[#002a7a] uppercase tracking-wider bg-slate-50">Objet / Motif</div>
              <div className="p-4 font-bold text-slate-900 bg-white">Participation séminaire d'excellence académique</div>
            </div>
          </div>

          <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl italic text-slate-600 text-xs text-justify">
            Les autorités locales de la destination et tous représentants des services publics et de la force publique sont priés de faciliter l'accomplissement de la mission de l'intéressé(e) et de lui prêter assistance en cas de besoin.
          </div>
        </div>

        {/* Footer Signatures */}
        <div className="mt-16 flex justify-between items-end pb-8">
          <div className="text-center w-1/3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-8">Signature de l'intéressé(e)</p>
            <p className="font-bold text-sm text-slate-800">Prof. Radouane el asri</p>
          </div>
          
          <div className="w-1/3 flex justify-center">
            {/* Seal */}
            <div className="w-24 h-24 border-2 border-[#002a7a] rounded-full flex flex-col items-center justify-center p-2 opacity-80">
              <div className="w-full h-full border border-[#002a7a] rounded-full flex flex-col items-center justify-center text-[8px] text-[#002a7a] font-bold text-center leading-tight">
                <p>ENCG FÈS</p>
                <p className="text-sm font-black my-0.5">★ ENCG ★</p>
                <p>SECRÉTARIAT</p>
              </div>
            </div>
          </div>

          <div className="text-center w-1/3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-8">Fait à Fès, le 24/06/2026</p>
            <p className="font-bold text-sm text-slate-800 uppercase">Le Secrétaire Général</p>
          </div>
        </div>
      </div>
    </div>
  );
}
