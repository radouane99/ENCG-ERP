import React from 'react';
import { QrCode } from 'lucide-react';

export default function ReleveNotesTemplate() {
  return (
    <div className="w-[210mm] min-h-[297mm] bg-white mx-auto shadow-xl print:shadow-none print:w-full print:h-auto font-sans relative overflow-hidden bg-white p-12 flex flex-col">
      
      {/* Header Section */}
      <div className="flex justify-between items-end border-b-[2px] border-[#002a7a] pb-2 mb-8">
        <div>
          <div className="font-black text-4xl tracking-tight text-[#002a7a] mb-1 flex items-baseline">
            UPF<span className="text-[#e6007e]">.</span>
          </div>
          <p className="text-[10px] font-bold text-[#e6007e] uppercase tracking-wider">UNIVERSITÉ PRIVÉE DE FÈS</p>
        </div>
        <div className="text-[10px] text-[#002a7a] font-medium text-right leading-relaxed">
          <p><span className="font-bold">Année Académique:</span> 2025/2026</p>
          <p><span className="font-bold">Session:</span> Principale</p>
          <p><span className="font-bold">Date d'édition:</span> 24/06/2026</p>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-xl font-bold text-[#002a7a] uppercase tracking-wider text-center mb-6 serif">
        Relevé de Notes - Semestre S1
      </h1>

      {/* Student Info Box */}
      <div className="border border-blue-200 rounded-2xl p-4 bg-white/[0.02]/30 flex justify-between mb-6 text-sm">
        <div className="space-y-2">
          <div className="grid grid-cols-[100px_1fr]">
            <span className="text-white/50 font-medium">Nom & Prénom :</span>
            <span className="font-bold text-[#002a7a]">Aniss el alaoui</span>
          </div>
          <div className="grid grid-cols-[100px_1fr]">
            <span className="text-white/50 font-medium">Filière :</span>
            <span className="font-bold text-[#002a7a]">Génie Informatique</span>
          </div>
        </div>
        <div className="grid grid-cols-[80px_1fr] items-start">
          <span className="text-white/50 font-medium">NÂ° Étudiant :</span>
          <span className="font-bold text-[#002a7a]">STU-7207</span>
        </div>
      </div>

      {/* Grades Table */}
      <div className="border border-[#002a7a] rounded-xl overflow-hidden mb-6">
        <div className="bg-[#002a7a] text-white px-4 py-2 flex justify-between font-bold text-sm">
          <span>S1</span>
          <span>Moyenne: 11.61 / 20</span>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] text-white/50 font-bold uppercase bg-white/[0.02] border-b border-white/10">
            <tr>
              <th className="px-4 py-3">Code Module</th>
              <th className="px-4 py-3">Intitulé du Module</th>
              <th className="px-4 py-3 text-center">Note / 20</th>
              <th className="px-4 py-3 text-center">Résultat</th>
            </tr>
          </thead>
          <tbody className="font-medium text-white/90">
            {[
              { code: 'INF-101', name: 'Introduction - Génie Informatique', note: '16.10', res: 'Validé', color: 'text-teal-600' },
              { code: 'INF-102', name: 'Avancé - Génie Informatique', note: '7.00', res: 'Rattrapage', color: 'text-[#e6007e]' },
              { code: 'INF-103', name: 'Développement mobile', note: '14.66', res: 'Validé', color: 'text-teal-600' },
              { code: 'INF-104', name: 'Développement mobile LARAVEL', note: '8.62', res: 'Rattrapage', color: 'text-[#e6007e]' },
              { code: 'INF-105', name: 'Intelligent Artificiel', note: '11.74', res: 'Validé', color: 'text-teal-600' },
              { code: 'INF-106', name: 'SQL SERVER BASE DE DONNEE', note: '13.14', res: 'Validé', color: 'text-teal-600' },
              { code: 'INF-107', name: 'GAMING', note: '10.00', res: 'Validé', color: 'text-teal-600' },
            ].map((row, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 font-bold">{row.code}</td>
                <td className="px-4 py-3">{row.name}</td>
                <td className={`px-4 py-3 text-center font-bold ${row.color}`}>{row.note}</td>
                <td className={`px-4 py-3 text-center font-bold ${row.color}`}>{row.res}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Result Box */}
      <div className="border-[2px] border-[#002a7a] rounded-xl p-4 text-center mb-8">
        <p className="text-sm font-bold text-[#002a7a] uppercase mb-1">
          Résultat du semestre : <span className="text-teal-600">Moyenne Générale = 11.61 / 20</span>
        </p>
        <p className="text-xs text-white/50">
          Décision du Jury : <span className="font-bold text-teal-600">ADMIS(E) AU NIVEAU SUPÉRIEUR</span>
        </p>
      </div>

      <div className="flex-1"></div>

      {/* Footer Details */}
      <div className="flex justify-between items-start pt-6 border-t border-white/10">
        <div className="flex gap-4 w-1/2">
          <div className="w-20 h-20 bg-white/[0.05] flex items-center justify-center border border-gray-300">
            <QrCode className="w-16 h-16 text-white/90" />
          </div>
          <div className="text-[9px] text-white/50 leading-tight">
            <p className="font-bold text-[#002a7a] mb-1">Document numérique officiel</p>
            <p>Généré par le portail universitaire de l'UPF.</p>
            <p>Scannez le code QR ci-dessus pour vérifier l'authenticité de ce</p>
            <p>relevé de notes en ligne.</p>
          </div>
        </div>
        
        <div className="w-1/2 text-right">
          <p className="text-[10px] text-white/50 mb-1">Fait Ã  Fès, le 31/05/2026</p>
          <p className="text-xs font-bold text-white uppercase mb-4">Le Doyen de l'Université</p>
          <div className="inline-block border border-dashed border-gray-300 rounded p-4 text-[9px] text-gray-400 italic text-center w-40 h-16 flex items-center justify-center">
            Signé numériquement par le Doyen UPF
          </div>
        </div>
      </div>

      {/* Bottom Legal Text */}
      <div className="text-center text-[8px] text-gray-400 mt-6 pt-4 border-t border-white/5">
        Université Privée de Fès - Route d'Imouzzer, Fès, Maroc - Tél: +212 535 600 800 - Email: contact@upf.ac.ma - www.upf.ac.ma
      </div>
    </div>
  );
}
