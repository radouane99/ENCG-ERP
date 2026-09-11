import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, User, BookOpen, CreditCard, ExternalLink, Check, CheckCircle2, FileText, AlertTriangle, ChevronRight, Inbox } from 'lucide-react';
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

function formatRelativeTime(dateString: string): string {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return past.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  } catch {
    return dateString;
  }
}

export function NotificationBell() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevUnreadCountRef = useRef<number | null>(null);

  const fetchNotifications = async (isBackgroundPoll = false) => {
    try {
      const res = await api.get('/notifications', { suppressToast: true } as any);
      const data: Notification[] = res.data?.data || [];
      const newUnreadCount: number = res.data?.meta?.unread_count ?? res.data?.unread_count ?? 0;

      if (isBackgroundPoll && prevUnreadCountRef.current !== null && newUnreadCount > prevUnreadCountRef.current) {
        const latestUnread = data.find(n => n.read_at === null);
        if (latestUnread) {
          const title = cleanMojibake(latestUnread.data.title || 'Nouvelle Notification');
          const message = cleanMojibake(latestUnread.data.message || '');
          const targetUrl = latestUnread.data.action_url || latestUnread.data.url;

          toast.info(title, {
            description: message,
            action: targetUrl ? {
              label: 'Consulter',
              onClick: () => navigate(targetUrl)
            } : undefined
          });
        }
      }

      prevUnreadCountRef.current = newUnreadCount;
      setNotifications(data);
      setUnreadCount(newUnreadCount);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchNotifications(false);
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'grade':
      case 'grades':
      case 'academic':
      case 'course':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'financial':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'danger':
      case 'alert':
      case 'absence':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'document':
      case 'document_request':
      case 'document_pending':
        return <FileText className="w-4 h-4 text-amber-500" />;
      case 'document_approved':
      case 'stage':
      case 'validated':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'library':
        return <BookOpen className="w-4 h-4 text-purple-500" />;
      case 'system':
        return <Bell className="w-4 h-4 text-indigo-500" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
      toast.success('Toutes les notifications sont marquées comme lues.');
    } catch (error) {
      console.error('Error marking all as read', error);
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.read_at) {
      markAsRead(notif.id);
    }
    const targetUrl = notif.data.action_url || notif.data.url;
    if (targetUrl) {
      navigate(targetUrl);
      setIsOpen(false);
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => n.read_at === null)
    : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-xl transition-all cursor-pointer",
          isOpen 
            ? "bg-primary/10 text-primary ring-2 ring-primary/20" 
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
        title="Centre de notifications"
        aria-label="Centre de notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 bg-gradient-to-r from-red-600 to-rose-500 text-white text-[10px] font-black rounded-full ring-2 ring-card flex items-center justify-center shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute end-0 top-11 w-88 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col animate-in fade-in-50 zoom-in-95 origin-top-right overflow-hidden backdrop-blur-md">
          {/* Header */}
          <div className="p-3.5 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-sm tracking-tight">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-semibold transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tout marquer lu
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-lg font-medium transition-all",
                  filter === 'all'
                    ? "bg-background shadow-xs text-foreground font-semibold border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                Toutes ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-lg font-medium transition-all",
                  filter === 'unread'
                    ? "bg-background shadow-xs text-foreground font-semibold border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                Non lues ({unreadCount})
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border/60">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                  <Inbox className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vous êtes à jour sur l'ensemble de vos activités académiques.
                </p>
              </div>
            ) : (
              filteredNotifications.map(notif => {
                const isUnread = notif.read_at === null;
                const typeLabel = notif.data.category || notif.data.type || 'system';
                const title = cleanMojibake(notif.data.title || 'Information ENCG');
                const message = cleanMojibake(notif.data.message || '');
                const targetUrl = notif.data.action_url || notif.data.url;

                return (
                  <div 
                    key={notif.id} 
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "p-3.5 hover:bg-muted/50 transition-all flex gap-3 group relative cursor-pointer",
                      isUnread ? "bg-primary/[0.04] border-s-2 border-s-primary" : ""
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 w-9 h-9 rounded-xl flex flex-shrink-0 items-center justify-center border shadow-2xs transition-transform group-hover:scale-105",
                      isUnread ? "bg-card border-primary/30" : "bg-muted/40 border-border"
                    )}>
                      {getIcon(typeLabel)}
                    </div>

                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center justify-between gap-1">
                        <p className={cn(
                          "text-xs leading-snug line-clamp-1",
                          isUnread ? "font-bold text-foreground" : "font-semibold text-foreground/85"
                        )}>
                          {title}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {message}
                      </p>

                      {targetUrl && (
                        <div className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                          <span>Consulter</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Quick Mark Read Button */}
                    {isUnread && (
                      <button 
                        onClick={(e) => markAsRead(notif.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-card border border-border shadow-xs text-muted-foreground hover:text-primary hover:bg-muted transition-all self-start"
                        title="Marquer comme lu"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {/* Footer */}
          <div className="p-2.5 border-t border-border bg-muted/20">
            <button 
              onClick={() => {
                navigate('/notifications');
                setIsOpen(false);
              }}
              className="w-full py-2 text-xs text-center text-foreground hover:text-primary font-bold rounded-xl hover:bg-muted/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Centre de notifications complet</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
