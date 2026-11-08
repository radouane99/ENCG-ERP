import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestPwaPushPermission, showNativePwaNotification } from './pwaPush';
import api from '@shared/lib/api';

vi.mock('@shared/lib/api', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

describe('pwaPush utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests permission and registers subscription when granted', async () => {
    const requestPermissionMock = vi.fn().mockResolvedValue('granted');
    Object.defineProperty(window, 'Notification', {
      writable: true,
      configurable: true,
      value: Object.assign(vi.fn(), {
        permission: 'granted',
        requestPermission: requestPermissionMock,
      }),
    });

    const result = await requestPwaPushPermission();
    expect(result).toBe('granted');
    expect(requestPermissionMock).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith(
      '/notifications/push-subscribe',
      expect.objectContaining({ endpoint: 'pwa-service-worker' })
    );
  });

  it('displays native notification via ServiceWorker registration when available', async () => {
    const showNotificationMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window, 'Notification', {
      writable: true,
      configurable: true,
      value: Object.assign(vi.fn(), {
        permission: 'granted',
      }),
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue({
          showNotification: showNotificationMock,
        }),
      },
    });

    const shown = await showNativePwaNotification(
      '🎓 Relevé de Notes S5',
      'Vos résultats sont publiés.',
      '/student/grades'
    );

    expect(shown).toBe(true);
    expect(showNotificationMock).toHaveBeenCalledWith(
      '🎓 Relevé de Notes S5',
      expect.objectContaining({
        body: 'Vos résultats sont publiés.',
        data: { url: '/student/grades' },
      })
    );
  });
});

