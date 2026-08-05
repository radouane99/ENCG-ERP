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
        $professorId = $request->user()->id;

        $schedule = Schedule::with(['module', 'group'])
            ->where('professor_id', $professorId)
            ->where('is_active', true)
            ->get()
            ->map(fn($s) => [
                'id'    => $s->id,
                'title' => $s->module->name ?? 'N/A',
                'group' => $s->group->name ?? 'N/A',
                'time'  => $s->start_time . ' - ' . $s->end_time,
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
        $professorId = $request->user()->id;

        $reservations = RoomBooking::where('booked_by', $professorId)
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
        $professorId = $request->user()->id;

        // Étudiants à risque (absents)
        $atRisk = Attendance::with('student.user')
            ->whereHas('attendanceSession', fn($q) => $q->where('professor_id', $professorId))
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
        $total     = Attendance::whereHas('attendanceSession', fn($q) => $q->where('professor_id', $professorId))->count();
        $present   = Attendance::whereHas('attendanceSession', fn($q) => $q->where('professor_id', $professorId))->where('status', 'present')->count();
        $completionRate = $total > 0 ? (int) round(($present / $total) * 100) : null;

        return response()->json([
            'success'        => true,
            'atRiskStudents'  => $atRisk,
            'completionRate'  => $completionRate,
        ]);
    }
}