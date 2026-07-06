import React, { useState } from 'react';
import { useStudentAbsences, useJustifyAbsence } from '../../api/absencesApi';
import { Attendance } from '../../model/types';

export default function StudentAbsencesPage() {
  const { data: absences, isLoading } = useStudentAbsences();
  const { mutate: justifyAbsence, isPending } = useJustifyAbsence();

  const [selectedAttendance, setSelectedAttendance] = useState<number | null>(null);
  const [reason, setReason] = useState('medical');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleJustify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttendance || !file) return;

    const formData = new FormData();
    formData.append('reason', reason);
    formData.append('description', description);
    formData.append('document', file);

    justifyAbsence({ attendanceId: selectedAttendance, formData }, {
      onSuccess: () => {
        setSelectedAttendance(null);
        setFile(null);
        setDescription('');
      }
    });
  };

  if (isLoading) return <div className="p-8">Chargement de vos absences...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800">Mes Absences</h1>
        <p className="text-slate-500 mt-2">Consultez votre assiduité et soumettez vos justificatifs médicaux.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Séance / Module</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Statut</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Justificatif</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {absences?.map((record: Attendance) => (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800">{record.attendanceSession?.module?.name || 'Module'}</div>
                  <div className="text-sm text-slate-500">{new Date(record.attendanceSession?.session_date || '').toLocaleDateString('fr-FR')}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    record.status === 'absent' ? 'bg-red-100 text-red-700' :
                    record.status === 'late' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {record.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {record.is_justified ? (
                    <span className="text-green-600 font-semibold">Accepté</span>
                  ) : record.absenceJustification ? (
                    <span className="text-amber-600 font-semibold">{record.absenceJustification.status === 'rejected' ? 'Rejeté' : 'En attente'}</span>
                  ) : (
                    <span className="text-slate-400">Non justifié</span>
                  )}
                  {record.absenceJustification?.rejection_reason && (
                    <div className="text-xs text-red-500 mt-1">Motif: {record.absenceJustification.rejection_reason}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {record.status === 'absent' && !record.absenceJustification && !record.is_justified && (
                    <button 
                      onClick={() => setSelectedAttendance(record.id)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Justifier
                    </button>
                  )}
                  {record.absenceJustification?.media && record.absenceJustification.media.length > 0 && (
                    <a href={record.absenceJustification.media[0].original_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-sm font-medium">Voir PJ</a>
                  )}
                </td>
              </tr>
            ))}
            {absences?.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Aucune absence trouvée.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Justification Modal */}
      {selectedAttendance && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Soumettre un justificatif</h3>
            <form onSubmit={handleJustify} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Motif</label>
                <select 
                  value={reason} onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="medical">Médical</option>
                  <option value="family">Familial</option>
                  <option value="sports">Sportif</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description (Optionnel)</label>
                <textarea 
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Document (PDF/Image)</label>
                <input 
                  type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setSelectedAttendance(null)} className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg">Annuler</button>
                <button type="submit" disabled={!file || isPending} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors">
                  {isPending ? 'Envoi...' : 'Soumettre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
