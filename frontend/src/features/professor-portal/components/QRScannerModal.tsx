import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  Users,
  Search,
  Check,
  Clock,
  UserX,
  ShieldCheck,
  Save,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';
import { toast } from 'sonner';
import { cn } from '@shared/lib/utils';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | number;
  sessionData?: {
    title?: string;
    group?: string;
    room?: string;
    time?: string;
    filiere_code?: string;
  };
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export function QRScannerModal({ isOpen, onClose, sessionId, sessionData }: QRScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'scan' | 'checklist'>('checklist');
  const [manualCode, setManualCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; warning?: string } | null>(null);
  const [studentStatuses, setStudentStatuses] = useState<Record<number, AttendanceStatus>>({});

  // 1. Fetch Students of the group for the checklist
  const { data: students = [], isLoading: isLoadingStudents, refetch: refetchStudents } = useQuery({
    queryKey: ['group-students-attendance', sessionId, sessionData?.group, sessionData?.filiere_code],
    queryFn: async () => {
      const res = await api.get('/professor/attendance/students', {
        params: {
          group_label: sessionData?.group,
          filiere_code: sessionData?.filiere_code,
          semester_number: (sessionData as any)?.semester_label ? parseInt((sessionData as any).semester_label.replace(/\D/g, ''), 10) : undefined,
        },
      });
      return res.data?.data || [];
    },
    enabled: isOpen,
  });

  // Initialize all students as present
  useEffect(() => {
    if (students.length > 0) {
      const initial: Record<number, AttendanceStatus> = {};
      students.forEach((s: any) => {
        initial[s.id] = initial[s.id] || 'present';
      });
      setStudentStatuses(initial);
    }
  }, [students]);

  // QR Scan Mutation
  const scanMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await api.post(`/professor/attendance/${sessionId}/scan`, { token });
      return res.data;
    },
    onSuccess: (data) => {
      setScanResult({
        success: true,
        message: `${data.student_name || 'Étudiant'} a été marqué présent.`,
        warning: data.warning,
      });
      setManualCode('');
      setTimeout(() => setScanResult(null), 3000);
    },
    onError: (error: any) => {
      setScanResult({
        success: false,
        message: error.response?.data?.message || 'Code invalide ou étudiant introuvable.',
      });
      setTimeout(() => setScanResult(null), 3000);
    },
  });

  // Batch Save Checklist Attendance Mutation
  const saveChecklistMutation = useMutation({
    mutationFn: async () => {
      const records = Object.entries(studentStatuses).map(([studentId, status]) => ({
        student_id: Number(studentId),
        status,
      }));
      const res = await api.post('/professor/attendance/save', {
        session_id: typeof sessionId === 'number' ? sessionId : null,
        records,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('✅ Feuille d’appel et émargement enregistrés avec succès !');
      onClose();
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement de l'appel.");
    },
  });

  const handleSimulateScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    scanMutation.mutate(manualCode);
  };

  const handleSetAllStatus = (status: AttendanceStatus) => {
    const updated: Record<number, AttendanceStatus> = {};
    students.forEach((s: any) => {
      updated[s.id] = status;
    });
    setStudentStatuses(updated);
  };

  const toggleStudentStatus = (studentId: number, status: AttendanceStatus) => {
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const filteredStudents = students.filter((s: any) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.cne || '').toLowerCase().includes(q) ||
      (s.apogee || '').toString().includes(q)
    );
  });

  // Calculate live metrics
  const totalCount = students.length;
  const presentCount = Object.values(studentStatuses).filter((st) => st === 'present').length;
  const absentCount = Object.values(studentStatuses).filter((st) => st === 'absent').length;
  const lateCount = Object.values(studentStatuses).filter((st) => st === 'late').length;
  const excusedCount = Object.values(studentStatuses).filter((st) => st === 'excused').length;
  const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#001A4B] rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col relative text-white max-h-[90vh]"
        >
          {/* Header Bar */}
          <div className="p-6 pb-4 border-b border-white/10 flex items-start justify-between relative bg-white/5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-[#001A4B] text-[10px] font-black uppercase tracking-wider">
                  Émargement & Appel
                </span>
                {sessionData?.group && (
                  <span className="text-xs font-bold text-blue-200">{sessionData.group}</span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                {sessionData?.title || 'Faire l’Appel de la Séance'}
              </h2>
              <div className="flex items-center gap-3 text-xs text-blue-200/80 mt-0.5">
                {sessionData?.room && <span>📍 {sessionData.room}</span>}
                {sessionData?.time && <span>⏰ {sessionData.time}</span>}
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-white/60 hover:text-white bg-white/10 p-2 rounded-full transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="px-6 pt-4 flex gap-2">
            <button
              onClick={() => setActiveTab('checklist')}
              className={cn(
                "flex-1 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
                activeTab === 'checklist'
                  ? "bg-amber-400 text-[#001A4B] shadow-md"
                  : "bg-white/10 text-white hover:bg-white/15"
              )}
            >
              <ListChecks className="w-4 h-4" /> Feuille d'Appel (Liste du Groupe)
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={cn(
                "flex-1 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
                activeTab === 'scan'
                  ? "bg-emerald-400 text-[#001A4B] shadow-md"
                  : "bg-white/10 text-white hover:bg-white/15"
              )}
            >
              <QrCode className="w-4 h-4" /> Scanner QR Code (Wallet Étudiant)
            </button>
          </div>

          {/* ── TAB 1: CHECKLIST / LISTE DU GROUPE ── */}
          {activeTab === 'checklist' && (
            <div className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-emerald-500/15 border border-emerald-400/30 rounded-2xl p-2.5 text-center">
                  <div className="text-lg font-black text-emerald-400">{presentCount}</div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-emerald-300">Présents</div>
                </div>
                <div className="bg-rose-500/15 border border-rose-400/30 rounded-2xl p-2.5 text-center">
                  <div className="text-lg font-black text-rose-400">{absentCount}</div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-rose-300">Absents</div>
                </div>
                <div className="bg-amber-500/15 border border-amber-400/30 rounded-2xl p-2.5 text-center">
                  <div className="text-lg font-black text-amber-400">{lateCount}</div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-amber-300">En Retard</div>
                </div>
                <div className="bg-indigo-500/15 border border-indigo-400/30 rounded-2xl p-2.5 text-center">
                  <div className="text-lg font-black text-indigo-400">{excusedCount}</div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-indigo-300">Excusés</div>
                </div>
              </div>

              {/* Quick Actions & Search */}
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Chercher étudiant / CNE..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleSetAllStatus('present')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 transition-all cursor-pointer"
                  >
                    ✓ Tous Présents
                  </button>
                  <button
                    onClick={() => handleSetAllStatus('absent')}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold border border-rose-500/30 transition-all cursor-pointer"
                  >
                    ✗ Tous Absents
                  </button>
                </div>
              </div>

              {/* Students Scrollable List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[320px]">
                {isLoadingStudents ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-blue-200">
                    <Spinner className="w-6 h-6 text-amber-400" />
                    <span className="text-xs font-bold">Chargement de la liste des étudiants...</span>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="py-12 text-center text-white/50 text-xs">
                    Aucun étudiant trouvé.
                  </div>
                ) : (
                  filteredStudents.map((student: any) => {
                    const status = studentStatuses[student.id] || 'present';
                    return (
                      <div
                        key={student.id}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/10 text-white font-black text-xs flex items-center justify-center shrink-0 border border-white/10">
                            {student.name?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <div className="text-xs font-black text-white">{student.name}</div>
                            <div className="text-[10px] text-blue-200/70 font-mono">
                              CNE: {student.cne} · Apogée: {student.apogee}
                            </div>
                          </div>
                        </div>

                        {/* Status Toggle Buttons */}
                        <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl shrink-0">
                          <button
                            onClick={() => toggleStudentStatus(student.id, 'present')}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                              status === 'present'
                                ? "bg-emerald-500 text-white shadow-xs"
                                : "text-white/40 hover:text-white"
                            )}
                          >
                            Présent
                          </button>
                          <button
                            onClick={() => toggleStudentStatus(student.id, 'absent')}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                              status === 'absent'
                                ? "bg-rose-500 text-white shadow-xs"
                                : "text-white/40 hover:text-white"
                            )}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => toggleStudentStatus(student.id, 'late')}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                              status === 'late'
                                ? "bg-amber-500 text-[#001A4B] shadow-xs"
                                : "text-white/40 hover:text-white"
                            )}
                          >
                            Retard
                          </button>
                          <button
                            onClick={() => toggleStudentStatus(student.id, 'excused')}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                              status === 'excused'
                                ? "bg-indigo-500 text-white shadow-xs"
                                : "text-white/40 hover:text-white"
                            )}
                          >
                            Excusé
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Validation Button */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div className="text-xs text-blue-200">
                  Taux de présence estimé : <strong className="text-emerald-400 font-black">{rate}%</strong> ({presentCount}/{totalCount})
                </div>

                <button
                  onClick={() => saveChecklistMutation.mutate()}
                  disabled={saveChecklistMutation.isPending || totalCount === 0}
                  className="px-6 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-[#001A4B] rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  {saveChecklistMutation.isPending ? (
                    <Spinner className="w-4 h-4 text-[#001A4B]" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Valider & Enregistrer l'Émargement
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 2: QR CODE SCANNER ── */}
          {activeTab === 'scan' && (
            <div className="p-6 flex flex-col items-center relative space-y-6">
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md relative">
                <div className="absolute inset-0 border-2 border-emerald-400 rounded-2xl animate-pulse opacity-50"></div>
                <QrCode className="w-10 h-10 text-emerald-400" />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-black text-white">Scanner de Présence Instantané</h3>
                <p className="text-xs text-blue-200 max-w-sm mt-1">
                  Scannez le QR Code depuis le Wallet étudiant ou entrez le matricule / CNE manuellement.
                </p>
              </div>

              {/* Laser Viewport */}
              <div className="w-64 h-64 bg-black/40 rounded-3xl border border-white/10 relative overflow-hidden flex items-center justify-center">
                <motion.div
                  animate={{ y: ["0%", "100%", "0%"] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute top-0 left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-10"
                />

                <div className="absolute top-4 left-4 w-7 h-7 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg"></div>
                <div className="absolute top-4 right-4 w-7 h-7 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg"></div>
                <div className="absolute bottom-4 left-4 w-7 h-7 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg"></div>
                <div className="absolute bottom-4 right-4 w-7 h-7 border-b-3 border-r-3 border-emerald-400 rounded-br-lg"></div>

                <div className="text-white/40 font-bold uppercase tracking-widest text-[11px] flex flex-col items-center gap-2">
                  <QrCode className="w-8 h-8 opacity-50" />
                  En attente de scan...
                </div>
              </div>

              {/* Manual Entry Form */}
              <form onSubmit={handleSimulateScan} className="w-full max-w-md flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: CNE / STU-1002"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 transition-colors text-center font-mono text-xs"
                />
                <button
                  type="submit"
                  disabled={scanMutation.isPending || !manualCode.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black text-xs px-6 py-3 rounded-xl transition-colors flex items-center justify-center min-w-[90px] cursor-pointer"
                >
                  {scanMutation.isPending ? <Spinner className="w-4 h-4 text-white" /> : 'Valider'}
                </button>
              </form>

              {/* Scan Toast Feedback */}
              <AnimatePresence>
                {scanResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className={cn(
                      "w-full max-w-md p-3.5 rounded-2xl flex items-center gap-3",
                      scanResult.success ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300" : "bg-rose-500/20 border border-rose-500/30 text-rose-300"
                    )}
                  >
                    {scanResult.success ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                    )}
                    <div className="text-xs font-bold">
                      {scanResult.message}
                      {scanResult.warning && (
                        <div className="text-[10px] text-amber-300 font-normal mt-0.5">{scanResult.warning}</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
