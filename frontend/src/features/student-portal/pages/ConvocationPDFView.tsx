import React from 'react';
import { Download, Printer } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@shared/lib/utils';

export default function ConvocationPDFView() {
  const { user } = useAuthStore();

  const handlePrint = () => {
    window.print();
  };

  const exams = [
    { date: '01/07/2026', time: '09:00 - 10:30', module: 'Introduction - Génie Informatique', prof: 'RADOUANE EL ASRI', room: 'Amphi Al Khwarizmi', place: '51' },
    { date: '01/07/2026', time: '11:00 - 12:30', module: 'Avancé - Génie Informatique', prof: 'NON SPECIFIÉ', room: 'Amphi Ibn Khaldoun', place: '7' },
    { date: '02/07/2026', time: '09:00 - 10:30', module: 'Développement mobile', prof: 'RADOUANE EL ASRI', room: 'Amphi Al Khwarizmi', place: '18' },
    { date: '02/07/2026', time: '11:00 - 12:30', module: 'Développement mobile LARAVEL', prof: 'RADOUANE EL ASRI', room: 'Amphi Ibn Khaldoun', place: '3' },
    { date: '03/07/2026', time: '09:00 - 10:30', module: 'Intelligent Artificiel', prof: 'RADOUANE EL ASRI', room: 'Amphi Ibn Khaldoun', place: '40' },
    { date: '03/07/2026', time: '11:00 - 12:30', module: 'SQL SERVER BASE DE DONNEE', prof: 'RADOUANE EL ASRI', room: 'Amphi Ibn Khaldoun', place: '51' },
  ];

  return (
    <div className="min-h-screen bg-white/[0.02]0 flex flex-col font-sans print:bg-white print:block">
      
      {/* Top Toolbar (Hidden in print) */}
      <div className="bg-[#1f2937] text-white p-4 flex items-center justify-between print:hidden shadow-md sticky top-0 z-50">
        <h1 className="font-medium text-sm flex items-center gap-2">
          <FileText className="w-4 h-4" /> Convocation aux Examens â€” CONV-2026-000001
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-300 border-r border-gray-600 pr-4">
            <span>1 / 1</span>
            <span>â€”</span>
            <span>100%</span>
          </div>
          <button onClick={handlePrint} className="hover:bg-white/10 p-2 rounded transition-colors" title="Imprimer / Sauvegarder en PDF">
            <Printer className="w-5 h-5" />
          </button>
          <button onClick={handlePrint} className="hover:bg-white/10 p-2 rounded transition-colors" title="Télécharger">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Document Container */}
      <div className="flex-1 overflow-y-auto p-8 print:p-0 flex justify-center custom-scrollbar">
        
        {/* A4 Page (The PDF content) */}
        <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl relative print:shadow-none print:w-auto print:h-auto mx-auto shrink-0 border-4 border-[#c29624] p-8 box-border">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="text-[#001A4B] font-bold text-xs leading-tight w-1/3">
              ROYAUME DU MAROC<br/>
              UNIVERSITÉ PRIVÉE DE FÈS<br/>
              Ecole Supérieure d'Ingénierie<br/>
              et de Technologie de Fès
            </div>
            <div className="flex flex-col items-center justify-center w-1/3">
              <img src="/logo-encg.png" alt="UPF" className="h-16 object-contain mb-1" />
              <div className="text-[10px] font-bold text-[#001A4B]">UNIVERSITÉ PRIVÉE DE FÈS</div>
            </div>
            <div className="text-rose-600 font-bold text-xs leading-tight text-right w-1/3" dir="rtl">
              Ø§Ù„Ù…Ù…Ù„ÙƒØ© Ø§Ù„Ù…ØºØ±Ø¨ÙŠØ©<br/>
              Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø®Ø§ØµØ© Ù„ÙØ§Ø³<br/>
              Ø§Ù„Ù…Ø¯Ø±Ø³Ø© Ø§Ù„Ø¹Ù„ÙŠØ§ Ù„Ù„Ù‡Ù†Ø¯Ø³Ø©<br/>
              ÙˆØ§Ù„ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø¨ÙØ§Ø³
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-[#001A4B] uppercase tracking-wide mb-1 border-b-2 border-rose-600 inline-block pb-1">
              CONVOCATION AUX EXAMENS
            </h2>
            <div className="text-sm font-bold text-[#001A4B] mt-2">
              Année Académique : 2025/2026 â€” Session : Normale Automne
            </div>
          </div>

          {/* Student Info Box */}
          <div className="border-y-2 border-[#c29624] py-4 mb-8">
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex font-bold text-sm text-[#001A4B]">
                <div className="w-36 uppercase">CODE D'INSCRIPTION<br/>(CNE)</div>
                <div>: S20260001</div>
              </div>
              <div className="flex font-bold text-sm text-[#001A4B] items-center">
                <div className="w-36 uppercase">NÂ° DE C.I.N</div>
                <div>: Non renseigné</div>
              </div>
              <div className="flex font-bold text-sm text-[#001A4B]">
                <div className="w-36 uppercase">NOM & PRÉNOM</div>
                <div className="uppercase">: {user?.name || 'ANISS EL ALAOUI'}</div>
              </div>
              <div className="flex font-bold text-sm text-[#001A4B]">
                <div className="w-36 uppercase">NIVEAU D'ÉTUDES</div>
                <div>: 1Lème année</div>
              </div>
              <div className="flex font-bold text-sm text-[#001A4B] col-span-2">
                <div className="w-36 uppercase">FILIÈRE D'ÉTUDES</div>
                <div>: Génie Informatique</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/80 italic mb-4 font-medium">
            Vous êtes prié(e) de vous présenter aux dates et heures fixées ci-dessous pour passer vos épreuves :
          </p>

          {/* Exams Table */}
          <table className="w-full text-sm border-collapse mb-8 border border-[#001A4B]">
            <thead>
              <tr className="bg-[#001A4B] text-white">
                <th className="border border-[#001A4B] py-2 px-2 text-center uppercase text-[11px] w-[12%]">DATE</th>
                <th className="border border-[#001A4B] py-2 px-2 text-center uppercase text-[11px] w-[15%]">HORAIRE</th>
                <th className="border border-[#001A4B] py-2 px-2 text-left uppercase text-[11px]">MODULE / MATIÈRE</th>
                <th className="border border-[#001A4B] py-2 px-2 text-left uppercase text-[11px] w-[20%]">ENSEIGNANT</th>
                <th className="border border-[#001A4B] py-2 px-2 text-center uppercase text-[11px] w-[15%]">SALLE</th>
                <th className="border border-[#001A4B] py-2 px-2 text-center uppercase text-[11px] w-[8%]">PLACE</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02]/50">
                  <td className="border border-gray-300 border-l-[#001A4B] py-3 px-2 text-center font-bold text-[#003a8c] text-[11px]">{exam.date}</td>
                  <td className="border border-gray-300 py-3 px-2 text-center font-bold text-[#001A4B] text-[11px]">{exam.time}</td>
                  <td className="border border-gray-300 py-3 px-2 font-black text-[#001A4B] text-xs">{exam.module}</td>
                  <td className="border border-gray-300 py-3 px-2 text-[10px] uppercase font-semibold text-white/70">{exam.prof}</td>
                  <td className="border border-gray-300 py-3 px-2 text-center font-bold text-rose-600 text-[11px] leading-tight flex flex-col justify-center min-h-[40px]">
                    {exam.room.split(' ').map((word, i) => (
                      <span key={i}>{word}</span>
                    ))}
                  </td>
                  <td className="border border-[#001A4B] border-t-gray-300 py-3 px-2 text-center font-black text-[#001A4B] text-sm">{exam.place}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-30deg]">
            <img src="/logo-encg.png" alt="" className="w-[500px]" />
          </div>

          <div className="mt-12 text-right">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=CONV-2026-000001" alt="QR Code" className="ml-auto border border-white/10" />
            <p className="text-[8px] text-gray-400 mt-1 uppercase tracking-widest">Vérification Numérique</p>
          </div>

        </div>
      </div>
    </div>
  );
}

function FileText({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  );
}
