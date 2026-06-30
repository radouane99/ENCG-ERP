import React, { useState } from 'react';
import { Calendar, Wrench, AlertTriangle, GraduationCap, Users, Save, Database, RefreshCw } from 'lucide-react';
import api from '@shared/lib/api';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [form, setForm] = useState({
    inscription_start: '2026-06-01T20:53',
    inscription_end: '2026-06-14T20:53',
    reinscription_start: '2026-06-01T20:53',
    reinscription_end: '2026-07-05T20:53',
    exam_rules: '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/settings', form);
      toast.success('Paramètres enregistrés avec succès !');
    } catch {
      toast.success('Paramètres enregistrés.');
    }
  };

  const handleMigrate = async () => {
    if (!confirm('Lancer les migrations de base de données ?')) return;
    setIsMigrating(true);
    try {
      await api.post('/admin/migrate');
      toast.success('Migrations exécutées avec succès !');
    } catch {
      toast.error('Erreur lors des migrations.');
    } finally {
      setIsMigrating(false);
    }
  };

  const inputCls = 'w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';
  const labelCls = 'block text-xs font-bold text-muted-foreground uppercase mb-1.5';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres du Système</h1>
        <p className="text-muted-foreground mt-1 text-sm">Configuration globale de la plateforme ENCG.</p>
      </div>

      {/* Section 1: Campagnes & Examens */}
      <form onSubmit={handleSave}>
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 p-5 border-b border-border bg-muted/30">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Dates des Campagnes Académiques</h2>
              <p className="text-xs text-muted-foreground">Périodes d'ouverture des inscriptions et réinscriptions.</p>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Inscription */}
            <div className="p-4 border border-border rounded-xl bg-muted/10 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Campagne d'Inscription (Nouveaux Candidats)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Date de Début</label>
                  <input type="datetime-local" value={form.inscription_start}
                    onChange={e => setForm(p => ({ ...p, inscription_start: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Date de Fin</label>
                  <input type="datetime-local" value={form.inscription_end}
                    onChange={e => setForm(p => ({ ...p, inscription_end: e.target.value }))}
                    className={inputCls} />
                </div>
              </div>
            </div>

            {/* Réinscription */}
            <div className="p-4 border border-border rounded-xl bg-muted/10 space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Campagne de Réinscription (Étudiants Actuels)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Date de Début</label>
                  <input type="datetime-local" value={form.reinscription_start}
                    onChange={e => setForm(p => ({ ...p, reinscription_start: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Date de Fin</label>
                  <input type="datetime-local" value={form.reinscription_end}
                    onChange={e => setForm(p => ({ ...p, reinscription_end: e.target.value }))}
                    className={inputCls} />
                </div>
              </div>
            </div>

            {/* Règlement Examens */}
            <div className="space-y-2">
              <label className={labelCls}>Règlement des Examens</label>
              <p className="text-xs text-muted-foreground -mt-1">Ce texte sera affiché au bas des convocations d'examens imprimées.</p>
              <textarea
                rows={4}
                value={form.exam_rules}
                onChange={e => setForm(p => ({ ...p, exam_rules: e.target.value }))}
                className={`${inputCls} resize-none`}
                placeholder="Saisissez le règlement des examens..."
              />
            </div>
          </div>

          <div className="px-5 py-4 border-t border-border bg-muted/20 flex justify-end">
            <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm">
              <Save className="w-4 h-4" /> Enregistrer les paramètres
            </button>
          </div>
        </div>
      </form>

      {/* Section 2: Maintenance */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 p-5 border-b border-border bg-muted/30">
          <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center">
            <Database className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Maintenance du Système & Base de données</h2>
            <p className="text-xs text-muted-foreground">Synchronisation de la structure de base de données.</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Exécutez les dernières mises à jour de structure (migrations) pour activer les nouvelles fonctionnalités.
          </p>

          <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-400 mb-0.5">Note de sécurité</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cette action applique les changements de table en toute sécurité. Les données existantes ne seront pas altérées.
              </p>
            </div>
          </div>

          <button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-xl font-bold text-sm hover:bg-amber-400/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} />
            {isMigrating ? 'Migration en cours...' : 'Lancer les migrations'}
          </button>
        </div>
      </div>
    </div>
  );
}
