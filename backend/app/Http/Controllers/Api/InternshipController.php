<?php

namespace App\Http\Controllers\Api;

use App\Actions\Internship\UpdateInternshipAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Internship\UpdateInternshipRequest;
use App\Http\Resources\InternshipResource;
use App\Models\Internship;
use App\Services\Academic\CareerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InternshipController extends Controller
{
    public function __construct(
        private CareerService $careerService
    ) {}

    /**
     * Liste des stages.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Internship::class);

        $user = $request->user();
        $internships = $user->hasRole('student') ? Internship::where('student_id', $user->student?->id ?? -1)->with('student.user', 'supervisor.user')->get()
            : \App\Support\InternshipAccess::query($user)->with('student.user', 'supervisor.user')->get();

        return response()->json([
            'success' => true,
            'data' => InternshipResource::collection($internships),
        ]);
    }

    public function show(Internship $internship): JsonResponse
    {
        $this->authorize('view', $internship);
        return response()->json(['success' => true, 'data' => new InternshipResource($internship->load('student.user', 'supervisor.user'))]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless(\App\Support\InternshipAccess::staff($request->user()), 403);
        $data = $request->validate(['student_id' => 'required|integer', 'type' => 'required|in:initiation,application,fin_etudes', 'company_name' => 'required|string|max:255',
            'company_mentor_name' => 'required|string|max:255', 'supervisor_email' => 'required|email|max:255', 'position_title' => 'required|string|max:255', 'start_date' => 'required|date', 'end_date' => 'required|date|after:start_date']);
        $student = \App\Models\Student::where('institution_id', $request->user()->institution_id)->findOrFail($data['student_id']); unset($data['student_id']);
        $stage = app(\App\Actions\Internship\ManageConventionAction::class)->create($student, $data);
        return response()->json(['success' => true, 'data' => new InternshipResource($stage)], 201);
    }

    /**
     * Mettre à jour un stage.
     */
    public function update(
        UpdateInternshipRequest $request,
        Internship $internship,
        UpdateInternshipAction $action
    ): JsonResponse {
        $this->authorize('update', $internship);

        try {
            $updated = $action->execute($internship, $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Stage mis à jour avec succès.',
                'data' => new InternshipResource($updated->load(['student.user', 'supervisor.user'])),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            Log::error('Erreur mise à jour stage: '.$e->getMessage(), ['exception' => $e]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du stage.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
