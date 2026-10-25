<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\RolloverAcademicYearRequest;
use App\Http\Requests\Academic\StoreAcademicYearRequest;
use App\Http\Requests\Academic\UpdateAcademicYearRequest;
use App\Models\AcademicYear;
use App\Models\Deliberation;
use App\Models\DeliberationDecision;
use App\Models\Student;
use App\Models\StudentGraduation;
use App\Models\StudentPathway;
use App\Models\StudentRegistration;
use App\Services\Academic\SmartAcademicProgressionService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AcademicYearController extends Controller
{
    /**
     * Liste des années académiques.
     */
    public function index(): JsonResponse
    {
        $user = request()->user();
        $canView = ! $user || $user->can('academic.view') || $user->hasAnyRole([
            'admin', 'super-admin', 'super_admin', 'institution-admin', 'institution_admin',
            'director', 'department-head', 'filiere-head', 'professor', 'vacataire', 'scolarite', 'student',
        ]);
        abort_unless($canView, 403);

        $years = AcademicYear::orderByDesc('start_year')->get()->map(fn ($y) => [
            'id' => $y->id,
            'label' => $y->label,
            'start_year' => $y->start_year,
            'end_year' => $y->end_year,
            'start_date' => $y->start_date?->format('Y-m-d'),
            'end_date' => $y->end_date?->format('Y-m-d'),
            'is_current' => $y->is_current,
            'is_locked' => $y->is_locked,
        ]);

        return response()->json([
            'success' => true,
            'data' => $years,
        ]);
    }

    /**
     * Créer une année académique.
     */
    public function store(StoreAcademicYearRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (! empty($validated['is_current'])) {
            AcademicYear::where('is_current', true)->update(['is_current' => false]);
        }

        $validated['institution_id'] = 1;
        $year = AcademicYear::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Année académique créée.',
            'data' => $year,
        ], 201);
    }

    /**
     * Mettre à jour une année académique.
     */
    public function update(UpdateAcademicYearRequest $request, AcademicYear $academicYear): JsonResponse
    {
        $validated = $request->validated();

        if (! empty($validated['is_current'])) {
            AcademicYear::where('id', '!=', $academicYear->id)->update(['is_current' => false]);
        }

        $academicYear->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Année académique mise à jour.',
            'data' => $academicYear,
        ]);
    }

    /**
     * Supprimer une année académique.
     */
    public function destroy(AcademicYear $academicYear): JsonResponse
    {
        abort_unless(request()->user()->can('academic.delete'), 403);

        if ($academicYear->is_locked) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer une année verrouillée.',
            ], 403);
        }

        $academicYear->delete();

        return response()->json([
            'success' => true,
            'message' => 'Année académique supprimée.',
        ]);
    }

    /**
     * Basculer vers une nouvelle année académique.
     */
    public function rollover(RolloverAcademicYearRequest $request, int $id, SmartAcademicProgressionService $rolloverService): JsonResponse
    {
        $validated = $request->validated();

        AcademicYear::whereKey($id)->where('institution_id', $request->user()->institution_id)->firstOrFail();
        $result = $rolloverService->executeSmartRollover(
            $id,
            $validated['new_label'],
            $validated['start_date'],
            $validated['end_date'],
            $request->user()->name
        );

        return response()->json($result, $result['success'] ? 200 : 500);
    }

    /**
     * Tableau de bord d'archivage avec données réelles MySQL.
     */
    public function getArchivingDashboard(Request $request): JsonResponse
    {
        $years = AcademicYear::where('institution_id', $request->user()->institution_id)->orderByDesc('start_year')->get();

        $archives = $years->map(function ($y, $index) {
            $studentCount = StudentPathway::where('academic_year_id', $y->id)->pluck('student_id')
                ->merge(StudentRegistration::where('academic_year_id', $y->id)->pluck('student_id'))->unique()->count();
            $decisions = DeliberationDecision::whereHas('deliberation', fn ($q) => $q->where('academic_year_id', $y->id)
                ->where('institution_id', $y->institution_id)->whereIn('type', ['annual', 'annuel'])->where('is_sealed', true))
                ->orderByDesc('id')->get()->unique('student_id');
            $admittedCount = $decisions->whereIn('decision', ['admitted', 'V', 'V.Comp', 'DIPLOME', 'graduated'])->count();
            $repeatedCount = $decisions->whereIn('decision', ['REDOUBLANT', 'REPEAT_YEAR', 'repeat_year', 'repeated'])->count();
            $graduatedCount = StudentGraduation::where('institution_id', $y->institution_id)->where('academic_year_id', $y->id)->distinct()->count('student_id');
            $seals = Deliberation::where('academic_year_id', $y->id)->where('institution_id', $y->institution_id)
                ->where('is_sealed', true)->whereNotNull('seal_hash')->pluck('seal_hash');

            $label = $y->label ?? $y->name ?? '2024-2025';

            return [
                'id' => 'ARC-'.$label,
                'yearLabel' => $label,
                'isCurrent' => (bool) $y->is_current,
                'isLocked' => (bool) $y->is_locked,
                'studentsCount' => $studentCount,
                'admittedCount' => $admittedCount,
                'repeatedCount' => max(0, $repeatedCount),
                'graduatedCount' => $graduatedCount,
                'pvChecksum' => $seals->isEmpty() ? 'Aucun PV scellé enregistré' : $seals->implode(' · '),
                'blockchainHash' => '',
                'archivedDate' => $y->is_locked ? ($y->updated_at?->format('d/m/Y H:i:s') ?? 'Non renseignée') : 'Année ouverte',
                'archivedBy' => 'Agent d’archivage non renseigné',
                'cndpStatus' => 'A_VERIFIER',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'totalArchives' => $archives->count(),
                'activeYear' => $years->firstWhere('is_current', true)?->label ?? $years->firstWhere('is_current', true)?->name ?? '2025-2026',
                'archives' => $archives,
            ],
        ]);
    }

    /**
     * Obtenir le registre complet de passage annuel avec détection intelligente des dettes.
     */
    public function getProgressionRoster(Request $request, SmartAcademicProgressionService $progressionService): JsonResponse
    {
        $yearId = $request->query('academic_year_id');
        $result = $progressionService->getProgressionRoster($yearId ? (int) $yearId : null);

        return response()->json($result);
    }

    /**
     * Vérifier le mot de passe du responsable avant une opération sensible.
     */
    public function verifyArchiveSecurityCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'security_code' => 'required|string',
        ]);

        $inputCode = trim($validated['security_code']);
        $user = $request->user();

        $isPasswordValid = $user && Hash::check($inputCode, $user->password);
        if (! $isPasswordValid) {
            return response()->json([
                'success' => false,
                'message' => 'Code d’autorisation ou mot de passe incorrect. Opération refusée.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Autorisation administrative confirmée.',
        ]);
    }

    /**
     * Exécuter la bascule officielle intelligente et archiver l'année avec contrôle strict de sécurité.
     */
    public function executeSmartRollover(Request $request, SmartAcademicProgressionService $progressionService): JsonResponse
    {
        $validated = $request->validate([
            'current_year_id' => 'required|integer',
            'new_label' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'security_code' => 'required|string',
        ]);

        $inputCode = trim($validated['security_code']);
        $user = $request->user();

        $isPasswordValid = $user && Hash::check($inputCode, $user->password);
        if (! $isPasswordValid) {
            return response()->json([
                'success' => false,
                'message' => 'Code d’autorisation ou mot de passe administrateur incorrect. La bascule a été bloquée pour des raisons de sécurité.',
            ], 403);
        }

        $authorizedBy = $user
            ? "{$user->first_name} {$user->last_name} ({$user->email})"
            : 'Direction Académique';
        AcademicYear::whereKey($validated['current_year_id'])->where('institution_id', $user->institution_id)->firstOrFail();

        $result = $progressionService->executeSmartRollover(
            (int) $validated['current_year_id'],
            $validated['new_label'],
            $validated['start_date'],
            $validated['end_date'],
            $authorizedBy
        );

        return response()->json($result, $result['success'] ? 200 : 500);
    }

    /**
     * Simuler la bascule annuelle à blanc (Dry-Run sans impact DB).
     */
    public function simulateSmartRollover(Request $request, SmartAcademicProgressionService $progressionService): JsonResponse
    {
        $validated = $request->validate([
            'current_year_id' => 'required|integer',
            'new_label' => 'required|string',
        ]);

        $result = $progressionService->simulateSmartRollover(
            (int) $validated['current_year_id'],
            $validated['new_label']
        );

        return response()->json($result);
    }

    /**
     * Télécharger la fiche officielle d'enjambement et de dette pédagogique (PDF certifié).
     */
    public function downloadFicheDettePdf(Student $student, SmartAcademicProgressionService $progressionService)
    {
        $student->loadMissing(['user', 'pathways.filiere']);
        $debtRecord = $progressionService->getStudentDebtRecord($student->id);

        if (! $debtRecord) {
            return response()->json(['message' => 'Aucune situation pédagogique trouvée pour cet étudiant.'], 404);
        }

        $activeYear = AcademicYear::where('is_current', true)->first() ?? AcademicYear::first();
        $verifyUrl = config('app.url')."/verify/enjambement/{$student->id}/".md5($student->cne.($activeYear?->id ?? 1));

        $data = [
            'student' => $student,
            'filiereName' => $debtRecord['filiere_name'] ?? 'Tronc Commun',
            'currentLevel' => $debtRecord['current_level'] ?? 'Niveau Actuel',
            'targetLevel' => $debtRecord['target_level'] ?? 'Niveau Cible',
            'annualAverage' => $debtRecord['annual_average'] ?? 10.0,
            'debtModules' => $debtRecord['debt_modules'] ?? [],
            'academicYear' => $activeYear?->label ?? '2026-2027',
            'verifyUrl' => $verifyUrl,
        ];

        // Résolution du logo ENCG
        foreach (['logo-encg.png', 'images/encg_logo.png', 'images/logo-encg.png', 'images/logo.png'] as $candidate) {
            $path = public_path($candidate);
            if (file_exists($path)) {
                $mime = str_ends_with($candidate, '.png') ? 'image/png' : 'image/jpeg';
                $data['logoBase64'] = 'data:'.$mime.';base64,'.base64_encode(file_get_contents($path));
                break;
            }
        }

        $pdf = Pdf::loadView('pdf.fiche_dette_enjambement', $data)->setPaper('a4', 'portrait');
        $filename = "Fiche_Dette_Enjambement_{$student->cne}_".date('Ymd').'.pdf';

        return $pdf->download($filename);
    }
}
