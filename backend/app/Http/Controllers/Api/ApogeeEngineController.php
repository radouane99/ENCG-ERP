<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceSession;
use App\Models\Deliberation;
use App\Models\DeliberationDecision;
use App\Models\Filiere;
use App\Models\Grade;
use App\Models\Group;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\StudentRegistration;
use App\Models\User;
use App\Services\Academic\AcademicContext;
use App\Services\Academic\ApogeeDeliberationEngine;
use App\Services\Academic\GradeLockService;
use App\Services\Apogee\ApogeeExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApogeeEngineController extends Controller
{
    public function __construct(
        private GradeLockService $gradeLockService,
        private ApogeeDeliberationEngine $deliberationEngine,
        private ApogeeExportService $exportService
    ) {}

    /**
     * Export officiel APOGEE (Format CSV / Texte ministériel MESRSFC).
     */
    public function exportApogeeCsv(Request $request)
    {
        $user = $request->user();
        if (! $user || (! $user->can('reports.export') && ! $user->hasAnyRole(['admin', 'super-admin', 'super_admin', 'director', 'pedagogy_officer', 'institution-admin', 'institution_admin']))) {
            abort(403, 'Non autorisé à exporter les données APOGEE.');
        }

        $filiereId = $request->query('filiere_id') ? (int) $request->query('filiere_id') : null;
        $semesterId = $request->query('semester_id') ? (int) $request->query('semester_id') : null;
        $academicYearId = $request->query('academic_year_id') ? (int) $request->query('academic_year_id') : null;

        $records = $this->exportService->generateExportData(
            $filiereId,
            $semesterId,
            $academicYearId,
            $request->query('group_id') ? (int) $request->query('group_id') : null,
            $request->query('session')
        );
        $csvContent = $this->exportService->generateCsv($records);

        $filename = 'EXPORT_APOGEE_ENCG_FES_'.date('Ymd_His').'.csv';

        return response($csvContent, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'X-Record-Count' => (string) count($records),
        ]);
    }

    /**
     * Obtenir les données prévisualisées de l'export APOGEE.
     */
    public function getApogeePreview(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user || (! $user->can('reports.view') && ! $user->hasAnyRole(['admin', 'super-admin', 'super_admin', 'director', 'pedagogy_officer', 'institution-admin', 'institution_admin']))) {
            abort(403, 'Non autorisé à consulter les données APOGEE.');
        }

        $filiereId = $request->query('filiere_id') ? (int) $request->query('filiere_id') : null;
        $semesterId = $request->query('semester_id') ? (int) $request->query('semester_id') : null;
        $academicYearId = $request->query('academic_year_id') ? (int) $request->query('academic_year_id') : null;

        $records = $this->exportService->generateExportData(
            $filiereId,
            $semesterId,
            $academicYearId,
            $request->query('group_id') ? (int) $request->query('group_id') : null,
            $request->query('session')
        );

        return response()->json([
            'success' => true,
            'data' => [
                'establishment_code' => '040',
                'establishment_name' => 'ENCG Fès — USMBA',
                'total_records' => count($records),
                'generated_at' => now()->toIso8601String(),
                'records' => array_slice($records, 0, 50),
            ],
        ]);
    }

    /**
     * Ouvrir une période de saisie des notes.
     */
    public function openGradePeriod(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|integer',
            'semester_id' => 'required|integer',
            'exam_session_id' => 'required|integer',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $period = $this->gradeLockService->openPeriod(
            $validated['academic_year_id'],
            $validated['semester_id'],
            $validated['exam_session_id'],
            $validated['start_date'],
            $validated['end_date'],
            $request->user()?->id ?? 1
        );

        if (class_exists('Spatie\Activitylog\Models\Activity')) {
            activity()->performedOn($period)->event('opened')->log('Période de saisie ouverte');
        }

        return response()->json([
            'success' => true,
            'message' => 'Période de saisie des notes ouverte.',
            'data' => $period,
        ]);
    }

    /**
     * Lancer la délibération APOGEE pour un étudiant.
     */
    public function runDeliberation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'semester_id' => 'required|integer',
        ]);

        $studentId = $validated['student_id'];
        $grades = Grade::with('assessment.module')->where('student_id', $studentId)->get();

        $processedModules = [];
        $semesterGrades = [];
        $failedModules = 0;

        foreach ($grades as $grade) {
            $isValidated = $grade->value >= 10;

            $processedModules[] = [
                'module_id' => $grade->assessment->module_id ?? 0,
                'module_name' => $grade->assessment->module->name ?? 'Inconnu',
                'grade' => $grade->value,
                'validated' => $isValidated,
            ];

            $semesterGrades[] = [
                'module_id' => $grade->assessment->module_id ?? 0,
                'grade' => $grade->value,
            ];

            if (! $isValidated) {
                $failedModules++;
            }
        }

        $compensation = $this->deliberationEngine->applyCompensation($semesterGrades);
        $progression = $this->deliberationEngine->evaluateProgression($failedModules);

        $delib = Deliberation::create([
            'academic_year_id' => 1,
            'semester_id' => $validated['semester_id'],
            'status' => 'validated',
        ]);

        DeliberationDecision::create([
            'deliberation_id' => $delib->id,
            'student_id' => $studentId,
            'decision_type' => $compensation['is_validated'] ? 'pass' : 'fail',
            'gpa' => $compensation['average'],
            'comments' => 'Délibération APOGEE automatisée',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Délibération APOGEE exécutée.',
            'data' => [
                'student_id' => $studentId,
                'modules_results' => $processedModules,
                'semester_compensation' => $compensation,
                'progression_decision' => ['failed_modules_count' => $failedModules, 'decision' => $progression],
            ],
        ]);
    }

    /**
     * Valider un candidat et générer Code APOGEE + CNE.
     */
    public function validateCandidate(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasAnyRole(['super-admin', 'admin', 'institution-admin', 'director', 'scolarite']), 403);
        $data = $request->validate(['student_id' => 'required|integer|exists:students,id', 'filiere_id' => 'required|integer|exists:filieres,id', 'group_id' => 'nullable|integer|exists:groups,id']);

        return DB::transaction(function () use ($request, $data) {
            $student = Student::whereKey($data['student_id'])->where('institution_id', $request->user()->institution_id)->lockForUpdate()->firstOrFail();
            abort_unless($student->cne && $student->student_number, 422, 'Renseignez les identifiants officiels CNE et APOGEE avant validation.');
            $yearId = AcademicContext::yearId();
            abort_unless($yearId, 422, 'Année active requise.');
            $admissionPending = \App\Models\Application::where(fn ($q) => $q->where('student_id', $student->id)->orWhere('cne', $student->cne))
                ->whereHas('campaign', fn ($q) => $q->where('academic_year_id', $yearId)->where('institution_id', $student->institution_id))
                ->where('dossier_status', '!=', 'approved')->exists();
            abort_if($admissionPending, 422, 'Ce candidat possède un dossier admissions à vérifier. Utilisez la revue TAFEM avant l’inscription pédagogique.');
            Filiere::whereKey($data['filiere_id'])->where('institution_id', $student->institution_id)->firstOrFail();
            $group = isset($data['group_id']) ? Group::whereKey($data['group_id'])->where('filiere_id', $data['filiere_id'])->where('academic_year_id', $yearId)->firstOrFail() : null;
            $semester = $group?->semester_number ?? 1;
            StudentPathway::where('student_id', $student->id)->where('is_current', true)->update(['is_current' => false]);
            StudentPathway::updateOrCreate(['student_id' => $student->id, 'academic_year_id' => $yearId, 'current_semester' => $semester], ['filiere_id' => $data['filiere_id'], 'group_id' => $group?->id, 'is_current' => true]);
            StudentRegistration::updateOrCreate(['student_id' => $student->id, 'academic_year_id' => $yearId, 'semester_number' => $semester], ['filiere_id' => $data['filiere_id'], 'group_id' => $group?->id, 'registration_type' => 'initial', 'status' => 'active']);
            $student->update(['status' => 'active']);
            activity()->causedBy($request->user())->performedOn($student)->withProperties(['academic_year_id' => $yearId, 'semester_number' => $semester])->log('candidate_academic_registration_validated');

            return response()->json(['success' => true, 'message' => 'Inscription validée avec les identifiants officiels conservés.', 'data' => ['student_id' => $student->id, 'apogee_code' => $student->student_number, 'cne' => $student->cne, 'filiere_id' => $data['filiere_id'], 'academic_year_id' => $yearId]]);
        });
    }

    /**
     * Calculer la paie des vacataires.
     */
    public function calculateVacationPayroll(): JsonResponse
    {
        $vacataires = User::where('role', 'vacataire')->select('id', 'name', 'email')->get();

        $payroll = [];
        $totalHoursAll = 0;
        $totalBudgetMad = 0;

        foreach ($vacataires as $v) {
            $sessionsCount = AttendanceSession::where('professor_id', $v->id)->count();
            $hoursDone = $sessionsCount * 2;
            $rate = 350;
            $amount = $hoursDone * $rate;

            $totalHoursAll += $hoursDone;
            $totalBudgetMad += $amount;

            $payroll[] = [
                'vacataire_id' => $v->id,
                'name' => $v->name,
                'email' => $v->email,
                'sessions_count' => $sessionsCount,
                'hours_performed' => $hoursDone,
                'hourly_rate_mad' => $rate,
                'total_amount_mad' => number_format($amount, 2),
                'payment_status' => 'Prêt pour Ordonnancement DAF',
            ];
        }

        return response()->json([
            'success' => true,
            'summary' => [
                'total_vacataires' => count($payroll),
                'total_hours_emarges' => $totalHoursAll,
                'total_payroll_mad' => number_format($totalBudgetMad, 2),
                'calculated_at' => now()->toIso8601String(),
            ],
            'payroll_details' => $payroll,
        ]);
    }
}
