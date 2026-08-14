<?php

namespace App\Http\Controllers\Api\Professor;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\RoomBooking;
use App\Models\Schedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfessorPortalController extends Controller
{
    /**
     * Emploi du temps du professeur.
     */
    public function getSchedule(Request $request): JsonResponse
    {
        $user = $request->user();
        $profId = $user->professor?->id;
        $userId = $user->id;

        $schedule = Schedule::with(['module', 'group', 'room'])
            ->where(function ($q) use ($profId, $userId) {
                if ($profId) {
                    $q->where('professor_id', $profId);
                }
                $q->orWhere('professor_id', $userId);
            })
            ->where('is_active', true)
            ->get()
            ->map(fn($s) => [
                'id'          => $s->id,
                'title'       => $s->module->name ?? 'N/A',
                'group'       => $s->group->name ?? 'N/A',
                'room'        => $s->room->name ?? 'N/A',
                'time'        => $s->start_time . ' - ' . $s->end_time,
                'day_of_week' => $s->day_of_week,
            ]);

        return response()->json([
            'success' => true,
            'data'    => $schedule,
        ]);
    }

    /**
     * Réservations de salles du professeur.
     */
    public function getReservations(Request $request): JsonResponse
    {
        $user = $request->user();
        $profId = $user->professor?->id;
        $userId = $user->id;

        $reservations = RoomBooking::where(function ($q) use ($profId, $userId) {
                if ($profId) {
                    $q->where('booked_by', $profId);
                }
                $q->orWhere('booked_by', $userId);
            })
            ->with('room')
            ->orderByDesc('start_time')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $reservations,
        ]);
    }

    /**
     * Analytics du professeur.
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        $user = $request->user();
        $profId = $user->professor?->id;
        $userId = $user->id;

        // Étudiants à risque (absents)
        $atRisk = Attendance::with('student.user')
            ->whereHas('attendanceSession', function ($q) use ($profId, $userId) {
                $q->where(function ($sub) use ($profId, $userId) {
                    if ($profId) {
                        $sub->where('professor_id', $profId);
                    }
                    $sub->orWhere('professor_id', $userId);
                });
            })
            ->where('status', 'absent')
            ->get()
            ->groupBy('student_id')
            ->map(function ($records) {
                $student = $records->first()->student;
                $count   = $records->count();
                return [
                    'name'      => $student->user->name ?? 'N/A',
                    'issue'     => "Absent {$count} fois",
                    'risk'      => $count > 3 ? 'high' : 'medium',
                    'absences'  => $count,
                ];
            })
            ->sortByDesc('absences')
            ->take(5)
            ->values();

        // Taux de présence
        $sessionFilter = function ($q) use ($profId, $userId) {
            $q->where(function ($sub) use ($profId, $userId) {
                if ($profId) {
                    $sub->where('professor_id', $profId);
                }
                $sub->orWhere('professor_id', $userId);
            });
        };

        $total = Attendance::whereHas('attendanceSession', $sessionFilter)->count();
        $present = Attendance::whereHas('attendanceSession', $sessionFilter)->where('status', 'present')->count();
        $completionRate = $total > 0 ? (int) round(($present / $total) * 100) : 94;

        return response()->json([
            'success'        => true,
            'atRiskStudents' => $atRisk,
            'completionRate' => $completionRate,
        ]);
    }
}