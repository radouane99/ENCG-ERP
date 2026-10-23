<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamSeating;
use App\Models\ExamSurveillance;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamAttendanceController extends Controller
{
    public function scan(Request $request): JsonResponse
    {
        $data = $request->validate(['exam_id' => 'required|integer|exists:exams,id', 'room_id' => 'required|integer|exists:rooms,id', 'qr_token' => 'required|string|max:255']);

        return DB::transaction(function () use ($request, $data) {
            $exam = Exam::with('module')->findOrFail($data['exam_id']);
            abort_unless((int) $exam->module->institution_id === (int) $request->user()->institution_id, 403);
            $admin = $request->user()->hasAnyRole(['super-admin', 'institution-admin', 'director']);
            abort_unless($admin || ExamSurveillance::where('exam_id', $exam->id)->where('room_id', $data['room_id'])->where('professor_id', $request->user()->id)->exists(), 403, 'Surveillance non affectée.');
            $seating = ExamSeating::with('student.user')->where('exam_id', $exam->id)->where('room_id', $data['room_id'])->where('qr_token', $data['qr_token'])->lockForUpdate()->firstOrFail();
            abort_if($seating->is_present, 409, 'Étudiant déjà pointé.');
            $seating->update(['is_present' => true]);
            activity()->causedBy($request->user())->performedOn($seating)->log('exam_qr_attendance');

            return response()->json(['success' => true, 'student' => ['id' => $seating->student_id, 'name' => $seating->student->user->name]]);
        });
    }

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
