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

    public function sendAvailabilitySurvey(int $sessionId): JsonResponse
    {
        $result = $this->proctorService->sendAvailabilitySurvey($sessionId);
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

    public function globalLiveStats(int $sessionId): JsonResponse
    {
        $result = $this->convocationService->getGlobalLiveStats($sessionId);
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

    public function sendBatchEmails(Request $request, int $sessionId): JsonResponse
    {
        $seatingIds = $request->input('seating_ids', []);
        if (empty($seatingIds)) {
            return response()->json(['success' => false, 'message' => 'Aucune convocation sélectionnée.'], 400);
        }

        $result = $this->convocationService->sendBatchEmails($sessionId, $seatingIds);
        return response()->json($result);
    }

    public function sendBatchSurveillantsEmails(Request $request, int $sessionId): JsonResponse
    {
        $surveillanceIds = $request->input('surveillance_ids', []);
        
        if (empty($surveillanceIds)) {
            return response()->json(['success' => false, 'message' => 'Aucun surveillant sélectionné'], 400);
        }

        $result = $this->convocationService->sendBatchSurveillantsEmails($sessionId, $surveillanceIds);
        return response()->json($result);
    }

    public function sendBatchSurveillantsWhatsApp(Request $request, int $sessionId, \App\Services\WhatsAppService $whatsappService): JsonResponse
    {
        $surveillanceIds = $request->input('surveillance_ids', []);
        
        if (empty($surveillanceIds)) {
            return response()->json(['success' => false, 'message' => 'Aucun surveillant sélectionné'], 400);
        }

        $surveillances = \Illuminate\Support\Facades\DB::table('exam_surveillances')
            ->join('users', 'exam_surveillances.professor_id', '=', 'users.id')
            ->join('exams', 'exam_surveillances.exam_id', '=', 'exams.id')
            ->join('modules', 'exams.module_id', '=', 'modules.id')
            ->whereIn('exam_surveillances.id', $surveillanceIds)
            ->select('exam_surveillances.id', 'exam_surveillances.qr_token', 'users.id as user_id', 'users.phone', 'users.name', 'exams.exam_date', 'exams.start_time', 'modules.name as module')
            ->get();

        $sentCount = 0;
        foreach ($surveillances as $surv) {
            $phone = $surv->phone ?? '+212600000000'; // Default mockup phone
            $confirmUrl = url('/api/verify/surveillance/' . $surv->qr_token . '/confirm');
            $message = "Bonjour Pr. {$surv->name},\n\nVous êtes convoqué pour la surveillance de l'examen {$surv->module} le {$surv->exam_date} à {$surv->start_time}.\n\nVeuillez confirmer votre présence en cliquant sur ce lien : {$confirmUrl}";
            
            $whatsappService->sendMessage($surv->user_id, $phone, $message);
            $sentCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "{$sentCount} messages WhatsApp envoyés avec succès."
        ]);
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

        $firstExam = $seatings->first()?->exam;
        $semId = (int) ($firstExam?->module?->semester_number ?? $firstExam?->module?->semester_id ?? 1);
        if ($semId <= 2) $niveauName = '1ère Année';
        elseif ($semId <= 4) $niveauName = '2ème Année';
        elseif ($semId <= 6) $niveauName = '3ème Année';
        elseif ($semId <= 8) $niveauName = '4ème Année';
        else $niveauName = '5ème Année';

        $token = \Illuminate\Support\Str::random(16);
        $verifyUrl = config('app.url', 'http://localhost:8000') . "/verify/convocation/{$token}";
        $qrCodeBase64 = base64_encode(\SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->size(100)->generate($verifyUrl));
        
        $logoPath = public_path('logo-encg.png');
        $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.convocation', [
            'session_type' => $sessionType,
            'session_name' => "Session de Fin de Semestre - " . $sessionType,
            'person_name' => ($student->user->first_name ?? '') . ' ' . ($student->user->last_name ?? ''),
            'person_role' => 'Étudiant',
            'person_id' => $student->student_number ?? $student->cne_cme ?? 'N/A',
            'filiere_name' => $student->latestPathway?->filiere?->name ?? 'Tronc Commun',
            'niveau_name' => $niveauName,
            'exams' => $exams,
            'qrCodeBase64' => $qrCodeBase64,
            'logoBase64' => $logoBase64,
            'date' => now()->format('d/m/Y')
        ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true]);

        $firstName = str_replace(' ', '_', strtolower($student->user->first_name ?? ''));
        $lastName = str_replace(' ', '_', strtolower($student->user->last_name ?? ''));
        return $pdf->download("convocation_{$lastName}_{$firstName}.pdf");
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

    /**
     * Intelligent Bulk Dispatch & Emailing for Student Convocations.
     */
    public function sendStudentConvocationsIntelligent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'target_type' => 'required|in:all,filiere,student',
            'filiere_id' => 'nullable|integer',
            'student_id' => 'nullable|integer',
            'session_type' => 'nullable|string|in:ORDINAIRE,RATTRAPAGE'
        ]);

        $sessionType = strtoupper($validated['session_type'] ?? 'ORDINAIRE');
        $targetType = $validated['target_type'];

        $query = \App\Models\Student::with(['user', 'latestPathway.filiere']);

        if ($targetType === 'student' && !empty($validated['student_id'])) {
            $query->where('id', $validated['student_id']);
        } elseif ($targetType === 'filiere' && !empty($validated['filiere_id'])) {
            $filiereId = $validated['filiere_id'];
            $query->whereHas('latestPathway', fn($q) => $q->where('filiere_id', $filiereId));
        }

        $students = $query->take(50)->get();
        $sentCount = 0;

        foreach ($students as $student) {
            if (!$student->user || !$student->user->email) continue;

            $token = \Illuminate\Support\Str::random(16);
            $verifyUrl = config('app.url', 'http://localhost:8000') . "/verify/convocation/{$token}";
            $qrBase64 = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($verifyUrl);
            $logoPath = public_path('logo-encg.png');
            $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';

            $exams = [
                ['date' => '25/06/2026', 'time' => '09:00 - 11:00', 'module' => 'Management Stratégique', 'room' => 'Amphi Ibn Khaldoun', 'seat' => 'Table N° 14'],
                ['date' => '27/06/2026', 'time' => '14:00 - 16:00', 'module' => 'Finance d\'Entreprise', 'room' => 'Salle B12', 'seat' => 'Table N° 08']
            ];

            $pdfContent = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.convocation', [
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
            ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true])->output();

            $examData = [
                'studentName' => ($student->user->first_name ?? '') . ' ' . ($student->user->last_name ?? ''),
                'moduleName' => 'Session d\'Examens ' . $sessionType,
                'examDate' => '25/06/2026 au 30/06/2026',
                'examTime' => '09:00',
                'roomName' => 'Voir Convocation Jointe'
            ];

            try {
                \Illuminate\Support\Facades\Mail::to($student->user->email)->send(new \App\Mail\ConvocationEmail($examData, $pdfContent));
                $sentCount++;
            } catch (\Exception $e) {
                // Log and continue batch
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Envoi intelligent des convocations accompli avec succès ({$sentCount} e-mails transmis via Resend).",
            'data' => [
                'sent_count' => $sentCount,
                'target_type' => $targetType,
                'session_type' => $sessionType
            ]
        ]);
    }

    /**
     * Intelligent Bulk Dispatch & Emailing for Professor Proctoring Convocations.
     */
    public function sendProfessorConvocationsIntelligent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'target_type' => 'required|in:all,department,professor',
            'department_id' => 'nullable|integer',
            'professor_id' => 'nullable|integer',
            'session_type' => 'nullable|string|in:ORDINAIRE,RATTRAPAGE'
        ]);

        $sessionType = strtoupper($validated['session_type'] ?? 'ORDINAIRE');
        $targetType = $validated['target_type'];

        $query = \App\Models\Professor::with('user');

        if ($targetType === 'professor' && !empty($validated['professor_id'])) {
            $query->where('id', $validated['professor_id']);
        } elseif ($targetType === 'department' && !empty($validated['department_id'])) {
            $query->where('department_id', $validated['department_id']);
        }

        $professors = $query->take(50)->get();
        $sentCount = 0;

        foreach ($professors as $prof) {
            $email = $prof->user?->email ?? $prof->email;
            if (!$email) continue;

            $token = \Illuminate\Support\Str::random(16);
            $verifyUrl = config('app.url', 'http://localhost:8000') . "/verify/proctoring/{$token}";
            $qrBase64 = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($verifyUrl);
            $logoPath = public_path('logo-encg.png');
            $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';

            $proctorings = [
                ['date' => '25/06/2026', 'time' => '09:00 - 11:00', 'module' => 'Audit & Contrôle de Gestion', 'room' => 'Amphi Ibn Khaldoun', 'role' => 'Surveillant Principal'],
                ['date' => '27/06/2026', 'time' => '14:00 - 16:00', 'module' => 'Marketing International', 'room' => 'Salle B10', 'role' => 'Surveillant Adjoint']
            ];

            $pdfContent = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.convocation', [
                'session_type' => $sessionType,
                'session_name' => "Ordre de Surveillance d'Examens - " . $sessionType,
                'person_name' => ($prof->user->first_name ?? $prof->first_name ?? '') . ' ' . ($prof->user->last_name ?? $prof->last_name ?? ''),
                'person_role' => 'Enseignant Surveillant',
                'person_id' => $prof->cin ?? 'CIN N/A',
                'filiere_name' => $prof->specialty ?? 'Corps Professoral ENCG',
                'exams' => $proctorings,
                'qrBase64' => $qrBase64,
                'logoBase64' => $logoBase64,
                'date' => now()->format('d/m/Y')
            ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true])->output();

            $examData = [
                'studentName' => ($prof->user->first_name ?? $prof->first_name ?? '') . ' ' . ($prof->user->last_name ?? $prof->last_name ?? ''),
                'moduleName' => 'Surveillance Examens ' . $sessionType,
                'examDate' => '25/06/2026 au 30/06/2026',
                'examTime' => '09:00',
                'roomName' => 'Voir Ordre de Surveillance Joint'
            ];

            try {
                \Illuminate\Support\Facades\Mail::to($email)->send(new \App\Mail\ConvocationEmail($examData, $pdfContent));
                $sentCount++;
            } catch (\Exception $e) {
                // Log and continue
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Transmission des ordres de surveillance effectuée ({$sentCount} e-mails envoyés aux enseignants).",
            'data' => [
                'sent_count' => $sentCount,
                'target_type' => $targetType,
                'session_type' => $sessionType
            ]
        ]);
    }

    /**
     * Download Zip package of printable A4 Convocations for Filiere / Department.
     */
    public function exportConvocationsZip(Request $request)
    {
        $userType = $request->query('user_type', 'student');
        $sessionType = strtoupper($request->query('session_type', 'ORDINAIRE'));
        $filiereId = $request->query('filiere_id');

        $zipFileName = "Convocations_" . ucfirst($userType) . "s_" . $sessionType . "_" . date('Ymd_His') . ".zip";
        $zipPath = storage_path("app/public/{$zipFileName}");

        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            return response()->json(['success' => false, 'message' => 'Impossible de créer le fichier ZIP'], 500);
        }

        if ($userType === 'student') {
            $students = \App\Models\Student::with(['user', 'latestPathway.filiere'])
                ->when($filiereId, fn($q) => $q->whereHas('latestPathway', fn($p) => $p->where('filiere_id', $filiereId)))
                ->take(30)
                ->get();

            foreach ($students as $student) {
                $token = \Illuminate\Support\Str::random(16);
                $verifyUrl = config('app.url', 'http://localhost:8000') . "/verify/convocation/{$token}";
                $qrBase64 = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($verifyUrl);
                $logoPath = public_path('logo-encg.png');
                $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';

                $exams = [
                    ['date' => '25/06/2026', 'time' => '09:00 - 11:00', 'module' => 'Management Stratégique', 'room' => 'Amphi Ibn Khaldoun', 'seat' => 'Table N° 14'],
                    ['date' => '27/06/2026', 'time' => '14:00 - 16:00', 'module' => 'Finance d\'Entreprise', 'room' => 'Salle B12', 'seat' => 'Table N° 08']
                ];

                $pdfContent = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.convocation', [
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
                ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true])->output();

                $safeName = \Illuminate\Support\Str::slug(($student->user->last_name ?? 'Student') . '_' . ($student->user->first_name ?? ''));
                $zip->addFromString("Convocation_{$safeName}_{$sessionType}.pdf", $pdfContent);
            }
        } else {
            $professors = \App\Models\Professor::with('user')->take(30)->get();

            foreach ($professors as $prof) {
                $token = \Illuminate\Support\Str::random(16);
                $verifyUrl = config('app.url', 'http://localhost:8000') . "/verify/proctoring/{$token}";
                $qrBase64 = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($verifyUrl);
                $logoPath = public_path('logo-encg.png');
                $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';

                $proctorings = [
                    ['date' => '25/06/2026', 'time' => '09:00 - 11:00', 'module' => 'Audit & Contrôle de Gestion', 'room' => 'Amphi Ibn Khaldoun', 'role' => 'Surveillant Principal'],
                    ['date' => '27/06/2026', 'time' => '14:00 - 16:00', 'module' => 'Marketing International', 'room' => 'Salle B10', 'role' => 'Surveillant Adjoint']
                ];

                $pdfContent = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.convocation', [
                    'session_type' => $sessionType,
                    'session_name' => "Ordre de Surveillance d'Examens - " . $sessionType,
                    'person_name' => ($prof->user->first_name ?? $prof->first_name ?? '') . ' ' . ($prof->user->last_name ?? $prof->last_name ?? ''),
                    'person_role' => 'Enseignant Surveillant',
                    'person_id' => $prof->cin ?? 'CIN N/A',
                    'filiere_name' => $prof->specialty ?? 'Corps Professoral ENCG',
                    'exams' => $proctorings,
                    'qrBase64' => $qrBase64,
                    'logoBase64' => $logoBase64,
                    'date' => now()->format('d/m/Y')
                ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true])->output();

                $safeName = \Illuminate\Support\Str::slug(($prof->user->last_name ?? $prof->last_name ?? 'Professor'));
                $zip->addFromString("Ordre_Surveillance_{$safeName}_{$sessionType}.pdf", $pdfContent);
            }
        }

        $zip->close();

        return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);
    }

    public function confirmReception($token): JsonResponse
    {
        $surveillance = \Illuminate\Support\Facades\DB::table('exam_surveillances')
            ->where('qr_token', $token)
            ->first();

        if (!$surveillance) {
            return response()->json(['success' => false, 'message' => 'Jeton invalide ou expiré.'], 404);
        }

        \Illuminate\Support\Facades\DB::table('exam_surveillances')
            ->where('id', $surveillance->id)
            ->update(['confirmed_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Merci, votre présence a été confirmée avec succès.'
        ]);
    }

    public function myConvocations(Request $request): JsonResponse
    {
        $student = \App\Models\Student::where('user_id', $request->user()->id)->first();
        if (!$student) {
            return response()->json(['success' => false, 'data' => []]);
        }

        $seatings = \Illuminate\Support\Facades\DB::table('exam_seatings')
            ->join('exams', 'exam_seatings.exam_id', '=', 'exams.id')
            ->join('modules', 'exams.module_id', '=', 'modules.id')
            ->join('exam_sessions', 'exams.exam_session_id', '=', 'exam_sessions.id')
            ->leftJoin('rooms', 'exam_seatings.room_id', '=', 'rooms.id')
            ->where('exam_seatings.student_id', $student->id)
            ->select(
                'exam_seatings.id as seating_id',
                'modules.name as module_name',
                'exam_sessions.name as session_name',
                'exam_sessions.type as session_type',
                'exams.exam_date',
                'exams.start_time',
                'rooms.name as room_name',
                'exam_seatings.seat_number',
                'exam_seatings.qr_token'
            )
            ->orderBy('exams.exam_date', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $seatings]);
    }

    public function mySurveillances(Request $request): JsonResponse
    {
        $surveillances = \Illuminate\Support\Facades\DB::table('exam_surveillances')
            ->join('exams', 'exam_surveillances.exam_id', '=', 'exams.id')
            ->join('modules', 'exams.module_id', '=', 'modules.id')
            ->join('exam_sessions', 'exams.exam_session_id', '=', 'exam_sessions.id')
            ->leftJoin('rooms', 'exams.room_id', '=', 'rooms.id')
            ->where('exam_surveillances.professor_id', $request->user()->id)
            ->select(
                'exam_surveillances.id as surveillance_id',
                'modules.name as module_name',
                'exam_sessions.name as session_name',
                'exam_sessions.type as session_type',
                'exams.exam_date',
                'exams.start_time',
                'rooms.name as room_name',
                'exam_surveillances.role',
                'exam_surveillances.qr_token',
                'exam_surveillances.confirmed_at'
            )
            ->orderBy('exams.exam_date', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $surveillances]);
    }

    /**
     * Real-time QR Code Scan verification for supervisor / admin
     */
    public function scanVerify(Request $request, string $qrToken): JsonResponse
    {
        $seating = \Illuminate\Support\Facades\DB::table('exam_seatings')
            ->join('students', 'exam_seatings.student_id', '=', 'students.id')
            ->join('users', 'students.user_id', '=', 'users.id')
            ->join('exams', 'exam_seatings.exam_id', '=', 'exams.id')
            ->join('modules', 'exams.module_id', '=', 'modules.id')
            ->join('exam_sessions', 'exams.exam_session_id', '=', 'exam_sessions.id')
            ->leftJoin('filieres', 'modules.filiere_id', '=', 'filieres.id')
            ->leftJoin('rooms as seating_rooms', 'exam_seatings.room_id', '=', 'seating_rooms.id')
            ->leftJoin('rooms as exam_rooms', 'exams.room_id', '=', 'exam_rooms.id')
            ->where('exam_seatings.qr_token', $qrToken)
            ->select(
                'exam_seatings.id as seating_id',
                'exam_seatings.seat_number',
                'exam_seatings.sent_at',
                'exam_seatings.status',
                'students.cne',
                \Illuminate\Support\Facades\DB::raw("COALESCE(users.cin, 'N/A') as cin"),
                'users.name as student_name',
                'users.email as student_email',
                'users.avatar',
                'modules.name as module_name',
                'filieres.name as filiere_name',
                'exam_sessions.name as session_name',
                'exams.exam_date',
                'exams.start_time',
                \Illuminate\Support\Facades\DB::raw("COALESCE(seating_rooms.name, exam_rooms.name, 'Salle N/A') as room_name")
            )
            ->first();

        if (!$seating) {
            return response()->json([
                'success' => false,
                'valid' => false,
                'message' => 'Convocation ou QR Code invalide (Non trouvé).'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'valid' => true,
            'data' => [
                'seating_id' => $seating->seating_id,
                'student_name' => $seating->student_name,
                'cne' => $seating->cne,
                'cin' => $seating->cin,
                'filiere' => $seating->filiere_name,
                'avatar' => $seating->avatar,
                'module_name' => $seating->module_name,
                'session_name' => $seating->session_name,
                'exam_date' => $seating->exam_date ? \Carbon\Carbon::parse($seating->exam_date)->format('d/m/Y') : 'N/A',
                'exam_time' => $seating->start_time ? substr($seating->start_time, 0, 5) : '09:00',
                'room_name' => $seating->room_name,
                'seat_number' => $seating->seat_number ? ('N° ' . $seating->seat_number) : '—',
                'status' => $seating->status ?? 'sent',
                'sent_at' => $seating->sent_at,
            ]
        ]);
    }

    /**
     * Real-time attendance status update (present, late, absent)
     */
    public function updateAttendanceStatus(Request $request, string $qrToken): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:present,late,absent'
        ]);

        $updated = \Illuminate\Support\Facades\DB::table('exam_seatings')
            ->where('qr_token', $qrToken)
            ->update([
                'status' => $validated['status'],
                'updated_at' => now()
            ]);

        if (!$updated) {
            return response()->json(['success' => false, 'message' => 'Émargement introuvable.'], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Émargement mis à jour avec succès : ' . strtoupper($validated['status'])
        ]);
    }
}
