<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\SmartSchedulingEngine;
use App\Services\Academic\ConflictResolutionService;
use Illuminate\Support\Facades\DB;

class TimetableController extends Controller
{
    protected SmartSchedulingEngine $engine;
    protected ConflictResolutionService $resolver;

    public function __construct(SmartSchedulingEngine $engine, ConflictResolutionService $resolver)
    {
        $this->engine = $engine;
        $this->resolver = $resolver;
    }

    /**
     * Get timetable for a specific context (admin, prof, student)
     */
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('schedules')
            ->join('modules', 'schedules.module_id', '=', 'modules.id')
            ->join('rooms', 'schedules.room_id', '=', 'rooms.id')
            ->join('groups', 'schedules.group_id', '=', 'groups.id')
            ->select(
                'schedules.id',
                'schedules.day_of_week',
                'schedules.start_time',
                'schedules.end_time',
                'modules.name as module_name',
                'rooms.name as room_name',
                'groups.name as group_name',
                'schedules.professor_id'
            )
            ->where('schedules.is_active', true);

        if ($request->has('group_id')) {
            $query->where('schedules.group_id', $request->group_id);
        }
        
        if ($request->has('professor_id')) {
            $query->where('schedules.professor_id', $request->professor_id);
        }

        $schedules = $query->get();

        return response()->json(['success' => true, 'data' => $schedules]);
    }

    /**
     * Trigger automatic schedule generation
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'institution_id' => 'required|integer',
            'academic_year_id' => 'required|integer',
            'semester_id' => 'required|integer',
            'filiere_id' => 'required|integer'
        ]);

        $result = $this->engine->generateSemesterTimetable(
            $validated['institution_id'],
            $validated['academic_year_id'],
            $validated['semester_id'],
            $validated['filiere_id']
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Validate a Drag & Drop move
     */
    public function checkConflict(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'schedule_id' => 'required|integer',
            'new_day' => 'required|integer',
            'new_start_time' => 'required',
            'new_end_time' => 'required',
            'new_room_id' => 'required|integer'
        ]);

        $result = $this->resolver->validateAndSuggestMove(
            $validated['schedule_id'],
            $validated['new_day'],
            $validated['new_start_time'],
            $validated['new_end_time'],
            $validated['new_room_id']
        );

        if ($result['success']) {
            // Apply move
            DB::table('schedules')->where('id', $validated['schedule_id'])->update([
                'day_of_week' => $validated['new_day'],
                'start_time' => $validated['new_start_time'],
                'end_time' => $validated['new_end_time'],
                'room_id' => $validated['new_room_id'],
                'updated_at' => now()
            ]);
        }

        return response()->json($result);
    }
}
