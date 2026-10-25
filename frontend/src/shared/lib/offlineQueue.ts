type QueueStorage = Pick<Storage, 'getItem' | 'setItem'>
type FlushResult = { sent: number; failed: number; remaining: number }
const active = new WeakMap<QueueStorage, Map<string, Promise<FlushResult>>>()

/** Acknowledge only successful entries; preserve failures and edits made during a sync. */
export function flushOfflineQueue<T>(storage: QueueStorage, key: string, send: (item: T) => Promise<unknown>): Promise<FlushResult> {
  const running = active.get(storage) ?? new Map<string, Promise<FlushResult>>()
  active.set(storage, running)
  const existing = running.get(key)
  if (existing) return existing
  const read = (): T[] => {
    const entries: unknown = JSON.parse(storage.getItem(key) || '[]')
    if (!Array.isArray(entries)) throw new Error('Invalid offline queue')
    return entries
  }
  const operation = (async () => {
    const snapshot = read()
    let sent = 0; let failed = 0
    for (const item of snapshot) {
      const fingerprint = JSON.stringify(item)
      if (!read().some(current => JSON.stringify(current) === fingerprint)) continue
      try { await send(item) } catch { failed++; continue }
      const current = read()
      const index = current.findIndex(entry => JSON.stringify(entry) === fingerprint)
      if (index >= 0) { current.splice(index, 1); storage.setItem(key, JSON.stringify(current)) }
      sent++
    }
    return { sent, failed, remaining: read().length }
  })().finally(() => running.delete(key))
  running.set(key, operation)
  return operation
}
