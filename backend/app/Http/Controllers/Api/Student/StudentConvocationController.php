<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Api\PdfExportController;
use App\Http\Controllers\Controller;
use App\Models\Convocation;
use App\Models\ExamIncident;
use App\Models\ExamSeating;
use App\Models\Student;
use App\Services\Academic\AcademicContext;
use App\Services\Academic\ExamConvocationService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentConvocationController extends Controller
{
    /**
     * Liste des convocations de l'étudiant.
     */
    public function index(Request $request): JsonResponse
    {
        $student = Student::where('user_id', $request->user()->id)->first();
        $studentId = $student?->id ?? 0;

        $sessionType = strtoupper($request->query('session_type', ''));

        $query = ExamSeating::with(['exam.module', 'exam.session', 'room'])
            ->where('student_id', $studentId)
            ->whereHas('exam.session', fn ($q) => $q->where('academic_year_id', AcademicContext::yearId()))
            ->where(fn ($q) => $q->whereNotNull('sent_at')->orWhereIn('status', ['sent', 'present', 'absent', 'late']));

        if ($sessionType === 'RATTRAPAGE') {
            $query->whereHas('exam.session', fn ($q) => $q->whereIn('type', ['rattrapage', 'resit']));
        } elseif (in_array($sessionType, ['ORDINAIRE', 'NORMALE'], true)) {
            $query->whereHas('exam.session', fn ($q) => $q->whereIn('type', ['normal', 'normale', 'ordinaire']));
        }

        $seatings = $query->get();

        $seatings = $seatings->sortBy(function ($s) {
            return ($s->exam?->exam_date ? Carbon::parse($s->exam->exam_date)->format('Ymd') : '99999999').'_'.($s->exam?->start_time ?? '00:00');
        });

        $convocations = $seatings->map(function ($s) {
            $exam = $s->exam;

            return [
                'id' => $s->id,
                'module' => $exam->module->name ?? 'N/A',
                'code' => $exam->module->code ?? 'MOD-'.$exam->id,
                'date' => $exam->exam_date ? Carbon::parse($exam->exam_date)->format('d/m/Y') : 'À déterminer',
                'time' => $exam->start_time ? substr($exam->start_time, 0, 5) : '09:00',
                'duration' => ($exam->duration_minutes ?? 120).' min',
                'room' => $s->room->name ?? 'N/A',
                'seat' => 'Table N° '.ExamConvocationService::seatNumberFor($s),
                'status' => 'Publiée',
                'qrToken' => $s->qr_token,
            ];
        });

        return response()->json([
            'success' => true,
            'convocations' => $convocations,
        ]);
    }

    /**
     * Télécharger une convocation en PDF.
     */
    public function download(int $id, Request $request)
    {
        $student = Student::where('user_id', $request->user()->id)->firstOrFail();
        $seat = ExamSeating::whereKey($id)->where('student_id', $student->id)->firstOrFail();
        abort_unless($seat->sent_at || in_array($seat->status, ['sent', 'present', 'absent', 'late']), 404, 'Convocation non diffusée.');

        return app(PdfExportController::class)->studentConvocationPdf($seat->id);
    }

    /**
     * Wallet Pass (simulation).
     */
    public function walletPass(int $id, Request $request): JsonResponse
    {
        $student = Student::where('user_id', $request->user()->id)->first();
        abort_unless($student, 403, 'Profil étudiant introuvable.');

        ExamSeating::with(['exam.module', 'room'])
            ->where('id', $id)
            ->where('student_id', $student->id)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'message' => 'Pass généré.',
            'pass_url' => url("/api/v1/student-portal/convocations/{$id}/download"),
        ]);
    }

    /**
     * Déclarer une absence.
     */
    public function declareAbsence(int $id, Request $request): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string',
            'certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        $student = Student::where('user_id', $request->user()->id)->first();
        abort_unless($student, 403, 'Profil étudiant introuvable.');

        $seating = ExamSeating::where('id', $id)
            ->where('student_id', $student->id)
            ->firstOrFail();

        $path = $request->hasFile('certificate')
            ? $request->file('certificate')->store('exam-absence-justifications', 'private')
            : null;

        ExamIncident::create([
            'exam_id' => $seating->exam_id,
            'student_id' => $seating->student_id,
            'type' => 'absence_declaree',
            'description' => $request->input('reason'),
            'attachment_path' => $path,
            'reported_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Absence déclarée pour vérification par la scolarité; aucun statut de présence modifié.',
        ]);
    }
}
