<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\ExamPlanningEngine;
use Illuminate\Support\Facades\DB;

class ExamPlanningController extends Controller
{
    protected ExamPlanningEngine $engine;

    public function __construct(ExamPlanningEngine $engine)
    {
        $this->engine = $engine;
    }

    /**
     * Generate an exam plan (Seatings + Surveillance)
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'exam_id' => 'required|integer',
            'room_ids' => 'required|array',
            'room_ids.*' => 'integer',
            'professor_ids' => 'required|array',
            'professor_ids.*' => 'integer'
        ]);

        $result = $this->engine->generatePlan(
            $validated['exam_id'],
            $validated['room_ids'],
            $validated['professor_ids']
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Get details of an exam's seating and surveillance
     */
    public function getDetails(int $examId): JsonResponse
    {
        $seatings = DB::table('exam_seatings')
            ->join('students', 'exam_seatings.student_id', '=', 'students.id')
            ->join('rooms', 'exam_seatings.room_id', '=', 'rooms.id')
            ->where('exam_id', $examId)
            ->select('exam_seatings.*', 'students.first_name', 'students.last_name', 'rooms.name as room_name')
            ->orderBy('rooms.name')
            ->orderBy('exam_seatings.seat_number')
            ->get();

        $surveillances = DB::table('exam_surveillances')
            ->join('users', 'exam_surveillances.professor_id', '=', 'users.id')
            ->join('rooms', 'exam_surveillances.room_id', '=', 'rooms.id')
            ->where('exam_id', $examId)
            ->select('exam_surveillances.*', 'users.first_name', 'users.last_name', 'rooms.name as room_name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'seatings' => $seatings,
                'surveillances' => $surveillances
            ]
        ]);
    }
}
