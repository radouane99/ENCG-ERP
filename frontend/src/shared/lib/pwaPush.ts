import api from '@shared/lib/api';

export type PwaPushPermission = NotificationPermission | 'unsupported';

/**
 * Request native browser/PWA notification permission and sync subscription with backend Redis store.
 */
export async function requestPwaPushPermission(): Promise<PwaPushPermission> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    try {
      await api.post('/notifications/push-subscribe', {
        endpoint: 'pwa-service-worker',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'browser',
      });
    } catch {
      // Non-blocking if offline or unauthenticated
    }
  }

  return permission;
}

/**
 * Display a native OS / Mobile lockscreen notification via Service Worker (PWA) or Notification API.
 */
export async function showNativePwaNotification(
  title: string,
  body: string,
  actionUrl?: string
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, {
          body,
          icon: '/pwa-icon.svg',
          badge: '/pwa-icon.svg',
          tag: `encg-push-${Date.now()}`,
          data: { url: actionUrl || '/notifications' },
        });
        return true;
      }
    }
  } catch {
    // Fallback to standard Notification constructor below
  }

  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
    });
    return true;
  } catch {
    return false;
  }
}

