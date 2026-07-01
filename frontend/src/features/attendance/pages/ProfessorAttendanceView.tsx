import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { Play, Square, Users, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import api from '@/shared/lib/api';

export default function ProfessorAttendanceView() {
  const { t } = useTranslation('common');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  // Form states
  const [moduleName, setModuleName] = useState('Analyse Financière S3');
  const [groupName, setGroupName] = useState('GFC-G1');
  const [roomName, setRoomName] = useState('Amphi 2');
  const [duration, setDuration] = useState('15');

  const startSession = async () => {
    try {
      // In a real scenario, we'd get current coords if GPS validation is needed
      const res = await api.post('/v1/professor/attendance/session', {
        module_name: moduleName,
        group_name: groupName,
        room_name: roomName,
        duration_minutes: parseInt(duration),
        latitude: 34.0042, // Mock Fès coords
        longitude: -4.9998,
      });
      setSession(res.data.data);
      setIsSessionActive(true);
    } catch (e) {
      console.error(e);
    }
  };

  const endSession = () => {
    setIsSessionActive(false);
    setSession(null);
    setStats(null);
  };

  useEffect(() => {
    let interval: any;
    if (isSessionActive && session) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/v1/professor/attendance/session/${session.id}/stats`);
          setStats(res.data.data);
        } catch (e) { console.error('[AttendancePoller] Failed to fetch session stats:', e) }
      }, 3000); // Poll every 3 seconds for new scans
    }
    return () => clearInterval(interval);
  }, [isSessionActive, session]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestion des Absences</h1>
        <p className="text-white/50 mt-1">Générez un code QR dynamique pour enregistrer la présence.</p>
      </div>

      {!isSessionActive ? (
        <div className="bg-card border border-white/10 p-6 rounded-2xl max-w-2xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Nouvelle Session</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Module</label>
              <input 
                type="text" 
                value={moduleName}
                onChange={e => setModuleName(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Groupe / Classe</label>
              <input 
                type="text" 
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Salle</label>
              <input 
                type="text" 
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Durée de validité (minutes)</label>
              <select 
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2"
              >
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              onClick={startSession}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              <Play className="w-5 h-5" /> Démarrer la session
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 bg-card border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-4 right-4 animate-pulse flex items-center gap-2 text-emerald-500 font-medium text-sm bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Session Active
            </div>
            
            <h2 className="text-3xl font-bold text-foreground mb-2">{session.module_name}</h2>
            <div className="flex gap-4 text-white/50 text-sm mb-8 font-medium">
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {session.group_name}</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {session.room_name}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Expire Ã  {new Date(session.expires_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mb-6 transition-transform hover:scale-105 duration-300">
              <QRCode value={session.qr_token} size={300} level="H" />
            </div>
            
            <p className="text-white/50 text-lg mb-8">
              Demandez aux étudiants de scanner ce code depuis leur application.
            </p>

            <button 
              onClick={endSession}
              className="flex items-center gap-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 py-3 px-8 rounded-xl font-semibold transition-colors border border-red-500/20"
            >
              <Square className="w-5 h-5" /> Clôturer la session
            </button>
          </div>

          {/* Stats Panel */}
          <div className="col-span-1 bg-card border border-white/10 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <h3 className="font-bold text-lg text-foreground">Présences</h3>
              <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg">
                {stats?.scans_count || 0}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {stats?.students?.length > 0 ? (
                stats.students.map((student: any) => (
                  <div key={student.id} className="flex items-center gap-3 p-3 bg-white/5/50 rounded-xl border border-white/10/50 animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{student.name}</p>
                      <p className="text-xs text-white/50">{new Date(student.scanned_at).toLocaleTimeString('fr-FR')}</p>
                    </div>
                    {student.is_valid && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/50/60 space-y-2 py-10">
                  <Clock className="w-8 h-8 opacity-50" />
                  <p className="text-sm">En attente de scans...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
