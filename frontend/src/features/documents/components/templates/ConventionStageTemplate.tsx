import React from 'react';

export default function ConventionStageTemplate() {
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
          <div>N° : <span className="font-medium text-slate-600">2026/CONV/0005</span></div>
          <div>Date : <span className="font-medium text-slate-600">24/06/2026</span></div>
        </div>

        {/* Document Title */}
        <div className="border border-blue-200 bg-blue-50/30 rounded-2xl py-6 text-center mb-8">
          <h1 className="text-3xl font-bold text-[#002a7a] uppercase tracking-wide serif">
            Convention de Stage PFE
          </h1>
        </div>

        {/* Content Body */}
        <div className="flex-1 space-y-6 text-[13px] text-slate-800 leading-relaxed">
          <div>
            <p className="font-bold text-[#002a7a] mb-2">Entre les soussignés :</p>
            <ol className="space-y-2 text-[13px] ml-4 font-medium">
              <li>
                <span className="font-bold text-[#e6007e]">1.</span> L'<strong className="text-[#002a7a]">École Nationale de Commerce et de Gestion de Fès (ENCG Fès)</strong>, représentée par son administration.
              </li>
              <li>
                <span className="font-bold text-[#e6007e]">2.</span> L'<strong className="text-[#002a7a]">Entreprise d'Accueil</strong> (à compléter par l'organisme d'accueil).
              </li>
              <li>
                <span className="font-bold text-[#e6007e]">3.</span> L'<strong className="text-[#002a7a]">Étudiant(e)</strong> : Nom et Prénom : <strong className="text-[#002a7a]">Aniss el alaoui</strong> | N° d'immatriculation : <strong className="text-slate-900">STU-7207</strong> | Inscrit(e) au titre de l'année universitaire <strong className="text-slate-900">2025-2026</strong>.
              </li>
            </ol>
          </div>
          
          <hr className="border-dashed border-gray-300" />

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-[#002a7a] mb-1">Article 1 : Objet de la convention</h3>
              <p className="text-justify text-xs">
                La présente convention a pour objet de définir les conditions dans lesquelles l'étudiant(e) effectuera son stage au sein de l'entreprise d'accueil dans le cadre de son cursus académique à l'ENCG Fès.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-[#002a7a] mb-1">Article 2 : Durée et déroulement</h3>
              <p className="text-justify text-xs">
                Le stage a pour finalité l'application pratique des connaissances théoriques acquises à l'école. Les dates exactes ainsi que le sujet d'étude de stage seront définis d'un commun accord avec l'entreprise d'accueil.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-[#002a7a] mb-1">Article 3 : Encadrement et Suivi</h3>
              <p className="text-justify text-xs">
                L'étudiant(e) sera soumis(e) au règlement intérieur de l'entreprise d'accueil. Il/Elle rédigera un rapport de stage qui fera l'objet d'une évaluation par l'établissement.
              </p>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-16 flex justify-between items-end pb-8 text-center text-[10px]">
          <div className="w-1/3">
            <p className="font-bold text-[#002a7a] uppercase tracking-wider mb-6">Pour l'ENCG Fès</p>
            <div className="flex justify-center">
              <div className="w-20 h-20 border-[1.5px] border-[#002a7a] rounded-full flex flex-col items-center justify-center p-1 opacity-80">
                <div className="w-full h-full border border-[#002a7a] rounded-full flex flex-col items-center justify-center text-[6px] text-[#002a7a] font-bold text-center leading-tight">
                  <p>ENCG FÈS</p>
                  <p className="text-[10px] font-black my-0.5">★ ENCG ★</p>
                  <p>ADMINISTRATION</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-1/3">
            <p className="font-bold text-[#002a7a] uppercase tracking-wider mb-6">Pour l'Entreprise</p>
            <p className="text-slate-400">Sceau & Signature<br/><span className="italic font-normal">(à compléter)</span></p>
            <div className="h-16"></div>
          </div>

          <div className="w-1/3">
            <p className="font-bold text-[#002a7a] uppercase tracking-wider mb-6">L'Étudiant(e)</p>
            <p className="text-slate-400">Signature précédée de la mention<br/><span className="italic font-normal">"Lu et approuvé"</span></p>
            <div className="h-16"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
