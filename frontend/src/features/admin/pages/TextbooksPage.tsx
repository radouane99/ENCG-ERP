import React, { useState } from 'react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { Search } from 'lucide-react';

export default function TextbooksPage() {
  const { data: textbooksData } = useQuery({
    queryKey: ['textbooks'],
    queryFn: () => api.get('/admin/textbooks').then(res => res.data.data || [])
  });

  const textbooks = textbooksData || [];

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
          <h1 className="text-2xl font-bold text-[#e6007e]">Cahiers de Textes</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-10 pr-4 py-2 bg-white rounded-xl text-sm font-medium border border-gray-200 outline-none focus:ring-2 focus:ring-[#e6007e]"
              />
            </div>
            <button className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
              Filtrer
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] uppercase text-gray-400 font-bold border-b border-gray-100">
              <tr>
                <th className="px-4 py-4">SÉANCE</th>
                <th className="px-4 py-4">ENSEIGNANT</th>
                <th className="px-4 py-4">DÉPARTEMENT / FILIÈRE</th>
                <th className="px-4 py-4">MODULE / GROUPE</th>
                <th className="px-4 py-4">NATURE</th>
                <th className="px-4 py-4">OBJECTIF</th>
                <th className="px-4 py-4 text-right">STATUT</th>
              </tr>
            </thead>
            <tbody>
              {textbooks.map((item: any) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-white/[0.02]/50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="font-bold text-gray-900 text-sm">{item.date}</div>
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
