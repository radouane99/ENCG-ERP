import { describe, expect, it, vi } from 'vitest'
import { flushOfflineQueue } from './offlineQueue'
function memory(entries: unknown) {
  let value = JSON.stringify(entries)
  return { getItem: () => value, setItem: (_key: string, next: string) => { value = next } }
}
describe('offline queue acknowledgements', () => {
  it('retains rejected entries and removes only accepted entries', async () => {
    const storage = memory([{ id: 1 }, { id: 2 }])
    const result = await flushOfflineQueue<{ id: number }>(storage, 'queue', async item => { if (item.id === 2) throw new Error('409') })
    expect(result).toEqual({ sent: 1, failed: 1, remaining: 1 })
    expect(JSON.parse(storage.getItem())).toEqual([{ id: 2 }])
  })
  it('preserves entries appended while a request is in flight', async () => {
    const storage = memory([{ id: 1 }])
    await flushOfflineQueue(storage, 'queue', async () => { storage.setItem('queue', JSON.stringify([{ id: 1 }, { id: 2 }])) })
    expect(JSON.parse(storage.getItem())).toEqual([{ id: 2 }])
  })
  it('does not send the same snapshot twice during concurrent retries', async () => {
    const storage = memory([{ id: 1 }]); let finish!: () => void
    const send = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
    const first = flushOfflineQueue(storage, 'queue', send)
    const second = flushOfflineQueue(storage, 'queue', send)
    finish(); await Promise.all([first, second])
    expect(send).toHaveBeenCalledTimes(1)
  })
  it('keeps an entry modified locally during transmission', async () => {
    const storage = memory([{ id: 1, status: 'present' }])
    await flushOfflineQueue(storage, 'queue', async () => storage.setItem('queue', JSON.stringify([{ id: 1, status: 'absent' }])))
    expect(JSON.parse(storage.getItem())).toEqual([{ id: 1, status: 'absent' }])
  })
  it('rejects a malformed queue without overwriting it', async () => {
    const storage = memory({ id: 1 }); const before = storage.getItem()
    await expect(flushOfflineQueue(storage, 'queue', vi.fn())).rejects.toThrow('Invalid offline queue')
    expect(storage.getItem()).toBe(before)
  })
})
