<?php

namespace App\Http\Controllers\Api\Professor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Internship\EvaluateInternshipRequest;
use App\Models\Internship;
use App\Services\Academic\SoutenanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfessorInternshipController extends Controller
{
    public function __construct(
        private SoutenanceService $soutenanceService
    ) {}

    /**
     * Stages supervisés par le professeur.
     */
    public function supervised(Request $request): JsonResponse
    {
        $internships = \App\Support\InternshipAccess::query($request->user())->with(['student.user', 'soutenance'])->orderByDesc('id')->get();

        return response()->json([
            'success' => true,
            'internships' => $internships,
        ]);
    }

    /**
     * Évaluer une soutenance.
     */
    public function evaluate(int $soutenanceId, EvaluateInternshipRequest $request): JsonResponse
    {
        \App\Support\InternshipAccess::defense($request->user(), \App\Models\Soutenance::with('internship.student')->findOrFail($soutenanceId));
        $soutenance = $this->soutenanceService->evaluate(
            $soutenanceId,
            $request->validated('grade'),
            $request->validated('remarks')
        );

        return response()->json([
            'success' => true,
            'message' => 'Soutenance évaluée avec succès.',
            'soutenance' => $soutenance,
        ]);
    }

    /**
     * Mettre à jour le statut du stage / projet PFE depuis le Kanban.
     */
    public function updateStatus(Request $request): JsonResponse
    {
        $target = Internship::with('student')->findOrFail($request->integer('internship_id'));
        \App\Support\InternshipAccess::stage($request->user(), $target);
        $validated = $request->validate([
            'internship_id' => 'required|integer|exists:internships,id',
            'status' => 'required|string|in:pending,validated,active,completed,cancelled',
        ]);

        $internship = \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $request) {
            $stage = Internship::whereKey($validated['internship_id'])->lockForUpdate()->firstOrFail();
            \App\Support\InternshipAccess::stage($request->user(), $stage);
            $transitions = ['pending' => ['validated', 'cancelled'], 'validated' => ['active', 'cancelled'], 'active' => ['completed', 'cancelled'], 'completed' => [], 'cancelled' => []];
            abort_unless($stage->status->value === $validated['status'] || in_array($validated['status'], $transitions[$stage->status->value] ?? [], true), 422, 'Transition de stage interdite.');
            abort_if($validated['status'] === 'completed' && ! $stage->soutenance()->where('status', 'completed')->exists(), 422, 'Une soutenance validée est requise.');
            $stage->update(['status' => $validated['status']]);
            activity()->causedBy($request->user())->performedOn($stage)->log('internship_status_changed');
            return $stage;
        });

        return response()->json([
            'success' => true,
            'message' => 'Statut du projet mis à jour avec succès.',
            'internship' => $internship,
        ]);
    }
}
