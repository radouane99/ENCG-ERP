<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\Grade;
use App\Models\GradeAppeal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    /**
     * Liste des réclamations.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Complaint::class);

        $query = Complaint::with(['student.user', 'handler'])->latest();
        $user = $request->user();

        if ($user->hasRole('student')) {
            abort_unless($user->student, 403, 'Profil étudiant introuvable.');
            $query->where('student_id', $user->student->id);
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $paginated = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $paginated->items(),
            'meta' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    /**
     * Créer une réclamation.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Complaint::class);

        $validated = $request->validate([
            'student_id' => 'sometimes|exists:students,id',
            'type' => 'required|string|in:grade,schedule,administrative,other,support',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        $user = $request->user();
        if ($user->hasRole('student')) {
            abort_unless($user->student, 403, 'Profil étudiant introuvable.');
            $validated['student_id'] = $user->student->id;
        } else {
            abort_unless(! empty($validated['student_id']), 422, 'student_id est requis.');
        }

        $complaint = Complaint::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Réclamation envoyée.',
            'data' => $complaint,
        ], 201);
    }

    /**
     * Afficher une réclamation.
     */
    public function show(int $id): JsonResponse
    {
        $complaint = Complaint::with(['student.user', 'handler'])->findOrFail($id);
        $this->authorize('view', $complaint);

        return response()->json(['success' => true, 'data' => $complaint]);
    }

    /**
     * Traiter une réclamation.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $complaint = Complaint::findOrFail($id);
        $this->authorize('update', $complaint);

        $validated = $request->validate([
            'status' => 'string|in:pending,investigating,resolved,closed',
            'admin_response' => 'nullable|string',
        ]);

        $validated['handled_by'] = auth()->id();
        $complaint->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Réclamation traitée.',
            'data' => $complaint,
        ]);
    }

    /**
     * Réclamation de note par un étudiant.
     */
    public function submitGradeAppeal(Request $request): JsonResponse
    {
        $this->authorize('create', Complaint::class);

        $validated = $request->validate([
            'student_id' => 'sometimes|exists:students,id',
            'assessment_id' => 'required|exists:assessments,id',
            'grade_id' => 'nullable|exists:grades,id',
            'reason' => 'required|string|max:1000',
        ]);

        $user = $request->user();
        if ($user->hasRole('student')) {
            abort_unless($user->student, 403, 'Profil étudiant introuvable.');
            $validated['student_id'] = $user->student->id;
        } else {
            abort_unless(! empty($validated['student_id']), 422, 'student_id est requis.');
        }

        $existingGrade = Grade::where('student_id', $validated['student_id'])
            ->where('assessment_id', $validated['assessment_id'])
            ->first();

        $appeal = GradeAppeal::create([
            'student_id' => $validated['student_id'],
            'assessment_id' => $validated['assessment_id'],
            'grade_id' => $existingGrade?->id,
            'reason' => $validated['reason'],
            'status' => 'pending',
            'old_grade' => $existingGrade?->value ?? 0.00,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Réclamation de note transmise au professeur.',
            'appeal_id' => $appeal->id,
        ], 201);
    }

    /**
     * Liste des réclamations de notes.
     */
    public function listGradeAppeals(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Complaint::class);

        $query = GradeAppeal::with(['student.user', 'assessment.module']);

        $user = $request->user();
        if ($user->hasRole('student')) {
            abort_unless($user->student, 403, 'Profil étudiant introuvable.');
            $query->where('student_id', $user->student->id);
        } elseif ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $appeals = $query->latest()->get()->map(fn ($a) => [
            'id' => $a->id,
            'student_name' => $a->student->user->name ?? 'N/A',
            'cne' => $a->student->cne ?? 'N/A',
            'module_name' => $a->assessment->module->name ?? 'N/A',
            'assessment_type' => $a->assessment->type ?? 'N/A',
            'reason' => $a->reason,
            'old_grade' => $a->old_grade,
            'new_grade' => $a->new_grade,
            'status' => $a->status,
            'professor_notes' => $a->professor_notes,
            'created_at' => $a->created_at?->format('d/m/Y'),
        ]);

        return response()->json(['success' => true, 'data' => $appeals]);
    }

    /**
     * Résoudre une réclamation de note.
     */
    public function resolveGradeAppeal(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:approved,rejected,under_review',
            'new_grade' => 'required_if:status,approved|nullable|numeric|min:0|max:20',
            'professor_notes' => 'nullable|string',
        ]);

        $appeal = GradeAppeal::findOrFail($id);

        $appeal->update([
            'status' => $validated['status'],
            'new_grade' => $validated['status'] === 'approved' ? $validated['new_grade'] : null,
            'professor_notes' => $validated['professor_notes'] ?? null,
            'resolved_at' => now(),
        ]);

        // Mettre à jour la note officielle si approuvé
        if ($validated['status'] === 'approved') {
            Grade::updateOrCreate(
                [
                    'student_id' => $appeal->student_id,
                    'assessment_id' => $appeal->assessment_id,
                ],
                [
                    'value' => $validated['new_grade'],
                    'absent' => false,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => $validated['status'] === 'approved'
                ? 'Réclamation approuvée et note révisée.'
                : 'Réclamation clôturée.',
        ]);
    }
}
