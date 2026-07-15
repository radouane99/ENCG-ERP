import React from 'react';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';

export default function ExamDisplayList() {
  const { examId } = useParams();

  const { data: studentsData } = useQuery({
    queryKey: ['exam-students', examId],
    queryFn: () => api.get(`/students`).then(res => res.data.data || res.data || [])
  });

  const students = studentsData || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-pink-600 italic flex items-center gap-2">
          <FileText className="w-6 h-6" /> Liste d'Affichage
        </h1>
        <div className="flex gap-3">
          <Link to="/academic/exam-planning" className="bg-white hover:bg-white/5 border border-white/10 text-foreground px-4 py-2 rounded-lg font-bold text-sm uppercase flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour au Planning
          </Link>
          <button className="bg-[#e91e63] hover:bg-[#c2185b] text-white px-4 py-2 rounded-lg font-bold text-sm uppercase flex items-center gap-2">
            <Download className="w-4 h-4" /> Télécharger PDF
          </button>
        </div>
      </div>

      <div className="bg-white border border-white/10 rounded-2xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="text-[10px] font-bold text-white/50 uppercase mb-1">Module</div>
            <div className="font-bold">Avancé - Génie Informatique</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-white/50 uppercase mb-1">Date & Heure</div>
            <div className="font-bold text-pink-600">01/06/2026 Ã  11:00:00</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-white/50 uppercase mb-1">Salle</div>
            <div className="font-bold text-pink-600">Amphi Al Khwarizmi</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-white/50 uppercase mb-1">Groupe / Filière</div>
            <div className="font-bold">Génie Informatique - Groupe 2 (Génie Informatique)</div>
          </div>
        </div>
        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="text-[10px] font-bold text-white/50 uppercase mb-1">Surveillants Assignés</div>
          <div className="font-bold text-red-500">Aucun surveillant</div>
        </div>
      </div>

      <div className="bg-white border border-white/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/5/10">
          <h2 className="font-bold text-lg">Étudiants concernés ({students.length})</h2>
        </div>
        
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-white/50 font-bold uppercase bg-white/5/20">
            <tr>
              <th className="px-6 py-4">NÂ° Place</th>
              <th className="px-6 py-4">Matricule</th>
              <th className="px-6 py-4">Nom & Prénom</th>
              <th className="px-6 py-4 text-right">Statut Convocation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.length > 0 ? (
              students.map((student: any, index: number) => (
                <tr key={student.id} className="border-b border-white/5 bg-white/5/5">
                  <td className="px-6 py-4 font-mono font-medium">{index + 1}</td>
                  <td className="px-6 py-4 font-mono font-medium">{student.cne || student.matricule || `2026${student.id}`}</td>
                  <td className="px-6 py-4 font-bold">{student.user?.first_name} {student.user?.last_name} {student.name || ''}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold uppercase border border-emerald-500/20">
                      Générée
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-white/50">
                  Aucune convocation générée pour cet examen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
