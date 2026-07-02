<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\Grade;
use App\Models\AttendanceRecord;

class MobileStudentController extends Controller
{
    /**
     * Get the student's dashboard profile overview for the mobile app
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Ensure user is actually a student
        if (!$user->hasRole('student')) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        $student = $user->student;

        if (!$student) {
            return response()->json(['error' => 'Profil étudiant introuvable'], 404);
        }

        // Real DB aggregations
        $avgGrade = DB::table('grades')->where('student_id', $student->id)->avg('value');
        $absences = AttendanceRecord::where('student_id', $student->id)->where('status', 'absent')->count();
        $filiere = $student->latestPathway ? $student->latestPathway->filiere->code : 'Non affecté';

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $student->id,
                'name' => $user->name,
                'cne' => $student->cne ?? 'N/A',
                'program' => $filiere,
                'semester' => 'S1', // Needs semester management implementation
                'current_average' => $avgGrade ? round($avgGrade, 2) : 0,
                'rank' => null, // Rank computation is complex, skipping for MVP
                'absences' => $absences
            ]
        ]);
    }

    /**
     * Get the student's schedule for today/week for the mobile app
     */
    public function schedule(Request $request): JsonResponse
    {
        // Mocked schedule response for mobile app consumption
        return response()->json([
            'success' => true,
            'data' => [
                [
                    'id' => 1,
                    'course' => 'Financial Accounting II',
                    'professor' => 'Dr. Bennani',
                    'room' => 'Amphi 1',
                    'start_time' => '08:30',
                    'end_time' => '10:15',
                    'type' => 'CM', // Cours Magistral
                ],
                [
                    'id' => 2,
                    'course' => 'Corporate Finance',
                    'professor' => 'Dr. Alaoui',
                    'room' => 'Room 204',
                    'start_time' => '10:30',
                    'end_time' => '12:15',
                    'type' => 'TD', // Travaux Dirigés
                ],
            ]
        ]);
    }

    /**
     * Get the student's recent grades
     */
    public function grades(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasRole('student') || !$user->student) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $studentId = $user->student->id;
        
        $grades = Grade::with('gradeComponent.module')
            ->where('student_id', $studentId)
            ->get();

        $modules = $grades->map(function ($grade) {
            return [
                'name' => $grade->gradeComponent->module->name ?? 'Module Inconnu',
                'score' => $grade->value,
                'is_validated' => $grade->value >= 10,
            ];
        });

        $avgGrade = $grades->avg('value');

        return response()->json([
            'success' => true,
            'data' => [
                'semester_average' => $avgGrade ? round($avgGrade, 2) : 0,
                'modules' => $modules
            ]
        ]);
    }
}
