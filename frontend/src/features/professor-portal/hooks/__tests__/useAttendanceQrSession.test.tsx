import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import api from '@/shared/lib/api';
import { useAttendanceQrSession } from '../useAttendanceQrSession';
vi.mock('@/shared/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
describe('server-issued attendance QR', () => {
  it('uses the server token and only confirmed present or late records', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { session: { id: 9, qr_token: 'server-token', expires_at: new Date(Date.now() + 60000).toISOString() } } });
    vi.mocked(api.get).mockResolvedValue({ data: { data: { students: [{ id: 11, status: 'present' }, { id: 12, status: 'late' }, { id: 13, status: 'absent' }] } } });
    const { result } = renderHook(() => useAttendanceQrSession(true, 2, 3, 'Salle', today()));
    await waitFor(() => expect(result.current.token).toBe('server-token'));
    await waitFor(() => expect(result.current.presentIds).toEqual([11, 12]));
    expect(api.get).toHaveBeenCalledWith('/attendance/session/9/stats', expect.any(Object));
  });
  it('does not open a QR session for a different lesson date', async () => {
    const { result } = renderHook(() => useAttendanceQrSession(true, 2, 3, 'Salle', '2000-01-01'));
    await waitFor(() => expect(result.current.error).toMatch(/jour de la séance/));
    expect(api.post).not.toHaveBeenCalled();
    expect(result.current.token).toBe('');
  });
  it('does not create a local token if the backend is unavailable', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Unavailable'));
    const { result } = renderHook(() => useAttendanceQrSession(true, 2, 3, 'Salle', today()));
    await waitFor(() => expect(result.current.error).toMatch(/Impossible/));
    expect(result.current.token).toBe('');
    expect(result.current.presentIds).toEqual([]);
  });
});
