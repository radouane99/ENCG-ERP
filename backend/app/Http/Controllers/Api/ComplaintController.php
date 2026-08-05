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
    public function index(): JsonResponse
    {
        $complaints = Complaint::with(['student.user', 'handler'])->get();

        return response()->json(['success' => true, 'data' => $complaints]);
    }

    /**
     * Créer une réclamation.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'type'       => 'required|string',
            'subject'    => 'required|string|max:255',
            'message'    => 'required|string',
        ]);

        $complaint = Complaint::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Réclamation envoyée.',
            'data'    => $complaint,
        ]);
    }

    /**
     * Afficher une réclamation.
     */
    public function show(int $id): JsonResponse
    {
        $complaint = Complaint::with(['student.user', 'handler'])->findOrFail($id);

        return response()->json(['success' => true, 'data' => $complaint]);
    }

    /**
     * Traiter une réclamation.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $complaint = Complaint::findOrFail($id);

        $validated = $request->validate([
            'status'         => 'string|in:pending,investigating,resolved,closed',
            'admin_response' => 'nullable|string',
        ]);

        $validated['handled_by'] = auth()->id();
        $complaint->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Réclamation traitée.',
            'data'    => $complaint,
        ]);
    }

    /**
     * Réclamation de note par un étudiant.
     */
    public function submitGradeAppeal(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id'    => 'required|exists:students,id',
            'assessment_id' => 'required|exists:assessments,id',
            'grade_id'      => 'nullable|exists:grades,id',
            'reason'        => 'required|string|max:1000',
        ]);

        $existingGrade = Grade::where('student_id', $validated['student_id'])
            ->where('assessment_id', $validated['assessment_id'])
            ->first();

        $appeal = GradeAppeal::create([
            'student_id'    => $validated['student_id'],
            'assessment_id' => $validated['assessment_id'],
            'grade_id'      => $existingGrade?->id,
            'reason'        => $validated['reason'],
            'status'        => 'pending',
            'old_grade'     => $existingGrade?->value ?? 0.00,
        ]);

        return response()->json([
            'success'   => true,
            'message'   => 'Réclamation de note transmise au professeur.',
            'appeal_id' => $appeal->id,
        ], 201);
    }

    /**
     * Liste des réclamations de notes.
     */
    public function listGradeAppeals(Request $request): JsonResponse
    {
        $query = GradeAppeal::with(['student.user', 'assessment.module']);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $appeals = $query->latest()->get()->map(fn($a) => [
            'id'              => $a->id,
            'student_name'    => $a->student->user->name ?? 'N/A',
            'cne'             => $a->student->cne ?? 'N/A',
            'module_name'     => $a->assessment->module->name ?? 'N/A',
            'assessment_type' => $a->assessment->type ?? 'N/A',
            'reason'          => $a->reason,
            'old_grade'       => $a->old_grade,
            'new_grade'       => $a->new_grade,
            'status'          => $a->status,
            'professor_notes' => $a->professor_notes,
            'created_at'      => $a->created_at?->format('d/m/Y'),
        ]);

        return response()->json(['success' => true, 'data' => $appeals]);
    }

    /**
     * Résoudre une réclamation de note.
     */
    public function resolveGradeAppeal(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status'          => 'required|string|in:approved,rejected,under_review',
            'new_grade'       => 'required_if:status,approved|nullable|numeric|min:0|max:20',
            'professor_notes' => 'nullable|string',
        ]);

        $appeal = GradeAppeal::findOrFail($id);

        $appeal->update([
            'status'          => $validated['status'],
            'new_grade'       => $validated['status'] === 'approved' ? $validated['new_grade'] : null,
            'professor_notes' => $validated['professor_notes'] ?? null,
            'resolved_at'     => now(),
        ]);

        // Mettre à jour la note officielle si approuvé
        if ($validated['status'] === 'approved') {
            Grade::updateOrCreate(
                [
                    'student_id'    => $appeal->student_id,
                    'assessment_id' => $appeal->assessment_id,
                ],
                [
                    'value'  => $validated['new_grade'],
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