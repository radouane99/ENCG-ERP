export type OccupancySession = {
  id: string | number
  professor: string
  group: string
  room: string
  original: any
  preferredDayIndex?: number
  preferredSlotIndex?: number
}

export const PERFORMANCE_SLOTS = [
  { startHour: 8.5, endHour: 10.5, label: '08:30 - 10:30' },
  { startHour: 10.75, endHour: 12.75, label: '10:45 - 12:45' },
  { startHour: 14.5, endHour: 16.5, label: '14:30 - 16:30' },
  { startHour: 16.75, endHour: 18.75, label: '16:45 - 18:45' },
] as const

const DAY_COUNT = 6
const MAX_DAILY_SLOTS = 4

type OccKey = string

function slotKey(dayIndex: number, slotIndex: number) {
  return `${dayIndex}:${slotIndex}`
}

function resourceKey(dayIndex: number, slotIndex: number, kind: string, id: string) {
  return `${slotKey(dayIndex, slotIndex)}|${kind}|${id}`
}

class OccupancyIndex {
  private busy = new Set<OccKey>()
  private dayLoad = new Map<OccKey, number>()
  private slotFill = new Map<OccKey, number>()

  occupy(dayIndex: number, slotIndex: number, professor: string, group: string, room: string) {
    this.busy.add(resourceKey(dayIndex, slotIndex, 'p', professor))
    this.busy.add(resourceKey(dayIndex, slotIndex, 'g', group))
    this.busy.add(resourceKey(dayIndex, slotIndex, 'r', room))
    const pk = `p:${dayIndex}:${professor}`
    const gk = `g:${dayIndex}:${group}`
    this.dayLoad.set(pk, (this.dayLoad.get(pk) || 0) + 1)
    this.dayLoad.set(gk, (this.dayLoad.get(gk) || 0) + 1)
    const sk = slotKey(dayIndex, slotIndex)
    this.slotFill.set(sk, (this.slotFill.get(sk) || 0) + 1)
  }

  free(dayIndex: number, slotIndex: number, professor: string, group: string, room: string) {
    if (this.busy.has(resourceKey(dayIndex, slotIndex, 'p', professor))) return false
    if (this.busy.has(resourceKey(dayIndex, slotIndex, 'g', group))) return false
    if (room && this.busy.has(resourceKey(dayIndex, slotIndex, 'r', room))) return false
    if ((this.dayLoad.get(`p:${dayIndex}:${professor}`) || 0) >= MAX_DAILY_SLOTS) return false
    if ((this.dayLoad.get(`g:${dayIndex}:${group}`) || 0) >= MAX_DAILY_SLOTS) return false
    return true
  }

  score(dayIndex: number, slotIndex: number, professor: string, group: string, preferDay?: number, preferSlot?: number) {
    let score =
      (this.dayLoad.get(`g:${dayIndex}:${group}`) || 0) * 45 +
      (this.dayLoad.get(`p:${dayIndex}:${professor}`) || 0) * 30 +
      (this.slotFill.get(slotKey(dayIndex, slotIndex)) || 0) * 8 +
      (dayIndex === 5 ? 35 : 0)
    if (preferDay === dayIndex && preferSlot === slotIndex) score -= 40
    return score
  }
}

function identity(value: string, fallback: string) {
  const v = (value || '').trim()
  if (!v || /^(n\/a|na|-|none)$/i.test(v)) return fallback
  return v
}

export function reorganizeSessionsWithoutResourceConflicts<T extends { start?: string; end?: string; extendedProps?: any; id?: any }>(
  items: T[],
  applySlot: (item: T, dayIndex: number, slot: { startHour: number; endHour: number }) => T
): { items: T[]; moved: number; unresolved: number; strategy: string } {
  const occupancy = new OccupancyIndex()
  const roomsPool = Array.from(new Set(items.map((item, i) => identity(item.extendedProps?.room || '', `Salle-${(i % 8) + 1}`))))

  const remaining = items.map((item, index) => {
    const professor = identity(item.extendedProps?.professor || '', `Prof-${index}`)
    const group = identity(item.extendedProps?.group || '', `Groupe-${index}`)
    const room = identity(item.extendedProps?.room || '', roomsPool[index % roomsPool.length])
    return { item, index, professor, group, room }
  })

  const placed: T[] = new Array(items.length)
  let moved = 0
  let unresolved = 0

  remaining.sort((a, b) => {
    const degA = remaining.filter(x => x.professor === a.professor || x.group === a.group).length
    const degB = remaining.filter(x => x.professor === b.professor || x.group === b.group).length
    return degB - degA
  })

  for (const session of remaining) {
    let best: { dayIndex: number; slotIndex: number; room: string; score: number } | null = null

    for (let dayIndex = 0; dayIndex < DAY_COUNT; dayIndex++) {
      for (let slotIndex = 0; slotIndex < PERFORMANCE_SLOTS.length; slotIndex++) {
        for (const room of [session.room, ...roomsPool]) {
          if (!occupancy.free(dayIndex, slotIndex, session.professor, session.group, room)) continue
          const score = occupancy.score(dayIndex, slotIndex, session.professor, session.group)
          if (!best || score < best.score) {
            best = { dayIndex, slotIndex, room, score }
          }
        }
      }
    }

    if (!best) {
      placed[session.index] = session.item
      unresolved += 1
      continue
    }

    occupancy.occupy(best.dayIndex, best.slotIndex, session.professor, session.group, best.room)
    const next = applySlot(session.item, best.dayIndex, PERFORMANCE_SLOTS[best.slotIndex])
    placed[session.index] = {
      ...next,
      extendedProps: {
        ...(session.item.extendedProps || {}),
        room: best.room,
        professor: session.professor,
        group: session.group,
      },
    }
    const prevStart = String(session.item.start || '')
    if (!prevStart.includes(PERFORMANCE_SLOTS[best.slotIndex].label.slice(0, 5))) moved += 1
  }

  return {
    items: placed.filter(Boolean),
    moved,
    unresolved,
    strategy: 'MRV-Degree-LCV',
  }
}
