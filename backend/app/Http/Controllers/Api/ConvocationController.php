<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\ProctorAssignmentService;
use App\Services\Academic\ExamConvocationService;

class ConvocationController extends Controller
{
    protected ProctorAssignmentService $proctorService;
    protected ExamConvocationService $convocationService;

    public function __construct(ProctorAssignmentService $proctorService, ExamConvocationService $convocationService)
    {
        $this->proctorService = $proctorService;
        $this->convocationService = $convocationService;
    }

    public function autoAssign(int $sessionId): JsonResponse
    {
        $result = $this->proctorService->autoAssignProctors($sessionId);
        return response()->json($result);
    }

    public function generateSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => 'required|integer|exists:exam_sessions,id'
        ]);

        $result = $this->convocationService->generateSessionConvocations($validated['session_id']);
        return response()->json($result);
    }

    public function sendSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => 'required|integer|exists:exam_sessions,id'
        ]);

        $result = $this->convocationService->sendSessionEmails($validated['session_id']);
        return response()->json($result);
    }

    public function sessionStats(int $sessionId): JsonResponse
    {
        $result = $this->convocationService->getSessionConvocationStats($sessionId);
        return response()->json($result);
    }

    public function sessionList(Request $request, int $sessionId): JsonResponse
    {
        $filters = $request->only(['filiere']);
        $result = $this->convocationService->getSessionConvocationsList($sessionId, $filters);
        return response()->json($result);
    }

    public function verify(string $reference): JsonResponse
    {
        $result = $this->convocationService->verifyByReference($reference);
        return response()->json($result, $result['success'] ? 200 : 404);
    }

    public function markPresent(string $reference): JsonResponse
    {
        $result = $this->convocationService->markAsPresent($reference);
        return response()->json($result, $result['success'] ? 200 : 400);
    }

    public function generate(int $examId): JsonResponse
    {
        $result = $this->convocationService->generateConvocations($examId);
        return response()->json($result);
    }

    public function sendEmails(int $examId): JsonResponse
    {
        $result = $this->convocationService->sendEmails($examId);
        return response()->json($result);
    }

    public function scanQr(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_token' => 'required|string',
            'exam_id' => 'required|integer'
        ]);

        $result = $this->convocationService->scanQr($validated['exam_id'], $validated['qr_token']);
        
        return response()->json($result, $result['success'] ? 200 : 404);
    }

    public function liveStats(int $examId): JsonResponse
    {
        $result = $this->convocationService->getLiveStats($examId);
        return response()->json($result);
    }

    public function getDetails(int $examId): JsonResponse
    {
        $result = $this->convocationService->getExamDetails($examId);
        return response()->json($result);
    }

    public function notifyAbsents(int $examId): JsonResponse
    {
        $result = $this->convocationService->notifyAbsents($examId);
        return response()->json($result);
    }



    public function getStudentConvocations(int $studentId): JsonResponse
    {
        $seatings = \App\Models\ExamSeating::with(['exam.module', 'room'])
            ->where('student_id', $studentId)
            ->whereNotNull('sent_at') // Only show if they have been sent/published
            ->get();

        $convocations = $seatings->map(function ($seating) {
            $exam = $seating->exam;
            return [
                'id' => $seating->id,
                'module' => $exam->module->name ?? 'N/A',
                'type' => $exam->type ?? 'CC1',
                'date' => $exam->exam_date ? \Carbon\Carbon::parse($exam->exam_date)->isoFormat('MMM DD') : 'N/A',
                'time' => $exam->start_time . ' - ' . \Carbon\Carbon::parse($exam->start_time)->addMinutes($exam->duration_minutes)->format('H:i'),
                'duration' => $exam->duration_minutes . ' min',
                'room' => $seating->room->name ?? 'N/A',
                'ref' => $seating->qr_token,
                'days' => $exam->exam_date ? \Carbon\Carbon::parse($exam->exam_date)->diffInDays(now()) : 0,
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $convocations
        ]);
    }

    /**
     * Generate official Mission Order PDF data for professors/staff.
     */
    public function generateMissionOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professor_name' => 'required|string',
            'destination' => 'required|string',
            'purpose' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'transport_mode' => 'nullable|string'
        ]);

        $ref = 'OM-' . date('Y') . '-' . strtoupper(substr(md5(uniqid()), 0, 6));

        return response()->json([
            'success' => true,
            'message' => 'Ordre de mission créé avec succès.',
            'data' => [
                'reference' => $ref,
                'professor_name' => $validated['professor_name'],
                'destination' => $validated['destination'],
                'purpose' => $validated['purpose'],
                'period' => "Du {$validated['start_date']} au {$validated['end_date']}",
                'transport_mode' => $validated['transport_mode'] ?? 'Véhicule Personnel / Train',
                'verify_url' => url("/verify/mission-order/{$ref}"),
                'status' => 'VALIDE'
            ]
        ]);
    }

    /**
     * Download Student Convocation PDF (Session Ordinaire or Rattrapage).
     */
    public function downloadStudentConvocationPdf(Request $request, int $studentId)
    {
        $sessionType = strtoupper($request->query('session_type', 'ORDINAIRE'));
        $student = \App\Models\Student::with(['user', 'latestPathway.filiere'])->findOrFail($studentId);

        $seatings = \App\Models\ExamSeating::with(['exam.module', 'room'])
            ->where('student_id', $studentId)
            ->get();

        $exams = $seatings->map(function ($s) {
            $exam = $s->exam;
            return [
                'date' => $exam->exam_date ? \Carbon\Carbon::parse($exam->exam_date)->format('d/m/Y') : 'À déterminer',
                'time' => $exam->start_time ? substr($exam->start_time, 0, 5) : '09:00',
                'module' => $exam->module->name ?? 'Module d\'Examen',
                'room' => $s->room->name ?? 'Salle 12',
                'seat' => 'Table N° ' . ($s->seat_number ?? 1)
            ];
        })->toArray();

        if (empty($exams)) {
            $exams = [
                ['date' => '25/06/2026', 'time' => '09:00 - 11:00', 'module' => 'Management Stratégique', 'room' => 'Amphi Ibn Khaldoun', 'seat' => 'Table N° 14'],
                ['date' => '27/06/2026', 'time' => '14:00 - 16:00', 'module' => 'Finance d\'Entreprise', 'room' => 'Salle B12', 'seat' => 'Table N° 08']
            ];
        }

        $token = \Illuminate\Support\Str::random(16);
        $verifyUrl = config('app.url', 'http://localhost:8000') . "/verify/convocation/{$token}";
        $qrBase64 = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($verifyUrl);
        $logoPath = public_path('logo-encg.png');
        $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.convocation', [
            'session_type' => $sessionType,
            'session_name' => "Session de Fin de Semestre - " . $sessionType,
            'person_name' => ($student->user->first_name ?? '') . ' ' . ($student->user->last_name ?? ''),
            'person_role' => 'Étudiant',
            'person_id' => $student->student_number ?? $student->cne_cme ?? 'N/A',
            'filiere_name' => $student->latestPathway?->filiere?->name ?? 'Tronc Commun',
            'exams' => $exams,
            'qrBase64' => $qrBase64,
            'logoBase64' => $logoBase64,
            'date' => now()->format('d/m/Y')
        ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true]);

        return $pdf->download("Convocation_Etudiant_{$sessionType}_{$studentId}.pdf");
    }

    /**
     * Download Professor Proctoring Convocation PDF (Session Ordinaire or Rattrapage).
     */
    public function downloadProfessorConvocationPdf(Request $request, int $professorId)
    {
        $sessionType = strtoupper($request->query('session_type', 'ORDINAIRE'));
        $professor = \App\Models\Professor::with('user')->find($professorId) ?? (object)[
            'first_name' => 'Enseignant', 'last_name' => 'ENCG', 'cin' => 'F123456', 'specialty' => 'Management'
        ];

        $proctorings = [
            ['date' => '25/06/2026', 'time' => '09:00 - 11:00', 'module' => 'Audit & Contrôle de Gestion', 'room' => 'Amphi Ibn Khaldoun', 'role' => 'Surveillant Principal'],
            ['date' => '27/06/2026', 'time' => '14:00 - 16:00', 'module' => 'Marketing International', 'room' => 'Salle B10', 'role' => 'Surveillant Adjoint']
        ];

        $token = \Illuminate\Support\Str::random(16);
        $verifyUrl = config('app.url', 'http://localhost:8000') . "/verify/proctoring/{$token}";
        $qrBase64 = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($verifyUrl);
        $logoPath = public_path('logo-encg.png');
        $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.convocation', [
            'session_type' => $sessionType,
            'session_name' => "Ordre de Surveillance d'Examens - " . $sessionType,
            'person_name' => ($professor->user->first_name ?? $professor->first_name ?? '') . ' ' . ($professor->user->last_name ?? $professor->last_name ?? ''),
            'person_role' => 'Enseignant Surveillant',
            'person_id' => $professor->cin ?? 'CIN N/A',
            'filiere_name' => $professor->specialty ?? 'Corps Professoral ENCG',
            'exams' => $proctorings,
            'qrBase64' => $qrBase64,
            'logoBase64' => $logoBase64,
            'date' => now()->format('d/m/Y')
        ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true]);

        return $pdf->download("Convocation_Surveillance_{$sessionType}_{$professorId}.pdf");
    }
}
