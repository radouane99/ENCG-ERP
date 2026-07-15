import React from 'react';
import { Map, Cpu, Zap, Thermometer, Wifi, Users, AlertCircle, Video, Maximize } from 'lucide-react';
import { cn } from '@shared/lib/utils';

import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';

export default function AdminSmartCampus() {
  const { data: campusData } = useQuery({
    queryKey: ['admin-smart-campus'],
    queryFn: () => api.get('/admin/smart-campus').then(res => res.data.data)
  });

  const rooms = campusData?.rooms || [];
  const energy = campusData?.energy || '0 kWh';
  const occupants = campusData?.occupants || 0;

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24 h-[calc(100vh-80px)] flex flex-col">
      
      {/* Header Banner */}
      <div className="bg-[#0b1021] rounded-[2rem] p-6 md:p-8 relative overflow-hidden shadow-2xl border border-white/10 shrink-0">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
              <Map className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1">
                <Cpu className="w-3.5 h-3.5" /> Jumeau Numérique Actif
              </div>
              <h1 className="text-3xl font-black text-white">Smart Campus ENCG</h1>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-md flex items-center gap-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase">Consommation</div>
                <div className="text-white font-black">{energy}</div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-md flex items-center gap-3">
              <Users className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase">Sur Campus</div>
                <div className="text-white font-black">{occupants} pers.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1 min-h-0">
        
        {/* Interactive Map */}
        <div className="flex-1 bg-white rounded-[2rem] border border-white/10 shadow-sm relative overflow-hidden flex items-center justify-center">
          <div className="absolute top-4 right-4 bg-white shadow-md rounded-lg p-2 flex flex-col gap-2 z-10">
            <button className="p-2 hover:bg-white/[0.05] rounded-md transition-colors"><Maximize className="w-4 h-4 text-white/80" /></button>
          </div>

          {/* 2D/3D Map Background */}
          <div className="absolute inset-0 bg-[#f8fafc] flex flex-col items-center justify-center p-8">
            <div className="text-gray-300 font-black text-2xl uppercase tracking-widest mb-8">Plan Interactif du Campus ENCG</div>
            
            {/* Very abstract campus layout */}
            <div className="w-full max-w-2xl aspect-video bg-white rounded-3xl border-4 border-white/10 shadow-inner relative p-4 grid grid-cols-4 grid-rows-3 gap-2">
              
              <div className="col-span-2 row-span-2 bg-blue-50 border-2 border-blue-200 rounded-xl relative group cursor-pointer hover:bg-blue-100 transition-colors">
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-bold text-blue-900">Amphi Al Khwarizmi</span>
                  <span className="text-xs text-blue-600">85% Occupé</span>
                </div>
              </div>

              <div className="col-span-2 row-span-1 bg-white/[0.05] border-2 border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                <span className="font-bold text-white/50">Amphi Ibn Sina</span>
              </div>

              <div className="col-span-1 row-span-1 bg-rose-50 border-2 border-rose-200 rounded-xl relative cursor-pointer hover:bg-rose-100 transition-colors flex items-center justify-center">
                <div className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                  <AlertCircle className="w-3 h-3" />
                </div>
                <span className="font-bold text-rose-900 text-center text-sm">Labo 3</span>
              </div>

              <div className="col-span-1 row-span-1 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-emerald-100 transition-colors">
                <span className="font-bold text-emerald-900">B12</span>
              </div>

              <div className="col-span-4 row-span-1 bg-indigo-50 border-2 border-indigo-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-indigo-100 transition-colors">
                <span className="font-bold text-indigo-900">Bibliothèque Centrale</span>
              </div>

            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full md:w-96 bg-white rounded-[2rem] border border-white/10 shadow-sm p-6 overflow-y-auto custom-scrollbar">
          <h3 className="text-lg font-black text-white mb-6">État des Infrastructures</h3>
          
          <div className="space-y-4">
            {rooms.map((room: any, idx: number) => (
              <div key={idx} className={cn(
                "p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md",
                room.alert ? "border-rose-200 bg-rose-50/50" : "border-white/5 hover:border-blue-200"
              )}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-white text-sm">{room.name}</h4>
                    <span className="text-[10px] text-white/50 uppercase tracking-widest">{room.type}</span>
                  </div>
                  {room.alert && (
                    <span className="bg-rose-100 text-rose-700 p-1.5 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                    </span>
                  )}
                </div>

                {room.alert && (
                  <div className="text-xs font-bold text-rose-600 mb-3">{room.alert}</div>
                )}

                <div className="flex items-center gap-3 text-xs font-medium text-white/70 mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {room.occupancy}</div>
                  <div className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" /> {room.temp}</div>
                  <div className="flex items-center gap-1"><Zap className={cn("w-3.5 h-3.5", room.energy === 'High' ? "text-amber-500" : "text-gray-400")} /> {room.energy}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-black text-white mb-4 uppercase tracking-widest">Caméras de Sécurité (IoT)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-video bg-gray-900 rounded-xl relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors"></div>
                <div className="absolute top-2 left-2 flex items-center gap-1 text-[8px] text-white font-mono bg-black/50 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> REC
                </div>
                <div className="absolute bottom-2 left-2 text-[10px] text-white/80">Portail Principal</div>
              </div>
              <div className="aspect-video bg-gray-900 rounded-xl relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors"></div>
                <div className="absolute top-2 left-2 flex items-center gap-1 text-[8px] text-white font-mono bg-black/50 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> REC
                </div>
                <div className="absolute bottom-2 left-2 text-[10px] text-white/80">Couloir A</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
