import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';

export default function ExamAttendanceSheet() {
  const { examId } = useParams();

  // Mock data matching the screenshot "Fiche d'émargement"
  const students = [
    { id: 1, cne: 'R130000001', name: 'ALI EL FASSI' },
    { id: 2, cne: 'R130000002', name: 'AMINE TAHIRI' },
    { id: 3, cne: 'R130000003', name: 'AYA ALAOUI' },
    { id: 4, cne: 'R130000004', name: 'AYOUB BOUJIDA' },
    { id: 5, cne: 'R130000005', name: 'CHAIMAE BENANI' },
    { id: 6, cne: 'R130000006', name: 'FATIMA SEKKAT' },
    { id: 7, cne: 'R130000007', name: 'KHADIJA IDRISSI' },
    { id: 8, cne: 'R130000008', name: 'MEHDI TAZI' },
    { id: 9, cne: 'R130000009', name: 'MOHAMMED BENNIS' },
    { id: 10, cne: 'R130000010', name: 'NADA ALAOUI' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 print:max-w-none print:p-0">
      {/* Non-printable controls */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Link to="/academic/exam-planning" className="bg-white hover:bg-white/5 border border-white/10 text-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Retour au Planning
        </Link>
        <button onClick={handlePrint} className="bg-[#1F3A5F] hover:bg-[#152842] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
          <Printer className="w-4 h-4" /> Imprimer la Fiche
        </button>
      </div>

      {/* Printable Area - A4 size simulation */}
      <div className="bg-white border border-white/10 shadow-sm print:border-none print:shadow-none p-10 print:p-0 mx-auto w-full max-w-[210mm] min-h-[297mm]">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-[#1F3A5F] pb-4">
          <div>
            <h1 className="text-xl font-black text-white tracking-wide uppercase">UNIVERSITÉ PRIVÉE DE FÈS</h1>
            <p className="text-xs text-white/50">Direction des Affaires Académiques</p>
          </div>
          <h2 className="text-lg font-bold text-white uppercase">FICHE D'ÉMARGEMENT DES EXAMENS</h2>
        </div>

        {/* Info Box */}
        <div className="flex justify-between text-xs mb-8">
          <div className="space-y-2">
            <div className="flex"><span className="font-bold w-24">Module:</span> <span>Avancé - Génie Informatique</span></div>
            <div className="flex"><span className="font-bold w-24">Filière & Groupe:</span> <span>Génie Informatique - Groupe 2</span></div>
            <div className="flex"><span className="font-bold w-24">Date:</span> <span>01/06/2026</span></div>
          </div>
          <div className="space-y-2">
            <div className="flex"><span className="font-bold w-32">Heure:</span> <span>11:00 - 12:30 (90 min)</span></div>
            <div className="flex"><span className="font-bold w-32">Salle:</span> <span>Amphi Al Khwarizmi</span></div>
            <div className="flex"><span className="font-bold w-32">Effectif Attendu:</span> <span>{students.length} étudiants</span></div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-xs text-left border-collapse border border-white/10 mb-8">
          <thead className="bg-white/5/10">
            <tr>
              <th className="border border-white/10 p-3 w-12 text-center">NÂ°</th>
              <th className="border border-white/10 p-3 w-32">CNE / MASSAR</th>
              <th className="border border-white/10 p-3">NOM ET PRÉNOM</th>
              <th className="border border-white/10 p-3 w-24 text-center">NÂ° PLACE</th>
              <th className="border border-white/10 p-3 w-48 text-center">SIGNATURE</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr key={student.id}>
                <td className="border border-white/10 p-3 text-center">{idx + 1}</td>
                <td className="border border-white/10 p-3">{student.cne}</td>
                <td className="border border-white/10 p-3">{student.name}</td>
                <td className="border border-white/10 p-3 text-center font-bold text-white/50">â€”</td>
                <td className="border border-white/10 p-4"></td> {/* Empty space for signature */}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer info box */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-white/10 rounded p-4 text-xs h-32">
            <h3 className="font-bold text-white mb-2">Surveillants Affectés :</h3>
            <ul className="list-disc list-inside text-white/50 mb-4">
              <li>Aucun surveillant assigné</li>
            </ul>
            <div className="text-white/50 mt-auto">Signatures :</div>
          </div>
          
          <div className="border border-white/10 rounded p-4 text-xs h-32">
            <h3 className="font-bold text-white mb-1">Observation du déroulement :</h3>
            <p className="text-white/50/60 italic">(Absences massives, incidents, retards, etc.)</p>
          </div>
        </div>

      </div>
    </div>
  );
}
