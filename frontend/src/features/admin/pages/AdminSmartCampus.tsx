import React from 'react';
import { useTranslation } from 'react-i18next';
import { Map, Cpu, Zap, Thermometer, Users, AlertCircle, Video, Maximize } from 'lucide-react';
import { cn } from '@shared/lib/utils';

import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';

export default function AdminSmartCampus() {
  const { t } = useTranslation(['admin', 'common']);

  const { data: campusData } = useQuery({
    queryKey: ['admin-smart-campus'],
    queryFn: () => api.get('/admin/smart-campus').then((res) => res.data.data)
  });

  const rooms = campusData?.rooms || [];
  const energy = campusData?.energy || '0 kWh';
  const occupants = campusData?.occupants || 0;

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24 h-[calc(100vh-80px)] flex flex-col">
      {/* Header Banner */}
      <div className="bg-[#0b1021] rounded-[2rem] p-6 md:p-8 relative overflow-hidden shadow-2xl border border-white/10 shrink-0">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />

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
        <div className="flex-1 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden flex items-center justify-center">
          <div className="absolute top-4 right-4 bg-slate-800 shadow-md rounded-lg p-2 flex flex-col gap-2 z-10 border border-slate-700">
            <button className="p-2 hover:bg-slate-700 rounded-md transition-colors" type="button">
              <Maximize className="w-4 h-4 text-slate-300" />
            </button>
          </div>

          {/* 2D/3D Map Background */}
          <div className="absolute inset-0 bg-[#0f172a] flex flex-col items-center justify-center p-8">
            <div className="text-slate-400 font-black text-xl uppercase tracking-widest mb-8 flex items-center gap-2">
              <Map className="w-5 h-5 text-indigo-400" />
              Plan Interactif du Campus ENCG
            </div>

            {/* Abstract campus layout */}
            <div className="w-full max-w-2xl aspect-video bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-2xl relative p-4 grid grid-cols-4 grid-rows-3 gap-3">
              <div className="col-span-2 row-span-2 bg-indigo-950/60 border-2 border-indigo-500/40 rounded-2xl relative group cursor-pointer hover:bg-indigo-900/60 transition-all p-4">
                <div className="absolute top-3 right-3 flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-extrabold text-white text-base">Amphi Al Khwarizmi</span>
                  <span className="text-xs font-semibold text-indigo-300 mt-1">85% Occupé</span>
                </div>
              </div>

              <div className="col-span-2 row-span-1 bg-slate-800/80 border-2 border-slate-700 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-all">
                <span className="font-extrabold text-slate-300">Amphi Ibn Sina</span>
              </div>

              <div className="col-span-1 row-span-1 bg-rose-950/60 border-2 border-rose-500/40 rounded-2xl relative cursor-pointer hover:bg-rose-900/60 transition-all flex items-center justify-center p-2">
                <div className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
                <span className="font-extrabold text-rose-200 text-center text-xs">Labo 3</span>
              </div>

              <div className="col-span-1 row-span-1 bg-emerald-950/60 border-2 border-emerald-500/40 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-emerald-900/60 transition-all">
                <span className="font-extrabold text-emerald-300 text-sm">B12</span>
              </div>

              <div className="col-span-4 row-span-1 bg-blue-950/60 border-2 border-blue-500/40 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-blue-900/60 transition-all">
                <span className="font-extrabold text-blue-200 text-base">Bibliothèque Centrale</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full md:w-96 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-y-auto custom-scrollbar">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            État des Infrastructures
          </h3>

          <div className="space-y-4">
            {rooms.map((room: any, idx: number) => (
              <div
                key={idx}
                className={cn(
                  'p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md',
                  room.alert
                    ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-300'
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{room.name}</h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
                      {room.type}
                    </span>
                  </div>
                  {room.alert && (
                    <span className="bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 p-1.5 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                    </span>
                  )}
                </div>

                {room.alert && (
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-3">{room.alert}</div>
                )}

                <div className="flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> {room.occupancy}
                  </div>
                  <div className="flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-slate-400" /> {room.temp}
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap
                      className={cn(
                        'w-3.5 h-3.5',
                        room.energy === 'High' ? 'text-amber-500' : 'text-slate-400'
                      )}
                    />{' '}
                    {room.energy}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
              <Video className="w-4 h-4 text-rose-500" />
              Caméras de Sécurité (IoT)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-video bg-slate-900 rounded-xl relative overflow-hidden group cursor-pointer border border-slate-800 shadow-md">
                <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors" />
                <div className="absolute top-2 left-2 flex items-center gap-1 text-[8px] text-white font-mono bg-black/70 px-1.5 py-0.5 rounded font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> REC
                </div>
                <div className="absolute bottom-2 left-2 text-[10px] text-white font-bold bg-slate-950/80 px-2 py-0.5 rounded">
                  Portail Principal
                </div>
              </div>
              <div className="aspect-video bg-slate-900 rounded-xl relative overflow-hidden group cursor-pointer border border-slate-800 shadow-md">
                <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors" />
                <div className="absolute top-2 left-2 flex items-center gap-1 text-[8px] text-white font-mono bg-black/70 px-1.5 py-0.5 rounded font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> REC
                </div>
                <div className="absolute bottom-2 left-2 text-[10px] text-white font-bold bg-slate-950/80 px-2 py-0.5 rounded">
                  Couloir A
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

