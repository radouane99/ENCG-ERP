import React, { useState } from 'react';
import { cn } from '@shared/lib/utils';

// Mock data matching screenshot
const mockTextbooks = [
  { id: 1, date: '31/05/2026', time: '10:00 - 12:00', teacher: 'Radouane el asri', dept: 'Génie Informatique', module: 'Introduction - Génie Informatique', group: 'Génie Informatique - Groupe 1', nature: 'TD', objective: 'Les exercices' }
];

export default function TextbooksPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Suivi Global des Cahiers de Textes</h1>
      </div>

      <div className="bg-[#002a7a] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 space-y-2">
          <h2 className="text-3xl font-black italic tracking-tight">Supervision Pédagogique</h2>
          <p className="text-white/80 text-sm">
            Consultez et filtrez tous les cahiers de textes saisis par l'ensemble des professeurs de l'UPF.
          </p>
        </div>
        {/* Decorative elements can go here if needed */}
      </div>

      <div className="bg-white rounded-3xl p-6 flex flex-wrap gap-4 items-end shadow-sm border border-white/5/50">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Enseignant</label>
          <select className="w-full bg-white/[0.02] border-0 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 focus:ring-2 focus:ring-[#e6007e]">
            <option>Tous les professeurs</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Groupe / Classe</label>
          <select className="w-full bg-white/[0.02] border-0 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 focus:ring-2 focus:ring-[#e6007e]">
            <option>Tous les groupes</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Nature de séance</label>
          <select className="w-full bg-white/[0.02] border-0 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 focus:ring-2 focus:ring-[#e6007e]">
            <option>Toutes les natures</option>
          </select>
        </div>
        <div className="w-[180px]">
          <button className="w-full bg-[#e6007e] text-white rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider hover:bg-[#c5006c] transition-colors shadow-md shadow-[#e6007e]/30">
            Filtrer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5/50 space-y-6">
        <h3 className="text-xl font-black italic tracking-tight text-white">Saisies de Séances Générales</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] uppercase text-gray-400 font-bold border-b border-white/5">
              <tr>
                <th className="px-4 py-4">Date & Créneau</th>
                <th className="px-4 py-4">Enseignant</th>
                <th className="px-4 py-4">Module / Groupe</th>
                <th className="px-4 py-4">Nature</th>
                <th className="px-4 py-4">Objectif Pédagogique</th>
              </tr>
            </thead>
            <tbody>
              {mockTextbooks.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-white/[0.02]/50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-bold text-white text-sm">{item.date}</div>
                    <div className="text-gray-400 text-xs">{item.time}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-bold text-white text-sm">{item.teacher}</div>
                    <div className="text-gray-400 text-xs">{item.dept}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-bold text-white text-sm">{item.module}</div>
                    <div className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold bg-[#e6007e]/10 text-[#e6007e]">
                      {item.group}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-bold text-[#f5a623] text-xs">
                      {item.nature}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-white/50">
                    {item.objective}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
