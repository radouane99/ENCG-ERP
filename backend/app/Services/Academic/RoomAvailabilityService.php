<?php

namespace App\Services\Academic;

use App\Models\Group;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class RoomAvailabilityService
{
    public const TIME_BLOCKS = [
        ['slot_index' => 1, 'start' => '08:30', 'end' => '10:30', 'label' => '08:30 – 10:30'],
        ['slot_index' => 2, 'start' => '10:45', 'end' => '12:45', 'label' => '10:45 – 12:45'],
        ['slot_index' => 3, 'start' => '14:30', 'end' => '16:30', 'label' => '14:30 – 16:30'],
        ['slot_index' => 4, 'start' => '16:45', 'end' => '18:45', 'label' => '16:45 – 18:45'],
    ];

    public function __construct(
        private TimetableRoomGuard $roomGuard
    ) {}

    /**
     * Smart Room Finder for Extra Sessions, Rattrapages & Events.
     */
    public function smartFind(array $params): array
    {
        $dateStr = $params['date'] ?? now()->format('Y-m-d');
        $startTimeStr = $params['start_time'] ?? '08:30';
        $endTimeStr = $params['end_time'] ?? '10:30';
        $preferredRoomId = isset($params['preferred_room_id']) && $params['preferred_room_id'] ? (int) $params['preferred_room_id'] : null;
        $sessionType = strtolower((string) ($params['session_type'] ?? 'td'));
        $headcount = (int) ($params['headcount'] ?? 0);
        $groupIds = (array) ($params['group_ids'] ?? []);
        $filiereId = isset($params['filiere_id']) && $params['filiere_id'] ? (int) $params['filiere_id'] : null;

        // Compute headcount if not provided
        if ($headcount <= 0 && ! empty($groupIds)) {
            $headcount = Group::whereIn('id', $groupIds)->count() * 35;
        }
        if ($headcount <= 0) {
            $headcount = ($sessionType === 'cm' || $sessionType === 'amphi') ? 80 : 35;
        }

        $targetDate = Carbon::parse($dateStr);
        $startDateTime = Carbon::parse("{$dateStr} {$startTimeStr}");
        $endDateTime = Carbon::parse("{$dateStr} {$endTimeStr}");
        $dayOfWeek = (int) $targetDate->dayOfWeekIso; // 1 = Lundi, 7 = Dimanche

        $allRooms = Room::query()
            ->where('is_available', true)
            ->orderBy('capacity')
            ->get();

        // 1. Check preferred room if requested
        $preferredRoomStatus = null;
        if ($preferredRoomId) {
            $preferredRoom = $allRooms->firstWhere('id', $preferredRoomId) ?? Room::find($preferredRoomId);
            if ($preferredRoom) {
                $isBusy = $this->roomGuard->isRoomBusyAt((string) $preferredRoomId, $startDateTime, $endDateTime);
                $conflictingInfo = null;

                if ($isBusy) {
                    $conflictingInfo = $this->findConflictDetails($preferredRoomId, $dayOfWeek, $targetDate, $startTimeStr, $endTimeStr, $startDateTime, $endDateTime);
                }

                $preferredRoomStatus = [
                    'room_id' => $preferredRoom->id,
                    'room_name' => $preferredRoom->name,
                    'room_code' => $preferredRoom->code,
                    'type' => $preferredRoom->type,
                    'capacity' => $preferredRoom->capacity,
                    'is_available' => ! $isBusy,
                    'conflict_reason' => $isBusy ? ($conflictingInfo['summary'] ?? 'Salle occupée sur ce créneau.') : null,
                    'conflict_details' => $conflictingInfo,
                ];
            }
        }

        // 2. Find Available Alternative Rooms fitting headcount & session type
        $availableRooms = [];
        $isCm = in_array($sessionType, ['cm', 'amphi', 'cours', 'magistral'], true);

        foreach ($allRooms as $room) {
            // Must have enough capacity
            if ($room->capacity < $headcount) {
                continue;
            }

            // Check if busy
            if ($this->roomGuard->isRoomBusyAt((string) $room->id, $startDateTime, $endDateTime)) {
                continue;
            }

            // Prefer amphi for CM, and TD room for TD
            $isAmphi = $this->roomGuard->isAmphitheater($room);
            $typeMatch = $isCm ? ($isAmphi || $room->capacity >= 80) : (! $isAmphi || $room->capacity <= 50);

            $availableRooms[] = [
                'id' => $room->id,
                'name' => $room->name,
                'code' => $room->code,
                'type' => $room->type,
                'capacity' => $room->capacity,
                'exam_capacity' => $room->exam_capacity ?? (int) floor($room->capacity / 2),
                'has_projector' => (bool) $room->has_projector,
                'has_ac' => (bool) $room->has_ac,
                'is_amphi' => $isAmphi,
                'building' => $room->building ?? 'Principal',
                'is_perfect_fit' => $typeMatch,
                'fit_score' => $this->calculateFitScore($room, $headcount, $isCm),
            ];
        }

        // Sort by fit score descending
        usort($availableRooms, fn ($a, $b) => $b['fit_score'] <=> $a['fit_score']);

        // 3. Find Alternative Time Slots for the preferred room
        $alternativeSlots = [];
        if ($preferredRoomId && $preferredRoomStatus && ! $preferredRoomStatus['is_available']) {
            foreach (self::TIME_BLOCKS as $block) {
                if ($block['start'] === $startTimeStr && $block['end'] === $endTimeStr) {
                    continue; // Skip the requested one that failed
                }

                $slotStart = Carbon::parse("{$dateStr} {$block['start']}");
                $slotEnd = Carbon::parse("{$dateStr} {$block['end']}");

                $slotBusy = $this->roomGuard->isRoomBusyAt((string) $preferredRoomId, $slotStart, $slotEnd);
                if (! $slotBusy) {
                    $alternativeSlots[] = [
                        'date' => $dateStr,
                        'day_name' => $targetDate->locale('fr')->isoFormat('dddd'),
                        'start_time' => $block['start'],
                        'end_time' => $block['end'],
                        'label' => $block['label'],
                        'is_same_day' => true,
                    ];
                }
            }

            // Also check next day if fewer than 2 slots found
            if (count($alternativeSlots) < 2) {
                $nextDay = $targetDate->copy()->addWeekday();
                $nextDateStr = $nextDay->format('Y-m-d');
                foreach (self::TIME_BLOCKS as $block) {
                    $slotStart = Carbon::parse("{$nextDateStr} {$block['start']}");
                    $slotEnd = Carbon::parse("{$nextDateStr} {$block['end']}");
                    if (! $this->roomGuard->isRoomBusyAt((string) $preferredRoomId, $slotStart, $slotEnd)) {
                        $alternativeSlots[] = [
                            'date' => $nextDateStr,
                            'day_name' => $nextDay->locale('fr')->isoFormat('dddd'),
                            'start_time' => $block['start'],
                            'end_time' => $block['end'],
                            'label' => $nextDay->locale('fr')->isoFormat('ddd D MMM').' · '.$block['label'],
                            'is_same_day' => false,
                        ];
                    }
                }
            }
        }

        return [
            'success' => true,
            'query' => [
                'date' => $dateStr,
                'day_name' => $targetDate->locale('fr')->isoFormat('dddd D MMMM YYYY'),
                'start_time' => $startTimeStr,
                'end_time' => $endTimeStr,
                'headcount' => $headcount,
                'session_type' => $sessionType,
                'preferred_room_id' => $preferredRoomId,
            ],
            'preferred_room' => $preferredRoomStatus,
            'available_rooms' => $availableRooms,
            'available_rooms_count' => count($availableRooms),
            'alternative_slots' => $alternativeSlots,
        ];
    }

    /**
     * Get Room Occupancy Matrix for all rooms on a specific date.
     */
    public function getOccupancyMatrix(string $date, ?string $type = null, ?string $search = null): array
    {
        $targetDate = Carbon::parse($date);
        $dayOfWeek = (int) $targetDate->dayOfWeekIso;

        $roomsQuery = Room::query()
            ->orderBy('type')
            ->orderBy('name');

        if ($type && $type !== 'all') {
            $roomsQuery->where('type', $type);
        }

        if ($search) {
            $roomsQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $rooms = $roomsQuery->get();

        // Preload schedules for this day of week
        $schedules = Schedule::with(['module', 'professor.user', 'group.filiere'])
            ->where('day_of_week', $dayOfWeek)
            ->whereIn('room_id', $rooms->pluck('id'))
            ->get();

        // Preload room bookings for this specific date
        $startOfDay = $targetDate->copy()->startOfDay();
        $endOfDay = $targetDate->copy()->endOfDay();
        $bookings = RoomBooking::with(['booker'])
            ->where('status', 'approved')
            ->whereBetween('start_time', [$startOfDay, $endOfDay])
            ->whereIn('room_id', $rooms->pluck('id'))
            ->get();

        $matrix = [];
        $totalSlots = 0;
        $occupiedSlots = 0;

        foreach ($rooms as $room) {
            $roomSlots = [];

            foreach (self::TIME_BLOCKS as $block) {
                $totalSlots++;
                $blockStart = $block['start'];
                $blockEnd = $block['end'];
                $blockStartDT = Carbon::parse("{$date} {$blockStart}:00");
                $blockEndDT = Carbon::parse("{$date} {$blockEnd}:00");

                // Check schedule
                $matchingSchedule = $schedules->first(function ($s) use ($room, $blockStart, $blockEnd) {
                    if ((int) $s->room_id !== (int) $room->id) {
                        return false;
                    }
                    $sStart = substr((string) $s->start_time, 0, 5);
                    $sEnd = substr((string) $s->end_time, 0, 5);

                    return $sStart < $blockEnd && $sEnd > $blockStart;
                });

                // Check booking
                $matchingBooking = $bookings->first(function ($b) use ($room, $blockStartDT, $blockEndDT) {
                    if ((int) $b->room_id !== (int) $room->id) {
                        return false;
                    }
                    $bStart = Carbon::parse($b->start_time);
                    $bEnd = Carbon::parse($b->end_time);

                    return $bStart < $blockEndDT && $bEnd > $blockStartDT;
                });

                if ($matchingSchedule) {
                    $occupiedSlots++;
                    $roomSlots[] = [
                        'slot_index' => $block['slot_index'],
                        'time_label' => $block['label'],
                        'status' => 'class',
                        'title' => $matchingSchedule->module?->name ?? 'Séance de cours',
                        'module_code' => $matchingSchedule->module?->code,
                        'professor' => $matchingSchedule->professor?->user ? "{$matchingSchedule->professor->user->first_name} {$matchingSchedule->professor->user->last_name}" : 'Enseignant',
                        'group' => $matchingSchedule->group?->name ?? 'Groupe',
                        'filiere' => $matchingSchedule->group?->filiere?->code ?? '',
                        'session_type' => $matchingSchedule->session_type ?? 'cours',
                    ];
                } elseif ($matchingBooking) {
                    $occupiedSlots++;
                    $roomSlots[] = [
                        'slot_index' => $block['slot_index'],
                        'time_label' => $block['label'],
                        'status' => 'booking',
                        'title' => $matchingBooking->purpose ?? 'Réservation',
                        'booker' => $matchingBooking->booker ? "{$matchingBooking->booker->first_name} {$matchingBooking->booker->last_name}" : 'Admin',
                        'booking_id' => $matchingBooking->id,
                    ];
                } else {
                    $roomSlots[] = [
                        'slot_index' => $block['slot_index'],
                        'time_label' => $block['label'],
                        'status' => 'free',
                        'title' => 'Disponible',
                    ];
                }
            }

            $matrix[] = [
                'room_id' => $room->id,
                'name' => $room->name,
                'code' => $room->code,
                'type' => $room->type,
                'capacity' => $room->capacity,
                'has_projector' => (bool) $room->has_projector,
                'has_ac' => (bool) $room->has_ac,
                'is_available' => (bool) $room->is_available,
                'slots' => $roomSlots,
                'occupancy_rate' => count(array_filter($roomSlots, fn ($s) => $s['status'] !== 'free')) / 4 * 100,
            ];
        }

        $globalOccupancyRate = $totalSlots > 0 ? round(($occupiedSlots / $totalSlots) * 100, 1) : 0;

        return [
            'date' => $date,
            'day_name' => $targetDate->locale('fr')->isoFormat('dddd D MMMM YYYY'),
            'time_blocks' => self::TIME_BLOCKS,
            'rooms' => $matrix,
            'stats' => [
                'total_rooms' => $rooms->count(),
                'total_slots' => $totalSlots,
                'occupied_slots' => $occupiedSlots,
                'free_slots' => $totalSlots - $occupiedSlots,
                'global_occupancy_rate' => $globalOccupancyRate,
            ],
        ];
    }

    private function findConflictDetails(int $roomId, int $dayOfWeek, Carbon $date, string $start, string $end, Carbon $startDT, Carbon $endDT): ?array
    {
        // 1. Check Schedule
        $schedule = Schedule::with(['module', 'professor.user', 'group.filiere'])
            ->where('room_id', $roomId)
            ->where('day_of_week', $dayOfWeek)
            ->where(function ($q) use ($start, $end) {
                $q->where('start_time', '<', $end)
                    ->where('end_time', '>', $start);
            })
            ->first();

        if ($schedule) {
            $prof = $schedule->professor?->user ? "{$schedule->professor->user->first_name} {$schedule->professor->user->last_name}" : 'Enseignant';
            $mod = $schedule->module?->name ?? 'Cours';
            $grp = $schedule->group?->name ?? 'Groupe';

            return [
                'type' => 'timetable_class',
                'module' => $mod,
                'professor' => $prof,
                'group' => $grp,
                'summary' => "Occupée par le cours {$mod} ({$grp}) — Pr. {$prof}.",
            ];
        }

        // 2. Check Room Booking
        $booking = RoomBooking::with(['booker'])
            ->where('room_id', $roomId)
            ->where('status', 'approved')
            ->where(function ($q) use ($startDT, $endDT) {
                $q->where('start_time', '<', $endDT)
                    ->where('end_time', '>', $startDT);
            })
            ->first();

        if ($booking) {
            $booker = $booking->booker ? "{$booking->booker->first_name} {$booking->booker->last_name}" : 'Administration';

            return [
                'type' => 'booking',
                'purpose' => $booking->purpose,
                'booker' => $booker,
                'summary' => "Réservée pour : {$booking->purpose} (par {$booker}).",
            ];
        }

        return null;
    }

    private function calculateFitScore(object $room, int $headcount, bool $isCm): int
    {
        $score = 100;
        $waste = (int) $room->capacity - $headcount;

        // Deduct points for excessive waste
        if ($waste > 100) {
            $score -= 30;
        } elseif ($waste > 50) {
            $score -= 15;
        }

        // Add bonus for projector / AC
        if ($room->has_projector ?? false) {
            $score += 5;
        }
        if ($room->has_ac ?? false) {
            $score += 5;
        }

        return max(10, min(100, $score));
    }
}
