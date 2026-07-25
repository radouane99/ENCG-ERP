import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Map, Cpu, Zap, Thermometer, Users, AlertCircle, Video, Maximize, Sparkles, Power, Wind, ShieldAlert, Radio, Activity, RefreshCw, X, Check, Volume2 } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';

export default function AdminSmartCampus() {
  const { t } = useTranslation(['admin', 'common']);
  const [selectedRoomControls, setSelectedRoomControls] = useState<any>(null);
  const [selectedCamera, setSelectedCamera] = useState<any>(null);
  const [acState, setAcState] = useState<Record<number, boolean>>({});
  const [projState, setProjState] = useState<Record<number, boolean>>({});

  const { data: campusData, isLoading, refetch } = useQuery({
    queryKey: ['admin-smart-campus'],
    queryFn: () => api.get('/admin/smart-campus').then((res) => res.data.data),
    refetchInterval: 10000 // Auto-refresh every 10s
  });

  const rooms = campusData?.rooms || [];
  const energy = campusData?.energy || '0 salles actives';
  const occupants = campusData?.occupants || 0;

  const toggleAC = (roomId: number, roomName: string) => {
    setAcState(prev => {
      const next = !prev[roomId];
      toast.success(`Climatisation ${roomName} : ${next ? 'Allumée (22°C Eco)' : 'Éteinte à distance'}`);
      return { ...prev, [roomId]: next };
    });
  };

  const toggleProjector = (roomId: number, roomName: string) => {
    setProjState(prev => {
      const next = !prev[roomId];
      toast.success(`Vidéoprojecteur ${roomName} : ${next ? 'Allumé (HDMI 1)' : 'Éteint (Mise en veille)'}`);
      return { ...prev, [roomId]: next };
    });
  };

  const handleEmergencyAlert = () => {
    if (confirm('ATTENTION: Voulez-vous vraiment déclencher une alerte générale d\'urgence sur tout le Campus ENCG Fès ?')) {
      toast.error('🚨 ALERTE GÉNÉRALE DÉCLENCHÉE — Message diffusé sur les écrans du Campus !', { duration: 8000 });
    }
  };

  return (
    <div className="space-y-8 animate-in relative p-4 md:p-8 max-w-[1600px] mx-auto font-sans pb-24 min-h-screen">
      {/* Deep Navy Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Top Header Content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <Cpu className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> Jumeau Numérique Actif (IoT Cloud ENCG)
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Smart Campus & IoT ENCG
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Supervision en temps réel de l'occupation des amphis, contrôle énergétique à distance et vidéosurveillance intelligente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider backdrop-blur-md border border-white/20 shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-amber-300" /> Rafraîchir IoT
            </button>
            <button
              onClick={handleEmergencyAlert}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-white" /> 🚨 Alerte Urgence Campus
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">TOTAL LOCAUX SUPERVISÉS</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{rooms.length} Locaux</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300 block">ACTIVITÉ ÉNERGÉTIQUE</span>
            <span className="text-2xl font-black text-yellow-300 font-mono mt-1 block">{energy}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">ÉTIUANTS SUR CAMPUS</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{occupants} pers.</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">ALERTES MAINTENANCE</span>
            <span className="text-2xl font-black text-purple-300 font-mono mt-1 block">
              {rooms.filter((r: any) => r.alert).length} Signalement(s)
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Interactive 2D Campus Map */}
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6 flex flex-col justify-between min-h-[500px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Map className="w-6 h-6 text-indigo-400" />
              <div>
                <h3 className="text-lg font-black text-white">Plan Interactif 2D du Campus ENCG</h3>
                <p className="text-xs text-slate-400">Représentation schématique en direct des amphithéâtres et bâtiments</p>
              </div>
            </div>
            <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Direct Capteurs IoT
            </span>
          </div>

          {/* Interactive Campus Map Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1 items-center">
            {isLoading ? (
              <div className="col-span-3 text-center py-20 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto"></div>
              </div>
            ) : rooms.length === 0 ? (
              <div className="col-span-3 text-center text-slate-400 font-bold text-xs py-12">
                Aucune salle configurée dans le système IoT.
              </div>
            ) : (
              rooms.map((room: any) => {
                const isOccupied = room.status === 'occupied'
                const isAcOn = acState[room.id]
                const isProjOn = projState[room.id]

                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomControls(room)}
                    className={cn(
                      "p-6 rounded-3xl border-2 transition-all cursor-pointer relative group flex flex-col justify-between space-y-4 hover:scale-102 shadow-lg",
                      room.alert 
                        ? "bg-rose-950/40 border-rose-500/50 hover:bg-rose-900/50" 
                        : isOccupied 
                          ? "bg-indigo-950/60 border-indigo-500/50 hover:bg-indigo-900/60" 
                          : "bg-slate-800/80 border-slate-700/80 hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{room.type}</span>
                      <span className={cn(
                        "w-3 h-3 rounded-full animate-pulse",
                        room.alert ? "bg-rose-500" : isOccupied ? "bg-emerald-400" : "bg-slate-500"
                      )} />
                    </div>

                    <div>
                      <h4 className="font-black text-white text-base group-hover:text-indigo-300 transition-colors">{room.name}</h4>
                      <p className={cn("text-xs font-bold mt-1", isOccupied ? "text-emerald-400" : "text-slate-400")}>
                        {isOccupied ? `Occupé (${room.occupancy})` : 'Disponible (0%)'}
                      </p>
                    </div>

                    {/* Room Quick Controls & Indicators */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-amber-400" /> {room.temp}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleAC(room.id, room.name); }}
                          className={cn("p-1.5 rounded-lg border text-[10px] font-black transition-all", isAcOn ? "bg-blue-600 border-blue-400 text-white" : "bg-slate-700 border-slate-600 text-slate-400")}
                          title="Climatisation"
                        >
                          ❄️ Clim
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleProjector(room.id, room.name); }}
                          className={cn("p-1.5 rounded-lg border text-[10px] font-black transition-all", isProjOn ? "bg-amber-600 border-amber-400 text-white" : "bg-slate-700 border-slate-600 text-slate-400")}
                          title="Vidéoprojecteur"
                        >
                          📹 Proj
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Infrastructure Status & Live IoT Security Cameras */}
        <div className="space-y-6">
          {/* Infrastructure Controls Sidebar */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> État des Capteurs IoT
              </h3>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {rooms.map((room: any) => (
                <div 
                  key={room.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex items-center justify-between",
                    room.alert ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700/80"
                  )}
                >
                  <div>
                    <p className="font-black text-xs text-slate-900 dark:text-white">{room.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{room.alert || `Temp: ${room.temp} • Charge: ${room.energy}`}</p>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[9px] font-black uppercase",
                    room.status === 'occupied' ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                  )}>
                    {room.status === 'occupied' ? 'Occupé' : 'Libre'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* IoT Live Security Cameras */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Video className="w-4 h-4 text-rose-500" /> Caméras de Sécurité (IoT AI)
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'cam1', name: 'Portail Principal ENCG', status: 'En Direct' },
                { id: 'cam2', name: 'Couloir Amphithéâtres', status: 'En Direct' },
                { id: 'cam3', name: 'Esplanade Centrale', status: 'En Direct' },
                { id: 'cam4', name: 'Hall Bibliothèque', status: 'En Direct' }
              ].map((cam) => (
                <div 
                  key={cam.id}
                  onClick={() => setSelectedCamera(cam)}
                  className="aspect-video bg-slate-900 rounded-2xl relative overflow-hidden group cursor-pointer border border-slate-800 shadow-md hover:border-indigo-500 transition-all"
                >
                  <div className="absolute top-2 left-2 flex items-center gap-1 text-[8px] text-white font-mono bg-black/80 px-2 py-0.5 rounded-full font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> REC
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center text-slate-600 group-hover:text-indigo-400 transition-colors">
                    <Video className="w-6 h-6" />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 text-[9px] text-white font-black bg-slate-950/80 px-2 py-1 rounded-xl truncate">
                    {cam.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Camera Fullscreen */}
      {selectedCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden text-white">
            <div className="p-6 bg-slate-900 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="font-black text-base">Flux Vidéo IoT — {selectedCamera.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedCamera(null)}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 aspect-video bg-black flex flex-col items-center justify-center relative">
              <Video className="w-16 h-16 text-slate-700 animate-pulse mb-3" />
              <p className="text-xs font-bold text-slate-400">Flux HD 1080p en direct de la caméra {selectedCamera.name}</p>
              <span className="absolute bottom-4 left-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                IA Détection de Foules : Normale (0 anomalie)
              </span>
            </div>
            <div className="p-4 bg-slate-900 flex justify-end">
              <button 
                onClick={() => setSelectedCamera(null)}
                className="px-6 py-2.5 bg-slate-800 text-white font-black rounded-xl text-xs hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Fermer Le Flux
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Room Remote Control */}
      {selectedRoomControls && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Télécommande IoT à Distance</span>
                <h2 className="text-lg font-black">{selectedRoomControls.name}</h2>
              </div>
              <button 
                onClick={() => setSelectedRoomControls(null)}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                  <span className="text-slate-400 text-[10px] block uppercase">Statut Occupation</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm block mt-0.5">{selectedRoomControls.occupancy}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                  <span className="text-slate-400 text-[10px] block uppercase">Température Ambiante</span>
                  <span className="text-amber-600 font-black text-sm block mt-0.5">{selectedRoomControls.temp}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Contrôle des Équipements</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => toggleAC(selectedRoomControls.id, selectedRoomControls.name)}
                    className="p-4 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Wind className="w-4 h-4" /> Régler Clim (22°C)
                  </button>
                  <button 
                    onClick={() => toggleProjector(selectedRoomControls.id, selectedRoomControls.name)}
                    className="p-4 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Power className="w-4 h-4" /> Basculer Projecteur
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <button 
                onClick={() => setSelectedRoomControls(null)}
                className="px-6 py-2.5 bg-slate-900 dark:bg-slate-700 text-white font-black rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fermer Télécommande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
