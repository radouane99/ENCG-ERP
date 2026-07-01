import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Book } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function AdminTextbooksPage() {
  const textbooks = [
    { 
      id: 1, 
      date: '31/05/2026', 
      time: '10:00 - 12:00',
      teacher: 'Radouane el asri', 
      department: 'Génie Informatique',
      module: 'Introduction - Génie Informatique', 
      group: 'Génie Informatique - Groupe 1', 
      nature: 'TD', 
      objective: 'Les exercices' 
    },
  ]

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex justify-center mb-8">
        <h1 className="text-2xl font-bold text-[#0f2863] italic">
          Suivi Global des Cahiers de Textes
        </h1>
      </div>

      {/* Banner */}
      <div className="bg-[#0f2863] p-8 text-white rounded-[1.5rem] shadow-lg relative overflow-hidden max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold italic mb-2 relative z-10">Supervision Pédagogique</h2>
        <p className="text-white/80 text-sm font-medium relative z-10">
          Consultez et filtrez tous les cahiers de textes saisis par l'ensemble des professeurs de l'UPF.
        </p>
      </div>

      {/* Filters */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 items-end bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
        <div className="flex-1 w-full space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2">Enseignant</label>
          <select className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-no-repeat bg-right" style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundSize: '0.65em auto', backgroundPosition: 'right 1rem center' }}>
            <option>Tous les professeurs</option>
          </select>
        </div>
        <div className="flex-1 w-full space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2">Groupe / Classe</label>
          <select className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-no-repeat bg-right" style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundSize: '0.65em auto', backgroundPosition: 'right 1rem center' }}>
            <option>Tous les groupes</option>
          </select>
        </div>
        <div className="flex-1 w-full space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2">Nature de Séance</label>
          <select className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none bg-no-repeat bg-right" style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundSize: '0.65em auto', backgroundPosition: 'right 1rem center' }}>
            <option>Toutes les natures</option>
          </select>
        </div>
        <div className="w-full md:w-auto">
          <button className="w-full md:w-32 py-3.5 bg-[#0f2863] text-white font-bold rounded-2xl hover:bg-[#1a387e] transition-colors text-xs uppercase tracking-wider shadow-md">
            Filtrer
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="max-w-5xl mx-auto bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden p-6 md:p-8">
        <h3 className="text-lg font-bold text-[#0f2863] italic mb-6">Saisies de Séances Générales</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-4">DATE & CRÉNEAU</th>
                <th className="px-4 py-4">ENSEIGNANT</th>
                <th className="px-4 py-4">MODULE / GROUPE</th>
                <th className="px-4 py-4">NATURE</th>
                <th className="px-4 py-4">OBJECTIF PÉDAGOGIQUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {textbooks.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-5">
                    <div className="font-bold text-slate-800 text-sm mb-0.5">{row.date}</div>
                    <div className="text-[10px] text-slate-400">{row.time}</div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-bold text-slate-800 text-sm mb-0.5">{row.teacher}</div>
                    <div className="text-[10px] text-slate-400">{row.department}</div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-bold text-[#0f2863] text-sm mb-0.5">{row.module}</div>
                    <div className="text-[10px] text-blue-500 font-bold">{row.group}</div>
                  </td>
                  <td className="px-4 py-5">
                    <span className="font-bold text-amber-500 text-sm">
                      {row.nature}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-slate-600 font-medium">
                    {row.objective}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
