<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\TimetableService;
use App\Services\Academic\SmartSchedulingEngine;
use App\Services\Academic\ConflictResolutionService;
use Illuminate\Support\Facades\DB;

class TimetableController extends Controller
{
    protected TimetableService $timetableService;
    protected SmartSchedulingEngine $engine;
    protected ConflictResolutionService $resolver;

    public function __construct(
        TimetableService $timetableService,
        SmartSchedulingEngine $engine, 
        ConflictResolutionService $resolver
    ) {
        $this->timetableService = $timetableService;
        $this->engine = $engine;
        $this->resolver = $resolver;
    }

    /**
     * Get timetable for a specific context
     */
    public function index(Request $request): JsonResponse
    {
        $schedules = $this->timetableService->getSchedules($request->only(['group_id', 'professor_id', 'room_id']));

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
            'schedule_id' => 'required|string',
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

    /**
     * Publish drafted schedules for a specific filiere and semester
     */
    public function publish(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|integer',
            'semester_id' => 'required|integer',
            'filiere_id' => 'required|integer'
        ]);

        $groupIds = \App\Models\Group::where('filiere_id', $validated['filiere_id'])
                       ->where('academic_year_id', $validated['academic_year_id'])
                       ->pluck('id');

        $updated = DB::table('schedules')
            ->where('academic_year_id', $validated['academic_year_id'])
            ->where('semester_id', $validated['semester_id'])
            ->whereIn('group_id', $groupIds)
            ->where('is_active', false)
            ->update(['is_active' => true, 'updated_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => "{$updated} emplois du temps publiés avec succès."
        ]);
    }

    /**
     * Create a new schedule entry
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'institution_id' => 'required|integer',
            'academic_year_id' => 'required|integer',
            'semester_id' => 'required|integer',
            'group_id' => 'required|integer',
            'module_id' => 'required|integer',
            'room_id' => 'nullable|integer',
            'professor_id' => 'required|integer',
            'professor_type' => 'nullable|string',
            'day_of_week' => 'required|integer|min:1|max:7',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'session_type' => 'required|string',
            'recurrence' => 'nullable|string',
        ]);

        $validated['professor_type'] = $validated['professor_type'] ?? 'App\\Models\\User';
        $validated['recurrence'] = $validated['recurrence'] ?? 'weekly';
        $validated['is_active'] = true;

        $scheduleId = DB::table('schedules')->insertGetId(array_merge($validated, [
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Affectation créée avec succès',
            'data' => DB::table('schedules')->where('id', $scheduleId)->first()
        ]);
    }

    /**
     * Update an existing schedule
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'room_id' => 'nullable|integer',
            'professor_id' => 'nullable|integer',
            'day_of_week' => 'nullable|integer|min:1|max:7',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
            'session_type' => 'nullable|string',
        ]);

        $validated['updated_at'] = now();

        DB::table('schedules')->where('id', $id)->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Affectation mise à jour avec succès'
        ]);
    }

    /**
     * Delete a schedule
     */
    public function destroy($id): JsonResponse
    {
        DB::table('schedules')->where('id', $id)->delete();
        return response()->json([
            'success' => true,
            'message' => 'Affectation supprimée avec succès'
        ]);
    }
}
