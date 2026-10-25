<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Academic\GradeAppealController;
use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Complaint;
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
        $a = Assessment::findOrFail($request->integer('assessment_id'));
        $request->merge(['module_id' => $a->module_id, 'reason_category' => $request->input('reason_category', 'autre'), 'student_justification' => $request->input('student_justification', $request->input('reason'))]);

        return app(GradeAppealController::class)->studentStore($request);
    }

    public function listGradeAppeals(Request $request): JsonResponse
    {
        $controller = app(GradeAppealController::class);

        return $request->user()->hasRole('student') ? $controller->studentIndex($request) : $controller->index($request);
    }

    /**
     * Résoudre une réclamation de note.
     */
    public function resolveGradeAppeal(Request $request, int $id): JsonResponse
    {
        $decision = ['approved' => 'rectified', 'rejected' => 'rejected'][$request->input('status')] ?? $request->input('status');
        $request->merge(['decision' => $decision, 'rectified_grade' => $request->input('new_grade'), 'professor_comment' => $request->input('professor_notes')]);

        return app(GradeAppealController::class)->resolve($request, $id);
    }
}
