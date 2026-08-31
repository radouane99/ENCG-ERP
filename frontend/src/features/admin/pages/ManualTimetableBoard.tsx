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
  const [draggingBlock, setDraggingBlock] = useState<Block | null>(null)
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
    refetch()
    onChanged?.()
  }

  const moveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post(`/admin/smart-scheduling/versions/${versionId}/move`, body).then((res) => res.data.data),
    onSuccess: (data: any) => {
      toast.success(data.message || 'Séance déplacée avec succès.')
      setPicked(null)
      setDraggingBlock(null)
      applyBoard(data)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.data?.message || err.response?.data?.message || 'Déplacement impossible : Conflit détecté')
      setDraggingBlock(null)
    },
  })

  const addMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post(`/admin/smart-scheduling/versions/${versionId}/sessions`, body).then((res) => res.data.data),
    onSuccess: (data: any) => {
      toast.success(data.message || 'Séance ajoutée avec succès')
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
      toast.success(data.message || 'Séance supprimée')
      setPicked(null)
      applyBoard(data)
    },
  })

  const slots: Slot[] = board?.slots || [
    { slot_index: 1, start: '08:30:00', end: '10:15:00', label: '08:30 - 10:15' },
    { slot_index: 2, start: '10:30:00', end: '12:15:00', label: '10:30 - 12:15' },
    { slot_index: 3, start: '14:30:00', end: '16:15:00', label: '14:30 - 16:15' },
    { slot_index: 4, start: '16:30:00', end: '18:15:00', label: '16:30 - 18:15' },
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

  // 🛡️ Intelligent Real-time Feasibility & Collision Analyzer
  const getSlotFeasibility = (block: Block | null, dayId: number, slotIndex: number) => {
    if (!block) return null

    const currentSlot = slotForBlock(block, slots)
    const isCurrent = block.day_of_week === dayId && currentSlot?.slot_index === slotIndex
    if (isCurrent) {
      return { status: 'current', message: 'Position actuelle de la séance' }
    }

    const key = `${dayId}|${slotIndex}`
    const blocksInCell = cellBlocks.map[key] || []

    // 1. Group Collision Check
    const groupConflict = blocksInCell.find(b => 
      b.block_id !== block.block_id && 
      (b.group_ids || []).some(gid => (block.group_ids || []).includes(gid))
    )
    if (groupConflict) {
      return { 
        status: 'conflict', 
        message: `⛔ Conflit Groupe : ${groupConflict.group_label} a déjà cours (${groupConflict.module_name})` 
      }
    }

    // 2. Professor Collision Check
    const profConflict = blocksInCell.find(b => 
      b.block_id !== block.block_id && 
      b.professor_id && 
      block.professor_id && 
      b.professor_id === block.professor_id
    )
    if (profConflict) {
      return { 
        status: 'conflict', 
        message: `⛔ Conflit Enseignant : ${block.professor_name} est déjà occupé (${profConflict.module_name})` 
      }
    }

    // 3. Room Collision Check
    const roomConflict = blocksInCell.find(b => 
      b.block_id !== block.block_id && 
      b.room_id && 
      block.room_id && 
      b.room_id === block.room_id
    )
    if (roomConflict) {
      return { 
        status: 'conflict', 
        message: `⛔ Conflit Salle : ${block.room_name} est déjà réservée (${roomConflict.group_label})` 
      }
    }

    // 4. Swap detection
    if (blocksInCell.length > 0) {
      return {
        status: 'swap',
        message: `🔄 Permutation : Ce créneau contient déjà ${blocksInCell[0].module_name}`,
      }
    }

    // 5. Completely free slot
    return { 
      status: 'free', 
      message: '✓ Créneau Libre & Recommandé (0 conflit)' 
    }
  }

  const activeSubject = draggingBlock || picked

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
    setDraggingBlock(null)
    const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain')
    if (!raw) return
    try {
      const block = JSON.parse(raw) as Block
      const feasibility = getSlotFeasibility(block, day, slot.slot_index)
      if (feasibility?.status === 'conflict') {
        toast.warning(feasibility.message)
      }
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
        setDraggingBlock(block)
        e.dataTransfer.setData('application/json', JSON.stringify(block))
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDragEnd={() => setDraggingBlock(null)}
      onClick={() => editable && setPicked(picked?.block_id === block.block_id ? null : block)}
      className={cn(
        'rounded-xl border text-left cursor-grab active:cursor-grabbing p-2.5 space-y-1 transition-all shadow-xs hover:shadow-md select-none',
        block.session_type === 'cm'
          ? 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white border-blue-900'
          : block.session_type === 'tp'
          ? 'bg-gradient-to-r from-purple-700 to-fuchsia-800 text-white border-purple-900'
          : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-900',
        picked?.block_id === block.block_id && 'ring-3 ring-amber-400 ring-offset-2 scale-[1.02]',
        compact && 'text-[11px]'
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="font-black leading-tight line-clamp-2 text-xs">{block.module_name}</p>
        <GripVertical className="w-3.5 h-3.5 opacity-80 shrink-0 mt-0.5" />
      </div>
      <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold uppercase opacity-95">
        <span>{block.session_type} · {block.group_label}</span>
      </div>
      {!compact && (
        <div className="pt-1 border-t border-white/20 text-[10px] opacity-90 flex items-center justify-between">
          <span className="truncate">{block.professor_name}</span>
          <span className="font-bold px-1.5 py-0.5 rounded bg-black/20 shrink-0">{block.room_name}</span>
        </div>
      )}
      {compact && (
        <div className="text-[9px] opacity-90 flex items-center justify-between pt-0.5 border-t border-white/20">
          <span className="truncate">{block.professor_name}</span>
          <span className="font-bold">{block.room_name}</span>
        </div>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold">Chargement de la grille d'édition...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <button type="button" onClick={onBack} className="text-xs font-bold text-indigo-700 hover:underline inline-flex items-center gap-1 mb-1 cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /> Retour au Générateur IA
          </button>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Édition Manuelle — {filiereLabel}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {blocks.length} séance{blocks.length > 1 ? 's' : ''} — glissez une carte pour déplacer ou permuter. 
            {activeSubject && <strong className="ml-1 text-indigo-600 dark:text-indigo-400">⚡ Radar anti-conflits actif : Observez les indicateurs vert / rouge sur chaque case.</strong>}
          </p>
        </div>
        {editable && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0f2863] hover:bg-blue-900 text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-amber-300" /> Ajouter une séance
          </button>
        )}
      </div>

      {/* 📡 Live Action Radar Banner when moving a card */}
      {activeSubject && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping shrink-0" />
            <span className="text-indigo-950 dark:text-indigo-200">
              Déplacement en cours de : <strong className="font-black text-indigo-700 dark:text-indigo-300">{activeSubject.module_name}</strong> ({activeSubject.group_label})
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Vert = Libre</span>
            <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Rouge = Conflit</span>
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Jaune = Permutation</span>
            {picked && <button type="button" onClick={() => setPicked(null)} className="ml-2 font-black uppercase text-indigo-900 underline">Annuler</button>}
          </div>
        </div>
      )}

      {picked && (
        <div key={picked.block_id} className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-amber-950">Modifier directement :</span> 
            <span className="font-bold text-amber-800">{picked.module_name} · {picked.group_label}</span>
            <span className="text-slate-500 text-xs">(Ou cliquez directement sur une case de la grille pour déplacer)</span>
            <button type="button" onClick={() => setPicked(null)} className="ml-auto text-xs font-black uppercase text-amber-900 hover:underline">Fermer</button>
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
              className="px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs font-semibold"
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
              className="px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs font-semibold"
            >
              {slots.map((s) => <option key={s.slot_index} value={s.slot_index}>{hhmm(s.start)}–{hhmm(s.end)}</option>)}
            </select>
            <select
              defaultValue={String(picked.professor_id || '')}
              onChange={(e) => {
                const slot = slotForBlock(picked, slots) || slots[0]
                placeBlock(picked, picked.day_of_week >= 1 ? picked.day_of_week : 1, slot, false, { professor_id: Number(e.target.value) })
              }}
              className="px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs font-semibold"
            >
              {catalog.professors.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              defaultValue={String(picked.room_id || '')}
              onChange={(e) => {
                const slot = slotForBlock(picked, slots) || slots[0]
                placeBlock(picked, picked.day_of_week >= 1 ? picked.day_of_week : 1, slot, false, { room_id: Number(e.target.value) })
              }}
              className="px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs font-semibold"
            >
              {catalog.rooms.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2 pt-1 border-t border-amber-200">
            <button
              type="button"
              onClick={() => placeBlock(picked, 0, slots[0], true)}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              Retirer de la grille
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(picked.schedule_ids)}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 cursor-pointer ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" /> Supprimer définitivement
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4">
        {/* Unplaced Pile */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-4 space-y-3 min-h-[200px]">
          <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">À placer ({unplaced.length})</h3>
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
            className={cn('space-y-2 min-h-[140px] rounded-2xl p-2 transition-colors', dropHint === 'unplace' && 'bg-amber-50 dark:bg-amber-950/40 border-2 border-dashed border-amber-400')}
          >
            {unplaced.length === 0 && (
              <p className="text-xs text-slate-400 py-8 text-center font-medium">
                {placed.length === 0 ? 'Aucune séance dans ce brouillon.' : 'Toutes les séances sont sur la grille.'}
              </p>
            )}
            {unplaced.map((block) => (
              <div key={block.block_id} className="relative group">
                <BlockCard block={block} />
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(block.schedule_ids)}
                  className="absolute top-2 right-8 p-1 rounded-lg bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 🗓️ The Interactive Weekly Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60">
                <th className="p-3.5 text-left text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 w-28 border-b border-slate-200 dark:border-slate-800">Créneau</th>
                {DAYS.map((day) => (
                  <th key={day.id} className="p-3.5 text-center text-xs font-black text-slate-800 dark:text-slate-200 border-b border-l border-slate-200 dark:border-slate-800">{day.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.slot_index} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="p-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap bg-slate-50/50 dark:bg-slate-800/30">
                    {hhmm(slot.start)}–{hhmm(slot.end)}
                  </td>
                  {DAYS.map((day) => {
                    const key = `${day.id}|${slot.slot_index}`
                    const here = cellBlocks.map[key] || []
                    const isHint = dropHint === key
                    const feasibility = activeSubject ? getSlotFeasibility(activeSubject, day.id, slot.slot_index) : null

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
                          'p-2 align-top min-h-[96px] h-28 border-l border-slate-100 dark:border-slate-800 transition-all relative',
                          // Feasibility Visual Feedback
                          feasibility?.status === 'free' && 'bg-emerald-50/70 dark:bg-emerald-950/20 border-2 border-dashed border-emerald-400/80',
                          feasibility?.status === 'conflict' && 'bg-rose-50/80 dark:bg-rose-950/30 border-2 border-dashed border-rose-400/80',
                          feasibility?.status === 'swap' && 'bg-amber-50/70 dark:bg-amber-950/20 border-2 border-dashed border-amber-400/80',
                          feasibility?.status === 'current' && 'bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-400',
                          isHint && 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/90 dark:bg-indigo-950/50',
                          picked && 'cursor-pointer'
                        )}
                        title={feasibility ? feasibility.message : undefined}
                      >
                        {/* Interactive Feasibility Badge Hover Indicator */}
                        {feasibility && isHint && (
                          <div className={cn(
                            "absolute inset-x-1 top-1 z-20 px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-center shadow-md animate-in zoom-in-95",
                            feasibility.status === 'free' ? "bg-emerald-600 text-white" :
                            feasibility.status === 'conflict' ? "bg-rose-600 text-white" :
                            feasibility.status === 'swap' ? "bg-amber-600 text-white" : "bg-blue-600 text-white"
                          )}>
                            {feasibility.message}
                          </div>
                        )}

                        <div className="space-y-1.5 h-full">
                          {here.map((block) => (
                            <BlockCard key={block.block_id} block={block} compact />
                          ))}
                          {here.length === 0 && !activeSubject && (
                            <div className="h-full flex items-center justify-center opacity-0 hover:opacity-40 transition-opacity">
                              <span className="text-[10px] text-slate-400 font-bold">+ Déposer</span>
                            </div>
                          )}
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
