<?php

namespace App\Http\Controllers\Api\Professor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProfessorPortalController extends Controller
{
    public function getSchedule(\Illuminate\Http\Request $request)
    {
        $professorId = $request->user()->id;

        $schedule = \Illuminate\Support\Facades\DB::table('schedules')
            ->join('modules', 'schedules.module_id', '=', 'modules.id')
            ->join('groups', 'schedules.group_id', '=', 'groups.id')
            ->where('schedules.professor_id', $professorId)
            ->where('schedules.is_active', true)
            ->select(
                'schedules.id',
                'modules.name as title',
                'groups.name as group',
                \Illuminate\Support\Facades\DB::raw("CONCAT(schedules.start_time, ' - ', schedules.end_time) as time")
            )
            ->get();

        return response()->json(['data' => $schedule]);
    }

    public function getReservations(\Illuminate\Http\Request $request)
    {
        $professorId = $request->user()->id;

        $reservations = \App\Models\RoomBooking::where('booked_by', $professorId)
            ->with('room')
            ->orderBy('start_time', 'desc')
            ->get();

        return response()->json(['data' => $reservations]);
    }

    public function getAnalytics(\Illuminate\Http\Request $request)
    {
        $professorId = $request->user()->id;

        // Get students with most absences in this professor's sessions
        $atRisk = \Illuminate\Support\Facades\DB::table('attendance_records')
            ->join('attendance_sessions', 'attendance_records.attendance_session_id', '=', 'attendance_sessions.id')
            ->join('users', 'attendance_records.student_id', '=', 'users.id')
            ->where('attendance_sessions.professor_id', $professorId)
            ->where('attendance_records.status', 'absent')
            ->select('users.first_name', 'users.last_name', \Illuminate\Support\Facades\DB::raw('count(attendance_records.id) as absences'))
            ->groupBy('users.id', 'users.first_name', 'users.last_name')
            ->having('absences', '>=', 1)
            ->orderByDesc('absences')
            ->limit(5)
            ->get();

        $formattedAtRisk = $atRisk->map(function($student) {
            return [
                'name' => $student->first_name . ' ' . $student->last_name,
                'issue' => "Absent {$student->absences} fois",
                'risk' => $student->absences > 3 ? 'high' : 'medium',
                'absences' => $student->absences
            ];
        });

        // Mock overall completion rate for demo since we don't track course completion
        $completionRate = 78;
        $avgTime = 42;

        return response()->json([
            'atRiskStudents' => $formattedAtRisk,
            'completionRate' => $completionRate,
            'avgTime' => $avgTime
        ]);
    }
}
