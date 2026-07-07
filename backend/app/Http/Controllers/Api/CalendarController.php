<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScheduleChange;
use App\Services\CalendarService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    public function __construct(private CalendarService $calendarService)
    {
    }

    public function getEvents(Request $request)
    {
        $request->validate([
            'start' => 'required|date',
            'end' => 'required|date|after_or_equal:start',
        ]);

        $startDate = Carbon::parse($request->query('start'));
        $endDate = Carbon::parse($request->query('end'));
        $user = $request->user();

        if ($user->hasRole('student')) {
            $student = $user->student;
            if (!$student) {
                return response()->json([]);
            }
            $events = $this->calendarService->getStudentEvents($student->id, $startDate, $endDate);
            return response()->json($events);
        }

        if ($user->hasRole('professor')) {
            $professor = $user->professor;
            if (!$professor) {
                return response()->json([]);
            }
            $events = $this->calendarService->getProfessorEvents($professor->id, $startDate, $endDate);
            return response()->json($events);
        }

        return response()->json([]);
    }

    public function moveEvent(Request $request)
    {
        $request->validate([
            'event_id' => 'required|string',
            'old_date' => 'required|date_format:Y-m-d',
            'new_date' => 'required|date_format:Y-m-d',
            'new_start_time' => 'required|date_format:H:i:s',
            'new_end_time' => 'required|date_format:H:i:s',
        ]);

        // Only admins can move events
        if (!$request->user()->hasRole('admin') && !$request->user()->hasRole('super-admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $eventId = $request->input('event_id');
        
        // Parse event ID (e.g. "schedule_15_2026-07-06" or "makeup_12")
        if (str_starts_with($eventId, 'schedule_')) {
            $parts = explode('_', $eventId);
            if (count($parts) < 3) return response()->json(['message' => 'Invalid event ID'], 400);
            
            $scheduleId = $parts[1];
            $originalDate = $request->input('old_date');

            // Create or update a schedule change for this specific date
            $change = ScheduleChange::updateOrCreate(
                [
                    'schedule_id' => $scheduleId,
                    'original_date' => $originalDate,
                ],
                [
                    'type' => 'rescheduled',
                    'new_date' => $request->input('new_date'),
                    'new_start_time' => $request->input('new_start_time'),
                    'new_end_time' => $request->input('new_end_time'),
                    'created_by' => $request->user()->id,
                ]
            );

            return response()->json(['message' => 'Class moved successfully', 'change' => $change]);
        }

        if (str_starts_with($eventId, 'makeup_')) {
            $parts = explode('_', $eventId);
            $makeupId = $parts[1];
            $change = ScheduleChange::findOrFail($makeupId);
            
            $change->update([
                'new_date' => $request->input('new_date'),
                'new_start_time' => $request->input('new_start_time'),
                'new_end_time' => $request->input('new_end_time'),
            ]);

            return response()->json(['message' => 'Makeup class moved successfully', 'change' => $change]);
        }

        return response()->json(['message' => 'Event type not movable'], 400);
    }
}
