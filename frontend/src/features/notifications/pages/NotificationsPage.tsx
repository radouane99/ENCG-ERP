import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BookOpen, 
  CreditCard, 
  CheckCircle2, 
  FileText, 
  AlertTriangle, 
  Trash2, 
  ExternalLink, 
  Search, 
  RefreshCw,
  Check,
  Calendar,
  Sparkles
} from 'lucide-react';
import { cn, cleanMojibake } from '@shared/lib/utils';
import { useNavigate } from 'react-router-dom';
import api from '@shared/lib/api';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  data: {
    title?: string;
    message?: string;
    type?: string;
    category?: string;
    action_url?: string;
    url?: string;
    tracking_code?: string;
  };
  read_at: string | null;
  created_at: string;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'academic' | 'documents' | 'campus'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data?.data || []);
    } catch {
      toast.error('Impossible de charger les notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      toast.success('Notification marquée comme lue.');
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      toast.success('Toutes les notifications sont marquées comme lues.');
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification supprimée.');
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const getCategory = (notifType?: string) => {
    switch (notifType?.toLowerCase()) {
      case 'grade':
      case 'grades':
      case 'academic':
      case 'course':
        return { label: 'Pédagogie & Notes', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
      case 'document':
      case 'document_approved':
      case 'document_pending':
      case 'document_request':
        return { label: 'Documents & Scolarité', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
      case 'library':
      case 'financial':
        return { label: 'Bibliothèque & Prêts', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'danger':
      case 'absence':
      case 'alert':
        return { label: 'Alerte & Assiduité', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
      default:
        return { label: 'Campus & Système', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    }
  };

  const getCategoryIcon = (notifType?: string) => {
    switch (notifType?.toLowerCase()) {
      case 'grade':
      case 'grades':
      case 'academic':
      case 'course':
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'document_approved':
      case 'validated':
      case 'stage':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'document':
      case 'document_pending':
      case 'document_request':
        return <FileText className="w-5 h-5 text-purple-500" />;
      case 'library':
        return <BookOpen className="w-5 h-5 text-purple-500" />;
      case 'financial':
        return <CreditCard className="w-5 h-5 text-emerald-500" />;
      case 'danger':
      case 'absence':
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      default:
        return <Bell className="w-5 h-5 text-amber-500" />;
    }
  };

  const unreadCount = notifications.filter(n => n.read_at === null).length;

  const filtered = notifications.filter(notif => {
    const title = cleanMojibake(notif.data.title || '');
    const message = cleanMojibake(notif.data.message || '');
    const categoryKey = (notif.data.category || notif.data.type || 'system').toLowerCase();

    const matchesSearch = 
      title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      message.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'unread') return notif.read_at === null;
    if (filter === 'academic') return ['academic', 'grade', 'grades', 'course'].includes(categoryKey);
    if (filter === 'documents') return ['document', 'document_approved', 'document_pending', 'document_request'].includes(categoryKey);
    if (filter === 'campus') return ['financial', 'system', 'danger', 'library', 'absence', 'alert'].includes(categoryKey);

    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 pb-20">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#001A4B] via-[#0A2A66] to-[#1E3A8A] text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold tracking-wide uppercase text-blue-200 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Portail ENCG Fès • Communication Intégrée</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Centre de Notifications
            </h1>
            <p className="text-blue-200/90 text-sm sm:text-base mt-1.5 max-w-xl">
              Suivi en temps réel de vos notes, convocations, attestations, emprunts de médiathèque et annonces pédagogiques.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Tout marquer comme lu</span>
              </button>
            )}
            <button
              onClick={fetchNotifications}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer"
              title="Rafraîchir"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total des alertes</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{notifications.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Non lues</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{unreadCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Traitées / Lues</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{notifications.length - unreadCount}</p>
          </div>
        </div>
      </div>

      {/* Controls & Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par mot-clé (ex: Comptabilité, Attestation...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'Toutes', count: notifications.length },
            { key: 'unread', label: 'Non lues', count: unreadCount },
            { key: 'academic', label: 'Pédagogie & Notes' },
            { key: 'documents', label: 'Documents' },
            { key: 'campus', label: 'Campus & Prêts' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={cn(
                "px-3.5 py-1.5 text-xs rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer",
                filter === tab.key
                  ? "bg-primary text-white shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  "ml-1.5 px-1.5 py-0.2 rounded-full text-[10px]",
                  filter === tab.key ? "bg-white/20 text-white" : "bg-card text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground text-sm flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            <span>Chargement des notifications en cours...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-card border border-border rounded-2xl p-8">
            <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Aucune notification trouvée</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Aucune alerte ne correspond à vos critères de recherche actuels.
            </p>
          </div>
        ) : (
          filtered.map((notif) => {
            const isUnread = notif.read_at === null;
            const category = getCategory(notif.data.category || notif.data.type);
            const title = cleanMojibake(notif.data.title || 'Information ENCG');
            const message = cleanMojibake(notif.data.message || '');
            const targetUrl = notif.data.action_url || notif.data.url;

            return (
              <div
                key={notif.id}
                className={cn(
                  "p-4 sm:p-5 rounded-2xl bg-card border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs hover:shadow-md",
                  isUnread
                    ? "border-primary/40 bg-gradient-to-r from-primary/[0.03] to-transparent ring-1 ring-primary/20"
                    : "border-border hover:border-border/80"
                )}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center border shadow-xs flex-shrink-0 mt-0.5",
                    isUnread ? "bg-card border-primary/30" : "bg-muted/40 border-border"
                  )}>
                    {getCategoryIcon(notif.data.category || notif.data.type)}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-md text-[11px] font-bold border",
                        category.color
                      )}>
                        {category.label}
                      </span>
                      {isUnread && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white tracking-wide">
                          NOUVEAU
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <h3 className={cn(
                      "text-sm sm:text-base leading-snug",
                      isUnread ? "font-bold text-foreground" : "font-semibold text-foreground/90"
                    )}>
                      {title}
                    </h3>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {message}
                    </p>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {targetUrl && (
                    <button
                      onClick={() => {
                        if (isUnread) markAsRead(notif.id);
                        navigate(targetUrl);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Consulter</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isUnread && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                      title="Marquer comme lu"
                    >
                      <Check className="w-4 h-4 text-emerald-500" />
                    </button>
                  )}

                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="p-2 rounded-xl bg-muted/60 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
