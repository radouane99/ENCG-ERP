import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, X, Calendar as CalendarIcon, MessageSquare } from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface Student {
  id: string;
  name: string;
  score: string;
  letter: string;
  isPresent: boolean | null;
}

export default function ProfessorCall() {
  const { sessionId } = useParams();

  const [date, setDate] = useState('24/06/2026');
  const [type, setType] = useState('Théorique (Cours)');

  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'Aniss el alaoui', score: '2H', letter: 'A', isPresent: true },
    { id: '2', name: 'Ahmed Naciri', score: '2H', letter: 'A', isPresent: true },
    { id: '3', name: 'Ilyas Alaoui', score: '0H', letter: 'I', isPresent: true },
    { id: '4', name: 'Youssef Chraibi', score: '4H', letter: 'Y', isPresent: true },
    { id: '5', name: 'Aya Bennis', score: '2H', letter: 'A', isPresent: true },
    { id: '6', name: 'Othmane Filali', score: '0H', letter: 'O', isPresent: true },
    { id: '7', name: 'Ayoub Chraibi', score: '0H', letter: 'A', isPresent: true },
    { id: '8', name: 'Sara Tazi', score: '0H', letter: 'S', isPresent: true },
    { id: '9', name: 'Omar Idrissi', score: '0H', letter: 'O', isPresent: true },
  ]);

  const togglePresence = (id: string, isPresent: boolean) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, isPresent } : s));
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Filters */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">DATE DE LA SÉANCE</label>
          <div className="relative">
            <input 
              type="text" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-[#003a8c] focus:ring-1 focus:ring-[#003a8c]"
            />
            <CalendarIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TYPE DE SÉANCE</label>
          <select 
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-white border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-[#003a8c] focus:ring-1 focus:ring-[#003a8c] appearance-none"
          >
            <option>Théorique (Cours)</option>
            <option>Pratique (TP)</option>
            <option>Dirigé (TD)</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5">
        <div className="grid grid-cols-2 mb-6 pb-2 border-b border-gray-50">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">ÉTUDIANT</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right px-4">STATUT</div>
        </div>

        <div className="space-y-2">
          {students.map((student) => (
            <div key={student.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#003a8c] font-black flex items-center justify-center shadow-sm">
                  {student.letter}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{student.name}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SCORE : {student.score}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => togglePresence(student.id, true)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                    student.isPresent === true 
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border border-emerald-500" 
                      : "bg-white text-emerald-600 border border-white/10 hover:border-emerald-200"
                  )}
                >
                  <Check className="w-4 h-4" /> PRÉSENT
                </button>
                <button 
                  onClick={() => togglePresence(student.id, false)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                    student.isPresent === false 
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20 border border-rose-500" 
                      : "bg-white text-gray-400 border border-white/10 hover:border-rose-200 hover:text-rose-500"
                  )}
                >
                  <X className="w-4 h-4" /> ABSENT
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Save Button */}
      <button className="fixed bottom-8 right-8 bg-amber-500 hover:bg-amber-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 transition-transform hover:scale-105 z-50">
        <MessageSquare className="w-6 h-6" />
      </button>

    </div>
  );
}
