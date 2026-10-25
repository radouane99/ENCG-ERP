<?php

namespace App\Http\Controllers\Api\Professor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Internship\EvaluateInternshipRequest;
use App\Models\Internship;
use App\Models\Soutenance;
use App\Services\Academic\SoutenanceService;
use App\Support\InternshipAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
        $internships = InternshipAccess::query($request->user())->with(['student.user', 'soutenance.room', 'internshipDocuments'])->orderByDesc('id')->get();
        foreach ($internships as $stage) {
            $profile = $request->user()->professor?->id;
            $stage->setAttribute('can_review_documents', InternshipAccess::staff($request->user()) || ($profile && (int) $stage->supervisor_id === (int) $profile));
            $jury = $stage->soutenance;
            $stage->setAttribute('can_evaluate', $jury && $jury->status === 'scheduled' && $jury->date_time?->isPast() && (InternshipAccess::staff($request->user()) || ($profile && in_array((int) $profile, array_map('intval', [$jury->president_id, $jury->examiner_id, $jury->supervisor_id]), true))));
        }

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
        InternshipAccess::defense($request->user(), Soutenance::with('internship.student')->findOrFail($soutenanceId));
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
        InternshipAccess::stage($request->user(), $target);
        $validated = $request->validate([
            'internship_id' => 'required|integer|exists:internships,id',
            'status' => 'required|string|in:pending,validated,active,completed,cancelled',
        ]);

        $internship = DB::transaction(function () use ($validated, $request) {
            $stage = Internship::whereKey($validated['internship_id'])->lockForUpdate()->firstOrFail();
            InternshipAccess::stage($request->user(), $stage);
            $transitions = ['pending' => ['validated', 'cancelled'], 'validated' => ['active', 'cancelled'], 'active' => ['completed', 'cancelled'], 'completed' => [], 'cancelled' => []];
            abort_unless($stage->status->value === $validated['status'] || in_array($validated['status'], $transitions[$stage->status->value] ?? [], true), 422, 'Transition de stage interdite.');
            abort_if($validated['status'] === 'completed' && ! $stage->soutenance()->where('status', 'completed')->exists(), 422, 'Une soutenance validée est requise.');
            abort_if($validated['status'] === 'validated' && (! $stage->insurance_verified || ! $stage->school_signed_by), 422, 'Assurance et visa administratif requis.');
            abort_if($validated['status'] === 'active' && $stage->convention_status !== 'active', 422, 'Acceptation de l’entreprise requise.');
            if ($validated['status'] === 'cancelled') {
                $stage->fill(['convention_status' => 'cancelled', 'company_token_hash' => null]);
            }
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
