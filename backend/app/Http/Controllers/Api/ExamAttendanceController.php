<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamSeating;
use App\Models\Student;
use Illuminate\Http\JsonResponse;

class ExamAttendanceController extends Controller
{
    /**
     * Statistiques de présence en direct pour un examen.
     */
    public function getLiveStats(int $examId): JsonResponse
    {
        $exam = Exam::with(['module', 'group'])->findOrFail($examId);

        // Étudiants inscrits au groupe de l'examen
        $totalStudents = Student::whereHas('registrations', fn ($q) => $q->where('group_id', $exam->group_id))->count();

        // Fallback : par filière
        if ($totalStudents === 0) {
            $totalStudents = Student::whereHas('registrations', fn ($q) => $q->where('filiere_id', $exam->module->filiere_id))->count();
        }

        if ($totalStudents === 0) {
            return response()->json(['success' => false, 'message' => 'Aucun étudiant inscrit trouvé.'], 404);
        }

        // Présents via exam_seatings
        $present = ExamSeating::where('exam_id', $examId)->where('is_present', true)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_students' => $totalStudents,
                'present' => $present,
                'absent' => $totalStudents - $present,
                'rate' => $totalStudents > 0 ? round(($present / $totalStudents) * 100, 1) : 0,
            ],
        ]);
    }
}
