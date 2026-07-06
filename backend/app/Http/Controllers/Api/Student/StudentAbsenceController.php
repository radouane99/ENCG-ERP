<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentAbsenceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $records = AttendanceRecord::where('student_id', $request->user()->id)
            ->with('session.module')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'absences' => $records
        ]);
    }
}
