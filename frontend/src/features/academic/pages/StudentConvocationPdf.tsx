import React from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentConvocationPdf() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white/[0.05] min-h-screen py-8 print:py-0 print:bg-white font-sans">
      {/* Controls - Hidden in print */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-between items-center print:hidden">
        <Link to="/academic/convocations/dashboard" className="bg-white hover:bg-white/[0.02] text-white/90 px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <button onClick={handlePrint} className="bg-[#1F3A5F] hover:bg-[#152842] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2">
          <Printer className="w-4 h-4" /> Imprimer le PDF
        </button>
      </div>

      {/* A4 Printable Page */}
      <div className="bg-white mx-auto w-[210mm] min-h-[297mm] shadow-lg print:shadow-none relative overflow-hidden">
        
        {/* WATERMARK BACKGROUND */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] z-0 overflow-hidden">
          <div className="text-[150px] font-black text-white transform -rotate-45 whitespace-nowrap tracking-widest uppercase select-none">
            CONVOCATION
          </div>
        </div>

        {/* Double border container */}
        <div className="absolute inset-4 border-4 border-[#c5a861] p-[2px] z-10">
          <div className="border border-[#c5a861] w-full h-full p-8 flex flex-col relative bg-transparent">

            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b-2 border-[#1F3A5F] pb-4">
              <div className="text-[10px] font-bold text-white uppercase leading-tight w-48">
                UNIVERSITÉ SIDI MOHAMED<br/>
                BEN ABDELLAH DE FÈS<br/>
                ENCG FÈS
              </div>
              <div className="flex flex-col items-center">
                <img src="/logo-encg.png" alt="ENCG Fès" className="h-16 object-contain" />
              </div>
              <div className="text-[10px] font-bold text-[#e91e63] text-right w-48" dir="rtl">
                Ø¬Ø§Ù…Ø¹Ø© Ø³ÙŠØ¯ÙŠ Ù…Ø­Ù…Ø¯ Ø¨Ù† Ø¹Ø¨Ø¯ Ø§Ù„Ù„Ù‡ Ø¨ÙØ§Ø³<br/>
                Ø§Ù„Ù…Ø¯Ø±Ø³Ø© Ø§Ù„ÙˆØ·Ù†ÙŠØ© Ù„Ù„ØªØ¬Ø§Ø±Ø© ÙˆØ§Ù„ØªØ³ÙŠÙŠØ± Ø¨ÙØ§Ø³<br/>
                Ù…ØµÙ„Ø­Ø© Ø§Ù„Ø´Ø¤ÙˆÙ† Ø§Ù„Ø·Ù„Ø§Ø¨ÙŠØ©
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black text-white tracking-wide mb-2 uppercase">
                CONVOCATION AUX EXAMENS
              </h1>
              <h2 className="text-sm text-white/50 font-medium">
                Année Académique : 2025/2026 â€” Session : Normale Automne
              </h2>
            </div>

            {/* Student Info Box */}
            <div className="border-t border-b border-[#e5e5e5] py-4 mb-8 grid grid-cols-2 gap-8">
              <div>
                <div className="text-[10px] font-bold text-white/50 uppercase mb-1">Code d'inscription (CNE)</div>
                <div className="text-lg font-black text-white uppercase">S20260001</div>
                
                <div className="text-[10px] font-bold text-white/50 uppercase mb-1 mt-4">Nom & Prénom</div>
                <div className="text-sm font-black text-white uppercase">ANISS EL ALAOUI</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-white/50 uppercase mb-1">NÂ° de C.I.N</div>
                <div className="text-sm font-bold text-white/90">Non renseigné</div>

                <div className="text-[10px] font-bold text-white/50 uppercase mb-1 mt-4">Filière d'études</div>
                <div className="text-sm font-bold text-white/90">Génie Informatique</div>
              </div>
            </div>

            <div className="text-sm italic text-white/80 mb-4">
              Vous êtes prié(e) de vous présenter aux dates et heures fixées ci-dessous pour passer vos épreuves :
            </div>

            {/* Exams Table */}
            <table className="w-full text-xs text-left border-collapse border border-[#1F3A5F] mb-8">
              <thead className="bg-[#1F3A5F] text-white">
                <tr>
                  <th className="border border-[#1F3A5F] p-3 text-center uppercase tracking-wider">Date</th>
                  <th className="border border-[#1F3A5F] p-3 text-center uppercase tracking-wider w-24">Horaire</th>
                  <th className="border border-[#1F3A5F] p-3 uppercase tracking-wider">Module / Matière</th>
                  <th className="border border-[#1F3A5F] p-3 uppercase tracking-wider">Salle</th>
                  <th className="border border-[#1F3A5F] p-3 text-center uppercase tracking-wider w-16">Place</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[#1F3A5F] p-3 text-center font-medium bg-white/50">01/07/2026</td>
                  <td className="border border-[#1F3A5F] p-3 text-center font-bold bg-white/50">09:00 - 10:30</td>
                  <td className="border border-[#1F3A5F] p-3 font-bold text-white bg-white/50">Introduction - Génie Informatique</td>
                  <td className="border border-[#1F3A5F] p-3 font-bold text-[#e91e63] bg-white/50">Amphi Al Khwarizmi</td>
                  <td className="border border-[#1F3A5F] p-3 text-center font-black bg-white/50">51</td>
                </tr>
                <tr>
                  <td className="border border-[#1F3A5F] p-3 text-center font-medium bg-white/50">01/07/2026</td>
                  <td className="border border-[#1F3A5F] p-3 text-center font-bold bg-white/50">11:00 - 12:30</td>
                  <td className="border border-[#1F3A5F] p-3 font-bold text-white bg-white/50">Avancé - Génie Informatique</td>
                  <td className="border border-[#1F3A5F] p-3 font-bold text-[#e91e63] bg-white/50">Amphi Ibn Khaldoun</td>
                  <td className="border border-[#1F3A5F] p-3 text-center font-black bg-white/50">7</td>
                </tr>
                <tr>
                  <td className="border border-[#1F3A5F] p-3 text-center font-medium bg-white/50">02/07/2026</td>
                  <td className="border border-[#1F3A5F] p-3 text-center font-bold bg-white/50">09:00 - 10:30</td>
                  <td className="border border-[#1F3A5F] p-3 font-bold text-white bg-white/50">Développement mobile</td>
                  <td className="border border-[#1F3A5F] p-3 font-bold text-[#e91e63] bg-white/50">Amphi Al Khwarizmi</td>
                  <td className="border border-[#1F3A5F] p-3 text-center font-black bg-white/50">18</td>
                </tr>
                <tr>
                  <td className="border border-[#1F3A5F] p-3 text-center font-medium bg-white/50">02/07/2026</td>
                  <td className="border border-[#1F3A5F] p-3 text-center font-bold bg-white/50">11:00 - 12:30</td>
                  <td className="border border-[#1F3A5F] p-3 font-bold text-white bg-white/50">Développement mobile LARAVEL</td>
                  <td className="border border-[#1F3A5F] p-3 font-bold text-[#e91e63] bg-white/50">Amphi Ibn Khaldoun</td>
                  <td className="border border-[#1F3A5F] p-3 text-center font-black bg-white/50">3</td>
                </tr>
                <tr>
                  <td className="border border-[#1F3A5F] p-3 text-center font-medium bg-white/50">03/07/2026</td>
                  <td className="border border-[#1F3A5F] p-3 text-center font-bold bg-white/50">09:00 - 10:30</td>
                  <td className="border border-[#1F3A5F] p-3 font-bold text-white bg-white/50">Intelligent Artificiel</td>
                  <td className="border border-[#1F3A5F] p-3 font-bold text-[#e91e63] bg-white/50">Amphi Ibn Khaldoun</td>
                  <td className="border border-[#1F3A5F] p-3 text-center font-black bg-white/50">40</td>
                </tr>
                <tr>
                  <td className="border border-[#1F3A5F] p-3 text-center font-medium bg-white/50">03/07/2026</td>
                  <td className="border border-[#1F3A5F] p-3 text-center font-bold bg-white/50">11:00 - 12:30</td>
                  <td className="border border-[#1F3A5F] p-3 font-bold text-white bg-white/50">SQL SERVER BASE DE DONNEE</td>
                  <td className="border border-[#1F3A5F] p-3 font-bold text-[#e91e63] bg-white/50">Amphi Ibn Khaldoun</td>
                  <td className="border border-[#1F3A5F] p-3 text-center font-black bg-white/50">51</td>
                </tr>
                <tr>
                  <td className="border border-[#1F3A5F] p-3 text-center font-medium bg-white/50">04/07/2026</td>
                  <td className="border border-[#1F3A5F] p-3 text-center font-bold bg-white/50">09:00 - 10:30</td>
                  <td className="border border-[#1F3A5F] p-3 font-bold text-white bg-white/50">GAMING</td>
                  <td className="border border-[#1F3A5F] p-3 font-bold text-[#e91e63] bg-white/50">Amphi Al Khwarizmi</td>
                  <td className="border border-[#1F3A5F] p-3 text-center font-black bg-white/50">7</td>
                </tr>
              </tbody>
            </table>

            {/* Instructions Box */}
            <div className="border-l-4 border-[#e91e63] pl-4 mb-8 text-[10px] text-white/80 space-y-2 relative bg-white/80 p-2">
              <h3 className="font-bold text-[#e91e63] text-xs mb-2 uppercase tracking-wide">Règlement des examens â€” Extraits</h3>
              <ul className="list-disc list-inside space-y-1.5">
                <li>L'usage des téléphones portables et de tout appareil connecté est strictement interdit et assimilé Ã  une tentative de fraude.</li>
                <li>Chaque étudiant doit se munir de sa propre carte d'étudiant ou de sa CIN. Aucun prêt de matériel n'est autorisé.</li>
                <li>Tout retard supérieur Ã  20 minutes après l'ouverture des enveloppes exclut le candidat de l'épreuve.</li>
                <li>La sortie définitive de la salle n'est permise qu'après l'écoulement des 30 premières minutes de l'épreuve.</li>
                <li>Toute tentative de fraude fera l'objet d'un rapport immédiat et d'une comparution devant le Conseil de Discipline.</li>
              </ul>
            </div>

            {/* Footer with Signatures & QR */}
            <div className="mt-auto flex justify-between items-end pt-8 relative bg-white/80 p-2">
              {/* QR Code */}
              <div className="flex flex-col">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=CONV-2026-000001`} 
                  alt="QR Code" 
                  className="w-20 h-20 mb-2 border border-white/10 p-1 bg-white"
                />
                <span className="text-[8px] font-bold text-white/90">Vérification Officielle UPF</span>
                <span className="text-[8px] text-white/50">Réf : CONV-2026-000001</span>
              </div>
              
              <div className="text-center">
                <div className="text-sm font-bold text-white underline mb-4">La Direction des Études</div>
                {/* Stamp Simulation */}
                <div className="w-24 h-24 border-[3px] border-[#1F3A5F] rounded-full flex flex-col items-center justify-center text-white opacity-90 mx-auto rotate-[15deg] mix-blend-multiply bg-white/50">
                  <div className="text-[7px] font-bold text-center leading-none mt-2 uppercase tracking-widest">
                    ENCG Fès
                  </div>
                  <div className="text-sm font-black flex items-center justify-between w-full px-2 mt-1 mb-1">
                    <span>â˜…</span> USMBA <span>â˜…</span>
                  </div>
                  <div className="text-[8px] font-bold uppercase tracking-widest">Scolarité</div>
                </div>
              </div>
            </div>

            {/* Bottom Contact Footer */}
            <div className="border-t border-[#c5a861] mt-8 pt-4 text-center text-[9px] text-white/70 relative bg-white/80 p-1">
              <span className="font-bold text-white">ENCG Fès</span> â€” Route Principale d'Imouzzer, Fès 30000, Maroc | Tél : +212 5 35 60 06 43 | Web : encgf-usmba.ac.ma
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
