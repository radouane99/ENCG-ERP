<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Exam;
use App\Models\ExamIncident;
use App\Models\ExamSeating;
use App\Models\ExamSession;
use App\Models\ExamSurveillance;
use App\Models\Filiere;
use App\Models\Grade;
use App\Models\Group;
use App\Models\Module;
use App\Models\ModuleProfessor;
use App\Models\ModulePvSignature;
use App\Models\Professor;
use App\Models\ResitEligibility;
use App\Models\Room;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Models\StudentRegistration;
use App\Models\User;
use App\Services\Academic\DeliberationService;
use App\Services\Academic\GradeService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class PdfExportController extends Controller
{
    public function __construct(
        private DeliberationService $deliberationService,
        private GradeService $gradeService
    ) {}

    /**
     * Retourne une instance PDF préconfigurée avec logo et QR code.
     */
    private function getPdfInstance(string $view, array $data = []): \Barryvdh\DomPDF\PDF
    {
        $logoPath = public_path('logo-encg.png');
        $data['logoBase64'] = file_exists($logoPath)
            ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
            : '';

        if (!isset($data['verifyUrl'])) {
            $data['verifyUrl'] = url('/verify/document/' . Str::random(10));
        }

        try {
            $qrSvg = QrCode::size(150)->margin(0)->generate($data['verifyUrl']);
            $data['qrBase64'] = 'data:image/svg+xml;base64,' . base64_encode($qrSvg);
        } catch (\Exception $e) {
            $data['qrBase64'] = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($data['verifyUrl']);
        }

        return Pdf::setOption([
            'isRemoteEnabled' => true,
            'chroot' => public_path(),
        ])->loadView($view, $data);
    }

    // ─── RÉCÉPISSÉ TAFEM ────────────────────────────────────────

    public function exportRecepisseTafemPdf(Request $request)
    {
        $cne = strtoupper(trim($request->query('cne', '')));
        $cin = strtoupper(trim($request->query('cin', '')));

        $candidate = null;

        if (!empty($cne) || !empty($cin)) {
            $candidate = Application::where(function ($q) use ($cne, $cin) {
                if (!empty($cne)) $q->where('cne', $cne);
                if (!empty($cin)) $q->orWhere('cin', $cin);
            })->first();

            if (!$candidate) {
                $std = Student::with(['user', 'pathways.filiere'])
                    ->where(function ($q) use ($cne, $cin) {
                        if (!empty($cne)) $q->where('cne', $cne);
                        if (!empty($cin)) $q->orWhereHas('user', fn($u) => $u->where('cin', $cin));
                    })->first();

                if ($std) {
                    $candidate = (object) [
                        'first_name'      => $std->user->name ?? '',
                        'last_name'       => '',
                        'cne'             => $std->cne,
                        'cin'             => $std->user->cin ?? '',
                        'reference_number' => $std->pathways->first()?->filiere?->name ?? 'Deux années préparatoires',
                        'status'          => 'accepted',
                        'selection_score' => 150.00,
                    ];
                }
            }
        }

        if (!$candidate) {
            $candidate = (object) [
                'first_name'       => 'Candidat',
                'last_name'        => 'ENCG Fès',
                'cne'              => !empty($cne) ? $cne : 'N142088916',
                'cin'              => !empty($cin) ? $cin : 'CD72910',
                'reference_number' => 'Deux années préparatoires (TAFEM S1)',
                'status'           => 'en_attente',
                'selection_score'  => 150.00,
            ];
        }

        $qrUrl = url('/public/track-dossier?cne=' . ($candidate->cne ?? $cne));
        $qrBase64 = '';
        if (class_exists(\SimpleSoftwareIO\QrCode\Facades\QrCode::class)) {
            try {
                $qrRaw = \SimpleSoftwareIO\QrCode\Facades\QrCode::format('png')->size(150)->generate($qrUrl);
                $qrBase64 = 'data:image/png;base64,' . base64_encode($qrRaw);
            } catch (\Throwable $e) {}
        }

        $data = [
            'name'        => trim(($candidate->first_name ?? '') . ' ' . ($candidate->last_name ?? '')),
            'cne'         => $candidate->cne ?? $cne,
            'cin'         => $candidate->cin ?? $cin,
            'filiere'     => $candidate->reference_number ?? 'Deux années préparatoires (TAFEM S1)',
            'score'       => number_format($candidate->selection_score ?? 150.00, 2) . ' pts',
            'statusLabel' => 'Admis sur Liste Principale',
            'verifyUrl'   => $qrUrl,
            'qrBase64'    => $qrBase64,
        ];

        $pdf = $this->getPdfInstance('pdf.recepisse_tafem', $data);
        return $pdf->stream("Recepisse_TAFEM_" . ($data['cne']) . ".pdf", ["Attachment" => false]);
    }

    // ─── CONVOCATIONS ÉTUDIANTS ──────────────────────────────────

    public function studentConvocationPdf(int $seatingId)
    {
        $seating = ExamSeating::with(['student.user', 'student.latestPathway.filiere', 'exam.module', 'room', 'exam.examSession'])->findOrFail($seatingId);
        $pdf = $this->generateSingleConvocationPdf($seating);
        $name = ($seating->student->user->last_name ?? 'Etudiant') . '_' . ($seating->student->user->first_name ?? '');
        return $pdf->download("Convocation_{$name}.pdf");
    }

    public function studentConvocationPreview(int $seatingId)
    {
        $seating = ExamSeating::with(['student.user', 'student.latestPathway.filiere', 'exam.module', 'room', 'exam.examSession'])->findOrFail($seatingId);
        $pdf = $this->generateSingleConvocationPdf($seating);
        return $pdf->stream("convocation_preview.pdf", ["Attachment" => false]);
    }

    public function surveillantConvocationPdf(int $surveillanceId)
    {
        $surveillance = ExamSurveillance::findOrFail($surveillanceId);
        $pdf = $this->generateSingleSurveillantConvocationPdf($surveillanceId);
        $prof = User::find($surveillance->professor_id);
        $name = ($prof->last_name ?? 'Professeur') . '_' . ($prof->first_name ?? '');
        return $pdf->download("Convocation_Surveillance_{$name}.pdf");
    }

    public function surveillantConvocationPreview(int $surveillanceId)
    {
        ExamSurveillance::findOrFail($surveillanceId);
        $pdf = $this->generateSingleSurveillantConvocationPdf($surveillanceId);
        return $pdf->stream("convocation_surveillance_preview.pdf", ["Attachment" => false]);
    }

    public function batchPdf(Request $request)
    {
        $seatingIds = $request->input('seating_ids', []);
        if (empty($seatingIds)) {
            return response()->json(['success' => false, 'message' => 'Aucune convocation sélectionnée.'], 400);
        }

        $seatings = ExamSeating::with(['student.user', 'student.latestPathway.filiere', 'exam.module', 'room', 'exam.examSession'])
            ->whereIn('id', $seatingIds)
            ->get();

        $studentsData = [];
        foreach ($seatings->groupBy('student_id') as $studentId => $studentSeatings) {
            $student = $studentSeatings->first()->student;
            $sessionId = $studentSeatings->first()->exam->exam_session_id;

            $allStudentSeatings = ExamSeating::with(['exam.module', 'room'])
                ->where('student_id', $student->id)
                ->whereHas('exam', fn($q) => $q->where('exam_session_id', $sessionId))
                ->get();

            $exams = [];
            foreach ($allStudentSeatings as $s) {
                if ($s->exam) {
                    $profName = $this->getProfessorNameForModule($s->exam->module_id);
                    $exams[] = [
                        'date'       => $s->exam->exam_date?->format('d/m/Y') ?? 'N/A',
                        'time'       => $s->exam->start_time . ' - ' . $s->exam->end_time,
                        'module'     => $s->exam->module->name ?? 'Module N/A',
                        'enseignant' => $profName,
                        'room'       => $s->room->name ?? 'Salle N/A',
                        'seat'       => $s->seat_number ?? 'N/A',
                        'qr_token'   => $s->qr_token,
                    ];
                }
            }

            usort($exams, fn($a, $b) => strcmp($a['date'] . ' ' . $a['time'], $b['date'] . ' ' . $b['time']));

            $studentsData[] = [
                'person_name'  => $student->user->last_name . ' ' . $student->user->first_name,
                'person_id'    => $student->user->cin ?? 'N/A',
                'filiere_name' => $student->latestPathway->filiere->name ?? 'Tronc Commun',
                'session_type' => $studentSeatings->first()->exam->examSession->type ?? 'ORDINAIRE',
                'session_name' => $studentSeatings->first()->exam->examSession->name ?? 'Session Principale',
                'exams'        => $exams,
            ];
        }

        $pdf = $this->getPdfInstance('pdf.convocations_batch', compact('studentsData'));
        return $pdf->download('convocations_lot.pdf');
    }

    public function batchDownloadSurveillantsPdf(Request $request, int $sessionId)
    {
        $surveillanceIds = $request->input('seating_ids', []);
        if (empty($surveillanceIds)) {
            return response()->json(['success' => false, 'message' => 'Aucun surveillant sélectionné.'], 400);
        }

        $session = ExamSession::with(['exams.module', 'exams.room'])->findOrFail($sessionId);
        $examIds = $session->exams->pluck('id');

        $selectedSurveillances = ExamSurveillance::whereIn('exam_id', $examIds)
            ->whereIn('id', $surveillanceIds)
            ->get();

        $profIds = $selectedSurveillances->pluck('professor_id')->unique();
        $allSurveillances = ExamSurveillance::whereIn('exam_id', $examIds)
            ->whereIn('professor_id', $profIds)
            ->get();

        $professors = User::whereIn('id', $profIds)->get();
        $professorsData = [];

        foreach ($professors as $prof) {
            $profSurvs = $allSurveillances->where('professor_id', $prof->id);
            $exams = [];

            foreach ($profSurvs as $s) {
                $exam = $session->exams->firstWhere('id', $s->exam_id);
                if ($exam) {
                    $exams[] = [
                        'date'   => $exam->exam_date?->format('d/m/Y') ?? 'N/A',
                        'time'   => $exam->start_time ? substr($exam->start_time, 0, 5) . ' - ' . date('H:i', strtotime($exam->start_time) + ($exam->duration_minutes * 60)) : 'N/A',
                        'module' => $exam->module->name ?? 'N/A',
                        'room'   => $exam->room->name ?? 'N/A',
                        'role'   => $s->role ?? 'Surveillant',
                    ];
                }
            }

            usort($exams, fn($a, $b) => strcmp($a['date'] . ' ' . $a['time'], $b['date'] . ' ' . $b['time']));

            $token = $profSurvs->first()->qr_token ?? Str::random(16);
            $verifyUrl = url("/api/v1/admin/convocations/verify/{$token}");
            $qrCodeBase64 = base64_encode(QrCode::format('svg')->size(100)->generate($verifyUrl));

            $professorsData[] = [
                'person_name'  => mb_strtoupper($prof->last_name) . ' ' . $prof->first_name,
                'person_id'    => $prof->cin ?? 'N/A',
                'person_role'  => 'Professeur',
                'filiere_name' => 'Corps Professoral ENCG',
                'session_type' => $session->type ?? 'ORDINAIRE',
                'session_name' => $session->name ?? 'Session Principale',
                'exams'        => $exams,
                'qrCodeBase64' => $qrCodeBase64,
            ];
        }

        $pdf = $this->getPdfInstance('pdf.convocations_profs_batch', compact('professorsData'));
        return $pdf->download('convocations_surveillants_lot.pdf');
    }

    // ─── PV EXAMEN ──────────────────────────────────────────────

    public function pvExamen(int $examId)
    {
        $exam = Exam::with(['module.filiere', 'group', 'room', 'examSession'])->findOrFail($examId);

        $seatings = ExamSeating::with(['student.user'])
            ->where('exam_id', $examId)
            ->orderBy('seat_number')
            ->get();

        $surveillances = ExamSurveillance::with('professor')
            ->where('exam_id', $examId)
            ->get();

        $incidents = ExamIncident::with(['student.user'])
            ->where('exam_id', $examId)
            ->get();

        $seal = 'SHA256:ENCG-FES-' . $examId . '-' . strtoupper(substr(md5($examId . ($exam->locked_at ?? now())), 0, 16));

        $mode = request()->query('mode', request()->query('type', 'pv'));
        if (request()->query('emargement') == '1') {
            $mode = 'emargement';
        }

        $pdf = $this->getPdfInstance('pdf.pv_examen', [
            'exam_id'          => $examId,
            'exam'             => $exam,
            'seatings'         => $seatings,
            'surveillances'    => $surveillances,
            'incidents'        => $incidents,
            'mode'             => $mode,
            'total_students'   => $seatings->count(),
            'present_students' => $seatings->where('is_present', true)->count(),
            'absent_students'  => $seatings->where('is_present', false)->count(),
            'seal'             => $seal,
            'generated_at'     => now()->format('d/m/Y H:i'),
        ]);

        return $pdf->stream("PV_Examen_{$examId}.pdf", ["Attachment" => false]);
    }

    // ─── ATTESTATIONS & DOCUMENTS ───────────────────────────────

    public function attestationReussite(int $studentId, string $year)
    {
        $student = Student::with(['latestPathway.filiere'])->findOrFail($studentId);

        $pdf = $this->getPdfInstance('pdf.attestation', [
            'student'   => $student,
            'year'      => $year,
            'verifyUrl' => url('/verify/document/' . ($student->student_number ?? '000')),
        ]);

        return $pdf->download("attestation_{$studentId}_{$year}.pdf");
    }

    public function downloadAttestationInscriptionPdf(Request $request, int $studentId)
    {
        $student = Student::with(['user', 'latestPathway.filiere'])->findOrFail($studentId);

        $photoPath = null;
        $photoDoc = StudentDocument::where('student_id', $studentId)->where('type', 'photo')->first();
        if ($photoDoc?->file_path) {
            $fullPath = storage_path('app/public/' . str_replace('/storage/', '', $photoDoc->file_path));
            if (file_exists($fullPath)) $photoPath = $fullPath;
        }

        $pdf = $this->getPdfInstance('pdf.attestation_inscription', [
            'studentName'  => strtoupper($student->last_name . ' ' . $student->first_name),
            'cne'          => $student->cne ?? 'N/A',
            'cin'          => $student->user->cin ?? 'N/A',
            'birthDate'    => $student->birth_date ?? 'N/A',
            'birthCity'    => $student->birth_city ?? 'N/A',
            'filiereName'  => $student->latestPathway->filiere->name ?? 'Tronc Commun',
            'semester'     => 'Semestre 1',
            'cycle'        => 'Deux années préparatoires',
            'academicYear' => '2026-2027',
            'photoPath'    => $photoPath,
            'verifyUrl'    => url("/verify-attestation?cne={$student->cne}&hash=" . md5($student->cne . 'ENCG')),
        ])->setPaper('a4', 'portrait');

        return $pdf->download("Attestation_Inscription_{$student->cne}.pdf");
    }

    // ─── PV MODULE ──────────────────────────────────────────────

    public function exportModulePvPdf(Request $request, int $moduleId)
    {
        $groupId = $request->query('group_id');
        $academicYearId = $request->query('academic_year_id', 1);
        $session = strtolower($request->query('session', 'normale'));

        $module = Module::with(['assessments', 'filiere'])->findOrFail($moduleId);

        $query = StudentRegistration::query();
        if ($groupId && !in_array($groupId, ['all', 'null', 'undefined', ''], true)) {
            $query->where('group_id', (int) $groupId);
        } else {
            $query->where('filiere_id', $module->filiere_id)->where('academic_year_id', $academicYearId);
        }

        $students = $query->with('student.user')->get()->map(fn($reg) => $reg->student)->filter();

        $normaleAssessments = $module->assessments->filter(function ($a) {
            $t = strtolower((string) $a->type);
            return !str_contains($t, 'ratt') && !str_contains($t, 'resit');
        });
        $rattrapageAssessment = $module->assessments->first(function ($a) {
            $t = strtolower((string) $a->type);
            return str_contains($t, 'ratt') || str_contains($t, 'resit');
        });

        $fraudIds = $this->gradeService->getFraudStudentIds($module);
        $resitStudentIds = ResitEligibility::where('module_id', $moduleId)->pluck('student_id')->toArray();

        $data = $students->map(function ($student) use ($module, $normaleAssessments, $rattrapageAssessment, $fraudIds) {
            $isFraud = in_array($student->id, $fraudIds);
            $studentGrades = Grade::where('student_id', $student->id)->whereIn('assessment_id', $module->assessments->pluck('id'))->get();

            $gradesDetail = [];
            $totalWeight = 0;
            $weightedSum = 0;

            foreach ($normaleAssessments as $a) {
                $grade = $studentGrades->firstWhere('assessment_id', $a->id);
                $val = $grade?->value;
                $isAbsent = $grade?->absent ?? false;

                if ($isFraud && $a->weight >= 50) {
                    $val = 0.0;
                    $isAbsent = false;
                }

                $gradesDetail[$a->id] = ['value' => $val, 'is_absent' => $isAbsent, 'weight' => $a->weight, 'type' => $a->type, 'is_fraud' => ($isFraud && $a->weight >= 50)];

                $calcVal = $isAbsent ? 0 : ($val !== null ? floatval($val) : null);
                if ($calcVal !== null) {
                    $weightedSum += $calcVal * ($a->weight / 100);
                    $totalWeight += $a->weight;
                }
            }

            $moyenneNormale = $totalWeight > 0 ? round($weightedSum * (100 / $totalWeight), 2) : null;
            $decisionNormale = $this->gradeService->determineDecision($moyenneNormale);

            $rGrade = $rattrapageAssessment ? $studentGrades->firstWhere('assessment_id', $rattrapageAssessment->id) : null;
            if (!$rGrade) {
                $rGrade = $studentGrades->first(function ($g) {
                    $t = strtolower((string) ($g->assessment->type ?? ''));
                    return str_contains($t, 'ratt') || str_contains($t, 'resit');
                });
            }
            $moyenneFinale = $moyenneNormale;
            $decisionFinale = $decisionNormale;

            if ($rGrade && in_array($decisionNormale, ['R', 'NV'])) {
                if (!$rGrade->absent && $rGrade->value !== null) {
                    $moyenneRattrapage = $this->gradeService->calculateRattrapageAverage(
                        $student, $normaleAssessments, $rattrapageAssessment
                    );
                    $result = $this->gradeService->determineFinalRattrapageResult($moyenneNormale, $moyenneRattrapage);
                    $moyenneFinale = $result['moyenne_finale'];
                    $decisionFinale = $result['decision_finale'];
                } elseif ($rGrade->absent) {
                    $moyenneFinale = $moyenneNormale;
                    $decisionFinale = 'NV';
                }
            }

            if ($isFraud) {
                $moyenneNormale = 0.00;
                $decisionNormale = 'FRAUDE';
                $moyenneFinale = 0.00;
                $decisionFinale = 'FRAUDE';
            }

            return [
                'student_id'        => $student->id,
                'apogee'            => $student->student_number ?? $student->id,
                'last_name'         => $student->last_name,
                'first_name'        => $student->first_name,
                'grades_detail'     => $gradesDetail,
                'moyenne_normale'   => $moyenneNormale,
                'decision_normale'  => $decisionNormale,
                'rattrapage_note'   => $rGrade?->value,
                'rattrapage_absent' => $rGrade ? (bool) $rGrade->absent : false,
                'moyenne_finale'    => $moyenneFinale,
                'decision_finale'   => $decisionFinale,
                'is_fraud'          => $isFraud,
            ];
        });

        if ($session === 'rattrapage') {
            $data = $data->filter(function ($student) use ($resitStudentIds) {
                return in_array($student['student_id'], $resitStudentIds)
                    || in_array($student['decision_normale'], ['R', 'NV'], true)
                    || !empty($student['rattrapage_absent'])
                    || ($student['rattrapage_note'] !== null && $student['rattrapage_note'] !== '');
            })->values();
        }

        $sigRecord = ModulePvSignature::where('module_id', $moduleId)->with('signer')->latest()->first();
        $signature = $sigRecord ? [
            'signed_by'      => $sigRecord->signer?->name ?? 'Enseignant',
            'signed_at'      => $sigRecord->signed_at?->format('d/m/Y H:i') ?? date('d/m/Y H:i'),
            'digital_seal'   => $sigRecord->digital_seal,
            'ip_address'     => $sigRecord->ip_address ?? 'N/A',
            'signature_data' => $sigRecord->signature_data ?? null,
        ] : null;

        $verifyUrl = url("/verify/pv/{$moduleId}/" . ($groupId ?: 'all'));
        $qrBase64 = $this->generateQrBase64($verifyUrl);

        $perimetreLabel = ($groupId && !in_array($groupId, ['all', 'null', 'undefined', ''], true)) ? "Groupe {$groupId}" : "Module Complet";
        if ($session === 'rattrapage') {
            $perimetreLabel .= " (Session Rattrapage)";
        } elseif ($session === 'totale' || $session === 'complet') {
            $perimetreLabel .= " (Bilan Complet)";
        }

        $pdf = Pdf::setOption(['isRemoteEnabled' => true, 'chroot' => public_path()])
            ->loadView('pdf.module_pv', [
                'module'             => $module,
                'session'            => $session,
                'normaleAssessments' => $normaleAssessments,
                'students'           => $data,
                'signature'          => $signature,
                'logoBase64'         => $this->getLogoBase64(),
                'qrBase64'           => $qrBase64,
                'verifyUrl'          => $verifyUrl,
                'perimetre'          => $perimetreLabel,
                'academicYear'       => '2026/2027',
                'semester'           => 'S' . ($module->semester_number ?? 1),
                'date'               => date('d/m/Y H:i'),
            ])->setPaper('a4', 'landscape');

        return $pdf->download("PV_Deliberation_{$module->code}_{$session}.pdf");
    }

    public function exportRattrapage_PvPdf(Request $request, int $moduleId)
    {
        $module = Module::with(['assessments', 'filiere'])->findOrFail($moduleId);

        $accorded = ResitEligibility::where('module_id', $moduleId)
            ->where('status', 'Accordé')
            ->with('student')
            ->get();

        if ($accorded->isEmpty()) {
            return response()->json(['message' => 'Aucun étudiant accordé pour ce module.'], 404);
        }

        $rattrapageAssessment = $module->assessments->first(fn($a) => str_contains(strtolower($a->type), 'rattrapage'));

        $data = $accorded->map(function ($eligibility) use ($rattrapageAssessment) {
            $student = $eligibility->student;
            if (!$student) return null;

            $rGrade = $rattrapageAssessment
                ? Grade::where('student_id', $student->id)->where('assessment_id', $rattrapageAssessment->id)->first()
                : null;

            $rattrapageVal = $rGrade?->value;
            $rattrapageAbsent = $rGrade ? (bool) $rGrade->absent : false;
            $decisionFinale = $rattrapageAbsent ? 'ABI' : ($rattrapageVal !== null ? (floatval($rattrapageVal) >= 10 ? 'VAR' : 'NV') : 'Non saisi');

            return [
                'student_id'        => $student->id,
                'apogee'            => $student->student_number ?? $student->id,
                'last_name'         => $student->last_name,
                'first_name'        => $student->first_name,
                'raison'            => $eligibility->reason,
                'rattrapage_note'   => $rattrapageVal,
                'rattrapage_absent' => $rattrapageAbsent,
                'decision_finale'   => $decisionFinale,
            ];
        })->filter()->values();

        $verifyUrl = url("/verify/pv-rattrapage/{$moduleId}");
        $qrBase64 = $this->generateQrBase64($verifyUrl);

        $pdf = Pdf::setOption(['isRemoteEnabled' => true, 'chroot' => public_path()])
            ->loadView('pdf.module_pv', [
                'module'             => $module,
                'session'            => 'rattrapage',
                'normaleAssessments' => collect(),
                'students'           => $data,
                'logoBase64'         => $this->getLogoBase64(),
                'qrBase64'           => $qrBase64,
                'verifyUrl'          => $verifyUrl,
                'perimetre'          => 'Session Rattrapage',
                'academicYear'       => '2026/2027',
                'semester'           => 'S' . ($module->semester_number ?? 1),
                'date'               => date('d/m/Y H:i'),
            ])->setPaper('a4', 'landscape');

        return $pdf->download("PV_Rattrapage_{$module->code}.pdf");
    }

    // ─── PV SEMESTRIEL ──────────────────────────────────────────

    public function exportSemesterPvPdf(Request $request)
    {
        $filiereId = (int) $request->input('filiere_id', $request->query('filiere_id', 1));
        $semesterNum = (int) $request->input('semester_number', $request->query('semester_number', 1));
        $type = $request->input('type', $request->query('type', 'semestriel'));
        $isSigned = $request->input('signed', $request->query('signed')) === 'true';

        $filiere = Filiere::find($filiereId) ?? (object) ['name' => 'Tronc Commun ENCG', 'code' => 'ENCG'];
        $academicYear = \App\Models\AcademicYear::where('is_current', true)->first() ?? (object) ['name' => '2026/2027', 'id' => 1];

        if ($type === 'annuel') {
            $yearLevel = (int) $request->input('year_level', $request->query('year_level', 1));
            $annualData = $this->deliberationService->calculateAnnualCompensation($filiereId, $academicYear->id ?? 1, $yearLevel);

            $juries = $this->deliberationService->autoComposeJury($filiereId, $academicYear->id ?? 1, ($yearLevel * 2) - 1, 'annuel');

            $pdf = $this->getPdfInstance('pdf.pv_annuel', [
                'filiere'            => $filiere,
                'yearLevel'          => $yearLevel,
                'academicYear'       => $academicYear,
                'odd_semester_label' => $annualData['odd_semester_label'] ?? 'S1',
                'even_semester_label'=> $annualData['even_semester_label'] ?? 'S2',
                'modules'            => $annualData['modules'] ?? [],
                'students'           => $annualData['students'] ?? [],
                'juries'             => $juries,
                'date'               => date('d/m/Y H:i'),
            ])->setPaper('a3', 'landscape');

            return $pdf->download("PV_Annuel_Master_L{$yearLevel}_ENCG.pdf");
        }

        $gradeController = app(GradeController::class);
        $request->merge(['semester' => $semesterNum, 'filiere_id' => $filiereId]);
        $pvResponse = $gradeController->getSemesterPv($request);
        $pvData = json_decode($pvResponse->getContent(), true);

        $modules = Module::with('assessments')->where('filiere_id', $filiereId)->where('semester_number', $semesterNum)->get();
        if ($modules->isEmpty()) $modules = Module::with('assessments')->take(7)->get();

        $matrix = [];
        foreach ($pvData['students'] ?? [] as $s) {
            $rowModules = [];
            foreach ($modules as $m) {
                $gInfo = $s['module_grades'][$m->id] ?? null;
                $rowModules[$m->id] = ['grade' => $gInfo['note'] ?? 0, 'decision' => $gInfo['decision'] ?? 'NV'];
            }
            $matrix[] = [
                'cne'              => $s['apogee'] ?? 'N/A',
                'student'          => mb_strtoupper($s['last_name'] ?? '') . ' ' . ($s['first_name'] ?? ''),
                'modules'          => $rowModules,
                'semester_average' => $s['moyenne_semestrielle'] ?? 0,
                'decision'         => $s['decision_global'] ?? 'RAT',
            ];
        }

        $juries = $this->deliberationService->autoComposeJury($filiereId, $academicYear->id ?? 1, $semesterNum, 'semestriel');

        foreach ($juries as &$j) {
            $j['status'] = $isSigned ? 'signed' : 'pending';
            $j['signature_data'] = $isSigned ? $this->generateDefaultProfSignature($j['user_name'] ?? 'ADMIN ENCG FÈS') : null;
        }
        unset($j);

        $pdf = $this->getPdfInstance('pdf.pv_semestriel', [
            'filiere'        => $filiere,
            'semesterNumber' => $semesterNum,
            'academicYear'   => $academicYear,
            'modules'        => $modules,
            'matrix'         => $matrix,
            'juries'         => $juries,
            'date'           => date('d/m/Y H:i'),
        ])->setPaper('a3', 'landscape');

        return $pdf->download("PV_Semestriel_S{$semesterNum}_ENCG.pdf");
    }

    // ─── AUTRES PDF ─────────────────────────────────────────────

    public function printSession() { return $this->getPdfInstance('pdf.generic_report', ['title' => 'Convocations Étudiants'])->download('convocations_session.pdf'); }
    public function printProfessors() { return $this->getPdfInstance('pdf.generic_report', ['title' => 'Convocations Surveillants'])->download('convocations_profs.pdf'); }
    public function pvGlobal() { return $this->getPdfInstance('pdf.generic_report', ['title' => 'PV Global'])->download('pv_global.pdf'); }
    public function rapportAbsences() { return $this->getPdfInstance('pdf.generic_report', ['title' => 'Rapport Absences'])->download('rapport_absences.pdf'); }
    public function exportScheduleGroupPdf() { return $this->getPdfInstance('pdf.generic_report', ['title' => 'Emploi du Temps'])->download('schedule_group.pdf'); }
    public function liveAttendancePdf(int $examId) { return $this->getPdfInstance('pdf.generic_report', ['title' => 'Présence Live'])->download("live_attendance_{$examId}.pdf"); }
    public function displayList(int $examId) { return $this->getPdfInstance('pdf.generic_report', ['title' => 'Liste Affichage'])->download("affichage_examen_{$examId}.pdf"); }

    public function releveNotes(int $studentId, ?string $year = null)
    {
        $student = Student::with(['latestPathway.filiere'])->findOrFail($studentId);
        $grades = Grade::with('assessment.module')->where('student_id', $studentId)->get();

        $modules = $grades->groupBy(fn($g) => $g->assessment?->module?->id)->map(fn($g) => [
            'code' => $g->first()->assessment->module->code ?? 'N/A',
            'name' => $g->first()->assessment->module->name ?? 'Module',
            'score' => $g->avg('value'),
            'is_validated' => $g->avg('value') >= 10,
        ]);

        $pdf = $this->getPdfInstance('pdf.releve_notes', [
            'student'   => $student,
            'year'      => $year ?? '2025/2026',
            'modules'   => $modules,
            'avgGrade'  => $grades->avg('value') ?? 0,
            'verifyUrl' => url('/verify/document/' . ($student->student_number ?? '000')),
        ]);

        return $pdf->stream("releve_notes_{$studentId}.pdf");
    }

    public function attendanceSheet(int $examId)
    {
        $exam = Exam::with(['module.filiere', 'group', 'room'])->findOrFail($examId);
        $students = ExamSeating::with('student.user')->where('exam_id', $examId)->orderBy('seat_number')->get();

        $pdf = $this->getPdfInstance('pdf.attendance_sheet', compact('exam', 'students'));
        return $pdf->download("fiche_emargement_{$examId}.pdf");
    }

    public function downloadDoorSignPdf(Request $request, int $examId, ?int $roomId = null)
    {
        $exam = Exam::with(['module.filiere', 'group', 'room'])->findOrFail($examId);
        $room = $roomId ? Room::find($roomId) : $exam->room;

        $seatings = ExamSeating::with('student.user')->where('exam_id', $examId)->orderBy('seat_number')->get();

        $pdf = $this->getPdfInstance('pdf.exam_door_sign', compact('exam', 'room', 'seatings'))->setPaper('a4', 'portrait');
        return $pdf->download("Affiche_Porte_Examen_{$examId}.pdf");
    }

    public function convocationDisciplinePdf(int $incidentId)
    {
        $incident = ExamIncident::with(['exam.module.filiere', 'student.user'])->findOrFail($incidentId);

        $pdf = $this->getPdfInstance('pdf.convocation_discipline', [
            'incident' => $incident,
            'student'  => $incident->student,
            'user'     => $incident->student?->user,
            'exam'     => $incident->exam,
            'module'   => $incident->exam?->module,
            'sealHash' => strtoupper(hash('sha256', "CONVOCATION-DISCIPLINE-{$incident->id}-{$incident->student_id}-ENCG")),
        ])->setPaper('a4', 'portrait');

        return $pdf->stream("Convocation_Conseil_Discipline_{$incident->student->last_name}_{$incidentId}.pdf");
    }

    public function decisionDisciplinePdf(int $incidentId)
    {
        $incident = ExamIncident::with(['exam.module.filiere', 'student.user'])->findOrFail($incidentId);

        $pdf = $this->getPdfInstance('pdf.decision_discipline', [
            'incident' => $incident,
            'student'  => $incident->student,
            'user'     => $incident->student?->user,
            'exam'     => $incident->exam,
            'module'   => $incident->exam?->module,
            'sealHash' => strtoupper(hash('sha256', "DECISION-DISCIPLINE-{$incident->id}-{$incident->student_id}")),
        ])->setPaper('a4', 'portrait');

        return $pdf->stream("Decision_Conseil_Discipline_{$incident->student->last_name}_{$incidentId}.pdf");
    }

    // ─── HELPERS ────────────────────────────────────────────────

    private function generateSingleConvocationPdf(ExamSeating $seating): Pdf
    {
        $student = $seating->student;
        $sessionId = $seating->exam->exam_session_id;

        $allSeatings = ExamSeating::with(['exam.module', 'room'])
            ->where('student_id', $student->id)
            ->whereHas('exam', fn($q) => $q->where('exam_session_id', $sessionId))
            ->get();

        $exams = [];
        foreach ($allSeatings as $s) {
            if ($s->exam) {
                $profName = $this->getProfessorNameForModule($s->exam->module_id);
                $exams[] = [
                    'date'       => $s->exam->exam_date?->format('d/m/Y') ?? 'N/A',
                    'time'       => $s->exam->start_time ? substr($s->exam->start_time, 0, 5) : '09:00',
                    'module'     => $s->exam->module->name ?? 'N/A',
                    'enseignant' => $profName,
                    'room'       => $s->room->name ?? 'N/A',
                    'seat'       => $s->seat_number ? ('N° ' . $s->seat_number) : '-',
                    'qr_token'   => $s->qr_token,
                ];
            }
        }

        usort($exams, fn($a, $b) => strcmp($a['date'] . ' ' . $a['time'], $b['date'] . ' ' . $b['time']));

        $qrToken = $allSeatings->first()->qr_token ?? ('ENCG-' . ($student->cne ?? $student->id));
        $qrCodeBase64 = $this->generateQrBase64($qrToken, 'png', 140);

        $firstModuleSem = (int) ($allSeatings->first()->exam->module->semester_number ?? 1);
        $niveauName = match (true) {
            $firstModuleSem <= 2 => '1ère Année',
            $firstModuleSem <= 4 => '2ème Année',
            $firstModuleSem <= 6 => '3ème Année',
            $firstModuleSem <= 8 => '4ème Année',
            default => '5ème Année',
        };

        return $this->getPdfInstance('pdf.convocation', [
            'person_name'  => strtoupper(($student->user->last_name ?? '') . ' ' . ($student->user->first_name ?? '')),
            'person_role'  => 'Étudiant',
            'person_id'    => $student->cne ?? $student->user->cin ?? 'N/A',
            'filiere_name' => $student->latestPathway->filiere->name ?? 'Tronc Commun ENCG',
            'niveau_name'  => $niveauName,
            'session_type' => $seating->exam->examSession->type ?? 'ORDINAIRE',
            'session_name' => $seating->exam->examSession->name ?? 'Session Principale',
            'exams'        => $exams,
            'qr_token'     => $qrToken,
            'qrCodeBase64' => $qrCodeBase64,
        ]);
    }

    private function generateSingleSurveillantConvocationPdf(int $surveillanceId): Pdf
    {
        $surveillance = ExamSurveillance::findOrFail($surveillanceId);
        $prof = User::findOrFail($surveillance->professor_id);
        $exam = Exam::findOrFail($surveillance->exam_id);
        $session = ExamSession::with(['exams.module', 'exams.room'])->findOrFail($exam->exam_session_id);

        $allSurveillances = ExamSurveillance::where('professor_id', $prof->id)
            ->whereIn('exam_id', $session->exams->pluck('id'))
            ->get();

        $exams = [];
        foreach ($allSurveillances as $s) {
            $sessExam = $session->exams->firstWhere('id', $s->exam_id);
            if ($sessExam) {
                $exams[] = [
                    'date'   => $sessExam->exam_date?->format('d/m/Y') ?? 'N/A',
                    'time'   => $sessExam->start_time ? substr($sessExam->start_time, 0, 5) : 'N/A',
                    'module' => $sessExam->module->name ?? 'N/A',
                    'room'   => $sessExam->room->name ?? 'N/A',
                    'role'   => $s->role ?? 'Surveillant',
                ];
            }
        }

        usort($exams, fn($a, $b) => strcmp($a['date'] . ' ' . $a['time'], $b['date'] . ' ' . $b['time']));

        $token = $allSurveillances->first()->qr_token ?? Str::random(16);
        $qrCodeBase64 = $this->generateQrBase64(url("/api/v1/admin/convocations/verify/{$token}"));

        return $this->getPdfInstance('pdf.convocations_profs_batch', [
            'professorsData' => [[
                'person_name'  => mb_strtoupper($prof->last_name) . ' ' . $prof->first_name,
                'person_id'    => $prof->cin ?? 'N/A',
                'person_role'  => 'Professeur',
                'filiere_name' => 'Corps Professoral ENCG',
                'session_type' => $session->type ?? 'ORDINAIRE',
                'session_name' => $session->name ?? 'Session Principale',
                'exams'        => $exams,
                'qrCodeBase64' => $qrCodeBase64,
            ]],
        ]);
    }

    private function getProfessorNameForModule(?int $moduleId): string
    {
        if (!$moduleId) return 'Prof. ENCG';

        $mp = ModuleProfessor::with('professor.user')->where('module_id', $moduleId)->first();
        if ($mp?->professor?->user) {
            return mb_strtoupper($mp->professor->user->last_name) . ' ' . $mp->professor->user->first_name;
        }

        return 'Prof. ENCG';
    }

    private function getLogoBase64(): string
    {
        $logoPath = public_path('logo-encg.png');
        return file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';
    }

    private function generateQrBase64(string $data, string $format = 'svg', int $size = 120): string
    {
        try {
            $qr = QrCode::format($format)->size($size)->margin(0)->generate($data);
            return 'data:image/' . $format . ';base64,' . base64_encode($qr);
        } catch (\Exception $e) {
            return "https://api.qrserver.com/v1/create-qr-code/?size={$size}x{$size}&data=" . urlencode($data);
        }
    }

    private function generateDefaultProfSignature(string $name): string
    {
        $displayName = !empty($name) ? mb_strtoupper($name) : 'ADMIN ENCG FÈS';
        $stroke = '<path d="M 25 32 Q 35 8 45 23 T 60 18 Q 75 33 90 13 T 110 23 Q 125 16 135 20 M 30 36 Q 75 40 125 34" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>';

        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="48" viewBox="0 0 160 48">
            ' . $stroke . '
            <text x="80" y="45" font-family="DejaVu Sans, Arial, sans-serif" font-size="7.5" font-weight="bold" fill="#334155" text-anchor="middle">' . htmlspecialchars($displayName) . '</text>
        </svg>';

        return 'data:image/svg+xml;base64,' . base64_encode($svg);
    }

    /**
     * Export Attestation d'Inscription PDF.
     */
    public function exportAttestationInscriptionPdf(Request $request)
    {
        $cne = trim($request->query('cne', ''));
        $name = trim($request->query('name', ''));

        $student = null;
        if (!empty($cne)) {
            $student = Student::where('cne', $cne)->orWhere('student_number', $cne)->first();
        }
        if (!$student && !empty($name)) {
            $student = Student::whereHas('user', fn($q) => $q->where('name', 'like', "%{$name}%"))->first();
        }
        if (!$student) {
            $student = Student::first();
        }

        $docType = \App\Models\DocumentType::where('code', 'ATT_SCOL')->first()
            ?? \App\Models\DocumentType::firstOrCreate(
                ['code' => 'ATT_SCOL'],
                ['name' => 'Attestation de Scolarité', 'view_name' => 'documents.attestation_scolarite', 'is_active' => true]
            );

        $docRequest = \App\Models\DocumentRequest::create([
            'student_id'       => $student?->id ?? 1,
            'document_type_id' => $docType->id,
            'status'           => 'ready',
            'requested_at'     => now(),
            'processed_at'     => now(),
        ]);

        $docService = app(\App\Services\DocumentRequestService::class);
        $genDoc = $docService->generateDocumentPdf($docRequest);

        $fullPath = null;
        if (Storage::disk('private')->exists($genDoc->file_path)) {
            $fullPath = Storage::disk('private')->path($genDoc->file_path);
        } elseif (Storage::disk('local')->exists($genDoc->file_path)) {
            $fullPath = Storage::disk('local')->path($genDoc->file_path);
        } elseif (file_exists(storage_path('app/' . $genDoc->file_path))) {
            $fullPath = storage_path('app/' . $genDoc->file_path);
        }

        if ($fullPath && file_exists($fullPath)) {
            return response()->file($fullPath, [
                'Content-Type'        => 'application/pdf',
                'Content-Disposition' => 'inline; filename="Attestation_Inscription.pdf"',
            ]);
        }

        return response('Erreur lors de la génération du PDF', 500);
    }

    /**
     * Exportation de l'Autorisation Officielle d'Occupation d'Amphi / Salle (A4 PDF).
     */
    public function exportAutorisationSallePdf(Request $request, string $id)
    {
        $booking = null;
        if (is_numeric($id) && class_exists(\App\Models\ClassroomReservation::class)) {
            $booking = \App\Models\ClassroomReservation::with(['room', 'user', 'club'])->find((int)$id);
        }

        $clubName = $booking?->club?->name 
            ?? $request->query('club_name') 
            ?? ($booking?->user?->name ? 'Club ' . $booking->user->name : 'Club Enactus ENCG Fès');

        $roomName = $booking?->room?->name 
            ?? $booking?->room_name 
            ?? $request->query('room_name', 'Amphithéâtre Al Khwarizmi');

        $purpose = $booking?->purpose 
            ?? $request->query('purpose', 'Conférence Annuelle de l\'Entrepreneuriat Social & Innovation');

        $responsibleName = $booking?->user?->name 
            ?? $request->query('responsible', 'Karima Belkhayat (Présidente du Club)');

        $dateDisplay = $booking?->start_time 
            ? \Carbon\Carbon::parse($booking->start_time)->translatedFormat('l d F Y') 
            : $request->query('date', 'Lundi 15 Juin 2026');

        $timeDisplay = ($booking?->start_time && $booking?->end_time)
            ? \Carbon\Carbon::parse($booking->start_time)->format('H:i') . ' - ' . \Carbon\Carbon::parse($booking->end_time)->format('H:i')
            : $request->query('time', '09h00 - 17h00');

        $trackingCode = 'AUT-SALLE-' . date('Y') . '-' . str_pad($id, 4, '0', STR_PAD_LEFT);
        $verifyUrl = url("/verify/document/{$trackingCode}");

        $data = [
            'title'           => 'AUTORISATION D\'OCCUPATION DES LOCAUX ET AMPHITHÉÂTRES',
            'trackingCode'    => $trackingCode,
            'verifyUrl'       => $verifyUrl,
            'clubName'        => $clubName,
            'roomName'        => $roomName,
            'purpose'         => $purpose,
            'responsibleName' => $responsibleName,
            'dateDisplay'     => $dateDisplay,
            'timeDisplay'     => $timeDisplay,
            'capacity'        => $booking?->room?->capacity ?? 250,
            'dateIssued'      => now()->format('d/m/Y'),
        ];

        return $this->getPdfInstance('pdf.autorisation_salle', $data)
            ->download(sprintf('Autorisation_Salle_%s_%s.pdf', \Illuminate\Str::slug($roomName), $id));
    }

    /**
     * ═══════════════════════════════════════════════════════════════════
     *  📜 ENGAGEMENT (تعهد) — Formulaire d'engagement officiel ENCG Fès
     * ═══════════════════════════════════════════════════════════════════
     */
    public function engagementPdf(Request $request)
    {
        $studentId = $request->query('student_id');
        $cne = $request->query('cne');
        $cin = $request->query('cin');

        $student = null;
        if ($cne) {
            $student = \App\Models\Student::with(['user', 'pathways.filiere', 'pathways.academicYear'])->where('cne', $cne)->first();
        }
        if (!$student && $cin) {
            $student = \App\Models\Student::with(['user', 'pathways.filiere', 'pathways.academicYear'])->whereHas('user', fn($q) => $q->where('cin', $cin))->first();
        }
        if (!$student && $studentId) {
            $student = \App\Models\Student::with(['user', 'pathways.filiere', 'pathways.academicYear'])->find($studentId);
        }

        $user = $student?->user;
        $application = \App\Models\Application::where('cne', $cne ?: $student?->cne)
            ->orWhere('cin', $cin ?: $user?->cin)
            ->latest('id')
            ->first();

        if (!$student && !$user && !$application) {
            $student = \App\Models\Student::with(['user', 'pathways.filiere', 'pathways.academicYear'])->first();
            $user = $student?->user;
        }

        $lastName = strtoupper($user?->last_name ?? $student?->last_name ?? $application?->last_name ?? '');
        $firstName = strtoupper($user?->first_name ?? $student?->first_name ?? $application?->first_name ?? '');
        $studentName = trim($lastName . ' ' . $firstName);

        $pathway = $student?->pathways->sortByDesc('id')->first();
        $filiere = $pathway?->filiere;
        $academicYear = $pathway?->academicYear;

        // Determine semester from current level
        $level = $pathway?->level ?? 1;
        $semester = 'S' . (($level - 1) * 2 + 1);
        $semesterLabels = [
            1 => '1ère année', 2 => '2ème année', 3 => '3ème année',
            4 => '4ème année', 5 => '5ème année',
        ];
        $semesterLabel = $semesterLabels[$level] ?? ($level . 'ème année');

        // 🖋️ Empreinte Numérique Horodatée & Security Hash
        $timestamp = now()->timezone('Africa/Casablanca')->format('d/m/Y H:i:s');
        $rawSecString = ($cne ?: $student?->cne ?: $application?->cne ?: 'N/A') . '|' . ($cin ?: $user?->cin ?: $application?->cin ?: 'N/A') . '|' . $timestamp . '|ENCG_FES_SEC_KEY_2026';
        $digitalHash = 'ENCG-SEC-' . strtoupper(substr(hash('sha256', $rawSecString), 0, 16));
        $verifyUrl = url('/verify/document/' . $digitalHash);

        // Generate Base64 QR Code
        try {
            $qrSvg = \SimpleSoftwareIO\QrCode\Facades\QrCode::size(100)->margin(0)->generate($verifyUrl);
            $qrBase64 = 'data:image/svg+xml;base64,' . base64_encode($qrSvg);
        } catch (\Exception $e) {
            $qrBase64 = "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=" . urlencode($verifyUrl);
        }

        $logoPath = public_path('logo-encg.png');
        if (!file_exists($logoPath)) {
            $logoPath = public_path('images/encg_logo.png');
        }
        $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';

        // Resolve student photo
        $photoBase64 = null;
        $photoPath = null;
        $photoRelPath = null;

        if ($student) {
            $photoDoc = \Illuminate\Support\Facades\DB::table('student_documents')
                ->where('student_id', $student->id)
                ->whereIn('type', ['photo', 'PHOTO', 'photo_identite'])
                ->latest('id')
                ->first();
            $photoRelPath = $photoDoc?->file_path ?? $student->photo_path;
        }

        if (!$photoRelPath && ($cne || $student?->cne)) {
            $appDoc = \Illuminate\Support\Facades\DB::table('applications')->where('cne', $cne ?: $student?->cne)->first();
            $photoRelPath = $appDoc?->photo_path;
        }

        if ($photoRelPath) {
            $cleanRel = ltrim(preg_replace('/^\/?storage\//', '', $photoRelPath), '/');
            $candidates = [
                $photoRelPath,
                storage_path('app/public/' . $cleanRel),
                storage_path('app/private/' . $cleanRel),
                storage_path('app/' . $cleanRel),
                public_path($photoRelPath),
                public_path('storage/' . $cleanRel),
                public_path($cleanRel),
            ];

            foreach ($candidates as $cand) {
                if ($cand && file_exists($cand) && !is_dir($cand)) {
                    $photoPath = $cand;
                    $mime = mime_content_type($cand) ?: 'image/jpeg';
                    $photoBase64 = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($cand));
                    break;
                }
            }
        }

        if (!$photoBase64) {
            $avatarSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="260" viewBox="0 0 200 260" fill="none"><rect width="200" height="260" rx="8" fill="#F1F5F9"/><circle cx="100" cy="95" r="42" fill="#CBD5E1"/><path d="M30 220C30 175 60 160 100 160C140 160 170 175 170 220V240H30V220Z" fill="#94A3B8"/><circle cx="100" cy="92" r="34" fill="#E2E8F0"/><path d="M45 220C45 185 70 172 100 172C130 172 155 185 155 220V235H45V220Z" fill="#0F2863"/></svg>';
            $photoBase64 = 'data:image/svg+xml;base64,' . base64_encode($avatarSvg);
        }

        $data = [
            'studentName'         => $studentName,
            'birthDate'           => ($student?->birth_date ? \Carbon\Carbon::parse($student->birth_date)->format('d / m / Y') : ($application?->birth_date ? \Carbon\Carbon::parse($application->birth_date)->format('d / m / Y') : '')),
            'birthCity'           => $student?->birth_city ?? $application?->birth_city ?? '',
            'cin'                 => $cin ?: $user?->cin ?: $student?->cin ?: $application?->cin ?: '',
            'cne'                 => $cne ?: $student?->cne ?: $application?->cne ?: '',
            'semester'            => $semester,
            'semesterLabel'       => $semesterLabel,
            'filiere'             => $filiere?->name ?? 'Deux années préparatoires (TC)',
            'academicYear'        => $academicYear?->label ?? (date('Y') . ' - ' . (date('Y') + 1)),
            'currentDate'         => now()->format('d / m / Y'),
            'digitalHash'         => $digitalHash,
            'generationTimestamp' => $timestamp,
            'verifyUrl'           => $verifyUrl,
            'qrBase64'            => $qrBase64,
            'logoBase64'          => $logoBase64,
            'photoBase64'         => $photoBase64,
            'photoPath'           => $photoPath,
        ];

        $pdf = $this->getPdfInstance('pdf.engagement', $data);
        $pdf->setPaper('a4', 'portrait');

        $name = trim(($user?->last_name ?? 'Etudiant') . '_' . ($user?->first_name ?? ''));
        return $pdf->stream("Engagement_{$name}.pdf");
    }

    /**
     * ═══════════════════════════════════════════════════════════════════════
     *  🏥 FICHE DE RENSEIGNEMENTS MÉDICAUX — Fiche santé officielle ENCG Fès
     * ═══════════════════════════════════════════════════════════════════════
     */
    public function ficheMedicalePdf(Request $request)
    {
        $studentId = $request->query('student_id');
        $cne = $request->query('cne');
        $cin = $request->query('cin');

        $student = null;
        if ($cne) {
            $student = \App\Models\Student::with(['user', 'pathways.filiere', 'pathways.academicYear'])->where('cne', $cne)->first();
        }
        if (!$student && $cin) {
            $student = \App\Models\Student::with(['user', 'pathways.filiere', 'pathways.academicYear'])->whereHas('user', fn($q) => $q->where('cin', $cin))->first();
        }
        if (!$student && $studentId) {
            $student = \App\Models\Student::with(['user', 'pathways.filiere', 'pathways.academicYear'])->find($studentId);
        }

        $user = $student?->user;
        $application = \App\Models\Application::where('cne', $cne ?: $student?->cne)
            ->orWhere('cin', $cin ?: $user?->cin)
            ->latest('id')
            ->first();

        if (!$student && !$user && !$application) {
            $student = \App\Models\Student::with(['user', 'pathways.filiere', 'pathways.academicYear'])->first();
            $user = $student?->user;
        }

        $lastName = strtoupper($user?->last_name ?? $student?->last_name ?? $application?->last_name ?? '');
        $firstName = strtoupper($user?->first_name ?? $student?->first_name ?? $application?->first_name ?? '');

        $pathway = $student?->pathways->sortByDesc('id')->first();
        $academicYear = $pathway?->academicYear;

        // 🖋️ Empreinte Numérique Horodatée & Security Hash
        $timestamp = now()->timezone('Africa/Casablanca')->format('d/m/Y H:i:s');
        $rawSecString = ($cne ?: $student?->cne ?: $application?->cne ?: 'N/A') . '|MED|' . $timestamp . '|ENCG_FES_MED_2026';
        $digitalHash = 'ENCG-MED-' . strtoupper(substr(hash('sha256', $rawSecString), 0, 16));
        $verifyUrl = url('/verify/document/' . $digitalHash);

        try {
            $qrSvg = \SimpleSoftwareIO\QrCode\Facades\QrCode::size(100)->margin(0)->generate($verifyUrl);
            $qrBase64 = 'data:image/svg+xml;base64,' . base64_encode($qrSvg);
        } catch (\Exception $e) {
            $qrBase64 = "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=" . urlencode($verifyUrl);
        }

        // Resolve student photo
        $photoBase64 = null;
        $photoPath = null;
        $photoRelPath = null;

        if ($student) {
            $photoDoc = \Illuminate\Support\Facades\DB::table('student_documents')
                ->where('student_id', $student->id)
                ->whereIn('type', ['photo', 'PHOTO', 'photo_identite'])
                ->latest('id')
                ->first();
            $photoRelPath = $photoDoc?->file_path ?? $student->photo_path;
        }

        if (!$photoRelPath && ($cne || $student?->cne)) {
            $appDoc = \Illuminate\Support\Facades\DB::table('applications')->where('cne', $cne ?: $student?->cne)->first();
            $photoRelPath = $appDoc?->photo_path;
        }

        if ($photoRelPath) {
            $cleanRel = ltrim(preg_replace('/^\/?storage\//', '', $photoRelPath), '/');
            $candidates = [
                $photoRelPath,
                storage_path('app/public/' . $cleanRel),
                storage_path('app/private/' . $cleanRel),
                storage_path('app/' . $cleanRel),
                public_path($photoRelPath),
                public_path('storage/' . $cleanRel),
                public_path($cleanRel),
            ];

            foreach ($candidates as $cand) {
                if ($cand && file_exists($cand) && !is_dir($cand)) {
                    $photoPath = $cand;
                    $mime = mime_content_type($cand) ?: 'image/jpeg';
                    $photoBase64 = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($cand));
                    break;
                }
            }
        }

        if (!$photoBase64) {
            $avatarSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="260" viewBox="0 0 200 260" fill="none"><rect width="200" height="260" rx="8" fill="#F1F5F9"/><circle cx="100" cy="95" r="42" fill="#CBD5E1"/><path d="M30 220C30 175 60 160 100 160C140 160 170 175 170 220V240H30V220Z" fill="#94A3B8"/><circle cx="100" cy="92" r="34" fill="#E2E8F0"/><path d="M45 220C45 185 70 172 100 172C130 172 155 185 155 220V235H45V220Z" fill="#0F2863"/></svg>';
            $photoBase64 = 'data:image/svg+xml;base64,' . base64_encode($avatarSvg);
        }

        $fatherName = trim(
            $student?->father_name ??
            $student?->father_name_fr ??
            $application?->father_name ??
            $application?->father_name_fr ??
            $student?->parent_name ??
            $application?->parent_name ??
            ''
        );

        $motherName = trim(
            $student?->mother_name ??
            $student?->mother_name_fr ??
            $application?->mother_name ??
            $application?->mother_name_fr ??
            ''
        );

        if (empty($fatherName)) {
            $fatherName = $lastName . ' (Père / Tuteur Légal)';
        }

        if (empty($motherName)) {
            $motherName = 'Tutrice Légale (Mère)';
        }

        $data = [
            'lastName'            => $lastName,
            'firstName'           => $firstName,
            'address'             => $student?->address_fr ?? $student?->address ?? $application?->address ?? '',
            'phone'               => $user?->phone ?? $student?->phone ?? $application?->phone ?? '',
            'fatherName'          => $fatherName,
            'motherName'          => $motherName,
            'parentPhone'         => $student?->parent_phone ?? $student?->father_phone ?? $application?->parent_phone ?? $application?->father_phone ?? '',
            'emergencyName'       => $student?->emergency_contact_name ?? $application?->emergency_contact_name ?? 'Père / Tuteur',
            'emergencyPhone'      => $student?->emergency_contact_phone ?? $application?->emergency_contact_phone ?? '',
            'allergyType'         => $student?->allergy_type ?? $application?->allergy_type ?? ($student?->has_disability ? $student?->disability_details : 'Aucune'),
            'hasFollowUp'         => (bool)($student?->has_medical_followup ?? $application?->has_medical_followup ?? false),
            'medication'          => $student?->medication_used ?? $application?->medication_used ?? 'Aucun',
            'doctorInfo'          => $student?->treating_doctor_info ?? $application?->treating_doctor_info ?? 'Médecin Généraliste',
            'academicYear'        => $academicYear?->label ?? (date('Y') . ' - ' . (date('Y') + 1)),
            'photoBase64'         => $photoBase64,
            'digitalHash'         => $digitalHash,
            'generationTimestamp' => $timestamp,
            'verifyUrl'           => $verifyUrl,
            'qrBase64'            => $qrBase64,
            'cin'                 => $cin ?: $user?->cin ?: $student?->cin ?: $application?->cin ?: '',
            'cne'                 => $cne ?: $student?->cne ?: $application?->cne ?: '',
        ];

        $pdf = $this->getPdfInstance('pdf.fiche_medicale', $data);
        $pdf->setPaper('a4', 'portrait');

        $name = trim(($user?->last_name ?? 'Etudiant') . '_' . ($user?->first_name ?? ''));
        return $pdf->stream("Fiche_Medicale_{$name}.pdf");
    }

    /**
     * Download Récépissé de Dépôt de Dossier Physique COMPLET PDF.
     * (Récépissé initial lors de l'inscription — dossier complet)
     */
    public function downloadRecepisseDossierCompletPdf(Request $request, $studentId)
    {
        $student = \App\Models\Student::with(['user', 'latestPathway.filiere'])->find($studentId);

        $cne = $student?->cne ?? $request->input('cne', 'M145092428');
        $cin = $student?->cin ?? $request->input('cin', 'UB121643');
        $first_name = $student?->first_name ?? $request->input('first_name', 'SIHAM');
        $last_name = $student?->last_name ?? $request->input('last_name', 'ABEN HSSAIN');
        $studentName = strtoupper("{$last_name} {$first_name}");
        $filiereName = $student?->latestPathway?->filiere?->name ?? $request->input('filiere_name', 'DEUX ANNÉES PRÉPARATOIRES');

        $pdf = $this->getPdfInstance('pdf.recepisse_depot', [
            'studentName' => $studentName,
            'cne'         => $cne,
            'cin'         => $cin,
            'filiereName' => $filiereName,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("Recepisse_Depot_{$cne}.pdf");
    }

    /**
     * Download Étiquette Barcode Enveloppe Physique A4 PDF.
     */
    public function downloadEtiquetteEnveloppePdf(Request $request, $studentId)
    {
        $student = \App\Models\Student::with(['user', 'latestPathway.filiere'])->find($studentId);

        $cne = $student?->cne ?? $request->input('cne', 'M145092428');
        $cin = $student?->cin ?? $request->input('cin', 'UB121643');
        $first_name = $student?->first_name ?? $request->input('first_name', 'SIHAM');
        $last_name = $student?->last_name ?? $request->input('last_name', 'ABEN HSSAIN');
        $studentName = strtoupper("{$last_name} {$first_name}");
        $filiereName = $student?->latestPathway?->filiere?->name ?? $request->input('filiere_name', 'DEUX ANNÉES PRÉPARATOIRES');

        $pdf = $this->getPdfInstance('pdf.etiquette_enveloppe', [
            'studentId'   => $studentId,
            'studentName' => $studentName,
            'cne'         => $cne,
            'cin'         => $cin,
            'filiereName' => $filiereName,
            'groupName'   => 'TC-S1-G1',
            'bacYear'     => '2026',
            'bacSeries'   => 'Sciences Math B',
        ])->setPaper('a4', 'portrait');

        return $pdf->download("Etiquette_Enveloppe_{$cne}.pdf");
    }

    /**
     * Download Carte Étudiant CR80 (Evolis Primacy 2) — ISO ID-1 Format.
     */
    public function downloadCarteEtudiantCR80Pdf(Request $request, $studentId)
    {
        $student = \App\Models\Student::with(['user', 'latestPathway.filiere'])->find($studentId);

        $cne           = $student?->cne           ?? $request->input('cne', 'M145092428');
        $first_name    = $student?->first_name    ?? $request->input('first_name', 'SIHAM');
        $last_name     = $student?->last_name     ?? $request->input('last_name', 'ABEN HSSAIN');
        $studentName   = strtoupper("{$last_name} {$first_name}");
        $studentNumber = $student?->student_number ?? $request->input('student_number', 'ENCG-FES-2027-TC-00001');
        $filiereName   = $student?->latestPathway?->filiere?->name ?? 'Tronc Commun';
        $academicYear  = $student?->academic_year  ?? date('Y') . '-' . (date('Y') + 1);

        $photoPath = null;
        if ($studentId) {
            $photoDoc = \Illuminate\Support\Facades\DB::table('student_documents')
                ->where('student_id', $studentId)
                ->where('type', 'photo')
                ->first();

            if ($photoDoc && !empty($photoDoc->file_path)) {
                $localRelative = str_replace('/storage/', '', $photoDoc->file_path);
                $fullPath = storage_path('app/public/' . $localRelative);
                if (file_exists($fullPath)) {
                    $photoPath = $fullPath;
                }
            }
        }

        $pdf = $this->getPdfInstance('pdf.carte_etudiant_cr80', [
            'studentName'   => $studentName,
            'cne'           => $cne,
            'studentNumber' => $studentNumber,
            'filiereName'   => $filiereName,
            'academicYear'  => $academicYear,
            'photoPath'     => $photoPath,
        ])
        ->setPaper([0, 0, 153.01, 242.64], 'landscape')
        ->setOption('dpi', 600)
        ->setOption('margin-top', 0)
        ->setOption('margin-right', 0)
        ->setOption('margin-bottom', 0)
        ->setOption('margin-left', 0)
        ->setOption('page-width', '85.60mm')
        ->setOption('page-height', '53.98mm')
        ->setOption('disable-smart-shrinking', true);

        return response()->streamDownload(
            fn() => print($pdf->output()),
            "Carte_Etudiant_CR80_{$cne}.pdf",
            [
                'Content-Type'        => 'application/pdf',
                'X-Card-Format'       => 'CR80-ISO-ID1',
                'X-Print-DPI'         => '300x600',
                'X-Print-Profile'     => 'Evolis-Primacy2-YMCKO-AllBlack',
                'X-Duplex'            => 'short-edge',
                'X-Print-Scale'       => '100%',
            ]
        );
    }

    // ─── REÇU DE DÉPÔT COMPLÉMENTAIRE ───────────────────────────

    /**
     * Génère un reçu de dépôt complémentaire pour un seul document
     * apporté après l'inscription initiale.
     *
     * Params GET :
     *  student_id  (int, optional)
     *  cne         (string)
     *  doc         (string)  — clé: bac|releve|cnie|photo|naissance
     *  obs         (string, optional) — observation libre
     */
    public function downloadRecepisseDepotPdf(Request $request, $student = null)
    {
        // Résoudre l'étudiant
        $studentId = $student ?? $request->query('student_id');
        $cneParam  = strtoupper(trim($request->query('cne', '')));
        $docKey    = $request->query('doc', 'document');
        $obsParam  = $request->query('obs', null);

        $std = null;
        if ($studentId) {
            $std = Student::with(['user', 'latestPathway.filiere'])->find($studentId);
        }
        if (!$std && !empty($cneParam)) {
            $std = Student::with(['user', 'latestPathway.filiere'])
                ->where('cne', $cneParam)->first();
        }

        // Labels humains par clé de document
        $docLabels = [
            'bac'       => 'Original du Diplôme du Baccalauréat (Obligatoire)',
            'releve'    => 'Relevé de Notes Officiel du Baccalauréat',
            'cnie'      => 'Copie Certifiée de la CNIE (Carte d\'Identité Nationale)',
            'photo'     => 'Photos d\'Identité Récentes (x4 Format CR80)',
            'naissance' => 'Extrait d\'Acte de Naissance Récent',
        ];
        $conformiteLabels = [
            'bac'       => 'Original conservé en dossier',
            'releve'    => 'Copie conforme au relevé officiel',
            'cnie'      => 'Recto-Verso valide',
            'photo'     => 'Format et qualité validés',
            'naissance' => 'Original conforme — validité vérifiée',
        ];

        $documentLabel = $docLabels[$docKey] ?? ('Pièce : ' . $docKey);
        $conformiteNote = $conformiteLabels[$docKey] ?? 'Original conforme';
        $observations   = $obsParam ?? 'Pièce reçue et enregistrée dans le dossier physique de l\'étudiant.';

        // Résoudre les infos étudiant
        $studentName = $std
            ? strtoupper(trim(($std->last_name ?? '') . ' ' . ($std->first_name ?? '')))
            : strtoupper($request->query('name', 'ÉTUDIANT ENCG'));
        $cne  = $std?->cne ?? $cneParam ?: 'N/A';
        $cin  = $std?->user?->cin ?? $request->query('cin', 'N/A');
        $filiereName = $std?->latestPathway?->filiere?->name ?? 'DEUX ANNÉES PRÉPARATOIRES (TRONC COMMUN)';

        $data = [
            'studentName'    => $studentName,
            'cne'            => $cne,
            'cin'            => $cin,
            'filiereName'    => $filiereName,
            'documentLabel'  => $documentLabel,
            'conformiteNote' => $conformiteNote,
            'observations'   => $observations,
            'docKey'         => $docKey,
            'verifyUrl'      => url('/verify/recu-comp?cne=' . $cne . '&doc=' . $docKey . '&t=' . date('YmdHi')),
        ];

        $pdf = $this->getPdfInstance('pdf.recu_depot_complementaire', $data)->setPaper('a4', 'portrait');
        return $pdf->stream("Recu_Depot_Complementaire_{$cne}_{$docKey}.pdf", ['Attachment' => false]);
    }
}