import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';

export default function ExamAttendanceSheet() {
  const { examId } = useParams();

  const { data: studentsData } = useQuery({
    queryKey: ['exam-attendance', examId],
    queryFn: () => api.get(`/students`).then(res => res.data.data || res.data || [])
  });

  const students = studentsData || [];

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
              <th className="border border-black/10 p-3 w-12 text-center">N°</th>
              <th className="border border-black/10 p-3 w-32">CNE / MASSAR</th>
              <th className="border border-black/10 p-3">NOM ET PRÉNOM</th>
              <th className="border border-black/10 p-3 w-24 text-center">N° PLACE</th>
              <th className="border border-black/10 p-3 w-48 text-center">SIGNATURE</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((student: any, index: number) => (
                <tr key={student.id} className="border-b border-[#1F3A5F]/20">
                  <td className="p-3 text-center text-sm font-bold border-r border-[#1F3A5F]/20">{index + 1}</td>
                  <td className="p-3 font-mono text-sm border-r border-[#1F3A5F]/20">{student.cne || student.matricule || `2026${student.id}`}</td>
                  <td className="p-3 font-bold text-sm uppercase border-r border-[#1F3A5F]/20">{student.user?.last_name || ''} {student.user?.first_name || ''} {student.name || ''}</td>
                  <td className="p-3 border-r border-[#1F3A5F]/20"></td>
                  <td className="p-3"></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-4 text-center text-black/50">Aucun étudiant trouvé</td>
              </tr>
            )}
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
