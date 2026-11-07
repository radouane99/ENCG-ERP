import { useState,useEffect,useCallback } from 'react';
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
import { cn,cleanMojibake } from '@shared/lib/utils';
import { useNavigate } from 'react-router-dom';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation('common', { keyPrefix: 'notification_page' });
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'academic' | 'documents' | 'campus'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const res = await api.get('/notifications', { params: { page } });
      setNotifications(res.data?.data || []);
      setLastPage(res.data?.meta?.last_page || 1);
    } catch {
      setLoadError(true);
      toast.error(t('load_fail'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      toast.success(t('marked'));
    } catch {
      toast.error(t('update_fail'));
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      toast.success(t('all_marked'));
    } catch {
      toast.error(t('update_fail'));
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success(t('deleted'));
    } catch {
      toast.error(t('delete_fail'));
    }
  };

  const getCategory = (notifType?: string) => {
    switch (notifType?.toLowerCase()) {
      case 'grade':
      case 'grades':
      case 'academic':
      case 'course':
        return { label: t('academic'), color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
      case 'document':
      case 'document_approved':
      case 'document_pending':
      case 'document_request':
        return { label: t('school_documents'), color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
      case 'library':
      case 'financial':
        return { label: t('library'), color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'danger':
      case 'absence':
      case 'alert':
        return { label: t('attendance'), color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
      default:
        return { label: t('campus_system'), color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    }
  };

  const getCategoryIcon = (notifType?: string) => {
    switch (notifType?.toLowerCase()) {
      case 'grade':
      case 'grades':
      case 'academic':
      case 'course':
        return <BookOpen className="w-5 h-5 text-primary" />;
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
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Page Header */}
      <div className="relative overflow-hidden text-white p-6 sm:p-8 erp-page-banner">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold tracking-wide uppercase text-blue-200 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{t('brand')}</span>
            </div>
            <h1 className="erp-page-title">
              {t('title')}
            </h1>
            <p className="text-blue-200/90 text-sm sm:text-base mt-1.5 max-w-xl">
              {t('description')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{t('mark_all')}</span>
              </button>
            )}
            <button
              onClick={fetchNotifications}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer"
              title={t('refresh')}
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
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('total')}</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{notifications.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('unread')}</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{unreadCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('read')}</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{notifications.length - unreadCount}</p>
          </div>
        </div>
      </div>

      {/* Controls & Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-10 pe-4 py-2 text-sm bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground rounded-[var(--control-radius)]"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: t('all'), count: notifications.length },
            { key: 'unread', label: t('unread'), count: unreadCount },
            { key: 'academic', label: t('academic') },
            { key: 'documents', label: t('documents') },
            { key: 'campus', label: t('campus') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={cn(
                "px-3.5 py-1.5 text-xs rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer",
                filter === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  "ms-1.5 px-1.5 py-0.2 rounded-full text-[10px]",
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
            <span>{t('loading')}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-card border border-border rounded-2xl p-8">
            <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">{t('empty')}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {t('empty_help')}
            </p>
          </div>
        ) : (
          filtered.map((notif) => {
            const isUnread = notif.read_at === null;
            const category = getCategory(notif.data.category || notif.data.type);
            const title = cleanMojibake(notif.data.title || t('default_title'));
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
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white tracking-wide">
                          NOUVEAU
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(notif.created_at).toLocaleDateString(i18n.resolvedLanguage || 'fr', {
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
                      className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>{t('view')}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isUnread && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                      title={t('mark')}
                    >
                      <Check className="w-4 h-4 text-emerald-500" />
                    </button>
                  )}

                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="p-2 rounded-xl bg-muted/60 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all cursor-pointer"
                    title={t('delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      {loadError && <p role="alert" className="rounded-xl border border-destructive p-4">{t('unavailable')}</p>}
      <nav aria-label={t('pagination')} className="flex flex-wrap items-center justify-center gap-4 py-4">
        <button disabled={page <= 1 || loading} onClick={() => setPage(previous => previous - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-50">{t('previous')}</button>
        <span className="text-sm">{t('page', { page, total: lastPage })}</span>
        <button disabled={page >= lastPage || loading} onClick={() => setPage(previous => previous + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-50">{t('next')}</button>
      </nav>
    </div>
  );
}
