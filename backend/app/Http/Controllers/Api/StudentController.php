<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Services\StudentService;
use App\Http\Resources\StudentResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StudentController extends Controller
{
    protected StudentService $studentService;

    public function __construct(StudentService $studentService)
    {
        $this->studentService = $studentService;
    }

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('students.view'), 403);

        $perPage  = min((int) $request->input('per_page', 20), 100);
        $sortField = $request->input('sort', 'last_name');
        $sortOrder = $request->input('order', 'asc');

        try {
            $paginated = $this->studentService->getPaginatedStudents(
                $request->only(['search', 'status', 'filiere_id', 'semester', 'group_id']),
                $perPage,
                $sortField,
                $sortOrder
            );

            return response()->json([
                'data' => StudentResource::collection($paginated->getCollection()),
                'meta' => [
                    'total'        => $paginated->total(),
                    'per_page'     => $paginated->perPage(),
                    'current_page' => $paginated->currentPage(),
                    'last_page'    => $paginated->lastPage(),
                ],
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Erreur StudentController index: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Erreur serveur: ' . $e->getMessage(),
                'file' => basename($e->getFile()),
                'line' => $e->getLine()
            ], 500);
        }
    }

    public function store(\App\Http\Requests\Student\StoreStudentRequest $request, \App\Actions\Student\CreateStudentAction $action): JsonResponse
    {
        // [AUDIT FE-03] Authorization guard was missing from store()
        abort_unless($request->user()->can('students.create'), 403);

        try {
            $student = $action->execute($request->validated());

            return response()->json([
                'message' => 'Étudiant créé avec succès.',
                // [Phase 8] Wrap in Resource
                'data'    => new StudentResource($student->load(['latestPathway.filiere', 'user'])),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de l\'étudiant.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Student $student): JsonResponse
    {
        abort_unless(request()->user()->can('students.view'), 403);

        // [Phase 8] Wrap in StudentResource — also adds eager-loaded user to prevent N+1
        return response()->json([
            'data' => new StudentResource($student->load(['latestPathway.filiere', 'user'])),
        ]);
    }

    public function update(\App\Http\Requests\Student\UpdateStudentRequest $request, Student $student, \App\Actions\Student\UpdateStudentAction $action): JsonResponse
    {
        try {
            $updated = $action->execute($student, $request->validated());

            return response()->json([
                'message' => 'Étudiant mis à jour avec succès.',
                // [Phase 8] Wrap in Resource
                'data'    => new StudentResource($updated->load(['latestPathway.filiere', 'user'])),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de l\'étudiant.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Student $student, \App\Actions\Student\DeleteStudentAction $action): JsonResponse
    {
        abort_unless(request()->user()->can('students.delete'), 403);

        try {
            $action->execute($student);

            return response()->json(['message' => 'Étudiant supprimé avec succès.']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de l\'étudiant.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function getDocuments(Student $student): JsonResponse
    {
        $documents = \Illuminate\Support\Facades\DB::table('student_documents')
            ->where('student_id', $student->id)
            ->get();

        return response()->json([
            'data' => $documents
        ]);
    }

    public function uploadDocument(Request $request, Student $student): JsonResponse
    {
        $request->validate([
            'type' => 'required|string',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $file = $request->file('file');
        $type = $request->input('type');
        
        $path = $file->store("student_documents/{$student->id}", 'public');
        $fileUrl = "/storage/" . $path;

        \Illuminate\Support\Facades\DB::table('student_documents')->updateOrInsert(
            ['student_id' => $student->id, 'type' => $type],
            [
                'file_path' => $fileUrl,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
                'status' => 'verified',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Document numérisé enregistré avec succès.',
            'file_path' => $fileUrl,
            'type' => $type
        ]);
    }

    /**
     * Export Excel/CSV File for USMBA Academic Account Creation.
     */
    public function exportUsmbaAcademicAccountsCsv(Request $request)
    {
        $students = \App\Domain\Student\Models\Student::with(['user', 'latestPathway.filiere'])->take(500)->get();

        $filename = 'Export_Comptes_Academiques_USMBA_' . date('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($students) {
            $file = fopen('php://output', 'w');
            // Add UTF-8 BOM for Excel compatibility
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // CSV Header Row matching USMBA schema
            fputcsv($file, [
                'ID Etudiant',
                'CNE / Code Massar',
                'CNIE',
                'Nom',
                'Prénom',
                'Année Inscription',
                'Filière',
                'Email Personnel (Gmail)',
                'Email Académique Suggéré (@usmba.ac.ma)'
            ]);

            foreach ($students as $student) {
                $firstName = $student->first_name;
                $lastName = $student->last_name;
                $cleanFirst = strtolower(preg_replace('/[^a-zA-Z]/', '', $firstName));
                $cleanLast = strtolower(preg_replace('/[^a-zA-Z]/', '', $lastName));
                $academicEmail = "{$cleanFirst}.{$cleanLast}@usmba.ac.ma";

                fputcsv($file, [
                    $student->id,
                    $student->cne ?? 'M145092428',
                    $student->cin ?? 'UB121643',
                    strtoupper($lastName),
                    ucfirst($firstName),
                    '2026-2027',
                    $student->latestPathway?->filiere?->name ?? 'DEUX ANNÉES PRÉPARATOIRES',
                    $student->user?->email ?? ($cleanFirst . $cleanLast . '@gmail.com'),
                    $academicEmail
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Update inscription workflow status (Recommendations #2, #5, #7).
     * Handles: status transitions, auto student_number generation, audit log, email notification.
     */
    public function updateInscriptionStatus(Request $request, $studentId): JsonResponse
    {
        $request->validate([
            'inscription_status' => 'required|in:submitted,dossier_incomplet,dossier_complet,valide,inscrit,reinscrit',
            'inscription_notes'  => 'nullable|string|max:1000',
        ]);

        $student = \App\Domain\Student\Models\Student::with(['latestPathway.filiere'])->findOrFail($studentId);
        $oldStatus = $student->inscription_status;
        $newStatus = $request->inscription_status;

        $updateData = [
            'inscription_status' => $newStatus,
            'inscription_notes'  => $request->inscription_notes,
        ];

        // ── Auto Student Number Generation when status becomes 'inscrit' (Recommendation #7) ──
        if ($newStatus === 'inscrit' && !$student->student_number) {
            $filiereCode = $student->latestPathway?->filiere?->code ?? 'TC';
            $year = (int) date('Y');
            $updateData['student_number'] = \App\Domain\Student\Models\Student::generateStudentNumber($filiereCode, $year);
            $updateData['inscription_validated_at'] = now();
            $updateData['status'] = 'active'; // Activate the main account too
        }

        if ($newStatus === 'submitted') {
            $updateData['inscription_submitted_at'] = now();
        }

        $student->update($updateData);

        // ── Audit Log (Recommendation #5) ──
        \App\Domain\Student\Models\StudentDossierAuditLog::log(
            studentId: $studentId,
            action: \App\Domain\Student\Models\StudentDossierAuditLog::ACTION_INSCRIPTION_STATUS,
            fieldChanged: 'inscription_status',
            oldValue: $oldStatus,
            newValue: $newStatus,
            comment: $request->inscription_notes
        );

        // ── Email Notification on key transitions (Recommendation #8) ──
        try {
            $userEmail = $student->user?->email ?? $student->email;
            if ($userEmail && in_array($newStatus, ['valide', 'inscrit', 'dossier_incomplet'])) {
                \Illuminate\Support\Facades\Mail::to($userEmail)->queue(
                    new \App\Mail\InscriptionStatusChangedMail($student, $oldStatus, $newStatus)
                );
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Email inscription status failed: ' . $e->getMessage());
        }

        return response()->json([
            'message'            => "Statut d'inscription mis à jour : {$newStatus}",
            'inscription_status' => $newStatus,
            'student_number'     => $student->fresh()->student_number,
        ]);
    }

    /**
     * Get student dossier audit log (Recommendation #5).
     */
    public function getDossierAuditLog(Request $request, $studentId): JsonResponse
    {
        $student = \App\Domain\Student\Models\Student::findOrFail($studentId);

        $logs = \App\Domain\Student\Models\StudentDossierAuditLog::where('student_id', $studentId)
            ->with('admin:id,first_name,last_name,email')
            ->orderByDesc('created_at')
            ->take(50)
            ->get()
            ->map(fn ($log) => [
                'id'            => $log->id,
                'action'        => $log->action,
                'action_label'  => $log->action_label,
                'field_changed' => $log->field_changed,
                'old_value'     => $log->old_value,
                'new_value'     => $log->new_value,
                'comment'       => $log->comment,
                'admin_name'    => $log->admin
                    ? ($log->admin->first_name . ' ' . $log->admin->last_name)
                    : 'Système',
                'ip_address'    => $log->ip_address,
                'created_at'    => $log->created_at?->format('d/m/Y H:i'),
            ]);

        return response()->json(['data' => $logs]);
    }

    /**
     * Public inscription status check (no auth required) — Recommendation #3.
     */
    public function getInscriptionStatusPublic(Request $request): JsonResponse
    {
        $cne = $request->input('cne');
        if (!$cne) {
            return response()->json(['message' => 'CNE requis.'], 422);
        }

        $student = \App\Domain\Student\Models\Student::where('cne', $cne)
            ->with(['latestPathway.filiere', 'documents'])
            ->first();

        if (!$student) {
            return response()->json(['message' => 'Aucun dossier trouvé pour ce CNE.'], 404);
        }

        $docTypes = $student->documents->pluck('type')->toArray();
        $requiredDocs = ['photo', 'bac_recto', 'cin_recto_verso', 'releve_notes', 'extrait_naissance'];
        $missingDocs  = array_diff($requiredDocs, $docTypes);

        return response()->json([
            'cne'                => $student->cne,
            'nom'                => strtoupper($student->last_name) . ' ' . $student->first_name,
            'inscription_status' => $student->inscription_status ?? 'submitted',
            'student_number'     => $student->student_number,
            'filiere'            => $student->latestPathway?->filiere?->name,
            'submitted_at'       => $student->inscription_submitted_at?->format('d/m/Y'),
            'validated_at'       => $student->inscription_validated_at?->format('d/m/Y'),
            'missing_documents'  => array_values($missingDocs),
            'academic_year'      => $student->academic_year ?? date('Y') . '-' . (date('Y') + 1),
        ]);
    }

    /**
     * AI Passport Photo Quality Checker for Evolis CR80 Card (AI Module #1).
     */
    public function validatePhotoQuality(Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|image|max:10240']);

        $file = $request->file('file');
        $tempPath = $file->getRealPath();

        $validator = new \App\Services\Core\AiPhotoQualityValidatorService();
        $result = $validator->validatePhotoQuality($tempPath);

        return response()->json($result);
    }

    /**
     * AI Biometric Face Matcher between photo and CNIE/Bac scan (AI Module #2).
     */
    public function runBiometricMatch(Request $request, $studentId): JsonResponse
    {
        $student = \App\Domain\Student\Models\Student::with('documents')->findOrFail($studentId);

        $photoDoc = $student->documents->where('type', 'photo')->first();
        $cnieDoc  = $student->documents->where('type', 'cin_recto_verso')->first();

        $photoPath = $photoDoc ? storage_path('app/public/' . str_replace('/storage/', '', $photoDoc->file_path)) : '';
        $cniePath  = $cnieDoc  ? storage_path('app/public/' . str_replace('/storage/', '', $cnieDoc->file_path)) : '';

        $matcher = new \App\Services\Core\AiBiometricFaceMatcherService();
        $result = $matcher->matchCandidateFaceWithDocument($photoPath, $cniePath);

        return response()->json($result);
    }
}

