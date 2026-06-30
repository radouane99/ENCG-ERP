import React, { useState } from 'react';
import { Camera, QrCode, AlertTriangle } from 'lucide-react';

export default function ProfessorScanner() {
  const [exam, setExam] = useState('');
  const [room, setRoom] = useState('');
  const [camera, setCamera] = useState('');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 font-sans animate-in fade-in zoom-in duration-500">
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-[#001A4B] flex items-center gap-3">
          <Camera className="w-6 h-6 text-white/50" />
          Scanner Présences Examens
        </h1>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <div className="w-4 h-px bg-gray-300"></div> Tableau de bord
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-white/5 p-8">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white flex items-center justify-between shadow-lg mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Scanner Mobile PWA</h2>
              <p className="text-sm text-blue-200">Surveillance en temps réel avec garde-fous multi-salles</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-6 py-2 text-center">
            <div className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Présents Scannés</div>
            <div className="text-3xl font-black">0</div>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Examen Actuel (Obligatoire)</label>
            <select 
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Sélectionner l'examen --</option>
              <option value="1">Introduction - Génie Civil CC1</option>
              <option value="2">GAMING CC1</option>
            </select>
            <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" /> Requis pour associer l'étudiant Ã  cet examen.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Votre Salle Actuelle</label>
            <select 
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Sélectionner la salle --</option>
              <option value="1">Amphi Ibn Khaldoun</option>
              <option value="2">Labo Info 1</option>
            </select>
            <p className="text-[10px] text-gray-400 font-medium mt-1">Optionnel - Anti-collision.</p>
          </div>

          <div className="space-y-2 md:col-span-2 max-w-md">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Caméra Active</label>
            <select 
              value={camera}
              onChange={(e) => setCamera(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Recherche des caméras...</option>
            </select>
          </div>
        </div>

        {/* Camera Viewfinder (Mock) */}
        <div className="w-full h-[400px] bg-[#0f172a] rounded-2xl border-2 border-dashed border-gray-700 relative flex items-center justify-center overflow-hidden">
          <div className="absolute inset-4 border border-blue-500/30 rounded-xl"></div>
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500 rounded-tl-xl m-4"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500 rounded-tr-xl m-4"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500 rounded-bl-xl m-4"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500 rounded-br-xl m-4"></div>
          
          <div className="w-full h-px bg-red-500 absolute top-1/2 left-0 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-scan"></div>
          
          <div className="text-white/50 font-medium flex flex-col items-center gap-2">
            <QrCode className="w-12 h-12 text-white/70" />
            Veuillez sélectionner un examen pour activer la caméra
          </div>
        </div>

      </div>
    </div>
  );
}
