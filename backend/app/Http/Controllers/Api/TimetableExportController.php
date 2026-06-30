<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TimetableExportController extends Controller
{
    /**
     * Export timetable data formatted for FullCalendar.
     * Supports filtering by group, professor, or room.
     */
    public function exportForFullCalendar(Request $request, $type, $id): JsonResponse
    {
        // Mocking FullCalendar format based on the ENCG ERP requirements
        $startDate = now()->startOfWeek();

        // In a real implementation, we would query the `attendance_sessions` or `schedules` tables
        // and map them to FullCalendar event format.
        
        $events = [
            [
                'id' => '1',
                'title' => 'Comptabilité Approfondie',
                'start' => $startDate->copy()->addDays(0)->setHour(8)->setMinute(0)->toIso8601String(),
                'end' => $startDate->copy()->addDays(0)->setHour(10)->setMinute(0)->toIso8601String(),
                'extendedProps' => [
                    'professor' => 'Pr. BENCHEKROUN',
                    'room' => 'Amphi A',
                    'type' => 'CM',
                    'group' => 'GFC',
                ],
                'backgroundColor' => '#3b82f6',
                'borderColor' => '#2563eb',
            ],
            [
                'id' => '2',
                'title' => 'Marketing Stratégique',
                'start' => $startDate->copy()->addDays(1)->setHour(10)->setMinute(15)->toIso8601String(),
                'end' => $startDate->copy()->addDays(1)->setHour(12)->setMinute(15)->toIso8601String(),
                'extendedProps' => [
                    'professor' => 'Pr. ALAOUI',
                    'room' => 'Salle 201',
                    'type' => 'TD',
                    'group' => 'MCM-G1',
                ],
                'backgroundColor' => '#10b981',
                'borderColor' => '#059669',
            ],
            [
                'id' => '3',
                'title' => 'Analyse Financière',
                'start' => $startDate->copy()->addDays(2)->setHour(14)->setMinute(0)->toIso8601String(),
                'end' => $startDate->copy()->addDays(2)->setHour(16)->setMinute(0)->toIso8601String(),
                'extendedProps' => [
                    'professor' => 'Dr. TAZI',
                    'room' => 'Amphi B',
                    'type' => 'CM',
                    'group' => 'GFC',
                ],
                'backgroundColor' => '#3b82f6',
                'borderColor' => '#2563eb',
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $events
        ]);
    }
}
