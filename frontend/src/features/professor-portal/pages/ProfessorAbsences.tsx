import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';

export default function ProfessorAbsences() {
  const sessions = [
    {
      id: 1,
      title: "INTRODUCTION - GÉNIE INFORMATIQUE",
      group: "GÉNIE INFORMATIQUE - GROUPE 1",
      time: "08:30 - 10:30"
    },
    {
      id: 2,
      title: "AVANCÉ - GÉNIE INFORMATIQUE",
      group: "GÉNIE INFORMATIQUE - GROUPE 2",
      time: "10:45 - 12:00"
    },
    {
      id: 3,
      title: "GAMING",
      group: "GÉNIE INFORMATIQUE - GROUPE 1",
      time: "08:30 - 10:15"
    },
    {
      id: 4,
      title: "DÉVELOPPEMENT MOBILE",
      group: "GÉNIE INFORMATIQUE - GROUPE 1",
      time: "10:30 - 12:30"
    },
    {
      id: 5,
      title: "GAMING",
      group: "GÉNIE INFORMATIQUE - GROUPE 1",
      time: "08:00 - 10:00"
    },
    {
      id: 6,
      title: "SQL SERVER BASE DE DONNEE",
      group: "GÉNIE INFORMATIQUE - GROUPE 1",
      time: "09:00 - 11:00"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 font-sans animate-in fade-in zoom-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-white/5">
          <Clock className="w-6 h-6 text-[#003a8c]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#001A4B] italic">Suivi des Absences</h1>
          <p className="text-sm text-white/50">Gérez la présence de vos étudiants pour toutes vos sessions d'enseignement.</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <div key={session.id} className="bg-white rounded-3xl p-8 shadow-sm border border-white/5 flex flex-col justify-between h-full group hover:shadow-md transition-all">
            
            <div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                <Clock className="w-5 h-5 text-blue-700" />
              </div>
              
              <h2 className="text-lg font-black text-white mb-2">{session.title}</h2>
              
              <div className="inline-block bg-white/[0.05] text-white/50 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-4">
                GROUPE : {session.group}
              </div>
              
              <div className="text-sm text-gray-400 font-bold italic mb-8">
                {session.time}
              </div>
            </div>

            <Link 
              to={`/professor/absences/call/${session.id}`}
              className="text-[#003a8c] font-bold flex items-center gap-2 hover:text-[#002a66] transition-colors group-hover:gap-3"
            >
              Faire l'appel <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>

    </div>
  );
}
