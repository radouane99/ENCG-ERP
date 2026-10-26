import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { toast } from 'sonner';
import {
  History, Calendar, ArrowRight, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, Sparkles, FileArchive, RefreshCw,
  PackageOpen, Clock, ArrowDownCircle,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface Preview {
  applied?: boolean;
  source_year: string;
  target_year: string;
  created: number;
  candidates: { module: string; group: string; hours: number; session_type: string }[];
  skipped: { module: string; group: string; reason: string }[];
}

export default function AssignmentCarryForwardPanel({ years }: { years: { id: string | number; label: string; is_current?: boolean }[] }) {
  const [source, setSource] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const client = useQueryClient();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onMutationError = (err: any) => toast.error(err.response?.data?.message || 'Opération impossible.');

  const carry = useMutation({
    mutationFn: (apply: boolean) =>
      api.post('/professor-assignments/carry-forward', { source_year_id: Number(source), apply }).then(res => res.data.data as Preview),
    onSuccess: (data, apply) => {
      setPreview(data);
      if (apply) {
        toast.success('Affectations reconduites avec succès !');
        client.invalidateQueries({ queryKey: ['professor-assignments'] });
        client.invalidateQueries({ queryKey: ['edt-campaign-workspace'] });
      }
    },
    onError: onMutationError,
  });

  const download = useMutation({
    mutationFn: () => api.get('/professor-assignments/orders-zip', { responseType: 'blob' }),
    onSuccess: response => {
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ordres-de-service-encg.zip';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Archive ZIP des Ordres de Service téléchargée avec succès.');
    },
    onError: async (err: any) => {
      try {
        const message = JSON.parse(await err.response.data.text()).message;
        toast.error(message || 'Export impossible.');
      } catch {
        toast.error('Export ZIP des Ordres de Service impossible.');
      }
    },
  });

  const prevYears = years.filter(y => !y.is_current);
  const selectedYear = prevYears.find(y => String(y.id) === String(source));

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f2863] via-[#12327a] to-[#0a1d4a] p-6 shadow-2xl shadow-[#0f2863]/30">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />

      <div className="relative flex flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-[#0f2863] shadow-lg shadow-amber-500/30">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">Préparer les affectations du semestre</h2>
              <p className="text-xs font-medium text-blue-100/70">
                Reconduisez en un clic les charges d'une année précédente, puis exportez les ordres de service.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(v => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
          >
            {isExpanded ? 'Réduire' : 'Détails'}
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Calendar, label: 'Année source', value: selectedYear?.label ?? 'Non choisie', tone: 'text-amber-300' },
            { icon: PackageOpen, label: 'Charges détectées', value: preview ? String(preview.candidates.length) : '—', tone: 'text-emerald-300' },
            { icon: Clock, label: 'Ignorées', value: preview ? String(preview.skipped.length) : '—', tone: 'text-rose-300' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className={cn('mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest', stat.tone)}>
                <stat.icon className="h-3.5 w-3.5" /> {stat.label}
              </div>
              <div className="text-xl font-black text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]" ref={selectRef}>
            <button
              type="button"
              onClick={() => setIsSelectOpen(v => !v)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-300" />
                {selectedYear?.label ?? 'Choisir une année'}
              </span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', isSelectOpen && 'rotate-180')} />
            </button>
            {isSelectOpen && (
              <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-white/15 bg-[#0a1d4a] shadow-2xl">
                {prevYears.length === 0 && (
                  <li className="px-4 py-3 text-xs text-blue-100/60">Aucune année précédente</li>
                )}
                {prevYears.map(y => (
                  <li key={y.id}>
                    <button
                      type="button"
                      onClick={() => { setSource(String(y.id)); setPreview(null); setIsSelectOpen(false); }}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-white/10',
                        String(y.id) === source && 'bg-amber-400/20 text-amber-200',
                      )}
                    >
                      {y.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            disabled={!source || carry.isPending}
            onClick={() => carry.mutate(false)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-3 text-sm font-black text-[#0f2863] shadow-lg shadow-amber-500/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {carry.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Prévisualiser
          </button>

          <button
            type="button"
            disabled={!preview || preview.applied || preview.candidates.length === 0 || carry.isPending}
            onClick={() => carry.mutate(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-5 py-3 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCircle2 className="h-4 w-4" /> Appliquer
          </button>

          <button
            type="button"
            disabled={download.isPending}
            onClick={() => download.mutate()}
            className="ml-auto flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            {download.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}
            Ordres de service (ZIP)
          </button>
        </div>

        {preview && (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
              <span>{preview.source_year}</span>
              <ArrowRight className="h-4 w-4 text-amber-300" />
              <span>{preview.target_year}</span>
              {preview.applied && (
                <span className="ml-2 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-300">
                  {preview.created} créées
                </span>
              )}
            </div>

            {isExpanded && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-emerald-300">
                    <ArrowDownCircle className="h-3.5 w-3.5" /> À reconduire
                  </h3>
                  <ul className="max-h-56 space-y-1.5 overflow-auto pr-1">
                    {preview.candidates.map((c, i) => (
                      <li key={i} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs text-white">
                        <span className="font-semibold">{c.module} · {c.group}</span>
                        <span className="text-blue-100/70">{c.session_type} · {c.hours}h</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-rose-300">
                    <AlertCircle className="h-3.5 w-3.5" /> Ignorées
                  </h3>
                  <ul className="max-h-56 space-y-1.5 overflow-auto pr-1">
                    {preview.skipped.map((s, i) => (
                      <li key={i} className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white">
                        <span className="font-semibold">{s.module} · {s.group}</span>
                        <span className="block text-rose-200/80">{s.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}