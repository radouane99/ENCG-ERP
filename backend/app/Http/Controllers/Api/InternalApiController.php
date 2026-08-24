<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamSeating;
use App\Models\Group;
use App\Models\Message;
use App\Models\Module;
use App\Models\RoomBooking;
use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InternalApiController extends Controller
{
    /**
     * Groupes d'une filière.
     */
    public function filiereGroups(int $id): JsonResponse
    {
        $groups = Group::where('filiere_id', $id)
            ->orderBy('name')
            ->get(['id', 'name', 'academic_year_id']);

        return response()->json(['success' => true, 'data' => $groups]);
    }

    /**
     * Modules d'un groupe.
     */
    public function groupModules(int $id): JsonResponse
    {
        $group = Group::findOrFail($id);

        $modules = Module::where('filiere_id', $group->filiere_id)
            ->where('is_active', true)
            ->orderBy('semester_number')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'semester_number']);

        return response()->json(['success' => true, 'data' => $modules]);
    }

    /**
     * Disponibilité d'une salle.
     */
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
            'success' => true,
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

    /**
     * Calendrier des examens.
     */
    public function examCalendar(): JsonResponse
    {
        $events = Exam::with(['module', 'group', 'room'])
            ->whereNotNull('exam_date')
            ->orderBy('exam_date')
            ->get()
            ->map(fn (Exam $exam) => [
                'id' => $exam->id,
                'title' => trim(($exam->module?->name ?? 'Examen').' • '.($exam->group?->name ?? 'Groupe')),
                'start' => $exam->exam_date?->format('Y-m-d'),
                'type' => $exam->type,
                'room' => $exam->room?->name,
            ]);

        return response()->json(['success' => true, 'data' => $events]);
    }

    /**
     * Événements de l'emploi du temps.
     */
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
                    'title' => trim(($schedule->module?->name ?? 'Cours').' • '.($schedule->group?->name ?? 'Groupe')),
                    'start' => $targetDate->format('Y-m-d').'T'.$schedule->start_time,
                    'end' => $targetDate->format('Y-m-d').'T'.$schedule->end_time,
                    'room' => $schedule->room?->name,
                    'session_type' => $schedule->session_type,
                ];
            });

        return response()->json(['success' => true, 'data' => $events]);
    }

    /**
     * Statistiques de présence en direct.
     */
    public function liveAttendanceStats(int $examId): JsonResponse
    {
        $total = ExamSeating::where('exam_id', $examId)->count();
        $present = ExamSeating::where('exam_id', $examId)->where('is_present', true)->count();
        $absent = max(0, $total - $present);
        $rate = $total > 0 ? round(($present / $total) * 100, 1) : 0;

        return response()->json([
            'success' => true,
            'present' => $present,
            'absent' => $absent,
            'rate' => $rate,
        ]);
    }

    /**
     * Messages du chat.
     */
    public function chatMessages(int $group, int $module): JsonResponse
    {
        $messages = Message::with('sender')
            ->latest()
            ->limit(50)
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($msg) => [
                'id' => $msg->id,
                'text' => $msg->body,
                'created_at' => $msg->created_at,
                'sender' => $msg->sender->name ?? 'Inconnu',
            ]);

        return response()->json(['success' => true, 'data' => $messages]);
    }

    /**
     * Suggérer un créneau de rattrapage.
     */
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
                    'success' => true,
                    'suggested_slot' => $start->toDateTimeString(),
                    'suggested_end' => $slotEnd->toDateTimeString(),
                ]);
            }

            $start->addMinutes(30);
        }

        return response()->json(['success' => false, 'message' => 'Aucun créneau disponible.'], 404);
    }
}
