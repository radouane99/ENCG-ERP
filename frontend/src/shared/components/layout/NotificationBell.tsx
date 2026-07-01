import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, User, BookOpen, CreditCard, ExternalLink, Calendar as CalendarIcon, Check, CheckCircle2 } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useNavigate } from 'react-router-dom';
import api from '@shared/lib/api';

interface Notification {
  id: string;
  type: string;
  data: {
    title: string;
    message: string;
    type?: string;
    action_url?: string;
  };
  read_at: string | null;
  created_at: string;
}

export function NotificationBell() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
      setUnreadCount(res.data.meta.unread_count);
    } catch (error) {
      console.error('Error fetching notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // In a real app, you might want to poll or use WebSockets (Laravel Reverb)
    // const interval = setInterval(fetchNotifications, 60000);
    // return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch(type) {
      case 'academic': return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'financial': return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'system': return <Bell className="w-4 h-4 text-amber-500" />;
      default: return <User className="w-4 h-4 text-purple-500" />;
    }
  };

  const markAsRead = async (id: string) => {
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
    } catch (error) {
      console.error('Error marking all as read', error);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-card animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute end-0 top-10 w-80 bg-card border border-border rounded-xl shadow-xl z-50 flex flex-col animate-in origin-top-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Aucune notification
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map(notif => {
                  const isUnread = notif.read_at === null;
                  const typeLabel = notif.data.type || 'system';
                  
                  return (
                  <div 
                    key={notif.id} 
                    className={cn(
                      "p-3 hover:bg-muted/50 transition-colors flex gap-3 group relative",
                      isUnread ? "bg-primary/5" : ""
                    )}
                  >
                    <div className="mt-1 w-8 h-8 rounded-full bg-background border border-border flex flex-shrink-0 items-center justify-center">
                      {getIcon(typeLabel)}
                    </div>
                    <div className="flex-1 pr-4">
                      <p className={cn("text-sm", isUnread ? "font-semibold text-foreground" : "text-foreground/80 font-medium")}>
                        {notif.data.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.data.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-muted-foreground/80 font-medium">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                        {notif.data.action_url && (
                          <button 
                            onClick={() => {
                              navigate(notif.data.action_url!);
                              setIsOpen(false);
                            }}
                            className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                          >
                            Voir <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {isUnread && (
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="absolute top-3 right-3 p-1 rounded-md opacity-0 group-hover:opacity-100 bg-background border border-border text-muted-foreground hover:text-foreground transition-all"
                        title="Marquer comme lu"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )})}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-border">
            <button className="w-full py-1.5 text-xs text-center text-muted-foreground hover:text-foreground font-medium rounded-lg hover:bg-muted transition-colors">
              Voir toutes les notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
