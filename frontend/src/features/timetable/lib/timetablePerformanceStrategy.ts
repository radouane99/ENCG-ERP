export type OccupancySession = {
  id: string | number
  professor: string
  group: string
  room: string
  original: any
}

export const PERFORMANCE_SLOTS = [
  { startHour: 8.5, endHour: 10.5, label: '08:30 - 10:30' },
  { startHour: 10.75, endHour: 12.75, label: '10:45 - 12:45' },
  { startHour: 14.5, endHour: 16.5, label: '14:30 - 16:30' },
  { startHour: 16.75, endHour: 18.75, label: '16:45 - 18:45' },
] as const

const DAY_COUNT = 6
const MAX_DAILY_SLOTS = 4

function hoursOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd
}

class OccupancyIndex {
  private bookings: Array<{
    dayIndex: number
    startHour: number
    endHour: number
    professor: string
    group: string
    room: string
  }> = []

  occupy(dayIndex: number, startHour: number, endHour: number, professor: string, group: string, room: string) {
    this.bookings.push({ dayIndex, startHour, endHour, professor, group, room })
  }

  private overlapping(dayIndex: number, startHour: number, endHour: number) {
    return this.bookings.filter(
      (b) => b.dayIndex === dayIndex && hoursOverlap(startHour, endHour, b.startHour, b.endHour)
    )
  }

  professorBusy(dayIndex: number, startHour: number, endHour: number, professor: string) {
    return this.overlapping(dayIndex, startHour, endHour).some((b) => b.professor === professor)
  }

  groupBusy(dayIndex: number, startHour: number, endHour: number, group: string) {
    return this.overlapping(dayIndex, startHour, endHour).some((b) => b.group === group)
  }

  roomBusy(dayIndex: number, startHour: number, endHour: number, room: string) {
    return this.overlapping(dayIndex, startHour, endHour).some((b) => b.room === room)
  }

  professorDayLoad(dayIndex: number, professor: string) {
    return this.bookings.filter((b) => b.dayIndex === dayIndex && b.professor === professor).length
  }

  groupDayLoad(dayIndex: number, group: string) {
    return this.bookings.filter((b) => b.dayIndex === dayIndex && b.group === group).length
  }

  slotFill(dayIndex: number, startHour: number, endHour: number) {
    return this.overlapping(dayIndex, startHour, endHour).length
  }

  free(dayIndex: number, startHour: number, endHour: number, professor: string, group: string, room: string) {
    if (this.professorBusy(dayIndex, startHour, endHour, professor)) return false
    if (this.groupBusy(dayIndex, startHour, endHour, group)) return false
    if (room && this.roomBusy(dayIndex, startHour, endHour, room)) return false
    if (this.professorDayLoad(dayIndex, professor) >= MAX_DAILY_SLOTS) return false
    if (this.groupDayLoad(dayIndex, group) >= MAX_DAILY_SLOTS) return false
    return true
  }

  score(dayIndex: number, startHour: number, endHour: number, professor: string, group: string) {
    return (
      this.groupDayLoad(dayIndex, group) * 45 +
      this.professorDayLoad(dayIndex, professor) * 30 +
      this.slotFill(dayIndex, startHour, endHour) * 8 +
      (dayIndex === 5 ? 35 : 0)
    )
  }
}

function identity(value: string, fallback: string) {
  const v = (value || '').trim()
  if (!v || /^(n\/a|na|-|none)$/i.test(v)) return fallback
  return v
}

function isCoursMagistral(item: { extendedProps?: any }) {
  const type = String(item.extendedProps?.type || item.extendedProps?.session_type || '').toLowerCase()
  return ['cm', 'cours', 'lecture', 'amphi', 'magistral'].includes(type)
}

function moduleKey(item: { title?: string; extendedProps?: any }) {
  return String(item.extendedProps?.module_id || item.extendedProps?.module_code || item.title || '').trim().toLowerCase()
}

