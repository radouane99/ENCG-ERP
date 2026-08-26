import React, { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, GripVertical, Loader2, Plus, Trash2, X } from 'lucide-react'
import api from '@/shared/lib/api'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'

type Slot = { slot_index: number; start: string; end: string; label: string }
type Block = {
  block_id: string
  schedule_ids: number[]
  day_of_week: number
  start_time: string
  end_time: string
  slot_index?: number | null
  session_type: string
  module_name: string
  professor_id?: number
  professor_name: string
  room_id?: number
  room_name: string
  group_ids: number[]
  group_label: string
  unplaced: boolean
  off_slot?: boolean
}

const DAYS = [
  { id: 1, label: 'Lundi' },
  { id: 2, label: 'Mardi' },
  { id: 3, label: 'Mercredi' },
  { id: 4, label: 'Jeudi' },
  { id: 5, label: 'Vendredi' },
]

function hhmm(value?: string) {
  if (!value) return ''
  const match = String(value).match(/(\d{1,2}):(\d{2})/)
  if (!match) return String(value).substring(0, 5)
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

function toMinutes(value?: string) {
  const [h, m] = hhmm(value).split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function slotForBlock(block: Block, slots: Slot[]): Slot | undefined {
  if (block.slot_index) {
    const byIndex = slots.find((s) => s.slot_index === block.slot_index)
    if (byIndex) return byIndex
  }
  const start = toMinutes(block.start_time)
  return slots.find((s) => {
    const a = toMinutes(s.start)
    const b = toMinutes(s.end)
    return start === a || (start >= a && start < b)
  }) || slots.find((s) => hhmm(s.start) === hhmm(block.start_time))
}

export default function ManualTimetableBoard({
  versionId,
  filiereLabel,
  onBack,
  onChanged,
}: {
  versionId: number
  filiereLabel: string
  onBack: () => void
  onChanged?: () => void
}) {
  const [picked, setPicked] = useState<Block | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [dropHint, setDropHint] = useState<string | null>(null)
  const [form, setForm] = useState({
    module_id: '',
    professor_id: '',
    room_id: '',
    group_id: '',
    session_type: 'td',
    day_of_week: '0',
    slot: '08:30:00|10:30:00',
  })

  const { data: board, refetch, isLoading } = useQuery({
    queryKey: ['edt-manual-board', versionId],
    queryFn: () => api.get(`/admin/smart-scheduling/versions/${versionId}/board`).then((res) => res.data.data),
  })

  const applyBoard = (payload: any) => {
    if (payload?.board) {
      // react-query cache update via refetch is simpler and consistent
    }
    refetch()
    onChanged?.()
  }

  const moveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post(`/admin/smart-scheduling/versions/${versionId}/move`, body).then((res) => res.data.data),
    onSuccess: (data: any) => {
      toast.success(data.message || 'Déplacé')
      setPicked(null)
      applyBoard(data)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.data?.message || err.response?.data?.message || 'Déplacement impossible')
    },
  })

  const addMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post(`/admin/smart-scheduling/versions/${versionId}/sessions`, body).then((res) => res.data.data),
    onSuccess: (data: any) => {
      toast.success(data.message)
      setShowAdd(false)
      applyBoard(data)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.data?.message || err.response?.data?.message || 'Ajout impossible')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (schedule_ids: number[]) =>
      api.post(`/admin/smart-scheduling/versions/${versionId}/sessions/delete`, { schedule_ids }).then((res) => res.data.data),
    onSuccess: (data: any) => {
      toast.success(data.message)
      setPicked(null)
      applyBoard(data)
    },
  })

  const slots: Slot[] = board?.slots || [
    { slot_index: 1, start: '08:30:00', end: '10:30:00', label: '08:30 - 10:30' },
    { slot_index: 2, start: '10:45:00', end: '12:45:00', label: '10:45 - 12:45' },
    { slot_index: 3, start: '14:30:00', end: '16:30:00', label: '14:30 - 16:30' },
    { slot_index: 4, start: '16:45:00', end: '18:45:00', label: '16:45 - 18:45' },
  ]

  const blocks: Block[] = board?.blocks || []
  const unplaced = blocks.filter((b) => b.unplaced || b.day_of_week < 1)
  const placed = blocks.filter((b) => !b.unplaced && b.day_of_week >= 1)
  const catalog = board?.catalog || { groups: [], modules: [], rooms: [], professors: [] }
  const editable = board?.editable !== false

  const cellBlocks = useMemo(() => {
    const map: Record<string, Block[]> = {}
    const leftover: Block[] = []
    placed.forEach((block) => {
      const slot = slotForBlock(block, slots)
      if (!slot) {
        leftover.push(block)
        return
      }
      const key = `${block.day_of_week}|${slot.slot_index}`
      map[key] = [...(map[key] || []), block]
    })
    return { map, leftover }
  }, [placed, slots])

  const placeBlock = (block: Block, day: number, slot: Slot, unplace = false, extra: Record<string, unknown> = {}) => {
    if (!editable) return
    moveMutation.mutate({
      schedule_ids: block.schedule_ids,
      day_of_week: unplace ? 0 : day,
      start_time: slot.start,
      end_time: slot.end,
      unplace,
      ...extra,
    })
  }

  const onDropCell = (e: React.DragEvent, day: number, slot: Slot) => {
    e.preventDefault()
    setDropHint(null)
    const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain')
    if (!raw) return
    try {
      const block = JSON.parse(raw) as Block
      placeBlock(block, day, slot)
    } catch {
      toast.error('Glisser-déposer invalide')
    }
  }

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const [start, end] = form.slot.split('|')
    if (form.session_type !== 'cm' && !form.group_id) {
      toast.warning('Choisissez un groupe pour le TD/TP.')
      return
    }
    addMutation.mutate({
      module_id: Number(form.module_id),
      professor_id: Number(form.professor_id),
      room_id: Number(form.room_id),
      group_ids: form.group_id ? [Number(form.group_id)] : [],
      session_type: form.session_type,
      day_of_week: Number(form.day_of_week),
      start_time: start,
      end_time: end,
    })
  }

  const BlockCard = ({ block, compact = false }: { block: Block; compact?: boolean }) => (
    <div
      draggable={editable}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(block))
        e.dataTransfer.effectAllowed = 'move'
      }}
      onClick={() => editable && setPicked(picked?.block_id === block.block_id ? null : block)}
      className={cn(
        'rounded-xl border text-left cursor-grab active:cursor-grabbing p-2 space-y-0.5',
        block.session_type === 'cm' ? 'bg-indigo-600 text-white border-indigo-800' : 'bg-emerald-600 text-white border-emerald-800',
        picked?.block_id === block.block_id && 'ring-2 ring-offset-2 ring-amber-400',
        compact && 'text-[11px]'
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="font-black leading-tight line-clamp-2">{block.module_name}</p>
        <GripVertical className="w-3.5 h-3.5 opacity-70 shrink-0" />
      </div>
      <p className="uppercase text-[10px] font-black opacity-90">{block.session_type} · {block.group_label}</p>
      {!compact && (
        <p className="text-[10px] opacity-90">{block.professor_name} · {block.room_name}</p>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className="py-16 flex justify-center text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <button type="button" onClick={onBack} className="text-xs font-bold text-indigo-700 inline-flex items-center gap-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Retour aux filières
          </button>
          <h2 className="text-xl font-black text-slate-900">Édition manuelle — {filiereLabel}</h2>
          <p className="text-sm text-slate-500">
            {blocks.length} séance{blocks.length > 1 ? 's' : ''} — glissez une carte, ou cliquez-la pour modifier (créneau, salle, enseignant). Samedi fermé.
          </p>
        </div>
        {editable && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="px-4 py-2.5 rounded-xl bg-[#001A4B] text-white text-xs font-black uppercase inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Ajouter une séance
          </button>
        )}
      </div>

      {board?.conflicts?.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-semibold">
          {board.conflicts[0].message}
        </div>
      )}

      {picked && (
        <div key={picked.block_id} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black">Modifier :</span> {picked.module_name} · {picked.group_label}
            <span className="text-slate-500 text-xs">Ou cliquez un autre créneau pour déplacer / permuter.</span>
            <button type="button" onClick={() => setPicked(null)} className="ml-auto text-xs font-black uppercase">Fermer</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <select
              defaultValue={String(picked.day_of_week >= 1 ? picked.day_of_week : 0)}
              onChange={(e) => {
                const day = Number(e.target.value)
                const slot = slotForBlock(picked, slots) || slots[0]
                if (day === 0) placeBlock(picked, 0, slot, true)
                else placeBlock(picked, day, slot)
              }}
              className="px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
            >
              <option value="0">Retirer (à placer)</option>
              {DAYS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
            <select
              defaultValue={String((slotForBlock(picked, slots) || slots[0]).slot_index)}
              onChange={(e) => {
                const slot = slots.find((s) => s.slot_index === Number(e.target.value)) || slots[0]
                placeBlock(picked, picked.day_of_week >= 1 ? picked.day_of_week : 1, slot)
              }}
              className="px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
            >
              {slots.map((s) => <option key={s.slot_index} value={s.slot_index}>{hhmm(s.start)}–{hhmm(s.end)}</option>)}
            </select>
            <select
              defaultValue={String(picked.professor_id || '')}
              onChange={(e) => {
                const slot = slotForBlock(picked, slots) || slots[0]
                placeBlock(picked, picked.day_of_week >= 1 ? picked.day_of_week : 1, slot, false, { professor_id: Number(e.target.value) })
              }}
              className="px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
            >
              {catalog.professors.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              defaultValue={String(picked.room_id || '')}
              onChange={(e) => {
                const slot = slotForBlock(picked, slots) || slots[0]
                placeBlock(picked, picked.day_of_week >= 1 ? picked.day_of_week : 1, slot, false, { room_id: Number(e.target.value) })
              }}
              className="px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
            >
              {catalog.rooms.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => placeBlock(picked, 0, slots[0], true)}
              className="text-xs font-black uppercase text-slate-600"
            >
              Retirer de la grille
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(picked.schedule_ids)}
              className="text-xs font-black uppercase text-rose-700 inline-flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
        </div>
      )}

      {cellBlocks.leftover.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-white p-4 space-y-2">
          <h3 className="text-xs font-black uppercase text-amber-800">Séances hors créneau type ({cellBlocks.leftover.length}) — glissez-les sur la grille</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {cellBlocks.leftover.map((block) => (
              <BlockCard key={block.block_id} block={block} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4">
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-4 space-y-3 min-h-[200px]">
          <h3 className="text-xs font-black uppercase text-slate-500">À placer ({unplaced.length})</h3>
          <p className="text-[11px] text-slate-400">Déposez ici pour retirer une séance de la semaine.</p>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDropHint('unplace')
            }}
            onDrop={(e) => {
              e.preventDefault()
              setDropHint(null)
              const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain')
              if (!raw) return
              placeBlock(JSON.parse(raw), 0, slots[0], true)
            }}
            className={cn('space-y-2 min-h-[120px] rounded-2xl p-2', dropHint === 'unplace' && 'bg-slate-100')}
          >
            {unplaced.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">
                {placed.length === 0 ? 'Aucune séance dans ce brouillon. Ajoutez-en une.' : 'Toutes les séances sont sur la grille.'}
              </p>
            )}
            {unplaced.map((block) => (
              <div key={block.block_id} className="relative group">
                <BlockCard block={block} />
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(block.schedule_ids)}
                  className="absolute top-2 right-8 p-1 rounded-lg bg-black/20 text-white opacity-0 group-hover:opacity-100"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left text-[10px] font-black uppercase text-slate-400 w-28">Créneau</th>
                {DAYS.map((day) => (
                  <th key={day.id} className="p-3 text-center text-xs font-black text-slate-700">{day.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.slot_index} className="border-t border-slate-100">
                  <td className="p-3 text-[11px] font-bold text-slate-500 whitespace-nowrap">{hhmm(slot.start)}–{hhmm(slot.end)}</td>
                  {DAYS.map((day) => {
                    const key = `${day.id}|${slot.slot_index}`
                    const here = cellBlocks.map[key] || []
                    const isHint = dropHint === key
                    return (
                      <td
                        key={key}
                        onDragOver={(e) => {
                          e.preventDefault()
                          setDropHint(key)
                        }}
                        onDragLeave={() => setDropHint(null)}
                        onDrop={(e) => onDropCell(e, day.id, slot)}
                        onClick={() => picked && placeBlock(picked, day.id, slot)}
                        className={cn(
                          'p-2 align-top min-h-[88px] h-24 border-l border-slate-50',
                          isHint && 'bg-indigo-50',
                          picked && 'cursor-pointer'
                        )}
                      >
                        <div className="space-y-2">
                          {here.map((block) => (
                            <BlockCard key={block.block_id} block={block} compact />
                          ))}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={submitAdd} className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg">Nouvelle séance</h3>
              <button type="button" onClick={() => setShowAdd(false)}><X className="w-5 h-5" /></button>
            </div>
            <select required value={form.module_id} onChange={(e) => setForm({ ...form, module_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border text-sm font-semibold">
              <option value="">Module</option>
              {catalog.modules.map((m: any) => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
            </select>
            <select required value={form.professor_id} onChange={(e) => setForm({ ...form, professor_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border text-sm font-semibold">
              <option value="">Enseignant</option>
              {catalog.professors.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <p className="text-[11px] text-slate-500">CM (2 groupes) = amphi. TD = petite salle. Une salle déjà prise (cours ou réservation) sur 08h30–10h30 n’apparaît plus sur ce créneau.</p>
            <select required value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border text-sm font-semibold">
              <option value="">Salle adaptée à l’effectif</option>
              {catalog.rooms.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.capacity ? `${r.capacity} places` : ''} {r.type === 'amphitheater' || String(r.name || '').toLowerCase().includes('amphi') ? '· Amphi' : '· TD'}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select value={form.session_type} onChange={(e) => setForm({ ...form, session_type: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm font-semibold">
                <option value="cm">CM (tous les groupes)</option>
                <option value="td">TD (un groupe)</option>
                <option value="tp">TP</option>
              </select>
              <select value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm font-semibold">
                <option value="">{form.session_type === 'cm' ? 'Tous les groupes' : 'Groupe'}</option>
                {catalog.groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm font-semibold">
                <option value="0">Pas encore placée</option>
                {DAYS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
              <select value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm font-semibold">
                {slots.map((s) => (
                  <option key={s.slot_index} value={`${s.start}|${s.end}`}>{hhmm(s.start)}–{hhmm(s.end)}</option>
                ))}
              </select>
            </div>
            <button disabled={addMutation.isPending} className="w-full py-3 rounded-xl bg-[#001A4B] text-white text-sm font-black uppercase">
              {addMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
