<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Group;
use App\Models\Module;
use App\Models\RoomBooking;
use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InternalApiController extends Controller
{
    public function filiereGroups(int $id): JsonResponse
    {
        $groups = Group::where('filiere_id', $id)
            ->orderBy('name')
            ->get(['id', 'name', 'academic_year_id']);

        return response()->json($groups);
    }

    public function groupModules(int $id): JsonResponse
    {
        $group = Group::findOrFail($id);

        $modules = Module::where('filiere_id', $group->filiere_id)
            ->where('is_active', true)
            ->orderBy('semester_number')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'semester_number']);

        return response()->json($modules);
    }

    public function roomAvailability(int $id): JsonResponse
    {
        $now = now();

        $currentBooking = RoomBooking::where('room_id', $id)
            ->whereIn('status', ['pending', 'approved'])
            ->where('start_time', '<=', $now)
            ->where('end_time', '>=', $now)
            ->first();

        $nextBooking = RoomBooking::where('room_id', $id)
            ->whereIn('status', ['pending', 'approved'])
            ->where('start_time', '>', $now)
            ->orderBy('start_time')
            ->first();

        return response()->json([
            'available' => $currentBooking === null,
            'current_booking' => $currentBooking ? [
                'purpose' => $currentBooking->purpose,
                'ends_at' => $currentBooking->end_time,
            ] : null,
            'next_booking' => $nextBooking ? [
                'purpose' => $nextBooking->purpose,
                'starts_at' => $nextBooking->start_time,
            ] : null,
        ]);
    }

    public function examCalendar(): JsonResponse
    {
        $events = Exam::with(['module', 'group', 'room'])
            ->whereNotNull('exam_date')
            ->orderBy('exam_date')
            ->get()
            ->map(fn (Exam $exam) => [
                'id' => $exam->id,
                'title' => trim(($exam->module?->name ?? 'Examen') . ' • ' . ($exam->group?->name ?? 'Groupe')),
                'start' => $exam->exam_date?->format('Y-m-d'),
                'type' => $exam->type,
                'room' => $exam->room?->name,
            ]);

        return response()->json($events);
    }

    public function timetableEvents(): JsonResponse
    {
        $today = Carbon::today();

        $events = Schedule::with(['module', 'group', 'room'])
            ->where('is_active', true)
            ->get()
            ->map(function (Schedule $schedule) use ($today) {
                $targetDate = $today->copy()->startOfWeek()->addDays(max(0, ((int) $schedule->day_of_week) - 1));

                return [
                    'id' => $schedule->id,
                    'title' => trim(($schedule->module?->name ?? 'Cours') . ' • ' . ($schedule->group?->name ?? 'Groupe')),
                    'start' => $targetDate->format('Y-m-d') . 'T' . $schedule->start_time,
                    'end' => $targetDate->format('Y-m-d') . 'T' . $schedule->end_time,
                    'room' => $schedule->room?->name,
                    'session_type' => $schedule->session_type,
                ];
            });

        return response()->json($events);
    }

    public function liveAttendanceStats(int $examId): JsonResponse
    {
        $stats = DB::table('exam_seatings')
            ->where('exam_id', $examId)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN is_present = 1 THEN 1 ELSE 0 END) as present")
            ->first();

        $present = (int) ($stats->present ?? 0);
        $total = (int) ($stats->total ?? 0);
        $absent = max(0, $total - $present);
        $rate = $total > 0 ? round(($present / $total) * 100, 1) : 0;

        return response()->json([
            'present' => $present,
            'absent' => $absent,
            'rate' => $rate,
        ]);
    }

    public function chatMessages(int $group, int $module): JsonResponse
    {
        $messages = DB::table('messages')
            ->join('users', 'messages.sender_id', '=', 'users.id')
            ->orderByDesc('messages.created_at')
            ->limit(50)
            ->get([
                'messages.id',
                'messages.body as text',
                'messages.created_at',
                'users.name as sender',
            ])
            ->reverse()
            ->values();

        return response()->json($messages);
    }

    public function suggestMakeup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_id' => 'nullable|integer|exists:rooms,id',
            'duration_minutes' => 'nullable|integer|min:30|max:240',
        ]);

        $duration = $validated['duration_minutes'] ?? 120;
        $start = now()->addDay()->startOfDay()->setHour(8);
        $end = now()->addDay()->startOfDay()->setHour(18);
        $roomId = $validated['room_id'] ?? null;

        while ($start->lt($end)) {
            $slotEnd = $start->copy()->addMinutes($duration);

            $conflict = RoomBooking::query()
                ->when($roomId, fn ($query) => $query->where('room_id', $roomId))
                ->whereIn('status', ['pending', 'approved'])
                ->where('start_time', '<', $slotEnd)
                ->where('end_time', '>', $start)
                ->exists();

            if (! $conflict) {
                return response()->json([
                    'suggested_slot' => $start->toDateTimeString(),
                    'suggested_end' => $slotEnd->toDateTimeString(),
                ]);
            }

            $start->addMinutes(30);
        }

        return response()->json(['message' => 'Aucun créneau disponible trouvé.'], 404);
    }
}
