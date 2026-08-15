import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Users, BookOpen, MapPin, ChevronRight, X, User, 
  Zap, FileSpreadsheet, Calendar, Scale, Landmark, ShieldCheck, 
  Layers, ArrowRight, Sparkles, Clock, CheckCircle2
} from 'lucide-react';
import api from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickAction {
  id: string;
  title: string;
  category: 'Actions Rapides' | 'Navigation';
  description: string;
  icon: any;
  iconColor: string;
  path: string;
  shortcut?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'act-apogee',
    title: 'Exporter Fichier APOGEE (MESRSFC)',
    category: 'Actions Rapides',
    description: 'Format ministériel CSV officiel avec code 040 et barème LMD',
    icon: FileSpreadsheet,
    iconColor: 'text-emerald-500 bg-emerald-500/10',
    path: '/admin/exams/pv-archive',
    shortcut: 'Alt + A',
  },
  {
    id: 'act-csp-schedules',
    title: 'Générateur Emploi du Temps CSP IA',
    category: 'Actions Rapides',
    description: 'Solveur de contraintes anti-conflits pour plannings de cours',
    icon: Calendar,
    iconColor: 'text-indigo-500 bg-indigo-500/10',
    path: '/admin/schedules/engine',
    shortcut: 'Alt + T',
  },
  {
    id: 'act-audit-cndp',
    title: 'Journal d\'Audit & Sécurité CNDP (Loi 09-08)',
    category: 'Actions Rapides',
    description: 'Traçabilité des mutations, hash SHA-256 et registre officiel',
    icon: Scale,
    iconColor: 'text-amber-500 bg-amber-500/10',
    path: '/admin/activity-logs',
    shortcut: 'Alt + L',
  },
  {
    id: 'act-finance-regie',
    title: 'Régie & Formations Continues (Masters/MBA)',
    category: 'Actions Rapides',
    description: 'Suivi des frais de scolarité, tranches et reçus de paiement A4',
    icon: Landmark,
    iconColor: 'text-blue-500 bg-blue-500/10',
    path: '/admin/finance',
    shortcut: 'Alt + F',
  },
  {
    id: 'act-guichet-express',
    title: 'Guichet Unique & Demandes d\'Attestations',
    category: 'Actions Rapides',
    description: 'Validation 1-clic, signature SG et expédition email Resend',
    icon: ShieldCheck,
    iconColor: 'text-purple-500 bg-purple-500/10',
    path: '/admin/requests',
    shortcut: 'Alt + G',
  },
  {
    id: 'act-archiving-rollover',
    title: 'Bascule d\'Année & Promotion des Étudiants',
    category: 'Actions Rapides',
    description: 'Archivage exercice, rollover 2025/2026 et promotion S1->S3',
    icon: Layers,
    iconColor: 'text-rose-500 bg-rose-500/10',
    path: '/admin/archiving',
    shortcut: 'Alt + R',
  },
];

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await api.get(`/dashboard/search?q=${encodeURIComponent(query)}`);
        setResults(res.data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 250);
    return () => clearTimeout(debounce);
  }, [query]);

  // Filter Quick Actions
  const filteredQuickActions = query.trim() === ''
    ? QUICK_ACTIONS
    : QUICK_ACTIONS.filter(act => 
        act.title.toLowerCase().includes(query.toLowerCase()) ||
        act.description.toLowerCase().includes(query.toLowerCase())
      );

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'student': return <Users className="w-5 h-5 text-blue-500" />;
      case 'professor': return <User className="w-5 h-5 text-indigo-500" />;
      case 'module': return <BookOpen className="w-5 h-5 text-emerald-500" />;
      case 'room': return <MapPin className="w-5 h-5 text-amber-500" />;
      default: return <Search className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[8vh] px-4 sm:px-6 animate-in fade-in duration-150">
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="w-9 h-9 rounded-xl bg-[#0f2863]/10 dark:bg-sky-500/10 flex items-center justify-center text-[#0f2863] dark:text-sky-400 mr-3 shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-base font-semibold"
            placeholder="Rechercher étudiant (CNE/Nom), module, salle ou action rapide (ex: APOGEE, PV, Notes)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg text-[10px] text-slate-500 font-mono font-bold">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* 1. Live Database Search Results (When query >= 2) */}
          {query.trim().length >= 2 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-400 tracking-wider px-2">
                <span>Résultats Base de Données</span>
                {isLoading && <span className="text-indigo-500 animate-pulse">Recherche en cours...</span>}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelect(item.url)}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-indigo-50/80 dark:hover:bg-slate-800/80 border border-transparent hover:border-indigo-200 dark:hover:border-slate-700 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                          {getIcon(item.type)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-sky-400 transition-colors">
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  Aucun dossier étudiant ou module trouvé pour "{query}".
                </div>
              )}
            </div>
          )}

          {/* 2. Quick Action Hub (Actions Rapides) */}
          {filteredQuickActions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-400 tracking-wider px-2">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Actions Rapides Administrateur
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Accès Immédiat</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredQuickActions.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div
                      key={act.id}
                      onClick={() => handleSelect(act.path)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", act.iconColor)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-sky-400 transition-colors">
                            {act.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {act.description}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 shrink-0 transition-transform ml-2" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-100/80 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-medium px-5">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded text-[10px] font-mono">↵</kbd> Ouvrir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded text-[10px] font-mono">Ctrl + K</kbd> Raccourci Global
            </span>
          </div>
          <div className="text-slate-400 hidden sm:block">
            ENCG Fès ERP — Cockpit Administrateur
          </div>
        </div>

      </div>
    </div>
  );
}