export function reorganizeSessionsWithoutResourceConflicts<T extends { start?: string; end?: string; title?: string; extendedProps?: any; id?: any }>(
  items: T[],
  applySlot: (item: T, dayIndex: number, slot: { startHour: number; endHour: number }) => T
): { items: T[]; moved: number; unresolved: number; strategy: string } {
  const occupancy = new OccupancyIndex()
  const roomsPool = Array.from(new Set(items.map((item, i) => identity(item.extendedProps?.room || '', `Salle-${(i % 8) + 1}`))))

  const remaining = items.map((item, index) => {
    const professor = identity(item.extendedProps?.professor || '', `Prof-${index}`)
    const group = identity(item.extendedProps?.group || '', `Groupe-${index}`)
    const room = identity(item.extendedProps?.room || '', roomsPool[index % roomsPool.length])
    const cmKey = isCoursMagistral(item) ? `${professor}|${moduleKey(item)}` : ''
    return { item, index, professor, group, room, cmKey }
  })

  const placed: T[] = new Array(items.length)
  const sharedCoursSlot = new Map<string, { dayIndex: number; slotIndex: number; room: string }>()
  let moved = 0
  let unresolved = 0

  remaining.sort((a, b) => {
    const degA = remaining.filter((x) => x.professor === a.professor || x.group === a.group).length
    const degB = remaining.filter((x) => x.professor === b.professor || x.group === b.group).length
    return degB - degA
  })

  for (const session of remaining) {
    const applyPlacement = (dayIndex: number, slotIndex: number, room: string, occupyProfessor: boolean) => {
      const slot = PERFORMANCE_SLOTS[slotIndex]
      if (occupyProfessor) {
        occupancy.occupy(dayIndex, slot.startHour, slot.endHour, session.professor, session.group, room)
      } else {
        occupancy.occupy(dayIndex, slot.startHour, slot.endHour, `${session.professor}#cm`, session.group, `${room}#cm`)
      }
      const next = applySlot(session.item, dayIndex, slot)
      placed[session.index] = {
        ...next,
        extendedProps: {
          ...(session.item.extendedProps || {}),
          room,
          professor: session.professor,
          group: session.group,
        },
      }
      const prevStart = String(session.item.start || '')
      if (!prevStart.includes(slot.label.slice(0, 5))) moved += 1
    }

    if (session.cmKey && sharedCoursSlot.has(session.cmKey)) {
      const shared = sharedCoursSlot.get(session.cmKey)!
      const slot = PERFORMANCE_SLOTS[shared.slotIndex]
      if (occupancy.groupBusy(shared.dayIndex, slot.startHour, slot.endHour, session.group)) {
        placed[session.index] = session.item
        unresolved += 1
        continue
      }
      applyPlacement(shared.dayIndex, shared.slotIndex, shared.room, false)
      continue
    }

    let best: { dayIndex: number; slotIndex: number; room: string; score: number } | null = null
    for (let dayIndex = 0; dayIndex < DAY_COUNT; dayIndex++) {
      for (let slotIndex = 0; slotIndex < PERFORMANCE_SLOTS.length; slotIndex++) {
        const slot = PERFORMANCE_SLOTS[slotIndex]
        for (const room of [session.room, ...roomsPool]) {
          if (!occupancy.free(dayIndex, slot.startHour, slot.endHour, session.professor, session.group, room)) continue
          const score = occupancy.score(dayIndex, slot.startHour, slot.endHour, session.professor, session.group)
          if (!best || score < best.score) best = { dayIndex, slotIndex, room, score }
        }
      }
    }

    if (!best) {
      placed[session.index] = session.item
      unresolved += 1
      continue
    }

    applyPlacement(best.dayIndex, best.slotIndex, best.room, true)
    if (session.cmKey) {
      sharedCoursSlot.set(session.cmKey, { dayIndex: best.dayIndex, slotIndex: best.slotIndex, room: best.room })
    }
  }

  return {
    items: placed.filter(Boolean),
    moved,
    unresolved,
    strategy: 'MRV-Degree-LCV',
  }
}
